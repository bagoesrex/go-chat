import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { WarningCircle } from 'iconoir-react'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { useAuthStore } from '@/store/auth.store'
import styles from './auth.module.css'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const [username, setUsername] = useState('')
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
      await register(username, email, password)
      navigate('/rooms')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registrasi gagal'
      setError(msg)
      setLastError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className={styles.title}>Daftar</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          id="username"
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoFocus
        />
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
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
          Buat Akun
        </Button>
      </form>
      <p className={styles.footer}>
        Sudah punya akun?{' '}
        <Link to="/login" className={styles.link}>
          Masuk
        </Link>
      </p>
    </>
  )
}
