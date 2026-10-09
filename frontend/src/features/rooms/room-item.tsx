import type { Room } from '@/core/entities'
import styles from './room-item.module.css'

interface Props {
  room: Room
  active: boolean
  onClick(): void
}

export function RoomItem({ room, active, onClick }: Props) {
  return (
    <li>
      <button
        className={`${styles.item} ${active ? styles.active : ''}`}
        onClick={onClick}
      >
        <span className={styles.hash}>#</span>
        <span className={styles.name}>{room.is_dm ? 'dm' : room.name}</span>
      </button>
    </li>
  )
}
