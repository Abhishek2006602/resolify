import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, Check, ArrowRight, RefreshCw, Clock, AlertTriangle,
  Shield, Search, Globe, DollarSign, ChevronDown, TrendingUp,
} from 'lucide-react'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:            '#080C14',
  surface:       '#0D1117',
  card:          '#1C2333',
  elevated:      '#161B22',
  border:        '#21262D',
  borderDefault: '#30363D',
  primary:       '#58A6FF',
  green:         '#3FB950',
  red:           '#F85149',
  amber:         '#D29922',
  purple:        '#8B5CF6',
  text:          '#E6EDF3',
  textSec:       '#8B949E',
  textMuted:     '#484F58',
}

const container = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '0 24px',
}

const sectionPad = { padding: '96px 0' }

// ── Reusable primitives ───────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
      <Zap size={11} color={C.primary} fill={C.primary} />
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: C.primary,
      }}>
        {children}
      </span>
    </div>
  )
}

function PrimaryBtn({ to, children, large }) {
  const s = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: C.primary, color: '#fff',
    fontWeight: 600, textDecoration: 'none', borderRadius: 10,
    boxShadow: '0 0 24px rgba(88,166,255,0.35)',
    transition: 'all 0.15s',
    padding: large ? '14px 28px' : '10px 20px',
    fontSize: large ? 15 : 14,
    border: 'none', cursor: 'pointer',
  }
  return (
    <Link to={to} style={s}
      onMouseEnter={e => { e.currentTarget.style.background = '#79B8FF'; e.currentTarget.style.boxShadow = '0 0 32px rgba(88,166,255,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.boxShadow = '0 0 24px rgba(88,166,255,0.35)' }}
    >
      {children}
    </Link>
  )
}

function GhostBtn({ to, href, children, large }) {
  const s = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'transparent', color: C.textSec,
    fontWeight: 600, textDecoration: 'none', borderRadius: 10,
    border: `1px solid ${C.border}`,
    transition: 'all 0.15s',
    padding: large ? '13px 28px' : '9px 20px',
    fontSize: large ? 15 : 14,
  }
  const enter = e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.text }
  const leave = e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec }
  if (href) return <a href={href} style={s} onMouseEnter={enter} onMouseLeave={leave}>{children}</a>
  return <Link to={to} style={s} onMouseEnter={enter} onMouseLeave={leave}>{children}</Link>
}

