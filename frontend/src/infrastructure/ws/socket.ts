import { useChatStore } from '@/store/chat.store'
import { useRoomStore } from '@/store/room.store'
import type { Message } from '@/core/entities'

type ServerMsg =
  | { type: 'message'; room_id: string; message: Message }
  | { type: 'read'; room_id: string; message_id: string; user_id: string }
  | { type: 'presence'; user_id: string; username: string; status: 'online' | 'offline' }
  | { type: 'error'; message: string }

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let joinedRooms = new Set<string>()

function clearTimer() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
}

export function wsConnect(token: string) {
  if (ws && ws.readyState <= WebSocket.OPEN) return
  clearTimer()

  ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`)

  ws.onopen = () => {
    // re-join rooms after reconnect
    joinedRooms.forEach((id) => wsSend({ type: 'join', room_id: id }))
  }

  ws.onmessage = (ev) => {
    let data: ServerMsg
    try { data = JSON.parse(ev.data) } catch { return }

    if (data.type === 'message') {
      useChatStore.getState().appendMessage(data.room_id, data.message)
    }
    // ponytail: presence + read stored in stores when Sprint 3+ needs badges/receipts
  }

  ws.onclose = () => {
    ws = null
    // ponytail: linear backoff, upgrade to exponential if flakiness is a problem
    reconnectTimer = setTimeout(() => wsConnect(token), 3000)
  }

  ws.onerror = () => ws?.close()
}

export function wsDisconnect() {
  clearTimer()
  joinedRooms.clear()
  ws?.close()
  ws = null
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
