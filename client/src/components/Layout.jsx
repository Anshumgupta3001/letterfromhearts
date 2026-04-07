import { useState } from 'react'
import { useApp } from '../context/AppContext'

const ROLE_COLOR = { seeker: 'var(--tc)', listener: 'var(--sage)', both: 'var(--purple)' }
const ROLE_BG    = { seeker: 'rgba(196,99,58,0.12)', listener: 'rgba(122,158,142,0.12)', both: 'rgba(139,126,200,0.12)' }
const ROLE_LABEL = { seeker: 'Seeker', listener: 'Listener', both: 'Seeker + Listener' }

// ── Single nav item ───────────────────────────────────────────────────────────
function NavItem({ item, active, onClick }) {
  const [hov, setHov] = useState(false)
  const highlight = active || hov

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        width: '100%', padding: '10px 16px',
        margin: '1px 0',
        color: active ? 'var(--cream)' : hov ? 'rgba(245,240,232,0.85)' : 'rgba(245,240,232,0.52)',
        background: active
          ? 'rgba(245,240,232,0.08)'
          : hov ? 'rgba(245,240,232,0.04)' : 'transparent',
        border: 'none', cursor: 'pointer',
        fontSize: 13.5, fontFamily: '"DM Sans", sans-serif', fontWeight: active ? 500 : 400,
        borderRadius: 8, textAlign: 'left',
        transition: 'color 0.15s, background 0.15s',
        position: 'relative',
      }}
    >
      {active && (
        <span style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 22, background: 'var(--tc)',
          borderRadius: '0 3px 3px 0',
        }} />
      )}
      <span style={{
        fontSize: 14, width: 22, textAlign: 'center', flexShrink: 0,
        color: active ? 'var(--gold)' : 'inherit', lineHeight: 1,
      }}>
        {item.icon}
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span style={{
          background: 'var(--tc)', color: '#fff',
          fontSize: 10, padding: '2px 6px', borderRadius: 20, fontWeight: 600,
        }}>
          {item.badge}
        </span>
      )}
    </button>
  )
}

