import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Logo } from '@/icons/logo'
import { useAuthStore } from '@/store/auth.store'
import styles from './auth.module.css'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(username, email, password)
      if (document.startViewTransition) {
        document.startViewTransition(() => { navigate('/rooms') })
      } else {
        navigate('/rooms')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrasi gagal')
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
          {error && <p className={styles.errorMsg}>{error}</p>}
          <Button type="submit" loading={loading} style={{ width: '100%' }}>
            Buat Akun
          </Button>
        </form>
        <p className={styles.footer}>
          Sudah punya akun?{' '}
          <Link to="/login" className={styles.link}>Masuk</Link>
        </p>
      </div>
    </div>
  )
}
