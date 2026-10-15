import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Hashtag, User as UserIcon } from 'iconoir-react'
import { useRoomStore } from '@/store/room.store'
import { useChatStore } from '@/store/chat.store'
import { roomApi } from '@/infrastructure/http/room.api'
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
    useRoomStore.getState().setActive(id)
    useRoomStore.getState().clearUnread(id)
    roomApi.markAsRead(id).catch(() => {})

    if (!fetched.current[id]) {
      fetched.current[id] = true
      fetchMessages(id)
    }
    return () => {
      wsLeave(id)
      useRoomStore.getState().setActive(null)
    }
  }, [id, fetchMessages])

  const msgs = id ? (messages[id] ?? []) : []
  const isLoading = id ? (loading[id] ?? false) : false

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.roomIcon}>
            {room?.is_dm ? (
              <UserIcon width={16} height={16} strokeWidth={2.2} />
            ) : (
              <Hashtag width={16} height={16} strokeWidth={2.2} />
            )}
          </div>
          <div className={styles.headerTitles}>
            <span className={styles.roomName}>
              {room ? (room.is_dm ? `@${room.name}` : `#${room.name}`) : 'Memuat room...'}
            </span>
            <span className={styles.roomMeta}>
              {room?.is_dm ? 'Direct Message • Percakapan Pribadi' : 'Public Channel • Realtime Aktif'}
            </span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span className={styles.liveText}>live</span>
          </span>
        </div>
      </header>

      {/* Only this viewport animates on room change (scoped to chat messages) */}
      <div key={id} className={styles.viewport}>
        {id && <MessageList roomId={id} messages={msgs} loading={isLoading} />}
      </div>

      {id && <MessageInput roomId={id} />}
    </div>
  )
}
