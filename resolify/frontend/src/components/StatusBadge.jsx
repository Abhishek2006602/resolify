const STATUS_STYLES = {
  resolved:  { bg: '#10B98120', color: '#10B981', border: '#10B98140', label: 'Resolved'  },
  escalated: { bg: '#EF444420', color: '#EF4444', border: '#EF444440', label: 'Escalated' },
  pending:   { bg: '#F59E0B20', color: '#F59E0B', border: '#F59E0B40', label: 'Pending'   },
  enriched:  { bg: '#6366F120', color: '#6366F1', border: '#6366F140', label: 'Enriched'  },
}

const INTENT_STYLES = {
  billing:      { bg: '#F59E0B20', color: '#F59E0B', border: '#F59E0B40' },
  cancellation: { bg: '#EF444420', color: '#EF4444', border: '#EF444440' },
  technical:    { bg: '#3B82F620', color: '#60A5FA', border: '#3B82F640' },
  account:      { bg: '#8B5CF620', color: '#A78BFA', border: '#8B5CF640' },
  refund:       { bg: '#EF444420', color: '#EF4444', border: '#EF444440' },
  general:      { bg: '#6B728020', color: '#9CA3AF', border: '#6B728040' },
  auth:         { bg: '#3B82F620', color: '#60A5FA', border: '#3B82F640' },
}

const PLAN_STYLES = {
  Free:    { bg: '#6B728020', color: '#9CA3AF' },
  Starter: { bg: '#3B82F620', color: '#60A5FA' },
  Growth:  { bg: '#6366F120', color: '#818CF8' },
  Scale:   { bg: '#F59E0B20', color: '#F59E0B' },
}

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide"
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
      className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize tracking-wide"
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
      className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      {plan}
    </span>
  )
}
