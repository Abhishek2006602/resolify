import { useState, useEffect, useCallback } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Clock, Zap, X, Send } from 'lucide-react'
import TopBar from '../components/TopBar'
import MetricsRow from '../components/MetricsRow'
import TicketTable from '../components/TicketTable'
import TicketDrawer from '../components/TicketDrawer'
import TestPanel from '../components/TestPanel'
import { getTickets } from '../api'

const BANNER_KEY = 'resolify_banner_dismissed'

function InfoBanner() {
  const [visible, setVisible] = useState(() => localStorage.getItem(BANNER_KEY) !== 'true')

  function dismiss() {
    localStorage.setItem(BANNER_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="flex items-center gap-3 px-4 fade-in"
      style={{
        height: 44,
        background: 'rgba(88,166,255,0.05)',
        border: '1px solid rgba(88,166,255,0.12)',
        borderLeft: '3px solid var(--accent-primary)',
        borderRadius: 8,
      }}
    >
      <Zap size={13} color="var(--accent-primary)" />
      <p className="flex-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Resolify</span>{' '}
        enriches every ticket, classifies intent, and auto-resolves or escalates —{' '}
        <span className="font-semibold" style={{ color: 'var(--accent-primary)' }}>8 minutes saved per ticket</span>.
      </p>
      <button
        onClick={dismiss}
        className="w-5 h-5 flex items-center justify-center rounded flex-shrink-0 transition-all"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <X size={13} />
      </button>
    </div>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg text-xs"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
      <span className="font-semibold">{payload[0].name}:</span> {payload[0].value}
    </div>
  )
}

export default function Dashboard() {
  const [tickets, setTickets]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [syncing, setSyncing]         = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selected, setSelected]       = useState(null)
  const [testOpen, setTestOpen]       = useState(false)

  const fetchTickets = useCallback(async (quiet = false) => {
    if (quiet) setSyncing(true); else setLoading(true)
    try {
      const data = await getTickets()
      setTickets(data)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (_) {}
    finally { setLoading(false); setSyncing(false) }
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])
  useEffect(() => {
    const id = setInterval(() => fetchTickets(true), 5000)
    return () => clearInterval(id)
  }, [fetchTickets])

  const statusCounts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})
  const donutData = Object.entries(statusCounts)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0)

  const recentActivity = [...tickets]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  const activityDot = {
    resolved:  'var(--accent-green)',
    escalated: 'var(--accent-red)',
    pending:   'var(--accent-amber)',
    enriched:  'var(--accent-primary)',
  }

  const sectionHeaderStyle = { color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }

  const cellColor = name =>
    name === 'resolved' ? '#3FB950' :
    name === 'escalated' ? '#F85149' :
    name === 'pending' ? '#D29922' : '#58A6FF'

  return (
    <>
      <TopBar title="Dashboard" syncing={syncing} lastUpdated={lastUpdated} />

      <main
        className="min-h-screen"
        style={{ paddingTop: 48, paddingLeft: 'var(--sidebar-w)', background: 'var(--bg-base)' }}
      >
        <div className="p-5 space-y-5">

          <InfoBanner />
          <MetricsRow tickets={tickets} loading={loading} />

          {/* Middle row — tickets + donut.  Fix 1: wider right column (420px) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16 }}>

            {/* Recent tickets */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-0.5 h-4 rounded-full" style={{ background: 'var(--accent-primary)' }} />
                  <h2 style={sectionHeaderStyle}>Recent Tickets</h2>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 10</span>
              </div>
              <TicketTable
                tickets={[...tickets].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10)}
                loading={loading}
                onOpen={setSelected}
              />
            </div>

            {/* Status donut — Fix 1: wider panel, overflow visible for legend */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-0.5 h-4 rounded-full" style={{ background: 'var(--accent-green)' }} />
                <h2 style={sectionHeaderStyle}>Status Breakdown</h2>
              </div>
              <div
                className="p-5 rounded-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', overflow: 'visible' }}
              >
                {loading ? (
                  <div className="skeleton h-52 rounded-xl" />
                ) : donutData.length === 0 ? (
                  <div className="h-52 flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%" cy="50%"
                        innerRadius={55}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {donutData.map(entry => (
                          <Cell key={entry.name} fill={cellColor(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={7}
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                        formatter={v => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {!loading && donutData.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {donutData.map(d => (
                      <div key={d.name} className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--bg-elevated)' }}>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cellColor(d.name) }} />
                          <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                        </div>
                        <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity feed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-0.5 h-4 rounded-full" style={{ background: 'var(--accent-purple)' }} />
              <h2 style={sectionHeaderStyle}>Recent Activity</h2>
            </div>
            <div className="rounded-xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="skeleton w-2 h-2 rounded-full flex-shrink-0" />
                      <div className="skeleton h-3 flex-1 rounded" />
                      <div className="skeleton h-3 w-14 rounded" />
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No activity yet</p>
              ) : (
                <div>
                  {recentActivity.map((t, i) => (
                    <div key={t.id}
                      className="flex items-start gap-3 py-3 cursor-pointer px-2 -mx-2 rounded-lg transition-all"
                      onClick={() => setSelected(t)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="flex flex-col items-center flex-shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: activityDot[t.status] || 'var(--text-secondary)' }} />
                        {i < recentActivity.length - 1 && (
                          <div className="w-px flex-1 mt-1" style={{ background: 'var(--border-subtle)', minHeight: 20 }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <p className="text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
                          <span className="mono text-xs mr-2" style={{ color: 'var(--accent-primary)', fontSize: 11 }}>
                            {t.ticket_id}
                          </span>
                          {t.message.length > 70 ? t.message.slice(0, 70) + '…' : t.message}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {t.customer_email}
                          {t.customer_context?.company_name && ` · ${t.customer_context.company_name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={10} />
                        <span className="mono num" style={{ fontSize: 11 }}>{timeAgo(t.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <TicketDrawer ticket={selected} onClose={() => setSelected(null)} />

      {/* Fix 4 — premium Send Test Ticket button */}
      <button
        onClick={() => setTestOpen(true)}
        className="btn-send fixed bottom-6 right-6 flex items-center gap-2.5 rounded-xl font-semibold transition-all z-30 btn-glow-pulse"
        style={{
          background: 'var(--accent-primary)',
          color: '#fff',
          padding: '14px 24px',
          fontSize: 14,
          fontWeight: 600,
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#79B8FF'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-primary)'}
      >
        <span className="btn-send-icon"><Send size={15} /></span>
        Send Test Ticket
      </button>

      {testOpen && (
        <TestPanel
          onClose={() => setTestOpen(false)}
          onTicketSent={() => fetchTickets(true)}
        />
      )}
    </>
  )
}
