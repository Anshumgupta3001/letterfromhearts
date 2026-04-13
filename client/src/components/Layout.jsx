import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const ROLE_COLOR = { seeker: 'var(--tc)', listener: 'var(--sage)', both: 'var(--purple)' }
const ROLE_LABEL = { seeker: 'Seeker', listener: 'Listener', both: 'Seeker + Listener' }

// ── Avatar dropdown ───────────────────────────────────────────────────────────
function AvatarMenu({ authUser, userRole, logout, navigate }) {
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
            onClick={() => { setOpen(false); navigate('reportissue') }}
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
  const written  = analytics?.totalWritten  ?? totalWritten
  const sent     = analytics?.totalSent     ?? 0
  const opened   = analytics?.totalOpened   ?? 0
  const personal = analytics?.totalPersonal ?? 0
  const stranger = analytics?.totalStranger ?? 0
  const heard    = analytics?.claimedLetters ?? 0
  const openRate = analytics?.openRate ?? 0
  const hasSent  = sent > 0

  const heartline = (() => {
    if (opened > 0)  return 'Your words reached someone 💌'
    if (sent > 0)    return 'Your letters are on their way ✉️'
    if (written > 0) return 'Keep writing — every word matters 🌿'
    return 'Start writing. Someone is waiting 💛'
  })()

  return { navigate, canReadFeed, strangerLetters, analyticsDays, setAnalyticsDays, refreshAnalytics, analyticsRefreshing, written, sent, opened, personal, stranger, heard, openRate, hasSent, heartline }
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
  const { navigate, canReadFeed, strangerLetters, analyticsDays, setAnalyticsDays, refreshAnalytics, analyticsRefreshing, written, sent, opened, personal, stranger, heard, openRate, hasSent, heartline } = useAnalyticsData()
  const { authUser, userRole, logout } = useApp()

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
        {value}
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
                {openRate}%
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', textAlign: 'right', lineHeight: 1.5, paddingBottom: 2, flexShrink: 0 }}>
              {opened} of {sent}<br />letters seen
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
              <div style={{ fontFamily: '"Lora", serif', fontSize: 20, fontWeight: 500, color: 'var(--sage)', lineHeight: 1 }}>{heard}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.3, overflowWrap: 'break-word' }}>Strangers heard you</div>
            </div>
            {canReadFeed && (
              <div
                style={{ cursor: 'pointer', minWidth: 0 }}
                onClick={() => navigate('listenerread')}
              >
                <div style={{ fontFamily: '"Lora", serif', fontSize: 20, fontWeight: 500, color: 'var(--tc)', lineHeight: 1 }}>{strangerLetters?.length || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.3, overflowWrap: 'break-word' }}>Waiting to be read</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── User card (always visible at bottom) ── */}
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
          <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 16, color: 'var(--ink)' }}>
            Letter from Heart
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
  } = useApp()

  const [mobileOpen, setMobileOpen] = useState(false)

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

        {/* Logo — Lora italic, matching HTML reference */}
        <button
          onClick={() => navigate('home')}
          style={{
            fontFamily: '"Lora", serif', fontSize: 17, fontStyle: 'italic',
            color: 'var(--ink)', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, flexShrink: 0,
            marginRight: 28, whiteSpace: 'nowrap',
          }}
        >
          Letter from Heart
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

        {/* Right: Write (primary) + Report (secondary) + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
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
            onClick={() => navigate('reportissue')}
            className="hidden md:block"
            style={{
              padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 400,
              fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
              background: 'transparent', color: 'var(--ink-muted)',
              border: '0.5px solid rgba(28,26,23,0.18)', transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(28,26,23,0.04)'; e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.borderColor = 'rgba(28,26,23,0.28)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)'; e.currentTarget.style.borderColor = 'rgba(28,26,23,0.18)' }}
          >
            Report
          </button>
          <AvatarMenu authUser={authUser} userRole={userRole} logout={logout} navigate={navigate} />
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
