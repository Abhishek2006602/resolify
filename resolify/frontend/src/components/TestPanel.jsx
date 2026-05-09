import { useState } from 'react'
import { X, Send, CheckCircle2, AlertTriangle, Loader, Clock } from 'lucide-react'
import { sendTestTicket } from '../api'

const QUICK_FILL = [
  { label: 'Password reset',     message: 'I cannot log into my account, how do I reset my password?' },
  { label: 'Billing question',   message: 'I have a question about my recent charge' },
  { label: 'Cancel subscription',message: 'I want to cancel my subscription immediately' },
  { label: 'Export data',        message: 'How do I export my data to CSV?' },
]

const inputStyle = {
  background: '#0F1117',
  border: '1px solid #2A2D3A',
  color: '#F1F5F9',
}

export default function TestPanel({ onClose, onTicketSent }) {
  const [email,   setEmail]   = useState('')
  const [name,    setName]    = useState('')
  const [message, setMessage] = useState('')
  const [sending,   setSending]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [timedOut,  setTimedOut]  = useState(false)
  const [error,     setError]     = useState(null)

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
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] rounded-2xl z-50 fade-in overflow-hidden"
        style={{ background: '#1A1D27', border: '1px solid #2A2D3A' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #1e2130' }}
        >
          <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
            Send a Support Ticket
          </p>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{ color: '#475569' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ffffff10'; e.currentTarget.style.color = '#94A3B8' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569' }}
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
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: '#6366F118' }}>
                    <Clock size={24} color="#6366F1" />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#6366F1' }}>
                    Processing…
                  </p>
                  <p className="text-xs text-center" style={{ color: '#475569' }}>
                    Check your dashboard in a moment.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: '#10B98118' }}>
                    <CheckCircle2 size={24} color="#10B981" />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#10B981' }}>
                    Ticket processed!
                  </p>
                  <p className="text-xs" style={{ color: '#475569' }}>
                    Check your dashboard.
                  </p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {/* Email + Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>
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
                    onFocus={e => e.target.style.borderColor = '#6366F1'}
                    onBlur={e => e.target.style.borderColor = '#2A2D3A'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6366F1'}
                    onBlur={e => e.target.style.borderColor = '#2A2D3A'}
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>
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
                  onFocus={e => e.target.style.borderColor = '#6366F1'}
                  onBlur={e => e.target.style.borderColor = '#2A2D3A'}
                />

                {/* Quick fill buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_FILL.map(q => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => setMessage(q.message)}
                      className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                      style={{ background: '#ffffff08', color: '#64748B', border: '1px solid #2A2D3A' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#6366F115'; e.currentTarget.style.color = '#818CF8'; e.currentTarget.style.borderColor = '#6366F130' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#ffffff08'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#2A2D3A' }}
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
                  style={{ background: '#EF444412', border: '1px solid #EF444430', color: '#EF4444' }}
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
                  background: canSubmit ? '#6366F1' : '#2A2D3A',
                  color:      canSubmit ? '#fff'    : '#475569',
                  cursor:     sending ? 'wait' : canSubmit ? 'pointer' : 'default',
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
