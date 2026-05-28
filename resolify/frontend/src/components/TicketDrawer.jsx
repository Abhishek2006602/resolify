import { X, Copy, UserCheck, CheckCircle2, AlertTriangle, Calendar, CreditCard, Activity, Clock, Brain } from 'lucide-react'
import { IntentBadge, PlanBadge } from './StatusBadge'
import { useState } from 'react'

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <span className="flex items-center gap-1.5 text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
        {icon}{label}
      </span>
      <div className="text-xs font-medium text-right ml-4" style={{ color: 'var(--text-primary)' }}>{children}</div>
    </div>
  )
}

function SectionHeader({ children, accent }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {accent && <span className="w-0.5 h-3.5 rounded-full flex-shrink-0" style={{ background: accent }} />}
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
        {children}
      </p>
    </div>
  )
}

export default function TicketDrawer({ ticket, onClose }) {
  const [copied, setCopied]             = useState(false)
  const [summaryCopied, setSummaryCopied] = useState(false)
  const [sent, setSent]                 = useState(false)

  if (!ticket) return null

  const ctx = ticket.customer_context || {}
  const conf = ticket.confidence != null ? Math.round(ticket.confidence * 100) : null
  const confColor = conf == null
    ? 'var(--text-secondary)'
    : conf >= 85 ? 'var(--accent-green)'
    : conf >= 65 ? 'var(--accent-amber)'
    : 'var(--accent-red)'

  const atRisk = ctx.payment_status === 'past_due' || ctx.account_health === 'at_risk' || ctx.account_health === 'churning'
  const mrrColor = atRisk ? '#F85149' : ctx.payment_status === 'trialing' ? '#D29922' : '#3FB950'
  const mrrLabel = atRisk
    ? `$${ctx.mrr} at risk`
    : ctx.payment_status === 'trialing'
    ? `$${ctx.mrr} trial`
    : ctx.mrr != null ? `$${ctx.mrr}/mo` : '—'

  const healthColor = { healthy: '#3FB950', at_risk: '#D29922', churning: '#F85149' }[ctx.account_health] || 'var(--text-secondary)'
  const paymentColor = { active: '#3FB950', trialing: '#58A6FF', past_due: '#D29922', cancelled: '#F85149' }[ctx.payment_status] || 'var(--text-secondary)'

  const actions = Array.isArray(ctx.last_3_actions)
    ? ctx.last_3_actions
    : typeof ctx.last_3_actions === 'string'
    ? ctx.last_3_actions.split(/,\s*/)
    : []

  function copyText(text, setter) {
    navigator.clipboard.writeText(text || '')
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  let decisionLabel, decisionColor, decisionBg, decisionBorder, reasonText, reasonBg, reasonBorder, reasonColor
  if (ticket.status === 'resolved') {
    decisionLabel = '✓ AUTO-RESOLVED'
    decisionColor = '#3FB950'
    decisionBg    = 'rgba(63,185,80,0.08)'
    decisionBorder = 'rgba(63,185,80,0.2)'
    reasonText    = 'Confidence above threshold — auto-resolved'
    reasonBg      = 'rgba(63,185,80,0.06)'
    reasonBorder  = 'rgba(63,185,80,0.15)'
    reasonColor   = '#3FB950'
  } else if (ticket.escalate_immediately) {
    decisionLabel = '⚡ ESCALATE IMMEDIATELY'
    decisionColor = '#F85149'
    decisionBg    = 'rgba(248,81,73,0.08)'
    decisionBorder = 'rgba(248,81,73,0.2)'
    reasonText    = ticket.escalation_summary
      ? (ticket.escalation_summary.split('\n').find(l => l.includes('Action needed:'))?.replace('⚠️  Action needed:', '').trim() || ticket.escalate_reason || 'Flagged for immediate escalation')
      : (ticket.escalate_reason || 'Flagged for immediate escalation')
    reasonBg      = 'rgba(248,81,73,0.06)'
    reasonBorder  = 'rgba(248,81,73,0.15)'
    reasonColor   = '#F85149'
  } else {
    decisionLabel = '↑ ESCALATED — Low confidence'
    decisionColor = '#D29922'
    decisionBg    = 'rgba(210,153,34,0.08)'
    decisionBorder = 'rgba(210,153,34,0.2)'
    reasonText    = `Confidence ${conf != null ? conf + '%' : 'unknown'} — below auto-resolve threshold`
    reasonBg      = 'rgba(210,153,34,0.06)'
    reasonBorder  = 'rgba(210,153,34,0.15)'
    reasonColor   = '#D29922'
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-screen flex flex-col slide-in-right z-50 overflow-hidden"
        style={{
          width: 420,
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)', height: 56 }}
        >
          <div>
            <p className="mono text-xs mb-0.5" style={{ color: 'var(--accent-primary)', fontSize: 11 }}>
              {ticket.ticket_id}
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ticket.customer_email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── AI Decision ── */}
          <section>
            <SectionHeader accent="var(--accent-primary)">
              <span className="flex items-center gap-1.5"><Brain size={11} color="var(--accent-primary)" /> AI Decision</span>
            </SectionHeader>

            <div
              className="p-4 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Classified intent</p>
                  <IntentBadge intent={ticket.intent} />
                </div>
                {conf != null && (
                  <div className="text-right">
                    <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Confidence</p>
                    <p className="text-2xl font-bold tabular-nums num" style={{ color: confColor }}>{conf}%</p>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg mb-3" style={{ background: decisionBg, border: `1px solid ${decisionBorder}` }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-secondary)' }}>Action taken</p>
                <p className="text-sm font-bold" style={{ color: decisionColor }}>{decisionLabel}</p>
              </div>

              <div className="p-3 rounded-lg" style={{ background: reasonBg, border: `1px solid ${reasonBorder}` }}>
                <p className="text-xs leading-relaxed" style={{ color: reasonColor }}>{reasonText}</p>
              </div>
            </div>
          </section>

          {/* ── Customer Context ── */}
          {Object.keys(ctx).length > 0 && (
            <section>
              <SectionHeader accent="var(--accent-purple)">Customer Context</SectionHeader>
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{ctx.company_name || '—'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{ticket.customer_email}</p>
                  </div>
                  {ctx.plan && <PlanBadge plan={ctx.plan} />}
                </div>

                {ctx.mrr != null && (
                  <div className="flex items-baseline gap-1 mb-3 pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="text-xl font-bold" style={{ color: mrrColor }}>{mrrLabel}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>MRR</span>
                  </div>
                )}

                <InfoRow icon={<CreditCard size={11} />} label="Payment">
                  <span style={{ color: paymentColor }}>● {ctx.payment_status}</span>
                </InfoRow>
                <InfoRow icon={<Activity size={11} />} label="Health">
                  <span style={{ color: healthColor }}>● {ctx.account_health}</span>
                </InfoRow>
                <InfoRow icon={<Calendar size={11} />} label="Customer age">
                  {ctx.days_as_customer} days
                </InfoRow>
                <InfoRow icon={<Clock size={11} />} label="Tickets this month">
                  {ctx.total_tickets_this_month}
                </InfoRow>

                {actions.length > 0 && (
                  <div className="pt-3">
                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Recent activity</p>
                    <div className="space-y-1.5">
                      {actions.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--accent-primary)' }} />
                          {a}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Customer Message ── */}
          <section>
            <SectionHeader accent="var(--border-default)">Customer Message</SectionHeader>
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'var(--bg-elevated)',
                borderLeft: '3px solid var(--accent-primary)',
                borderTop: '1px solid var(--border-subtle)',
                borderRight: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{ticket.message}</p>
            </div>
          </section>

          {/* ── AI Response or Escalation ── */}
          {ticket.status === 'resolved' && ticket.ai_response ? (
            <section>
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl"
                style={{ background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.2)', borderBottom: 'none' }}
              >
                <CheckCircle2 size={13} color="#3FB950" />
                <p className="text-xs font-semibold" style={{ color: '#3FB950' }}>
                  AI Response — Ready to send
                </p>
              </div>
              <div
                className="p-4 rounded-b-xl mb-3"
                style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(63,185,80,0.15)', borderTop: 'none' }}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                  {ticket.ai_response}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyText(ticket.ai_response, setCopied)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: 'var(--accent-primary)', color: '#fff' }}
                >
                  <Copy size={13} />
                  {copied ? 'Copied!' : 'Copy Response'}
                </button>
                <button
                  onClick={() => setSent(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{
                    background: sent ? 'rgba(63,185,80,0.1)' : 'var(--bg-elevated)',
                    color: sent ? '#3FB950' : 'var(--text-secondary)',
                    border: `1px solid ${sent ? 'rgba(63,185,80,0.25)' : 'var(--border-subtle)'}`,
                  }}
                >
                  {sent ? '✓ Marked as Sent' : 'Mark as Sent'}
                </button>
              </div>
            </section>
          ) : ticket.escalation_summary ? (
            <section>
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl"
                style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)', borderBottom: 'none' }}
              >
                <AlertTriangle size={13} color="#F85149" />
                <p className="text-xs font-semibold" style={{ color: '#F85149' }}>
                  Escalated to Human Agent
                </p>
              </div>
              <div
                className="p-4 rounded-b-xl mb-3"
                style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(248,81,73,0.15)', borderTop: 'none' }}
              >
                <p className="text-xs leading-relaxed whitespace-pre-wrap mono" style={{ color: 'var(--text-primary)' }}>
                  {ticket.escalation_summary}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyText(ticket.escalation_summary, setSummaryCopied)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                >
                  <Copy size={13} />
                  {summaryCopied ? 'Copied!' : 'Copy Summary'}
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: '#F85149', color: '#fff' }}
                >
                  <UserCheck size={13} />
                  Assign to Agent
                </button>
              </div>
            </section>
          ) : null}

          <div className="h-4" />
        </div>
      </div>
    </>
  )
}
