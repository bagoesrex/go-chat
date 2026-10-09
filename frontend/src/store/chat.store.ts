import { create } from 'zustand'
import type { Message } from '@/core/entities'
import { roomApi } from '@/infrastructure/http/room.api'
import { createRoomUseCase } from '@/core/usecases/room.usecase'

const useCase = createRoomUseCase(roomApi)

interface ChatState {
  // keyed by roomId
  messages: Record<string, Message[]>
  hasMore: Record<string, boolean>
  loading: Record<string, boolean>
  fetchMessages(roomId: string): Promise<void>
  loadMore(roomId: string): Promise<void>
  appendMessage(roomId: string, msg: Message): void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  hasMore: {},
  loading: {},

  async fetchMessages(roomId) {
    set((s) => ({ loading: { ...s.loading, [roomId]: true } }))
    try {
      const msgs = await useCase.getMessages(roomId)
      // backend returns newest-first → reverse for display
      set((s) => ({
        messages: { ...s.messages, [roomId]: [...msgs].reverse() },
        hasMore: { ...s.hasMore, [roomId]: msgs.length === 50 },
      }))
    } finally {
      set((s) => ({ loading: { ...s.loading, [roomId]: false } }))
    }
  },

  async loadMore(roomId) {
    const existing = get().messages[roomId] ?? []
    if (!existing.length) return
    // oldest message is index 0 — use its id as cursor
    const before = existing[0].id
    set((s) => ({ loading: { ...s.loading, [roomId]: true } }))
    try {
      const msgs = await useCase.getMessages(roomId, before)
      set((s) => ({
        messages: {
          ...s.messages,
          [roomId]: [...[...msgs].reverse(), ...(s.messages[roomId] ?? [])],
        },
        hasMore: { ...s.hasMore, [roomId]: msgs.length === 50 },
      }))
    } finally {
      set((s) => ({ loading: { ...s.loading, [roomId]: false } }))
    }
  },

  appendMessage(roomId, msg) {
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: [...(s.messages[roomId] ?? []), msg],
      },
    }))
  },
}))
