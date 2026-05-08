import { useState } from 'react'
import { X, Send, CheckCircle2, AlertTriangle, Loader, ChevronDown } from 'lucide-react'
import { sendTestTicket } from '../api'

const PRESETS = [
  { label: 'Billing question', email: 'alice@acme.com', name: 'Alice', message: "Hi, I was charged twice this month. Can you check my invoice?" },
  { label: 'Technical bug', email: 'bob@startup.io', name: 'Bob', message: "The API keeps returning 504 errors when I call /v2/export. Started happening yesterday." },
  { label: 'How-to', email: 'carol@corp.com', name: 'Carol', message: "How do I export my data to CSV? I can't find the option anywhere in the settings." },
  { label: 'Cancellation', email: 'dave@firm.com', name: 'Dave', message: "I want to cancel my subscription. Please process the cancellation immediately." },
  { label: 'French ticket', email: 'emma@paris.fr', name: 'Emma', message: "Bonjour, je n'arrive pas à me connecter à mon compte. Pouvez-vous m'aider?" },
]

const STATUS_STYLE = {
  resolved:  { color: '#10B981', bg: '#10B98115', border: '#10B98130', icon: CheckCircle2, label: 'Auto-resolved' },
  escalated: { color: '#EF4444', bg: '#EF444415', border: '#EF444430', icon: AlertTriangle, label: 'Escalated' },
  queued:    { color: '#F59E0B', bg: '#F59E0B15', border: '#F59E0B30', icon: Loader, label: 'Queued for retry' },
}

export default function TestPanel({ onClose, onTicketSent }) {
  const [email, setEmail]       = useState('')
  const [name, setName]         = useState('')
  const [message, setMessage]   = useState('')
  const [sending, setSending]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState(null)
  const [showPresets, setShowPresets] = useState(false)

  function loadPreset(p) {
    setEmail(p.email)
    setName(p.name)
    setMessage(p.message)
    setResult(null)
    setError(null)
    setShowPresets(false)
  }

  async function submit(e) {
    e.preventDefault()
    if (!email.trim() || !message.trim()) return
    setSending(true)
    setResult(null)
    setError(null)
    try {
      const res = await sendTestTicket({
        ticket_id: `TEST-${Date.now()}`,
        customer_email: email.trim(),
        customer_name: name.trim() || undefined,
        message: message.trim(),
      })
      setResult(res)
      onTicketSent?.()
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setSending(false)
    }
  }

  const statusStyle = result ? (STATUS_STYLE[result.status] || STATUS_STYLE.queued) : null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] rounded-2xl z-50 fade-in overflow-hidden"
        style={{ background: '#1A1D27', border: '1px solid #2A2D3A' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #1e2130' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Send Test Ticket</p>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Fires the full AI pipeline</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{ color: '#475569' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ffffff10'; e.currentTarget.style.color = '#94A3B8' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569' }}>
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Presets dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPresets(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: '#0F1117', border: '1px solid #2A2D3A', color: '#94A3B8' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#6366F1'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2D3A'}
            >
              <span>Load a preset...</span>
              <ChevronDown size={13} style={{ transform: showPresets ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {showPresets && (
              <div className="absolute top-full mt-1 w-full rounded-xl overflow-hidden z-10 fade-in"
                style={{ background: '#13151f', border: '1px solid #2A2D3A' }}>
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => loadPreset(p)}
                    className="w-full text-left px-4 py-2.5 text-xs transition-all"
                    style={{ color: '#94A3B8', borderBottom: '1px solid #1e2130' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#ffffff08'; e.currentTarget.style.color = '#F1F5F9' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8' }}
                  >
                    <span className="font-medium" style={{ color: '#F1F5F9' }}>{p.label}</span>
                    <span className="ml-2" style={{ color: '#334155' }}>· {p.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#64748B' }}>Email *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all"
                  style={{ background: '#0F1117', border: '1px solid #2A2D3A', color: '#F1F5F9' }}
                  onFocus={e => e.target.style.borderColor = '#6366F1'}
                  onBlur={e => e.target.style.borderColor = '#2A2D3A'}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#64748B' }}>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all"
                  style={{ background: '#0F1117', border: '1px solid #2A2D3A', color: '#F1F5F9' }}
                  onFocus={e => e.target.style.borderColor = '#6366F1'}
                  onBlur={e => e.target.style.borderColor = '#2A2D3A'}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#64748B' }}>Message *</label>
              <textarea required value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Type the customer's message..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all resize-none"
                style={{ background: '#0F1117', border: '1px solid #2A2D3A', color: '#F1F5F9' }}
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2A2D3A'}
              />
            </div>

            <button type="submit" disabled={sending || !email || !message}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: sending || !email || !message ? '#2A2D3A' : '#6366F1',
                color: sending || !email || !message ? '#475569' : '#fff',
                cursor: sending ? 'wait' : 'pointer',
              }}>
              {sending
                ? <><Loader size={14} className="animate-spin" /> Processing…</>
                : <><Send size={14} /> Send Ticket</>
              }
            </button>
          </form>

          {/* Result */}
          {result && statusStyle && (
            <div className="rounded-xl p-4 fade-in space-y-2"
              style={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}` }}>
              <div className="flex items-center gap-2">
                <statusStyle.icon size={14} color={statusStyle.color} />
                <span className="text-sm font-semibold" style={{ color: statusStyle.color }}>
                  {statusStyle.label}
                </span>
                {result.intent && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                    style={{ background: '#ffffff10', color: '#94A3B8' }}>
                    {result.intent}
                  </span>
                )}
              </div>
              {result.confidence != null && (
                <p className="text-xs" style={{ color: '#64748B' }}>
                  Confidence: <span className="font-semibold num" style={{ color: statusStyle.color }}>
                    {Math.round(result.confidence * 100)}%
                  </span>
                  {result.model_used && <span className="ml-2">· {result.model_used}</span>}
                  {result.language && result.language !== 'en' && <span className="ml-2">· lang: {result.language}</span>}
                </p>
              )}
              {result.ai_response && (
                <p className="text-xs leading-relaxed mt-1 pt-2"
                  style={{ color: '#94A3B8', borderTop: `1px solid ${statusStyle.border}` }}>
                  {result.ai_response.length > 200 ? result.ai_response.slice(0, 200) + '…' : result.ai_response}
                </p>
              )}
              {result.ai_response_draft && (
                <p className="text-xs mt-1 pt-2 italic"
                  style={{ color: '#64748B', borderTop: `1px solid ${statusStyle.border}` }}>
                  Draft saved (not sent) — disable draft mode in Settings to send.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl p-3 fade-in flex items-center gap-2 text-xs"
              style={{ background: '#EF444415', border: '1px solid #EF444430', color: '#EF4444' }}>
              <AlertTriangle size={13} />
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
