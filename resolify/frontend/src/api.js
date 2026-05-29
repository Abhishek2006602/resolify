const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
const BASE = `${API_URL}/api`

function getToken() {
  return localStorage.getItem('resolify_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Login failed')
  }
  return res.json()
}

export async function register(company_name, email, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_name, email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Registration failed')
  }
  return res.json()
}

export function completeOnboarding() {
  return request('/auth/onboarding', { method: 'PATCH' })
}

// ── Tickets ───────────────────────────────────────────────────────────────────

export function getTickets() {
  return request('/tickets')
}

export function getTicket(id) {
  return request(`/tickets/${id}`)
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getStatsToday() {
  return request('/stats/today')
}

export function getAnalytics() {
  return request('/stats/analytics')
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function getSettings() {
  return request('/settings')
}

export function updateSettings(payload) {
  return request('/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

// ── Test ticket ───────────────────────────────────────────────────────────────

export function sendTestTicket(payload, signal) {
  return request('/webhook/intercom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
}

// ── Intercom OAuth ────────────────────────────────────────────────────────────

export function startIntercomOAuth() {
  return request('/intercom/oauth/start')
}
