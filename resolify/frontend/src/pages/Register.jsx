import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Building2, Mail, Lock, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { register as apiRegister } from '../api'

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  borderRadius: 8,
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s',
}

export default function Register() {
  const [company,  setCompany]  = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError(null)
    try {
      const data = await apiRegister(company, email, password)
      login(data.access_token, {
        role:                data.role,
        company_name:        data.company_name,
        name:                data.name,
        onboarding_complete: false,
      })
      navigate('/onboarding')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { icon: Building2, label: 'Company name',    type: 'text',     value: company,  set: setCompany,  placeholder: 'Acme Inc.' },
    { icon: Mail,      label: 'Work email',       type: 'email',    value: email,    set: setEmail,    placeholder: 'you@company.com' },
    { icon: Lock,      label: 'Password',         type: 'password', value: password, set: setPassword, placeholder: '8+ characters' },
    { icon: Lock,      label: 'Confirm password', type: 'password', value: confirm,  set: setConfirm,  placeholder: '••••••••' },
  ]

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-base)', padding: '24px 16px' }}
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
          Create your account
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>
          Start your free trial — no card required
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ icon: Icon, label, type, value, set, placeholder }) => (
            <div key={label}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </label>
              <div className="relative">
                <Icon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type={type}
                  required
                  autoFocus={label === 'Company name'}
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  className="pl-9 pr-3 py-2.5 text-sm"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
              </div>
            </div>
          ))}

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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: loading ? 'var(--border-default)' : 'var(--accent-primary)',
              color:      loading ? 'var(--text-muted)' : '#fff',
              boxShadow:  loading ? 'none' : '0 4px 20px rgba(88,166,255,0.3)',
              cursor:     loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#79B8FF' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--accent-primary)' }}
          >
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
