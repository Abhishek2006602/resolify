import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { TrendingUp, CheckCircle2, Brain, Zap } from 'lucide-react'
import TopBar from '../components/TopBar'
import { getAnalytics } from '../api'

const INTENT_COLORS = {
  billing: '#D29922', cancellation: '#F85149', technical: '#58A6FF',
  account: '#8B5CF6', refund: '#F85149', general: '#8B949E',
  auth: '#58A6FF', howto: '#3FB950', unknown: '#484F58',
}

// Fix 10 — Demo baseline for sparse data
const DEMO_RESOLVED  = [3, 5, 4, 7, 6, 8, 12]
const DEMO_ESCALATED = [1, 1, 1, 2, 1, 2, 4]
const DEMO_KPI = { total_7d: 45, resolved_7d: 33, resolution_rate_7d: 73.3, avg_confidence: 87.4 }

function KpiCard({ icon: Icon, color, label, value, sub, highlight, showArrow }) {
  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderTop: `2px solid ${color}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-xs font-semibold uppercase"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}
        >
          {label}
        </p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showArrow && <TrendingUp size={18} color="var(--accent-green)" />}
        <p
          className="font-bold num"
          style={{
            color: highlight ? 'var(--accent-green)' : 'var(--text-primary)',
            lineHeight: 1,
            fontSize: highlight ? 36 : 30,
          }}
        >
          {value}
        </p>
      </div>
      {sub && <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs space-y-1"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
    >
      <p className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function SectionHeader({ children, accent }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-0.5 h-4 rounded-full" style={{ background: accent || 'var(--accent-primary)' }} />
      <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</h2>
    </div>
  )
}

function SkeletonBlock({ h = 200 }) {
  return <div className="skeleton rounded-xl" style={{ height: h }} />
}

export default function Analytics() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatDay = d => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  // Fix 10 — use demo baseline when data is empty
  const isDemo = !data?.total_7d || data.total_7d === 0

  const dailyFormatted = (data?.daily || []).map((d, i) => ({
    ...d,
    label:    formatDay(d.date),
    resolved:  isDemo ? DEMO_RESOLVED[i]  : d.resolved,
    escalated: isDemo ? DEMO_ESCALATED[i] : d.escalated,
  }))

  const kpi = isDemo ? DEMO_KPI : {
    total_7d:           data?.total_7d            ?? 0,
    resolved_7d:        data?.resolved_7d          ?? 0,
    resolution_rate_7d: data?.resolution_rate_7d   ?? 0,
    avg_confidence:     data?.avg_confidence       ?? 0,
  }

  const modelUsage = isDemo
    ? { haiku: 29, sonnet: 16 }
    : data?.model_usage

  return (
    <>
      <TopBar title="Analytics" />

      {/* Fix 8 — extra 20px padding-top so cards clear the topbar */}
      <main
        className="min-h-screen"
        style={{ paddingTop: 68, paddingLeft: 'var(--sidebar-w)', background: 'var(--bg-base)' }}
      >
        <div className="p-5 space-y-5">

          {/* Fix 9 — Resolution Rate gets highlight + showArrow */}
          <div className="grid grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => <SkeletonBlock key={i} h={100} />)
            ) : (
              <>
                <KpiCard icon={Zap} color="var(--accent-primary)"
                  label="Tickets (7 days)" value={kpi.total_7d}
                  sub="Total tickets received" />
                <KpiCard icon={CheckCircle2} color="var(--accent-green)"
                  label="Resolution Rate" value={`${kpi.resolution_rate_7d}%`}
                  sub={`${kpi.resolved_7d} auto-resolved`}
                  highlight showArrow />
                <KpiCard icon={Brain} color="var(--accent-purple)"
                  label="Avg Confidence" value={`${kpi.avg_confidence}%`}
                  sub="Classifier confidence" />
                <KpiCard icon={TrendingUp} color="var(--accent-green)"
                  label="Model Mix"
                  value={modelUsage && Object.keys(modelUsage).length > 0
                    ? `${Math.round(((modelUsage.haiku || 0) / Object.values(modelUsage).reduce((a, b) => a + b, 0)) * 100)}% Haiku`
                    : '—'}
                  sub="Fast vs quality balance" />
              </>
            )}
          </div>

          {/* Volume + Intent */}
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 340px' }}>

            <div>
              <SectionHeader accent="var(--accent-primary)">Ticket Volume — Last 7 Days</SectionHeader>
              <div className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                {loading ? <SkeletonBlock h={200} /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={dailyFormatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3FB950" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3FB950" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gEscalated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#F85149" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#F85149" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="resolved"  name="Resolved"
                        stroke="#3FB950" strokeWidth={2} fill="url(#gResolved)"  dot={false} />
                      <Area type="monotone" dataKey="escalated" name="Escalated"
                        stroke="#F85149" strokeWidth={2} fill="url(#gEscalated)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                {isDemo && !loading && (
                  <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
                    Demo data · Showing sample activity
                  </p>
                )}
              </div>
            </div>

            <div>
              <SectionHeader accent="var(--accent-amber)">Intent Breakdown</SectionHeader>
              <div className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                {loading ? <SkeletonBlock h={200} /> : !data?.intent_breakdown?.length ? (
                  <div className="h-52 flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.intent_breakdown} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="intent" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Tickets" radius={[0, 4, 4, 0]}>
                        {(data.intent_breakdown || []).map(entry => (
                          <Cell key={entry.intent} fill={INTENT_COLORS[entry.intent] || 'var(--accent-primary)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Model + Language */}
          <div className="grid grid-cols-2 gap-4">

            <div>
              <SectionHeader accent="var(--accent-purple)">Model Usage</SectionHeader>
              <div className="p-5 rounded-xl space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                {loading ? <SkeletonBlock h={80} /> : (() => {
                  const usage = modelUsage || {}
                  const total = Object.values(usage).reduce((a, b) => a + b, 0)
                  if (total === 0) return <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>No data yet</p>
                  const models = [
                    { key: 'haiku',  label: 'Haiku',  color: 'var(--accent-green)',   desc: 'Fast · how-to & neutral' },
                    { key: 'sonnet', label: 'Sonnet', color: 'var(--accent-primary)', desc: 'Quality · complex issues' },
                  ]
                  return models.map(m => {
                    const count = usage[m.key] || 0
                    const pct = total > 0 ? Math.round(count / total * 100) : 0
                    return (
                      <div key={m.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Claude {m.label}</span>
                            <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{m.desc}</span>
                          </div>
                          <span className="text-sm font-bold num" style={{ color: m.color }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: m.color }} />
                        </div>
                        <p className="text-xs mt-1 num" style={{ color: 'var(--text-muted)' }}>{count} tickets</p>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            <div>
              <SectionHeader accent="var(--accent-green)">Language Breakdown</SectionHeader>
              <div className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                {loading ? <SkeletonBlock h={80} /> : !data?.language_breakdown?.length ? (
                  <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.language_breakdown.map((l, i) => {
                      const pct = Math.round(l.count / (data.total_7d || 1) * 100)
                      const colors = ['var(--accent-primary)', 'var(--accent-green)', 'var(--accent-amber)', 'var(--accent-red)', 'var(--accent-purple)']
                      const color = colors[i % colors.length]
                      return (
                        <div key={l.language}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium uppercase" style={{ color: 'var(--text-primary)' }}>{l.language}</span>
                            <span className="text-xs num font-semibold" style={{ color }}>{pct}% · {l.count}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
