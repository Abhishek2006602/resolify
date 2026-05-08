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
      className="fixed top-0 left-0 h-screen w-60 flex flex-col"
      style={{ background: '#13151f', borderRight: '1px solid #1e2130', zIndex: 40 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 flex-shrink-0"
        style={{ borderBottom: '1px solid #1e2130' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
          <Zap size={14} color="#fff" fill="#fff" />
        </div>
        <span className="font-semibold text-sm tracking-tight" style={{ color: '#F8FAFC' }}>
          Resolify
        </span>
        <span className="ml-auto text-xs px-1.5 py-0.5 rounded font-medium"
          style={{ background: '#6366F115', color: '#818CF8', border: '1px solid #6366F125' }}>
          v0.2
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#3d4259' }}>
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
                  color: isActive ? '#A5B4FC' : '#64748B',
                  background: isActive ? '#6366F112' : 'transparent',
                  borderLeft: isActive ? '2px solid #6366F1' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = '#ffffff07'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'transparent'; }}}
              >
                <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-2 py-3 flex-shrink-0" style={{ borderTop: '1px solid #1e2130' }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150"
          style={{ color: '#64748B' }}
          onMouseEnter={e => e.currentTarget.style.background = '#ffffff07'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff' }}>
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#E2E8F0' }}>Abhishek</p>
            <p className="text-xs" style={{ color: '#475569' }}>Admin</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#10B981' }} />
        </div>
      </div>
    </aside>
  )
}
