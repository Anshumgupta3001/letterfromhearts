import { useState } from 'react'
import { useApp } from '../context/AppContext'
import GoogleLoginBtn from '../components/auth/GoogleLoginBtn'

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
      style={{ background: 'rgba(28,26,23,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-[560px] rounded-[20px] overflow-hidden"
        style={{
          background: 'var(--paper)',
          border: '0.5px solid rgba(28,26,23,0.1)',
          boxShadow: '0 24px 64px rgba(28,26,23,0.18)',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5 flex-shrink-0"
          style={{ borderBottom: '0.5px solid rgba(28,26,23,0.08)' }}
        >
          <div>
            <div className="font-lora text-[18px] font-medium" style={{ color: 'var(--ink)' }}>Terms &amp; Conditions</div>
            <div className="text-[11px] mt-0.5 font-light" style={{ color: 'var(--ink-muted)' }}>Last updated April 2025</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150"
            style={{ background: 'rgba(28,26,23,0.06)', color: 'var(--ink-soft)', border: 'none', cursor: 'pointer', fontSize: 16 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,26,23,0.11)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(28,26,23,0.06)'}
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
              <div className="text-[12px] uppercase tracking-[1px] font-semibold mb-1.5" style={{ color: 'var(--tc)' }}>
                {s.title}
              </div>
              <p className="text-[13px] font-light leading-[1.75]" style={{ color: 'var(--ink-soft)' }}>
                {s.body}
              </p>
            </div>
          ))}

          <div
            className="rounded-[12px] px-4 py-3.5 mt-1"
            style={{ background: 'rgba(196,99,58,0.05)', border: '0.5px solid rgba(196,99,58,0.15)' }}
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
          style={{ borderTop: '0.5px solid rgba(28,26,23,0.08)' }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-pill font-sans text-[13px] font-medium border-none cursor-pointer transition-all duration-200 hover:-translate-y-px"
            style={{ background: 'var(--ink)', color: 'var(--cream)', boxShadow: '0 4px 12px rgba(28,26,23,0.15)' }}
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
    id:    'seeker',
    icon:  '✍️',
    label: 'Seeker',
    desc:  'I want to write letters — to myself, a stranger, or someone I know.',
  },
  {
    id:    'listener',
    icon:  '👂',
    label: 'Listener',
    desc:  'I want to read letters and show up for people who need to be heard.',
  },
  {
    id:    'both',
    icon:  '🌿',
    label: 'Seeker + Listener',
    desc:  'I want to write and listen — give words and receive them.',
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
      <span className="text-[11px] uppercase tracking-[1.2px] font-medium" style={{ color: 'var(--ink-muted)' }}>{label}</span>
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
            border: `1px solid ${focused ? 'var(--tc)' : 'rgba(28,26,23,0.14)'}`,
            boxShadow: focused ? '0 0 0 3px rgba(196,99,58,0.08)' : 'none',
          }}
        />
      </div>
      {hint && <span className="text-[10px] font-light" style={{ color: 'var(--ink-muted)' }}>{hint}</span>}
    </label>
  )
}

