import { useState } from 'react'
import { useApp } from '../context/AppContext'
import GoogleLoginBtn from '../components/auth/GoogleLoginBtn'

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

// ── Password strength ─────────────────────────────────────────────────────────
function getPasswordStrength(pw) {
  if (!pw) return null
  let score = 0
  if (pw.length >= 8)          score++
  if (/[A-Z]/.test(pw))        score++
  if (/[a-z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 2) return { label: 'Weak',   color: '#c4633a', bars: 1 }
  if (score <= 3) return { label: 'Medium', color: '#d4a017', bars: 2 }
  return              { label: 'Strong',  color: '#5a9e7a', bars: 3 }
}

function PasswordStrengthBar({ password }) {
  const strength = getPasswordStrength(password)
  if (!strength) return null
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-full transition-all duration-300"
            style={{
              background: i <= strength.bars ? strength.color : 'rgba(28,26,23,0.1)',
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-medium" style={{ color: strength.color, minWidth: 36 }}>
        {strength.label}
      </span>
    </div>
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

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function reset() {
    setError(''); setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setRole('both')
  }
  function switchMode(m) { reset(); setMode(m) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    setLoading(true)
    try {
      const url  = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
      const body = mode === 'signup'
        ? { name, email, password, role }
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
        <div>
          <div className="text-[28px] mb-2">💌</div>
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
            <div className="text-[34px] mb-2">💌</div>
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
                <FieldInput label="Your name" value={name} onChange={setName} placeholder="Divya" icon={<IconPerson />} />
              )}
              <FieldInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<IconMail />} />

              {/* Password with strength indicator on signup */}
              <div className="flex flex-col gap-1">
                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  placeholder={mode === 'signup' ? 'Min. 8 chars, mixed case + symbol' : 'Your password'}
                />
                {mode === 'signup' && <PasswordStrengthBar password={password} />}
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
        </div>
      </div>
    </div>
  )
}
