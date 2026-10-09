import type { AuthRepository } from '@/core/repositories/auth.repository'
import { apiFetch } from './client'

export const authApi: AuthRepository = {
  async register(username, email, password) {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
    return res.json()
  },
  async login(email, password) {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return res.json()
  },
}
