import { useState } from 'react'
import { useApp } from '../context/AppContext'

const ROLE_META = {
  seeker:   { label: 'Seeker',            color: 'var(--tc)',     bg: 'rgba(196,99,58,0.1)',   border: 'rgba(196,99,58,0.25)'   },
  listener: { label: 'Listener',          color: 'var(--sage)',   bg: 'rgba(122,158,142,0.1)', border: 'rgba(122,158,142,0.25)' },
  both:     { label: 'Seeker + Listener', color: 'var(--purple)', bg: 'rgba(139,126,200,0.1)', border: 'rgba(139,126,200,0.25)' },
}

export default function Navbar() {
  const { currentPage, navigate, authUser, logout, userRole } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)

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
              <button
                onClick={() => { logout(); setMobileOpen(false) }}
                className="flex items-center w-full px-4 py-[11px] rounded-[10px] text-[13px] font-sans text-left cursor-pointer border-none outline-none"
                style={{ color: 'var(--tc)' }}
              >
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
      <div
        className="absolute right-0 top-full mt-1 rounded-[10px] py-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 min-w-[150px]"
        style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.1)', boxShadow: '0 8px 24px rgba(28,26,23,0.1)' }}
      >
        <div className="px-3 py-2 text-[11px] text-ink-muted font-light" style={{ borderBottom: '0.5px solid rgba(28,26,23,0.07)' }}>
          {authUser?.email}
        </div>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-[12px] text-ink-soft hover:text-tc hover:bg-warm cursor-pointer bg-transparent border-none font-sans transition-all duration-150"
        >
          Log out
        </button>
      </div>
    </div>
  )
}

function HamburgerIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function XIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
