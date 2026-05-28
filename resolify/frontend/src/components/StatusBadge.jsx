const STATUS_STYLES = {
  resolved:  { bg: 'rgba(63,185,80,0.12)',  color: '#3FB950', border: 'rgba(63,185,80,0.25)',  label: 'Resolved'  },
  escalated: { bg: 'rgba(248,81,73,0.12)',  color: '#F85149', border: 'rgba(248,81,73,0.25)',  label: 'Escalated' },
  pending:   { bg: 'rgba(210,153,34,0.12)', color: '#D29922', border: 'rgba(210,153,34,0.25)', label: 'Pending'   },
  enriched:  { bg: 'rgba(88,166,255,0.12)', color: '#58A6FF', border: 'rgba(88,166,255,0.25)', label: 'Enriched'  },
  queued:    { bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: 'rgba(139,92,246,0.25)', label: 'Queued'    },
}

const INTENT_STYLES = {
  billing:      { bg: 'rgba(210,153,34,0.12)', color: '#D29922', border: 'rgba(210,153,34,0.25)' },
  cancellation: { bg: 'rgba(248,81,73,0.12)',  color: '#F85149', border: 'rgba(248,81,73,0.25)'  },
  technical:    { bg: 'rgba(88,166,255,0.12)', color: '#58A6FF', border: 'rgba(88,166,255,0.25)' },
  account:      { bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: 'rgba(139,92,246,0.25)' },
  refund:       { bg: 'rgba(248,81,73,0.12)',  color: '#F85149', border: 'rgba(248,81,73,0.25)'  },
  general:      { bg: 'rgba(139,148,158,0.1)', color: '#8B949E', border: 'rgba(139,148,158,0.2)' },
  auth:         { bg: 'rgba(88,166,255,0.12)', color: '#58A6FF', border: 'rgba(88,166,255,0.25)' },
  howto:        { bg: 'rgba(63,185,80,0.12)',  color: '#3FB950', border: 'rgba(63,185,80,0.25)'  },
}

const PLAN_STYLES = {
  Free:    { bg: 'rgba(139,148,158,0.1)', color: '#8B949E' },
  Starter: { bg: 'rgba(88,166,255,0.12)', color: '#58A6FF' },
  Growth:  { bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6' },
  Scale:   { bg: 'rgba(210,153,34,0.12)', color: '#D29922' },
}

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
      {s.label}
    </span>
  )
}

export function IntentBadge({ intent }) {
  const s = INTENT_STYLES[intent] || INTENT_STYLES.general
  return (
    <span
      className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {intent || 'general'}
    </span>
  )
}

export function PlanBadge({ plan }) {
  const s = PLAN_STYLES[plan] || PLAN_STYLES.Free
  return (
    <span
      className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.color }}
    >
      {plan}
    </span>
  )
}