// ── 1. NavBar ─────────────────────────────────────────────────────────────────
function NavBar() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(8,12,20,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ ...container, display: 'flex', alignItems: 'center', height: 64 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 'auto' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={15} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: C.text, letterSpacing: '-0.3px' }}>
            Resolify
          </span>
        </div>

        {/* Center nav links */}
        <div className="hidden md:flex" style={{ gap: 36, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          {[['Product', '#product'], ['Pricing', '#pricing'], ['About', '#about']].map(([label, href]) => (
            <a key={label} href={href} style={{ color: C.textSec, fontSize: 14, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.textSec}
            >{label}</a>
          ))}
        </div>

        {/* Right CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <Link to="/login" className="hidden sm:block" style={{
            color: C.textSec, fontSize: 14, textDecoration: 'none',
            padding: '8px 16px', borderRadius: 8, transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = C.text}
            onMouseLeave={e => e.currentTarget.style.color = C.textSec}
          >Sign in</Link>
          <PrimaryBtn to="/register">Start free trial</PrimaryBtn>
        </div>
      </div>
    </nav>
  )
}

// ── Mock dashboard visual ─────────────────────────────────────────────────────
function MockDashboard() {
  const tickets = [
    { id: 'TKT-001', msg: 'How do I export my data to CSV format?', status: 'resolved' },
    { id: 'TKT-002', msg: 'I want to cancel my subscription immediately', status: 'escalated' },
    { id: 'TKT-003', msg: 'Can you reset my 2FA authenticator app?', status: 'resolved' },
  ]

  return (
    <div style={{
      background: C.card, borderRadius: 16,
      border: `1px solid ${C.border}`,
      boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(88,166,255,0.08)',
      overflow: 'hidden',
    }}>
      {/* Window chrome */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
        background: C.surface,
      }}>
        {['#F85149','#D29922','#3FB950'].map(c => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 12, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
          resolify.vercel.app/dashboard
        </span>
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, color: C.green, fontWeight: 600,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
          Live
        </div>
      </div>

      {/* Metrics row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: 0, borderBottom: `1px solid ${C.border}`,
      }}>
        {[
          { label: 'Resolved today', value: '23', color: C.green },
          { label: 'Avg confidence', value: '91%', color: C.primary },
          { label: 'Time saved', value: '3.1h', color: C.amber },
        ].map((m, i) => (
          <div key={m.label} style={{
            padding: '12px 16px',
            borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
          }}>
            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {m.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: m.color, fontVariantNumeric: 'tabular-nums' }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '80px 1fr 100px',
        padding: '8px 16px', borderBottom: `1px solid ${C.border}`,
        background: C.surface,
      }}>
        {['ID', 'Message', 'Status'].map(h => (
          <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {h}
          </span>
        ))}
      </div>

      {/* Ticket rows */}
      {tickets.map((t, i) => (
        <div key={t.id} style={{
          display: 'grid', gridTemplateColumns: '80px 1fr 100px',
          padding: '10px 16px', alignItems: 'center',
          borderBottom: i < tickets.length - 1 ? `1px solid ${C.border}` : 'none',
          background: i === 1 ? 'rgba(248,81,73,0.03)' : 'transparent',
        }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.primary, fontFamily: 'JetBrains Mono, monospace' }}>
            {t.id}
          </span>
          <span style={{ fontSize: 12, color: C.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
            {t.msg}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600,
            padding: '3px 8px', borderRadius: 5, display: 'inline-flex', alignItems: 'center', gap: 4,
            background: t.status === 'resolved' ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
            color: t.status === 'resolved' ? C.green : C.red,
            border: `1px solid ${t.status === 'resolved' ? 'rgba(63,185,80,0.2)' : 'rgba(248,81,73,0.2)'}`,
          }}>
            {t.status === 'resolved' ? '✓ Resolved' : '↑ Escalated'}
          </span>
        </div>
      ))}

      {/* Context card */}
      <div style={{
        margin: '12px 16px 16px', padding: '12px 14px', borderRadius: 10,
        background: C.elevated, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
            Customer Context
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[['Plan', 'Growth', C.text], ['MRR', '$299', C.green], ['Status', 'active', C.green], ['Health', 'healthy', C.primary]].map(([k, v, color]) => (
              <span key={k} style={{ fontSize: 11, color: C.textSec }}>
                {k}: <strong style={{ color }}>{v}</strong>
              </span>
            ))}
          </div>
        </div>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 700,
          padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap',
          background: 'rgba(63,185,80,0.12)', color: C.green,
          border: '1px solid rgba(63,185,80,0.25)',
        }}>
          ✓ AI: Auto-resolved
        </span>
      </div>
    </div>
  )
}

