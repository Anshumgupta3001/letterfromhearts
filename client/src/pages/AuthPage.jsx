import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import GoogleLoginBtn from '../components/auth/GoogleLoginBtn'
import {
  trackLoginPageViewed,
  trackSignupPageViewed,
  trackLoginSuccess,
  trackLoginFailed,
  trackSignupSuccess,
  trackSignupFailed,
  identifyUser,
} from '../utils/mixpanel'

// ── Terms & Conditions Modal ───────────────────────────────────────────────────
const TERMS_SECTIONS = [
  {
    title: '1. Introduction',
    body: 'This platform allows users to write and share personal letters. By using the service, you agree to use it respectfully and responsibly. Letter from Heart is a quiet space designed to support emotional expression and connection.',
  },
  {
    title: '2. User Responsibility',
    body: 'You are solely responsible for the content you write and share. You must not use the platform to send harmful, abusive, threatening, or illegal content. Content that violates these terms may be removed without notice.',
  },
  {
    title: '3. Privacy',
    body: "We respect your privacy. Letters are handled securely and shared only as intended within the platform's features. Personal information is not sold or shared with third parties for advertising purposes.",
  },
  {
    title: '4. Content Usage',
    body: 'By using the platform, you grant permission for the system to process your content solely for delivery and functionality purposes. We do not claim ownership of the content you write.',
  },
  {
    title: '5. Communication',
    body: 'Emails sent through the platform are delivered using third-party SMTP services. Delivery, open tracking, and click tracking may vary based on recipient email client settings and spam filters.',
  },
  {
    title: '6. Limitation of Liability',
    body: 'We are not responsible for how recipients interpret, respond to, or act upon letters sent through the platform. The platform is provided as-is without warranties of any kind.',
  },
  {
    title: '7. Changes to Terms',
    body: 'We may update these terms from time to time to reflect changes to the platform or applicable laws. Continued use of the service after changes constitutes acceptance of the updated terms.',
  },
]

function TermsModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(40,3,15,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-[560px] rounded-[20px] overflow-hidden"
        style={{
          background: 'var(--paper)',
          border: '0.5px solid rgba(40,3,15,0.1)',
          boxShadow: '0 24px 64px rgba(40,3,15,0.18)',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5 flex-shrink-0"
          style={{ borderBottom: '0.5px solid rgba(40,3,15,0.08)' }}
        >
          <div>
            <div className="font-lora text-[18px] font-normal tracking-[-0.03em]" style={{ color: 'var(--ink)' }}>Terms &amp; Conditions</div>
            <div className="text-[12px] mt-0.5 font-light" style={{ color: 'var(--ink-muted)' }}>Last updated April 2025</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150"
            style={{ background: 'rgba(40,3,15,0.06)', color: 'var(--ink-soft)', border: 'none', cursor: 'pointer', fontSize: 16 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(40,3,15,0.11)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(40,3,15,0.06)'}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-7 py-5 flex flex-col gap-5" style={{ flex: 1 }}>
          <p className="text-[13px] font-light leading-[1.75]" style={{ color: 'var(--ink-muted)' }}>
            Please read these terms carefully. By creating an account, you acknowledge that you have read and understood the following.
          </p>

          {TERMS_SECTIONS.map(s => (
            <div key={s.title}>
              <div className="text-[13px] font-semibold mb-1.5" style={{ color: 'var(--tc)' }}>
                {s.title}
              </div>
              <p className="text-[13px] font-light leading-[1.75]" style={{ color: 'var(--ink-soft)' }}>
                {s.body}
              </p>
            </div>
          ))}

          <div
            className="rounded-[12px] px-4 py-3.5 mt-1"
            style={{ background: 'rgba(40,3,15,0.05)', border: '0.5px solid rgba(40,3,15,0.15)' }}
          >
            <p className="text-[12px] font-light leading-[1.7] italic" style={{ color: 'var(--ink-muted)' }}>
              For questions or concerns, please contact us at{' '}
              <span className="font-medium not-italic" style={{ color: 'var(--tc)' }}>support@letterfromheart.com</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-7 py-4 flex-shrink-0 flex justify-end"
          style={{ borderTop: '0.5px solid rgba(40,3,15,0.08)' }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-pill font-sans text-[13px] font-medium border-none cursor-pointer transition-all duration-200 hover:-translate-y-px"
            style={{ background: 'var(--ink)', color: 'var(--cream)', boxShadow: '0 4px 12px rgba(40,3,15,0.15)' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

const ROLES = [
  {
    id:          'both',
    short:       'Both',
    label:       'Seeker + Listener',
    desc:        'I want to write and listen — give words and receive them.',
    recommended: true,
  },
  {
    id:    'seeker',
    short: 'Write',
    label: 'Seeker',
    desc:  'I want to write letters — to myself, a stranger, or someone I know.',
  },
  {
    id:    'listener',
    short: 'Listen',
    label: 'Listener',
    desc:  'I want to read letters and show up for people who need to be heard.',
  },
]

// ── Icon components ───────────────────────────────────────────────────────────
function IconPerson() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function IconMail() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  )
}
function IconLock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}
function IconEye({ open }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}


// ── Field components ──────────────────────────────────────────────────────────
function FieldInput({ label, type = 'text', value, onChange, placeholder, hint, icon }) {
  const [focused, setFocused] = useState(false)
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium" style={{ color: 'var(--ink-muted)' }}>{label}</span>
      <div className="relative">
        {icon && (
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: focused ? 'var(--tc)' : 'var(--ink-muted)' }}
          >
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full py-[11px] rounded-[10px] font-sans text-[14px] text-ink outline-none transition-all duration-200"
          style={{
            paddingLeft: icon ? '40px' : '14px',
            paddingRight: '14px',
            background: 'var(--cream)',
            border: `1px solid ${focused ? 'var(--tc)' : 'rgba(40,3,15,0.14)'}`,
            boxShadow: focused ? '0 0 0 3px rgba(40,3,15,0.08)' : 'none',
          }}
        />
      </div>
      {hint && <span className="text-[12px] font-light" style={{ color: 'var(--ink-muted)' }}>{hint}</span>}
    </label>
  )
}

function PasswordInput({ label, value, onChange, placeholder }) {
  const [showPw, setShowPw] = useState(false)
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{label}</span>
      <div style={{ position: 'relative' }}>
        <input
          type={showPw ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="current-password"
          style={{
            width: '100%', height: 48, padding: '0 48px 0 14px', borderRadius: 8, boxSizing: 'border-box',
            background: '#FFFFFF', border: '1px solid var(--rose)', outline: 'none',
            fontFamily: '"General Sans", sans-serif', fontSize: 15, color: 'var(--ink)',
          }}
        />
        <button
          type="button"
          onClick={() => setShowPw(v => !v)}
          aria-label={showPw ? 'Hide password' : 'Show password'}
          style={{ position: 'absolute', right: 2, top: 2, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <IconEye open={showPw} />
        </button>
      </div>
    </label>
  )
}

// ── Decorative floating letter cards (left panel) ─────────────────────────────
function FloatingCard({ style, children }) {
  return (
    <div
      className="absolute rounded-[12px] px-4 py-3"
      style={{
        background: 'rgba(255,255,255,0.65)',
        border: '0.5px solid rgba(40,3,15,0.15)',
        boxShadow: '0 8px 32px rgba(40,3,15,0.08)',
        backdropFilter: 'blur(6px)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function getEmailFromUrl() {
  return new URLSearchParams(window.location.search).get('email') || ''
}
function getReplyFromUrl() {
  return new URLSearchParams(window.location.search).get('reply') || ''
}

export default function AuthPage({ initialMode = 'signup', onBack }) {
  const { login } = useApp()
  const emailFromUrl = getEmailFromUrl()
  const replyFromUrl = getReplyFromUrl()
  const hasDraft = (() => { try { return !!localStorage.getItem('lfh_draft') } catch { return false } })()
  // Priority: ?reply → login (existing user), ?email → signup (invite), initialMode (URL-driven)
  const [mode, setMode] = useState(() => {
    if (replyFromUrl) return 'login'
    if (emailFromUrl) return 'signup'
    return initialMode
  })

  const [name,            setName]            = useState('')
  const [email,           setEmail]           = useState(() => emailFromUrl)
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role,            setRole]            = useState('both')
  const [source,          setSource]          = useState('')
  const [otherSource,     setOtherSource]     = useState('')

  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [termsOpen, setTermsOpen] = useState(false)

  // Belt-and-suspenders: lazy initializer above handles the common case;
  // this effect catches any edge case where the initializer ran before the
  // URL was stable (StrictMode double-invoke, auth redirect timing, etc.)
  useEffect(() => {
    const emailParam = new URLSearchParams(window.location.search).get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
      setMode('signup')
    }
  }, [])

  // Track page views — fires on mount and on tab switch between Login / Signup
  useEffect(() => {
    if (mode === 'login') trackLoginPageViewed()
    else trackSignupPageViewed()
  }, [mode])

  function reset() {
    setError(''); setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setRole('both'); setSource(''); setOtherSource('')
  }
  function switchMode(m) {
    reset()
    setMode(m)
    window.history.replaceState({}, '', m === 'login' ? '/login' : '/signup')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (!name.trim()) {
        setError('Please add your name.')
        return
      }
    }

    setLoading(true)
    try {
      const url  = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
      const body = mode === 'signup'
        ? { name, email, password, role, source: source === 'Other' && !otherSource.trim() ? '' : source, otherSource }
        : { email, password }
      const res  = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        const errMsg = json.error || 'Something went wrong.'
        setError(errMsg)
        if (mode === 'login') trackLoginFailed(errMsg)
        else trackSignupFailed(errMsg)
        return
      }
      if (mode === 'login') {
        trackLoginSuccess('email')
      } else {
        trackSignupSuccess('email', role)
      }
      identifyUser(json.user)
      await login(json.token, json.user)
    } catch (e) {
      const errMsg = e.message || 'Network error.'
      setError(errMsg)
      if (mode === 'login') trackLoginFailed(errMsg)
      else trackSignupFailed(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const isSignup = mode === 'signup'
  const inputStyle = {
    width: '100%', height: 48, padding: '0 14px', borderRadius: 8, boxSizing: 'border-box',
    background: '#FFFFFF', border: '1px solid var(--rose)', outline: 'none',
    fontFamily: '"General Sans", sans-serif', fontSize: 15, color: 'var(--ink)',
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--paper)' }}>

      {/* ── LEFT — form ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px clamp(20px, 4vw, 40px)' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: onBack ? 'pointer' : 'default', padding: 0 }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--lemon)" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.6.1.2.3.2.4 0 .7-1.4 2.2-2.6 4.3-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>
            </span>
            <span style={{ fontFamily: '"Gambetta", Georgia, serif', fontSize: 22, letterSpacing: '-0.03em', color: 'var(--ink)' }}>Letter from Heart</span>
          </button>
          <div style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
            {isSignup ? 'Already have an account?' : 'New here?'}{' '}
            <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')} style={{ background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', color: 'var(--ink)', fontWeight: 500, fontSize: 14, fontFamily: '"General Sans", sans-serif', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              {isSignup ? 'Log in' : 'Create an account'}
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center" style={{ padding: '12px 20px 48px' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <h1 style={{ margin: 0, fontFamily: '"Gambetta", Georgia, serif', fontWeight: 400, fontSize: 'clamp(34px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
              {isSignup ? <>Say what you <em>never said.</em></> : <>Welcome <em>back.</em></>}
            </h1>
            <p style={{ margin: '12px 0 28px', fontSize: 16, lineHeight: 1.5, color: 'var(--ink-muted)' }}>
              {isSignup ? 'Create your free account. It takes less than a minute.' : 'Log in to keep writing.'}
            </p>

            {hasDraft && isSignup && (
              <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 8, background: 'var(--lemon)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink)' }}>
                Your letter is saved. Create your account and we’ll take you straight back to it.
              </div>
            )}
            {replyFromUrl && (
              <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 8, background: 'var(--lemon)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink)' }}>
                Someone sent you a letter. Log in to read it, or create an account if you're new.
              </div>
            )}
            {emailFromUrl && isSignup && !replyFromUrl && (
              <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 8, background: 'var(--lemon)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink)' }}>
                Someone wrote you a letter. Create an account to read it and write back.
              </div>
            )}

            <GoogleLoginBtn mode={mode} />

            <div className="flex items-center gap-3" style={{ margin: '18px 0' }}>
              <div className="flex-1 h-px" style={{ background: 'var(--sand)' }} />
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>or with email</span>
              <div className="flex-1 h-px" style={{ background: 'var(--sand)' }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isSignup && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Your name</span>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="First name is fine" autoComplete="given-name" style={inputStyle} />
                </label>
              )}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Email</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={inputStyle} />
              </label>
              <PasswordInput
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
              />

              {isSignup && (
                <div role="group" aria-label="How do you want to use Letter from Heart?" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>I want to…</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
                    {ROLES.map(r => {
                      const active = role === r.id
                      return (
                        <button key={r.id} type="button" onClick={() => setRole(r.id)} aria-pressed={active}
                          title={r.desc}
                          style={{
                            minHeight: 48, padding: '8px 6px', borderRadius: 8, cursor: 'pointer',
                            fontFamily: '"General Sans", sans-serif', fontSize: 14, fontWeight: 500, lineHeight: 1.25,
                            background: active ? 'var(--ink)' : '#FFFFFF',
                            color: active ? 'var(--paper)' : 'var(--ink)',
                            border: active ? '1px solid var(--ink)' : '1px solid var(--rose)',
                          }}>
                          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            {r.short}
                            {r.recommended && <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.75 }}>Recommended</span>}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.45 }}>{ROLES.find(r => r.id === role)?.desc}</span>
                </div>
              )}

              {isSignup && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Where did you hear about us? <span style={{ fontWeight: 400, color: 'var(--ink-muted)' }}>(optional)</span></span>
                  <select value={source} onChange={e => { setSource(e.target.value); setOtherSource('') }} style={{ ...inputStyle, color: source ? 'var(--ink)' : 'var(--ink-muted)', cursor: 'pointer' }}>
                    <option value="">Choose one</option>
                    {['Instagram', 'TikTok', 'Twitter (X)', 'Friend / Referral', 'Google Search', 'LinkedIn', 'Other'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {source === 'Other' && (
                    <input type="text" value={otherSource} onChange={e => setOtherSource(e.target.value)} placeholder="Tell us where" style={inputStyle} />
                  )}
                </label>
              )}

              {error && (
                <div role="alert" style={{ fontSize: 14, padding: '10px 12px', borderRadius: 8, background: 'var(--warm)', color: 'var(--ink)' }}>{error}</div>
              )}

              <button type="submit" disabled={loading}
                style={{
                  height: 50, marginTop: 4, borderRadius: 8, border: 'none', cursor: loading ? 'default' : 'pointer',
                  background: 'var(--ink)', color: 'var(--paper)', opacity: loading ? 0.6 : 1,
                  fontFamily: '"General Sans", sans-serif', fontSize: 16, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {loading && (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                )}
                {loading ? (isSignup ? 'Creating your account…' : 'Logging in…') : (isSignup ? 'Create free account' : 'Log in')}
              </button>
            </form>

            <p style={{ margin: '18px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-muted)', textAlign: 'center' }}>
              By continuing you agree to our{' '}
              <button type="button" onClick={() => setTermsOpen(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 13, fontFamily: '"General Sans", sans-serif', textDecoration: 'underline', textUnderlineOffset: 3 }}>Terms &amp; Conditions</button>.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT — lemon panel with a letter ───────────────────────────── */}
      <div className="hidden lg:flex" style={{ width: '46%', padding: 16, boxSizing: 'border-box' }}>
        <div style={{ flex: 1, background: 'var(--lemon)', borderRadius: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 48, gap: 28 }}>
          <article style={{ position: 'relative', width: '100%', maxWidth: 420, background: '#FFFFFF', borderRadius: 16, padding: '32px 32px 28px', boxShadow: '0 16px 40px rgba(40,3,15,0.12)', boxSizing: 'border-box' }}>
            <span style={{ position: 'absolute', top: -16, right: 22, background: 'var(--ink)', color: 'var(--paper)', borderRadius: 69, padding: '8px 14px', fontSize: 13, fontWeight: 500, transform: 'rotate(3deg)' }}>Written by a person</span>
            <p style={{ margin: 0, fontFamily: '"Gambetta", Georgia, serif', fontSize: 30, letterSpacing: '-0.03em', color: 'var(--ink)' }}>Dear Mom,</p>
            <p style={{ margin: '12px 0 0', fontFamily: '"Gambetta", Georgia, serif', letterSpacing: '-0.03em', fontSize: 22, lineHeight: 1.5, color: 'var(--ink)' }}>
              I never thanked you for driving me to every practice in that old car. I notice it now, every time I drive my own kids.
            </p>
            <p style={{ margin: '14px 0 0', fontFamily: '"General Sans", sans-serif', fontSize: 17, color: 'var(--ink-muted)' }}>— Sarah</p>
          </article>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {['Free to write', 'Private until you send it', 'No ads, never sold'].map(t => (
              <span key={t} style={{ fontSize: 14, fontWeight: 500, background: 'var(--paper)', color: 'var(--ink)', borderRadius: 8, padding: '9px 12px' }}>{t}</span>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink)', opacity: 0.7 }}>Example letter</p>
        </div>
      </div>

      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
    </div>
  )
}
