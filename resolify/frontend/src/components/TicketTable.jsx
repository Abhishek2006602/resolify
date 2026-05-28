import { Eye, Inbox } from 'lucide-react'
import { StatusBadge, IntentBadge } from './StatusBadge'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function AiDecisionBadge({ status, escalateImmediately }) {
  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
        style={{ background: 'rgba(63,185,80,0.1)', color: '#3FB950', border: '1px solid rgba(63,185,80,0.2)' }}>
        ✓ Auto-resolved
      </span>
    )
  }
  if (status === 'escalated' && escalateImmediately) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
        style={{ background: 'rgba(248,81,73,0.1)', color: '#F85149', border: '1px solid rgba(248,81,73,0.2)' }}>
        ⚡ Urgent escalation
      </span>
    )
  }
  if (status === 'escalated') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
        style={{ background: 'rgba(210,153,34,0.1)', color: '#D29922', border: '1px solid rgba(210,153,34,0.2)' }}>
        ↑ Low confidence
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
      style={{ background: 'rgba(139,148,158,0.1)', color: '#8B949E', border: '1px solid rgba(139,148,158,0.2)' }}>
      ⏳ Processing
    </span>
  )
}

function MrrCell({ mrr, paymentStatus, accountHealth }) {
  if (mrr == null) return <span className="text-xs" style={{ color: 'var(--border-default)' }}>—</span>
  const atRisk   = paymentStatus === 'past_due' || accountHealth === 'at_risk' || accountHealth === 'churning'
  const trialing = paymentStatus === 'trialing'
  if (atRisk)   return <span className="text-xs font-medium" style={{ color: '#F85149' }}>${mrr} at risk</span>
  if (trialing) return <span className="text-xs font-medium" style={{ color: '#D29922' }}>${mrr} trial</span>
  return <span className="text-xs font-medium" style={{ color: '#3FB950' }}>${mrr}/mo</span>
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(10)].map((_, i) => (
        <td key={i} className="px-3 py-4">
          <div className="skeleton h-3.5 rounded" style={{ width: `${60 + (i * 17) % 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={10}>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <Inbox size={20} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No tickets yet</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Send your first test ticket to get started</p>
        </div>
      </td>
    </tr>
  )
}

const HEADER_COLOR = '#6E7681'

export default function TicketTable({ tickets, loading, onOpen }) {
  const cols = ['ID', 'Customer', 'Message', 'Intent', 'Status', 'AI Decision', 'Confidence', 'MRR', 'Time', '']

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="w-full" style={{ minWidth: 700 }}>
          <thead style={{ background: 'var(--bg-card)' }}>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {cols.map((c, i) => (
                <th
                  key={c}
                  className="px-3 py-3 text-left whitespace-nowrap"
                  style={{
                    color: HEADER_COLOR,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    minWidth: i === 5 ? 140 : undefined,
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : tickets.length === 0 ? (
              <EmptyState />
            ) : (
              tickets.map(t => {
                const ctx        = t.customer_context || {}
                const confidence = t.confidence != null ? Math.round(t.confidence * 100) : null

                return (
                  <tr
                    key={t.id}
                    className="transition-all cursor-pointer group"
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      borderLeft: '2px solid transparent',
                      minHeight: 60,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--bg-elevated)'
                      e.currentTarget.style.borderLeftColor = 'var(--accent-primary)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderLeftColor = 'transparent'
                    }}
                    onClick={() => onOpen(t)}
                  >
                    {/* ID */}
                    <td className="px-3 py-4">
                      <span className="mono text-xs font-semibold" style={{ color: 'var(--accent-primary)', fontSize: 11 }}>
                        {t.ticket_id}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-4" style={{ maxWidth: 140 }}>
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }} title={t.customer_email}>
                        {t.customer_email}
                      </p>
                      {ctx.company_name && (
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }} title={ctx.company_name}>
                          {ctx.company_name}
                        </p>
                      )}
                    </td>

                    {/* Message — 2-line clamp */}
                    <td className="px-3 py-4" style={{ maxWidth: 220 }}>
                      <span
                        className="text-xs"
                        style={{
                          color: 'var(--text-secondary)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.5,
                        }}
                        title={t.message}
                      >
                        {t.message}
                      </span>
                    </td>

                    {/* Intent */}
                    <td className="px-3 py-4">
                      <IntentBadge intent={t.intent} />
                    </td>

                    {/* Status */}
                    <td className="px-3 py-4">
                      <StatusBadge status={t.status} />
                    </td>

                    {/* AI Decision — minWidth 140 */}
                    <td className="px-3 py-4" style={{ minWidth: 140 }}>
                      <AiDecisionBadge status={t.status} escalateImmediately={t.escalate_immediately} />
                    </td>

                    {/* Confidence */}
                    <td className="px-3 py-4">
                      {confidence != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                            <div className="h-full rounded-full" style={{
                              width: `${confidence}%`,
                              background: confidence >= 80 ? 'var(--accent-green)' : confidence >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)',
                              transition: 'width 0.4s ease',
                            }} />
                          </div>
                          <span className="text-xs num font-semibold" style={{
                            color: confidence >= 80 ? 'var(--accent-green)' : confidence >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)',
                          }}>
                            {confidence}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--border-default)' }}>—</span>
                      )}
                    </td>

                    {/* MRR */}
                    <td className="px-3 py-4 whitespace-nowrap">
                      <MrrCell mrr={ctx.mrr ?? null} paymentStatus={ctx.payment_status} accountHealth={ctx.account_health} />
                    </td>

                    {/* Time */}
                    <td className="px-3 py-4">
                      <span className="mono tabular-nums" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {timeAgo(t.created_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-4">
                      <button
                        onClick={e => { e.stopPropagation(); onOpen(t) }}
                        className="w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-all"
                        style={{ color: 'var(--accent-primary)', background: 'rgba(88,166,255,0.1)' }}
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
