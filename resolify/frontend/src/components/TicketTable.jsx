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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
        style={{ background: '#10B98118', color: '#10B981', border: '1px solid #10B98135' }}>
        ✓ Auto-resolved
      </span>
    )
  }
  if (status === 'escalated' && escalateImmediately) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
        style={{ background: '#EF444418', color: '#EF4444', border: '1px solid #EF444435' }}>
        ⚡ Urgent escalation
      </span>
    )
  }
  if (status === 'escalated') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
        style={{ background: '#F59E0B18', color: '#F59E0B', border: '1px solid #F59E0B35' }}>
        ↑ Low confidence
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: '#6B728018', color: '#9CA3AF', border: '1px solid #6B728035' }}>
      ⏳ Processing
    </span>
  )
}

function MrrCell({ mrr, paymentStatus, accountHealth }) {
  if (mrr == null) return <span className="text-xs" style={{ color: '#2A2D3A' }}>—</span>

  const atRisk = paymentStatus === 'past_due' || accountHealth === 'at_risk' || accountHealth === 'churning'
  const trialing = paymentStatus === 'trialing'

  if (atRisk) {
    return (
      <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#EF4444' }}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#EF4444' }} />
        ${mrr} at risk
      </span>
    )
  }
  if (trialing) {
    return <span className="text-sm font-medium" style={{ color: '#F59E0B' }}>${mrr} trial</span>
  }
  return <span className="text-sm font-medium" style={{ color: '#10B981' }}>${mrr}/mo</span>
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(10)].map((_, i) => (
        <td key={i} className="px-2 py-3.5">
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
            style={{ background: '#1A1D27', border: '1px solid #2A2D3A' }}>
            <Inbox size={22} style={{ color: '#94A3B8' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: '#F8FAFC' }}>No tickets yet</p>
          <p className="text-xs" style={{ color: '#94A3B8' }}>Send your first test ticket to get started</p>
        </div>
      </td>
    </tr>
  )
}

export default function TicketTable({ tickets, loading, onOpen }) {
  const cols = ['Ticket ID', 'Customer', 'Message', 'Intent', 'Status', 'AI Decision', 'Confidence', 'MRR', 'Time', '']

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#1A1D27', border: '1px solid #2A2D3A', overflowX: 'auto' }}>
      <table className="w-full" style={{ minWidth: '760px' }}>
        <thead style={{ position: 'sticky', top: 56, zIndex: 10, background: '#1A1D27' }}>
          <tr style={{ borderBottom: '1px solid #2A2D3A' }}>
            {cols.map(c => (
              <th key={c} className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                style={{ color: '#475569' }}>
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
              const ctx = t.customer_context || {}
              const confidence = t.confidence != null ? Math.round(t.confidence * 100) : null

              return (
                <tr key={t.id}
                  className="transition-all cursor-pointer group"
                  style={{ borderBottom: '1px solid #1e2130', borderLeft: '2px solid transparent' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#ffffff06'
                    e.currentTarget.style.borderLeftColor = '#6366F1'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderLeftColor = 'transparent'
                  }}
                  onClick={() => onOpen(t)}>

                  {/* Ticket ID */}
                  <td className="px-2 py-3.5">
                    <span className="font-mono text-xs font-semibold" style={{ color: '#6366F1' }}>
                      {t.ticket_id}
                    </span>
                  </td>

                  {/* Customer */}
                  <td className="px-2 py-3.5" style={{ maxWidth: '140px' }}>
                    <p className="text-sm font-medium truncate" style={{ color: '#F8FAFC' }} title={t.customer_email}>{t.customer_email}</p>
                    {ctx.company_name && <p className="text-xs truncate" style={{ color: '#94A3B8' }} title={ctx.company_name}>{ctx.company_name}</p>}
                  </td>

                  {/* Message */}
                  <td className="px-2 py-3.5" style={{ maxWidth: '160px' }}>
                    <span className="text-sm" style={{ color: '#94A3B8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={t.message}>
                      {t.message}
                    </span>
                  </td>

                  {/* Intent */}
                  <td className="px-2 py-3.5">
                    <IntentBadge intent={t.intent} />
                  </td>

                  {/* Status */}
                  <td className="px-2 py-3.5">
                    <StatusBadge status={t.status} />
                  </td>

                  {/* AI Decision */}
                  <td className="px-2 py-3.5 whitespace-nowrap">
                    <AiDecisionBadge status={t.status} escalateImmediately={t.escalate_immediately} />
                  </td>

                  {/* Confidence */}
                  <td className="px-2 py-3.5">
                    {confidence != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: '#1e2130' }}>
                          <div className="h-full rounded-full"
                            style={{
                              width: `${confidence}%`,
                              background: confidence >= 80
                                ? 'linear-gradient(90deg,#059669,#10B981)'
                                : confidence >= 60
                                ? 'linear-gradient(90deg,#D97706,#F59E0B)'
                                : 'linear-gradient(90deg,#DC2626,#EF4444)',
                              transition: 'width 0.4s ease',
                            }} />
                        </div>
                        <span className="text-xs num font-medium" style={{ color: confidence >= 80 ? '#10B981' : confidence >= 60 ? '#F59E0B' : '#EF4444' }}>{confidence}%</span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: '#2A2D3A' }}>—</span>
                    )}
                  </td>

                  {/* MRR */}
                  <td className="px-2 py-3.5 whitespace-nowrap">
                    <MrrCell
                      mrr={ctx.mrr ?? null}
                      paymentStatus={ctx.payment_status}
                      accountHealth={ctx.account_health}
                    />
                  </td>

                  {/* Time */}
                  <td className="px-2 py-3.5">
                    <span className="text-xs tabular-nums" style={{ color: '#94A3B8' }}>{timeAgo(t.created_at)}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-3.5">
                    <button
                      onClick={e => { e.stopPropagation(); onOpen(t) }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500/20"
                      style={{ color: '#6366F1' }}>
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
