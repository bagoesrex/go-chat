import { useState } from 'react'
import { Plus, Xmark } from 'iconoir-react'
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
        <div className={styles.headingGroup}>
          <span className={styles.heading}>Rooms</span>
          <span className={styles.counter}>{rooms.length}</span>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => setCreating((v) => !v)}
          aria-label={creating ? 'Batal buat room' : 'Buat room baru'}
          title={creating ? 'Batal' : 'Buat room'}
        >
          {creating ? (
            <Xmark width={14} height={14} strokeWidth={2.5} />
          ) : (
            <Plus width={14} height={14} strokeWidth={2.5} />
          )}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className={styles.createForm}>
          <Input
            placeholder="Nama room (cth: random)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              Batal
            </Button>
            <Button type="submit" loading={busy}>
              Buat
            </Button>
          </div>
        </form>
      )}

      {loading && !rooms.length && (
        <div className={styles.hint}>
          <span className={styles.loaderDot} />
          <span>Memuat daftar room...</span>
        </div>
      )}

      {!loading && !rooms.length && (
        <div className={styles.hint}>
          <span>Belum ada room. Buat yang pertama di atas!</span>
        </div>
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
