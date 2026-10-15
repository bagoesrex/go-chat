import { Hashtag, User as UserIcon } from 'iconoir-react'
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
        aria-selected={active}
      >
        <span className={styles.iconBox}>
          {room.is_dm ? (
            <UserIcon width={13} height={13} strokeWidth={2.2} />
          ) : (
            <Hashtag width={13} height={13} strokeWidth={2.2} />
          )}
        </span>
        <span className={styles.name}>
          {room.is_dm ? `@${room.name}` : `#${room.name}`}
        </span>
        {active && <span className={styles.activePill} />}
      </button>
    </li>
  )
}