// ── 2. Hero ───────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ ...sectionPad, paddingTop: 80, paddingBottom: 80, position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 600, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(88,166,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ ...container, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}
        className="hero-grid">

        {/* Left: copy */}
        <div>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '6px 14px', borderRadius: 999, marginBottom: 28,
            background: 'rgba(88,166,255,0.08)',
            border: `1px solid rgba(88,166,255,0.2)`,
          }}>
            <Zap size={11} color={C.primary} fill={C.primary} />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.primary }}>
              AI Support Agent for B2B SaaS
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, lineHeight: 1.12,
            color: C.text, marginBottom: 24, letterSpacing: '-0.03em',
          }}>
            Your support team handles{' '}
            <span style={{ color: C.textSec }}>30% of tickets.</span>
            <br />
            We handle the{' '}
            <span style={{
              background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>other 70%.</span>
          </h1>

          {/* Subheadline */}
          <p style={{ fontSize: 17, color: C.textSec, lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
            Resolify plugs into your Intercom in 5 days. Automatically resolves repetitive tickets,
            assembles customer context before every escalation, and saves your team{' '}
            <strong style={{ color: C.text }}>8 minutes per ticket.</strong>
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <PrimaryBtn to="/register" large>
              Start free trial <ArrowRight size={16} />
            </PrimaryBtn>
            <GhostBtn href="#product" large>
              See how it works
            </GhostBtn>
          </div>

          {/* Trust line */}
          <p style={{ fontSize: 12, color: C.textMuted }}>
            No credit card required · 5-day setup · Cancel anytime
          </p>
        </div>

        {/* Right: mock dashboard */}
        <div className="hero-visual">
          <MockDashboard />
        </div>
      </div>
    </section>
  )
}

// ── 3. Social proof bar ───────────────────────────────────────────────────────
function SocialProof() {
  const companies = ['Statuspage', 'Helpwise', 'Chameleon', 'June.so', 'Koala']
  return (
    <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '32px 0' }}>
      <div style={{ ...container }}>
        <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Trusted by support teams at fast-growing SaaS companies
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
          {companies.map(name => (
            <span key={name} style={{
              fontSize: 16, fontWeight: 700, color: C.textMuted,
              letterSpacing: '-0.02em', opacity: 0.5,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 4. Problem ────────────────────────────────────────────────────────────────
function Problem() {
  const cards = [
    {
      icon: RefreshCw, color: C.amber,
      title: 'Same questions, every day',
      body: '60–70% of your tickets are identical. Password resets. Export questions. Billing confusion. Your team answers them manually every single day.',
    },
    {
      icon: Clock, color: C.red,
      title: '10 minutes of context gathering',
      body: 'Before every reply, agents switch between Stripe, HubSpot, and logs to understand who the customer is. That\'s the real time sink — not the reply itself.',
    },
    {
      icon: AlertTriangle, color: C.amber,
      title: 'Per-resolution billing shock',
      body: 'Intercom charges $0.99 per resolution. The better your AI performs, the higher your bill. You\'re paying a tax on your own success.',
    },
  ]

  return (
    <section id="product" style={{ ...sectionPad, background: C.surface }}>
      <div style={container}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <SectionLabel>The Problem</SectionLabel>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            Your support team spends 10 minutes<br className="hidden md:block" /> before typing a single word
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {cards.map(({ icon: Icon, color, title, body }) => (
            <div key={title} style={{
              padding: 28, borderRadius: 14,
              background: C.card, border: `1px solid ${C.border}`,
              transition: 'border-color 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, marginBottom: 18,
                background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${color}30`,
              }}>
                <Icon size={18} color={color} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.7 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 5. How it works ───────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Connect Intercom', desc: 'Paste your access token. 5 minutes, no engineering required.' },
    { n: '02', title: 'Upload your docs', desc: 'FAQ, help center, product guides — anything your team references.' },
    { n: '03', title: 'Review drafts', desc: '14 days in draft mode so you stay in full control before going live.' },
    { n: '04', title: 'Go live', desc: 'AI handles tickets automatically. You only see escalations — with full context.' },
  ]

  return (
    <section style={sectionPad}>
      <div style={container}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <SectionLabel>How it works</SectionLabel>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            Set up in 5 days.<br className="hidden md:block" /> Works invisibly after that.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0, position: 'relative' }}>
          {steps.map(({ n, title, desc }, i) => (
            <div key={n} style={{ padding: '0 24px', position: 'relative' }}>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block" style={{
                  position: 'absolute', top: 20, left: 'calc(50% + 28px)',
                  right: '-24px', height: 1,
                  background: `linear-gradient(90deg, ${C.primary}60, ${C.border})`,
                }} />
              )}
              {/* Number circle */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', marginBottom: 16,
                background: `linear-gradient(135deg, ${C.primary}20, ${C.purple}20)`,
                border: `2px solid ${C.primary}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.primary, fontFamily: 'JetBrains Mono, monospace' }}>{n}</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 6. Features ───────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: Zap, color: C.primary,
      title: 'Context Assembly',
      desc: 'Automatically pulls plan, MRR, payment status, and recent activity before any human opens an escalated ticket.',
    },
    {
      icon: TrendingUp, color: C.green,
      title: 'Smart Escalation',
      desc: 'Billing disputes, cancellations, and angry customers always reach a human. With full context already prepared.',
    },
    {
      icon: DollarSign, color: C.amber,
      title: 'Flat Pricing',
      desc: 'No per-resolution billing surprises. One flat monthly price regardless of how many tickets your AI resolves.',
    },
    {
      icon: Shield, color: C.purple,
      title: 'Draft Mode',
      desc: 'Start in review mode. Every AI response is saved for human approval before anything is sent to customers.',
    },
    {
      icon: Search, color: C.primary,
      title: 'Knowledge Gap Detection',
      desc: 'Automatically identifies questions your docs can\'t answer. Weekly report so you can fill the gaps.',
    },
    {
      icon: Globe, color: C.green,
      title: 'Multi-language Support',
      desc: 'Automatically detects customer language and responds in the same language. No extra configuration.',
    },
  ]

  return (
    <section style={{ ...sectionPad, background: C.surface }}>
      <div style={container}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <SectionLabel>Features</SectionLabel>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em' }}>
            Everything your support team needs
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {features.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} style={{
              padding: '24px 24px', borderRadius: 14,
              background: C.card, border: `1px solid ${C.border}`,
              display: 'flex', gap: 16,
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${color}60`}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0, marginTop: 2,
                background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${color}25`,
              }}>
                <Icon size={17} color={color} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 7. Pricing ────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Starter', price: '$999', volume: '1,000 tickets/month',
    desc: 'For growing SaaS teams',
    features: [
      'AI ticket classification',
      'Auto-resolve simple tickets',
      'Context assembly',
      'Draft mode',
      'Email support',
    ],
    highlighted: false,
  },
  {
    name: 'Growth', price: '$2,500', volume: '4,000 tickets/month',
    desc: 'Most popular',
    features: [
      'Everything in Starter',
      'Priority support',
      'Slack integration',
      'Advanced escalation rules',
      'Weekly ROI digest',
    ],
    highlighted: true,
  },
  {
    name: 'Scale', price: '$5,000', volume: '8,000 tickets/month',
    desc: 'For scaling teams',
    features: [
      'Everything in Growth',
      'Dedicated onboarding',
      'Custom escalation logic',
      'SLA guarantee',
      'Quarterly reviews',
    ],
    highlighted: false,
  },
]

function PricingCard({ plan }) {
  const { name, price, volume, desc, features, highlighted } = plan
  return (
    <div style={{
      padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column',
      background: highlighted ? 'rgba(88,166,255,0.04)' : C.card,
      border: `1px solid ${highlighted ? C.primary : C.border}`,
      boxShadow: highlighted ? `0 0 0 1px ${C.primary}40, 0 20px 60px rgba(88,166,255,0.1)` : 'none',
      position: 'relative',
      transition: 'transform 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {highlighted && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: C.primary, color: '#fff',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          padding: '4px 14px', borderRadius: 999,
        }}>
          MOST POPULAR
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>{name}</h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {price}
          </span>
          <span style={{ fontSize: 14, color: C.textSec }}>/mo</span>
        </div>
        <p style={{ fontSize: 12, color: C.primary, fontWeight: 600, marginBottom: 4 }}>{volume}</p>
        <p style={{ fontSize: 13, color: C.textSec }}>{desc}</p>
      </div>

      <div style={{ flex: 1, marginBottom: 28 }}>
        {features.map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <Check size={14} color={C.green} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 13, color: C.textSec }}>{f}</span>
          </div>
        ))}
      </div>

      <Link to="/register" style={{
        display: 'block', textAlign: 'center', textDecoration: 'none',
        padding: '12px 0', borderRadius: 10, fontWeight: 600, fontSize: 14,
        background: highlighted ? C.primary : 'transparent',
        color: highlighted ? '#fff' : C.primary,
        border: `1px solid ${highlighted ? C.primary : C.primary}`,
        boxShadow: highlighted ? '0 4px 20px rgba(88,166,255,0.3)' : 'none',
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.background = highlighted ? '#79B8FF' : 'rgba(88,166,255,0.08)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = highlighted ? C.primary : 'transparent'
        }}
      >
        Start free trial
      </Link>
    </div>
  )
}

function Pricing() {
  return (
    <section id="pricing" style={{ ...sectionPad }}>
      <div style={container}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <SectionLabel>Pricing</SectionLabel>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em', marginBottom: 12 }}>
            Simple, flat pricing. No surprises.
          </h2>
          <p style={{ fontSize: 15, color: C.textSec }}>No per-resolution fees. Pay one flat monthly price.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, alignItems: 'start' }}>
          {PLANS.map(p => <PricingCard key={p.name} plan={p} />)}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: C.textMuted, marginTop: 32 }}>
          Annual plans save 2 months. Enterprise pricing available for unlimited tickets.
        </p>
      </div>
    </section>
  )
}

// ── 8. FAQ ────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'Do I need to replace Intercom?',
    a: 'No. Resolify plugs into your existing Intercom. Your team keeps using Intercom exactly as before — Resolify just works in the background.',
  },
  {
    q: 'What if the AI gives a wrong answer?',
    a: 'Start in draft mode — every response is saved for human review before anything is sent to customers. You go live only when you\'re confident.',
  },
  {
    q: 'How long does setup take?',
    a: '5 days. Connect Intercom, upload your docs, review drafts, go live. We handle the technical setup personally.',
  },
  {
    q: 'What happens to billing and cancellation tickets?',
    a: 'They always go to a human. Billing disputes, refund requests, and cancellations are automatically escalated with full customer context pre-assembled.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes. First month free as a design partner. Then your plan price locked forever at the rate you signed up at.',
  },
  {
    q: 'What if my ticket volume spikes?',
    a: "Overages are billed at a flat rate per ticket — always lower than Intercom's per-resolution pricing. You're notified at 70% of your monthly limit.",
  },
]

