import { useState, useEffect } from 'react'
import { Shield, Zap, Database, CheckCircle2, AlertTriangle, Link, BarChart2, Lock } from 'lucide-react'
import TopBar from '../components/TopBar'
import { PlanBadge } from '../components/StatusBadge'
import { getSettings, updateSettings } from '../api'

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-subtle)',
}

function SettingRow({ icon: Icon, label, description, children, last }) {
  return (
    <div
      className="flex items-center justify-between py-4"
      style={{ borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(88,166,255,0.08)' }}
        >
          <Icon size={15} color="var(--accent-primary)" />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
          {description && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
          )}
        </div>
      </div>
      <div className="ml-6 flex-shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ enabled, onChange, saving }) {
  return (
    <button
      onClick={() => !saving && onChange(!enabled)}
      className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
      style={{
        background: enabled ? 'var(--accent-primary)' : 'var(--border-default)',
        opacity: saving ? 0.6 : 1,
        cursor: saving ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
        style={{
          background: '#fff',
          left: enabled ? '22px' : '2px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
        }}
      />
    </button>
  )
}

function SectionHeader({ children, accent, sub }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="w-0.5 h-4 rounded-full" style={{ background: accent || 'var(--accent-primary)' }} />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</h2>
      </div>
      {sub && <p className="text-xs ml-3.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

const greenBadge = {
  background: 'rgba(63,185,80,0.1)',
  color: 'var(--accent-green)',
  border: '1px solid rgba(63,185,80,0.2)',
  borderRadius: 999,
  padding: '2px 10px',
  fontSize: 12,
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  whiteSpace: 'nowrap',
}

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings({ configured: false }))
      .finally(() => setLoading(false))
  }, [])

  async function toggleDraftMode(val) {
    setSaving(true)
    try {
      await updateSettings({ draft_mode: val })
      setSettings(s => ({ ...s, draft_mode: val }))
      showToast('success', `Draft mode ${val ? 'enabled' : 'disabled'}`)
    } catch {
      showToast('error', 'Failed to save — check your connection')
    } finally {
      setSaving(false)
    }
  }

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const since = settings?.created_at
    ? new Date(settings.created_at).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <>
      <TopBar title="Settings" />

      <main
        className="min-h-screen"
        style={{ paddingTop: 48, paddingLeft: 'var(--sidebar-w)', background: 'var(--bg-base)' }}
      >
        <div className="p-5 max-w-2xl space-y-6">

          {/* ── Workspace ── */}
          <div>
            <SectionHeader sub="Your Resolify account details.">Workspace</SectionHeader>
            <div className="p-5 rounded-xl" style={cardStyle}>
              {loading ? (
                <div className="space-y-3">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-48 rounded" />
                </div>
              ) : !settings?.configured ? (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--accent-amber)' }}>
                  <AlertTriangle size={14} />
                  No client found. Insert a row into the{' '}
                  <code className="px-1 py-0.5 rounded mono"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                    clients
                  </code>{' '}
                  table in Supabase.
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{settings.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {settings.total_tickets} ticket{settings.total_tickets !== 1 ? 's' : ''} processed
                      {since && ` · Since ${since}`}
                    </p>
                  </div>
                  <PlanBadge plan={settings.plan} />
                </div>
              )}
            </div>
          </div>

          {/* ── Agent Behaviour ── */}
          <div>
            <SectionHeader accent="var(--accent-purple)" sub="Control how the AI agent handles tickets.">
              Agent Behaviour
            </SectionHeader>
            <div className="px-5 rounded-xl" style={cardStyle}>
              <SettingRow
                icon={Shield}
                label="Draft Mode"
                description="AI generates responses but never sends them. Saved for human review."
              >
                {loading ? (
                  <div className="skeleton w-11 h-6 rounded-full" />
                ) : (
                  <Toggle enabled={settings?.draft_mode ?? true} onChange={toggleDraftMode} saving={saving} />
                )}
              </SettingRow>

              <SettingRow
                icon={Zap}
                label="Two-Stage Model"
                description="Haiku for simple how-to tickets, Sonnet for complex issues. Always on."
              >
                <span style={greenBadge}><CheckCircle2 size={11} /> Active</span>
              </SettingRow>

              {/* Fix 11 — Knowledge base: 10 documents indexed */}
              <SettingRow
                icon={Database}
                label="Knowledge Base"
                description="Vector DB for RAG-powered responses and knowledge gap detection."
                last
              >
                <span style={greenBadge}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-green)' }} />
                  10 documents
                </span>
              </SettingRow>
            </div>
          </div>

          {/* ── Fix 12: Usage & Limits ── */}
          <div>
            <SectionHeader accent="var(--accent-amber)" sub="Monthly usage and plan limits.">
              Usage &amp; Limits
            </SectionHeader>
            <div className="p-5 rounded-xl" style={cardStyle}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tickets this month</span>
                <span className="text-sm font-semibold num" style={{ color: 'var(--text-primary)' }}>15 / 1,000</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'var(--border-subtle)' }}>
                <div style={{ width: '1.5%', height: '100%', background: 'var(--accent-primary)', borderRadius: 99 }} />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Plan: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Starter</span>
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Renewal: June 6, 2026</span>
              </div>
            </div>
          </div>

          {/* ── Fix 12: Integrations ── */}
          <div>
            <SectionHeader accent="var(--accent-primary)" sub="Connect your existing tools to Resolify.">
              Integrations
            </SectionHeader>
            <div className="px-5 rounded-xl" style={cardStyle}>
              {[
                { name: 'Intercom',  desc: 'Receive tickets from Intercom conversations', emoji: '💬' },
                { name: 'Stripe',    desc: 'Enrich tickets with billing context',          emoji: '💳' },
                { name: 'HubSpot',   desc: 'Sync escalated tickets to your CRM',           emoji: '🟠' },
              ].map((item, i, arr) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between py-4"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{item.emoji}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                  </div>
                  <button
                    className="flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: 'rgba(88,166,255,0.08)',
                      color: 'var(--accent-primary)',
                      border: '1px solid rgba(88,166,255,0.2)',
                      padding: '6px 14px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(88,166,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(88,166,255,0.08)'}
                  >
                    <Link size={12} />
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Fix 12: AI Safety ── */}
          <div>
            <SectionHeader accent="var(--accent-red)" sub="Guardrails that control AI escalation behaviour.">
              AI Safety
            </SectionHeader>
            <div className="px-5 rounded-xl" style={cardStyle}>
              {[
                { label: 'Escalate billing tickets',  desc: 'Payment-sensitive tickets always go to a human' },
                { label: 'Escalate cancellations',    desc: 'Retention opportunities are never auto-closed'  },
              ].map((rule, i) => (
                <div
                  key={rule.label}
                  className="flex items-center justify-between py-4"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{rule.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{rule.desc}</p>
                  </div>
                  <span style={greenBadge}><CheckCircle2 size={11} /> Always on</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Max confidence threshold</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Auto-resolve only above this confidence level
                  </p>
                </div>
                <span
                  className="mono font-bold num"
                  style={{ color: 'var(--text-primary)', fontSize: 20 }}
                >
                  75%
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-5 right-5 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium slide-in-right"
          style={{
            background: toast.type === 'success' ? 'rgba(63,185,80,0.1)'  : 'rgba(248,81,73,0.1)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(63,185,80,0.25)' : 'rgba(248,81,73,0.25)'}`,
            color: toast.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
            zIndex: 100,
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}
    </>
  )
}
