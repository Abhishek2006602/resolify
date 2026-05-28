import { useState } from 'react'
import { X, Send, CheckCircle2, AlertTriangle, Loader, Clock } from 'lucide-react'
import { sendTestTicket } from '../api'

const QUICK_FILL = [
  { label: 'Password reset',      message: 'I cannot log into my account, how do I reset my password?' },
  { label: 'Billing question',    message: 'I have a question about my recent charge' },
  { label: 'Cancel subscription', message: 'I want to cancel my subscription immediately' },
  { label: 'Export data',         message: 'How do I export my data to CSV?' },
]

const inputStyle = {
  background: 'var(--bg-base)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
}

export default function TestPanel({ onClose, onTicketSent }) {
  const [email,   setEmail]   = useState('')
  const [name,    setName]    = useState('')
  const [message, setMessage] = useState('')
  const [sending,  setSending]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [error,    setError]    = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!email.trim() || !message.trim()) return
    setSending(true)
    setError(null)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30_000)

    try {
      await sendTestTicket({
        ticket_id:      `test_${Date.now()}`,
        customer_email: email.trim(),
        customer_name:  name.trim() || undefined,
        message:        message.trim(),
      }, controller.signal)
      clearTimeout(timer)
      setSuccess(true)
      onTicketSent?.()
      setTimeout(onClose, 2000)
    } catch (err) {
      clearTimeout(timer)
      if (err.name === 'AbortError') {
        setTimedOut(true)
        onTicketSent?.()
        setTimeout(onClose, 3500)
      } else {
        setError(err.message || 'Request failed — is the backend running?')
      }
    } finally {
      setSending(false)
    }
  }

  const canSubmit = !sending && email.trim() && message.trim()

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] rounded-2xl z-50 fade-in overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Send a Support Ticket
          </p>
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

        <div className="px-5 py-4">
          {/* Success / timeout state */}
          {success || timedOut ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 fade-in">
              {timedOut ? (
                <>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(88,166,255,0.1)' }}
                  >
                    <Clock size={24} color="var(--accent-primary)" />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>Processing…</p>
                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    Check your dashboard in a moment.
                  </p>
                </>
              ) : (
                <>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(63,185,80,0.1)' }}
                  >
                    <CheckCircle2 size={24} color="var(--accent-green)" />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--accent-green)' }}>Ticket processed!</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Check your dashboard.</p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {/* Email + Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Customer Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="customer@company.com"
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Message *
                </label>
                <textarea
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type your support message here..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all resize-none"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                />

                {/* Quick fill */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_FILL.map(q => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => setMessage(q.message)}
                      className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(88,166,255,0.08)'; e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'rgba(88,166,255,0.2)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs fade-in"
                  style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)', color: '#F85149' }}
                >
                  <AlertTriangle size={13} />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: canSubmit ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  color:      canSubmit ? '#fff' : 'var(--text-muted)',
                  cursor:     sending ? 'wait' : canSubmit ? 'pointer' : 'default',
                  boxShadow:  canSubmit ? '0 4px 16px rgba(88,166,255,0.25)' : 'none',
                }}
              >
                {sending
                  ? <><Loader size={14} className="animate-spin" /> Processing…</>
                  : <><Send size={14} /> Send Ticket →</>
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
