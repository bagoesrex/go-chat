import { create } from 'zustand'
import type { Room } from '@/core/entities'
import { roomApi } from '@/infrastructure/http/room.api'
import { createRoomUseCase } from '@/core/usecases/room.usecase'

const useCase = createRoomUseCase(roomApi)

interface RoomState {
  rooms: Room[]
  activeRoomId: string | null
  loading: boolean
  fetchRooms(): Promise<void>
  createRoom(name: string): Promise<Room>
  createDM(targetUserId: string): Promise<Room>
  setActive(id: string): void
}

export const useRoomStore = create<RoomState>((set, _get) => ({
  rooms: [],
  activeRoomId: null,
  loading: false,

  async fetchRooms() {
    set({ loading: true })
    try {
      const rooms = await useCase.list()
      set({ rooms })
    } finally {
      set({ loading: false })
    }
  },

  async createRoom(name) {
    const room = await useCase.create(name)
    set((s) => ({ rooms: [room, ...s.rooms] }))
    return room
  },

  async createDM(targetUserId) {
    const room = await useCase.createDM(targetUserId)
    set((s) => ({
      // avoid duplicate if DM room already exists
      rooms: s.rooms.find((r) => r.id === room.id)
        ? s.rooms
        : [room, ...s.rooms],
    }))
    return room
  },

  setActive(id) {
    set({ activeRoomId: id })
  },
}))

export const activeRoom = () => {
  const { rooms, activeRoomId } = useRoomStore.getState()
  return rooms.find((r) => r.id === activeRoomId) ?? null
}
