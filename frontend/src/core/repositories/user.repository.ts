import type { User } from '@/core/entities'

export interface UserRepository {
  me(): Promise<User>
  search(q: string): Promise<User[]>
}
