import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Zap, CheckCircle2, ArrowRight, SkipForward, Upload, FileText, Globe, AlertCircle, ShieldAlert, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { completeOnboarding, startIntercomOAuth } from '../api'

const STEPS = ['Welcome', 'Connect Intercom', 'Disable Fin', 'Upload Docs', 'Ready']

// Hardcoded Intercom app ID for the Fin settings deep-link.
// TODO: make dynamic per-customer once workspace_id is reliably available.
const FIN_APP_ID = 'lugii3n3'
const FIN_SETTINGS_URL = `https://app.intercom.com/a/apps/${FIN_APP_ID}/automation/fin-ai-agent/setup`

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

// ── Step 2: Connect Intercom (OAuth) ─────────────────────────────────────────
function StepIntercom({ onNext, onSkip, oauthError }) {
  const [starting, setStarting] = useState(false)

  async function handleOAuth() {
    setStarting(true)
    try {
      const data = await startIntercomOAuth()
      if (data.oauth_url) {
        window.location.href = data.oauth_url
        // page navigates away — no need to reset starting
      } else {
        setStarting(false)
      }
    } catch {
      setStarting(false)
    }
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

      {oauthError && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-5"
          style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)', color: 'var(--accent-red)' }}
        >
          <AlertCircle size={15} />
          Connection failed. Please try again.
        </div>
      )}

      <button
        onClick={handleOAuth}
        disabled={starting}
        className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all mb-3"
        style={{
          background: starting ? 'var(--border-default)' : 'var(--accent-primary)',
          color: '#fff',
          boxShadow: starting ? 'none' : '0 4px 20px rgba(88,166,255,0.25)',
          cursor: starting ? 'not-allowed' : 'pointer',
          border: 'none',
        }}
        onMouseEnter={e => { if (!starting) e.currentTarget.style.background = '#79B8FF' }}
        onMouseLeave={e => { if (!starting) e.currentTarget.style.background = 'var(--accent-primary)' }}
      >
        {/* Intercom chat-bubble icon */}
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.2"/>
          <path d="M16 6C10.477 6 6 10.477 6 16c0 1.89.525 3.66 1.438 5.17L6 26l4.926-1.406A9.943 9.943 0 0016 26c5.523 0 10-4.477 10-10S21.523 6 16 6zm0 18a7.958 7.958 0 01-4.016-1.08l-.288-.17-2.924.836.803-2.847-.186-.295A7.97 7.97 0 018 16c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z" fill="white"/>
        </svg>
        {starting ? 'Redirecting to Intercom…' : 'Connect Intercom'}
      </button>

      <p className="text-xs text-center mb-6" style={{ color: 'var(--text-muted)' }}>
        You'll be redirected to Intercom to authorize the connection. This takes 30 seconds.
      </p>

      <div className="flex justify-center">
        <SkipBtn onClick={onSkip} />
      </div>
    </div>
  )
}

// ── Step 3: Disable Fin AI ────────────────────────────────────────────────────
function StepDisableFin({ onNext, onSkip }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(210,153,34,0.12)', border: '1px solid rgba(210,153,34,0.25)' }}
        >
          <ShieldAlert size={20} color="var(--accent-amber)" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Disable Intercom Fin AI</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avoid duplicate AI responses</p>
        </div>
      </div>

      {/* Explanation card with amber left border */}
      <div
        className="rounded-xl p-4 mb-5"
        style={{
          background: 'rgba(210,153,34,0.06)',
          border: '1px solid rgba(210,153,34,0.2)',
          borderLeft: '3px solid var(--accent-amber)',
        }}
      >
        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--accent-amber)' }}>
          ⚠️ Important
        </p>
        <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Both Resolify and Intercom Fin are AI systems. If both are active at the same time:
        </p>
        <ul className="text-xs space-y-1 mb-3" style={{ color: 'var(--text-secondary)' }}>
          <li>• Your customers receive duplicate replies</li>
          <li>• Analytics become inaccurate</li>
          <li>• Support quality drops</li>
        </ul>
        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
          Disable Fin now so Resolify becomes your single AI authority.
        </p>
      </div>

      {/* Step-by-step instructions */}
      <div
        className="rounded-xl p-4 mb-5"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
      >
        <p className="text-xs font-semibold mb-2.5" style={{ color: 'var(--text-secondary)' }}>How to disable Fin AI:</p>
        {[
          'Click the button below to open Fin settings',
          'Find the Deploy tab',
          'Turn off the green dots for Chat and Email',
          'Come back here and click "I\'ve disabled Fin"',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2 mb-1.5">
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(210,153,34,0.15)', color: 'var(--accent-amber)' }}
            >
              {i + 1}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{step}</span>
          </div>
        ))}
      </div>

      {/* Button 1 — open Fin settings in new tab */}
      <a
        href={FIN_SETTINGS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all mb-3"
        style={{
          background: 'var(--accent-primary)',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(88,166,255,0.25)',
          textDecoration: 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#79B8FF'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-primary)'}
      >
        Open Fin AI Settings <ExternalLink size={14} />
      </a>

      {/* Button 2 — ghost/outline continue CTA */}
      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all mb-3"
        style={{
          background: 'transparent',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-primary)' }}
      >
        I've disabled Fin — Continue <ArrowRight size={14} />
      </button>

      <p className="text-xs text-center mb-6" style={{ color: 'var(--text-muted)' }}>
        Already using a different AI tool? Fin may already be disabled.
      </p>

      <div className="flex justify-center">
        <SkipBtn onClick={onSkip} />
      </div>
    </div>
  )
}

// ── Step 4: Upload Docs ───────────────────────────────────────────────────────
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

// ── Step 5: Ready ─────────────────────────────────────────────────────────────
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
  const [oauthError,   setOauthError]   = useState(false)

  const { user, login, token } = useAuth()
  const navigate   = useNavigate()
  const [searchParams] = useSearchParams()

  // Handle return from Intercom OAuth callback
  useEffect(() => {
    const intercomStatus = searchParams.get('intercom')
    const error          = searchParams.get('error')

    if (intercomStatus === 'connected') {
      setConnected(true)
      // Backend redirects with ?step=3&intercom=connected after OAuth.
      // In the 5-step flow, internal index 2 = Disable Fin AI (the next step
      // after Connect Intercom). Always land the user here post-OAuth.
      setStep(2)
    } else if (error === 'oauth_failed') {
      setOauthError(true)
      setStep(1)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
            oauthError={oauthError}
          />
        )}
        {step === 2 && (
          <StepDisableFin
            onNext={() => setStep(3)}
            onSkip={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepDocs
            onNext={() => { setDocsUploaded(true); setStep(4) }}
            onSkip={() => setStep(4)}
          />
        )}
        {step === 4 && (
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
