import { X, Copy, UserCheck, CheckCircle2, AlertTriangle, Calendar, CreditCard, Activity, Clock, Brain } from 'lucide-react'
import { IntentBadge, PlanBadge } from './StatusBadge'
import { useState } from 'react'

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #2A2D3A' }}>
      <span className="flex items-center gap-1.5 text-xs flex-shrink-0" style={{ color: '#94A3B8' }}>
        {icon}{label}
      </span>
      <div className="text-xs font-medium text-right ml-4" style={{ color: '#F8FAFC' }}>{children}</div>
    </div>
  )
}

function SectionHeader({ children, accent }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {accent && <span className="w-0.5 h-3.5 rounded-full flex-shrink-0" style={{ background: accent }} />}
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>
        {children}
      </p>
    </div>
  )
}

export default function TicketDrawer({ ticket, onClose }) {
  const [copied, setCopied]         = useState(false)
  const [summaryCopied, setSummaryCopied] = useState(false)
  const [sent, setSent]             = useState(false)

  if (!ticket) return null

  const ctx = ticket.customer_context || {}
  const conf = ticket.confidence != null ? Math.round(ticket.confidence * 100) : null
  const confColor = conf == null ? '#94A3B8' : conf >= 85 ? '#10B981' : conf >= 65 ? '#F59E0B' : '#EF4444'

  const atRisk = ctx.payment_status === 'past_due' || ctx.account_health === 'at_risk' || ctx.account_health === 'churning'
  const mrrColor = atRisk ? '#EF4444' : ctx.payment_status === 'trialing' ? '#F59E0B' : '#10B981'
  const mrrLabel = atRisk
    ? `$${ctx.mrr} at risk`
    : ctx.payment_status === 'trialing'
    ? `$${ctx.mrr} trial`
    : ctx.mrr != null ? `$${ctx.mrr}/mo` : '—'

  const healthColor = { healthy: '#10B981', at_risk: '#F59E0B', churning: '#EF4444' }[ctx.account_health] || '#94A3B8'
  const paymentColor = { active: '#10B981', trialing: '#6366F1', past_due: '#F59E0B', cancelled: '#EF4444' }[ctx.payment_status] || '#94A3B8'

  // Normalize last_3_actions — may arrive as array or space-joined string
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

  // AI decision label & colors
  let decisionLabel, decisionColor, decisionBg, decisionBorder, reasonText, reasonBg, reasonBorder, reasonColor
  if (ticket.status === 'resolved') {
    decisionLabel = '✓ AUTO-RESOLVED'
    decisionColor = '#10B981'
    decisionBg    = '#10B98115'
    decisionBorder = '#10B98135'
    reasonText    = 'Confidence above threshold — auto-resolved'
    reasonBg      = '#10B98110'
    reasonBorder  = '#10B98130'
    reasonColor   = '#10B981'
  } else if (ticket.escalate_immediately) {
    decisionLabel = '⚡ ESCALATE IMMEDIATELY'
    decisionColor = '#EF4444'
    decisionBg    = '#EF444415'
    decisionBorder = '#EF444435'
    reasonText    = ticket.escalation_summary ? (ticket.escalation_summary.split('\n').find(l => l.includes('Action needed:'))?.replace('⚠️  Action needed:', '').trim() || ticket.escalate_reason || 'Flagged for immediate escalation') : (ticket.escalate_reason || 'Flagged for immediate escalation')
    reasonBg      = '#EF444410'
    reasonBorder  = '#EF444430'
    reasonColor   = '#EF4444'
  } else {
    decisionLabel = '↑ ESCALATED — Low confidence'
    decisionColor = '#F59E0B'
    decisionBg    = '#F59E0B15'
    decisionBorder = '#F59E0B35'
    reasonText    = `Confidence ${conf != null ? conf + '%' : 'unknown'} — below auto-resolve threshold`
    reasonBg      = '#F59E0B10'
    reasonBorder  = '#F59E0B30'
    reasonColor   = '#F59E0B'
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-screen w-[440px] flex flex-col slide-in-right z-50 overflow-hidden"
        style={{ background: '#1A1D27', borderLeft: '1px solid #2A2D3A' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #2A2D3A' }}>
          <div>
            <p className="font-mono text-xs mb-1" style={{ color: '#6366F1' }}>{ticket.ticket_id}</p>
            <p className="text-sm font-medium" style={{ color: '#F8FAFC' }}>{ticket.customer_email}</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all"
            style={{ color: '#94A3B8' }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── SECTION 1: AI Decision Panel ── */}
          <section>
            <SectionHeader accent="#6366F1">
              <span className="flex items-center gap-1.5"><Brain size={12} color="#6366F1" /> AI Decision</span>
            </SectionHeader>

            <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #1a1c35 0%, #13152a 100%)', border: '1px solid #2D3050' }}>
              {/* Intent + Confidence row */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs mb-1.5" style={{ color: '#94A3B8' }}>Classified intent</p>
                  <IntentBadge intent={ticket.intent} />
                </div>
                {conf != null && (
                  <div className="text-right">
                    <p className="text-xs mb-1" style={{ color: '#94A3B8' }}>Confidence</p>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: confColor }}>{conf}%</p>
                  </div>
                )}
              </div>

              {/* Action taken */}
              <div className="p-3 rounded-lg mb-3" style={{ background: decisionBg, border: `1px solid ${decisionBorder}` }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#94A3B8' }}>Action taken</p>
                <p className="text-sm font-bold" style={{ color: decisionColor }}>{decisionLabel}</p>
              </div>

              {/* Reason box */}
              <div className="p-3 rounded-lg" style={{ background: reasonBg, border: `1px solid ${reasonBorder}` }}>
                <p className="text-xs leading-relaxed" style={{ color: reasonColor }}>{reasonText}</p>
              </div>
            </div>
          </section>

          {/* ── SECTION 2: Customer Context ── */}
          {Object.keys(ctx).length > 0 && (
            <section>
              <SectionHeader accent="#818CF8">Customer Context</SectionHeader>
              <div className="p-4 rounded-xl" style={{ background: '#0F1117', border: '1px solid #2A2D3A' }}>

                {/* Company + Plan */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-base font-semibold" style={{ color: '#F8FAFC' }}>{ctx.company_name || '—'}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{ticket.customer_email}</p>
                  </div>
                  {ctx.plan && <PlanBadge plan={ctx.plan} />}
                </div>

                {/* MRR */}
                {ctx.mrr != null && (
                  <div className="flex items-baseline gap-1 mb-3 pb-3" style={{ borderBottom: '1px solid #2A2D3A' }}>
                    <span className="text-2xl font-bold" style={{ color: mrrColor }}>{mrrLabel}</span>
                    <span className="text-xs" style={{ color: '#94A3B8' }}>MRR</span>
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
                    <p className="text-xs mb-2" style={{ color: '#94A3B8' }}>Recent activity</p>
                    <div className="space-y-1.5">
                      {actions.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#F8FAFC' }}>
                          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#6366F1' }} />
                          {a}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── SECTION 3: Customer Message ── */}
          <section>
            <SectionHeader accent="#475569">Customer Message</SectionHeader>
            <div className="p-4 rounded-xl" style={{ background: '#0F1117', borderLeft: '3px solid #6366F1', borderTop: '1px solid #2A2D3A', borderRight: '1px solid #2A2D3A', borderBottom: '1px solid #2A2D3A' }}>
              <p className="text-sm leading-relaxed" style={{ color: '#F8FAFC' }}>{ticket.message}</p>
            </div>
          </section>

          {/* ── SECTION 4: AI Response or Escalation ── */}
          {ticket.status === 'resolved' && ticket.ai_response ? (
            <section>
              {/* Green header bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl"
                style={{ background: '#10B98120', border: '1px solid #10B98135', borderBottom: 'none' }}>
                <CheckCircle2 size={14} color="#10B981" />
                <p className="text-xs font-semibold" style={{ color: '#10B981' }}>
                  AI Response Generated — Ready to send
                </p>
              </div>
              <div className="p-4 rounded-b-xl mb-3"
                style={{ background: '#0F1117', border: '1px solid #10B98125', borderTop: 'none' }}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#F8FAFC' }}>
                  {ticket.ai_response}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyText(ticket.ai_response, setCopied)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: '#6366F1', color: '#fff' }}>
                  <Copy size={14} />
                  {copied ? 'Copied!' : 'Copy Response'}
                </button>
                <button onClick={() => setSent(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: sent ? '#10B98120' : '#ffffff10', color: sent ? '#10B981' : '#94A3B8', border: `1px solid ${sent ? '#10B98135' : '#2A2D3A'}` }}>
                  {sent ? '✓ Marked as Sent' : 'Mark as Sent'}
                </button>
              </div>
            </section>
          ) : ticket.escalation_summary ? (
            <section>
              {/* Red header bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl"
                style={{ background: '#EF444420', border: '1px solid #EF444435', borderBottom: 'none' }}>
                <AlertTriangle size={14} color="#EF4444" />
                <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>
                  Escalated to Human Agent
                </p>
              </div>
              <div className="p-4 rounded-b-xl mb-3"
                style={{ background: '#0F1117', border: '1px solid #EF444425', borderTop: 'none' }}>
                <p className="text-xs leading-relaxed whitespace-pre-wrap font-mono" style={{ color: '#F8FAFC' }}>
                  {ticket.escalation_summary}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyText(ticket.escalation_summary, setSummaryCopied)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: '#ffffff10', color: '#94A3B8', border: '1px solid #2A2D3A' }}>
                  <Copy size={14} />
                  {summaryCopied ? 'Copied!' : 'Copy Summary'}
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: '#EF4444', color: '#fff' }}>
                  <UserCheck size={14} />
                  Assign to Agent
                </button>
              </div>
            </section>
          ) : null}

          {/* Bottom padding */}
          <div className="h-4" />
        </div>
      </div>
    </>
  )
}
