import { Outlet } from 'react-router-dom'
import { Logo } from '@/icons/logo'
import styles from './auth.module.css'

export function AuthLayout() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Logo size={40} />
          <span className={styles.brandName}>go-chat</span>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
