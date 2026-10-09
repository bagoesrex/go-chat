import type { Room, Message } from '@/core/entities'

export interface RoomRepository {
  list(): Promise<Room[]>
  create(name: string): Promise<Room>
  getMessages(roomId: string, before?: string, limit?: number): Promise<Message[]>
}
