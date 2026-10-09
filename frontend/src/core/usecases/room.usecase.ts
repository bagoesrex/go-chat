import type { RoomRepository } from '@/core/repositories/room.repository'

export function createRoomUseCase(repo: RoomRepository) {
  return {
    list: () => repo.list(),
    create: (name: string) => repo.create(name),
    getMessages: (roomId: string, before?: string, limit = 50) =>
      repo.getMessages(roomId, before, limit),
  }
}
