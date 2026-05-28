import { useState, useEffect } from 'react'
import { Shield, Zap, Database, CheckCircle2, AlertTriangle } from 'lucide-react'
import TopBar from '../components/TopBar'
import { PlanBadge } from '../components/StatusBadge'
import { getSettings, updateSettings } from '../api'

function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div
      className="flex items-center justify-between py-4"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
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
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
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

function SectionHeader({ children, accent }) {
  return (
    <div className="flex items-center gap-2.5 mb-1">
      <span className="w-0.5 h-4 rounded-full" style={{ background: accent || 'var(--accent-primary)' }} />
      <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</h2>
    </div>
  )
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

      <main className="min-h-screen" style={{ paddingTop: 48, paddingLeft: 220, background: 'var(--bg-base)' }}>
        <div className="p-5 max-w-2xl space-y-6">

          {/* Workspace */}
          <div>
            <SectionHeader>Workspace</SectionHeader>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Your Resolify account details.</p>
            <div className="p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              {loading ? (
                <div className="space-y-3">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-48 rounded" />
                </div>
              ) : !settings?.configured ? (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--accent-amber)' }}>
                  <AlertTriangle size={14} />
                  No client found. Insert a row into the{' '}
                  <code
                    className="px-1 py-0.5 rounded mono"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                  >
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

          {/* Agent behaviour */}
          <div>
            <SectionHeader accent="var(--accent-purple)">Agent Behaviour</SectionHeader>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Control how the AI agent handles tickets.</p>
            <div className="px-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <SettingRow
                icon={Shield}
                label="Draft Mode"
                description="AI generates responses but never sends them. Saved for human review."
              >
                {loading ? (
                  <div className="skeleton w-11 h-6 rounded-full" />
                ) : (
                  <Toggle
                    enabled={settings?.draft_mode ?? true}
                    onChange={toggleDraftMode}
                    saving={saving}
                  />
                )}
              </SettingRow>

              <SettingRow
                icon={Zap}
                label="Two-Stage Model"
                description="Haiku for simple how-to tickets, Sonnet for complex issues. Always on."
              >
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    background: 'rgba(63,185,80,0.08)',
                    color: 'var(--accent-green)',
                    border: '1px solid rgba(63,185,80,0.2)',
                  }}
                >
                  <CheckCircle2 size={11} /> Active
                </span>
              </SettingRow>

              <SettingRow
                icon={Database}
                label="Knowledge Base"
                description="Connect a vector DB for RAG-powered responses and knowledge gap detection."
              >
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    background: 'rgba(210,153,34,0.08)',
                    color: 'var(--accent-amber)',
                    border: '1px solid rgba(210,153,34,0.2)',
                  }}
                >
                  Not connected
                </span>
              </SettingRow>
            </div>
          </div>

        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-5 right-5 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium slide-in-right"
          style={{
            background: toast.type === 'success' ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(63,185,80,0.25)' : 'rgba(248,81,73,0.25)'}`,
            color: toast.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
            zIndex: 100,
          }}
        >
          {toast.type === 'success'
            ? <CheckCircle2 size={15} />
            : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}
    </>
  )
}