// ── Sidebar content (shared between desktop + mobile drawer) ──────────────────
function SidebarContent({ onNavigate }) {
  const {
    navigate, currentPage, authUser, logout, userRole,
    personalLetters, sentLetters, canReadFeed, canWriteStranger,
  } = useApp()

  function go(page) {
    navigate(page)
    onNavigate?.()
  }

  const initials = authUser?.name
    ? authUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const rColor = ROLE_COLOR[userRole] || 'var(--gold)'
  const rBg    = ROLE_BG[userRole]    || 'rgba(201,168,76,0.12)'
  const rLabel = ROLE_LABEL[userRole] || 'Both'

  const NAV_MAIN = [
    { id: 'home',    icon: '🏠', label: 'Home'     },
    { id: 'myspace', icon: '✦',  label: 'My Space', badge: personalLetters.length || null },
  ]

  const NAV_WRITE = [
    { id: 'write', icon: '✍️', label: 'Write a Letter' },
  ]

  const NAV_EXPLORE = [
    ...(canReadFeed      ? [{ id: 'listenerread',   icon: '🎧', label: 'Listener Read'   }] : []),
    ...(canWriteStranger ? [{ id: 'caringstranger', icon: '🌍', label: 'Caring Stranger' }] : []),
  ]

  const NAV_MORE = [
    { id: 'sentletters', icon: '📬', label: 'Sent Letters', badge: sentLetters.length || null },
    { id: 'connections', icon: '🔗', label: 'Connections'  },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '28px 20px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{
          width: 38, height: 38, background: 'var(--tc)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, marginBottom: 14,
        }}>
          ✉
        </div>
        <div style={{
          fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
          fontSize: 18.5, color: 'var(--cream)', letterSpacing: '0.3px', lineHeight: 1.2,
        }}>
          Letter from <span style={{ color: 'var(--gold)' }}>Heart</span>
        </div>
        <div style={{
          fontSize: 10, color: 'rgba(245,240,232,0.28)', marginTop: 5,
          letterSpacing: '1.8px', textTransform: 'uppercase',
        }}>
          Your quiet space
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '18px 8px 12px', overflowY: 'auto' }}>

        {/* Main group */}
        <div className="nav-group-label">Main</div>
        {NAV_MAIN.map(item => (
          <NavItem key={item.id} item={item} active={currentPage === item.id} onClick={() => go(item.id)} />
        ))}

        {/* Write group */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 8px' }} />
        <div className="nav-group-label">Create</div>
        {NAV_WRITE.map(item => (
          <NavItem key={item.id} item={item} active={currentPage === item.id} onClick={() => go(item.id)} />
        ))}

        {/* Explore group */}
        {NAV_EXPLORE.length > 0 && (
          <>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 8px' }} />
            <div className="nav-group-label">Explore</div>
            {NAV_EXPLORE.map(item => (
              <NavItem key={item.id} item={item} active={currentPage === item.id} onClick={() => go(item.id)} />
            ))}
          </>
        )}

        {/* More group */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 8px' }} />
        <div className="nav-group-label">More</div>
        {NAV_MORE.map(item => (
          <NavItem key={item.id} item={item} active={currentPage === item.id} onClick={() => go(item.id)} />
        ))}
      </nav>

      {/* ── User section ──────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        {/* Avatar + name + role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
          <div style={{
            width: 34, height: 34, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--tc) 0%, var(--gold) 100%)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Playfair Display", serif', fontSize: 13, color: '#fff', fontWeight: 600,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
              {authUser?.name || 'You'}
            </div>
            {/* Role badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 9.5, padding: '2px 7px', borderRadius: 20,
              fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
              background: rBg, color: rColor, marginTop: 3,
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: rColor, flexShrink: 0 }} />
              {rLabel}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '9px 12px',
            display: 'flex', alignItems: 'center', gap: 9,
            background: 'rgba(196,99,58,0.07)', border: '1px solid rgba(196,99,58,0.15)',
            borderRadius: 8, cursor: 'pointer',
            fontSize: 12.5, color: 'rgba(245,240,232,0.6)',
            fontFamily: '"DM Sans", sans-serif',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,99,58,0.15)'; e.currentTarget.style.color = 'var(--cream)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(196,99,58,0.07)'; e.currentTarget.style.color = 'rgba(245,240,232,0.6)' }}
        >
          <span style={{ fontSize: 14 }}>→</span>
          Log out
        </button>
      </div>
    </div>
  )
}

// ── App Sidebar (desktop fixed) ───────────────────────────────────────────────
function AppSidebar() {
  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 260, zIndex: 100,
      background: 'var(--ink)',
      backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 4px)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <SidebarContent />
    </aside>
  )
}

// ── Mobile hamburger + drawer ─────────────────────────────────────────────────
function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Top bar on mobile */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 52, zIndex: 150,
        background: 'var(--ink)', display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 14,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button
          onClick={() => setOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cream)', padding: 4, display: 'flex', alignItems: 'center' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: 16, color: 'var(--cream)' }}>
          Letter from <span style={{ color: 'var(--gold)' }}>Heart</span>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(28,26,23,0.5)', backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 210,
        width: 260, background: 'var(--ink)',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.32s cubic-bezier(0.16,1,0.3,1)',
        backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 4px)',
      }}>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </div>
    </>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile top bar + drawer */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      {/* Main content area */}
      <div
        className="md:ml-[260px]"
        style={{
          minHeight: '100vh',
          background: 'var(--cream)',
          paddingTop: 0,
        }}
      >
        {/* Mobile top padding so content clears the fixed bar */}
        <div className="md:hidden" style={{ height: 52 }} />
        {children}
      </div>
    </>
  )
}
