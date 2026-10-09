import type { RoomRepository } from '@/core/repositories/room.repository'
import { apiFetch } from './client'

export const roomApi: RoomRepository = {
  async list() {
    const res = await apiFetch('/api/rooms')
    return res.json()
  },
  async create(name) {
    const res = await apiFetch('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
    return res.json()
  },
  async getMessages(roomId, before, limit = 50) {
    const params = new URLSearchParams({ limit: String(limit) })
    if (before) params.set('before', before)
    const res = await apiFetch(`/api/rooms/${roomId}/messages?${params}`)
    return res.json()
  },
}
