import { useState, useRef } from 'react'
import type { User } from '@/core/entities'
import { userApi } from '@/infrastructure/http/user.api'
import { useRoomStore } from '@/store/room.store'
import styles from './user-search.module.css'

interface Props {
  onSelect(roomId: string): void
}

export function UserSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { createDM } = useRoomStore()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    clearTimeout(timer.current)
    if (!q.trim()) { setResults([]); return }
    timer.current = setTimeout(async () => {
      try {
        const users = await userApi.search(q.trim())
        setResults(users ?? [])
      } catch { /* silent */ }
    }, 300)
  }

  async function handleStartDM(user: User) {
    setBusy(true)
    try {
      const room = await createDM(user.id)
      setOpen(false)
      setQuery('')
      setResults([])
      onSelect(room.id)
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button className={styles.toggleBtn} onClick={() => setOpen(true)}>
        + DM / Cari user
      </button>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.searchRow}>
        <input
          className={styles.input}
          placeholder="Cari username..."
          value={query}
          onChange={handleChange}
          autoFocus
        />
        <button className={styles.closeBtn} onClick={() => { setOpen(false); setQuery(''); setResults([]) }}>✕</button>
      </div>
      {results.length > 0 && (
        <ul className={styles.list}>
          {results.map((u) => (
            <li key={u.id}>
              <button
                className={styles.userItem}
                onClick={() => handleStartDM(u)}
                disabled={busy}
              >
                @{u.username}
              </button>
            </li>
          ))}
        </ul>
      )}
      {query && results.length === 0 && (
        <p className={styles.empty}>Tidak ditemukan.</p>
      )}
    </div>
  )
}
