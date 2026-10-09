import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useRoomStore } from '@/store/room.store'
import { useChatStore } from '@/store/chat.store'
import { wsJoin, wsLeave } from '@/infrastructure/ws/socket'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import styles from './chat.module.css'

export function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const rooms = useRoomStore((s) => s.rooms)
  const room = rooms.find((r) => r.id === id)
  const { fetchMessages, messages, loading } = useChatStore()
  const fetched = useRef<Record<string, boolean>>({})

  useEffect(() => {
    if (!id) return
    wsJoin(id)
    if (!fetched.current[id]) {
      fetched.current[id] = true
      fetchMessages(id)
    }
    return () => { wsLeave(id) }
  }, [id, fetchMessages])

  if (!room) return null

  const msgs = messages[id!] ?? []
  const isLoading = loading[id!] ?? false

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.roomName}>
          {room.is_dm ? 'DM' : `#${room.name}`}
        </span>
      </header>
      <MessageList roomId={id!} messages={msgs} loading={isLoading} />
      <MessageInput roomId={id!} />
    </div>
  )
}
