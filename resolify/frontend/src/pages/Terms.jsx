import { Link } from 'react-router-dom'
import { Zap, ArrowLeft } from 'lucide-react'

const section = {
  marginBottom: 40,
}

const h2Style = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: 12,
  paddingBottom: 10,
  borderBottom: '1px solid var(--border-subtle)',
}

const pStyle = {
  fontSize: 14,
  color: 'var(--text-secondary)',
  lineHeight: 1.8,
  marginBottom: 10,
}

const liStyle = {
  fontSize: 14,
  color: 'var(--text-secondary)',
  lineHeight: 1.8,
  marginBottom: 6,
  paddingLeft: 16,
  position: 'relative',
}

function Bullet({ children }) {
  return (
    <li style={liStyle}>
      <span style={{ position: 'absolute', left: 0, color: 'var(--accent-primary)' }}>·</span>
      {children}
    </li>
  )
}

export default function Terms() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Nav */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', padding: '0 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={13} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Resolify</span>
          </Link>
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 48 }}>
          Last updated: May 2026
        </p>

        <div style={section}>
          <h2 style={h2Style}>Acceptance of Terms</h2>
          <p style={pStyle}>
            By accessing or using Resolify ("Service"), you agree to be bound by these Terms of
            Service. If you do not agree to these terms, do not use the Service.
          </p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Description of Service</h2>
          <p style={pStyle}>
            Resolify is an AI-powered customer support agent designed for B2B SaaS companies. The
            Service integrates with Intercom to automatically classify, respond to, and escalate
            customer support tickets using large language models.
          </p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>User Accounts</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Bullet>You are responsible for maintaining the security of your account credentials</Bullet>
            <Bullet>You must provide accurate information when registering</Bullet>
            <Bullet>You are responsible for all activity that occurs under your account</Bullet>
            <Bullet>Notify us immediately at abhishekkamlakar425@gmail.com if you suspect unauthorized access</Bullet>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Acceptable Use</h2>
          <p style={pStyle}>You agree not to:</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Bullet>Use the Service for any illegal or unauthorized purpose</Bullet>
            <Bullet>Abuse, spam, or overload our API infrastructure</Bullet>
            <Bullet>Attempt to reverse-engineer, copy, or resell the Service</Bullet>
            <Bullet>Use the Service to process personal data without appropriate consent</Bullet>
            <Bullet>Introduce malicious code, prompt injections, or adversarial inputs</Bullet>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Payment Terms</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Bullet>Subscriptions are billed monthly in advance</Bullet>
            <Bullet>No refunds for partial months of service</Bullet>
            <Bullet>Prices may change with 30 days notice</Bullet>
            <Bullet>Failure to pay will result in service suspension</Bullet>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Service Availability</h2>
          <p style={pStyle}>
            We target 99% uptime for paid plans. No service level agreement (SLA) is provided for
            free or Starter tier accounts. Scheduled maintenance will be communicated in advance
            where possible. We are not liable for downtime caused by third-party services (Intercom,
            Anthropic, Supabase, etc.).
          </p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Intellectual Property</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Bullet>You retain full ownership of your data, ticket content, and customer information</Bullet>
            <Bullet>Resolify retains ownership of the software, AI models, and platform infrastructure</Bullet>
            <Bullet>You grant us a limited license to process your data solely to provide the Service</Bullet>
            <Bullet>We do not claim ownership over AI-generated responses produced for your customers</Bullet>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Limitation of Liability</h2>
          <p style={pStyle}>
            The Service is provided "as-is" without warranties of any kind. We are not liable for
            any indirect, incidental, or consequential damages arising from your use of the Service,
            including but not limited to incorrect AI responses, missed escalations, or data loss.
            Our total liability shall not exceed the amount paid by you in the 30 days preceding
            the claim.
          </p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Termination</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Bullet>Either party may terminate with 30 days written notice</Bullet>
            <Bullet>We may suspend or terminate your account immediately for violations of these Terms</Bullet>
            <Bullet>Upon termination, your data will be retained for 30 days then permanently deleted</Bullet>
            <Bullet>You may export your data at any time before termination</Bullet>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Contact</h2>
          <p style={pStyle}>
            Questions about these Terms should be sent to:
          </p>
          <p style={pStyle}>
            Email:{' '}
            <a href="mailto:abhishekkamlakar425@gmail.com"
              style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
              abhishekkamlakar425@gmail.com
            </a>
          </p>
          <p style={pStyle}>
            Website:{' '}
            <a href="https://resolify.vercel.app"
              style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
              resolify.vercel.app
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
