import { useEffect, useState } from 'react'
import { useNavigate, useParams, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useRoomStore } from '@/store/room.store'
import { RoomList } from './room-list'
import { UserSearch } from './user-search'
import styles from './layout.module.css'

export function RoomsLayout() {
  const navigate = useNavigate()
  const { id: activeId } = useParams()
  const { logout, user } = useAuthStore()
  const { fetchRooms } = useRoomStore()
  const [showSidebar, setShowSidebar] = useState(!activeId)

  useEffect(() => { fetchRooms() }, [fetchRooms])

  // on md+ sidebar always visible; on mobile show only when no room selected
  useEffect(() => {
    if (!activeId) setShowSidebar(true)
  }, [activeId])

  function handleLogout() {
    logout()
    if (document.startViewTransition) {
      document.startViewTransition(() => navigate('/login'))
    } else {
      navigate('/login')
    }
  }

  function handleSelectRoom(id: string) {
    setShowSidebar(false)
    if (document.startViewTransition) {
      document.startViewTransition(() => navigate(`/rooms/${id}`))
    } else {
      navigate(`/rooms/${id}`)
    }
  }

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${showSidebar ? styles.sidebarVisible : ''}`}>
        <header className={styles.sidebarHeader}>
          <span className={styles.logo}>go-chat</span>
          <button className={styles.iconBtn} onClick={handleLogout} title="Keluar">
            ✕
          </button>
        </header>
        <p className={styles.whoami}>@{user?.username}</p>
        <UserSearch onSelect={handleSelectRoom} />
        <RoomList activeId={activeId} onSelect={handleSelectRoom} />
      </aside>

      <main className={`${styles.main} ${!showSidebar ? styles.mainVisible : ''}`}>
        {activeId ? (
          <>
            <button
              className={styles.backBtn}
              onClick={() => setShowSidebar(true)}
            >
              ← Rooms
            </button>
            <Outlet />
          </>
        ) : (
          <div className={styles.empty}>
            <p>Pilih room untuk mulai chat.</p>
          </div>
        )}
      </main>
    </div>
  )
}
