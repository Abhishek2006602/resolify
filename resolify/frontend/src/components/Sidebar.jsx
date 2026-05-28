import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Zap, LayoutDashboard, Ticket, BarChart2, Settings, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tickets',   icon: Ticket,          label: 'Tickets'   },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics' },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
]

export default function Sidebar() {
  const [isMobile, setIsMobile] = useState(false)
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const w = isMobile ? 40 : 220

  // Initials from company name or name
  const displayName = user?.company_name || user?.name || 'User'
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('')

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col"
      style={{
        width: w,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        zIndex: 40,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          height: 48,
          borderBottom: '1px solid var(--border-subtle)',
          padding: isMobile ? '0' : '0 16px',
          justifyContent: isMobile ? 'center' : undefined,
          gap: isMobile ? 0 : 10,
        }}
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))' }}
        >
          <Zap size={12} color="#fff" fill="#fff" />
        </div>
        {!isMobile && (
          <>
            <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Resolify
            </span>
            <span
              className="ml-auto text-xs px-1.5 py-0.5 rounded font-medium mono"
              style={{
                background: 'rgba(88,166,255,0.08)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(88,166,255,0.15)',
              }}
            >
              v0.2
            </span>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto" style={{ padding: isMobile ? '12px 4px' : '12px 8px' }}>
        {!isMobile && (
          <p
            className="px-3 mb-2 text-xs font-semibold uppercase"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}
          >
            Main
          </p>
        )}
        <div className="space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className="block"
              style={{ textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <div
                  className="flex items-center rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(88,166,255,0.08)' : 'transparent',
                    borderLeft: !isMobile && isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    justifyContent: isMobile ? 'center' : undefined,
                    padding: isMobile ? '9px 0' : '8px 12px',
                    gap: isMobile ? 0 : 10,
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--text-primary)'
                      e.currentTarget.style.background = 'var(--bg-elevated)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--text-secondary)'
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                  {!isMobile && label}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Gradient divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--border-subtle), transparent)' }} />

      {/* User + logout */}
      <div style={{ padding: isMobile ? '8px 4px' : '8px' }}>
        {/* User row */}
        <div
          className="flex items-center rounded-lg"
          style={{
            justifyContent: isMobile ? 'center' : undefined,
            padding: isMobile ? '8px 0' : '10px 12px',
            gap: isMobile ? 0 : 10,
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
              color: '#fff',
              letterSpacing: '-0.5px',
            }}
          >
            {initials || '?'}
          </div>
          {!isMobile && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {displayName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {isAdmin && <Shield size={10} style={{ color: 'var(--accent-amber)' }} />}
                  <p className="text-xs capitalize" style={{ color: isAdmin ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                    {user?.role || 'client'}
                  </p>
                </div>
              </div>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent-green)' }} />
            </>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center rounded-lg w-full transition-all"
          style={{
            justifyContent: isMobile ? 'center' : undefined,
            padding: isMobile ? '8px 0' : '8px 12px',
            gap: isMobile ? 0 : 8,
            color: 'var(--text-muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(248,81,73,0.08)'
            e.currentTarget.style.color = '#F85149'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          <LogOut size={14} />
          {!isMobile && <span className="text-xs font-medium">Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
