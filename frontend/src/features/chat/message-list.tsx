import { useRef, useEffect } from 'react'
import type { Message } from '@/core/entities'
import { useChatStore } from '@/store/chat.store'
import { MessageBubble } from './message-bubble'
import styles from './message-list.module.css'

interface Props {
  roomId: string
  messages: Message[]
  loading: boolean
}

export function MessageList({ roomId, messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const { loadMore, hasMore } = useChatStore()

  // auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleLoadMore() {
    const list = listRef.current
    const prevHeight = list?.scrollHeight ?? 0
    await loadMore(roomId)
    // restore scroll position after prepend
    if (list) {
      list.scrollTop = list.scrollHeight - prevHeight
    }
  }

  if (loading && !messages.length) {
    return <div className={styles.hint}>Memuat pesan...</div>
  }

  return (
    <div className={styles.list} ref={listRef}>
      {hasMore[roomId] && (
        <button className={styles.loadMore} onClick={handleLoadMore}>
          Muat lebih banyak
        </button>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
