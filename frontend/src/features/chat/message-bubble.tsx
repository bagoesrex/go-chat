import type { Message } from '@/core/entities'
import { useAuthStore } from '@/store/auth.store'
import styles from './message-bubble.module.css'

interface Props {
  message: Message
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message }: Props) {
  const myId = useAuthStore.getState().user?.id
  const isMine = message.sender.id === myId

  return (
    <div className={`${styles.wrapper} ${isMine ? styles.mine : ''}`}>
      {!isMine && (
        <span className={styles.sender}>{message.sender.username}</span>
      )}
      <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : ''}`}>
        <p className={styles.content}>{message.content}</p>
        <span className={styles.time}>{formatTime(message.created_at)}</span>
      </div>
    </div>
  )
}
