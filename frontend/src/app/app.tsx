import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/features/auth/login.page'
import { RegisterPage } from '@/features/auth/register.page'
import { RoomsPage } from '@/features/rooms/rooms.page'
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
          <Route path="/rooms" element={<RoomsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/rooms" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