function FAQSection() {
  const [open, setOpen] = useState(null)

  return (
    <section id="about" style={{ ...sectionPad, background: C.surface }}>
      <div style={{ ...container, maxWidth: 720 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <SectionLabel>FAQ</SectionLabel>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em' }}>
            Common questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={{
              borderRadius: 12, overflow: 'hidden',
              background: C.card, border: `1px solid ${open === i ? C.primary + '60' : C.border}`,
              transition: 'border-color 0.2s',
            }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '18px 22px', background: 'transparent', border: 'none', cursor: 'pointer',
                  textAlign: 'left', gap: 12,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.q}</span>
                <ChevronDown
                  size={16}
                  color={C.textSec}
                  style={{ flexShrink: 0, transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                />
              </button>
              {open === i && (
                <div style={{ padding: '0 22px 18px' }}>
                  <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.7 }}>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 9. CTA Banner ─────────────────────────────────────────────────────────────
function CTABanner() {
  const [email,     setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (email.trim()) setSubmitted(true)
  }

  return (
    <section style={{
      padding: '100px 0',
      background: `radial-gradient(ellipse at 50% 0%, rgba(88,166,255,0.12) 0%, transparent 70%), ${C.bg}`,
      borderTop: `1px solid ${C.border}`,
      textAlign: 'center',
    }}>
      <div style={{ ...container, maxWidth: 680 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 24,
          padding: '6px 14px', borderRadius: 999,
          background: 'rgba(88,166,255,0.08)', border: `1px solid rgba(88,166,255,0.2)` }}>
          <Zap size={11} color={C.primary} fill={C.primary} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.primary }}>Limited spots</span>
        </div>

        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 800, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16 }}>
          Ready to save your team<br /> 8 minutes per ticket?
        </h2>
        <p style={{ fontSize: 16, color: C.textSec, marginBottom: 40, lineHeight: 1.6 }}>
          Join the waitlist. First 10 customers get 1 month free<br className="hidden md:block" /> and locked pricing forever.
        </p>

        {submitted ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 28px', borderRadius: 12,
            background: 'rgba(63,185,80,0.1)', border: `1px solid rgba(63,185,80,0.25)`,
            color: C.green, fontSize: 15, fontWeight: 600,
          }}>
            <Check size={18} /> You're on the list! We'll be in touch soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
                padding: '14px 18px', borderRadius: 10, fontSize: 14,
                background: C.card, border: `1px solid ${C.border}`,
                color: C.text, outline: 'none', width: 280, colorScheme: 'dark',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <button type="submit" style={{
              padding: '14px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: C.primary, color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(88,166,255,0.35)', transition: 'all 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#79B8FF'}
              onMouseLeave={e => e.currentTarget.style.background = C.primary}
            >
              Join waitlist →
            </button>
          </form>
        )}

        <p style={{ fontSize: 12, color: C.textMuted, marginTop: 20 }}>
          No spam. No credit card. Just a conversation.
        </p>
      </div>
    </section>
  )
}

