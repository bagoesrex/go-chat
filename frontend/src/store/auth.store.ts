import { create } from 'zustand'
import type { User } from '@/core/entities'
import { authApi } from '@/infrastructure/http/auth.api'
import { createAuthUseCase } from '@/core/usecases/auth.usecase'
import { wsConnect, wsDisconnect } from '@/infrastructure/ws/socket'

const useCase = createAuthUseCase(authApi)

interface AuthState {
  token: string | null
  user: User | null
  login(email: string, password: string): Promise<void>
  register(username: string, email: string, password: string): Promise<void>
  logout(): void
}

export const useAuthStore = create<AuthState>((set) => {
  // auto-connect if token already in storage (page refresh)
  const storedToken = localStorage.getItem('token')
  if (storedToken) wsConnect(storedToken)

  return {
    token: storedToken,
    user: (() => {
      try { return JSON.parse(localStorage.getItem('user') ?? 'null') } catch { return null }
    })(),

    async login(email, password) {
      const { user, token } = await useCase.login(email, password)
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      wsConnect(token)
      set({ token, user })
    },

    async register(username, email, password) {
      const { user, token } = await useCase.register(username, email, password)
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      wsConnect(token)
      set({ token, user })
    },

    logout() {
      wsDisconnect()
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ token: null, user: null })
    },
  }
})
