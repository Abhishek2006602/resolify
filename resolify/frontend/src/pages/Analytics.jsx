import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { TrendingUp, CheckCircle2, Brain, Zap } from 'lucide-react'
import TopBar from '../components/TopBar'
import { getAnalytics } from '../api'

const INTENT_COLORS = {
  billing: '#F59E0B', cancellation: '#EF4444', technical: '#3B82F6',
  account: '#8B5CF6', refund: '#EF4444', general: '#6B7280',
  auth: '#3B82F6', howto: '#10B981', unknown: '#334155',
}

function KpiCard({ icon: Icon, color, label, value, sub }) {
  return (
    <div className="p-5 rounded-xl" style={{ background: '#1A1D27', border: '1px solid #2A2D3A', borderTop: `2px solid ${color}` }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={15} color={color} />
        </div>
      </div>
      <p className="text-3xl font-bold num" style={{ color: '#F1F5F9', lineHeight: 1 }}>{value}</p>
      {sub && <p className="text-xs mt-2" style={{ color: '#475569' }}>{sub}</p>}
    </div>
  )
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg text-xs space-y-1"
      style={{ background: '#1A1D27', border: '1px solid #2A2D3A', color: '#F8FAFC' }}>
      <p className="font-semibold mb-1" style={{ color: '#94A3B8' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: '#94A3B8' }}>{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function SectionHeader({ children, accent }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-0.5 h-4 rounded-full" style={{ background: accent || '#6366F1' }} />
      <h2 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>{children}</h2>
    </div>
  )
}

function SkeletonBlock({ h = 200 }) {
  return <div className="skeleton rounded-xl" style={{ height: h }} />
}

export default function Analytics() {
  const [data, setData]     = useState(null)
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

  const dailyFormatted = (data?.daily || []).map(d => ({
    ...d, label: formatDay(d.date),
  }))

  return (
    <>
      <TopBar title="Analytics" />

      <main className="pt-14 pl-60 min-h-screen" style={{ background: '#0F1117' }}>
        <div className="p-6 space-y-6">

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => <SkeletonBlock key={i} h={100} />)
            ) : (
              <>
                <KpiCard
                  icon={Zap} color="#6366F1"
                  label="Tickets (7 days)" value={data?.total_7d ?? 0}
                  sub="Total tickets received"
                />
                <KpiCard
                  icon={CheckCircle2} color="#10B981"
                  label="Resolution Rate" value={`${data?.resolution_rate_7d ?? 0}%`}
                  sub={`${data?.resolved_7d ?? 0} auto-resolved`}
                />
                <KpiCard
                  icon={Brain} color="#818CF8"
                  label="Avg Confidence" value={`${data?.avg_confidence ?? 0}%`}
                  sub="Classifier confidence"
                />
                <KpiCard
                  icon={TrendingUp} color="#34D399"
                  label="Model Mix" value={data?.model_usage?.haiku || data?.model_usage ? (
                    Object.keys(data.model_usage).length > 0
                      ? `${Math.round(((data.model_usage.haiku || 0) / Object.values(data.model_usage).reduce((a,b)=>a+b,0))*100)}% Haiku`
                      : '—'
                  ) : '—'}
                  sub="Fast vs quality balance"
                />
              </>
            )}
          </div>

          {/* Volume chart + Intent breakdown */}
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 360px' }}>

            {/* Area chart */}
            <div>
              <SectionHeader accent="#6366F1">Ticket Volume — Last 7 Days</SectionHeader>
              <div className="p-5 rounded-xl" style={{ background: '#1A1D27', border: '1px solid #2A2D3A' }}>
                {loading ? <SkeletonBlock h={200} /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={dailyFormatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gEscalated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="resolved" name="Resolved"
                        stroke="#10B981" strokeWidth={2} fill="url(#gResolved)" dot={false} />
                      <Area type="monotone" dataKey="escalated" name="Escalated"
                        stroke="#EF4444" strokeWidth={2} fill="url(#gEscalated)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Intent breakdown */}
            <div>
              <SectionHeader accent="#F59E0B">Intent Breakdown</SectionHeader>
              <div className="p-5 rounded-xl" style={{ background: '#1A1D27', border: '1px solid #2A2D3A' }}>
                {loading ? <SkeletonBlock h={200} /> : !data?.intent_breakdown?.length ? (
                  <div className="h-52 flex items-center justify-center text-xs" style={{ color: '#475569' }}>No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.intent_breakdown} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="intent" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Tickets" radius={[0, 4, 4, 0]}>
                        {(data.intent_breakdown || []).map(entry => (
                          <Cell key={entry.intent} fill={INTENT_COLORS[entry.intent] || '#6366F1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Model usage + Language breakdown */}
          <div className="grid grid-cols-2 gap-4">

            {/* Model usage */}
            <div>
              <SectionHeader accent="#818CF8">Model Usage</SectionHeader>
              <div className="p-5 rounded-xl space-y-3" style={{ background: '#1A1D27', border: '1px solid #2A2D3A' }}>
                {loading ? <SkeletonBlock h={80} /> : !data?.model_usage || Object.keys(data.model_usage).length === 0 ? (
                  <p className="text-xs text-center py-6" style={{ color: '#475569' }}>No data yet</p>
                ) : (() => {
                  const total = Object.values(data.model_usage).reduce((a, b) => a + b, 0)
                  const models = [
                    { key: 'haiku', label: 'Haiku', color: '#10B981', desc: 'Fast · how-to & neutral' },
                    { key: 'sonnet', label: 'Sonnet', color: '#6366F1', desc: 'Quality · complex issues' },
                  ]
                  return models.map(m => {
                    const count = data.model_usage[m.key] || 0
                    const pct = total > 0 ? Math.round(count / total * 100) : 0
                    return (
                      <div key={m.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <span className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Claude {m.label}</span>
                            <span className="text-xs ml-2" style={{ color: '#475569' }}>{m.desc}</span>
                          </div>
                          <span className="text-sm font-bold num" style={{ color: m.color }}>{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1e2130' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: m.color }} />
                        </div>
                        <p className="text-xs mt-1 num" style={{ color: '#334155' }}>{count} tickets</p>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            {/* Language breakdown */}
            <div>
              <SectionHeader accent="#34D399">Language Breakdown</SectionHeader>
              <div className="p-5 rounded-xl" style={{ background: '#1A1D27', border: '1px solid #2A2D3A' }}>
                {loading ? <SkeletonBlock h={80} /> : !data?.language_breakdown?.length ? (
                  <p className="text-xs text-center py-6" style={{ color: '#475569' }}>No data yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {data.language_breakdown.map((l, i) => {
                      const total = data.total_7d || 1
                      const pct = Math.round(l.count / total * 100)
                      const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
                      const color = colors[i % colors.length]
                      return (
                        <div key={l.language}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium uppercase" style={{ color: '#F1F5F9' }}>{l.language}</span>
                            <span className="text-xs num font-semibold" style={{ color }}>{pct}% · {l.count}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e2130' }}>
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
