import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

const BD = '#E0D4BC'
const FT = '#F2EBE0'

// ── Single letter card with one-time read gate ────────────────────────────────
function LetterCard({ letter, onMarkRead }) {
  const [open, setOpen]       = useState(letter.hasRead)
  const [marking, setMarking] = useState(false)
  const [readError, setReadError] = useState('')
  const [hov, setHov]         = useState(false)
  const [openBtnHov, setOpenBtnHov] = useState(false)

  const date = new Date(letter.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  async function handleOpen() {
    if (letter.hasRead) { setOpen(true); return }
    setMarking(true)
    setReadError('')
    try {
      const res  = await apiFetch(`/api/letters/${letter._id}/read`, { method: 'POST' })
      const json = await res.json()
      if (res.status === 403 && json.alreadyRead) { setOpen(true); onMarkRead(letter._id); return }
      if (!res.ok) { setReadError(json.error || 'Could not mark as read.'); return }
      setOpen(true)
      onMarkRead(letter._id)
    } catch { setReadError('Network error.') }
    finally { setMarking(false) }
  }

  // Accent: purple if read/open, sage if unread
  const accentGrad = (letter.hasRead || open)
    ? 'linear-gradient(180deg, var(--purple), var(--gold))'
    : 'linear-gradient(180deg, var(--sage), var(--gold))'

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 14, border: `1px solid ${BD}`,
        overflow: 'hidden', position: 'relative',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? '0 14px 40px rgba(26,18,8,0.09)' : 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Left accent */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accentGrad, borderRadius: '4px 0 0 4px' }} />

      {/* Card body */}
      <div style={{ padding: '26px 28px 22px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
            {letter.subject}
          </h3>
          {(letter.hasRead || open) ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, padding: '5px 11px', borderRadius: 20, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', background: 'rgba(139,126,200,0.1)', color: 'var(--purple)', flexShrink: 0, border: '1px solid rgba(139,126,200,0.25)' }}>
              ✓ Read
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, padding: '5px 11px', borderRadius: 20, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', background: 'rgba(122,158,142,0.1)', color: 'var(--sage)', flexShrink: 0, border: '1px solid rgba(122,158,142,0.25)' }}>
              ● New
            </span>
          )}
        </div>

        <div style={{ fontFamily: 'Lora, serif', fontSize: 14.5, color: 'var(--ink-soft)', marginBottom: 10, fontWeight: 500 }}>
          🔒 anonymous · {date}
        </div>

        {open ? (
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 8, whiteSpace: 'pre-line' }}>
            {letter.message}
          </p>
        ) : (
          <>
            <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {letter.message}
            </p>
            {readError && (
              <div style={{ fontSize: 11, marginBottom: 12, padding: '8px 12px', borderRadius: 8, color: 'var(--tc)', background: 'rgba(196,99,58,0.07)', border: '1px solid rgba(196,99,58,0.15)' }}>
                {readError}
              </div>
            )}
          </>
        )}
      </div>

      {/* Card footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px 14px 32px', borderTop: `1px solid ${FT}`, background: 'rgba(245,240,232,0.4)' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'Lora, serif', fontStyle: 'italic' }}>
          {open ? "You\u2019ve read this letter with care \u2736" : 'Each letter can only be opened once'}
        </div>
        {!open && (
          <button
            onClick={handleOpen}
            disabled={marking}
            onMouseEnter={() => setOpenBtnHov(true)}
            onMouseLeave={() => setOpenBtnHov(false)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', transition: 'all 0.15s', border: openBtnHov ? '1.5px solid var(--sage)' : `1.5px solid ${BD}`, color: openBtnHov ? '#fff' : 'var(--sage)', background: openBtnHov ? 'var(--sage)' : 'transparent', opacity: marking ? 0.6 : 1 }}
          >
            {marking ? (
              <>
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Opening…
              </>
            ) : 'Open & Read →'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ListenerReadPage() {
  const { strangerLetters, refreshStrangerLetters, navigate, canReadFeed } = useApp()
  const [letters, setLetters] = useState(strangerLetters)

  useEffect(() => { refreshStrangerLetters() }, [refreshStrangerLetters])
  useEffect(() => { setLetters(strangerLetters) }, [strangerLetters])

  function handleMarkRead(id) {
    setLetters(prev => prev.map(l => l._id === id ? { ...l, hasRead: true } : l))
  }

  if (!canReadFeed) {
    return (
      <main className="page-enter w-full px-5 sm:px-10 md:px-16" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div style={{ textAlign: 'center', padding: '72px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.5)', border: `1.5px dashed ${BD}` }}>
          <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.4 }}>🔒</div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 24, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>This space is for listeners</div>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto 28px' }}>
            Update your role in profile settings to access the listener feed.
          </p>
          <button onClick={() => navigate('write')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--ink)', color: 'var(--cream)', border: 'none', borderRadius: 10, padding: '14px 24px', fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Go to Write →
          </button>
        </div>
      </main>
    )
  }

  const unread = letters.filter(l => !l.hasRead)
  const read   = letters.filter(l => l.hasRead)

  return (
    <main className="page-enter px-5 sm:px-10 md:px-16" style={{ maxWidth: 960, margin: '0 auto', paddingTop: 56, paddingBottom: 80 }}>

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 1, background: BD, display: 'inline-block' }} />
            Listener feed
          </div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: 12 }}>
            <span style={{ display: 'inline-block', width: 38, height: 38, background: 'linear-gradient(135deg, #ece8f5, #f0eef9)', borderRadius: 10, textAlign: 'center', lineHeight: '38px', fontSize: 20, marginRight: 10, verticalAlign: 'middle', position: 'relative', top: -3, border: `1px solid ${BD}` }}>🎧</span>
            Be Present for a Stranger
          </h1>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: 420 }}>
            Real people shared something real. Reading their words is an act of care.
          </p>
        </div>
        <button onClick={() => refreshStrangerLetters()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: 'var(--ink-muted)', border: `1px solid ${BD}`, borderRadius: 10, padding: '14px 24px', fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 12 }}>
          ↻ Refresh
        </button>
      </div>

      {/* ── Count row ───────────────────────────────────────────────── */}
      {letters.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ background: '#EDE5D4', color: 'var(--ink-soft)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, marginRight: 8 }}>
            {unread.length} unread
          </span>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
            {unread.length > 0 ? 'waiting to be heard' : `${read.length} already held`}
          </span>
        </div>
      )}

      {/* ── Intention note ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 32, padding: '16px 20px', borderRadius: 12, background: 'rgba(139,126,200,0.06)', border: '1px solid rgba(139,126,200,0.2)' }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>✦</span>
        <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>
          Each letter can only be opened once. So when you do — read slowly, read fully. Someone wrote this for a stranger like you.
        </p>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {letters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '72px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.5)', border: `1.5px dashed ${BD}` }}>
          <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.35 }}>📭</div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>The feed is quiet for now</div>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.75, maxWidth: 280, margin: '0 auto' }}>
            Someone out there is writing right now. Check back soon.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Unread */}
          {unread.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)' }}>Waiting to be heard</span>
                <span style={{ background: 'rgba(122,158,142,0.1)', color: 'var(--sage)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{unread.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {unread.map(letter => <LetterCard key={letter._id} letter={letter} onMarkRead={handleMarkRead} />)}
              </div>
            </div>
          )}
          {/* Read */}
          {read.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)' }}>Already held</span>
                <span style={{ background: 'rgba(139,126,200,0.1)', color: 'var(--purple)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{read.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {read.map(letter => <LetterCard key={letter._id} letter={letter} onMarkRead={handleMarkRead} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
