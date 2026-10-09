import type { User } from '@/core/entities'

export interface AuthRepository {
  register(username: string, email: string, password: string): Promise<{ user: User; token: string }>
  login(email: string, password: string): Promise<{ user: User; token: string }>
}
