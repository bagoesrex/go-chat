import { create } from 'zustand'
import type { Room, ExploreRoom } from '@/core/entities'
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
  joinRoom(roomId: string): Promise<Room>
  exploreRooms(): Promise<ExploreRoom[]>
  upsertRoom(room: Room): void
  incrementUnread(roomId: string): void
  clearUnread(roomId: string): void
  setActive(id: string | null): void
  reset(): void
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
      rooms: s.rooms.some((r) => r.id === room.id)
        ? s.rooms.map((r) => (r.id === room.id ? room : r))
        : [room, ...s.rooms],
    }))
    return room
  },

  async joinRoom(roomId) {
    const room = await useCase.join(roomId)
    set((s) => ({
      rooms: s.rooms.some((r) => r.id === room.id)
        ? s.rooms
        : [room, ...s.rooms],
    }))
    return room
  },

  async exploreRooms() {
    return useCase.explore()
  },

  upsertRoom(room) {
    set((s) => ({
      rooms: s.rooms.some((r) => r.id === room.id)
        ? s.rooms.map((r) => (r.id === room.id ? room : r))
        : [room, ...s.rooms],
    }))
  },

  incrementUnread(roomId) {
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId
          ? { ...r, unread_count: (r.unread_count ?? 0) + 1 }
          : r
      ),
    }))
  },

  clearUnread(roomId) {
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId && (r.unread_count ?? 0) > 0
          ? { ...r, unread_count: 0 }
          : r
      ),
    }))
  },

  setActive(id) {
    set({ activeRoomId: id })
  },

  reset() {
    set({ rooms: [], activeRoomId: null, loading: false })
  },
}))

export const activeRoom = () => {
  const { rooms, activeRoomId } = useRoomStore.getState()
  return rooms.find((r) => r.id === activeRoomId) ?? null
}
