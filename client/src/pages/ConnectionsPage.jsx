import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

const BD = '#E0D4BC'
const FT = '#F2EBE0'

const SMTP_PRESETS = {
  '':         { label: 'Custom',              host: '',                                  port: '587', secure: false },
  gmail:      { label: 'Gmail',               host: 'smtp.gmail.com',                   port: '587', secure: false },
  outlook:    { label: 'Outlook / Office 365',host: 'smtp.office365.com',               port: '587', secure: false },
  zoho:       { label: 'Zoho Mail',           host: 'smtp.zoho.com',                    port: '587', secure: false },
  sendgrid:   { label: 'SendGrid',            host: 'smtp.sendgrid.net',                port: '587', secure: false },
  ses:        { label: 'Amazon SES',          host: 'email-smtp.us-east-1.amazonaws.com',port: '587', secure: false },
  godaddy:    { label: 'GoDaddy',             host: 'smtpout.secureserver.net',         port: '465', secure: true  },
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-pill text-[13px] font-sans font-medium text-cream shadow-xl animate-fade-up" style={{ background: type === 'error' ? '#c4633a' : '#7a9e8e', border: '0.5px solid rgba(255,255,255,0.15)', pointerEvents: 'none' }}>
      {type === 'error' ? '✗ ' : '✓ '}{msg}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ConnectionsPage() {
  const { emailAccounts, setEmailAccounts, refreshEmailAccounts, userEmailMode, updateAuthUser } = useApp()

  const [modalOpen, setModalOpen]     = useState(false)
  const [tab, setTab]                 = useState('smtp')
  const [preset, setPreset]           = useState('')
  const [host, setHost]               = useState('')
  const [port, setPort]               = useState('587')
  const [secure, setSecure]           = useState(false)
  const [username, setUsername]       = useState('')
  const [password, setPassword]       = useState('')
  const [connecting, setConnecting]   = useState(false)
  const [deleteId, setDeleteId]       = useState(null)
  const [deleting, setDeleting]       = useState(false)
  const [savingMode, setSavingMode]   = useState(false)
  const [toast, setToast]             = useState(null)
  const [connectBtnHov, setConnectBtnHov] = useState(false)

  function showToast(msg, type = 'success') { setToast({ msg, type }) }

  async function handleSetEmailMode(mode) {
    if (mode === userEmailMode) return
    setSavingMode(true)
    try {
      const res  = await apiFetch('/api/auth/me', { method: 'PATCH', body: JSON.stringify({ emailMode: mode }) })
      const json = await res.json()
      if (!res.ok) { showToast(json.error || 'Failed to update.', 'error'); return }
      updateAuthUser({ emailMode: mode })
      showToast(mode === 'system' ? 'System email selected (coming soon).' : 'Using your own email.')
    } catch (e) { showToast(e.message || 'Network error.', 'error') }
    finally { setSavingMode(false) }
  }

  useEffect(() => { refreshEmailAccounts() }, [refreshEmailAccounts])

  function applyPreset(key) {
    setPreset(key)
    const p = SMTP_PRESETS[key]
    if (!p) return
    setHost(p.host); setPort(p.port); setSecure(p.secure)
  }

  function resetForm() { setPreset(''); setHost(''); setPort('587'); setSecure(false); setUsername(''); setPassword('') }
  function closeModal() { setModalOpen(false); resetForm(); setTab('smtp') }

  async function handleConnectSmtp() {
    if (!host.trim())              return showToast('SMTP host is required.', 'error')
    if (!port || isNaN(Number(port))) return showToast('Port must be a number.', 'error')
    if (!username.trim())          return showToast('Username / email is required.', 'error')
    if (!password)                 return showToast('Password is required.', 'error')
    if (!username.includes('@'))   return showToast('Username must be a valid email address.', 'error')
    setConnecting(true)
    try {
      const res  = await apiFetch('/api/email-accounts/smtp', { method: 'POST', body: JSON.stringify({ provider: preset || 'smtp', emailAddress: username.trim(), host: host.trim(), port: Number(port), secure, username: username.trim(), password, defaultFrom: username.trim() }) })
      const json = await res.json()
      if (!res.ok) { showToast(json.error || 'Failed to connect.', 'error'); return }
      showToast('Email account connected!')
      closeModal()
      await refreshEmailAccounts()
    } catch (e) { showToast(e.message || 'Network error.', 'error') }
    finally { setConnecting(false) }
  }

  function handleGmailConnect() { window.location.href = '/api/email-accounts/gmail/connect?token=demo' }

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

  const PROVIDER_ICON = { gmail: '📧', zoho: '📮', outlook: '📨', smtp: '📬', sendgrid: '📤', ses: '📡', godaddy: '🌐' }

  return (
    <main className="page-enter px-5 sm:px-10 md:px-16" style={{ maxWidth: 960, margin: '0 auto', paddingTop: 52, paddingBottom: 72 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 18, height: 1, background: BD, display: 'inline-block' }} />
          Email setup
        </div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: 12 }}>
          <span style={{ display: 'inline-block', width: 38, height: 38, background: 'linear-gradient(135deg, #eef2ee, #f2f5ee)', borderRadius: 10, textAlign: 'center', lineHeight: '38px', fontSize: 20, marginRight: 10, verticalAlign: 'middle', position: 'relative', top: -3, border: `1px solid ${BD}` }}>🔗</span>
          Connections
        </h1>
        <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: 420 }}>
          Choose how your letters travel — from your inbox, or ours. Either way, they arrive with care.
        </p>
      </div>

      {/* ── Email Mode ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 16, fontWeight: 500 }}>
          How should letters travel?
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { id: 'custom', icon: '✉️', label: 'Your own email',  desc: 'Letters arrive from your inbox. Personal and direct.' },
            { id: 'system', icon: '📮', label: 'Our platform',    desc: 'We send on your behalf. Anonymous and simple.', soon: true },
          ].map(opt => {
            const active = userEmailMode === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => handleSetEmailMode(opt.id)}
                disabled={savingMode}
                style={{
                  background: '#fff', borderRadius: 14, border: `1px solid ${active ? 'var(--tc)' : BD}`,
                  overflow: 'hidden', position: 'relative', cursor: 'pointer',
                  boxShadow: active ? '0 6px 24px rgba(196,99,58,0.1)' : 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s', textAlign: 'left',
                  padding: 0,
                }}
              >
                {/* Left accent */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: active ? 'linear-gradient(180deg, var(--tc), var(--gold))' : 'transparent', borderRadius: '4px 0 0 4px', transition: 'background 0.2s' }} />
                <div style={{ padding: '20px 20px 20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>{opt.icon}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {opt.soon && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: 'rgba(139,126,200,0.1)', color: 'var(--purple)', letterSpacing: '0.5px' }}>Soon</span>}
                      {active && (
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--tc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 16, fontWeight: 600, color: active ? 'var(--tc)' : 'var(--ink)', marginBottom: 6 }}>{opt.label}</div>
                  <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.6 }}>{opt.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Connected accounts ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8, fontWeight: 500 }}>Connected accounts</div>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-soft)' }}>
            {emailAccounts.length === 0 ? 'No accounts connected yet.' : `${emailAccounts.length} account${emailAccounts.length !== 1 ? 's' : ''} ready to send.`}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          onMouseEnter={() => setConnectBtnHov(true)}
          onMouseLeave={() => setConnectBtnHov(false)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: connectBtnHov ? '#2a2016' : 'var(--ink)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 24px', fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 14px rgba(26,18,8,0.2)', transform: connectBtnHov ? 'translateY(-2px)' : 'translateY(0)', transition: 'all 0.2s' }}
        >
          + Connect account
        </button>
      </div>

      {emailAccounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '72px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.5)', border: `1.5px dashed ${BD}` }}>
          <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.4 }}>📭</div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>Your letters need a way to travel</div>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto 28px' }}>
            Connect a Gmail, Zoho, or SMTP account and your letters will arrive in real inboxes.
          </p>
          <button onClick={() => setModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--tc)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 24px', fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 14px rgba(139,58,42,0.25)' }}>
            ✦ Connect your first account
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {emailAccounts.map(acc => {
            const isOk = acc.status === 'connected'
            return (
              <div
                key={acc.id}
                style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BD}`, overflow: 'hidden', position: 'relative' }}
              >
                {/* Left accent */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: isOk ? 'linear-gradient(180deg, var(--sage), var(--gold))' : 'linear-gradient(180deg, var(--tc), var(--gold))', borderRadius: '4px 0 0 4px' }} />

                {/* Card body */}
                <div style={{ padding: '20px 24px 18px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 24, flexShrink: 0 }}>{PROVIDER_ICON[acc.provider] || '📬'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.emailAddress}</div>
                    <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)' }}>{acc.provider} · connected {new Date(acc.connectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', background: isOk ? 'rgba(122,158,142,0.1)' : 'rgba(196,99,58,0.1)', color: isOk ? 'var(--sage)' : 'var(--tc)', border: `1px solid ${isOk ? 'rgba(122,158,142,0.3)' : 'rgba(196,99,58,0.3)'}`, flexShrink: 0 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: isOk ? 'var(--sage)' : 'var(--tc)' }} />
                    {isOk ? 'Connected' : 'Error'}
                  </span>
                </div>

                {/* Card footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '10px 24px 10px 32px', borderTop: `1px solid ${FT}`, background: 'rgba(245,240,232,0.4)' }}>
                  <button
                    onClick={() => setDeleteId(acc.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', transition: 'all 0.15s', border: '1.5px solid #f5d4ce', color: 'var(--tc)', background: 'transparent' }}
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

      {/* ── Add Account Modal ────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: 'rgba(26,18,8,0.45)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="w-full max-w-[500px] mx-4 overflow-hidden animate-fade-up" style={{ background: 'var(--cream)', border: `1px solid ${BD}`, borderRadius: 16, boxShadow: '0 24px 64px rgba(26,18,8,0.18)' }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${FT}` }}>
              <span className="font-playfair text-[18px] font-semibold" style={{ color: 'var(--ink)' }}>Add Email Account</span>
              <button onClick={closeModal} className="w-7 h-7 flex items-center justify-center cursor-pointer bg-transparent border-none text-[20px]" style={{ color: 'var(--ink-muted)' }}>×</button>
            </div>

            <div className="flex px-6 pt-4 gap-2">
              {[{ id: 'smtp', label: '⚙️ SMTP' }, { id: 'gmail', label: '📧 Gmail OAuth' }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-[7px] rounded-pill text-[12px] font-medium font-sans cursor-pointer transition-all duration-200 border-none" style={tab === t.id ? { background: 'var(--ink)', color: 'var(--cream)' } : { background: 'var(--paper)', color: 'var(--ink-muted)', border: `1px solid ${BD}` }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="px-6 py-5">
              {tab === 'gmail' ? (
                <div className="text-center py-4">
                  <p className="font-lora italic text-[13px] mb-5 leading-[1.7]" style={{ color: 'var(--ink-soft)' }}>Connect your Gmail account securely via Google OAuth.<br/>You'll be redirected to Google to authorize access.</p>
                  <button onClick={handleGmailConnect} className="inline-flex items-center gap-2 px-6 py-3 rounded-pill font-sans text-[13px] font-medium cursor-pointer border-none" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[1px] font-medium" style={{ color: 'var(--ink-muted)' }}>Provider Preset</span>
                    <select value={preset} onChange={e => applyPreset(e.target.value)} className="w-full px-3 py-[9px] rounded-[8px] font-sans text-[13px] outline-none cursor-pointer" style={{ background: 'var(--paper)', border: `1px solid ${BD}`, color: 'var(--ink)' }}>
                      {Object.entries(SMTP_PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </label>
                  <div className="flex gap-2">
                    <label className="flex flex-col gap-1 flex-1">
                      <span className="text-[11px] uppercase tracking-[1px] font-medium" style={{ color: 'var(--ink-muted)' }}>SMTP Host</span>
                      <input value={host} onChange={e => setHost(e.target.value)} placeholder="smtp.example.com" className="w-full px-3 py-[9px] rounded-[8px] font-sans text-[13px] outline-none" style={{ background: 'var(--paper)', border: `1px solid ${BD}`, color: 'var(--ink)' }} />
                    </label>
                    <label className="flex flex-col gap-1 w-[90px]">
                      <span className="text-[11px] uppercase tracking-[1px] font-medium" style={{ color: 'var(--ink-muted)' }}>Port</span>
                      <input value={port} onChange={e => setPort(e.target.value)} placeholder="587" className="w-full px-3 py-[9px] rounded-[8px] font-sans text-[13px] outline-none" style={{ background: 'var(--paper)', border: `1px solid ${BD}`, color: 'var(--ink)' }} />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div onClick={() => setSecure(s => !s)} className="toggle-track" style={{ background: secure ? 'var(--sage)' : 'rgba(28,26,23,0.15)' }}>
                      <div className="toggle-thumb" style={{ transform: secure ? 'translateX(18px)' : 'translateX(2px)' }} />
                    </div>
                    <span className="text-[12px] font-sans" style={{ color: 'var(--ink-soft)' }}>Use SSL/TLS (port 465)</span>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[1px] font-medium" style={{ color: 'var(--ink-muted)' }}>Username / Email</span>
                    <input type="email" value={username} onChange={e => setUsername(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-[9px] rounded-[8px] font-sans text-[13px] outline-none" style={{ background: 'var(--paper)', border: `1px solid ${BD}`, color: 'var(--ink)' }} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[1px] font-medium" style={{ color: 'var(--ink-muted)' }}>Password / App Password</span>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full px-3 py-[9px] rounded-[8px] font-sans text-[13px] outline-none" style={{ background: 'var(--paper)', border: `1px solid ${BD}`, color: 'var(--ink)' }} />
                  </label>
                  <button
                    onClick={handleConnectSmtp}
                    disabled={connecting}
                    className="mt-1 w-full py-[11px] rounded-pill font-sans text-[13px] font-medium border-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: connecting ? 'rgba(28,26,23,0.5)' : 'var(--ink)', color: 'var(--cream)' }}
                  >
                    {connecting && <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>}
                    {connecting ? 'Verifying & Connecting…' : 'Connect SMTP'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ───────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center" style={{ background: 'rgba(26,18,8,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-[380px] mx-4 overflow-hidden animate-fade-up" style={{ background: 'var(--cream)', border: `1px solid ${BD}`, borderRadius: 16, boxShadow: '0 24px 64px rgba(26,18,8,0.18)' }}>
            <div className="px-6 py-6 text-center">
              <div className="text-[32px] mb-3">🗑️</div>
              <div className="font-playfair text-[18px] font-semibold mb-2" style={{ color: 'var(--ink)' }}>Remove account?</div>
              <div className="text-[13px] font-light mb-6 leading-[1.6]" style={{ color: 'var(--ink-muted)' }}>This email account will be disconnected. You can reconnect any time.</div>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setDeleteId(null)} className="px-5 py-[9px] rounded-pill font-sans text-[13px] cursor-pointer bg-transparent" style={{ color: 'var(--ink-muted)', border: `1px solid ${BD}` }}>Cancel</button>
                <button onClick={() => handleDelete(deleteId)} disabled={deleting} className="px-5 py-[9px] rounded-pill font-sans text-[13px] font-medium border-none cursor-pointer disabled:opacity-50" style={{ background: 'var(--tc)', color: '#fff' }}>
                  {deleting ? 'Removing…' : 'Yes, Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
