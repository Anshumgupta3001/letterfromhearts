import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const ROLE_META = {
  seeker:   { label: 'Seeker',            color: 'var(--tc)',     bg: 'rgba(196,99,58,0.1)',   border: 'rgba(196,99,58,0.25)'   },
  listener: { label: 'Listener',          color: 'var(--sage)',   bg: 'rgba(122,158,142,0.1)', border: 'rgba(122,158,142,0.25)' },
  both:     { label: 'Seeker + Listener', color: 'var(--purple)', bg: 'rgba(139,126,200,0.1)', border: 'rgba(139,126,200,0.25)' },
}

export default function Navbar() {
  const { currentPage, navigate, authUser, logout, userRole, notifications: rawNotifications, markNotificationsRead } = useApp()
  const notifications = rawNotifications ?? []

  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [bellOpen,     setBellOpen]     = useState(false)
  const bellRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.isRead).length

  function toggleBell() {
    if (!bellOpen) {
      setBellOpen(true)
      if (unreadCount > 0 && typeof markNotificationsRead === 'function') markNotificationsRead()
    } else {
      setBellOpen(false)
    }
  }

  // Close panel on outside click
  useEffect(() => {
    if (!bellOpen) return
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [bellOpen])

  const PRIMARY_TABS = [
    { id: 'home',    label: 'Home'     },
    { id: 'myspace', label: 'My Space' },
  ]

  const MOBILE_TABS = [
    { id: 'home',           label: 'Home'            },
    { id: 'myspace',        label: 'My Space'        },
    { id: 'write',          label: 'Write a letter'  },
    { id: 'caringstranger', label: 'Caring Stranger' },
    { id: 'listenerread',   label: 'Listener Read'   },
    { id: 'sentletters',    label: 'Sent Letters'    },
    { id: 'connections',    label: 'Connections'     },
  ]

  const roleMeta = ROLE_META[userRole] || ROLE_META.both

  const initials = authUser?.name
    ? authUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  function go(page) { navigate(page); setMobileOpen(false) }

  return (
    <>
      <nav
        className="sticky top-0 z-[200] h-14"
        style={{ background: 'rgba(247,242,234,0.97)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid rgba(28,26,23,0.08)' }}
      >
        <div className="h-full flex items-center justify-between px-5 gap-3">

          {/* ── Logo ─────────────────────────────────────────────────── */}
          <div
            className="font-playfair text-[17px] italic text-ink whitespace-nowrap cursor-pointer flex-shrink-0"
            style={{ fontStyle: 'italic' }}
            onClick={() => go('home')}
          >
            Letter from <span style={{ color: 'var(--gold)' }}>Heart</span>
          </div>

          {/* ── Center tabs (desktop) ─────────────────────────────────── */}
          <div className="hidden md:flex items-center h-full flex-1 min-w-0 mx-2">
            {PRIMARY_TABS.map(tab => {
              const isActive = currentPage === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => go(tab.id)}
                  className="relative flex-shrink-0 flex items-center h-full px-4 text-[13px] font-sans outline-none border-0 bg-transparent cursor-pointer whitespace-nowrap border-b-2 select-none"
                  style={{
                    color: isActive ? 'var(--ink)' : 'var(--ink-muted)',
                    borderBottomColor: isActive ? 'var(--tc)' : 'transparent',
                    transition: 'color 0.2s ease, border-color 0.2s ease',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--ink-soft)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--ink-muted)' }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* ── Right actions ─────────────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Connections (desktop) */}
            <button
              onClick={() => go('connections')}
              className="hidden md:flex items-center h-full px-4 text-[13px] font-sans outline-none border-0 bg-transparent cursor-pointer whitespace-nowrap"
              style={{ color: currentPage === 'connections' ? 'var(--ink)' : 'var(--ink-muted)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink-soft)'}
              onMouseLeave={e => e.currentTarget.style.color = currentPage === 'connections' ? 'var(--ink)' : 'var(--ink-muted)'}
            >
              Connections
            </button>

            {/* Role badge */}
            <span
              className="hidden md:inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-pill font-semibold uppercase tracking-[0.8px] flex-shrink-0"
              style={{ background: roleMeta.bg, color: roleMeta.color, border: `0.5px solid ${roleMeta.border}` }}
            >
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: roleMeta.color }} />
              {roleMeta.label}
            </span>

            {/* Notification bell */}
            <div ref={bellRef} className="relative flex-shrink-0">
              <button
                onClick={toggleBell}
                className="relative flex items-center justify-center w-8 h-8 rounded-full cursor-pointer border-none transition-all duration-150"
                style={{
                  color:      bellOpen ? 'var(--tc)'  : 'var(--ink)',
                  background: bellOpen ? 'rgba(196,99,58,0.08)' : 'rgba(28,26,23,0.06)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(28,26,23,0.1)'; e.currentTarget.style.color = 'var(--ink)' }}
                onMouseLeave={e => { e.currentTarget.style.background = bellOpen ? 'rgba(196,99,58,0.08)' : 'rgba(28,26,23,0.06)'; e.currentTarget.style.color = bellOpen ? 'var(--tc)' : 'var(--ink)' }}
                aria-label="Notifications"
              >
                <BellIcon />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold rounded-full px-1 leading-none pointer-events-none"
                    style={{ background: 'var(--tc)', color: '#fff', fontFamily: '"DM Sans", sans-serif' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification panel */}
              {bellOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-[320px] rounded-[14px] overflow-hidden animate-fade-up z-[300]"
                  style={{ background: 'var(--cream)', border: '0.5px solid rgba(28,26,23,0.1)', boxShadow: '0 12px 40px rgba(28,26,23,0.15)' }}
                >
                  {/* Panel header */}
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '0.5px solid rgba(28,26,23,0.07)' }}>
                    <span className="text-[13px] font-semibold text-ink font-sans">Notifications</span>
                    {notifications.length > 0 && (
                      <span className="text-[10px] text-ink-muted font-sans">{notifications.filter(n => !n.isRead).length === 0 ? 'All caught up' : `${unreadCount} new`}</span>
                    )}
                  </div>

                  {/* Notification list */}
                  <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <span className="text-[28px] mb-2 opacity-40">🔔</span>
                        <p className="text-[12px] text-ink-muted font-sans">No notifications yet</p>
                        <p className="text-[11px] text-ink-muted font-sans mt-0.5" style={{ fontFamily: 'Lora, serif', fontStyle: 'italic' }}>
                          We'll let you know when something happens
                        </p>
                      </div>
                    ) : (
                      notifications.map((n, i) => (
                        <NotificationItem
                          key={n._id}
                          item={n}
                          isLast={i === notifications.length - 1}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Write button (desktop) */}
            <button
              onClick={() => go('write')}
              className="hidden md:flex items-center gap-1.5 flex-shrink-0 border-none cursor-pointer transition-all duration-200"
              style={{
                background: currentPage === 'write' ? 'var(--tc)' : 'var(--ink)',
                color: '#fff',
                padding: '7px 15px',
                borderRadius: 100,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.1px',
                boxShadow: '0 2px 10px rgba(28,18,8,0.18)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--tc)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(196,99,58,0.28)' }}
              onMouseLeave={e => { e.currentTarget.style.background = currentPage === 'write' ? 'var(--tc)' : 'var(--ink)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(28,18,8,0.18)' }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Write
            </button>

            {/* Avatar + dropdown */}
            <AvatarMenu authUser={authUser} initials={initials} logout={logout} />

            {/* Hamburger (mobile) */}
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-[8px] cursor-pointer border-none bg-transparent"
              style={{ color: 'var(--ink)' }}
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <XIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-[190]" style={{ background: 'rgba(28,26,23,0.25)', backdropFilter: 'blur(2px)' }} onClick={() => setMobileOpen(false)} />
          <div className="fixed top-14 left-0 right-0 z-[195] animate-fade-up" style={{ background: 'var(--cream)', borderBottom: '0.5px solid rgba(28,26,23,0.1)', boxShadow: '0 8px 32px rgba(28,26,23,0.12)' }}>
            <div className="px-5 py-4 flex flex-col gap-1">
              {/* Role badge mobile */}
              <div className="flex items-center gap-2 px-4 py-2 mb-1">
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: roleMeta.color }} />
                <span className="text-[10px] font-semibold uppercase tracking-[1px]" style={{ color: roleMeta.color }}>{roleMeta.label}</span>
              </div>
              {MOBILE_TABS.map(tab => {
                const isActive = currentPage === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => go(tab.id)}
                    className="flex items-center justify-between w-full px-4 py-[11px] rounded-[10px] text-[13px] font-sans text-left cursor-pointer border-none outline-none transition-all duration-150"
                    style={{ background: isActive ? 'rgba(196,99,58,0.07)' : 'transparent', color: isActive ? 'var(--tc)' : 'var(--ink-soft)' }}
                  >
                    <span>{tab.label}</span>
                    {isActive && <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: 'var(--tc)' }} />}
                  </button>
                )
              })}
              <div className="h-px my-2" style={{ background: 'rgba(28,26,23,0.08)' }} />
              {/* User identity */}
              <div className="px-4 py-3 rounded-[10px] mb-1" style={{ background: 'rgba(28,26,23,0.03)', border: '0.5px solid rgba(28,26,23,0.07)' }}>
                <div className="text-[13px] font-semibold text-ink leading-tight">{authUser?.name || 'User'}</div>
                <div className="text-[11px] text-ink-muted mt-0.5 font-light truncate">{authUser?.email}</div>
                <div className="text-[10px] mt-1.5 font-semibold uppercase tracking-wide" style={{ color: roleMeta.color }}>{roleMeta.label}</div>
              </div>
              <button
                onClick={() => { logout(); setMobileOpen(false) }}
                className="flex items-center gap-2 w-full px-4 py-[11px] rounded-[10px] text-[13px] font-sans text-left cursor-pointer border-none outline-none"
                style={{ color: 'var(--tc)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ── Avatar + dropdown ─────────────────────────────────────────────────────────
function AvatarMenu({ authUser, initials, logout }) {
  const roleMeta = ROLE_META[authUser?.role] || ROLE_META.both
  return (
    <div className="relative group flex-shrink-0">
      <div className="flex items-center gap-1.5 cursor-pointer rounded-full px-1.5 py-1 transition-all duration-200 hover:bg-warm">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium flex-shrink-0"
          style={{ background: 'rgba(196,99,58,0.15)', color: 'var(--tc)', border: '0.5px solid rgba(196,99,58,0.2)' }}
        >
          {initials}
        </div>
        <span className="text-[12px] text-ink-soft font-medium max-w-[70px] truncate hidden lg:block">
          {authUser?.name?.split(' ')[0] || ''}
        </span>
      </div>
      {/* Dropdown */}
      <div
        className="absolute right-0 top-full mt-1.5 rounded-[12px] invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50"
        style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.1)', boxShadow: '0 8px 28px rgba(28,26,23,0.13)', minWidth: 210 }}
      >
        {/* Identity block */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '0.5px solid rgba(28,26,23,0.07)' }}>
          <div className="flex items-center gap-3 mb-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0"
              style={{ background: 'rgba(196,99,58,0.15)', color: 'var(--tc)', border: '1px solid rgba(196,99,58,0.2)' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-ink truncate leading-tight">
                {authUser?.name || 'User'}
              </div>
              <div className="text-[11px] text-ink-muted truncate leading-tight mt-0.5 font-light">
                {authUser?.email}
              </div>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-[9.5px] px-2 py-0.5 rounded-pill font-semibold uppercase tracking-[0.8px]"
            style={{ background: roleMeta.bg, color: roleMeta.color, border: `0.5px solid ${roleMeta.border}` }}
          >
            <span className="w-[4px] h-[4px] rounded-full" style={{ background: roleMeta.color }} />
            {roleMeta.label}
          </span>
        </div>
        {/* Actions */}
        <div className="py-1">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2.5 text-[12.5px] font-sans cursor-pointer bg-transparent border-none transition-all duration-150 flex items-center gap-2"
            style={{ color: 'var(--tc)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,99,58,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Notification item ─────────────────────────────────────────────────────────
function NotificationItem({ item, isLast }) {
  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    if (d < 7)  return `${d}d ago`
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const TYPE_ICON = {
    reply:    '💬',
    claim:    '💌',
    delivery: '📬',
    system:   '⚙️',
    general:  '🔔',
  }

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 transition-colors duration-150"
      style={{
        background: !item.isRead ? 'rgba(196,99,58,0.04)' : 'transparent',
        borderBottom: isLast ? 'none' : '0.5px solid rgba(28,26,23,0.05)',
      }}
    >
      {/* Type icon */}
      <span className="text-[15px] mt-0.5 flex-shrink-0 leading-none">
        {TYPE_ICON[item.type] || TYPE_ICON.general}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] text-ink leading-[1.55] font-sans m-0" style={{ fontWeight: !item.isRead ? 500 : 400 }}>
          {item.message}
        </p>
        <p className="text-[10px] text-ink-muted mt-0.5 m-0 font-sans">{timeAgo(item.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!item.isRead && (
        <span className="w-[6px] h-[6px] rounded-full flex-shrink-0 mt-1.5" style={{ background: 'var(--tc)' }} />
      )}
    </div>
  )
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function HamburgerIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function XIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
