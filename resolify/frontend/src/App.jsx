import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

function AppShell() {
  return (
    <>
      <Sidebar />
      <Routes>
        <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tickets"    element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
        <Route path="/analytics"  element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="*"           element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  useEffect(() => {
    const saved = localStorage.getItem('resolify_theme')
    if (saved === 'light') document.documentElement.classList.add('light')
  }, [])

  useEffect(() => {
    const keepAlive = setInterval(() => {
      fetch(`${API_URL}/health`).catch(() => {})
    }, 840000)
    return () => clearInterval(keepAlive)
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="*"         element={<AppShell />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
