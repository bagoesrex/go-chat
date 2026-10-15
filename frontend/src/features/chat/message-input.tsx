import { useState, useRef } from 'react'
import { Send } from 'iconoir-react'
import { wsSendMessage } from '@/infrastructure/ws/socket'
import styles from './message-input.module.css'

interface Props {
  roomId: string
}

export function MessageInput({ roomId }: Props) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    wsSendMessage(roomId, trimmed)
    setText('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const canSend = text.trim().length > 0

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tulis pesan... (Enter untuk kirim)"
        autoComplete="off"
      />
      <button
        type="submit"
        className={styles.sendBtn}
        disabled={!canSend}
        aria-label="Kirim pesan"
      >
        <Send width={16} height={16} strokeWidth={2.2} />
        <span className={styles.sendText}>Kirim</span>
      </button>
    </form>
  )
}
