import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/features/auth/login.page'
import { RegisterPage } from '@/features/auth/register.page'
import { RoomsLayout } from '@/features/rooms/rooms.layout'
import { ChatPage } from '@/features/chat/chat.page'
import { RequireAuth, RedirectIfAuth } from './guards'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RedirectIfAuth />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/rooms" element={<RoomsLayout />}>
            <Route path=":id" element={<ChatPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/rooms" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
