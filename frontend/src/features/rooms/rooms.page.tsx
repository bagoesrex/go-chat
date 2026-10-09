import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/button'
import styles from './rooms.module.css'

export function RoomsPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    if (document.startViewTransition) {
      document.startViewTransition(() => { navigate('/login') })
    } else {
      navigate('/login')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>go-chat</span>
        <span className={styles.username}>@{user?.username}</span>
        <Button variant="ghost" onClick={handleLogout}>Keluar</Button>
      </header>
      <main className={styles.empty}>
        <p>Rooms coming in Sprint 2.</p>
      </main>
    </div>
  )
}
