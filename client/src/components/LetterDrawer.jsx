import { useApp } from '../context/AppContext'

const MOOD_META = {
  vent:      { emoji: '🌧️', label: 'I need to vent',  bg: 'rgba(28,26,23,0.12)',      color: 'var(--ink-soft)'   },
  joy:       { emoji: '🌟', label: 'Pure joy',         bg: 'rgba(201,168,76,0.15)',    color: 'var(--gold)'       },
  love:      { emoji: '💌', label: 'Love & warmth',    bg: 'rgba(196,99,58,0.12)',     color: 'var(--tc)'         },
  grief:     { emoji: '🕯️', label: 'Grief & loss',    bg: 'rgba(122,158,142,0.14)',   color: 'var(--sage)'       },
  gratitude: { emoji: '🌿', label: 'Gratitude',        bg: 'rgba(122,112,92,0.12)',    color: '#7A6E5C'           },
  longing:   { emoji: '🌙', label: 'Longing',          bg: 'rgba(139,126,200,0.14)',   color: 'var(--purple)'    },
}

const TYPE_META = {
  personal: { label: 'Personal',        color: 'var(--tc)',   bg: 'rgba(196,99,58,0.08)',   border: 'rgba(196,99,58,0.2)'   },
  stranger: { label: 'Caring Stranger', color: 'var(--sage)', bg: 'rgba(122,158,142,0.08)', border: 'rgba(122,158,142,0.2)' },
  sent:     { label: 'Sent Letter',     color: 'var(--gold)', bg: 'rgba(201,168,76,0.08)',  border: 'rgba(201,168,76,0.2)'  },
}

export default function LetterDrawer() {
  const { letterPanel, closeLetterPanel } = useApp()
  const { open, letter } = letterPanel

  const meta     = letter ? (TYPE_META[letter.type] || TYPE_META.personal) : TYPE_META.personal
  const moodMeta = letter?.mood ? (MOOD_META[letter.mood] || null) : null
  const date     = letter
    ? new Date(letter.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <>
      {/* ── Overlay ─────────────────────────────────────────────────────── */}
      <div
        onClick={closeLetterPanel}
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* ── Panel ───────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 401,
          width: 'min(600px, 100vw)',
          background: '#FDFAF5',
          boxShadow: '-24px 0 80px rgba(22,16,8,0.12)',
          display: 'flex', flexDirection: 'column',
          overflowX: 'hidden',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ── Panel header ──────────────────────────────────────────────── */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(28,26,23,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexShrink: 0, background: '#fffaf5',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
            {letter && (
              <>
                {/* Type tag */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 10, padding: '4px 10px', borderRadius: 20,
                  fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
                  background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                  fontFamily: '"DM Sans", sans-serif', flexShrink: 0,
                }}>
                  ✦ {meta.label}
                </span>
                {/* Mood tag */}
                {moodMeta && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 10, padding: '4px 10px', borderRadius: 20,
                    fontWeight: 500, background: moodMeta.bg, color: moodMeta.color,
                    fontFamily: '"DM Sans", sans-serif', flexShrink: 0,
                  }}>
                    {moodMeta.emoji} {moodMeta.label}
                  </span>
                )}
              </>
            )}
          </div>
          {/* Close button */}
          <button
            onClick={closeLetterPanel}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(28,26,23,0.06)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: 'var(--ink-muted)', flexShrink: 0,
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(28,26,23,0.12)'; e.currentTarget.style.color = 'var(--ink)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(28,26,23,0.06)'; e.currentTarget.style.color = 'var(--ink-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* ── Letter body ───────────────────────────────────────────────── */}
        {letter && (
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 56px' }}>
            {/* Centered content wrapper */}
            <div style={{ maxWidth: 520, margin: '0 auto' }}>

            {/* Paper card */}
            <div style={{
              background: '#fffaf5',
              borderRadius: '0 0 20px 20px',
              boxShadow: '0 8px 32px rgba(28,26,23,0.08), 0 2px 8px rgba(28,26,23,0.04)',
              border: '1px solid rgba(28,26,23,0.08)',
              borderTop: 'none',
              padding: 'clamp(28px, 5vw, 48px) clamp(24px, 5vw, 44px)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Left accent */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                background: `linear-gradient(180deg, ${meta.color}, var(--gold))`,
                borderRadius: '0 0 0 16px',
              }} />

              {/* Date */}
              <div style={{
                fontFamily: 'Lora, serif', fontStyle: 'italic',
                fontSize: 12, color: 'var(--ink-muted)',
                textAlign: 'right', marginBottom: 28,
              }}>
                {date}
              </div>

              {/* Subject / title */}
              <h2 style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: 'clamp(22px, 3vw, 30px)',
                fontWeight: 700, color: 'var(--ink)',
                lineHeight: 1.2, letterSpacing: '-0.4px',
                marginBottom: 6,
              }}>
                {letter.subject}
              </h2>

              {/* Divider */}
              <div style={{
                height: 1,
                background: 'linear-gradient(90deg, rgba(28,26,23,0.12), transparent)',
                margin: '20px 0 28px',
              }} />

              {/* Message body */}
              <div style={{
                fontFamily: 'Lora, serif',
                fontSize: 'clamp(14px, 1.8vw, 15.5px)',
                lineHeight: 2.05,
                color: 'var(--ink-soft)',
                whiteSpace: 'pre-line',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}>
                {letter.message}
              </div>

              {/* Seal footer */}
              <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(28,26,23,0.07)', textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '9px 20px', borderRadius: 40,
                  background: 'rgba(28,26,23,0.03)', border: '1px solid rgba(28,26,23,0.08)',
                }}>
                  <span style={{ fontSize: 14, opacity: 0.5 }}>✉</span>
                  <span style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
                    Letter from Heart
                  </span>
                </div>
              </div>
            </div>
            </div>{/* end centering wrapper */}
          </div>
        )}

        {/* Empty state when no letter */}
        {!letter && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14 }}>
            Select a letter to read
          </div>
        )}
      </div>
    </>
  )
}
