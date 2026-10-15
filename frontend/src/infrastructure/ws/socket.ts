import { useChatStore } from '@/store/chat.store'
import { useRoomStore } from '@/store/room.store'
import { useAuthStore } from '@/store/auth.store'
import type { Message } from '@/core/entities'

type ServerMsg =
  | { type: 'message'; room_id: string; message: Message }
  | { type: 'read'; room_id: string; message_id: string; user_id: string }
  | { type: 'presence'; user_id: string; username: string; status: 'online' | 'offline' }
  | { type: 'room_created'; room: import('@/core/entities').Room }
  | { type: 'error'; message: string }

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let joinedRooms = new Set<string>()
let currentToken: string | null = null

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'

function clearTimer() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
}

export function wsConnect(token: string) {
  if (!token) return

  // If already connected with the same token, do not recreate
  if (ws && currentToken === token && ws.readyState <= WebSocket.OPEN) {
    return
  }

  // If previous socket exists (different token or broken state), cleanly tear it down
  if (ws) {
    wsDisconnect()
  }

  clearTimer()
  currentToken = token

  const socket = new WebSocket(`${WS_BASE}/ws?token=${token}`)
  ws = socket

  socket.onopen = () => {
    if (ws !== socket) return
    // re-join rooms after reconnect
    joinedRooms.forEach((id) => wsSend({ type: 'join', room_id: id }))
  }

  socket.onmessage = (ev) => {
    if (ws !== socket) return
    let data: ServerMsg
    try { data = JSON.parse(ev.data) } catch { return }

    if (data.type === 'message') {
      useChatStore.getState().appendMessage(data.room_id, data.message)
      const currentActive = useRoomStore.getState().activeRoomId
      const currentUserId = useAuthStore.getState().user?.id
      if (data.room_id !== currentActive && data.message.sender.id !== currentUserId) {
        useRoomStore.getState().incrementUnread(data.room_id)
      }
    } else if (data.type === 'room_created') {
      useRoomStore.getState().upsertRoom(data.room)
    }
    // ponytail: presence + read stored in stores when Sprint 3+ needs badges/receipts
  }

  socket.onclose = () => {
    if (ws === socket) {
      ws = null
    }
    // Only reconnect if user is still logged in with this exact token
    const activeToken = useAuthStore.getState().token
    if (activeToken && activeToken === currentToken) {
      clearTimer()
      reconnectTimer = setTimeout(() => {
        const stillActive = useAuthStore.getState().token
        if (stillActive && stillActive === currentToken) {
          wsConnect(stillActive)
        }
      }, 3000)
    }
  }

  socket.onerror = () => {
    if (ws === socket) {
      socket.close()
    }
  }
}

export function wsDisconnect() {
  clearTimer()
  joinedRooms.clear()
  currentToken = null
  if (ws) {
    const s = ws
    ws = null
    s.onopen = null
    s.onmessage = null
    s.onerror = null
    s.onclose = null
    try {
      s.close()
    } catch {
      // ignore
    }
  }
}

export function wsJoin(roomId: string) {
  joinedRooms.add(roomId)
  wsSend({ type: 'join', room_id: roomId })
}

export function wsLeave(roomId: string) {
  joinedRooms.delete(roomId)
  wsSend({ type: 'leave', room_id: roomId })
}

export function wsSendMessage(roomId: string, content: string) {
  wsSend({ type: 'message', room_id: roomId, content })
}

export function wsSendRead(roomId: string, messageId: string) {
  wsSend({ type: 'read', room_id: roomId, message_id: messageId })
}

function wsSend(payload: object) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload))
  }
}

// unused import guard — keep store refs alive
void useRoomStore
