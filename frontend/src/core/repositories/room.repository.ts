import type { Room, ExploreRoom, Message } from '@/core/entities'

export interface RoomRepository {
  list(): Promise<Room[]>
  explore(): Promise<ExploreRoom[]>
  join(roomId: string): Promise<Room>
  create(name: string): Promise<Room>
  createDM(targetUserId: string): Promise<Room>
  getMessages(roomId: string, before?: string, limit?: number): Promise<Message[]>
  markAsRead(roomId: string): Promise<void>
}
