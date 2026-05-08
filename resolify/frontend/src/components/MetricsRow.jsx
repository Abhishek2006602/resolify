import { Ticket, CheckCircle2, AlertTriangle, Zap, Clock, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

function MetricCard({ icon: Icon, iconColor, iconBg, accentColor, label, value, sub, trend, trendUp }) {
  return (
    <div className="flex items-center justify-between p-5 rounded-xl fade-in flex-shrink-0"
      style={{
        background: '#1A1D27',
        border: '1px solid #2A2D3A',
        borderTop: `2px solid ${accentColor || iconColor}`,
        minWidth: '190px',
      }}>
      <div>
        <p className="text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#64748B' }}>{label}</p>
        <p className="text-3xl font-bold num" style={{ color: '#F8FAFC', lineHeight: 1 }}>{value}</p>
        {sub && (
          <div className="flex items-center gap-1 mt-2">
            {trend !== undefined && (
              trendUp
                ? <TrendingUp size={10} color="#10B981" />
                : <TrendingDown size={10} color="#EF4444" />
            )}
            <span className="text-xs" style={{ color: '#475569' }}>{sub}</span>
          </div>
        )}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}>
        <Icon size={18} color={iconColor} />
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="p-5 rounded-xl flex-shrink-0" style={{ background: '#1A1D27', border: '1px solid #2A2D3A', minWidth: '180px' }}>
      <div className="skeleton h-3 w-24 mb-3" />
      <div className="skeleton h-7 w-16 mb-2" />
      <div className="skeleton h-3 w-20" />
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
  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  const today = new Date().toDateString()
  const todayTickets  = tickets.filter(t => new Date(t.created_at).toDateString() === today)
  const resolved      = todayTickets.filter(t => t.status === 'resolved').length
  const escalated     = todayTickets.filter(t => t.status === 'escalated').length
  const total         = todayTickets.length
  const resolveRate   = total > 0 ? Math.round((resolved / total) * 100) : 0
  const timeSavedMin  = resolved * 8
  const costSaved     = (resolved * 3.33).toFixed(2)

  return (
    <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
      <MetricCard
        icon={Ticket}
        iconColor="#818CF8"
        iconBg="#6366F118"
        accentColor="#6366F1"
        label="Total Tickets Today"
        value={total}
        sub={total === 1 ? '1 ticket received' : `${total} tickets received`}
        trend
        trendUp={true}
      />
      <MetricCard
        icon={CheckCircle2}
        iconColor="#34D399"
        iconBg="#10B98118"
        accentColor="#10B981"
        label="Auto Resolved"
        value={resolved}
        sub={`${resolveRate}% resolution rate`}
        trend
        trendUp={resolveRate >= 50}
      />
      <MetricCard
        icon={AlertTriangle}
        iconColor="#F87171"
        iconBg="#EF444418"
        accentColor="#EF4444"
        label="Escalated"
        value={escalated}
        sub={escalated === 0 ? 'All clear' : 'Need human review'}
      />
      <MetricCard
        icon={Zap}
        iconColor="#34D399"
        iconBg="#10B98118"
        accentColor="#10B981"
        label="Avg Response Time"
        value="< 1s"
        sub="Powered by Claude AI"
        trend
        trendUp={true}
      />
      <MetricCard
        icon={Clock}
        iconColor="#818CF8"
        iconBg="#6366F118"
        accentColor="#6366F1"
        label="Time Saved Today"
        value={formatTimeSaved(timeSavedMin)}
        sub="8 min per resolved ticket"
        trend
        trendUp={true}
      />
      <MetricCard
        icon={DollarSign}
        iconColor="#34D399"
        iconBg="#10B98118"
        accentColor="#10B981"
        label="Cost Saved Today"
        value={`$${costSaved}`}
        sub="at $25/hr average"
        trend
        trendUp={true}
      />
    </div>
  )
}
