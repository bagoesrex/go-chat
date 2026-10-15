import { Check } from 'iconoir-react'
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
        <span className={styles.sender}>@{message.sender.username}</span>
      )}
      <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleOther}`}>
        <p className={styles.content}>{message.content}</p>
        <div className={styles.metaRow}>
          <span className={styles.time}>{formatTime(message.created_at)}</span>
          {isMine && (
            <span className={styles.checkIcon}>
              <Check width={12} height={12} strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
