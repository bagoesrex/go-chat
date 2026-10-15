import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WarningCircle } from 'iconoir-react'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Logo } from '@/icons/logo'
import { useAuthStore } from '@/store/auth.store'
import styles from './auth.module.css'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [lastError, setLastError] = useState('')
  const [loading, setLoading] = useState(false)

  function navigateTo(path: string) {
    if (document.startViewTransition) {
      document.startViewTransition(() => { navigate(path) })
    } else {
      navigate(path)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigateTo('/rooms')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login gagal'
      setError(msg)
      setLastError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Logo size={40} />
          <span className={styles.brandName}>go-chat</span>
        </div>
        <h1 className={styles.title}>Masuk</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div
            className={`${styles.errorWrapper} ${error ? styles.errorVisible : ''}`}
            aria-live="polite"
          >
            <div className={styles.errorInner}>
              <div className={styles.errorMsg} role="alert">
                <WarningCircle width={16} height={16} strokeWidth={2.2} className={styles.errorIcon} />
                <span>{error || lastError}</span>
              </div>
            </div>
          </div>
          <Button type="submit" loading={loading} style={{ width: '100%' }}>
            Masuk
          </Button>
        </form>
        <p className={styles.footer}>
          Belum punya akun?{' '}
          <button
            type="button"
            onClick={() => navigateTo('/register')}
            className={styles.link}
          >
            Daftar
          </button>
        </p>
      </div>
    </div>
  )
}
