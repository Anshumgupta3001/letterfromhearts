import { useEffect, useState, useCallback, useMemo } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

const BD = '#E0D4BC'
const FT = '#F2EBE0'

// ── Report Letter Modal ───────────────────────────────────────────────────────
function ReportLetterModal({ letterId, onClose }) {
  const [desc,      setDesc]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]      = useState(false)
  const [err,        setErr]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!desc.trim()) { setErr('Please describe the issue.'); return }
    setSubmitting(true)
    setErr('')
    try {
      const res = await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          type:        'content',
          subject:     'Inappropriate letter content',
          description: desc.trim(),
          letterId,
        }),
      })
      if (res.ok) { setDone(true) }
      else        { const j = await res.json(); setErr(j.error || 'Could not submit report.') }
    } catch { setErr('Network error. Please try again.') }
    finally   { setSubmitting(false) }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
          width: '100%', maxWidth: 400,
          boxShadow: '0 16px 48px rgba(28,26,23,0.16)',
          border: '1px solid rgba(28,26,23,0.08)',
        }}
      >
        {done ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: '"Lora",serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
              Report received
            </div>
            <p style={{ fontFamily: '"Lora",serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
              Thank you for helping keep this a safe space. We'll review it shortly.
            </p>
            <button
              onClick={onClose}
              style={{ marginTop: 20, padding: '9px 24px', borderRadius: 8, background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', fontSize: 13, fontWeight: 500 }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ fontFamily: '"Lora",serif', fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
              🚩 Report this letter
            </div>
            <p style={{ fontFamily: '"Lora",serif', fontStyle: 'italic', fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 16 }}>
              Let us know if this letter contains harmful, abusive, or inappropriate content.
            </p>
            <textarea
              value={desc}
              onChange={e => { setDesc(e.target.value); setErr('') }}
              placeholder="Describe what's wrong…"
              rows={4}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 13,
                border: err ? '1.5px solid var(--tc)' : '1px solid rgba(28,26,23,0.14)',
                outline: 'none', resize: 'vertical', fontFamily: '"DM Sans",sans-serif',
                color: 'var(--ink)', lineHeight: 1.6, boxSizing: 'border-box',
              }}
            />
            {err && <div style={{ fontSize: 12, color: 'var(--tc)', marginTop: 6 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(28,26,23,0.14)', background: 'transparent', fontSize: 12.5, cursor: 'pointer', color: 'var(--ink-muted)', fontFamily: '"DM Sans",sans-serif' }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                style={{ padding: '8px 20px', borderRadius: 8, background: '#B85450', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif' }}>
                {submitting ? 'Sending…' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Letter card ───────────────────────────────────────────────────────────────
function LetterCard({ letter, onMarkRead, onOpen }) {
  const [marking,   setMarking]   = useState(false)
  const [readError, setReadError] = useState('')
  const [hov,       setHov]       = useState(false)
  const [btnHov,    setBtnHov]    = useState(false)
  const date = new Date(letter.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  async function handleOpen() {
    // Already claimed by this user — open panel directly
    if (letter.hasRead) {
      onOpen(letter)
      return
    }

    setMarking(true)
    setReadError('')
    try {
      const res  = await apiFetch(`/api/letters/${letter._id}/read`, { method: 'POST' })
      const json = await res.json()

      if (res.ok) {
        const updated = { ...letter, hasRead: true, type: 'stranger' }
        onMarkRead(letter._id)
        onOpen(updated)
        return
      }

      if (res.status === 403) {
        setReadError('This letter has already been claimed by another listener.')
        return
      }

      setReadError(json.error || 'Could not open letter.')
    } catch {
      setReadError('Network error. Please try again.')
    } finally {
      setMarking(false)
    }
  }

  const isHeld = letter.hasRead

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 14, border: `1px solid ${BD}`,
        overflow: 'hidden', position: 'relative',
        display: 'flex', flexDirection: 'column',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? '0 10px 28px rgba(26,18,8,0.09)' : 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: isHeld
          ? 'linear-gradient(180deg, var(--purple), var(--gold))'
          : 'linear-gradient(180deg, var(--sage), var(--gold))',
        borderRadius: '4px 0 0 4px',
      }} />

      {/* Card body */}
      <div style={{ padding: '18px 20px 14px 24px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
          <h3 style={{
            fontFamily: '"Lora", serif', fontSize: 16, fontWeight: 600,
            color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.2px',
          }}>
            {letter.subject}
          </h3>

          {isHeld ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10, padding: '4px 11px', borderRadius: 20, fontWeight: 700,
              letterSpacing: '0.8px', textTransform: 'uppercase', flexShrink: 0,
              background: 'rgba(139,126,200,0.1)', color: 'var(--purple)',
              border: '1px solid rgba(139,126,200,0.25)', fontFamily: '"DM Sans", sans-serif',
            }}>
              ✓ Held by you
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10, padding: '4px 11px', borderRadius: 20, fontWeight: 700,
              letterSpacing: '0.8px', textTransform: 'uppercase', flexShrink: 0,
              background: 'rgba(122,158,142,0.1)', color: 'var(--sage)',
              border: '1px solid rgba(122,158,142,0.25)', fontFamily: '"DM Sans", sans-serif',
            }}>
              ● New
            </span>
          )}
        </div>

        <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11.5, color: 'var(--ink-muted)', marginBottom: 10 }}>
          🔒 anonymous · {date}
          {letter.mood && (
            <span style={{ marginLeft: 8, color: 'var(--sage)', textTransform: 'capitalize', fontSize: 12 }}>
              · {letter.mood}
            </span>
          )}
        </div>

        {/* Replied badge — only shown on held letters where listener has replied */}
        {isHeld && letter.hasReplied && (
          <div style={{ marginBottom: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
              background: 'rgba(122,158,142,0.1)', color: 'var(--sage)',
              border: '1px solid rgba(122,158,142,0.28)',
              fontFamily: '"DM Sans", sans-serif', letterSpacing: '0.6px', textTransform: 'uppercase',
            }}>
              🌿 Replied
            </span>
          </div>
        )}

        {/* Preview snippet */}
        <p style={{
          fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 13,
          color: 'var(--ink-muted)', lineHeight: 1.65, marginBottom: 0,
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {letter.message}
        </p>

        {readError && (
          <div style={{
            fontSize: 11.5, marginTop: 12, padding: '8px 12px', borderRadius: 8,
            color: 'var(--tc)', background: 'rgba(196,99,58,0.07)',
            border: '1px solid rgba(196,99,58,0.15)', fontFamily: '"DM Sans", sans-serif',
          }}>
            {readError}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '10px 20px 10px 24px',
        borderTop: `1px solid ${FT}`, background: 'rgba(245,240,232,0.4)',
      }}>
        <button
          onClick={handleOpen}
          disabled={marking}
          onMouseEnter={() => setBtnHov(true)}
          onMouseLeave={() => setBtnHov(false)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 17px', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
            cursor: marking ? 'default' : 'pointer', fontFamily: '"DM Sans", sans-serif',
            transition: 'all 0.15s', opacity: marking ? 0.6 : 1,
            border: isHeld
              ? '1.5px solid rgba(139,126,200,0.4)'
              : (btnHov ? '1.5px solid var(--sage)' : `1.5px solid ${BD}`),
            color: isHeld ? 'var(--purple)' : (btnHov ? '#fff' : 'var(--sage)'),
            background: isHeld ? 'rgba(139,126,200,0.07)' : (btnHov ? 'var(--sage)' : 'transparent'),
          }}
        >
          {marking ? (
            <>
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Opening…
            </>
          ) : isHeld ? 'Read again →' : 'Open & hold →'}
        </button>
      </div>

    </div>
  )
}

// ── Listener onboarding banner ────────────────────────────────────────────────
function ListenerBanner({ onDismiss }) {
  return (
    <div style={{
      marginBottom: 16,
      padding: '12px 16px',
      borderRadius: 10,
      background: '#fff',
      border: '0.5px solid rgba(28,26,23,0.1)',
    }}>
      <div style={{
        fontFamily: '"Lora", serif', fontSize: 12,
        color: 'var(--ink)', fontWeight: 600, marginBottom: 8,
      }}>
        You're a listener. Here's what that means.
      </div>
      <ul style={{ margin: '0 0 10px', padding: '0 0 0 16px', listStyle: 'disc' }}>
        {[
          'Each letter is from a real person. When you claim one, only you reply — it leaves the feed.',
          'You don\'t need to fix anything. Just be present.',
          'One letter at a time. Don\'t claim more than you can hold.',
          'Meet people where they are, not where you\'d like them to be.',
          'If a letter is too heavy today, leave it for someone else.',
        ].map((item, i) => (
          <li key={i} style={{
            fontFamily: '"Lora", serif', fontStyle: 'italic',
            fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.7,
            marginBottom: 2,
          }}>
            {item}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onDismiss}
          style={{
            padding: '5px 14px', borderRadius: 100,
            background: 'var(--ink)', color: 'var(--cream)',
            border: 'none', cursor: 'pointer',
            fontFamily: '"DM Sans", sans-serif', fontSize: 11.5, fontWeight: 500,
            letterSpacing: '0.1px', transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--tc)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--ink)' }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ListenerReadPage() {
  const { strangerLetters, refreshStrangerLetters, navigate, canReadFeed, openLetterPanel, refreshNotifications } = useApp()
  const [letters,    setLetters]    = useState(strangerLetters)
  const [filter,     setFilter]     = useState('all')    // all | unread | held
  const [sort,       setSort]       = useState('newest')  // newest | oldest
  const [refreshing, setRefreshing] = useState(false)
  const [moodFilter, setMoodFilter] = useState('all')    // all | vent | joy | love | grief | gratitude | longing
  const [showBanner, setShowBanner] = useState(() =>
    localStorage.getItem('listener_banner_seen') !== 'true'
  )

  function dismissBanner() {
    localStorage.setItem('listener_banner_seen', 'true')
    setShowBanner(false)
  }

  useEffect(() => { refreshStrangerLetters() }, [refreshStrangerLetters])
  useEffect(() => { setLetters(strangerLetters) }, [strangerLetters])

  async function handleRefresh() {
    if (refreshing) return
    setRefreshing(true)
    try { await refreshStrangerLetters() } finally { setRefreshing(false) }
  }

  function handleMarkRead(id) {
    setLetters(prev => prev.map(l => l._id === id ? { ...l, hasRead: true } : l))
    refreshNotifications()
  }

  const handleOpen = useCallback((letter) => {
    openLetterPanel({ ...letter, type: letter.type || 'stranger' })
  }, [openLetterPanel])

  const MOODS = [
    { id: 'all',       emoji: '✨', label: 'All moods'    },
    { id: 'vent',      emoji: '🌧️', label: 'Need to vent' },
    { id: 'joy',       emoji: '🌟', label: 'Pure joy'     },
    { id: 'love',      emoji: '💌', label: 'Love & warmth'},
    { id: 'grief',     emoji: '🕯️', label: 'Grief & loss' },
    { id: 'gratitude', emoji: '🌿', label: 'Gratitude'    },
    { id: 'longing',   emoji: '🌙', label: 'Longing'      },
  ]

  // Count letters per mood (unclaimed only — exclude already-held ones from totals)
  const moodCounts = useMemo(() => {
    const counts = { all: letters.length }
    for (const l of letters) {
      if (l.mood) counts[l.mood] = (counts[l.mood] || 0) + 1
    }
    return counts
  }, [letters])

  // Filter + sort derived list
  const displayed = useMemo(() => {
    let list = letters
    if (filter === 'unread') list = letters.filter(l => !l.hasRead)
    if (filter === 'held')   list = letters.filter(l =>  l.hasRead)
    if (moodFilter !== 'all') list = list.filter(l => l.mood === moodFilter)
    return [...list].sort((a, b) =>
      sort === 'oldest'
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)
    )
  }, [letters, filter, sort, moodFilter])

  // ── Access guard ──
  if (!canReadFeed) {
    return (
      <main className="page-enter w-full flex justify-center px-4 sm:px-6" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="w-full max-w-3xl lg:max-w-4xl">
          <div style={{ textAlign: 'center', padding: '72px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.5)', border: `1.5px dashed ${BD}` }}>
            <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.4 }}>🔒</div>
            <div style={{ fontFamily: '"Lora", serif', fontSize: 24, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>This space is for listeners</div>
            <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto 28px' }}>
              Update your role in profile settings to access the listener feed.
            </p>
            <button onClick={() => navigate('write')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--ink)', color: 'var(--cream)', border: 'none', borderRadius: 10, padding: '14px 24px', fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              Go to Write →
            </button>
          </div>
        </div>
      </main>
    )
  }

  const unread = letters.filter(l => !l.hasRead)
  const read   = letters.filter(l =>  l.hasRead)

  return (
    <main className="page-enter w-full flex justify-center px-4 sm:px-6" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div className="w-full max-w-6xl flex gap-6 items-start">

        {/* ── Mood sidebar — desktop only ── */}
        <aside className="hidden lg:flex flex-col flex-shrink-0" style={{ width: 172, position: 'sticky', top: 72 }}>
          <div style={{
            fontFamily: '"DM Sans", sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-muted)',
            marginBottom: 10, paddingLeft: 4,
          }}>
            Filter by mood
          </div>
          {MOODS.map(m => {
            const active = moodFilter === m.id
            const count  = moodCounts[m.id] ?? 0
            const empty  = m.id !== 'all' && count === 0
            return (
              <button
                key={m.id}
                onClick={() => !empty && setMoodFilter(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  width: '100%', padding: '8px 10px', borderRadius: 9, marginBottom: 2,
                  background: active ? 'rgba(196,99,58,0.08)' : 'transparent',
                  border: active ? '1px solid rgba(196,99,58,0.2)' : '1px solid transparent',
                  cursor: empty ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.14s',
                  opacity: empty ? 0.38 : 1,
                }}
                onMouseEnter={e => { if (!active && !empty) e.currentTarget.style.background = 'rgba(28,26,23,0.04)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{m.emoji}</span>
                <span style={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: 12.5, flex: 1,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--tc)' : 'var(--ink-muted)',
                  transition: 'color 0.14s',
                }}>
                  {m.label}
                </span>
                <span style={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: 10.5, fontWeight: 600,
                  color: active ? 'var(--tc)' : 'rgba(28,26,23,0.3)',
                  minWidth: 16, textAlign: 'right',
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

        {/* Mobile mood filter — horizontal scroll */}
        <div className="flex lg:hidden gap-2 mb-4" style={{ overflowX: 'auto', paddingBottom: 4 }}>
          {MOODS.map(m => {
            const active = moodFilter === m.id
            const count  = moodCounts[m.id] ?? 0
            const empty  = m.id !== 'all' && count === 0
            return (
              <button
                key={m.id}
                onClick={() => !empty && setMoodFilter(m.id)}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 99, fontSize: 12,
                  cursor: empty ? 'default' : 'pointer',
                  fontFamily: '"DM Sans", sans-serif', fontWeight: active ? 600 : 400,
                  background: active ? 'var(--tc)' : '#fff',
                  color:      active ? '#fff' : 'var(--ink-muted)',
                  border:     active ? '1px solid var(--tc)' : `1px solid ${BD}`,
                  whiteSpace: 'nowrap', transition: 'all 0.14s',
                  opacity: empty ? 0.38 : 1,
                }}
              >
                {m.emoji} {m.id === 'all' ? 'All' : m.label}
                <span style={{
                  fontSize: 10, fontWeight: 700, marginLeft: 2,
                  opacity: active ? 0.85 : 0.55,
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Onboarding banner ── */}
        {showBanner && <ListenerBanner onDismiss={dismissBanner} />}

        {/* ── Page header ── */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: '"Lora", serif', fontSize: 26, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.4px', marginBottom: 5 }}>
            🎧 Listener Feed
          </h1>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
            Real people shared something real. The first to open holds it.
          </p>
        </div>

        {/* ── Filter + sort bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'all',    label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'held',   label: 'Held by me' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '5px 13px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
                  fontFamily: '"DM Sans", sans-serif', fontWeight: filter === f.id ? 600 : 400,
                  background: filter === f.id ? 'var(--tc)' : '#fff',
                  color:      filter === f.id ? '#fff' : 'var(--ink-muted)',
                  border:     filter === f.id ? '1px solid var(--tc)' : `1px solid ${BD}`,
                  transition: 'all 0.14s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort + count + refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
              {displayed.length} letter{displayed.length !== 1 ? 's' : ''}
            </span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                padding: '5px 10px', borderRadius: 8, fontSize: 12,
                border: `1px solid ${BD}`, background: '#fff',
                color: 'var(--ink)', fontFamily: '"DM Sans", sans-serif',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh letters"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 7,
                border: `1px solid ${BD}`, background: '#fff',
                color: 'var(--ink-muted)', cursor: refreshing ? 'default' : 'pointer',
                transition: 'background 0.15s, color 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { if (!refreshing) { e.currentTarget.style.background = '#f5f0e8'; e.currentTarget.style.color = 'var(--ink)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--ink-muted)' }}
            >
              <FiRefreshCw size={13} style={{ transition: 'transform 0.3s' }} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {letters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.5)', border: `1.5px dashed ${BD}` }}>
            <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.35 }}>📭</div>
            <div style={{ fontFamily: '"Lora", serif', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>The feed is quiet for now</div>
            <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.75, maxWidth: 280, margin: '0 auto' }}>
              Someone out there is writing right now. Check back soon.
            </p>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.5)', border: `1.5px dashed ${BD}` }}>
            <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 14.5, color: 'var(--ink-muted)' }}>
              No letters match this filter.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayed.map(letter => (
              <LetterCard key={letter._id} letter={letter} onMarkRead={handleMarkRead} onOpen={handleOpen} />
            ))}
          </div>
        )}

        </div>{/* end flex-1 main content */}
      </div>
    </main>
  )
}
