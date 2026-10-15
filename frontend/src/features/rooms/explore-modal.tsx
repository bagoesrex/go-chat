import { useState, useEffect } from 'react'
import { Compass, Search, Xmark, Group, Check } from 'iconoir-react'
import type { ExploreRoom } from '@/core/entities'
import { useRoomStore } from '@/store/room.store'
import styles from './explore-modal.module.css'

interface Props {
  isOpen: boolean
  onClose(): void
  onSelect(roomId: string): void
}

export function ExploreModal({ isOpen, onClose, onSelect }: Props) {
  const { exploreRooms, joinRoom } = useRoomStore()
  const [rooms, setRooms] = useState<ExploreRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [joiningId, setJoiningId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    exploreRooms()
      .then((data) => {
        if (!cancelled) setRooms(data ?? [])
      })
      .catch(() => {
        if (!cancelled) setRooms([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, exploreRooms])

  if (!isOpen) return null

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(query.trim().toLowerCase())
  )

  async function handleJoin(room: ExploreRoom) {
    if (room.is_joined) {
      onClose()
      onSelect(room.id)
      return
    }
    setJoiningId(room.id)
    try {
      await joinRoom(room.id)
      onClose()
      onSelect(room.id)
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <Compass width={18} height={18} strokeWidth={2.2} />
            <span>JELAJAHI PUBLIC ROOMS</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
            <Xmark width={16} height={16} strokeWidth={2.2} />
          </button>
        </header>

        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>
            <Search width={16} height={16} strokeWidth={2.2} />
          </span>
          <input
            className={styles.searchInput}
            placeholder="Cari channel yang menarik..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {loading ? (
          <div className={styles.loadingBox}>
            <span className={styles.spinner} />
            <span>Memuat channel publik...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {query ? `Tidak ada channel bernama "${query}".` : 'Belum ada channel publik tersedia.'}
          </div>
        ) : (
          <ul className={styles.body}>
            {filtered.map((room) => (
              <li key={room.id} className={styles.roomRow}>
                <div className={styles.roomInfo}>
                  <span className={styles.roomName}>#{room.name}</span>
                  <span className={styles.roomMeta}>
                    <span className={styles.metaIcon}>
                      <Group width={12} height={12} strokeWidth={2} />
                    </span>
                    <span>{room.member_count} {room.member_count === 1 ? 'member' : 'members'}</span>
                  </span>
                </div>
                {room.is_joined ? (
                  <button
                    className={styles.joinedBadge}
                    onClick={() => handleJoin(room)}
                    title="Buka channel"
                  >
                    <Check width={12} height={12} strokeWidth={2.5} />
                    <span>Sudah Bergabung</span>
                  </button>
                ) : (
                  <button
                    className={styles.joinBtn}
                    onClick={() => handleJoin(room)}
                    disabled={joiningId === room.id}
                  >
                    {joiningId === room.id ? 'Bergabung...' : 'Join'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
