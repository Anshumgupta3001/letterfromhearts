import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const ROLE_COLOR = { seeker: 'var(--tc)', listener: 'var(--sage)', both: 'var(--purple)' }
const ROLE_LABEL = { seeker: 'Seeker', listener: 'Listener', both: 'Seeker + Listener' }

// ── Avatar dropdown ───────────────────────────────────────────────────────────
function AvatarMenu({ authUser, userRole, logout }) {
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

// ── Home-only sidebar ─────────────────────────────────────────────────────────
function HomeSidebar() {
  const {
    navigate, userRole, canReadFeed,
    personalLetters, ownStrangerLetters, sentLetters, strangerLetters,
  } = useApp()

  const [role, setRole] = useState(userRole === 'listener' ? 'listener' : 'seeker')
  const totalWritten = (personalLetters?.length || 0) + (ownStrangerLetters?.length || 0) + (sentLetters?.length || 0)

  const SibLabel = ({ text }) => (
    <div style={{ fontSize: 10, letterSpacing: '1.8px', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 8, fontFamily: '"DM Sans", sans-serif' }}>
      {text}
    </div>
  )

  const SibItem = ({ icon, label, count, hot, onClick }) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 11px', borderRadius: 8,
        cursor: onClick ? 'pointer' : 'default',
        background: 'transparent',
        border: '0.5px solid transparent',
        marginBottom: 2, transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.background = 'var(--warm)'; e.currentTarget.style.borderColor = 'rgba(28,26,23,0.06)' } }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-soft)', fontFamily: '"DM Sans", sans-serif' }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
        {label}
      </div>
      {count != null && (
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 100,
          background: hot ? 'rgba(196,99,58,0.08)' : 'rgba(28,26,23,0.05)',
          color: hot ? 'var(--tc)' : 'var(--ink-muted)',
          fontWeight: hot ? 500 : 400, fontFamily: '"DM Sans", sans-serif',
        }}>
          {count}
        </span>
      )}
    </div>
  )

  const StatBox = ({ n, label }) => (
    <div style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.07)', borderRadius: 10, padding: '12px 13px' }}>
      <div style={{ fontFamily: '"Lora", serif', fontSize: 22, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.5px', lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 300, marginTop: 3, fontFamily: '"DM Sans", sans-serif', lineHeight: 1.3 }}>{label}</div>
    </div>
  )

  return (
    <aside style={{
      borderRight: '0.5px solid rgba(28,26,23,0.07)',
      padding: '24px 16px',
      background: 'rgba(247,242,234,0.4)',
      position: 'sticky', top: 56,
      height: 'calc(100vh - 56px)',
      overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>

      {/* Role toggle */}
      <div>
        <SibLabel text="Your mode" />
        <div style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.08)', borderRadius: 10, padding: 5, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {[
            { id: 'seeker',   label: 'Seeker',   sub: `${(personalLetters?.length || 0) + (ownStrangerLetters?.length || 0)} letters`, color: 'var(--tc)',   shadow: 'rgba(196,99,58,0.25)' },
            { id: 'listener', label: 'Listener', sub: '0 replies',                                                                      color: 'var(--sage)', shadow: 'rgba(122,158,142,0.25)' },
          ].map(r => (
            <div
              key={r.id}
              onClick={() => setRole(r.id)}
              style={{
                padding: '9px 6px', borderRadius: 7, cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.2s',
                background: role === r.id ? r.color : 'transparent',
                boxShadow: role === r.id ? `0 2px 8px ${r.shadow}` : 'none',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 500, fontFamily: '"DM Sans", sans-serif', color: role === r.id ? '#fff' : 'var(--ink-muted)' }}>{r.label}</div>
              <div style={{ fontSize: 10, fontFamily: '"DM Sans", sans-serif', color: role === r.id ? 'rgba(255,255,255,0.8)' : 'var(--ink-muted)', marginTop: 1 }}>{r.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* As seeker */}
      <div>
        <SibLabel text="As seeker" />
        <SibItem icon="📝" label="All my letters"   count={(personalLetters?.length || 0) + (ownStrangerLetters?.length || 0)} onClick={() => navigate('myspace')} />
        <SibItem icon="💬" label="Replies received" count={0}  hot={false} />
        <SibItem icon="⏳" label="Waiting"          count={ownStrangerLetters?.length || 0} />
        <SibItem icon="🔒" label="Capsules"         count={0} />
      </div>

      {/* As listener */}
      {canReadFeed && (
        <div>
          <SibLabel text="As listener" />
          <SibItem icon="📬" label="Open letters"   count={strangerLetters?.length || 0} onClick={() => navigate('listenerread')} />
          <SibItem icon="✍️" label="My replies"     count={0} onClick={() => navigate('myreplies')} />
          <SibItem icon="↩️" label="They wrote back" count={0} hot={false} />
        </div>
      )}

      {/* This week stats */}
      <div>
        <SibLabel text="This week" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <StatBox n={totalWritten} label="Written" />
          <StatBox n={0} label="Heard" />
          <StatBox n={0} label="Replied" />
          <StatBox n={0} label="Wrote back" />
        </div>
      </div>

      {/* Wellbeing */}
      {canReadFeed && (
        <div style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.08)', borderRadius: 10, padding: '13px 15px' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 7, fontFamily: '"DM Sans", sans-serif' }}>🤝 Listener cap</div>
          <div style={{ height: 4, background: 'rgba(28,26,23,0.07)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', background: 'var(--sage)', borderRadius: 2, width: '0%' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 300, lineHeight: 1.5, fontFamily: '"DM Sans", sans-serif' }}>
            0 of 5 replies this week. Rest when you need to.
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

        {/* Right: Write button + avatar */}
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
          <AvatarMenu authUser={authUser} userRole={userRole} logout={logout} />
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
        // Home: dashboard layout with sidebar
        <div className="md:grid md:grid-cols-[220px_1fr]" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <div className="hidden md:block">
            <HomeSidebar />
          </div>
          <div style={{ minWidth: 0 }}>
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
