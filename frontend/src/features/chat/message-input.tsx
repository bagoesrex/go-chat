import { useState, useRef } from 'react'
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

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ketik pesan..."
        autoComplete="off"
      />
      <button type="submit" className={styles.sendBtn} disabled={!text.trim()}>
        Kirim
      </button>
    </form>
  )
}
