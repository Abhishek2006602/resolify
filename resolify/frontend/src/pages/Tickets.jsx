import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import TopBar from '../components/TopBar'
import TicketTable from '../components/TicketTable'
import TicketDrawer from '../components/TicketDrawer'
import { getTickets } from '../api'

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'resolved',  label: 'Resolved' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'pending',   label: 'Pending' },
]

export default function Tickets() {
  const [tickets, setTickets]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [syncing, setSyncing]         = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selected, setSelected]       = useState(null)
  const [statusTab, setStatusTab]     = useState('all')
  const [search, setSearch]           = useState('')

  const fetchTickets = useCallback(async (quiet = false) => {
    if (quiet) setSyncing(true); else setLoading(true)
    try {
      const data = await getTickets()
      setTickets(data)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (_) {}
    finally { setLoading(false); setSyncing(false) }
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])
  useEffect(() => {
    const id = setInterval(() => fetchTickets(true), 10000)
    return () => clearInterval(id)
  }, [fetchTickets])

  const filtered = tickets
    .filter(t => statusTab === 'all' || t.status === statusTab)
    .filter(t => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        t.ticket_id.toLowerCase().includes(q) ||
        t.customer_email.toLowerCase().includes(q) ||
        (t.message || '').toLowerCase().includes(q)
      )
    })

  const counts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === 'all'
      ? tickets.length
      : tickets.filter(t => t.status === tab.key).length
    return acc
  }, {})

  return (
    <>
      <TopBar title="Tickets" syncing={syncing} lastUpdated={lastUpdated} />

      <main className="pt-14 pl-60 min-h-screen" style={{ background: '#0F1117' }}>
        <div className="p-6 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-0.5 h-4 rounded-full" style={{ background: '#6366F1' }} />
              <div>
                <h2 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>All Tickets</h2>
                {!loading && (
                  <p className="text-xs" style={{ color: '#475569' }}>
                    {filtered.length} of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: '#475569' }} />
              <input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-8 py-2 rounded-lg text-xs w-56 outline-none transition-all"
                style={{
                  background: '#1A1D27',
                  border: '1px solid #2A2D3A',
                  color: '#F1F5F9',
                }}
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2A2D3A'}
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#475569' }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg w-fit"
            style={{ background: '#1A1D27', border: '1px solid #2A2D3A' }}>
            {STATUS_TABS.map(tab => {
              const active = statusTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusTab(tab.key)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: active ? '#6366F1' : 'transparent',
                    color: active ? '#fff' : '#64748B',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#94A3B8' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#64748B' }}
                >
                  {tab.label}
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-bold"
                    style={{
                      background: active ? '#ffffff25' : '#2A2D3A',
                      color: active ? '#fff' : '#475569',
                    }}
                  >
                    {counts[tab.key]}
                  </span>
                </button>
              )
            })}
          </div>

          <TicketTable tickets={filtered} loading={loading} onOpen={setSelected} />
        </div>
      </main>

      <TicketDrawer ticket={selected} onClose={() => setSelected(null)} />
    </>
  )
}
