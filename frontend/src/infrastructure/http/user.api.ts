import type { UserRepository } from '@/core/repositories/user.repository'
import { apiFetch } from './client'

export const userApi: UserRepository = {
  async me() {
    const res = await apiFetch('/api/users/me')
    return res.json()
  },
  async search(q) {
    const res = await apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`)
    return res.json()
  },
}
