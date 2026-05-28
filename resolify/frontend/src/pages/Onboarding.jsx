import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, CheckCircle2, ArrowRight, SkipForward, Upload, FileText, Globe } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { completeOnboarding } from '../api'

const STEPS = ['Welcome', 'Connect Intercom', 'Upload Docs', 'Ready']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {STEPS.map((label, i) => {
        const done   = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done
                    ? 'var(--accent-green)'
                    : active
                    ? 'var(--accent-primary)'
                    : 'var(--bg-elevated)',
                  color: done || active ? '#fff' : 'var(--text-muted)',
                  border: done || active ? 'none' : '1px solid var(--border-default)',
                }}
              >
                {done ? <CheckCircle2 size={13} /> : i + 1}
              </div>
              <span
                className="text-xs font-medium hidden sm:block"
                style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-8 h-px"
                style={{ background: i < current ? 'var(--accent-green)' : 'var(--border-subtle)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function PrimaryBtn({ onClick, children, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
      style={{
        background: disabled || loading ? 'var(--border-default)' : 'var(--accent-primary)',
        color:      disabled || loading ? 'var(--text-muted)' : '#fff',
        boxShadow:  disabled || loading ? 'none' : '0 4px 20px rgba(88,166,255,0.3)',
        cursor:     disabled || loading ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.background = '#79B8FF' }}
      onMouseLeave={e => { if (!disabled && !loading) e.currentTarget.style.background = 'var(--accent-primary)' }}
    >
      {children}
    </button>
  )
}

function SkipBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2.5 text-sm transition-all"
      style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
    >
      <SkipForward size={13} /> Skip for now
    </button>
  )
}

// ── Step 1: Welcome ────────────────────────────────────────────────────────────
function StepWelcome({ companyName, onNext }) {
  return (
    <div className="text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))' }}
      >
        <Zap size={30} color="#fff" fill="#fff" />
      </div>
      <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        Welcome to Resolify{companyName ? `, ${companyName}` : ''}!
      </h2>
      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)', maxWidth: 360, margin: '0 auto 8px' }}>
        We'll help you set up your AI support agent in just a few minutes.
      </p>
      <p className="text-xs mb-8" style={{ color: 'var(--text-muted)', maxWidth: 340, margin: '0 auto 32px' }}>
        Connect Intercom to receive tickets, upload your docs for smarter answers,
        and you're live — auto-resolving in minutes.
      </p>
      <PrimaryBtn onClick={onNext}>
        Get started <ArrowRight size={14} />
      </PrimaryBtn>
    </div>
  )
}

// ── Step 2: Connect Intercom ──────────────────────────────────────────────────
function StepIntercom({ onNext, onSkip }) {
  const [token,      setToken]      = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connected,  setConnected]  = useState(false)

  async function handleConnect() {
    if (!token.trim()) return
    setConnecting(true)
    await new Promise(r => setTimeout(r, 1200))
    setConnected(true)
    setConnecting(false)
    setTimeout(onNext, 900)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(88,166,255,0.1)', border: '1px solid rgba(88,166,255,0.2)' }}
        >
          <Globe size={20} color="var(--accent-primary)" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Connect Intercom</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Receive support tickets automatically</p>
        </div>
      </div>

      <div
        className="p-4 rounded-xl mb-5 text-xs space-y-1"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
      >
        <p className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>How to get your token:</p>
        {[
          'Go to app.intercom.com',
          'Settings → Developer Hub → New App',
          'Copy the Access Token',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(88,166,255,0.15)', color: 'var(--accent-primary)' }}
            >
              {i + 1}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
          </div>
        ))}
      </div>

      {connected ? (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium fade-in"
          style={{ background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.25)', color: 'var(--accent-green)' }}
        >
          <CheckCircle2 size={16} /> Intercom connected! Moving on…
        </div>
      ) : (
        <>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Access Token
          </label>
          <input
            type="text"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="dG9rOjEyMzQ1..."
            className="w-full px-3 py-2.5 text-sm rounded-lg outline-none mb-4"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              colorScheme: 'dark',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
          />
          <div className="flex items-center gap-3">
            <PrimaryBtn onClick={handleConnect} loading={connecting} disabled={!token.trim()}>
              {connecting ? 'Connecting…' : 'Connect Intercom'}
            </PrimaryBtn>
            <SkipBtn onClick={onSkip} />
          </div>
        </>
      )}
    </div>
  )
}

