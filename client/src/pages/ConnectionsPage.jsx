import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

const BD = '#E0D4BC'
const FT = '#F2EBE0'

const SMTP_PRESETS = {
  '':        { label: 'Custom',               host: '',                                   port: '587', secure: false },
  gmail:     { label: 'Gmail',                host: 'smtp.gmail.com',                    port: '587', secure: false },
  outlook:   { label: 'Outlook / Office 365', host: 'smtp.office365.com',                port: '587', secure: false },
  zoho:      { label: 'Zoho Mail',            host: 'smtp.zoho.com',                     port: '587', secure: false },
  sendgrid:  { label: 'SendGrid',             host: 'smtp.sendgrid.net',                 port: '587', secure: false },
  ses:       { label: 'Amazon SES',           host: 'email-smtp.us-east-1.amazonaws.com',port: '587', secure: false },
  godaddy:   { label: 'GoDaddy',              host: 'smtpout.secureserver.net',          port: '465', secure: true  },
}

const PROVIDER_ICON = { gmail: '📧', zoho: '📮', outlook: '📨', smtp: '📬', sendgrid: '📤', ses: '📡', godaddy: '🌐' }

const INPUT_STYLE = {
  width: '100%', padding: '10px 13px', borderRadius: 10,
  fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink)',
  outline: 'none', background: 'rgba(248,244,239,0.9)',
  border: '1.5px solid rgba(224,212,188,0.8)',
  transition: 'border-color 0.18s', boxSizing: 'border-box',
}
const LABEL_STYLE = {
  fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.2px',
  fontWeight: 600, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif',
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [onDone])
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-pill text-[13px] font-sans font-medium text-cream shadow-xl animate-fade-up"
      style={{ background: type === 'error' ? '#c4633a' : '#7a9e8e', border: '0.5px solid rgba(255,255,255,0.15)', pointerEvents: 'none' }}
    >
      {type === 'error' ? '✗ ' : '✓ '}{msg}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ConnectionsPage() {
  const { emailAccounts, setEmailAccounts, refreshEmailAccounts } = useApp()

  const [activeTab, setActiveTab]      = useState('accounts')
  const [guideTab, setGuideTab]        = useState('gmail')
  const [preset, setPreset]            = useState('')
  const [host, setHost]                = useState('')
  const [port, setPort]                = useState('587')
  const [secure, setSecure]            = useState(false)
  const [username, setUsername]        = useState('')
  const [password, setPassword]        = useState('')
  const [connecting, setConnecting]    = useState(false)
  const [deleteId, setDeleteId]        = useState(null)
  const [deleting, setDeleting]        = useState(false)
  const [toast, setToast]              = useState(null)
  const [emailFrom, setEmailFrom]      = useState('')
  const [systemEmail, setSystemEmail]  = useState('')

  function showToast(msg, type = 'success') { setToast({ msg, type }) }

  useEffect(() => { refreshEmailAccounts() }, [refreshEmailAccounts])

  useEffect(() => {
    apiFetch('/api/send-email/system-info')
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          if (j.emailFrom)   setEmailFrom(j.emailFrom)
          if (j.systemEmail) setSystemEmail(j.systemEmail)
        }
      })
      .catch(() => {})
  }, [])

  function applyPreset(key) {
    setPreset(key)
    const p = SMTP_PRESETS[key]
    if (!p) return
    setHost(p.host); setPort(p.port); setSecure(p.secure)
  }

  function resetForm() { setPreset(''); setHost(''); setPort('587'); setSecure(false); setUsername(''); setPassword('') }

  async function handleConnectSmtp() {
    if (!host.trim())                 return showToast('SMTP host is required.', 'error')
    if (!port || isNaN(Number(port))) return showToast('Port must be a number.', 'error')
    if (!username.trim())             return showToast('Username / email is required.', 'error')
    if (!password)                    return showToast('Password is required.', 'error')
    if (!username.includes('@'))      return showToast('Username must be a valid email address.', 'error')
    setConnecting(true)
    try {
      const res  = await apiFetch('/api/email-accounts/smtp', {
        method: 'POST',
        body: JSON.stringify({ provider: preset || 'smtp', emailAddress: username.trim(), host: host.trim(), port: Number(port), secure, username: username.trim(), password, defaultFrom: username.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { showToast(json.error || 'Failed to connect.', 'error'); return }
      showToast('Email account connected!')
      resetForm()
      await refreshEmailAccounts()
      setActiveTab('accounts') // switch to accounts tab after success
    } catch (e) { showToast(e.message || 'Network error.', 'error') }
    finally { setConnecting(false) }
  }

  async function handleDelete(id) {
    setDeleting(true)
    try {
      const res  = await apiFetch(`/api/email-accounts/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { showToast(json.error || 'Delete failed.', 'error'); return }
      setEmailAccounts(prev => prev.filter(a => a.id !== id))
      showToast('Account removed.')
    } catch (e) { showToast(e.message || 'Delete failed.', 'error') }
    finally { setDeleting(false); setDeleteId(null) }
  }

  return (
    <main className="page-enter w-full flex justify-center px-4 sm:px-6" style={{ paddingTop: 52, paddingBottom: 72 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <div className="w-full max-w-3xl lg:max-w-4xl">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: '"Lora", serif', fontSize: 26, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.4px', marginBottom: 5 }}>
          Connections
        </h1>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
          Choose how your letters travel — from your inbox, or ours.
        </p>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1.5px solid ${BD}`, marginBottom: 24 }}>
        {[
          { id: 'accounts', label: 'Connected' },
          { id: 'setup',    label: 'Add Email' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 22px',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              color: activeTab === t.id ? 'var(--tc)' : 'var(--ink-muted)',
              borderBottom: activeTab === t.id ? '2px solid var(--tc)' : '2px solid transparent',
              marginBottom: '-1.5px',
              transition: 'color 0.18s, border-color 0.18s',
              outline: 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 1 — CONNECTED ACCOUNTS                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'accounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* ── How letters are sent ───────────────────────────────── */}
          <section>
            <div style={{ fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 14, fontWeight: 500, fontFamily: '"DM Sans", sans-serif' }}>
              Email Settings
            </div>

            {/* Intro blurb */}
            <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.7, margin: '0 0 14px' }}>
              Your letters are sent securely using our platform email — no setup needed.
            </p>

            {/* Sending-from card */}
            <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BD}`, overflow: 'hidden', position: 'relative', marginBottom: 10 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(180deg, var(--sage), var(--gold))', borderRadius: '4px 0 0 4px' }} />
              <div style={{ padding: '16px 20px 16px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>📮</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 4 }}>
                    Sending from
                  </div>
                  <div style={{ fontFamily: '"Lora", serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>
                    {emailFrom || 'noreply@letterfromheart.com'}
                  </div>
                  <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-muted)' }}>
                    Always available · No configuration required
                  </div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, padding: '4px 10px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', background: 'rgba(122,158,142,0.1)', color: 'var(--sage)', border: '1px solid rgba(122,158,142,0.3)', flexShrink: 0, fontFamily: '"DM Sans", sans-serif' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sage)' }} />
                  Default
                </span>
              </div>
            </div>

            {/* System / support email note */}
            {systemEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,240,232,0.7)', border: `1px solid ${FT}` }}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, color: 'var(--ink-muted)' }}>
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 9v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="10" cy="6.5" r="0.75" fill="currentColor"/>
                </svg>
                <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11.5, color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                  Admin contact: <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>{systemEmail}</span>
                </span>
              </div>
            )}
          </section>

          {/* ── User connected accounts ────────────────────────────── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 4, fontWeight: 500, fontFamily: '"DM Sans", sans-serif' }}>My Connected Accounts</div>
                <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>
                  {emailAccounts.length === 0 ? 'No personal accounts connected yet.' : `${emailAccounts.length} account${emailAccounts.length !== 1 ? 's' : ''} connected.`}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('setup')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 14px rgba(26,18,8,0.18)', transition: 'all 0.2s', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2a2016'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                + Connect Account
              </button>
            </div>

            {emailAccounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 32px', borderRadius: 16, background: 'rgba(255,255,255,0.5)', border: `1.5px dashed ${BD}` }}>
                <div style={{ fontSize: 38, marginBottom: 14, opacity: 0.35 }}>📭</div>
                <div style={{ fontFamily: '"Lora", serif', fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>No personal account connected</div>
                <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.7, maxWidth: 280, margin: '0 auto 20px' }}>
                  Connect Gmail, Zoho, or any SMTP — your email will be used for reply identification.
                </p>
                <button
                  onClick={() => setActiveTab('setup')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--tc)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 14px rgba(139,58,42,0.22)', transition: 'all 0.2s' }}
                >
                  ✦ Connect your first account
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {emailAccounts.map(acc => {
                  const isOk = acc.status === 'connected'
                  return (
                    <div key={acc.id} style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BD}`, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: isOk ? 'linear-gradient(180deg, var(--sage), var(--gold))' : 'linear-gradient(180deg, var(--tc), var(--gold))', borderRadius: '4px 0 0 4px' }} />
                      <div style={{ padding: '18px 20px 16px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ fontSize: 22, flexShrink: 0 }}>{PROVIDER_ICON[acc.provider] || '📬'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: '"Lora", serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.emailAddress}</div>
                          <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-muted)' }}>{acc.provider} · connected {new Date(acc.connectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, padding: '4px 10px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', background: isOk ? 'rgba(122,158,142,0.1)' : 'rgba(196,99,58,0.1)', color: isOk ? 'var(--sage)' : 'var(--tc)', border: `1px solid ${isOk ? 'rgba(122,158,142,0.3)' : 'rgba(196,99,58,0.3)'}`, flexShrink: 0, fontFamily: '"DM Sans", sans-serif' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: isOk ? 'var(--sage)' : 'var(--tc)' }} />
                          {isOk ? 'Connected' : 'Error'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 20px 8px 24px', borderTop: `1px solid ${FT}`, background: 'rgba(245,240,232,0.4)' }}>
                        <button
                          onClick={() => setDeleteId(acc.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 13px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', transition: 'all 0.15s', border: '1.5px solid #f5d4ce', color: 'var(--tc)', background: 'transparent' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--tc)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.border = '1.5px solid var(--tc)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--tc)'; e.currentTarget.style.border = '1.5px solid #f5d4ce' }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 2 — EMAIL SETUP                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-7 items-start">

          {/* ── Form column ────────────────────────────────────────── */}
          <section>
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontFamily: '"Lora", serif', fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.3px', marginBottom: 5 }}>Add Email Account</h2>
              <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.6, margin: 0 }}>
                Connect via SMTP — your email will appear as the reply address on letters you send.
              </p>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${BD}`, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Provider preset */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={LABEL_STYLE}>Provider</span>
                <select
                  value={preset}
                  onChange={e => applyPreset(e.target.value)}
                  style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = 'rgba(196,99,58,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(224,212,188,0.8)')}
                >
                  {Object.entries(SMTP_PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </label>

              {/* Host + Port */}
              <div style={{ display: 'flex', gap: 10 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                  <span style={LABEL_STYLE}>SMTP Host</span>
                  <input
                    value={host}
                    onChange={e => setHost(e.target.value)}
                    placeholder="smtp.example.com"
                    style={INPUT_STYLE}
                    onFocus={e => (e.target.style.borderColor = 'rgba(196,99,58,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(224,212,188,0.8)')}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 88 }}>
                  <span style={LABEL_STYLE}>Port</span>
                  <input
                    value={port}
                    onChange={e => setPort(e.target.value)}
                    placeholder="587"
                    style={INPUT_STYLE}
                    onFocus={e => (e.target.style.borderColor = 'rgba(196,99,58,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(224,212,188,0.8)')}
                  />
                </label>
              </div>

              {/* SSL toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                <div
                  onClick={() => setSecure(s => !s)}
                  className="toggle-track"
                  style={{ background: secure ? 'var(--sage)' : 'rgba(28,26,23,0.14)' }}
                >
                  <div className="toggle-thumb" style={{ transform: secure ? 'translateX(18px)' : 'translateX(2px)' }} />
                </div>
                <span style={{ fontSize: 13, fontFamily: '"DM Sans", sans-serif', color: 'var(--ink-soft)' }}>Use SSL/TLS (port 465)</span>
              </label>

              {/* Username */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={LABEL_STYLE}>Username / Email</span>
                <input
                  type="email"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="you@example.com"
                  style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = 'rgba(196,99,58,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(224,212,188,0.8)')}
                />
              </label>

              {/* Password */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={LABEL_STYLE}>Password / App Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = 'rgba(196,99,58,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(224,212,188,0.8)')}
                />
              </label>

              {/* Connect button */}
              <button
                onClick={handleConnectSmtp}
                disabled={connecting}
                style={{ marginTop: 4, width: '100%', padding: '13px 0', borderRadius: 100, border: 'none', cursor: connecting ? 'not-allowed' : 'pointer', fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 600, color: '#fff', background: connecting ? 'rgba(28,26,23,0.35)' : 'linear-gradient(135deg, #1c1a17 0%, #3d3020 100%)', boxShadow: connecting ? 'none' : '0 4px 18px rgba(28,18,8,0.22)', opacity: connecting ? 0.75 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onMouseEnter={e => { if (!connecting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(28,18,8,0.28)' } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = connecting ? 'none' : '0 4px 18px rgba(28,18,8,0.22)' }}
              >
                {connecting && (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                )}
                {connecting ? 'Verifying & Connecting…' : '✦ Connect SMTP Account'}
              </button>

              {/* Gmail OAuth — disabled */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4, borderTop: `1px solid ${FT}` }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', fontWeight: 500 }}>OAuth (Coming Soon)</div>
                <div style={{ position: 'relative', display: 'inline-block' }} className="group">
                  <button
                    disabled
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 100, background: '#fff', color: '#3c4043', border: '1.5px solid #dadce0', fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500, cursor: 'not-allowed', opacity: 0.45, width: '100%', justifyContent: 'center' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                  </button>
                  <span
                    className="group-hover:opacity-100 group-hover:visible"
                    style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: '#1c1a17', color: '#fff', fontSize: 11, padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap', opacity: 0, visibility: 'hidden', transition: 'opacity 0.15s', pointerEvents: 'none', fontFamily: '"DM Sans", sans-serif' }}
                  >
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Guide column ───────────────────────────────────────── */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>

            {/* How to connect */}
            <div style={{ background: 'rgba(122,158,142,0.06)', borderRadius: 14, border: '1px solid rgba(122,158,142,0.22)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>🧠</span>
                <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '1px' }}>How to connect</span>
              </div>
              <ol style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  'Enable IMAP/SMTP in your email settings',
                  'Generate an App Password (not your main password)',
                  'Copy your provider\'s SMTP details below',
                  'Paste them into the form and connect',
                ].map((step, i) => (
                  <li key={i} style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Provider setup guide — tabbed */}
            <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BD}`, overflow: 'hidden' }}>
              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${FT}` }}>
                {[
                  { id: 'gmail',   label: '📧 Gmail' },
                  { id: 'outlook', label: '📨 Outlook' },
                  { id: 'zoho',    label: '📮 Zoho' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setGuideTab(t.id)}
                    style={{
                      flex: 1, padding: '9px 4px', border: 'none', background: 'transparent', cursor: 'pointer',
                      fontFamily: '"DM Sans", sans-serif', fontSize: 11.5, fontWeight: guideTab === t.id ? 600 : 400,
                      color: guideTab === t.id ? 'var(--tc)' : 'var(--ink-muted)',
                      borderBottom: guideTab === t.id ? '2px solid var(--tc)' : '2px solid transparent',
                      marginBottom: '-1px', transition: 'color 0.15s, border-color 0.15s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ padding: '18px 20px' }}>
                {guideTab === 'gmail' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>Gmail Setup</div>
                    {[
                      { n: 1, text: 'Go to your Google Account → Security' },
                      { n: 2, text: 'Enable 2-Step Verification (if not already on)' },
                      { n: 3, text: 'Search "App Passwords" in the search bar' },
                      { n: 4, text: 'Create an app password → select "Mail"' },
                      { n: 5, text: 'Copy the 16-char password and paste it above' },
                    ].map(s => (
                      <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: 'rgba(196,99,58,0.1)', color: 'var(--tc)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', marginTop: 1 }}>{s.n}</span>
                        <span style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{s.text}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 6, padding: '10px 12px', borderRadius: 9, background: 'rgba(122,158,142,0.07)', border: '1px solid rgba(122,158,142,0.2)' }}>
                      <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: 'var(--sage)', fontWeight: 600, marginBottom: 4 }}>SMTP settings to use</div>
                      <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11.5, color: 'var(--ink-muted)', lineHeight: 1.8 }}>
                        <div>Host: <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>smtp.gmail.com</span></div>
                        <div>Port: <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>587</span></div>
                        <div>Password: <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>Your App Password</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {guideTab === 'outlook' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>Outlook / Microsoft 365</div>
                    {[
                      { n: 1, text: 'Go to account.microsoft.com → Security' },
                      { n: 2, text: 'Enable two-step verification' },
                      { n: 3, text: 'Go to "App passwords" and create one' },
                      { n: 4, text: 'Use your full email as the username' },
                      { n: 5, text: 'Paste the app password into the form above' },
                    ].map(s => (
                      <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: 'rgba(196,99,58,0.1)', color: 'var(--tc)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', marginTop: 1 }}>{s.n}</span>
                        <span style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{s.text}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 6, padding: '10px 12px', borderRadius: 9, background: 'rgba(122,158,142,0.07)', border: '1px solid rgba(122,158,142,0.2)' }}>
                      <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: 'var(--sage)', fontWeight: 600, marginBottom: 4 }}>SMTP settings to use</div>
                      <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11.5, color: 'var(--ink-muted)', lineHeight: 1.8 }}>
                        <div>Host: <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>smtp.office365.com</span></div>
                        <div>Port: <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>587</span></div>
                        <div>Password: <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>Your App Password</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {guideTab === 'zoho' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>Zoho Mail</div>
                    {[
                      { n: 1, text: 'Log in to mail.zoho.com → Settings' },
                      { n: 2, text: 'Go to Mail Accounts → SMTP' },
                      { n: 3, text: 'Enable SMTP access for your account' },
                      { n: 4, text: 'Use your Zoho email as username' },
                      { n: 5, text: 'Use your Zoho password (or app-specific password)' },
                    ].map(s => (
                      <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: 'rgba(196,99,58,0.1)', color: 'var(--tc)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', marginTop: 1 }}>{s.n}</span>
                        <span style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{s.text}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 6, padding: '10px 12px', borderRadius: 9, background: 'rgba(122,158,142,0.07)', border: '1px solid rgba(122,158,142,0.2)' }}>
                      <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: 'var(--sage)', fontWeight: 600, marginBottom: 4 }}>SMTP settings to use</div>
                      <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11.5, color: 'var(--ink-muted)', lineHeight: 1.8 }}>
                        <div>Host: <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>smtp.zoho.com</span></div>
                        <div>Port: <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>587</span></div>
                        <div>Password: <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>Your Zoho password</span></div>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.5, marginTop: 2 }}>
                      Indian accounts may use smtp.zoho.in — we try both automatically.
                    </div>
                  </div>
                )}
              </div>
            </div>

          </aside>
        </div>
      )}

      {/* ── Delete confirm dialog ───────────────────────────────────── */}
      {deleteId && (
        <div
          className="fixed inset-0 z-[600] flex items-center justify-center px-4"
          style={{ background: 'rgba(28,18,8,0.32)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteId(null) }}
        >
          <div
            className="w-full max-w-[360px] animate-fade-up"
            style={{ background: 'linear-gradient(150deg, #ffffff 0%, #faf7f2 100%)', borderRadius: 20, border: `1px solid ${BD}`, boxShadow: '0 24px 60px rgba(28,18,8,0.18)', overflow: 'hidden' }}
          >
            <div style={{ padding: '32px 28px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>🗑️</div>
              <h3 style={{ fontFamily: '"Lora", serif', fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, letterSpacing: '-0.3px' }}>Remove account?</h3>
              <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 24 }}>
                This email account will be disconnected.<br />You can reconnect any time.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={() => setDeleteId(null)}
                  style={{ padding: '10px 22px', borderRadius: 100, fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: 'var(--ink-muted)', border: `1.5px solid rgba(224,212,188,0.9)`, transition: 'all 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(28,26,23,0.05)'; e.currentTarget.style.color = 'var(--ink)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleting}
                  style={{ padding: '10px 22px', borderRadius: 100, fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', border: 'none', background: 'linear-gradient(135deg, #c4633a, #a84d28)', color: '#fff', boxShadow: '0 4px 14px rgba(196,99,58,0.3)', opacity: deleting ? 0.6 : 1, transition: 'all 0.18s' }}
                  onMouseEnter={e => { if (!deleting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(196,99,58,0.38)' } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(196,99,58,0.3)' }}
                >
                  {deleting ? 'Removing…' : 'Yes, Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </main>
  )
}
