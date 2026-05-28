import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { login as apiLogin } from '../api'

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  borderRadius: 8,
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s',
}

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await apiLogin(email, password)
      login(data.access_token, {
        role:                data.role,
        company_name:        data.company_name,
        name:                data.name,
        onboarding_complete: data.onboarding_complete,
      })
      if (!data.onboarding_complete && data.role !== 'admin') {
        navigate('/onboarding')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="w-[400px] rounded-2xl fade-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          padding: '40px 36px',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))' }}
          >
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Resolify
          </span>
        </div>

        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Welcome back
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>
          Sign in to your account to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="pl-9 pr-3 py-2.5 text-sm"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 pr-3 py-2.5 text-sm"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs fade-in"
              style={{
                background: 'rgba(248,81,73,0.08)',
                border: '1px solid rgba(248,81,73,0.2)',
                color: '#F85149',
              }}
            >
              <AlertTriangle size={13} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background:  loading ? 'var(--border-default)' : 'var(--accent-primary)',
              color:       loading ? 'var(--text-muted)' : '#fff',
              boxShadow:   loading ? 'none' : '0 4px 20px rgba(88,166,255,0.3)',
              cursor:      loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#79B8FF' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--accent-primary)' }}
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}
          >
            Start free trial
          </Link>
        </p>
      </div>
    </div>
  )
}
