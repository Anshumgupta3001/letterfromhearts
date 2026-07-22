import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

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

// Provider setup guides
const GUIDES = {
  gmail: {
    label: '📧 Gmail',
    steps: [
      'Go to your Google Account → Security',
      'Enable 2-Step Verification (if not already on)',
      'Search "App Passwords" in the search bar',
      'Create an app password → select "Mail"',
      'Copy the 16-char password and paste it in the form',
    ],
    smtp: { host: 'smtp.gmail.com', port: '587', password: 'Your App Password' },
  },
  outlook: {
    label: '📨 Outlook',
    steps: [
      'Go to account.microsoft.com → Security',
      'Enable two-step verification',
      'Go to "App passwords" and create one',
      'Use your full email as the username',
      'Paste the app password into the form',
    ],
    smtp: { host: 'smtp.office365.com', port: '587', password: 'Your App Password' },
  },
  zoho: {
    label: '📮 Zoho',
    steps: [
      'Log in to mail.zoho.com → Settings',
      'Go to Mail Accounts → SMTP',
      'Enable SMTP access for your account',
      'Use your Zoho email as username',
      'Use your Zoho password (or app-specific password)',
    ],
    smtp: { host: 'smtp.zoho.com', port: '587', password: 'Your Zoho password' },
    note: 'Indian accounts may use smtp.zoho.in — we try both automatically.',
  },
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [onDone])
  return (
    <div
      className="conn-toast"
      style={{ background: type === 'error' ? '#C74E3B' : '#2E7D5B' }}
    >
      {type === 'error' ? '✗ ' : '✓ '}{msg}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ConnectionsPage() {
  const { emailAccounts, setEmailAccounts, refreshEmailAccounts } = useApp()

  const [activeTab, setActiveTab]   = useState('accounts')
  const [guideTab, setGuideTab]     = useState('gmail')
  const [preset, setPreset]         = useState('')
  const [host, setHost]             = useState('')
  const [port, setPort]             = useState('587')
  const [secure, setSecure]         = useState(false)
  const [username, setUsername]     = useState('')
  const [password, setPassword]     = useState('')
  const [connecting, setConnecting] = useState(false)
  const [deleteId, setDeleteId]     = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [toast, setToast]           = useState(null)
  const [emailFrom, setEmailFrom]   = useState('')

  function showToast(msg, type = 'success') { setToast({ msg, type }) }

  useEffect(() => { refreshEmailAccounts() }, [refreshEmailAccounts])

  useEffect(() => {
    apiFetch('/api/send-email/system-info')
      .then(r => r.json())
      .then(j => { if (j.success && j.emailFrom) setEmailFrom(j.emailFrom) })
      .catch(() => {})
  }, [])

  function applyPreset(key) {
    setPreset(key)
    const p = SMTP_PRESETS[key]
    if (!p) return
    setHost(p.host); setPort(p.port); setSecure(p.secure)
  }

  function resetForm() {
    setPreset(''); setHost(''); setPort('587'); setSecure(false); setUsername(''); setPassword('')
  }

  function switchTab(id) {
    setActiveTab(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
        body: JSON.stringify({
          provider: preset || 'smtp', emailAddress: username.trim(),
          host: host.trim(), port: Number(port), secure,
          username: username.trim(), password, defaultFrom: username.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) { showToast(json.error || 'Failed to connect.', 'error'); return }
      showToast('Email account connected!')
      resetForm()
      await refreshEmailAccounts()
      setActiveTab('accounts')
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

  const guide = GUIDES[guideTab]

  return (
    <main className="sunrise-conn">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="wrap">

        <h1 className="c-h1 fade">
          Connections
          <svg viewBox="0 0 120 10" fill="none" preserveAspectRatio="none" className="underline">
            <path d="M2 6 C 35 2, 70 9, 118 4" stroke="var(--sky)" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </h1>
        <p className="c-sub fade" style={{ animationDelay: '.06s' }}>
          Choose how your letters travel — from your inbox, or ours.
        </p>

        {/* ── Tabs ── */}
        <div className="tabs fade" style={{ animationDelay: '.12s' }}>
          {[
            { id: 'accounts', label: 'Connected' },
            { id: 'setup',    label: 'Add Email' },
          ].map(t => (
            <button
              key={t.id}
              className={`tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => switchTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ TAB 1: CONNECTED ══ */}
        {activeTab === 'accounts' && (
          <div className="panel">
            <div className="kicker fade" style={{ animationDelay: '.18s' }}>Email settings</div>
            <p className="blurb fade" style={{ animationDelay: '.2s' }}>
              Your letters are sent securely using our platform email — no setup needed.
            </p>

            <div className="acc system fade" style={{ animationDelay: '.24s' }}>
              <div className="acc-ico">📮</div>
              <div className="acc-info">
                <div className="acc-lbl">Sending from</div>
                <div className="acc-mail">{emailFrom || 'noreply@letterfromheart.com'}</div>
                <div className="acc-note">Always available · No configuration required</div>
              </div>
              <span className="status st-default">Default</span>
            </div>

            <div className="sec-row fade" style={{ animationDelay: '.3s' }}>
              <div className="sec-left">
                <div className="kicker">My connected accounts</div>
                <p>
                  {emailAccounts.length === 0
                    ? 'No personal accounts connected yet.'
                    : `${emailAccounts.length} account${emailAccounts.length !== 1 ? 's' : ''} connected.`}
                </p>
              </div>
              <button className="connect-btn" onClick={() => switchTab('setup')}>+ Connect Account</button>
            </div>

            {emailAccounts.length === 0 ? (
              <div className="empty fade" style={{ animationDelay: '.34s' }}>
                <div className="empty-ico">📭</div>
                <h3>No personal account connected</h3>
                <p>Connect Gmail, Zoho, or any SMTP — your email will be used for reply identification.</p>
                <button className="connect-btn" onClick={() => switchTab('setup')}>✦ Connect your first account</button>
              </div>
            ) : (
              <div className="stackgap fade" style={{ animationDelay: '.34s' }}>
                {emailAccounts.map(acc => {
                  const isOk = acc.status === 'connected'
                  return (
                    <div key={acc.id} className="acc">
                      <div className="acc-ico">{PROVIDER_ICON[acc.provider] || '📬'}</div>
                      <div className="acc-info">
                        <div className="acc-mail">{acc.emailAddress}</div>
                        <div className="acc-note">
                          {acc.provider} · connected {new Date(acc.connectedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <span className={`status ${isOk ? 'st-ok' : 'st-err'}`}>{isOk ? 'Connected' : 'Error'}</span>
                      <button className="remove" onClick={() => setDeleteId(acc.id)}>✕ Remove</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB 2: ADD EMAIL ══ */}
        {activeTab === 'setup' && (
          <div className="panel">
            <div className="setup fade" style={{ animationDelay: '.18s' }}>

              {/* ── Form ── */}
              <div className="form-card">
                <h2>Add Email Account</h2>
                <p className="fsub">Connect via SMTP — your email will appear as the reply address on letters you send.</p>

                <div className="field">
                  <label htmlFor="conn-provider">Provider</label>
                  <select id="conn-provider" value={preset} onChange={e => applyPreset(e.target.value)}>
                    {Object.entries(SMTP_PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>

                <div className="two">
                  <div className="field">
                    <label htmlFor="conn-host">SMTP Host</label>
                    <input id="conn-host" value={host} onChange={e => setHost(e.target.value)} placeholder="smtp.example.com" />
                  </div>
                  <div className="field">
                    <label htmlFor="conn-port">Port</label>
                    <input id="conn-port" value={port} onChange={e => setPort(e.target.value)} placeholder="587" />
                  </div>
                </div>

                <button type="button" className="toggle-row" onClick={() => setSecure(s => !s)} aria-pressed={secure}>
                  <span className={`track ${secure ? 'on' : ''}`}><span className="thumb" /></span>
                  <span className="toggle-label">Use SSL/TLS (port 465)</span>
                </button>

                <div className="field">
                  <label htmlFor="conn-user">Username / Email</label>
                  <input id="conn-user" type="email" value={username} onChange={e => setUsername(e.target.value)} placeholder="you@example.com" />
                </div>

                <div className="field">
                  <label htmlFor="conn-pass">Password / App Password</label>
                  <input id="conn-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" />
                </div>

                <button className="submit" onClick={handleConnectSmtp} disabled={connecting}>
                  {connecting ? 'Verifying & connecting…' : '✦ Connect SMTP Account'}
                </button>

                <div className="oauth">
                  <div className="oauth-lbl">OAuth <span className="soon">Coming soon</span></div>
                  <button className="goog" disabled title="Coming soon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              </div>

              {/* ── Guide ── */}
              <aside className="guide">
                <div className="howto">
                  <div className="howto-t">🧠 How to connect</div>
                  {[
                    'Enable IMAP/SMTP in your email settings',
                    'Generate an App Password (not your main password)',
                    "Copy your provider's SMTP details below",
                    'Paste them into the form and connect',
                  ].map((s, i) => (
                    <div className="step" key={i}>
                      <span className="n">{i + 1}</span>
                      <p>{s}</p>
                    </div>
                  ))}
                </div>

                <div className="gcard">
                  <div className="gtabs">
                    {Object.entries(GUIDES).map(([k, g]) => (
                      <button
                        key={k}
                        className={`gtab ${guideTab === k ? 'active' : ''}`}
                        onClick={() => setGuideTab(k)}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                  <div className="gbody">
                    {guide.steps.map((s, i) => (
                      <div className="step" key={i}>
                        <span className="n">{i + 1}</span>
                        <p>{s}</p>
                      </div>
                    ))}
                    <div className="smtpbox">
                      <div className="smtpbox-t">SMTP settings to use</div>
                      <div>Host: <b>{guide.smtp.host}</b></div>
                      <div>Port: <b>{guide.smtp.port}</b></div>
                      <div>Password: <b>{guide.smtp.password}</b></div>
                    </div>
                    {guide.note && <p className="gnote">{guide.note}</p>}
                  </div>
                </div>
              </aside>

            </div>
          </div>
        )}

        {/* ── Delete confirm ── */}
        {deleteId && (
          <div className="conn-modal-bg" onClick={e => { if (e.target === e.currentTarget) setDeleteId(null) }}>
            <div className="conn-modal">
              <div className="conn-del-ico">🗑️</div>
              <h3>Remove account?</h3>
              <p>This email account will be disconnected.<br />You can reconnect any time.</p>
              <div className="conn-modal-actions">
                <button className="conn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="conn-danger" onClick={() => handleDelete(deleteId)} disabled={deleting}>
                  {deleting ? 'Removing…' : 'Yes, remove'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        .sunrise-conn{ background:var(--cream); min-height:100%; }
        .sunrise-conn .wrap{ max-width:980px; margin:0 auto; padding:52px 28px 120px; }

        .sunrise-conn .c-h1{ font-size:clamp(30px,4.2vw,44px); font-weight:800; letter-spacing:-.02em; position:relative; display:inline-block; color:var(--ink); margin:0; }
        .sunrise-conn .underline{ position:absolute; left:0; bottom:-8px; width:72%; height:9px; pointer-events:none; }
        .sunrise-conn .c-sub{ margin-top:16px; font-size:15.5px; color:var(--ink-muted); font-weight:500; }

        .sunrise-conn .tabs{ margin-top:38px; display:flex; gap:8px; flex-wrap:wrap; }
        .sunrise-conn .tab{ border:2px solid var(--line); background:var(--card); color:var(--ink-soft); border-radius:100px; padding:11px 22px; font-family:inherit; font-size:13.5px; font-weight:700; cursor:pointer; transition:all .2s; }
        .sunrise-conn .tab:hover{ border-color:var(--yellow); background:#FFF7E3; }
        .sunrise-conn .tab.active{ background:var(--ink); border-color:var(--ink); color:#fff; }
        .sunrise-conn .panel{ margin-top:32px; }

        .sunrise-conn .kicker{ font-size:11.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--ink-muted); margin-bottom:14px; }
        .sunrise-conn .blurb{ font-size:14px; font-weight:500; color:var(--ink-muted); line-height:1.6; margin-bottom:16px; }

        /* Account rows */
        .sunrise-conn .acc{ background:var(--card); border:2px solid var(--line); border-radius:22px; padding:22px 24px; display:flex; align-items:center; gap:16px; transition:transform .25s, border-color .25s, box-shadow .25s; flex-wrap:wrap; }
        .sunrise-conn .acc:hover{ transform:translateY(-3px); box-shadow:0 14px 36px rgba(59,54,99,.1); }
        .sunrise-conn .acc.system{ background:#EAF6EF; border-color:#D4EBDD; }
        .sunrise-conn .acc-ico{ width:48px; height:48px; border-radius:16px; background:#fff; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
        .sunrise-conn .acc-info{ flex:1; min-width:0; }
        .sunrise-conn .acc-lbl{ font-size:10.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-muted); margin-bottom:4px; }
        .sunrise-conn .acc-mail{ font-size:15.5px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--ink); }
        .sunrise-conn .acc-note{ font-size:12.5px; font-weight:500; color:var(--ink-muted); margin-top:3px; }
        .sunrise-conn .status{ font-size:11px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; padding:7px 14px; border-radius:100px; flex-shrink:0; display:inline-flex; align-items:center; gap:6px; }
        .sunrise-conn .status::before{ content:''; width:6px; height:6px; border-radius:50%; background:currentColor; }
        .sunrise-conn .st-ok, .sunrise-conn .st-default{ background:#fff; color:#2E7D5B; }
        .sunrise-conn .st-err{ background:#fff; color:#C74E3B; }
        .sunrise-conn .remove{ background:#fff; border:2px solid var(--line); border-radius:100px; font-family:inherit; font-size:12px; font-weight:800; color:#C74E3B; cursor:pointer; padding:9px 16px; flex-shrink:0; transition:all .2s; }
        .sunrise-conn .remove:hover{ background:#C74E3B; border-color:#C74E3B; color:#fff; }

        .sunrise-conn .sec-row{ margin:44px 0 16px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
        .sunrise-conn .sec-left .kicker{ margin-bottom:5px; }
        .sunrise-conn .sec-left p{ font-size:13.5px; font-weight:600; color:var(--ink-soft); margin:0; }
        .sunrise-conn .connect-btn{ background:var(--tc); color:#fff; border:none; border-radius:100px; padding:13px 24px; font-family:inherit; font-size:13.5px; font-weight:800; cursor:pointer; transition:transform .2s, box-shadow .2s; white-space:nowrap; }
        .sunrise-conn .connect-btn:hover{ transform:scale(1.05); box-shadow:0 10px 26px rgba(244,129,63,.4); }
        .sunrise-conn .stackgap{ display:flex; flex-direction:column; gap:12px; }

        /* Empty */
        .sunrise-conn .empty{ background:var(--card); border:3px dashed var(--blush); border-radius:28px; padding:52px 32px; text-align:center; }
        .sunrise-conn .empty-ico{ width:64px; height:64px; border-radius:50%; background:var(--blush); display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 18px; }
        .sunrise-conn .empty h3{ font-size:19px; font-weight:800; margin:0 0 8px; color:var(--ink); }
        .sunrise-conn .empty p{ font-size:13.5px; font-weight:500; color:var(--ink-muted); line-height:1.6; max-width:34ch; margin:0 auto 22px; }

        /* Setup */
        .sunrise-conn .setup{ display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; }
        .sunrise-conn .form-card{ background:var(--card); border:2px solid var(--line); border-radius:26px; padding:30px; }
        .sunrise-conn .form-card h2{ font-size:21px; font-weight:800; letter-spacing:-.01em; margin:0 0 6px; color:var(--ink); }
        .sunrise-conn .fsub{ font-size:13px; font-weight:500; color:var(--ink-muted); line-height:1.6; margin:0 0 24px; }
        .sunrise-conn .field{ margin-bottom:16px; }
        .sunrise-conn .field label{ display:block; font-size:11px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-muted); margin-bottom:7px; }
        .sunrise-conn .field input, .sunrise-conn .field select{ width:100%; padding:13px 16px; border-radius:14px; border:2px solid var(--line); background:#fff; font-family:inherit; font-size:13.5px; font-weight:600; color:var(--ink); outline:none; transition:border-color .2s, box-shadow .2s; }
        .sunrise-conn .field input:focus, .sunrise-conn .field select:focus{ border-color:var(--tc); box-shadow:0 0 0 4px rgba(244,129,63,.12); }
        .sunrise-conn .field input::placeholder{ color:#C4C1D4; font-weight:500; }
        .sunrise-conn .two{ display:grid; grid-template-columns:1fr 100px; gap:12px; }

        .sunrise-conn .toggle-row{ display:flex; align-items:center; gap:12px; margin-bottom:16px; cursor:pointer; user-select:none; background:none; border:none; padding:0; font-family:inherit; }
        .sunrise-conn .track{ width:46px; height:26px; border-radius:100px; background:#E5E2EF; position:relative; transition:background .2s; flex-shrink:0; display:block; }
        .sunrise-conn .track.on{ background:var(--mint); }
        .sunrise-conn .thumb{ position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#fff; box-shadow:0 2px 6px rgba(0,0,0,.15); transition:transform .2s; display:block; }
        .sunrise-conn .track.on .thumb{ transform:translateX(20px); }
        .sunrise-conn .toggle-label{ font-size:13px; font-weight:600; color:var(--ink-soft); }

        .sunrise-conn .submit{ width:100%; background:var(--ink); color:#fff; border:none; border-radius:100px; padding:16px; font-family:inherit; font-size:14.5px; font-weight:800; cursor:pointer; transition:background .2s, transform .2s; }
        .sunrise-conn .submit:hover:not(:disabled){ background:var(--tc); transform:translateY(-2px); }
        .sunrise-conn .submit:disabled{ opacity:.6; cursor:default; }

        .sunrise-conn .oauth{ margin-top:22px; padding-top:22px; border-top:2px solid var(--line); }
        .sunrise-conn .oauth-lbl{ font-size:10.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-muted); margin-bottom:10px; }
        .sunrise-conn .soon{ display:inline-block; margin-left:6px; background:var(--yellow); color:var(--ink); font-size:9.5px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; padding:3px 9px; border-radius:100px; }
        .sunrise-conn .goog{ width:100%; display:flex; align-items:center; justify-content:center; gap:10px; background:#fff; border:2px solid var(--line); border-radius:100px; padding:13px; font-family:inherit; font-size:13px; font-weight:700; color:var(--ink-soft); cursor:not-allowed; opacity:.5; }

        /* Guide */
        .sunrise-conn .guide{ display:flex; flex-direction:column; gap:16px; position:sticky; top:24px; }
        .sunrise-conn .howto{ background:#EAF6EF; border-radius:22px; padding:24px; }
        .sunrise-conn .howto-t{ font-size:12px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#2E7D5B; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .sunrise-conn .step{ display:flex; gap:12px; margin-bottom:12px; }
        .sunrise-conn .step:last-child{ margin-bottom:0; }
        .sunrise-conn .step .n{ width:24px; height:24px; border-radius:50%; background:#fff; color:#2E7D5B; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .sunrise-conn .step p{ font-size:13px; font-weight:600; color:#3D6B52; line-height:1.55; margin:0; }

        .sunrise-conn .gcard{ background:var(--card); border:2px solid var(--line); border-radius:22px; overflow:hidden; }
        .sunrise-conn .gtabs{ display:flex; border-bottom:2px solid var(--line); }
        .sunrise-conn .gtab{ flex:1; background:none; border:none; padding:13px 4px; font-family:inherit; font-size:12px; font-weight:700; color:var(--ink-muted); cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; transition:all .2s; }
        .sunrise-conn .gtab.active{ color:var(--tc-2); border-bottom-color:var(--tc); }
        .sunrise-conn .gbody{ padding:20px 22px; }
        .sunrise-conn .gbody .step .n{ background:var(--blush); color:#B05A1F; }
        .sunrise-conn .gbody .step p{ color:var(--ink-soft); }
        .sunrise-conn .smtpbox{ margin-top:14px; background:#FFF7E3; border-radius:16px; padding:14px 16px; }
        .sunrise-conn .smtpbox-t{ font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#8A6D1B; margin-bottom:8px; }
        .sunrise-conn .smtpbox div{ font-size:12.5px; font-weight:600; color:var(--ink-muted); line-height:1.9; }
        .sunrise-conn .smtpbox b{ color:var(--ink); font-weight:800; }
        .sunrise-conn .gnote{ margin-top:10px; font-size:11.5px; font-weight:500; color:var(--ink-muted); line-height:1.5; }

        /* Toast */
        .sunrise-conn .conn-toast{ position:fixed; bottom:24px; left:50%; transform:translateX(-50%); z-index:9999; padding:13px 22px; border-radius:100px; font-size:13px; font-weight:700; color:#fff; box-shadow:0 14px 36px rgba(59,54,99,.25); pointer-events:none; animation:connToast .4s cubic-bezier(.2,.8,.3,1.2); }
        @keyframes connToast{ from{ opacity:0; transform:translateX(-50%) translateY(12px) } to{ opacity:1; transform:translateX(-50%) translateY(0) } }

        /* Delete modal */
        .sunrise-conn .conn-modal-bg{ position:fixed; inset:0; z-index:600; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(59,54,99,.4); backdrop-filter:blur(6px); }
        .sunrise-conn .conn-modal{ background:#fff; border-radius:28px; padding:36px 32px 30px; width:100%; max-width:400px; text-align:center; box-shadow:0 30px 70px rgba(59,54,99,.25); animation:connPop .3s cubic-bezier(.2,.8,.3,1.2); }
        @keyframes connPop{ from{ opacity:0; transform:scale(.94) } to{ opacity:1; transform:none } }
        .sunrise-conn .conn-del-ico{ font-size:36px; margin-bottom:14px; }
        .sunrise-conn .conn-modal h3{ font-size:20px; font-weight:800; color:var(--ink); margin:0 0 10px; }
        .sunrise-conn .conn-modal p{ font-size:13.5px; font-weight:500; color:var(--ink-muted); line-height:1.65; margin:0 0 24px; }
        .sunrise-conn .conn-modal-actions{ display:flex; gap:10px; justify-content:center; }
        .sunrise-conn .conn-cancel{ padding:13px 24px; border-radius:100px; border:2px solid var(--line); background:#fff; color:var(--ink-soft); font-family:inherit; font-size:13.5px; font-weight:700; cursor:pointer; transition:background .2s; }
        .sunrise-conn .conn-cancel:hover{ background:var(--card); }
        .sunrise-conn .conn-danger{ padding:13px 26px; border-radius:100px; border:none; background:#C74E3B; color:#fff; font-family:inherit; font-size:13.5px; font-weight:800; cursor:pointer; transition:transform .2s; }
        .sunrise-conn .conn-danger:hover:not(:disabled){ transform:translateY(-2px); }
        .sunrise-conn .conn-danger:disabled{ opacity:.6; cursor:default; }

        .sunrise-conn .fade{ opacity:0; transform:translateY(16px); animation:sunFade .6s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes sunFade{ to{ opacity:1; transform:none } }
        @media (prefers-reduced-motion:reduce){
          .sunrise-conn .fade{ animation:none; opacity:1; transform:none }
          .sunrise-conn .conn-toast, .sunrise-conn .conn-modal{ animation:none }
        }
        @media (max-width:860px){
          .sunrise-conn .setup{ grid-template-columns:1fr; }
          .sunrise-conn .guide{ position:static; }
        }
        @media (max-width:560px){
          .sunrise-conn .wrap{ padding:36px 20px 90px; }
          .sunrise-conn .form-card{ padding:24px 20px; }
        }
      `}</style>
    </main>
  )
}
