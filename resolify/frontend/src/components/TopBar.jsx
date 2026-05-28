import { Bell, RefreshCw, ChevronRight } from 'lucide-react'

export default function TopBar({ title, syncing, lastUpdated, crumb }) {
  return (
    <header
      className="fixed top-0 right-0 flex items-center justify-between px-5"
      style={{
        left: 220,
        height: 48,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        zIndex: 30,
      }}
    >
      {/* Left — breadcrumb */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Resolify</span>
        <ChevronRight size={12} style={{ color: 'var(--border-default)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {syncing && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw size={11} className="animate-spin" />
            <span>Syncing</span>
          </div>
        )}
        {lastUpdated && !syncing && (
          <span className="text-xs mono" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            {lastUpdated}
          </span>
        )}

        {/* Live badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(63,185,80,0.08)',
            color: 'var(--accent-green)',
            border: '1px solid rgba(63,185,80,0.2)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: 'var(--accent-green)' }} />
          Live
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />

        <button
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-elevated)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <Bell size={14} />
        </button>
      </div>
    </header>
  )
}