function PasswordInput({ label, value, onChange, placeholder }) {
  const [focused,  setFocused]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-[1.2px] font-medium" style={{ color: 'var(--ink-muted)' }}>{label}</span>
      <div className="relative">
        <span
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: focused ? 'var(--tc)' : 'var(--ink-muted)' }}
        >
          <IconLock />
        </span>
        <input
          type={showPw ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full py-[11px] rounded-[10px] font-sans text-[14px] text-ink outline-none transition-all duration-200"
          style={{
            paddingLeft: '40px',
            paddingRight: '44px',
            background: 'var(--cream)',
            border: `1px solid ${focused ? 'var(--tc)' : 'rgba(28,26,23,0.14)'}`,
            boxShadow: focused ? '0 0 0 3px rgba(196,99,58,0.08)' : 'none',
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPw(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors duration-150"
          style={{ color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
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
        border: '0.5px solid rgba(196,99,58,0.15)',
        boxShadow: '0 8px 32px rgba(28,26,23,0.08)',
        backdropFilter: 'blur(6px)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default function AuthPage() {
  const { login } = useApp()
  const [mode, setMode] = useState('login')

  const [name,            setName]            = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role,            setRole]            = useState('both')
  const [source,          setSource]          = useState('')
  const [otherSource,     setOtherSource]     = useState('')

  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [termsOpen, setTermsOpen] = useState(false)

  function reset() {
    setError(''); setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setRole('both'); setSource(''); setOtherSource('')
  }
  function switchMode(m) { reset(); setMode(m) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      if (!source) {
        setError('Please tell us where you heard about us.')
        return
      }
      if (source === 'Other' && !otherSource.trim()) {
        setError('Please specify where you heard about us.')
        return
      }
    }

    setLoading(true)
    try {
      const url  = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
      const body = mode === 'signup'
        ? { name, email, password, role, source, otherSource }
        : { email, password }
      const res  = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Something went wrong.'); return }
      await login(json.token, json.user)
    } catch (e) {
      setError(e.message || 'Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>

      {/* ── LEFT PANEL — emotional hero ──────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between px-14 py-12 relative overflow-hidden flex-shrink-0"
        style={{
          width: '44%',
          background: 'linear-gradient(145deg, #fdf6ec 0%, #f5e9d8 50%, #ede0cc 100%)',
          borderRight: '0.5px solid rgba(196,99,58,0.12)',
        }}
      >
        {/* Soft blur blobs */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 320, height: 320, top: -80, right: -80, background: 'rgba(196,99,58,0.06)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 240, height: 240, bottom: 60, left: -60, background: 'rgba(122,158,142,0.08)', filter: 'blur(50px)' }}
        />

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <img src="/favicon.png" alt="Letter from Heart" style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0 }} />
          <div className="font-lora text-[18px] italic font-medium" style={{ color: 'var(--ink)' }}>Letter from Heart</div>
        </div>

        {/* Center — main copy + floating cards */}
        <div className="flex-1 flex flex-col justify-center py-12 relative">
          {/* Floating letter card 1 */}
          <FloatingCard style={{ top: '0%', right: '4%', transform: 'rotate(3deg)', maxWidth: 210 }}>
            <div className="text-[10px] uppercase tracking-[1px] font-medium mb-1.5" style={{ color: 'var(--tc)' }}>To my future self</div>
            <div className="font-lora text-[13px] leading-[1.7]" style={{ color: 'var(--ink-soft)' }}>
              "I hope you've been kind to yourself. You deserved rest back then."
            </div>
            <div className="text-[10px] mt-2" style={{ color: 'var(--ink-muted)' }}>— Anonymous · Personal</div>
          </FloatingCard>

          {/* Floating letter card 2 */}
          <FloatingCard style={{ bottom: '8%', left: '0%', transform: 'rotate(-2deg)', maxWidth: 200 }}>
            <div className="text-[10px] uppercase tracking-[1px] font-medium mb-1.5" style={{ color: 'var(--sage)' }}>A stranger wrote</div>
            <div className="font-lora text-[13px] leading-[1.7]" style={{ color: 'var(--ink-soft)' }}>
              "You are not alone in feeling this way."
            </div>
            <div className="text-[10px] mt-2" style={{ color: 'var(--ink-muted)' }}>— Anonymous · Caring Stranger</div>
          </FloatingCard>

          {/* Main headline */}
          <div className="pl-2">
            <h1 className="font-lora text-[38px] font-medium leading-[1.25] tracking-[-0.5px] mb-4" style={{ color: 'var(--ink)' }}>
              Words that<br />
              <em className="italic" style={{ color: 'var(--tc)' }}>deserve</em> to be<br />
              heard.
            </h1>
            <p className="text-[14px] leading-[1.75] max-w-[280px]" style={{ color: 'var(--ink-muted)', fontWeight: 300 }}>
              Write letters to yourself, strangers, or no one. Sometimes the act of writing is enough.
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="text-[11px] font-light" style={{ color: 'var(--ink-muted)' }}>
          Private · Anonymous · No judgment.
        </div>
      </div>

      {/* ── RIGHT PANEL — auth form ──────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/favicon.png" alt="Letter from Heart" style={{ width: 40, height: 40, objectFit: 'contain', margin: '0 auto 10px' }} />
            <h1 className="font-lora text-[24px] font-medium tracking-[-0.5px]" style={{ color: 'var(--ink)' }}>Letter from Heart</h1>
            <p className="text-[13px] font-light mt-1" style={{ color: 'var(--ink-muted)' }}>
              {mode === 'login' ? 'Welcome back.' : 'A place for words that matter.'}
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-[20px] px-8 py-7"
            style={{
              background: 'var(--paper)',
              border: '0.5px solid rgba(28,26,23,0.1)',
              boxShadow: '0 16px 48px rgba(28,26,23,0.09)',
            }}
          >
            {/* Heading */}
            <div className="mb-6">
              <h2 className="font-lora text-[22px] font-medium" style={{ color: 'var(--ink)' }}>
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-[13px] font-light mt-1" style={{ color: 'var(--ink-muted)' }}>
                {mode === 'login' ? 'Sign in to continue writing.' : 'Join and start writing today.'}
              </p>
            </div>

            {/* Mode switcher */}
            <div className="flex gap-1 p-1 rounded-[11px] mb-6" style={{ background: 'var(--cream)' }}>
              {['login', 'signup'].map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="flex-1 py-2 rounded-[9px] font-sans text-[13px] font-medium cursor-pointer transition-all duration-200 border-none capitalize"
                  style={mode === m
                    ? { background: 'var(--ink)', color: 'var(--cream)', boxShadow: '0 2px 8px rgba(28,26,23,0.15)' }
                    : { background: 'transparent', color: 'var(--ink-muted)' }}
                >
                  {m === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'signup' && (
                <FieldInput label="Your name" value={name} onChange={setName} placeholder="Your name" icon={<IconPerson />} />
              )}
              <FieldInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<IconMail />} />

              {/* Password */}
              <div className="flex flex-col gap-1">
                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                />
                {mode === 'signup' && (
                  <span className="text-[10px] font-light" style={{ color: 'var(--ink-muted)' }}>
                    Minimum 6 characters
                  </span>
                )}
              </div>

              {/* Confirm password — signup only */}
              {mode === 'signup' && (
                <PasswordInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Re-enter your password"
                />
              )}

              {/* Account type selector — signup only */}
              {mode === 'signup' && (
                <div>
                  <div className="text-[11px] uppercase tracking-[1.2px] font-medium mb-2.5" style={{ color: 'var(--ink-muted)' }}>
                    How do you want to use this?
                  </div>
                  <div className="flex flex-col gap-2">
                    {ROLES.map(r => {
                      const active = role === r.id
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className="flex items-start gap-3 px-4 py-3 rounded-[11px] text-left cursor-pointer border-none outline-none transition-all duration-200"
                          style={{
                            background: active ? 'rgba(196,99,58,0.06)' : 'var(--cream)',
                            border: `1px solid ${active ? 'var(--tc)' : 'rgba(28,26,23,0.1)'}`,
                            boxShadow: active ? '0 0 0 3px rgba(196,99,58,0.07)' : 'none',
                          }}
                        >
                          <span className="text-[17px] flex-shrink-0 mt-0.5">{r.icon}</span>
                          <div className="flex-1">
                            <div className="text-[13px] font-medium font-sans" style={{ color: active ? 'var(--tc)' : 'var(--ink)' }}>
                              {r.label}
                            </div>
                            <div className="text-[11px] font-light mt-0.5" style={{ color: 'var(--ink-muted)' }}>{r.desc}</div>
                          </div>
                          {active && (
                            <span className="ml-auto flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ background: 'var(--tc)' }}>
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Where did you hear about us — signup only */}
              {mode === 'signup' && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] uppercase tracking-[1.2px] font-medium" style={{ color: 'var(--ink-muted)' }}>
                    Where did you hear about us?
                  </span>
                  <select
                    value={source}
                    onChange={e => { setSource(e.target.value); setOtherSource('') }}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 10,
                      background: 'var(--cream)', border: `1px solid ${source ? 'var(--tc)' : 'rgba(28,26,23,0.14)'}`,
                      fontFamily: '"DM Sans", sans-serif', fontSize: 14, color: source ? 'var(--ink)' : 'rgba(28,26,23,0.4)',
                      outline: 'none', cursor: 'pointer', appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231C1A17' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                      boxShadow: source ? '0 0 0 3px rgba(196,99,58,0.08)' : 'none',
                      transition: 'border 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <option value="" disabled>Select an option</option>
                    {['Instagram', 'Twitter (X)', 'Friend / Referral', 'Google Search', 'LinkedIn', 'Other'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {source === 'Other' && (
                    <input
                      type="text"
                      value={otherSource}
                      onChange={e => setOtherSource(e.target.value)}
                      placeholder="Please specify"
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: 10,
                        background: 'var(--cream)', border: '1px solid rgba(28,26,23,0.14)',
                        fontFamily: '"DM Sans", sans-serif', fontSize: 14, color: 'var(--ink)',
                        outline: 'none', transition: 'border 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => { e.target.style.border = '1px solid var(--tc)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,99,58,0.08)' }}
                      onBlur={e => { e.target.style.border = '1px solid rgba(28,26,23,0.14)'; e.target.style.boxShadow = 'none' }}
                    />
                  )}
                </div>
              )}

              {error && (
                <div
                  className="text-[12px] px-3 py-2.5 rounded-[9px] font-sans"
                  style={{ background: 'rgba(196,99,58,0.07)', color: 'var(--tc)', border: '0.5px solid rgba(196,99,58,0.2)' }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-[13px] rounded-pill font-sans text-[14px] font-medium border-none cursor-pointer transition-all duration-200 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                style={{ background: 'var(--ink)', color: 'var(--cream)', boxShadow: '0 4px 14px rgba(28,26,23,0.18)' }}
              >
                {loading && (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                )}
                {loading
                  ? (mode === 'login' ? 'Logging in…' : 'Creating account…')
                  : (mode === 'login' ? 'Log In →' : 'Create Account →')}
              </button>

            </form>

            {/* ── OR divider ── */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: 'rgba(28,26,23,0.1)' }} />
              <span className="text-[11px] font-light tracking-wide" style={{ color: 'var(--ink-muted)' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(28,26,23,0.1)' }} />
            </div>

            {/* Google button — mode-aware */}
            <GoogleLoginBtn mode={mode} />

          </div>

          <p className="text-center text-[11px] font-light mt-5 leading-[1.6]" style={{ color: 'var(--ink-muted)' }}>
            Your letters stay private. No ads. No judgment.
          </p>

          {/* Terms link */}
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="text-[11px] font-light border-none bg-transparent cursor-pointer transition-colors duration-150 underline underline-offset-2"
              style={{ color: 'var(--ink-muted)', textDecorationColor: 'rgba(28,26,23,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--tc)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
            >
              View Terms &amp; Conditions
            </button>
          </div>
        </div>
      </div>

      {/* Terms modal */}
      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
    </div>
  )
}
