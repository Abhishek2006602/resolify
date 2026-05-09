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
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl fade-in"
      style={{ background: '#6366F110', border: '1px solid #6366F130' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: '#6366F120' }}>
        <Zap size={14} color="#6366F1" />
      </div>
      <p className="flex-1 text-sm" style={{ color: '#94A3B8' }}>
        <span className="font-semibold" style={{ color: '#F8FAFC' }}>Resolify</span>{' '}
        automatically enriches every ticket with customer context, classifies intent, and decides
        to resolve or escalate — saving your team{' '}
        <span className="font-semibold" style={{ color: '#6366F1' }}>8 minutes per ticket</span>.
      </p>
      <button onClick={dismiss}
        className="w-6 h-6 flex items-center justify-center rounded-md flex-shrink-0 hover:bg-white/10 transition-all"
        style={{ color: '#94A3B8' }}>
        <X size={14} />
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

const DONUT_COLORS = { resolved: '#10B981', escalated: '#EF4444', pending: '#F59E0B', enriched: '#6366F1' }

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#1A1D27', border: '1px solid #2A2D3A', color: '#F8FAFC' }}>
      <span className="font-semibold">{payload[0].name}:</span> {payload[0].value}
    </div>
  )
}

export default function Dashboard() {
  const [tickets, setTickets]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selected, setSelected]     = useState(null)
  const [testOpen, setTestOpen]     = useState(false)

  const fetchTickets = useCallback(async (quiet = false) => {
    if (quiet) setSyncing(true); else setLoading(true)
    try {
      const data = await getTickets()
      setTickets(data)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (_) {}
    finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])
  useEffect(() => {
    const id = setInterval(() => fetchTickets(true), 10000)
    return () => clearInterval(id)
  }, [fetchTickets])

  // Donut data
  const statusCounts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})
  const donutData = Object.entries(statusCounts)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0)

  // Activity feed — last 5
  const recentActivity = [...tickets]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  const activityDot = {
    resolved:  '#10B981',
    escalated: '#EF4444',
    pending:   '#F59E0B',
    enriched:  '#6366F1',
  }

  return (
    <>
      <TopBar title="Dashboard" syncing={syncing} lastUpdated={lastUpdated} />

      <main className="pt-14 pl-60 min-h-screen" style={{ background: '#0F1117' }}>
        <div className="p-6 space-y-6">

          {/* Dismissible banner */}
          <InfoBanner />

          {/* Metrics */}
          <MetricsRow tickets={tickets} loading={loading} />

          {/* Middle row */}
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 400px' }}>

            {/* Recent tickets table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-0.5 h-4 rounded-full" style={{ background: '#6366F1' }} />
                  <h2 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Recent Tickets</h2>
                </div>
                <span className="text-xs font-medium" style={{ color: '#475569' }}>Last 10</span>
              </div>
              <TicketTable
                tickets={tickets.slice(0, 10)}
                loading={loading}
                onOpen={setSelected}
              />
            </div>

            {/* Donut chart */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-0.5 h-4 rounded-full" style={{ background: '#10B981' }} />
                <h2 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Status Breakdown</h2>
              </div>
              <div className="p-5 rounded-xl" style={{ background: '#1A1D27', border: '1px solid #2A2D3A' }}>
                {loading ? (
                  <div className="skeleton h-52 rounded-xl" />
                ) : donutData.length === 0 ? (
                  <div className="h-52 flex items-center justify-center text-xs" style={{ color: '#94A3B8' }}>
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%" cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {donutData.map((entry) => (
                          <Cell key={entry.name} fill={DONUT_COLORS[entry.name] || '#6366F1'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={v => <span style={{ color: '#94A3B8', fontSize: 12 }}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {/* Legend counts */}
                {!loading && donutData.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {donutData.map(d => (
                      <div key={d.name} className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ background: '#0F1117' }}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[d.name] }} />
                          <span className="text-xs capitalize" style={{ color: '#94A3B8' }}>{d.name}</span>
                        </div>
                        <span className="text-xs font-semibold tabular-nums" style={{ color: '#F8FAFC' }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity feed */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-0.5 h-4 rounded-full" style={{ background: '#818CF8' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Recent Activity</h2>
            </div>
            <div className="rounded-xl p-5" style={{ background: '#1A1D27', border: '1px solid #2A2D3A' }}>
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
                <p className="text-xs text-center py-4" style={{ color: '#94A3B8' }}>No activity yet</p>
              ) : (
                <div>
                  {recentActivity.map((t, i) => (
                    <div key={t.id}
                      className="flex items-start gap-3 py-3 cursor-pointer px-2 -mx-2 rounded-lg transition-all"
                      onClick={() => setSelected(t)}
                      onMouseEnter={e => e.currentTarget.style.background = '#ffffff06'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Timeline spine */}
                      <div className="flex flex-col items-center flex-shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: activityDot[t.status] || '#94A3B8' }} />
                        {i < recentActivity.length - 1 && (
                          <div className="w-px flex-1 mt-1" style={{ background: '#1e2130', minHeight: 20 }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <p className="text-sm leading-snug" style={{ color: '#E2E8F0' }}>
                          <span className="font-mono text-xs mr-2" style={{ color: '#818CF8' }}>{t.ticket_id}</span>
                          {t.message.length > 70 ? t.message.slice(0, 70) + '…' : t.message}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                          {t.customer_email}
                          {t.customer_context?.company_name && ` · ${t.customer_context.company_name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5" style={{ color: '#334155' }}>
                        <Clock size={10} />
                        <span className="text-xs num">{timeAgo(t.created_at)}</span>
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

      {/* Floating send button */}
      <button
        onClick={() => setTestOpen(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all z-30"
        style={{
          background: '#6366F1',
          color: '#fff',
          boxShadow: '0 4px 24px #6366F140',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.boxShadow = '0 4px 32px #6366F160' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#6366F1'; e.currentTarget.style.boxShadow = '0 4px 24px #6366F140' }}
      >
        <Send size={15} />
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