// ── 10. Footer ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, padding: '48px 0 32px', background: C.surface }}>
      <div style={{ ...container }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={13} color="#fff" fill="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Resolify</span>
            </div>
            <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
              AI support agent for B2B SaaS
            </p>
          </div>

          {/* Links */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Product
            </div>
            {[
              { label: 'Product', href: '/#features' },
              { label: 'Pricing', href: '/#pricing' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms',   href: '/terms' },
            ].map(({ label, href }) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <Link to={href} style={{ fontSize: 14, color: C.textSec, textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.text}
                  onMouseLeave={e => e.currentTarget.style.color = C.textSec}
                >{label}</Link>
              </div>
            ))}
          </div>

          {/* Built by */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              About
            </div>
            <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7 }}>
              Built by a solo founder in Pune, India.
            </p>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: C.textMuted }}>© 2026 Resolify. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms',   href: '/terms' },
            ].map(({ label, href }) => (
              <Link key={label} to={href} style={{ fontSize: 12, color: C.textMuted, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.textSec}
                onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
              >{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Responsive styles (injected once) ─────────────────────────────────────────
const responsiveCSS = `
  @media (max-width: 768px) {
    .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
    .hero-visual { order: -1; }
  }
`

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  useEffect(() => {
    window.intercomSettings = {
      api_base: "https://api-iam.intercom.io",
      app_id: "lugii3n3",
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://widget.intercom.io/widget/lugii3n3';
    document.head.appendChild(script);

    return () => {
      if (window.Intercom) {
        window.Intercom('shutdown');
      }
    };
  }, []);

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: 'DM Sans, sans-serif', minHeight: '100vh', scrollBehavior: 'smooth' }}>
      <style>{responsiveCSS}</style>
      <NavBar />
      <Hero />
      <SocialProof />
      <Problem />
      <HowItWorks />
      <Features />
      <Pricing />
      <FAQSection />
      <CTABanner />
      <Footer />
    </div>
  )
}
