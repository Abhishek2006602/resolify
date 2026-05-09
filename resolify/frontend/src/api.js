const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
const BASE = `${API_URL}/api`

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function getTickets() {
  return request('/tickets')
}

export function getTicket(id) {
  return request(`/tickets/${id}`)
}

export function getStatsToday() {
  return request('/stats/today')
}

export function getAnalytics() {
  return request('/stats/analytics')
}

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

export function sendTestTicket(payload, signal) {
  return request('/webhook/intercom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
}
