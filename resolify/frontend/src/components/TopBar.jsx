import { Bell, RefreshCw, ChevronRight } from 'lucide-react'

export default function TopBar({ title, syncing, lastUpdated, crumb }) {
  return (
    <header
      className="fixed top-0 right-0 h-14 flex items-center justify-between px-5"
      style={{
        left: '240px',
        background: '#0F1117',
        borderBottom: '1px solid #1e2130',
        zIndex: 30,
      }}
    >
      {/* Left — breadcrumb */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium" style={{ color: '#475569' }}>Resolify</span>
        <ChevronRight size={12} style={{ color: '#2A2D3A' }} />
        <span className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>{title}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {syncing && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#475569' }}>
            <RefreshCw size={11} className="animate-spin" />
            <span>Syncing</span>
          </div>
        )}
        {lastUpdated && !syncing && (
          <span className="text-xs" style={{ color: '#334155' }}>
            Updated {lastUpdated}
          </span>
        )}

        {/* Live badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: '#10B98112', color: '#34D399', border: '1px solid #10B98120' }}
        >
          <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: '#10B981' }} />
          Live
        </div>

        <div style={{ width: 1, height: 20, background: '#1e2130' }} />

        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
          style={{ color: '#475569' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ffffff08'; e.currentTarget.style.color = '#94A3B8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
        >
          <Bell size={15} />
        </button>
      </div>
    </header>
  )
}
