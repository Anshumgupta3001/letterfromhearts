import { useEffect, useState, useCallback, useMemo } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

const BD = '#F0DFD1'
const FT = '#F0DFD1'

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
        position: 'fixed', inset: 0, background: 'rgba(40,3,15,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
          width: '100%', maxWidth: 400,
          boxShadow: '0 16px 48px rgba(40,3,15,0.16)',
          border: '1px solid rgba(40,3,15,0.08)',
        }}
      >
        {done ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: '"Gambetta", serif', letterSpacing: '-0.03em', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 8 }}>
              Report received
            </div>
            <p style={{ fontFamily: '"General Sans", sans-serif', fontSize: 15, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
              Thank you for helping keep this a safe space. We'll review it shortly.
            </p>
            <button
              onClick={onClose}
              style={{ marginTop: 20, padding: '9px 24px', borderRadius: 8, background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer', fontFamily: '"General Sans", sans-serif', fontSize: 13, fontWeight: 500 }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ fontFamily: '"Gambetta", serif', letterSpacing: '-0.03em', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>
              🚩 Report this letter
            </div>
            <p style={{ fontFamily: '"General Sans", sans-serif', fontSize: 15, color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 16 }}>
              Let us know if this letter contains harmful, abusive, or inappropriate content.
            </p>
            <textarea
              value={desc}
              onChange={e => { setDesc(e.target.value); setErr('') }}
              placeholder="Describe what's wrong…"
              rows={4}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 15,
                border: err ? '1.5px solid var(--tc)' : '1px solid rgba(40,3,15,0.14)',
                outline: 'none', resize: 'vertical', fontFamily: '"General Sans", sans-serif',
                color: 'var(--ink)', lineHeight: 1.6, boxSizing: 'border-box',
              }}
            />
            {err && <div style={{ fontSize: 12, color: 'var(--tc)', marginTop: 6 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(40,3,15,0.14)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--ink-muted)', fontFamily: '"General Sans", sans-serif' }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                style={{ padding: '8px 20px', borderRadius: 8, background: '#B85450', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: '"General Sans", sans-serif' }}>
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
    <article
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#FFFFFF', borderRadius: 16,
        border: `1px solid ${hov ? 'var(--rose)' : 'var(--sand)'}`,
        padding: 24, boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: hov ? '0 12px 32px rgba(40,3,15,0.08)' : '0 1px 2px rgba(40,3,15,0.03)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        fontFamily: '"General Sans", sans-serif',
      }}
    >
      {/* Meta row: mood + date · status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {letter.mood && (
            <span style={{ fontSize: 13, fontWeight: 500, padding: '4px 10px', borderRadius: 6, background: 'var(--cream)', border: '1px solid var(--sand)', color: 'var(--ink)', textTransform: 'capitalize' }}>
              {letter.mood}
            </span>
          )}
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{date}</span>
        </div>

        {isHeld ? (
          <span style={{ fontSize: 13, fontWeight: 500, padding: '4px 10px', borderRadius: 6, background: 'var(--sand)', color: 'var(--ink)' }}>
            {letter.hasReplied ? 'Replied' : 'Held by you'}
          </span>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 500, padding: '4px 10px', borderRadius: 6, background: 'var(--lemon)', color: 'var(--ink)' }}>
            New
          </span>
        )}
      </div>

      {/* Title */}
      <h3 style={{ margin: 0, fontFamily: '"Gambetta", Georgia, serif', fontWeight: 400, fontSize: 26, lineHeight: 1.15, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
        {letter.subject}
      </h3>

      {/* Preview */}
      <p style={{
        margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-soft)',
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {letter.message}
      </p>

      {readError && (
        <div role="alert" style={{ fontSize: 14, padding: '10px 12px', borderRadius: 8, background: 'var(--warm)', color: 'var(--ink)' }}>
          {readError}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--sand)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
          Anonymous writer
        </span>
        <button
          onClick={handleOpen}
          disabled={marking}
          onMouseEnter={() => setBtnHov(true)}
          onMouseLeave={() => setBtnHov(false)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 40, padding: '0 16px', borderRadius: 8,
            fontFamily: '"General Sans", sans-serif', fontSize: 14, fontWeight: 500,
            cursor: marking ? 'default' : 'pointer', opacity: marking ? 0.6 : 1,
            transition: 'background 0.15s, opacity 0.15s',
            ...(isHeld
              ? { background: btnHov ? 'var(--cream)' : '#FFFFFF', color: 'var(--ink)', border: '1px solid var(--rose)' }
              : { background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)', opacity: marking ? 0.6 : (btnHov ? 0.9 : 1) }),
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
          ) : isHeld ? 'Read again' : 'Open & hold'}
        </button>
      </div>
    </article>
  )
}

// ── Listener onboarding banner ────────────────────────────────────────────────
function ListenerBanner({ onDismiss }) {
  return (
    <div style={{
      marginBottom: 20,
      padding: '20px 22px',
      borderRadius: 16,
      background: 'var(--lemon)',
      border: 'none',
    }}>
      <div style={{
        fontFamily: '"Gambetta", serif', letterSpacing: '-0.03em', fontSize: 24,
        color: 'var(--ink)', fontWeight: 400, marginBottom: 10,
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
            fontFamily: '"General Sans", sans-serif', fontSize: 15, color: 'var(--ink)', lineHeight: 1.6,
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
            height: 40, padding: '0 16px', borderRadius: 8,
            background: 'var(--ink)', color: 'var(--paper)',
            border: 'none', cursor: 'pointer',
            fontFamily: '"General Sans", sans-serif', fontSize: 14, fontWeight: 500,
          }}
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
    { id: 'all',       emoji: '', dot: null,       label: 'All moods'    },
    { id: 'vent',      emoji: '', dot: '#33557F',  label: 'Need to vent' },
    { id: 'joy',       emoji: '', dot: '#FBF582',  label: 'Pure joy'     },
    { id: 'love',      emoji: '', dot: '#D4C4C9',  label: 'Love & warmth'},
    { id: 'grief',     emoji: '', dot: '#755760',  label: 'Grief & loss' },
    { id: 'gratitude', emoji: '', dot: '#588F60',  label: 'Gratitude'    },
    { id: 'longing',   emoji: '', dot: '#28030F',  label: 'Longing'      },
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
            <div style={{ fontFamily: '"Gambetta", serif', letterSpacing: '-0.03em', fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 12 }}>This space is for listeners</div>
            <p style={{ fontFamily: '"General Sans", sans-serif', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto 28px' }}>
              Update your role in profile settings to access the listener feed.
            </p>
            <button onClick={() => navigate('write')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--ink)', color: 'var(--cream)', border: 'none', borderRadius: 10, padding: '14px 24px', fontFamily: '"General Sans", sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
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
            fontFamily: '"General Sans", sans-serif', fontSize: 13, fontWeight: 700,
            color: 'var(--ink-muted)',
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
                  width: '100%', height: 44, padding: '0 12px', borderRadius: 8, marginBottom: 2,
                  background: active ? 'var(--ink)' : 'transparent',
                  border: 'none',
                  cursor: empty ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.14s',
                  opacity: empty ? 0.38 : 1,
                }}
                onMouseEnter={e => { if (!active && !empty) e.currentTarget.style.background = 'rgba(40,3,15,0.04)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                {m.dot && <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: m.dot, border: m.id === 'joy' ? '1px solid #C9C26A' : 'none', flexShrink: 0 }} />}
                <span style={{
                  fontFamily: '"General Sans", sans-serif', fontSize: 15, flex: 1,
                  fontWeight: 500,
                  color: active ? 'var(--paper)' : 'var(--ink)',
                  transition: 'color 0.14s',
                }}>
                  {m.label}
                </span>
                <span style={{
                  fontFamily: '"General Sans", sans-serif', fontSize: 13, fontWeight: 500,
                  color: active ? 'var(--paper)' : 'var(--ink-muted)',
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
                  padding: '5px 12px', borderRadius: 6, fontSize: 12,
                  cursor: empty ? 'default' : 'pointer',
                  fontFamily: '"General Sans", sans-serif', fontWeight: active ? 600 : 400,
                  background: active ? 'var(--tc)' : '#fff',
                  color:      active ? '#fff' : 'var(--ink-muted)',
                  border:     active ? '1px solid var(--tc)' : `1px solid ${BD}`,
                  whiteSpace: 'nowrap', transition: 'all 0.14s',
                  opacity: empty ? 0.38 : 1,
                }}
              >
                {m.id === 'all' ? 'All' : m.label}
                <span style={{
                  fontSize: 12, fontWeight: 700, marginLeft: 2,
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
          <h1 style={{ fontFamily: '"Gambetta", serif', fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 5 }}>
            Listener feed
          </h1>
          <p style={{ fontFamily: '"General Sans", sans-serif', fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
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
                  padding: '5px 13px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  fontFamily: '"General Sans", sans-serif', fontWeight: filter === f.id ? 600 : 400,
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
            <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: '"General Sans", sans-serif' }}>
              {displayed.length} letter{displayed.length !== 1 ? 's' : ''}
            </span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                padding: '5px 10px', borderRadius: 8, fontSize: 12,
                border: `1px solid ${BD}`, background: '#fff',
                color: 'var(--ink)', fontFamily: '"General Sans", sans-serif',
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
            <div style={{ fontFamily: '"Gambetta", serif', letterSpacing: '-0.03em', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12 }}>The feed is quiet for now</div>
            <p style={{ fontFamily: '"General Sans", sans-serif', fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.75, maxWidth: 280, margin: '0 auto' }}>
              Someone out there is writing right now. Check back soon.
            </p>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.5)', border: `1.5px dashed ${BD}` }}>
            <div style={{ fontFamily: '"General Sans", sans-serif', fontSize: 14.5, color: 'var(--ink-muted)' }}>
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
