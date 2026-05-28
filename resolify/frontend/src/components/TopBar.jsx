import { Bell, RefreshCw, ChevronRight, Sun, Moon } from 'lucide-react'
import { useState } from 'react'

export default function TopBar({ title, syncing, lastUpdated }) {
  const [isDark, setIsDark] = useState(() => !document.documentElement.classList.contains('light'))

  function toggleTheme() {
    const html = document.documentElement
    const goLight = !html.classList.contains('light')
    html.classList.toggle('light')
    localStorage.setItem('resolify_theme', goLight ? 'light' : 'dark')
    setIsDark(!goLight)
  }

  const iconBtn = {
    base: { color: 'var(--text-secondary)', background: 'transparent' },
    hover: { background: 'var(--bg-elevated)', color: 'var(--text-primary)' },
  }

  function hoverOn(e)  { Object.assign(e.currentTarget.style, iconBtn.hover) }
  function hoverOff(e) { Object.assign(e.currentTarget.style, iconBtn.base)  }

  return (
    <header
      className="fixed top-0 right-0 flex items-center justify-between px-5"
      style={{
        left: 'var(--sidebar-w)',
        height: 48,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        zIndex: 30,
        transition: 'left 0.2s ease',
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Resolify</span>
        <ChevronRight size={12} style={{ color: 'var(--border-default)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {syncing && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw size={11} className="animate-spin" />
            Syncing
          </div>
        )}
        {lastUpdated && !syncing && (
          <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
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

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
          style={iconBtn.base}
          onMouseEnter={hoverOn}
          onMouseLeave={hoverOff}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Bell */}
        <button
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
          style={iconBtn.base}
          onMouseEnter={hoverOn}
          onMouseLeave={hoverOff}
        >
          <Bell size={14} />
        </button>
      </div>
    </header>
  )
}
