import { useState } from 'react'
import { useRoomStore } from '@/store/room.store'
import { RoomItem } from './room-item'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import styles from './room-list.module.css'

interface Props {
  activeId?: string
  onSelect(id: string): void
}

export function RoomList({ activeId, onSelect }: Props) {
  const { rooms, loading, createRoom } = useRoomStore()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      const room = await createRoom(name.trim())
      setName('')
      setCreating(false)
      onSelect(room.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <span className={styles.heading}>Rooms</span>
        <Button variant="ghost" onClick={() => setCreating((v) => !v)}>
          {creating ? '✕' : '+'}
        </Button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className={styles.createForm}>
          <Input
            placeholder="Nama room..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Button type="submit" loading={busy}>Buat</Button>
        </form>
      )}

      {loading && !rooms.length && (
        <p className={styles.hint}>Memuat...</p>
      )}

      {!loading && !rooms.length && (
        <p className={styles.hint}>Belum ada room.</p>
      )}

      <ul className={styles.list}>
        {rooms.map((room) => (
          <RoomItem
            key={room.id}
            room={room}
            active={room.id === activeId}
            onClick={() => onSelect(room.id)}
          />
        ))}
      </ul>
    </div>
  )
}
