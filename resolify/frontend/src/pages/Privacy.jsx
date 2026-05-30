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

export default function Privacy() {
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 48 }}>
          Last updated: May 2026
        </p>

        <div style={section}>
          <h2 style={h2Style}>Introduction</h2>
          <p style={pStyle}>
            Resolify ("we", "our", "us") operates resolify.vercel.app. This policy explains how we
            collect, use, and protect your data when you use our AI customer support service.
          </p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Information We Collect</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Bullet>Account information: company name, email address, password (bcrypt-hashed — never stored in plain text)</Bullet>
            <Bullet>Intercom workspace data: OAuth access token, workspace ID, conversation metadata</Bullet>
            <Bullet>Support ticket content: customer messages, customer email addresses, ticket metadata</Bullet>
            <Bullet>Usage data: ticket counts, resolution rates, AI model usage and cost metrics</Bullet>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>How We Use Your Information</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Bullet>To provide AI-powered ticket classification and response generation</Bullet>
            <Bullet>To assemble customer context from connected integrations</Bullet>
            <Bullet>To display analytics and metrics in your dashboard</Bullet>
            <Bullet>To improve our AI models and overall service quality</Bullet>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Data We Access from Intercom</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Bullet>Conversation messages and metadata</Bullet>
            <Bullet>Contact information (email, name)</Bullet>
            <Bullet>Workspace information</Bullet>
          </ul>
          <p style={{ ...pStyle, marginTop: 12 }}>
            We access this data solely to provide the Resolify service. We never sell, rent, or
            share this data with third parties for advertising or marketing purposes.
          </p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Data Storage and Security</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Bullet>All data encrypted at rest using AES-256</Bullet>
            <Bullet>Data stored on AWS infrastructure via Supabase</Bullet>
            <Bullet>Access tokens stored securely and never exposed in API responses</Bullet>
            <Bullet>JWT authentication required for all API requests</Bullet>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Data Retention</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Bullet>Ticket data retained for 90 days by default</Bullet>
            <Bullet>Account data retained until account deletion</Bullet>
            <Bullet>You can request complete data deletion at any time</Bullet>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Third Party Services</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Bullet>Anthropic Claude API — for AI ticket classification and response generation</Bullet>
            <Bullet>OpenAI API — for document embeddings and knowledge base indexing</Bullet>
            <Bullet>Supabase — for secure data storage and authentication</Bullet>
            <Bullet>Render.com — for backend API hosting</Bullet>
            <Bullet>Intercom — for helpdesk integration and conversation data access</Bullet>
          </ul>
          <p style={{ ...pStyle, marginTop: 12 }}>
            Each of these services operates under their own privacy policy and data processing agreements.
          </p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Your Rights</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <Bullet>Access your data anytime from your Resolify dashboard</Bullet>
            <Bullet>Request data deletion by emailing abhishekkamlakar425@gmail.com</Bullet>
            <Bullet>Export your ticket data at any time</Bullet>
            <Bullet>Disconnect the Intercom integration at any time from Settings</Bullet>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>Contact</h2>
          <p style={pStyle}>
            For privacy questions or data requests, contact us at:
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
