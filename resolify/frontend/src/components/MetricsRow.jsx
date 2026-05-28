import { Ticket, CheckCircle2, AlertTriangle, Zap, Clock, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

const DEMO = {
  total: 24,
  resolved: 16,
  escalated: 8,
  resolveRate: 67,
  timeSavedMin: 128,
  costSaved: '53.28',
}

function MetricCard({ icon: Icon, iconColor, accentColor, label, value, sub, trendUp }) {
  return (
    <div
      className="rounded-xl fade-in"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderTop: `2px solid ${accentColor}`,
        padding: '16px 18px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-xs font-semibold uppercase"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}
        >
          {label}
        </p>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accentColor}15` }}
        >
          <Icon size={14} color={iconColor} />
        </div>
      </div>
      <p
        className="font-bold num"
        style={{ color: 'var(--text-primary)', lineHeight: 1, fontSize: 'clamp(22px, 2vw, 28px)' }}
      >
        {value}
      </p>
      {sub && (
        <div className="flex items-center gap-1 mt-2">
          {trendUp !== undefined && (
            trendUp
              ? <TrendingUp size={10} color="var(--accent-green)" />
              : <TrendingDown size={10} color="var(--accent-red)" />
          )}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</span>
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        padding: '16px 18px',
      }}
    >
      <div className="skeleton h-3 w-20 mb-3" />
      <div className="skeleton h-7 w-14 mb-2" />
      <div className="skeleton h-3 w-24" />
    </div>
  )
}

function formatTimeSaved(minutes) {
  if (minutes === 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function MetricsRow({ tickets, loading }) {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))',
    gap: 12,
  }

  if (loading) {
    return (
      <div className="resolify-metrics-grid" style={gridStyle}>
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  const today = new Date().toDateString()
  const todayTickets = tickets.filter(t => new Date(t.created_at).toDateString() === today)
  const realTotal    = todayTickets.length
  const isDemoMode   = realTotal === 0

  const total       = isDemoMode ? DEMO.total        : realTotal
  const resolved    = isDemoMode ? DEMO.resolved      : todayTickets.filter(t => t.status === 'resolved').length
  const escalated   = isDemoMode ? DEMO.escalated     : todayTickets.filter(t => t.status === 'escalated').length
  const resolveRate = isDemoMode ? DEMO.resolveRate   : (total > 0 ? Math.round((resolved / total) * 100) : 0)
  const timeSaved   = isDemoMode ? DEMO.timeSavedMin  : resolved * 8
  const costSaved   = isDemoMode ? DEMO.costSaved     : (resolved * 3.33).toFixed(2)

  return (
    <div>
      <div className="resolify-metrics-grid" style={gridStyle}>
        <MetricCard
          icon={Ticket}
          iconColor="var(--accent-primary)"
          accentColor="var(--accent-primary)"
          label="Total Today"
          value={total}
          sub={`${total === 1 ? '1 ticket' : `${total} tickets`} received`}
          trendUp
        />
        <MetricCard
          icon={CheckCircle2}
          iconColor="var(--accent-green)"
          accentColor="var(--accent-green)"
          label="Auto Resolved"
          value={resolved}
          sub={`${resolveRate}% resolution rate`}
          trendUp={resolveRate >= 50}
        />
        <MetricCard
          icon={AlertTriangle}
          iconColor="var(--accent-red)"
          accentColor="var(--accent-red)"
          label="Escalated"
          value={escalated}
          sub={escalated === 0 ? 'All clear' : 'Need human review'}
        />
        <MetricCard
          icon={Zap}
          iconColor="var(--accent-green)"
          accentColor="var(--accent-green)"
          label="Response Time"
          value="< 1s"
          sub="Powered by Claude AI"
          trendUp
        />
        <MetricCard
          icon={Clock}
          iconColor="var(--accent-purple)"
          accentColor="var(--accent-purple)"
          label="Time Saved"
          value={formatTimeSaved(timeSaved)}
          sub="8 min per resolved ticket"
          trendUp
        />
        <MetricCard
          icon={DollarSign}
          iconColor="var(--accent-green)"
          accentColor="var(--accent-green)"
          label="Cost Saved"
          value={`$${costSaved}`}
          sub="at $25/hr average"
          trendUp
        />
      </div>
      {isDemoMode && (
        <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
          Demo data · Real numbers will appear when tickets arrive
        </p>
      )}
    </div>
  )
}
