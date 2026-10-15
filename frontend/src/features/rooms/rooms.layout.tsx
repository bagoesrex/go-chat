import { useEffect, useState } from 'react'
import { useNavigate, useParams, Outlet } from 'react-router-dom'
import { LogOut, ArrowLeft, ChatBubble } from 'iconoir-react'
import { useAuthStore } from '@/store/auth.store'
import { useRoomStore } from '@/store/room.store'
import { Logo } from '@/icons/logo'
import { RoomList } from './room-list'
import styles from './layout.module.css'

export function RoomsLayout() {
  const navigate = useNavigate()
  const { id: activeId } = useParams()
  const { logout, user } = useAuthStore()
  const { fetchRooms } = useRoomStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const showSidebar = !activeId || mobileSidebarOpen

  useEffect(() => { fetchRooms() }, [fetchRooms])

  function handleLogout() {
    logout()
    if (document.startViewTransition) {
      document.startViewTransition(() => navigate('/login'))
    } else {
      navigate('/login')
    }
  }

  function handleSelectRoom(id: string) {
    setMobileSidebarOpen(false)
    // Direct navigate without full-page transition so sidebar, header & input don't blink
    navigate(`/rooms/${id}`)
  }

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${showSidebar ? styles.sidebarVisible : ''}`}>
        <header className={styles.sidebarHeader}>
          <div className={styles.logoGroup}>
            <Logo size={24} />
            <span className={styles.logo}>go-chat</span>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Keluar akun"
            aria-label="Keluar akun"
          >
            <LogOut width={16} height={16} strokeWidth={2.2} />
          </button>
        </header>

        <div className={styles.userBar}>
          <div className={styles.avatar}>
            {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.whoami}>@{user?.username}</span>
            <span className={styles.statusBadge}>
              <span className={styles.statusDot} />
              online
            </span>
          </div>
        </div>

        <RoomList activeId={activeId} onSelect={handleSelectRoom} />
      </aside>

      <main className={`${styles.main} ${!showSidebar ? styles.mainVisible : ''}`}>
        {activeId ? (
          <>
            <button
              className={styles.backBtn}
              onClick={() => setMobileSidebarOpen(true)}
            >
              <ArrowLeft width={16} height={16} strokeWidth={2.2} />
              <span>Daftar Room</span>
            </button>
            <Outlet />
          </>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyCard}>
              <div className={styles.emptyIconBox}>
                <ChatBubble width={32} height={32} strokeWidth={2} />
              </div>
              <h2 className={styles.emptyTitle}>Ruang Obrolan</h2>
              <p className={styles.emptyText}>
                Pilih room di bilah sisi atau mulai percakapan langsung (DM) untuk mengobrol.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
