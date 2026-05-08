import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

export default function App() {
  useEffect(() => {
    const keepAlive = setInterval(() => {
      fetch(`${API_URL}/health`).catch(() => {})
    }, 840000) // 14 min — keeps Render free tier awake
    return () => clearInterval(keepAlive)
  }, [])

  return (
    <BrowserRouter>
      <Sidebar />
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/tickets"   element={<Tickets />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings"  element={<Settings />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
