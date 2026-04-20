import { useState, useRef, useEffect } from 'react'
import CountUp from 'react-countup'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'
import { MdReportProblem } from 'react-icons/md'

const ISSUE_TYPES = [
  { value: 'bug',     label: 'Something is not working' },
  { value: 'content', label: 'I found a bug' },
  { value: 'account', label: 'UI looks wrong or broken' },
  { value: 'feature', label: 'I have a suggestion' },
  { value: 'other',   label: 'Something else' },
]

// ── Report Issue Drawer ───────────────────────────────────────────────────────
function ReportDrawer({ open, onClose }) {
  const [type,        setType]        = useState(ISSUE_TYPES[0].value)
  const [subject,     setSubject]     = useState(ISSUE_TYPES[0].label)
  const [description, setDescription] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [submitted,   setSubmitted]   = useState(false)

  function handleClose() {
    onClose()
    // Reset after close animation
    setTimeout(() => {
      setType(ISSUE_TYPES[0].value)
      setSubject(ISSUE_TYPES[0].label)
      setDescription('')
      setError('')
      setSubmitted(false)
    }, 300)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!subject.trim())     return setError('Please add a subject.')
    if (!description.trim()) return setError('Please describe the issue.')
    setLoading(true)
    try {
      const res  = await apiFetch('/api/report-issue', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type, subject: subject.trim(), description: description.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setSubmitted(true)
      } else {
        setError(json.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const BD = 'rgba(28,26,23,0.08)'

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 490,
          background: 'rgba(28,26,23,0.25)',
          backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 500,
        width: '100%', maxWidth: 440,
        background: 'var(--paper)',
        borderLeft: '0.5px solid rgba(28,26,23,0.1)',
        boxShadow: '-8px 0 40px rgba(28,26,23,0.12)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 16px',
          borderBottom: '0.5px solid rgba(28,26,23,0.07)',
          position: 'sticky', top: 0, background: 'var(--paper)', zIndex: 1,
        }}>
          <div>
            <div style={{ fontFamily: '"Lora", serif', fontSize: 17, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.3px' }}>
              Report an Issue
            </div>
            <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
              Every report helps us keep this a safe, quiet space.
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 30, height: 30, borderRadius: 8, border: '0.5px solid rgba(28,26,23,0.1)',
              background: 'rgba(28,26,23,0.04)', color: 'var(--ink-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, lineHeight: 1, flexShrink: 0, transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,26,23,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(28,26,23,0.04)'}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 22px', flex: 1 }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>💌</div>
              <div style={{ fontFamily: '"Lora", serif', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>
                Thank you for letting us know
              </div>
              <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 28 }}>
                Your report has been received. We'll look into it and get back to you if needed.
              </p>
              <button
                onClick={handleClose}
                style={{
                  padding: '10px 24px', borderRadius: 999,
                  background: 'var(--tc)', color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#D97040'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--tc)'}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Issue type pills */}
              <div>
                <div style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', marginBottom: 10 }}>
                  What's the issue about?
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {ISSUE_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => { setType(t.value); setSubject(t.label); setError('') }}
                      style={{
                        padding: '6px 13px', borderRadius: 999, fontSize: 12,
                        fontFamily: '"DM Sans", sans-serif', fontWeight: type === t.value ? 500 : 400,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: type === t.value ? 'var(--tc)' : 'var(--paper)',
                        color:      type === t.value ? '#fff' : 'var(--ink-soft)',
                        border:     type === t.value ? '1px solid var(--tc)' : `0.5px solid ${BD}`,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: 'block', fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', marginBottom: 8 }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => { setSubject(e.target.value); setError('') }}
                  placeholder="Brief summary of the issue"
                  maxLength={120}
                  style={{
                    width: '100%', padding: '10px 13px', borderRadius: 9,
                    border: `0.5px solid ${BD}`, background: '#fff',
                    fontSize: 13.5, fontFamily: '"DM Sans", sans-serif', color: 'var(--ink)',
                    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.35)'}
                  onBlur={e => e.target.style.borderColor = BD}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', marginBottom: 8 }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => { setDescription(e.target.value); setError('') }}
                  placeholder="Describe what happened, what you expected, and any steps to reproduce..."
                  rows={6}
                  maxLength={2000}
                  style={{
                    width: '100%', padding: '10px 13px', borderRadius: 9,
                    border: `0.5px solid ${BD}`, background: '#fff',
                    fontSize: 13.5, fontFamily: '"DM Sans", sans-serif', color: 'var(--ink)',
                    outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    lineHeight: 1.65, transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.35)'}
                  onBlur={e => e.target.style.borderColor = BD}
                />
                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>
                  {description.length}/2000
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: 'rgba(196,99,58,0.07)', border: '0.5px solid rgba(196,99,58,0.2)',
                  borderRadius: 9, padding: '10px 13px',
                  fontSize: 13, color: 'var(--tc)', fontFamily: '"DM Sans", sans-serif',
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '11px 26px', borderRadius: 999,
                  background: loading ? 'rgba(196,99,58,0.5)' : 'var(--tc)',
                  color: '#fff', border: 'none',
                  cursor: loading ? 'default' : 'pointer',
                  fontSize: 13.5, fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
                  alignSelf: 'flex-start', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#D97040' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--tc)' }}
              >
                {loading ? 'Sending…' : 'Send Report'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

const ROLE_COLOR = { seeker: 'var(--tc)', listener: 'var(--sage)', both: 'var(--purple)' }
const ROLE_LABEL = { seeker: 'Seeker', listener: 'Listener', both: 'Seeker + Listener' }

// ── Avatar dropdown ───────────────────────────────────────────────────────────
function AvatarMenu({ authUser, userRole, logout, navigate, onOpenReport }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initial = authUser?.name ? authUser.name[0].toUpperCase() : 'U'
  const rColor  = ROLE_COLOR[userRole] || 'var(--gold)'
  const rLabel  = ROLE_LABEL[userRole] || 'Both'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(196,99,58,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 500, color: 'var(--tc)',
          cursor: 'pointer', border: '0.5px solid rgba(196,99,58,0.2)',
          fontFamily: '"DM Sans", sans-serif', flexShrink: 0,
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = ''}
      >
        {initial}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 500,
          background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.09)',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(28,26,23,0.12)',
          minWidth: 182, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '0.5px solid rgba(28,26,23,0.07)' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 4, fontFamily: '"DM Sans", sans-serif' }}>
              {authUser?.name || 'You'}
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 9.5, padding: '2px 7px', borderRadius: 20,
              fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase',
              background: `${rColor}14`, color: rColor, border: `1px solid ${rColor}28`,
              fontFamily: '"DM Sans", sans-serif',
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: rColor }} />
              {rLabel}
            </span>
          </div>
          <button
            onClick={() => { setOpen(false); onOpenReport() }}
            style={{
              width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
              textAlign: 'left', cursor: 'pointer', fontSize: 13, color: 'var(--ink-muted)',
              fontFamily: '"DM Sans", sans-serif', transition: 'background 0.15s, color 0.15s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,99,58,0.05)'; e.currentTarget.style.color = 'var(--tc)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Report an Issue
          </button>
          <button
            onClick={() => { setOpen(false); logout() }}
            style={{
              width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
              textAlign: 'left', cursor: 'pointer', fontSize: 13, color: 'var(--ink-muted)',
              fontFamily: '"DM Sans", sans-serif', transition: 'background 0.15s, color 0.15s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,99,58,0.05)'; e.currentTarget.style.color = 'var(--tc)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

// ── Nav tab — full-height with bottom-border indicator (matches HTML reference) ─
function NavbarNotificationItem({ item, isLast, onClick }) {
  const [loading, setLoading] = useState(false)
  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    return d < 7 ? `${d}d ago` : new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }
  const ICON = { reply: '💬', claim: '💌', delivery: '📬', system: '⚙️', general: '🔔' }
  const clickable = !!(item.letterId || item.link)
  return (
    <div
      onClick={async () => {
        if (!clickable || loading) return
        setLoading(true)
        await onClick(item)
        setLoading(false)
      }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '11px 16px',
        background: !item.isRead ? 'rgba(196,99,58,0.04)' : 'transparent',
        borderBottom: isLast ? 'none' : '0.5px solid rgba(28,26,23,0.05)',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { if (clickable) e.currentTarget.style.background = 'rgba(28,26,23,0.04)' }}
      onMouseLeave={e => { e.currentTarget.style.background = !item.isRead ? 'rgba(196,99,58,0.04)' : 'transparent' }}
    >
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
        {loading ? '⏳' : (ICON[item.type] || ICON.general)}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink)', fontFamily: '"DM Sans", sans-serif', fontWeight: !item.isRead ? 500 : 400, lineHeight: 1.5 }}>{item.message}</p>
        <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
          {timeAgo(item.createdAt)}
          {clickable && <span style={{ marginLeft: 6, color: 'var(--tc)', opacity: 0.7 }}>· View letter →</span>}
        </p>
      </div>
      {!item.isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tc)', flexShrink: 0, marginTop: 5 }} />}
    </div>
  )
}

function NavTab({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '0 16px', height: 56, border: 'none', background: 'transparent',
        cursor: 'pointer', flexShrink: 0,
        fontSize: 13, fontFamily: '"DM Sans", sans-serif', fontWeight: active ? 500 : 400,
        color: active ? 'var(--ink)' : 'var(--ink-muted)',
        borderBottom: `2px solid ${active ? 'var(--tc)' : 'transparent'}`,
        transition: 'color 0.15s, border-color 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--ink)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--ink-muted)' }}
    >
      {item.label}
      {item.badge != null && item.badge > 0 && (
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 100, lineHeight: '1.4',
          background: active ? 'rgba(196,99,58,0.08)' : 'rgba(28,26,23,0.07)',
          color: active ? 'var(--tc)' : 'var(--ink-muted)', fontWeight: 500,
        }}>
          {item.badge}
        </span>
      )}
    </button>
  )
}

// ── Shared analytics data hook ────────────────────────────────────────────────
function useAnalyticsData() {
  const {
    navigate, canReadFeed,
    personalLetters, ownStrangerLetters, sentLetters, strangerLetters,
    analytics, analyticsDays, setAnalyticsDays, refreshAnalytics, analyticsRefreshing,
  } = useApp()

  const totalWritten = (personalLetters?.length || 0) + (ownStrangerLetters?.length || 0) + (sentLetters?.length || 0)
  const written   = analytics?.totalWritten   ?? totalWritten
  const sent      = analytics?.totalSent      ?? 0
  const opened    = analytics?.totalOpened    ?? 0
  const personal  = analytics?.totalPersonal  ?? 0
  const stranger  = analytics?.totalStranger  ?? 0
  const heard           = analytics?.claimedLetters  ?? 0
  const openRate        = analytics?.openRate        ?? 0
  const scheduled       = analytics?.totalScheduled  ?? 0
  const repliesReceived = analytics?.repliesReceived ?? 0
  const hasSent         = sent > 0
  const heardCount  = analytics?.heardLettersCount       ?? 0
  const repliedOut  = analytics?.repliesSentCount         ?? 0
  const convsClosed = analytics?.conversationsClosedCount ?? 0

  const heartline = (() => {
    if (opened > 0)  return 'Your words reached someone 💌'
    if (sent > 0)    return 'Your letters are on their way ✉️'
    if (written > 0) return 'Keep writing — every word matters 🌿'
    return 'Start writing. Someone is waiting 💛'
  })()

  return { navigate, canReadFeed, strangerLetters, analyticsDays, setAnalyticsDays, refreshAnalytics, analyticsRefreshing, written, sent, opened, personal, stranger, heard, openRate, scheduled, repliesReceived, hasSent, heartline, heardCount, repliedOut, convsClosed }
}

// ── Mobile-only compact analytics strip ──────────────────────────────────────
function MobileAnalyticsStrip() {
  const [expanded, setExpanded] = useState(false)
  const { written, sent, openRate, hasSent, heartline, navigate } = useAnalyticsData()

  return (
    <div className="md:hidden" style={{ borderBottom: '0.5px solid rgba(28,26,23,0.07)', background: 'rgba(247,242,234,0.6)' }}>
      {/* Collapsed bar — always visible on mobile */}
      <button
        onClick={() => setExpanded(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {heartline}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {written > 0 && (
            <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
              <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{written}</b> written
            </span>
          )}
          {hasSent && (
            <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
              <b style={{ color: openRate >= 50 ? 'var(--sage)' : 'var(--tc)', fontWeight: 600 }}>{openRate}%</b> opened
            </span>
          )}
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ color: 'var(--ink-muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Stat pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { value: written, label: 'Written', color: 'var(--tc)' },
              { value: sent,    label: 'Sent',    color: 'var(--gold)' },
            ].map(({ value, label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 5, background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.09)', borderRadius: 8, padding: '7px 12px' }}>
                <span style={{ fontFamily: '"Lora", serif', fontSize: 18, fontWeight: 500, color, lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>{label}</span>
              </div>
            ))}
            {hasSent && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, background: 'var(--paper)', border: `0.5px solid ${openRate >= 50 ? 'rgba(122,158,142,0.25)' : 'rgba(196,99,58,0.18)'}`, borderRadius: 8, padding: '7px 12px' }}>
                <span style={{ fontFamily: '"Lora", serif', fontSize: 18, fontWeight: 500, color: openRate >= 50 ? 'var(--sage)' : 'var(--tc)', lineHeight: 1 }}>{openRate}%</span>
                <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>Open rate</span>
              </div>
            )}
          </div>
          <button
            onClick={() => { setExpanded(false); navigate('myspace') }}
            style={{ alignSelf: 'flex-start', fontSize: 11, color: 'var(--tc)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', padding: 0, textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            View full activity →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Home-only sidebar ─────────────────────────────────────────────────────────
function HomeSidebar() {
  const { navigate, canReadFeed, strangerLetters, analyticsDays, setAnalyticsDays, refreshAnalytics, analyticsRefreshing, written, sent, opened, personal, stranger, heard, openRate, scheduled, repliesReceived, hasSent, heartline, heardCount, repliedOut, convsClosed } = useAnalyticsData()
  const { authUser, userRole, logout } = useApp()

  // Hide user card when viewport is narrow (includes zoom — innerWidth shrinks with CSS zoom)
  const [showUserCard, setShowUserCard] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    function handleResize() { setShowUserCard(window.innerWidth >= 768) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const MetricCard = ({ value, label, accent }) => (
    <div style={{
      background: 'var(--paper)',
      border: '0.5px solid rgba(28,26,23,0.08)',
      borderRadius: 12,
      padding: '13px 14px',
      position: 'relative',
      overflow: 'hidden',
      minWidth: 0,
    }}>
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: accent, borderRadius: '12px 12px 0 0',
        }} />
      )}
      <div style={{ fontFamily: '"Lora", serif', fontSize: 22, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.5px', lineHeight: 1 }}>
        <CountUp end={value} duration={1.2} separator="," enableScrollSpy scrollSpyOnce />
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 400, marginTop: 4, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.3, overflowWrap: 'break-word' }}>
        {label}
      </div>
    </div>
  )

  return (
    <aside
      className="md:sticky md:top-14 md:h-[calc(100vh-56px)] md:overflow-y-auto"
      style={{
        padding: '16px 16px 24px',
        background: 'rgba(247,242,234,0.4)',
        overflowX: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 14,
        borderBottom: '0.5px solid rgba(28,26,23,0.07)',
        borderRight: '0.5px solid rgba(28,26,23,0.07)',
      }}>

      {/* ── Emotional heartline ── */}
      <div style={{
        background: 'linear-gradient(120deg, rgba(196,99,58,0.06), rgba(122,158,142,0.06))',
        border: '0.5px solid rgba(196,99,58,0.12)',
        borderRadius: 12, padding: '12px 14px',
        overflowWrap: 'break-word',
      }}>
        <div style={{ fontSize: 12.5, fontFamily: '"Lora", serif', fontStyle: 'italic', color: 'var(--ink-soft)', lineHeight: 1.55 }}>
          {heartline}
        </div>
      </div>

      {/* ── Date filter ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: '1.8px', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
            Your story
          </div>
          <button
            onClick={() => refreshAnalytics()}
            disabled={analyticsRefreshing}
            title="Refresh analytics"
            style={{ background: 'none', border: 'none', cursor: analyticsRefreshing ? 'default' : 'pointer', padding: '1px 2px', display: 'flex', alignItems: 'center', color: 'var(--ink-muted)', opacity: analyticsRefreshing ? 0.5 : 1, transition: 'opacity 0.2s' }}
          >
            <svg
              width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: analyticsRefreshing ? 'spin 0.8s linear infinite' : 'none' }}
            >
              <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
        <select
          value={analyticsDays}
          onChange={e => setAnalyticsDays(Number(e.target.value))}
          style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
            background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.12)',
            color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif',
            outline: 'none', appearance: 'none', WebkitAppearance: 'none',
            maxWidth: '100%',
          }}
        >
          <option value={7}>Last 7 days</option>
          <option value={15}>Last 15 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* ── Overview cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2" style={{ gap: 7 }}>
        <MetricCard value={written}  label="Letters written"  accent="linear-gradient(90deg, var(--tc), var(--gold))" />
        <MetricCard value={sent}     label="Letters sent"     accent="linear-gradient(90deg, var(--gold), var(--tc))" />
        <MetricCard value={personal} label="To myself"        />
        <MetricCard value={stranger} label="To a stranger"    />
        {scheduled > 0 && (
          <MetricCard value={scheduled} label="Scheduled ⏳" accent="linear-gradient(90deg, var(--purple), var(--sage))" />
        )}
      </div>

      {/* ── Open rate — shown only when letters have been sent ── */}
      {hasSent && (
        <div style={{
          background: 'var(--paper)',
          border: `0.5px solid ${openRate >= 50 ? 'rgba(122,158,142,0.25)' : 'rgba(196,99,58,0.18)'}`,
          borderRadius: 12, padding: '14px 15px',
          minWidth: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', marginBottom: 4 }}>
                Open rate
              </div>
              <div style={{ fontFamily: '"Lora", serif', fontSize: 26, fontWeight: 500, letterSpacing: '-1px', color: openRate >= 50 ? 'var(--sage)' : 'var(--tc)', lineHeight: 1 }}>
                <CountUp end={openRate} duration={1.2} suffix="%" enableScrollSpy scrollSpyOnce />
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', textAlign: 'right', lineHeight: 1.5, paddingBottom: 2, flexShrink: 0 }}>
              <CountUp end={opened} duration={1.2} enableScrollSpy scrollSpyOnce /> of <CountUp end={sent} duration={1.2} enableScrollSpy scrollSpyOnce /><br />letters seen
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 5, background: 'rgba(28,26,23,0.07)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 100,
              width: `${Math.min(openRate, 100)}%`,
              background: openRate >= 50
                ? 'linear-gradient(90deg, var(--sage), #7ec8a4)'
                : 'linear-gradient(90deg, var(--tc), var(--gold))',
              transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
          {openRate >= 50 && (
            <div style={{ fontSize: 11, color: 'var(--sage)', marginTop: 8, fontFamily: '"DM Sans", sans-serif' }}>
              People are reading what you write 🌿
            </div>
          )}
        </div>
      )}

      {/* ── Connections Activity ── */}
      <div>
        <div style={{ fontSize: 10, letterSpacing: '1.8px', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', marginBottom: 8 }}>
          Connections Activity
        </div>

        {/* Your Sent Letters */}
        <div style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.08)', borderRadius: 12, padding: '13px 14px', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', fontFamily: '"DM Sans", sans-serif', marginBottom: 10 }}>
            📨 Your Sent Letters
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { label: 'Sent',             value: sent,             color: 'var(--ink)'    },
              { label: 'Opened',           value: opened,           color: 'var(--sage)'   },
              { label: 'Replies Received', value: repliesReceived,  color: 'var(--tc)'     },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>{label}</span>
                <span style={{ fontFamily: '"Lora", serif', fontSize: 14, fontWeight: 500, color, letterSpacing: '-0.3px' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Strangers You Heard — only visible to listeners */}
        {canReadFeed && (
          <div style={{ background: 'var(--paper)', border: '0.5px solid rgba(122,158,142,0.2)', borderRadius: 12, padding: '13px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', fontFamily: '"DM Sans", sans-serif', marginBottom: 10 }}>
              👂 Strangers You Heard
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { label: 'Heard',                 value: heardCount,  color: 'var(--purple)'   },
                { label: 'Replies Sent',           value: repliedOut,  color: 'var(--sage)'     },
                { label: 'Conversations Closed',   value: convsClosed, color: 'var(--ink-muted)'},
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>{label}</span>
                  <span style={{ fontFamily: '"Lora", serif', fontSize: 14, fontWeight: 500, color, letterSpacing: '-0.3px' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Connection card ── */}
      {(heard > 0 || canReadFeed) && (
        <div style={{
          background: 'var(--paper)',
          border: '0.5px solid rgba(122,158,142,0.2)',
          borderRadius: 12, padding: '13px 14px',
          minWidth: 0,
        }}>
          <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', marginBottom: 10 }}>
            Connection
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: '"Lora", serif', fontSize: 20, fontWeight: 500, color: 'var(--sage)', lineHeight: 1 }}><CountUp end={heard} duration={1.2} enableScrollSpy scrollSpyOnce /></div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.3, overflowWrap: 'break-word' }}>Strangers heard you</div>
            </div>
            {canReadFeed && (
              <div
                style={{ cursor: 'pointer', minWidth: 0 }}
                onClick={() => navigate('listenerread')}
              >
                <div style={{ fontFamily: '"Lora", serif', fontSize: 20, fontWeight: 500, color: 'var(--tc)', lineHeight: 1 }}><CountUp end={strangerLetters?.length || 0} duration={1.2} enableScrollSpy scrollSpyOnce /></div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.3, overflowWrap: 'break-word' }}>Waiting to be read</div>
              </div>
            )}
            {repliesReceived > 0 && (
              <div
                style={{ cursor: 'pointer', minWidth: 0 }}
                onClick={() => navigate('myspace', 'stranger')}
              >
                <div style={{ fontFamily: '"Lora", serif', fontSize: 20, fontWeight: 500, color: 'var(--purple)', lineHeight: 1 }}><CountUp end={repliesReceived} duration={1.2} enableScrollSpy scrollSpyOnce /></div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.3, overflowWrap: 'break-word' }}>Replies received</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── User card — hidden on md+ or when zoomed (avatar dropdown covers it) ── */}
      {!showUserCard && (
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <div style={{
          background: 'var(--paper)',
          border: '0.5px solid rgba(28,26,23,0.1)',
          borderRadius: 14,
          padding: '13px 14px',
          boxShadow: '0 2px 8px rgba(28,26,23,0.05)',
        }}>
          {/* Avatar + info row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--tc), #d97040)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: '"DM Sans", sans-serif',
              boxShadow: '0 2px 8px rgba(196,99,58,0.25)',
            }}>
              {authUser?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', fontFamily: '"DM Sans", sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {authUser?.name || 'You'}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                {authUser?.email || ''}
              </div>
              <span style={{
                display: 'inline-block', marginTop: 4,
                fontSize: 9.5, fontFamily: '"DM Sans", sans-serif', fontWeight: 600,
                letterSpacing: '0.4px', textTransform: 'uppercase',
                padding: '2px 7px', borderRadius: 20,
                background: `${ROLE_COLOR[userRole] || 'var(--gold)'}18`,
                color: ROLE_COLOR[userRole] || 'var(--gold)',
                border: `0.5px solid ${ROLE_COLOR[userRole] || 'var(--gold)'}30`,
              }}>
                {ROLE_LABEL[userRole] || 'Both'}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            style={{
              marginTop: 12, width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 12,
              fontFamily: '"DM Sans", sans-serif', fontWeight: 400,
              background: 'var(--cream)', border: '0.5px solid rgba(28,26,23,0.1)',
              color: 'var(--ink-muted)', cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,99,58,0.06)'; e.currentTarget.style.color = 'var(--tc)'; e.currentTarget.style.borderColor = 'rgba(196,99,58,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--cream)'; e.currentTarget.style.color = 'var(--ink-muted)'; e.currentTarget.style.borderColor = 'rgba(28,26,23,0.1)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </div>
      </div>
      )}

    </aside>
  )
}

// ── Mobile nav drawer ─────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose, navItems, currentPage, onNavigate, authUser, userRole, logout }) {
  const rColor  = ROLE_COLOR[userRole] || 'var(--gold)'
  const rLabel  = ROLE_LABEL[userRole] || 'Both'
  const initial = authUser?.name ? authUser.name[0].toUpperCase() : 'U'

  return (
    <>
      {open && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(28,26,23,0.25)', backdropFilter: 'blur(4px)' }} />
      )}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 210,
        width: 260, background: 'var(--paper)',
        borderRight: '0.5px solid rgba(28,26,23,0.08)',
        boxShadow: '8px 0 32px rgba(28,26,23,0.08)',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 18px 16px', borderBottom: '0.5px solid rgba(28,26,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <img src="/favicon.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} />
            <span style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 16, color: 'var(--ink)' }}>Letter from Heart</span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(28,26,23,0.05)', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 6, color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>×</button>
        </div>

        <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 12px', margin: '1px 0',
                background: currentPage === item.id ? 'rgba(196,99,58,0.06)' : 'transparent',
                border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                fontSize: 13.5, fontFamily: '"DM Sans", sans-serif',
                fontWeight: currentPage === item.id ? 500 : 400,
                color: currentPage === item.id ? 'var(--tc)' : 'rgba(28,26,23,0.6)',
                transition: 'all 0.15s', position: 'relative',
              }}
              onMouseEnter={e => { if (currentPage !== item.id) { e.currentTarget.style.background = 'rgba(28,26,23,0.03)'; e.currentTarget.style.color = 'var(--ink)' } }}
              onMouseLeave={e => { if (currentPage !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(28,26,23,0.6)' } }}
            >
              {currentPage === item.id && (
                <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 16, background: 'var(--tc)', borderRadius: '0 3px 3px 0' }} />
              )}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ background: 'rgba(28,26,23,0.07)', color: 'var(--ink-muted)', fontSize: 10, padding: '2px 7px', borderRadius: 100, fontWeight: 500 }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '10px 10px 16px', borderTop: '0.5px solid rgba(28,26,23,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, padding: '10px 11px', borderRadius: 10, background: 'rgba(28,26,23,0.025)', border: '0.5px solid rgba(28,26,23,0.06)' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(196,99,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--tc)', fontWeight: 500, fontFamily: '"DM Sans", sans-serif', flexShrink: 0, border: '0.5px solid rgba(196,99,58,0.2)' }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"DM Sans", sans-serif' }}>{authUser?.name}</div>
              <div style={{ fontSize: 9.5, color: rColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', marginTop: 1, fontFamily: '"DM Sans", sans-serif' }}>{rLabel}</div>
            </div>
          </div>
          <button
            onClick={() => { onClose(); logout() }}
            style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: '0.5px solid rgba(28,26,23,0.09)', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, color: 'rgba(28,26,23,0.5)', fontFamily: '"DM Sans", sans-serif', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,99,58,0.05)'; e.currentTarget.style.color = 'var(--tc)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(28,26,23,0.5)' }}
          >
            Log out
          </button>
        </div>
      </div>
    </>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const {
    navigate, currentPage, authUser, logout, userRole,
    strangerLetters, canReadFeed,
    notifications: rawNotifications, markNotificationsRead, refreshNotifications,
    openLetterPanel,
  } = useApp()
  const [bellRefreshing, setBellRefreshing] = useState(false)

  const notifications = rawNotifications ?? []
  const unreadCount   = notifications.filter(n => !n.isRead).length

  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [reportOpen,   setReportOpen]   = useState(false)
  const [bellOpen,     setBellOpen]     = useState(false)
  const bellRef = useRef(null)

  function toggleBell() {
    if (!bellOpen) {
      setBellOpen(true)
      if (unreadCount > 0 && typeof markNotificationsRead === 'function') markNotificationsRead()
    } else {
      setBellOpen(false)
    }
  }

  async function handleBellRefresh() {
    if (bellRefreshing) return
    setBellRefreshing(true)
    try { await refreshNotifications() } finally { setBellRefreshing(false) }
  }

  async function handleNotificationClick(notification) {
    const letterId = notification.letterId || notification.link?.split('/letters/')?.[1]
    if (!letterId) return
    setBellOpen(false)
    try {
      const res  = await apiFetch(`/api/letters/${letterId}`)
      const json = await res.json()
      if (json.success && json.data) {
        openLetterPanel(json.data)
      }
    } catch (err) {
      console.error('[Notification click] Failed to open letter:', err.message)
    }
  }

  useEffect(() => {
    if (!bellOpen) return
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [bellOpen])

  const navItems = [
    { id: 'home',        label: 'Home' },
    { id: 'myspace',     label: 'My Space' },
    ...(canReadFeed ? [{ id: 'listenerread', label: 'Listen', badge: strangerLetters?.length || 0 }] : []),
    { id: 'connections', label: 'Connections' },
  ]

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(247,242,234,0.96)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '0.5px solid rgba(28,26,23,0.07)',
        display: 'flex', alignItems: 'center',
        height: 56, padding: '0 clamp(16px, 3vw, 36px)', gap: 0,
      }}>

        {/* Hamburger — mobile only */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(28,26,23,0.45)', padding: '4px 10px 4px 0', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(28,26,23,0.45)'}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h10M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Logo — icon + Lora italic text */}
        <button
          onClick={() => navigate('home')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, flexShrink: 0,
            marginRight: 28,
          }}
        >
          <img src="/favicon.png" alt="Letter from Heart" style={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ fontFamily: '"Lora", serif', fontSize: 17, fontStyle: 'italic', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
            Letter from Heart
          </span>
        </button>

        {/* Nav tabs — desktop, full-height style */}
        <div className="hidden md:flex" style={{ flex: 1, height: 56, alignItems: 'stretch' }}>
          {navItems.map(item => (
            <NavTab
              key={item.id}
              item={item}
              active={currentPage === item.id}
              onClick={() => navigate(item.id)}
            />
          ))}
        </div>

        {/* Right: Bell + Write (primary) + Report (secondary) + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>

          {/* 🔔 Notification bell */}
          <div ref={bellRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={toggleBell}
              aria-label="Notifications"
              style={{
                position: 'relative',
                width: 34, height: 34,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer',
                background: bellOpen ? 'rgba(196,99,58,0.1)' : 'rgba(28,26,23,0.06)',
                color: bellOpen ? 'var(--tc)' : 'var(--ink)',
                transition: 'background 0.15s, color 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(28,26,23,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = bellOpen ? 'rgba(196,99,58,0.1)' : 'rgba(28,26,23,0.06)' }}
            >
              {/* Bell SVG */}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {/* Unread badge */}
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -1, right: -1,
                  minWidth: 16, height: 16,
                  background: 'var(--tc)', color: '#fff',
                  borderRadius: '50%',
                  fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px',
                  fontFamily: '"DM Sans", sans-serif',
                  pointerEvents: 'none',
                  lineHeight: 1,
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification panel */}
            {bellOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: 320, borderRadius: 14, overflow: 'hidden',
                background: 'var(--cream)',
                border: '0.5px solid rgba(28,26,23,0.1)',
                boxShadow: '0 12px 40px rgba(28,26,23,0.15)',
                zIndex: 400,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 10px 16px', borderBottom: '0.5px solid rgba(28,26,23,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', fontFamily: '"DM Sans", sans-serif' }}>Notifications</span>
                    {notifications.length > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
                        {unreadCount === 0 ? 'All caught up' : `${unreadCount} new`}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleBellRefresh}
                    disabled={bellRefreshing}
                    title="Refresh notifications"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(28,26,23,0.12)',
                      background: 'transparent', cursor: bellRefreshing ? 'default' : 'pointer',
                      fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif',
                      opacity: bellRefreshing ? 0.5 : 1, transition: 'background 0.12s, opacity 0.12s',
                    }}
                    onMouseEnter={e => { if (!bellRefreshing) e.currentTarget.style.background = 'rgba(28,26,23,0.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ display: 'inline-block', transition: 'transform 0.4s', transform: bellRefreshing ? 'rotate(360deg)' : 'none' }}>↻</span>
                    {bellRefreshing ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
                {/* List */}
                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: 28, opacity: 0.35, marginBottom: 8 }}>🔔</span>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>No notifications yet</p>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'Lora, serif', fontStyle: 'italic' }}>We'll let you know when something happens</p>
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <NavbarNotificationItem key={n._id} item={n} isLast={i === notifications.length - 1} onClick={handleNotificationClick} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('write')}
            className="hidden sm:block"
            style={{
              padding: '8px 18px', borderRadius: 100,
              background: currentPage === 'write' ? 'var(--tc)' : 'var(--ink)',
              color: 'var(--cream)', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', border: 'none',
              fontFamily: '"DM Sans", sans-serif', transition: 'all 0.2s',
              whiteSpace: 'nowrap', letterSpacing: '0.1px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--tc)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = currentPage === 'write' ? 'var(--tc)' : 'var(--ink)'; e.currentTarget.style.transform = '' }}
          >
            + Write
          </button>
          <button
            onClick={() => setReportOpen(true)}
            className="hidden md:flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-gray-300 bg-white hover:bg-gray-100 hover:border-gray-400 shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-gray-300"
            style={{ fontFamily: '"DM Sans", sans-serif', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            <MdReportProblem style={{ fontSize: 16, color: '#1C1A17', flexShrink: 0 }} />
            <span className="hidden sm:inline" style={{ fontSize: 12, color: '#1C1A17', fontWeight: 400 }}>Report</span>
          </button>
          <AvatarMenu authUser={authUser} userRole={userRole} logout={logout} navigate={navigate} onOpenReport={() => setReportOpen(true)} />
        </div>
      </nav>

      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navItems={navItems}
        currentPage={currentPage}
        onNavigate={navigate}
        authUser={authUser}
        userRole={userRole}
        logout={logout}
      />

      <ReportDrawer open={reportOpen} onClose={() => setReportOpen(false)} />

      {/* Floating Write button — mobile only, hidden when already on write page */}
      {currentPage !== 'write' && (
        <button
          className="sm:hidden"
          onClick={() => navigate('write')}
          style={{
            position: 'fixed', bottom: 22, right: 20, zIndex: 90,
            background: 'var(--tc)', color: '#fff',
            border: 'none', borderRadius: 999,
            padding: '11px 22px',
            fontSize: 13, fontWeight: 500, fontFamily: '"DM Sans", sans-serif',
            boxShadow: '0 6px 20px rgba(196,99,58,0.35)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(196,99,58,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 20px rgba(196,99,58,0.35)' }}
        >
          ✦ Write
        </button>
      )}
    </>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const { currentPage } = useApp()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <Navbar />
      {currentPage === 'home' ? (
        // Home: analytics sidebar always visible, stacks on mobile
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <HomeSidebar />
          <div style={{ minWidth: 0, overflowX: 'hidden' }}>
            {children}
          </div>
        </div>
      ) : (
        // All other pages: no sidebar, full-width (each page manages its own layout)
        <div style={{ width: '100%' }}>
          {children}
        </div>
      )}
    </div>
  )
}
