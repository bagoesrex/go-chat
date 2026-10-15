import type { RoomRepository } from '@/core/repositories/room.repository'

export function createRoomUseCase(repo: RoomRepository) {
  return {
    list: () => repo.list(),
    explore: () => repo.explore(),
    join: (roomId: string) => repo.join(roomId),
    create: (name: string) => repo.create(name),
    createDM: (targetUserId: string) => repo.createDM(targetUserId),
    getMessages: (roomId: string, before?: string, limit = 50) =>
      repo.getMessages(roomId, before, limit),
    markAsRead: (roomId: string) => repo.markAsRead(roomId),
  }
}
