export interface User {
  id: string
  username: string
  email: string
  created_at: string
}

export interface Room {
  id: string
  name: string
  is_dm: boolean
  created_by: string
  created_at: string
}

export interface Message {
  id: string
  room_id: string
  sender: User
  content: string
  created_at: string
}
