import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'
import ProgressDots from '../components/ProgressDots'
import SendEmailModal from '../components/SendEmailModal'

const MOODS = [
  { id: 'vent',      emoji: '🌧️', label: 'I need to vent',  activeStyle: { background: 'var(--ink-soft)', borderColor: 'var(--ink-soft)' } },
  { id: 'joy',       emoji: '🌟', label: 'Pure joy',         activeStyle: { background: 'var(--gold)', borderColor: 'var(--gold)' } },
  { id: 'love',      emoji: '💌', label: 'Love & warmth',    activeStyle: { background: 'var(--tc)', borderColor: 'var(--tc)' } },
  { id: 'grief',     emoji: '🕯️', label: 'Grief & loss',    activeStyle: { background: 'var(--sage)', borderColor: 'var(--sage)' } },
  { id: 'gratitude', emoji: '🌿', label: 'Gratitude',        activeStyle: { background: '#7A6E5C', borderColor: '#7A6E5C' } },
  { id: 'longing',   emoji: '🌙', label: 'Longing',          activeStyle: { background: 'var(--purple)', borderColor: 'var(--purple)' } },
]

const CRISIS_WORDS = ["end my life", "kill myself", "want to die", "can't go on", "suicidal", "hurt myself"]

// ── Step header ───────────────────────────────────────────────────────────────
function StepLabel({ n, title, subtitle, onBack }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] tracking-[2px] uppercase font-medium" style={{ color: 'var(--tc)' }}>
          Step {n} of 3
        </div>
        {onBack && (
          <button
            onClick={onBack}
            style={{ fontSize: 12.5, fontFamily: '"DM Sans", sans-serif', color: 'var(--ink)', fontWeight: 500, background: 'rgba(28,26,23,0.06)', border: '1px solid rgba(28,26,23,0.12)', borderRadius: 7, cursor: 'pointer', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,26,23,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(28,26,23,0.06)'}
          >
            ← Back
          </button>
        )}
      </div>
      <h2 style={{ fontFamily: '"Lora", serif', fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.3px', marginBottom: 6 }}>
        {title}
      </h2>
      <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
        {subtitle}
      </p>
    </div>
  )
}

// ── Step 1 ────────────────────────────────────────────────────────────────────
function Step1({ mode, setMode, email, setEmail, onNext, onBack, canWriteStranger }) {
  const canProceed = mode && (mode !== 'known' || email.includes('@'))

  const MODES = [
    { id: 'stranger', icon: '📬', name: 'A caring stranger',  desc: 'A real listener finds it and writes back.',           eg: '"I just needed someone to hear this."'   },
    { id: 'known',    icon: '💌', name: 'Someone I know',     desc: 'Sent directly. They receive a beautiful letter.',     eg: '"Mum, I\'ve been meaning to say this."' },
    { id: 'self',     icon: '🪞', name: 'No one / myself',    desc: 'Write it and let it go. No reply needed.',            eg: '"Dear younger me. Dear Dad."'           },
  ]

  return (
    <div className="animate-fade-up">
      <StepLabel n={1} title="Who is this letter for?" subtitle="Choose how this letter will travel." onBack={onBack} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {MODES.map(m => {
          const disabled = m.id === 'stranger' && !canWriteStranger
          const active   = mode === m.id
          return (
            <div
              key={m.id}
              onClick={() => !disabled && setMode(m.id)}
              style={{
                background: disabled
                  ? 'rgba(28,26,23,0.02)'
                  : active
                  ? m.id === 'stranger' ? 'rgba(122,158,142,0.06)' : m.id === 'known' ? 'rgba(196,99,58,0.06)' : 'rgba(139,126,200,0.07)'
                  : 'var(--paper)',
                border: active
                  ? m.id === 'stranger' ? '1.5px solid var(--sage)' : m.id === 'known' ? '1.5px solid var(--tc)' : '1.5px solid var(--purple)'
                  : '1px solid rgba(28,26,23,0.09)',
                borderRadius: 12,
                padding: '18px 18px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.42 : 1,
                transform: active ? 'translateY(-2px)' : '',
                boxShadow: active ? '0 6px 20px rgba(28,26,23,0.08)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 24, display: 'block', marginBottom: 10 }}>{m.icon}</span>
              <div style={{ fontFamily: '"Lora", serif', fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 5, lineHeight: 1.2 }}>{m.name}</div>
              <div style={{ fontFamily: 'Lora, serif', fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.65, marginBottom: 10 }}>{m.desc}</div>
              <div
                style={{
                  fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 11,
                  color: disabled ? 'var(--sage)' : 'var(--ink-muted)',
                  paddingTop: 10, borderTop: '1px solid rgba(28,26,23,0.07)',
                  lineHeight: 1.5,
                }}
              >
                {disabled ? 'Listeners read — they don\'t write to strangers.' : m.eg}
              </div>
            </div>
          )
        })}
      </div>

      {/* Email input for 'known' mode */}
      <div
        className="overflow-hidden transition-all duration-[400ms] mb-8"
        style={{ opacity: mode === 'known' ? 1 : 0, maxHeight: mode === 'known' ? 120 : 0 }}
      >
        <label style={{ fontSize: 11.5, color: 'var(--ink-muted)', display: 'block', marginBottom: 6 }}>Their email address</label>
        <input
          type="email"
          style={{
            width: '100%',
            padding: '10px 14px',
            fontFamily: 'Lora, serif', fontSize: 13.5, fontStyle: 'italic', color: 'var(--ink)',
            background: 'var(--paper)', borderRadius: 8, outline: 'none',
            border: '1px solid rgba(28,26,23,0.15)', transition: 'border-color 0.2s',
          }}
          placeholder="their@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onFocus={e => (e.target.style.borderColor = 'var(--tc)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(28,26,23,0.15)')}
        />
      </div>

      <div className="flex items-center justify-end">
        <button
          disabled={!canProceed}
          onClick={onNext}
          className="flex items-center gap-2 rounded-pill font-sans font-medium disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px"
          style={{ background: 'var(--ink)', color: 'var(--cream)', border: 'none', padding: '9px 22px', fontSize: 13, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--tc)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
        >
          Continue
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  )
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
function Step2({ mood, setMood, onBack, onNext }) {
  return (
    <div className="animate-fade-up">
      <StepLabel n={2} title="What does this carry?" subtitle="This helps your listener show up in the right way." onBack={onBack} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-6">
        {MOODS.map(m => (
          <div
            key={m.id}
            onClick={() => setMood(m)}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 9,
              fontFamily: '"DM Sans", sans-serif', fontSize: 13,
              transition: 'all 0.2s',
              ...(mood?.id === m.id
                ? { ...m.activeStyle, color: 'white', border: `1px solid ${m.activeStyle.background || 'transparent'}`, transform: 'translateY(-1px)', boxShadow: '0 6px 18px rgba(28,26,23,0.12)' }
                : { background: 'var(--paper)', border: '1px solid rgba(28,26,23,0.09)', color: 'var(--ink-soft)' }
              ),
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{m.emoji}</span>
            <span style={{ fontWeight: mood?.id === m.id ? 500 : 400 }}>{m.label}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-end items-center">
        <button
          disabled={!mood}
          onClick={onNext}
          className="flex items-center gap-2 rounded-pill font-sans font-medium disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px"
          style={{ background: 'var(--ink)', color: 'var(--cream)', border: 'none', padding: '9px 22px', fontSize: 13, cursor: 'pointer' }}
          onMouseEnter={e => { if (mood) e.currentTarget.style.background = 'var(--tc)' }}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
        >
          Start writing
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  )
}

// ── Step 3 ────────────────────────────────────────────────────────────────────
function Step3({ onBack, onSend, mood, sal, setSal, body, setBody, mode, saving, saveError, onSendEmail }) {
  const [signoff, setSignoff] = useState('With')
  const [sig, setSig] = useState('')
  const [showCrisis, setShowCrisis] = useState(false)

  const isSelf     = mode === 'self'
  const isStranger = mode === 'stranger'

  function wordCount() {
    return (sal + ' ' + body).trim().split(/\s+/).filter(Boolean).length
  }

  function handleBodyChange(e) {
    setBody(e.target.value)
    setShowCrisis(CRISIS_WORDS.some(w => e.target.value.toLowerCase().includes(w)))
  }

  return (
    <div className="animate-fade-up">
      <StepLabel n={3} title="Write your letter." subtitle="Take your time. There's no right way to begin — just start." onBack={onBack} />

      {/* ── Mood indicator ─────────────────────────────────────────────── */}
      {mood && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)' }}>
            This letter carries:
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', borderRadius: 999,
            background: mood.activeStyle.background,
            color: 'white',
            fontSize: 12, fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
          }}>
            {mood.emoji} {mood.label}
          </span>
        </div>
      )}

      {/* ── Paper ──────────────────────────────────────────────────────── */}
      <div
        className="bg-paper rounded-lg relative overflow-hidden"
        style={{ boxShadow: '0 2px 8px rgba(28,26,23,0.04), 0 12px 40px rgba(28,26,23,0.08), 0 0 0 1px rgba(28,26,23,0.06)' }}
      >
        <div className="paper-lines" />
        <div className="paper-margin" />
        <div className="relative z-[2]" style={{ padding: 'clamp(28px, 5vw, 56px) clamp(20px, 4vw, 56px) clamp(28px, 5vw, 56px) clamp(28px, 5vw, 80px)' }}>
          {/* Salutation */}
          <div className="flex items-baseline mb-7" style={{ gap: 6 }}>
            <span style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 500, color: 'var(--ink)', flexShrink: 0 }}>Dear </span>
            <input
              style={{
                fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 500,
                color: 'var(--tc)', background: 'transparent',
                border: 'none', borderBottom: '1.5px solid rgba(196,99,58,0.2)',
                outline: 'none', flex: 1, paddingBottom: 2, minWidth: 0,
                transition: 'border-color 0.2s',
              }}
              placeholder="someone…"
              value={sal}
              onChange={e => setSal(e.target.value)}
              onFocus={e => (e.target.style.borderBottomColor = 'var(--tc)')}
              onBlur={e => (e.target.style.borderBottomColor = 'rgba(196,99,58,0.2)')}
            />
            <span style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 500, color: 'var(--ink)', flexShrink: 0 }}>,</span>
          </div>

          {/* Body textarea */}
          <textarea
            style={{
              width: '100%',
              minHeight: 'clamp(350px, 50vh, 600px)',
              fontFamily: 'Lora, serif', fontSize: 16, lineHeight: 2.15,
              color: 'var(--ink-soft)', background: 'transparent',
              border: 'none', outline: 'none', resize: 'none',
              display: 'block',
            }}
            placeholder="Start wherever feels right…"
            value={body}
            onChange={handleBodyChange}
          />

          {/* Sign-off */}
          <div style={{ marginTop: 24 }}>
            <input
              style={{
                fontFamily: 'Lora, serif', fontSize: 15, fontStyle: 'italic',
                color: 'var(--ink-muted)', background: 'transparent',
                border: 'none', borderBottom: '1px solid rgba(28,26,23,0.1)',
                outline: 'none', width: 200, display: 'block', paddingBottom: 3,
              }}
              placeholder="With, Regards, Yours…"
              value={signoff}
              onChange={e => setSignoff(e.target.value)}
            />
            <input
              style={{
                fontFamily: '"Lora", serif', fontSize: 22, fontWeight: 600,
                color: 'var(--ink)', background: 'transparent',
                border: 'none', outline: 'none', width: '100%',
                marginTop: 8,
              }}
              placeholder="Your name (or stay anonymous)"
              value={sig}
              onChange={e => setSig(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Word count */}
      <div style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'right', marginTop: 8, opacity: 0.45 }}>
        {wordCount()} word{wordCount() === 1 ? '' : 's'}
      </div>

      {/* Crisis banner */}
      {showCrisis && (
        <div className="mt-4 rounded-xl px-5 py-4 animate-fade-up" style={{ background: 'rgba(122,158,142,0.08)', border: '1px solid rgba(122,158,142,0.22)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sage)', marginBottom: 5 }}>We see you 🤝</div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.65 }}>If things feel too heavy, you don't have to carry it alone.</div>
          <a style={{ fontSize: 12, color: 'var(--sage)', display: 'block', marginTop: 6, textDecoration: 'underline' }} href="tel:9152987821">iCall India: 9152987821 →</a>
          <a style={{ fontSize: 12, color: 'var(--sage)', display: 'block', textDecoration: 'underline' }} href="tel:18602662345">Vandrevala: 1860-2662-345 →</a>
        </div>
      )}

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <div className="mt-7 flex items-center gap-3 flex-wrap justify-end">

        {saveError && (
          <div style={{ fontSize: 12, padding: '9px 14px', borderRadius: 8, color: 'var(--tc)', background: 'rgba(196,99,58,0.07)', border: '1px solid rgba(196,99,58,0.18)', flexShrink: 0 }}>
            {saveError}
          </div>
        )}

        {isSelf ? (
          <button
            onClick={onSend}
            disabled={saving}
            style={{ padding: '9px 22px', borderRadius: 999, fontSize: 13, fontFamily: '"DM Sans", sans-serif', fontWeight: 500, background: 'var(--tc)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: saving ? 0.6 : 1 }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = '#D97040'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(196,99,58,0.3)' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--tc)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            {saving ? 'Saving…' : 'Save Letter'}
          </button>
        ) : isStranger ? (
          <button
            onClick={onSend}
            disabled={saving}
            style={{ padding: '9px 22px', borderRadius: 999, fontSize: 13, fontFamily: '"DM Sans", sans-serif', fontWeight: 500, background: 'var(--tc)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: saving ? 0.6 : 1 }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = '#D97040'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(196,99,58,0.3)' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--tc)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            {saving ? 'Sharing…' : 'Share Letter'}
          </button>
        ) : (
          <button
            onClick={onSendEmail}
            style={{ padding: '9px 22px', borderRadius: 999, fontSize: 13, fontFamily: '"DM Sans", sans-serif', fontWeight: 500, background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--tc)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(196,99,58,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            Send Letter →
          </button>
        )}
      </div>
    </div>
  )
}

// ── Step 4 (confirmation) ─────────────────────────────────────────────────────
function Step4({ mode, mood, deliveryType, navigate }) {
  const isSelf     = mode === 'self'
  const isStranger = mode === 'stranger'

  const modeLabels = {
    stranger: 'Shared with caring strangers',
    known:    'Sent to someone you love',
    self:     'Saved to your personal letters',
  }
  const msgs = {
    burn:     'You wrote it. You released it. That took courage.',
    capsule:  'Sealed in time. It will arrive when you said.',
    self:     'Your words are safe. Only you can see them.',
    stranger: 'Out in the world, waiting for the right heart to find it.',
    default:  "A real person will find it. They'll sit with your words and write back.",
  }
  const msg = isSelf ? msgs.self : isStranger ? msgs.stranger
    : deliveryType === 'burn' ? msgs.burn
    : deliveryType === 'capsule' ? msgs.capsule
    : msgs.default

  const headingColor = isSelf ? 'var(--purple)' : isStranger ? 'var(--sage)' : 'var(--tc)'
  const headingText  = isSelf ? 'safely kept.' : isStranger ? 'out there.' : 'on its way.'

  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[60vh] py-12 animate-fade-up">
      <div className="mb-8">
        <svg width="90" height="68" viewBox="0 0 120 90" fill="none">
          <rect x="4" y="18" width="112" height="68" rx="4" fill="#FDF9F3" stroke="rgba(28,26,23,0.1)" strokeWidth="1"/>
          <path d="M4 22L60 56L116 22" fill="none" stroke="rgba(28,26,23,0.08)" strokeWidth="1"/>
          <path d="M4 86L40 58" stroke="rgba(28,26,23,0.07)" strokeWidth="0.8"/>
          <path d="M116 86L80 58" stroke="rgba(28,26,23,0.07)" strokeWidth="0.8"/>
          <circle cx="60" cy="56" r="12" fill="#8B3A2A"/>
          <circle cx="60" cy="56" r="10" fill="#C4633A"/>
          <path d="M60 61C60 61 53 56 53 52C53 49.5 55.5 48 58 50C58.8 50.6 59.5 51.3 60 52C60.5 51.3 61.2 50.6 62 50C64.5 48 67 49.5 67 52C67 56 60 61 60 61Z" fill="rgba(255,255,255,0.3)"/>
        </svg>
      </div>
      <h2 style={{ fontFamily: '"Lora", serif', fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15, marginBottom: 12, letterSpacing: '-0.4px' }}>
        Your letter is<br /><em style={{ fontStyle: 'italic', color: headingColor }}>{headingText}</em>
      </h2>
      <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)', maxWidth: 420, lineHeight: 1.75, margin: '0 auto 32px' }}>{msg}</p>
      <div className="flex gap-3 justify-center flex-wrap mb-8">
        <div className="flex items-center gap-2 rounded-pill text-[12px] text-ink-soft" style={{ padding: '9px 16px', border: '1px solid rgba(28,26,23,0.1)', background: 'var(--paper)' }}>
          <span className="w-[5px] h-[5px] rounded-full bg-sage" />
          {modeLabels[mode] || modeLabels.stranger}
        </div>
        <div className="flex items-center gap-2 rounded-pill text-[12px] text-ink-soft" style={{ padding: '9px 16px', border: '1px solid rgba(28,26,23,0.1)', background: 'var(--paper)' }}>
          <span className="w-[5px] h-[5px] rounded-full bg-tc" />
          Carrying: {mood?.label || '…'}
        </div>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '12px 24px', borderRadius: 999, fontSize: 13, fontFamily: '"DM Sans", sans-serif', color: 'var(--ink-soft)', background: 'transparent', border: '1px solid rgba(28,26,23,0.15)', cursor: 'pointer', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-soft)'}
        >
          Write another
        </button>
        <button
          onClick={() => navigate('myspace')}
          style={{ padding: '12px 24px', borderRadius: 999, fontSize: 13, fontFamily: '"DM Sans", sans-serif', fontWeight: 500, background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--tc)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.transform = '' }}
        >
          Go to My Space →
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WritePage() {
  const { navigate, emailAccounts, refreshPersonalLetters, refreshStrangerLetters, canWriteStranger, userEmailMode } = useApp()
  const [step, setStep]               = useState(1)
  const [mode, setMode]               = useState(null)
  const [email, setEmail]             = useState('')
  const [mood, setMood]               = useState(null)
  const [deliveryType, setDeliveryType] = useState('now')
  const [sal, setSal]                 = useState('')
  const [body, setBody]               = useState('')
  const [sendEmailOpen, setSendEmailOpen] = useState(false)
  const [sendFrom, setSendFrom]       = useState('system')
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState('')
  const [systemEmail, setSystemEmail] = useState('')

  const bodyRef = useRef('')

  useEffect(() => {
    apiFetch('/api/send-email/system-info')
      .then(r => r.json())
      .then(j => { if (j.success && j.email) setSystemEmail(j.email) })
      .catch(() => {})
  }, []) // eslint-disable-line

  async function handleSend() {
    if (mode === 'self' || mode === 'stranger') {
      setSaveError('')
      if (!body.trim()) { setSaveError('Write something before saving.'); return }
      setSaving(true)
      try {
        const isPersonal = mode === 'self'
        const subject    = sal ? `Dear ${sal}` : isPersonal ? 'A personal letter' : 'A letter from my heart'
        const message    = sal ? `Dear ${sal},\n\n${body}` : body
        const res  = await apiFetch('/api/letters', {
          method: 'POST',
          body: JSON.stringify({ type: isPersonal ? 'personal' : 'stranger', subject, message, mood: mood?.id }),
        })
        const json = await res.json()
        if (!res.ok) { setSaveError(json.error || 'Failed to save. Please try again.'); return }
        if (isPersonal) await refreshPersonalLetters()
        else            await refreshStrangerLetters()
        setStep(4)
      } catch {
        setSaveError('Network error — check your connection.')
      } finally {
        setSaving(false)
      }
    } else {
      setStep(4)
    }
  }

  if (step === 4) {
    return (
      <div className="w-full flex justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-2xl">
          <Step4 mode={mode} mood={mood} deliveryType={deliveryType} navigate={navigate} />
        </div>
      </div>
    )
  }

  const isKnown = mode === 'known'

  return (
    <>
      <div className="w-full flex justify-center px-4 sm:px-6 md:px-10 py-6 md:py-10">
        <div className="w-full max-w-3xl lg:max-w-4xl">
          <ProgressDots total={3} current={step} />

          {/* All steps — 2-column grid with right panel */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6" style={{ marginTop: 24 }}>

          {/* ── Left: step content ── */}
          <div>
            {step === 1 && (
              <Step1
                mode={mode} setMode={setMode}
                email={email} setEmail={setEmail}
                onNext={() => setStep(2)}
                onBack={() => navigate('home')}
                canWriteStranger={canWriteStranger}
              />
            )}
            {step === 2 && (
              <Step2 mood={mood} setMood={setMood} onBack={() => setStep(1)} onNext={() => setStep(3)} />
            )}
            {step === 3 && (
              <Step3
                onBack={() => setStep(2)}
                onSend={handleSend}
                mood={mood}
                sal={sal} setSal={setSal}
                body={body} setBody={setBody}
                mode={mode}
                saving={saving} saveError={saveError}
                onSendEmail={() => setSendEmailOpen(true)}
              />
            )}
          </div>

            {/* ── Right: info panel ── */}
            <aside className="hidden lg:flex flex-col gap-4" style={{ alignSelf: 'start', position: 'sticky', top: 68 }}>

              {/* Mood */}
              {mood && (
                <div style={{ background: 'var(--paper)', border: '1px solid rgba(28,26,23,0.08)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 10 }}>Mood</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: mood.activeStyle.background, color: '#fff', fontSize: 12, fontFamily: '"DM Sans", sans-serif', fontWeight: 500 }}>
                    {mood.emoji} {mood.label}
                  </span>
                  <button
                    onClick={() => setStep(2)}
                    style={{ display: 'block', marginTop: 8, fontSize: 11, color: 'var(--tc)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}
                  >
                    Change mood →
                  </button>
                </div>
              )}

              {/* Delivery */}
              <div style={{ background: 'var(--paper)', border: '1px solid rgba(28,26,23,0.08)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 10 }}>Send or Save</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { id: 'now',      icon: '📨', name: 'Send Now',          comingSoon: false },
                    { id: 'schedule', icon: '⏳', name: 'Schedule for Later', comingSoon: false },
                    { id: 'burn',     icon: '🔥', name: 'Burn After Reading', comingSoon: true  },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { if (!opt.comingSoon && isKnown) setDeliveryType(opt.id) }}
                      disabled={opt.comingSoon || !isKnown}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                        border: deliveryType === opt.id && isKnown ? '1px solid var(--tc)' : '1px solid rgba(28,26,23,0.09)',
                        background: deliveryType === opt.id && isKnown ? 'rgba(196,99,58,0.06)' : '#fff',
                        color: opt.comingSoon ? 'var(--ink-muted)' : !isKnown && opt.id === 'now' ? 'var(--tc)' : !isKnown ? 'var(--ink-muted)' : deliveryType === opt.id ? 'var(--tc)' : 'var(--ink-soft)',
                        cursor: opt.comingSoon || !isKnown ? 'default' : 'pointer',
                        opacity: opt.comingSoon ? 0.5 : 1,
                        fontSize: 12.5, fontFamily: '"DM Sans", sans-serif',
                        fontWeight: deliveryType === opt.id && isKnown ? 500 : 400,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{opt.icon}</span>
                      <span style={{ flex: 1 }}>{opt.name}</span>
                      {opt.comingSoon && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 10, background: 'rgba(28,26,23,0.06)', color: 'var(--ink-muted)' }}>Coming soon</span>}
                    </button>
                  ))}
                </div>
                {!isKnown && (
                  <p style={{ fontSize: 10.5, color: 'var(--ink-muted)', fontFamily: 'Lora, serif', fontStyle: 'italic', marginTop: 8, lineHeight: 1.55 }}>
                    Delivery options apply when sending to someone you know.
                  </p>
                )}
              </div>

              {/* Privacy */}
              <div style={{ background: 'rgba(122,158,142,0.06)', border: '1px solid rgba(122,158,142,0.18)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: 8 }}>Privacy</div>
                <p style={{ fontSize: 11.5, fontFamily: 'Lora, serif', fontStyle: 'italic', color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>
                  {mode === 'stranger'
                    ? 'Your letter is anonymous. No name, no email — just your words.'
                    : mode === 'self'
                    ? 'This letter is private. Only you can read it.'
                    : 'Your letter goes directly to the recipient. Your email is kept safe.'}
                </p>
              </div>

              {/* Send from (known only) */}
              {isKnown && (
                <div style={{ background: 'var(--paper)', border: '1px solid rgba(28,26,23,0.08)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 10 }}>Send From</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { id: 'system', icon: '📮', label: 'System Email', sub: systemEmail || 'Platform default' },
                      { id: 'custom', icon: '✉️', label: 'My Email', sub: emailAccounts.length > 0 ? 'Your connected account' : 'No account — go to Connections' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { if (opt.id === 'custom' && !emailAccounts.length) return; setSendFrom(opt.id) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                          border: sendFrom === opt.id ? '1px solid var(--tc)' : '1px solid rgba(28,26,23,0.09)',
                          background: sendFrom === opt.id ? 'rgba(196,99,58,0.05)' : '#fff',
                          color: sendFrom === opt.id ? 'var(--tc)' : 'var(--ink-soft)',
                          cursor: opt.id === 'custom' && !emailAccounts.length ? 'default' : 'pointer',
                          opacity: opt.id === 'custom' && !emailAccounts.length ? 0.45 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{opt.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: sendFrom === opt.id ? 600 : 400, fontFamily: '"DM Sans", sans-serif' }}>{opt.label}</div>
                          <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'Lora, serif', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      {sendEmailOpen && (
        <SendEmailModal
          sal={sal}
          body={body}
          recipientEmail={email}
          emailAccounts={emailAccounts}
          onClose={() => setSendEmailOpen(false)}
          initialSendFrom={sendFrom}
          initialDeliveryType={deliveryType}
          systemEmail={systemEmail}
        />
      )}
    </>
  )
}
