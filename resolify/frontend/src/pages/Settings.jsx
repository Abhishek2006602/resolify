import { useState, useEffect } from 'react'
import { Shield, Zap, Database, CheckCircle2, AlertTriangle } from 'lucide-react'
import TopBar from '../components/TopBar'
import { PlanBadge } from '../components/StatusBadge'
import { getSettings, updateSettings } from '../api'

function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid #1e2130' }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: '#6366F115' }}>
          <Icon size={15} color="#818CF8" />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{description}</p>
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
        background: enabled ? '#6366F1' : '#2A2D3A',
        opacity: saving ? 0.6 : 1,
        cursor: saving ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
        style={{
          background: '#fff',
          left: enabled ? '22px' : '2px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  )
}

function SectionHeader({ children, accent = '#6366F1' }) {
  return (
    <div className="flex items-center gap-2.5 mb-1">
      <span className="w-0.5 h-4 rounded-full" style={{ background: accent }} />
      <h2 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>{children}</h2>
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

      <main className="pt-14 pl-60 min-h-screen" style={{ background: '#0F1117' }}>
        <div className="p-6 max-w-2xl space-y-6">

          {/* Client card */}
          <div>
            <SectionHeader>Workspace</SectionHeader>
            <p className="text-xs mb-4" style={{ color: '#334155' }}>Your Resolify account details.</p>
            <div className="p-5 rounded-xl" style={{ background: '#1A1D27', border: '1px solid #2A2D3A' }}>
              {loading ? (
                <div className="space-y-3">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-48 rounded" />
                </div>
              ) : !settings?.configured ? (
                <div className="flex items-center gap-2 text-xs" style={{ color: '#F59E0B' }}>
                  <AlertTriangle size={14} />
                  No client found. Insert a row into the <code className="px-1 py-0.5 rounded" style={{ background: '#2A2D3A' }}>clients</code> table in Supabase.
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold" style={{ color: '#F1F5F9' }}>{settings.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
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
            <SectionHeader accent="#818CF8">Agent Behaviour</SectionHeader>
            <p className="text-xs mb-4" style={{ color: '#334155' }}>Control how the AI agent handles tickets.</p>
            <div className="px-5 rounded-xl" style={{ background: '#1A1D27', border: '1px solid #2A2D3A' }}>
              <SettingRow
                icon={Shield}
                label="Draft Mode"
                description="AI generates responses but never sends them. Responses are saved for human review."
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
                description="Uses Claude Haiku for simple how-to tickets and Sonnet for complex issues. Always on."
              >
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: '#10B98112', color: '#34D399', border: '1px solid #10B98120' }}>
                  <CheckCircle2 size={11} /> Active
                </span>
              </SettingRow>

              <SettingRow
                icon={Database}
                label="Knowledge Base"
                description="Connect a vector DB to enable RAG-powered responses and knowledge gap detection."
              >
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: '#F59E0B12', color: '#F59E0B', border: '1px solid #F59E0B20' }}>
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
            background: toast.type === 'success' ? '#10B98118' : '#EF444418',
            border: `1px solid ${toast.type === 'success' ? '#10B98135' : '#EF444435'}`,
            color: toast.type === 'success' ? '#10B981' : '#EF4444',
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
