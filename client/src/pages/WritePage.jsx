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
function StepLabel({ n, title, subtitle }) {
  return (
    <div className="mb-10">
      <div className="text-[11px] tracking-[2.5px] uppercase font-medium mb-3" style={{ color: 'var(--tc)' }}>
        Step {n} of 3
      </div>
      <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.5px', marginBottom: 10 }}>
        {title}
      </h2>
      <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-muted)', lineHeight: 1.65 }}>
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
      <StepLabel n={1} title="Who is this letter for?" subtitle="Choose how this letter will travel." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
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
                  ? m.id === 'stranger' ? '1px solid var(--sage)' : m.id === 'known' ? '1px solid var(--tc)' : '1px solid var(--purple)'
                  : '1px solid rgba(28,26,23,0.09)',
                borderRadius: 14,
                padding: '28px 26px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.42 : 1,
                transform: active ? 'translateY(-3px)' : '',
                boxShadow: active ? '0 10px 30px rgba(28,26,23,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 30, display: 'block', marginBottom: 16 }}>{m.icon}</span>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.2 }}>{m.name}</div>
              <div style={{ fontFamily: 'Lora, serif', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 14 }}>{m.desc}</div>
              <div
                style={{
                  fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 12,
                  color: disabled ? 'var(--sage)' : 'var(--ink-muted)',
                  paddingTop: 14, borderTop: '1px solid rgba(28,26,23,0.07)',
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
        <label style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'block', marginBottom: 8 }}>Their email address</label>
        <input
          type="email"
          style={{
            width: '100%',
            padding: '13px 18px',
            fontFamily: 'Lora, serif', fontSize: 15, fontStyle: 'italic', color: 'var(--ink)',
            background: 'var(--paper)', borderRadius: 10, outline: 'none',
            border: '1px solid rgba(28,26,23,0.15)', transition: 'border-color 0.2s',
          }}
          placeholder="their@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onFocus={e => (e.target.style.borderColor = 'var(--tc)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(28,26,23,0.15)')}
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          style={{ padding: '12px 22px', borderRadius: 999, fontSize: 13, fontFamily: '"DM Sans", sans-serif', color: 'var(--ink-soft)', fontWeight: 500, background: 'transparent', border: '1px solid rgba(28,26,23,0.15)', cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-soft)'}
        >
          ← Back
        </button>
        <button
          disabled={!canProceed}
          onClick={onNext}
          className="flex items-center gap-2 rounded-pill font-sans font-medium disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px"
          style={{ background: 'var(--ink)', color: 'var(--cream)', border: 'none', padding: '13px 28px', fontSize: 14, cursor: 'pointer' }}
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
      <StepLabel n={2} title="What does this carry?" subtitle="This helps your listener show up in the right way." />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        {MOODS.map(m => (
          <div
            key={m.id}
            onClick={() => setMood(m)}
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
              fontFamily: '"DM Sans", sans-serif', fontSize: 14,
              transition: 'all 0.2s',
              ...(mood?.id === m.id
                ? { ...m.activeStyle, color: 'white', border: `1px solid ${m.activeStyle.background || 'transparent'}`, transform: 'translateY(-1px)', boxShadow: '0 6px 18px rgba(28,26,23,0.12)' }
                : { background: 'var(--paper)', border: '1px solid rgba(28,26,23,0.09)', color: 'var(--ink-soft)' }
              ),
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{m.emoji}</span>
            <span style={{ fontWeight: mood?.id === m.id ? 500 : 400 }}>{m.label}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="rounded-pill font-sans transition-all duration-200"
          style={{ padding: '12px 24px', fontSize: 13, color: 'var(--ink-muted)', background: 'transparent', border: '1px solid rgba(28,26,23,0.12)', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
        >
          ← Back
        </button>
        <button
          disabled={!mood}
          onClick={onNext}
          className="flex items-center gap-2 rounded-pill font-sans font-medium disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px"
          style={{ background: 'var(--ink)', color: 'var(--cream)', border: 'none', padding: '13px 28px', fontSize: 14, cursor: 'pointer' }}
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
function Step3({ onBack, onSend, mood, sal, setSal, body, setBody, mode, deliveryType, setDeliveryType, saving, saveError, onSendEmail, hasEmailAccounts, emailMode, systemEmail }) {
  const [signoff, setSignoff] = useState('With')
  const [sig, setSig] = useState('')
  const [showCrisis, setShowCrisis] = useState(false)
  const [sendFrom, setSendFrom] = useState('system')

  const isSelf        = mode === 'self'
  const isStranger    = mode === 'stranger'
  const isKnown       = mode === 'known'
  const isSystemEmail = emailMode === 'system'

  function wordCount() {
    return (sal + ' ' + body).trim().split(/\s+/).filter(Boolean).length
  }

  function handleBodyChange(e) {
    setBody(e.target.value)
    setShowCrisis(CRISIS_WORDS.some(w => e.target.value.toLowerCase().includes(w)))
  }

  return (
    <div className="animate-fade-up">
      <StepLabel n={3} title="Write your letter." subtitle="Take your time. There's no right way to begin — just start." />

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
                fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 600,
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

      {/* Delivery options — only for "Someone I Know" */}
      {isKnown && (
        <div className="mt-5 rounded-xl p-5" style={{ background: 'var(--paper)', border: '1px solid rgba(28,26,23,0.08)' }}>
          <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 600, marginBottom: 12 }}>Delivery</div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'now',     name: 'Send now',           comingSoon: false },
              { id: 'capsule', name: 'Time capsule ✨',     comingSoon: true  },
              { id: 'burn',    name: 'Burn after writing',  comingSoon: true  },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => !opt.comingSoon && setDeliveryType(opt.id)}
                disabled={opt.comingSoon}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 18px', borderRadius: 999,
                  fontSize: 13, fontFamily: '"DM Sans", sans-serif',
                  border: deliveryType === opt.id ? '1px solid var(--tc)' : '1px solid rgba(28,26,23,0.12)',
                  background: deliveryType === opt.id ? 'rgba(196,99,58,0.07)' : 'var(--cream)',
                  color: deliveryType === opt.id ? 'var(--tc)' : 'var(--ink-soft)',
                  cursor: opt.comingSoon ? 'default' : 'pointer',
                  opacity: opt.comingSoon ? 0.5 : 1,
                  fontWeight: deliveryType === opt.id ? 500 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {opt.name}
                {opt.comingSoon && (
                  <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 20, background: 'rgba(28,26,23,0.06)', color: 'var(--ink-muted)' }}>Soon</span>
                )}
              </button>
            ))}
          </div>
          {deliveryType === 'capsule' && (
            <input
              type="date"
              style={{ display: 'block', marginTop: 12, padding: '10px 14px', fontSize: 13, color: 'var(--ink)', borderRadius: 8, border: '1px solid rgba(28,26,23,0.12)', background: 'var(--cream)', outline: 'none' }}
              min={new Date().toISOString().split('T')[0]}
            />
          )}
        </div>
      )}

      {/* ── Send From selector (only for "known" / direct send) ──────── */}
      {isKnown && (
        <div className="mt-5 rounded-xl p-5" style={{ background: 'var(--paper)', border: '1px solid rgba(28,26,23,0.08)' }}>
          <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 600, marginBottom: 12 }}>Send From</div>
          <div className="flex flex-col gap-2">
            {[
              { id: 'system', icon: '📮', label: 'System Email', sub: systemEmail || 'Platform default — always available' },
              { id: 'custom', icon: '✉️', label: 'My Email',     sub: hasEmailAccounts ? 'Use your connected account' : 'No account connected — go to Connections' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => { if (opt.id === 'custom' && !hasEmailAccounts) return; setSendFrom(opt.id) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10, textAlign: 'left',
                  border: sendFrom === opt.id ? '1px solid var(--tc)' : '1px solid rgba(28,26,23,0.1)',
                  background: sendFrom === opt.id ? 'rgba(196,99,58,0.05)' : 'var(--cream)',
                  cursor: opt.id === 'custom' && !hasEmailAccounts ? 'default' : 'pointer',
                  opacity: opt.id === 'custom' && !hasEmailAccounts ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{opt.icon}</span>
                <div>
                  <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: sendFrom === opt.id ? 600 : 400, color: sendFrom === opt.id ? 'var(--tc)' : 'var(--ink)' }}>{opt.label}</div>
                  <div style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{opt.sub}</div>
                </div>
                {sendFrom === opt.id && (
                  <span style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: 'var(--tc)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <div className="mt-7 flex items-center gap-3 flex-wrap">
        <button
          onClick={onBack}
          style={{ padding: '12px 22px', borderRadius: 999, fontSize: 13, fontFamily: '"DM Sans", sans-serif', color: 'var(--ink-soft)', fontWeight: 500, background: 'transparent', border: '1px solid rgba(28,26,23,0.15)', cursor: 'pointer', transition: 'color 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-soft)'}
        >
          ← Back
        </button>

        <div style={{ flex: 1 }} />

        {saveError && (
          <div style={{ fontSize: 12, padding: '9px 14px', borderRadius: 8, color: 'var(--tc)', background: 'rgba(196,99,58,0.07)', border: '1px solid rgba(196,99,58,0.18)', flexShrink: 0 }}>
            {saveError}
          </div>
        )}

        {isSelf ? (
          <button
            onClick={onSend}
            disabled={saving}
            style={{ padding: '13px 28px', borderRadius: 999, fontSize: 14, fontFamily: '"DM Sans", sans-serif', fontWeight: 500, background: 'var(--purple, #8B7EC8)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: saving ? 0.6 : 1 }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(139,126,200,0.3)' } }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            {saving ? 'Saving…' : 'Save Letter'}
          </button>
        ) : isStranger ? (
          <button
            onClick={onSend}
            disabled={saving}
            style={{ padding: '13px 28px', borderRadius: 999, fontSize: 14, fontFamily: '"DM Sans", sans-serif', fontWeight: 500, background: 'var(--sage)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: saving ? 0.6 : 1 }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(122,158,142,0.3)' } }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            {saving ? 'Sharing…' : 'Share Letter'}
          </button>
        ) : (
          <button
            onClick={() => onSendEmail(sendFrom)}
            style={{ padding: '13px 28px', borderRadius: 999, fontSize: 14, fontFamily: '"DM Sans", sans-serif', fontWeight: 500, background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--tc)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(196,99,58,0.25)' }}
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
      <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(30px, 4vw, 42px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15, marginBottom: 14, letterSpacing: '-0.5px' }}>
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
      <div className="w-full px-6 md:px-10 lg:px-16 py-10">
        <Step4 mode={mode} mood={mood} deliveryType={deliveryType} navigate={navigate} />
      </div>
    )
  }

  // Writing step (step 3) uses a more comfortable, focused layout
  const isWritingStep = step === 3

  return (
    <>
      <div className="w-full px-6 md:px-10 lg:px-16 py-10">
        <ProgressDots total={3} current={step} />

        <div style={{ marginTop: 36 }}>
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
              deliveryType={deliveryType} setDeliveryType={setDeliveryType}
              saving={saving} saveError={saveError}
              onSendEmail={(from) => { setSendFrom(from); setSendEmailOpen(true) }}
              hasEmailAccounts={emailAccounts.length > 0}
              emailMode={userEmailMode}
              systemEmail={systemEmail}
            />
          )}
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
          systemEmail={systemEmail}
        />
      )}
    </>
  )
}
