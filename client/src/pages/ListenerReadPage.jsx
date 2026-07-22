import { useEffect, useState, useCallback, useMemo } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

// ── Mood config (matches the real letter data) ────────────────────────────────
const MOODS = [
  { id: 'all',       emoji: '✨', label: 'All moods',     short: 'All',        tone: 'all'    },
  { id: 'vent',      emoji: '🌧️', label: 'Need to vent',  short: 'Vent',       tone: 'sky'    },
  { id: 'joy',       emoji: '🌟', label: 'Pure joy',      short: 'Joy',        tone: 'yellow' },
  { id: 'love',      emoji: '💌', label: 'Love & warmth', short: 'Love',       tone: 'rose'   },
  { id: 'grief',     emoji: '🕯️', label: 'Grief & loss',  short: 'Grief',      tone: 'lav'    },
  { id: 'gratitude', emoji: '🌿', label: 'Gratitude',     short: 'Gratitude',  tone: 'mint'   },
  { id: 'longing',   emoji: '🌙', label: 'Longing',       short: 'Longing',    tone: 'blush'  },
]

const MOOD_PILL = {
  vent:      { bg: 'var(--sky)',    color: '#3E6FA8', emoji: '🌧️', label: 'Need to vent' },
  joy:       { bg: 'var(--yellow)', color: '#8A6D1B', emoji: '🌟', label: 'Joy'          },
  love:      { bg: '#FBD9E4',       color: '#A8437A', emoji: '💌', label: 'Love'         },
  grief:     { bg: 'var(--lav)',    color: '#5C4FA8', emoji: '🕯️', label: 'Grief'        },
  gratitude: { bg: 'var(--mint)',   color: '#2E7D5B', emoji: '🌿', label: 'Gratitude'    },
  longing:   { bg: 'var(--blush)',  color: '#B05A1F', emoji: '🌙', label: 'Longing'      },
  anger:     { bg: '#FBD9C6',       color: '#C74E3B', emoji: '🔥', label: 'Anger'        },
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Report Letter Modal ───────────────────────────────────────────────────────
function ReportLetterModal({ letterId, onClose }) {
  const [desc,       setDesc]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [err,        setErr]        = useState('')

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
    <div className="lr-modal-bg" onClick={onClose}>
      <div className="lr-modal" onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="lr-done">
            <div className="lr-done-ico">✅</div>
            <h3>Report received</h3>
            <p>Thank you for helping keep this a safe space. We'll review it shortly.</p>
            <button className="lr-btn-dark" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="lr-modal-title">🚩 Report this letter</h3>
            <p className="lr-modal-sub">Let us know if this letter contains harmful, abusive, or inappropriate content.</p>
            <textarea
              value={desc}
              onChange={e => { setDesc(e.target.value); setErr('') }}
              placeholder="Describe what's wrong…"
              rows={4}
              className={err ? 'lr-ta err' : 'lr-ta'}
            />
            {err && <div className="lr-err">{err}</div>}
            <div className="lr-modal-actions">
              <button type="button" className="lr-btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="lr-btn-danger" disabled={submitting}>
                {submitting ? 'Sending…' : 'Submit report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Letter card ───────────────────────────────────────────────────────────────
function LetterCard({ letter, onMarkRead, onOpen, onReport }) {
  const [marking,   setMarking]   = useState(false)
  const [readError, setReadError] = useState('')

  async function handleOpen() {
    if (letter.hasRead) { onOpen(letter); return }

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
  const pill = MOOD_PILL[letter.mood]

  return (
    <div className={`card ${isHeld ? 'held' : ''}`} onClick={handleOpen}>
      <div className="row">
        {pill ? (
          <span className="pill" style={{ background: pill.bg, color: pill.color }}>
            {pill.emoji} {pill.label}
          </span>
        ) : (
          <span className="pill pill-plain">Letter</span>
        )}
        <span className="time">{fmtDate(letter.createdAt)}</span>
      </div>

      <h3 className="card-title">{letter.subject || 'A letter from my heart'}</h3>
      <p className="excerpt">{letter.message}</p>

      {(isHeld || letter.hasReplied) && (
        <div className="badges">
          {isHeld && <span className="badge badge-held">✓ Held by you</span>}
          {isHeld && letter.hasReplied && <span className="badge badge-replied">🌿 Replied</span>}
        </div>
      )}

      {readError && <div className="card-err">{readError}</div>}

      <div className="foot">
        <span className="anon">🔒 Anonymous</span>
        <div className="foot-right">
          <button
            className="report"
            title="Report this letter"
            onClick={e => { e.stopPropagation(); onReport(letter._id) }}
          >
            🚩
          </button>
          <button
            className="hold"
            disabled={marking}
            onClick={e => { e.stopPropagation(); handleOpen() }}
          >
            {marking ? 'Opening…' : isHeld ? 'Read again →' : 'Hold this →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Listener onboarding banner ────────────────────────────────────────────────
function ListenerBanner({ onDismiss }) {
  const POINTS = [
    'Each letter is from a real person. When you claim one, only you reply — it leaves the feed.',
    "You don't need to fix anything. Just be present.",
    "One letter at a time. Don't claim more than you can hold.",
    "Meet people where they are, not where you'd like them to be.",
    'If a letter is too heavy today, leave it for someone else.',
  ]
  return (
    <div className="banner">
      <h3>You're a listener. Here's what that means.</h3>
      <ul>
        {POINTS.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
      <div className="banner-foot">
        <button onClick={onDismiss}>Got it</button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ListenerReadPage() {
  const { strangerLetters, refreshStrangerLetters, navigate, canReadFeed, openLetterPanel, refreshNotifications } = useApp()
  const [letters,    setLetters]    = useState(strangerLetters)
  const [filter,     setFilter]     = useState('all')
  const [sort,       setSort]       = useState('newest')
  const [refreshing, setRefreshing] = useState(false)
  const [moodFilter, setMoodFilter] = useState('all')
  const [reportId,   setReportId]   = useState(null)
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

  const moodCounts = useMemo(() => {
    const counts = { all: letters.length }
    for (const l of letters) {
      if (l.mood) counts[l.mood] = (counts[l.mood] || 0) + 1
    }
    return counts
  }, [letters])

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
      <main className="sunrise-listen">
        <div className="wrap">
          <div className="empty">
            <div className="empty-icon">🔒</div>
            <h3 className="empty-title">This space is for listeners</h3>
            <p className="empty-text">Update your role in profile settings to access the listener feed.</p>
            <button className="empty-cta" onClick={() => navigate('write')}>Go to Write →</button>
          </div>
        </div>
        <style>{SUNRISE_LISTEN_CSS}</style>
      </main>
    )
  }

  return (
    <main className="sunrise-listen">
      <div className="wrap">

        <div className="chip fade">🎧 Open letters</div>

        <h1 className="l-h1 fade" style={{ animationDelay: '.07s' }}>
          Letters waiting to be{' '}
          <span className="hl">
            heard
            <svg viewBox="0 0 120 10" fill="none" preserveAspectRatio="none" className="underline">
              <path d="M2 7 C 30 2, 60 9, 118 4" stroke="var(--yellow)" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        <p className="l-sub fade" style={{ animationDelay: '.13s' }}>
          Each one is a real person. Take your time before you choose. Your presence matters.
        </p>

        <div className="intent fade" style={{ animationDelay: '.18s' }}>
          <span className="intent-ico">💛</span>
          <p>You don't have to reply to everything. Read with care, respond when it feels right.</p>
        </div>

        {showBanner && (
          <div className="fade" style={{ animationDelay: '.2s' }}>
            <ListenerBanner onDismiss={dismissBanner} />
          </div>
        )}

        {/* ── Mood pills ── */}
        <div className="moods fade" style={{ animationDelay: '.24s' }}>
          {MOODS.map(m => {
            const count = moodCounts[m.id] ?? 0
            const empty = m.id !== 'all' && count === 0
            return (
              <button
                key={m.id}
                className={`m m-${m.tone} ${moodFilter === m.id ? 'active' : ''} ${empty ? 'empty' : ''}`}
                disabled={empty}
                onClick={() => !empty && setMoodFilter(m.id)}
              >
                {m.emoji && <span>{m.emoji}</span>}{m.short}
                <span className="n">{count}</span>
              </button>
            )
          })}
        </div>

        {/* ── Filter + sort bar ── */}
        <div className="bar fade" style={{ animationDelay: '.27s' }}>
          <div className="filters">
            {[
              { id: 'all',    label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'held',   label: 'Held by me' },
            ].map(f => (
              <button
                key={f.id}
                className={`f ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="bar-right">
            <span className="count">{displayed.length} letter{displayed.length !== 1 ? 's' : ''}</span>
            <select value={sort} onChange={e => setSort(e.target.value)} className="sort">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <button className="refresh" onClick={handleRefresh} disabled={refreshing} title="Refresh letters">
              <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {letters.length === 0 ? (
          <div className="empty fade" style={{ animationDelay: '.3s' }}>
            <div className="empty-icon">📭</div>
            <h3 className="empty-title">The feed is quiet for now</h3>
            <p className="empty-text">Someone out there is writing right now. Check back soon.</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty fade" style={{ animationDelay: '.3s' }}>
            <div className="empty-icon">🔍</div>
            <h3 className="empty-title">No letters match this filter</h3>
            <p className="empty-text">Try a different mood, or clear the filters to see everything.</p>
            <button className="empty-cta" onClick={() => { setFilter('all'); setMoodFilter('all') }}>Clear filters</button>
          </div>
        ) : (
          <div className="grid fade" style={{ animationDelay: '.3s' }}>
            {displayed.map(letter => (
              <LetterCard
                key={letter._id}
                letter={letter}
                onMarkRead={handleMarkRead}
                onOpen={handleOpen}
                onReport={setReportId}
              />
            ))}
          </div>
        )}

        {reportId && <ReportLetterModal letterId={reportId} onClose={() => setReportId(null)} />}
      </div>

      <style>{SUNRISE_LISTEN_CSS}</style>
    </main>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const SUNRISE_LISTEN_CSS = `
  .sunrise-listen{ background:var(--cream); min-height:100%; }
  .sunrise-listen .wrap{ max-width:1040px; margin:0 auto; padding:52px 28px 120px; }

  .sunrise-listen .chip{ display:inline-flex; align-items:center; gap:8px; background:var(--mint); color:#2E7D5B; font-size:12.5px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; padding:8px 16px; border-radius:100px; margin-bottom:22px; }
  .sunrise-listen .l-h1{ font-size:clamp(32px,4.6vw,50px); font-weight:800; line-height:1.14; letter-spacing:-.02em; max-width:16ch; color:var(--ink); margin:0; }
  .sunrise-listen .l-h1 .hl{ color:var(--tc); position:relative; white-space:nowrap; }
  .sunrise-listen .underline{ position:absolute; left:0; bottom:-8px; width:100%; height:9px; pointer-events:none; }
  .sunrise-listen .l-sub{ margin-top:18px; font-size:16px; color:var(--ink-muted); font-weight:500; max-width:46ch; line-height:1.65; }

  .sunrise-listen .intent{ margin-top:32px; background:#FFF7E3; border-radius:20px; padding:20px 26px; display:flex; align-items:flex-start; gap:14px; max-width:640px; }
  .sunrise-listen .intent-ico{ font-size:20px; flex-shrink:0; }
  .sunrise-listen .intent p{ font-size:14px; font-weight:600; color:#8A6D1B; line-height:1.6; margin:0; }

  .sunrise-listen .banner{ margin-top:24px; background:var(--card); border:2px solid var(--line); border-radius:24px; padding:26px 28px; max-width:720px; }
  .sunrise-listen .banner h3{ font-size:15.5px; font-weight:800; color:var(--ink); margin:0 0 14px; }
  .sunrise-listen .banner ul{ margin:0 0 16px; padding:0 0 0 20px; display:flex; flex-direction:column; gap:7px; }
  .sunrise-listen .banner li{ font-size:13.5px; font-weight:500; color:var(--ink-soft); line-height:1.65; }
  .sunrise-listen .banner-foot{ display:flex; justify-content:flex-end; }
  .sunrise-listen .banner-foot button{ background:var(--ink); color:#fff; border:none; border-radius:100px; padding:10px 22px; font-family:inherit; font-size:12.5px; font-weight:800; cursor:pointer; transition:background .2s; }
  .sunrise-listen .banner-foot button:hover{ background:var(--tc); }

  .sunrise-listen .moods{ margin-top:40px; display:flex; gap:8px; flex-wrap:wrap; }
  .sunrise-listen .m{ border:2px solid var(--line); background:var(--card); color:var(--ink-soft); border-radius:100px; padding:10px 16px; font-family:inherit; font-size:13.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:all .2s; }
  .sunrise-listen .m:hover:not(:disabled){ transform:translateY(-2px); }
  .sunrise-listen .m .n{ font-size:11px; font-weight:800; color:var(--ink-muted); background:#fff; border-radius:100px; padding:2px 8px; }
  .sunrise-listen .m.active{ background:var(--ink); border-color:var(--ink); color:#fff; }
  .sunrise-listen .m.active .n{ background:rgba(255,255,255,.18); color:#fff; }
  .sunrise-listen .m.empty{ opacity:.38; cursor:default; }
  .sunrise-listen .m-lav:hover:not(.active):not(:disabled){ background:var(--lav); border-color:var(--lav); }
  .sunrise-listen .m-sky:hover:not(.active):not(:disabled){ background:var(--sky); border-color:var(--sky); }
  .sunrise-listen .m-blush:hover:not(.active):not(:disabled){ background:var(--blush); border-color:var(--blush); }
  .sunrise-listen .m-mint:hover:not(.active):not(:disabled){ background:var(--mint); border-color:var(--mint); }
  .sunrise-listen .m-rose:hover:not(.active):not(:disabled){ background:#FBD9E4; border-color:#FBD9E4; }
  .sunrise-listen .m-yellow:hover:not(.active):not(:disabled){ background:var(--yellow); border-color:var(--yellow); }

  .sunrise-listen .bar{ margin-top:22px; display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; }
  .sunrise-listen .filters{ display:flex; gap:8px; flex-wrap:wrap; }
  .sunrise-listen .f{ border:2px solid var(--line); background:var(--card); color:var(--ink-soft); border-radius:100px; padding:9px 16px; font-family:inherit; font-size:12.5px; font-weight:700; cursor:pointer; transition:all .2s; }
  .sunrise-listen .f:hover{ border-color:var(--yellow); background:#FFF7E3; }
  .sunrise-listen .f.active{ background:var(--tc); border-color:var(--tc); color:#fff; }
  .sunrise-listen .bar-right{ display:flex; align-items:center; gap:10px; }
  .sunrise-listen .count{ font-size:12.5px; font-weight:700; color:var(--ink-muted); white-space:nowrap; }
  .sunrise-listen .sort{ border:2px solid var(--line); background:var(--card); color:var(--ink); border-radius:100px; padding:9px 14px; font-family:inherit; font-size:12.5px; font-weight:700; cursor:pointer; outline:none; }
  .sunrise-listen .sort:focus{ border-color:var(--tc); }
  .sunrise-listen .refresh{ width:38px; height:38px; border-radius:50%; border:2px solid var(--line); background:var(--card); color:var(--ink-soft); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .2s; flex-shrink:0; }
  .sunrise-listen .refresh:hover:not(:disabled){ background:var(--yellow); border-color:var(--yellow); color:var(--ink); }

  .sunrise-listen .grid{ margin-top:32px; display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:18px; }
  .sunrise-listen .card{ background:var(--card); border:2px solid var(--line); border-radius:24px; padding:26px; cursor:pointer; transition:transform .25s cubic-bezier(.2,.8,.3,1.2), border-color .25s, box-shadow .25s; display:flex; flex-direction:column; gap:11px; }
  .sunrise-listen .card:hover{ transform:translateY(-6px) rotate(-.4deg); border-color:var(--tc); box-shadow:0 18px 44px rgba(59,54,99,.12); }
  .sunrise-listen .card.held{ background:#F4F1FC; border-color:#E3DCF6; }
  .sunrise-listen .card.held:hover{ border-color:var(--purple); }
  .sunrise-listen .row{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .sunrise-listen .pill{ font-size:11px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; padding:6px 13px; border-radius:100px; white-space:nowrap; }
  .sunrise-listen .pill-plain{ background:#fff; color:var(--ink-muted); }
  .sunrise-listen .time{ font-size:12px; font-weight:700; color:var(--ink-muted); white-space:nowrap; }
  .sunrise-listen .card-title{ font-size:17.5px; font-weight:700; line-height:1.35; color:var(--ink); margin:0; }
  .sunrise-listen .excerpt{ font-size:13.5px; font-weight:500; color:var(--ink-soft); line-height:1.65; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; margin:0; }
  .sunrise-listen .badges{ display:flex; gap:6px; flex-wrap:wrap; }
  .sunrise-listen .badge{ font-size:10.5px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; padding:5px 11px; border-radius:100px; }
  .sunrise-listen .badge-held{ background:var(--lav); color:#5C4FA8; }
  .sunrise-listen .badge-replied{ background:var(--mint); color:#2E7D5B; }
  .sunrise-listen .card-err{ font-size:12px; font-weight:600; color:#C74E3B; background:#FDEAE5; border-radius:12px; padding:9px 13px; line-height:1.5; }
  .sunrise-listen .foot{ margin-top:auto; padding-top:12px; display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .sunrise-listen .anon{ font-size:12px; font-weight:700; color:var(--ink-muted); }
  .sunrise-listen .foot-right{ display:flex; align-items:center; gap:8px; }
  .sunrise-listen .report{ background:transparent; border:none; font-size:13px; cursor:pointer; opacity:.35; padding:4px; border-radius:50%; transition:opacity .2s, background .2s; }
  .sunrise-listen .report:hover{ opacity:1; background:#FDEAE5; }
  .sunrise-listen .hold{ background:var(--ink); color:#fff; border:none; border-radius:100px; padding:9px 16px; font-family:inherit; font-size:12px; font-weight:800; cursor:pointer; transition:background .2s, transform .2s; white-space:nowrap; }
  .sunrise-listen .hold:hover:not(:disabled){ background:var(--tc); transform:scale(1.05); }
  .sunrise-listen .hold:disabled{ opacity:.6; cursor:default; }

  .sunrise-listen .empty{ margin-top:32px; background:var(--card); border:2px dashed var(--line-strong); border-radius:24px; padding:56px 32px; text-align:center; }
  .sunrise-listen .empty-icon{ font-size:40px; margin-bottom:14px; opacity:.5; }
  .sunrise-listen .empty-title{ font-size:19px; font-weight:800; color:var(--ink); margin:0 0 8px; }
  .sunrise-listen .empty-text{ font-size:14px; color:var(--ink-muted); font-weight:500; line-height:1.7; max-width:330px; margin:0 auto; }
  .sunrise-listen .empty-cta{ margin-top:22px; background:var(--tc); color:#fff; border:none; border-radius:100px; padding:13px 24px; font-family:inherit; font-size:13.5px; font-weight:800; cursor:pointer; transition:transform .2s, box-shadow .2s; }
  .sunrise-listen .empty-cta:hover{ transform:translateY(-2px); box-shadow:0 10px 26px rgba(244,129,63,.35); }

  .sunrise-listen .lr-modal-bg{ position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(59,54,99,.45); backdrop-filter:blur(4px); }
  .sunrise-listen .lr-modal{ background:#fff; border-radius:28px; padding:30px; width:100%; max-width:440px; box-shadow:0 30px 70px rgba(59,54,99,.25); }
  .sunrise-listen .lr-modal-title{ font-size:19px; font-weight:800; color:var(--ink); margin:0 0 8px; }
  .sunrise-listen .lr-modal-sub{ font-size:13.5px; font-weight:500; color:var(--ink-muted); line-height:1.6; margin:0 0 18px; }
  .sunrise-listen .lr-ta{ width:100%; font-family:inherit; font-size:14px; font-weight:500; color:var(--ink); background:var(--card); border:2px solid var(--line); border-radius:14px; padding:12px 14px; outline:none; resize:vertical; line-height:1.6; box-sizing:border-box; transition:border-color .2s, box-shadow .2s; }
  .sunrise-listen .lr-ta:focus{ border-color:var(--tc); box-shadow:0 0 0 4px rgba(244,129,63,.12); }
  .sunrise-listen .lr-ta.err{ border-color:#C74E3B; }
  .sunrise-listen .lr-err{ font-size:12.5px; font-weight:600; color:#C74E3B; margin-top:8px; }
  .sunrise-listen .lr-modal-actions{ display:flex; gap:8px; justify-content:flex-end; margin-top:20px; }
  .sunrise-listen .lr-btn-ghost{ background:var(--card); border:2px solid var(--line); color:var(--ink-soft); border-radius:100px; padding:11px 22px; font-family:inherit; font-size:13px; font-weight:700; cursor:pointer; }
  .sunrise-listen .lr-btn-ghost:hover{ border-color:var(--ink-muted); }
  .sunrise-listen .lr-btn-danger{ background:#C74E3B; color:#fff; border:none; border-radius:100px; padding:11px 22px; font-family:inherit; font-size:13px; font-weight:800; cursor:pointer; }
  .sunrise-listen .lr-btn-danger:disabled{ opacity:.6; cursor:default; }
  .sunrise-listen .lr-btn-dark{ margin-top:20px; background:var(--ink); color:#fff; border:none; border-radius:100px; padding:11px 26px; font-family:inherit; font-size:13px; font-weight:800; cursor:pointer; }
  .sunrise-listen .lr-btn-dark:hover{ background:var(--tc); }
  .sunrise-listen .lr-done{ text-align:center; padding:8px 0; }
  .sunrise-listen .lr-done-ico{ font-size:32px; margin-bottom:12px; }
  .sunrise-listen .lr-done h3{ font-size:19px; font-weight:800; color:var(--ink); margin:0 0 10px; }
  .sunrise-listen .lr-done p{ font-size:13.5px; font-weight:500; color:var(--ink-muted); line-height:1.65; margin:0; }

  .sunrise-listen .fade{ opacity:0; transform:translateY(16px); animation:sunFade .6s cubic-bezier(.2,.7,.2,1) forwards; }
  @keyframes sunFade{ to{ opacity:1; transform:none } }
  @media (prefers-reduced-motion:reduce){ .sunrise-listen .fade{ animation:none; opacity:1; transform:none } }
  @media (max-width:560px){ .sunrise-listen .wrap{ padding:36px 20px 90px; } }
`
