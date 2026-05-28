import { NavLink } from 'react-router-dom'
import { Zap, LayoutDashboard, Ticket, BarChart2, Settings } from 'lucide-react'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tickets',   icon: Ticket,          label: 'Tickets'   },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics' },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
]

export default function Sidebar() {
  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col"
      style={{
        width: 220,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 flex-shrink-0"
        style={{ height: 48, borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))' }}
        >
          <Zap size={12} color="#fff" fill="#fff" />
        </div>
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
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <p
          className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}
        >
          Main
        </p>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="block"
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <div
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative"
                style={{
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(88,166,255,0.08)' : 'transparent',
                  borderLeft: isActive
                    ? '2px solid var(--accent-primary)'
                    : '2px solid transparent',
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
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Gradient divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--border-subtle), transparent)' }} />

      {/* User */}
      <div className="px-2 py-3 flex-shrink-0">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150"
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
              color: '#fff',
              letterSpacing: '-0.5px',
            }}
          >
            AK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>Abhishek</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Admin</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent-green)' }} />
        </div>
      </div>
    </aside>
  )
}
