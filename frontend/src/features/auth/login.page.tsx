import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { WarningCircle } from 'iconoir-react'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/rooms')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login gagal'
      setError(msg)
      setLastError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
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
        <Link to="/register" className={styles.link}>
          Daftar
        </Link>
      </p>
    </>
  )
}
