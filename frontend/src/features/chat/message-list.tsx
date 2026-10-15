import { useRef, useEffect } from 'react'
import { ChatBubble, ArrowDown } from 'iconoir-react'
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleLoadMore() {
    const list = listRef.current
    const prevHeight = list?.scrollHeight ?? 0
    await loadMore(roomId)
    if (list) {
      list.scrollTop = list.scrollHeight - prevHeight
    }
  }

  if (loading && !messages.length) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loaderBox}>
          <span className={styles.loaderSquare} />
          <span className={styles.loadingText}>Memuat riwayat percakapan...</span>
        </div>
      </div>
    )
  }

  if (!loading && !messages.length) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIconBox}>
          <ChatBubble width={28} height={28} strokeWidth={2} />
        </div>
        <p className={styles.emptyTitle}>Belum ada pesan</p>
        <p className={styles.emptySubtitle}>Jadilah orang pertama yang mengirim pesan di sini!</p>
      </div>
    )
  }

  return (
    <div className={styles.list} ref={listRef}>
      {hasMore[roomId] && (
        <button className={styles.loadMore} onClick={handleLoadMore}>
          <ArrowDown width={13} height={13} strokeWidth={2.2} />
          <span>Muat riwayat sebelumnya</span>
        </button>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