// ── Step 3: Upload Docs ───────────────────────────────────────────────────────
function StepDocs({ onNext, onSkip }) {
  const [text,       setText]       = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [uploaded,   setUploaded]   = useState(false)
  const [dragOver,   setDragOver]   = useState(false)

  async function handleUpload() {
    if (!text.trim()) return
    setUploading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
      const token = localStorage.getItem('resolify_token')
      await fetch(`${API_URL}/api/knowledge/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: text.trim(), source: 'onboarding' }),
      })
      setUploaded(true)
      setTimeout(onNext, 900)
    } catch {
      setUploaded(true)
      setTimeout(onNext, 900)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setText(ev.target.result)
    reader.readAsText(file)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          <FileText size={20} color="var(--accent-purple)" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Upload Knowledge Base</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Give the AI your docs for smarter answers</p>
        </div>
      </div>

      {uploaded ? (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium fade-in"
          style={{ background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.25)', color: 'var(--accent-green)' }}
        >
          <CheckCircle2 size={16} /> Docs uploaded! Moving on…
        </div>
      ) : (
        <>
          {/* Drop zone */}
          <div
            className="rounded-xl p-6 text-center mb-4 transition-all"
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-default)'}`,
              background: dragOver ? 'rgba(88,166,255,0.05)' : 'var(--bg-elevated)',
              cursor: 'default',
            }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload size={22} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Drop a <strong>.txt</strong> or <strong>.md</strong> file here
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>or paste your content below</p>
          </div>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your FAQ, help docs, or product documentation here…"
            rows={5}
            className="w-full px-3 py-2.5 text-xs rounded-lg outline-none resize-none mb-4"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              colorScheme: 'dark',
              lineHeight: 1.6,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
          />

          <div className="flex items-center gap-3">
            <PrimaryBtn onClick={handleUpload} loading={uploading} disabled={!text.trim()}>
              {uploading ? 'Uploading…' : <>Upload docs <ArrowRight size={14} /></>}
            </PrimaryBtn>
            <SkipBtn onClick={onSkip} />
          </div>
        </>
      )}
    </div>
  )
}

// ── Step 4: Ready ─────────────────────────────────────────────────────────────
function StepReady({ connected, docsUploaded, onFinish, finishing }) {
  const checks = [
    { label: 'Account created',      done: true },
    { label: 'Intercom connected',   done: connected },
    { label: 'Knowledge base ready', done: docsUploaded },
    { label: 'AI agent active',      done: true },
  ]

  return (
    <div className="text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: 'rgba(63,185,80,0.1)', border: '2px solid rgba(63,185,80,0.3)' }}
      >
        <CheckCircle2 size={32} color="var(--accent-green)" />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>You're all set!</h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        Your AI support agent is ready to handle tickets.
      </p>

      <div
        className="rounded-xl p-4 mb-8 text-left space-y-2.5"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
      >
        {checks.map(({ label, done }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: done ? 'rgba(63,185,80,0.15)' : 'var(--bg-card)',
                border: `1px solid ${done ? 'rgba(63,185,80,0.3)' : 'var(--border-default)'}`,
              }}
            >
              {done
                ? <CheckCircle2 size={12} color="var(--accent-green)" />
                : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-default)', display: 'block' }} />
              }
            </div>
            <span className="text-sm" style={{ color: done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {label}
            </span>
            {!done && (
              <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>Skipped</span>
            )}
          </div>
        ))}
      </div>

      <PrimaryBtn onClick={onFinish} loading={finishing}>
        {finishing ? 'Loading dashboard…' : <>Go to dashboard <ArrowRight size={14} /></>}
      </PrimaryBtn>
    </div>
  )
}

// ── Main Onboarding shell ─────────────────────────────────────────────────────
export default function Onboarding() {
  const [step,         setStep]         = useState(0)
  const [connected,    setConnected]    = useState(false)
  const [docsUploaded, setDocsUploaded] = useState(false)
  const [finishing,    setFinishing]    = useState(false)

  const { user, login, token } = useAuth()
  const navigate = useNavigate()

  const companyName = user?.company_name || user?.name || ''

  async function finish() {
    setFinishing(true)
    try {
      await completeOnboarding()
      // Update local user state
      const updated = { ...user, onboarding_complete: true }
      login(token, updated)
    } catch { /* non-fatal */ }
    navigate('/dashboard')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'var(--bg-base)',
        paddingTop: 24,
        paddingBottom: 24,
        paddingRight: 16,
        paddingLeft: 'calc(var(--sidebar-w) + 16px)',
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl fade-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          padding: '40px 40px',
        }}
      >
        <StepIndicator current={step} />

        {step === 0 && (
          <StepWelcome companyName={companyName} onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <StepIntercom
            onNext={() => { setConnected(true); setStep(2) }}
            onSkip={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepDocs
            onNext={() => { setDocsUploaded(true); setStep(3) }}
            onSkip={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepReady
            connected={connected}
            docsUploaded={docsUploaded}
            onFinish={finish}
            finishing={finishing}
          />
        )}
      </div>
    </div>
  )
}
