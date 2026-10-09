import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export function RequireAuth() {
  const token = useAuthStore((s) => s.token)
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

export function RedirectIfAuth() {
  const token = useAuthStore((s) => s.token)
  return token ? <Navigate to="/rooms" replace /> : <Outlet />
}
