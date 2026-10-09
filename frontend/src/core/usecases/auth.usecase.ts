import type { AuthRepository } from '@/core/repositories/auth.repository'
import type { User } from '@/core/entities'

export function createAuthUseCase(repo: AuthRepository) {
  return {
    register(username: string, email: string, password: string): Promise<{ user: User; token: string }> {
      return repo.register(username, email, password)
    },
    login(email: string, password: string): Promise<{ user: User; token: string }> {
      return repo.login(email, password)
    },
  }
}
