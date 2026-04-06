import { useState } from 'react'
import { useApp } from '../context/AppContext'

const BD = '#E0D4BC'
const FT = '#F2EBE0'

// ── Letter card (personal) ────────────────────────────────────────────────────
function LetterCard({ letter, onClick }) {
  const [hov, setHov] = useState(false)
  const date = new Date(letter.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 14, border: `1px solid ${BD}`,
        overflow: 'hidden', position: 'relative', cursor: 'pointer',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? '0 14px 40px rgba(26,18,8,0.09)' : 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, var(--tc), var(--gold))', borderRadius: '4px 0 0 4px' }} />
      <div style={{ padding: '20px 20px 16px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
            {letter.subject}
          </h3>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', background: '#fdf0ee', color: 'var(--tc)', flexShrink: 0, border: '1px solid #f5d4ce' }}>
            ✦ Personal
          </span>
        </div>
        <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {letter.message}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 20px 8px 26px', borderTop: `1px solid ${FT}`, background: 'rgba(245,240,232,0.4)', fontSize: 11, color: 'var(--ink-muted)' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        {date}
      </div>
    </div>
  )
}

// ── World letter card (stranger) ──────────────────────────────────────────────
function WorldLetter({ letter, onClick, isNew }) {
  const [hov, setHov] = useState(false)
  const date = new Date(letter.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 14, border: `1px solid ${BD}`,
        overflow: 'hidden', position: 'relative', cursor: 'pointer',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? '0 14px 40px rgba(26,18,8,0.09)' : 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, var(--sage), var(--gold))', borderRadius: '4px 0 0 4px' }} />
      <div style={{ padding: '20px 20px 16px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>
            {letter.subject}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', background: 'rgba(122,158,142,0.1)', color: 'var(--sage)', border: '1px solid rgba(122,158,142,0.25)' }}>🔒 Anon</span>
            {isNew && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: 'rgba(122,158,142,0.08)', color: 'var(--sage)' }}>● New</span>}
          </div>
        </div>
        <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {letter.message}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 20px 8px 26px', borderTop: `1px solid ${FT}`, background: 'rgba(245,240,232,0.4)', fontSize: 11, color: 'var(--ink-muted)' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        {date}
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ stat, index, total, navigate }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={() => navigate(stat.page)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, padding: '20px 24px', cursor: 'pointer',
        border: `1px solid ${BD}`,
        borderRight: index < total - 1 ? 'none' : `1px solid ${BD}`,
        background: hov ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)',
        borderRadius: index === 0 ? '12px 0 0 12px' : index === total - 1 ? '0 12px 12px 0' : 0,
        transition: 'background 0.2s',
      }}
    >
      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 34, fontWeight: 700, lineHeight: 1, marginBottom: 5, color: stat.color }}>
        {stat.n}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-muted)', letterSpacing: '0.5px' }}>{stat.label}</div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, seeAll, onSeeAll }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
      <div>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>{title}</h2>
        {subtitle && <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)' }}>{subtitle}</p>}
      </div>
      {seeAll && (
        <button onClick={onSeeAll} style={{ fontSize: 13, color: 'var(--tc)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', fontWeight: 500, letterSpacing: '0.3px' }}>
          see all →
        </button>
      )}
    </div>
  )
}

// ── Empty section ─────────────────────────────────────────────────────────────
function EmptySection({ icon, text, cta, onCta }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: '36px 28px', textAlign: 'center', border: `1.5px dashed ${BD}` }}>
      <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>{icon}</div>
      <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: cta ? 16 : 0 }}>{text}</p>
      {cta && (
        <button onClick={onCta} style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: 'var(--tc)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(196,99,58,0.3)', paddingBottom: 2 }}>{cta}</button>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const {
    navigate, authUser, userRole,
    personalLetters, strangerLetters, sentLetters,
    canWriteStranger, canReadFeed, openLetterPanel,
  } = useApp()

  const firstName    = authUser?.name?.split(' ')[0] || 'there'
  const hour         = new Date().getHours()
  const greetingWord = hour < 5 ? 'Still Awake' : hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  const [ctaHov, setCtaHov] = useState(false)
  const [ctaBtnHov, setCtaBtnHov] = useState(false)

  // Seeker: personal + write CTA + connections
  // Listener: personal + stranger (unread) feed
  // Both: personal + stranger (others only) + connections

  const recentPersonal = personalLetters.slice(0, 4)
  const recentStranger = strangerLetters.filter(l => !l.hasRead).slice(0, 3)

  // Stats depend on role
  const stats = [
    { n: personalLetters.length, label: 'personal letters', color: 'var(--tc)',   page: 'myspace'      },
    ...(canReadFeed ? [{ n: strangerLetters.length, label: 'from the world',   color: 'var(--sage)',  page: 'listenerread'  }] : []),
    { n: sentLetters.length,     label: 'letters sent',     color: 'var(--gold)', page: 'sentletters'  },
  ]

  return (
    <main className="page-enter" style={{ position: 'relative' }}>
      {/* Subtle grain */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E\")", pointerEvents: 'none', zIndex: 0, opacity: 0.6 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(32px, 5vw, 52px) clamp(24px, 5vw, 60px)' }}>

        {/* ── Greeting ──────────────────────────────────────────────── */}
        <div className="animate-fade-up" style={{ fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          {greetingWord}
          <span style={{ flex: 1, height: 1, background: BD, maxWidth: 60 }} />
        </div>

        <h1
          className="animate-fade-up"
          style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(32px, 5vw, 46px)', fontWeight: 700, lineHeight: 1.15, color: 'var(--ink)', marginBottom: 16, letterSpacing: '-0.5px', animationDelay: '0.08s' }}
        >
          <em style={{ color: 'var(--tc)', fontStyle: 'italic' }}>{firstName},</em> what would<br />
          you like to <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>express</em> today?
        </h1>

        <p className="animate-fade-up font-lora" style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', lineHeight: 1.7, maxWidth: 440, marginBottom: 40, animationDelay: '0.15s' }}>
          This is your quiet space. No pressure. No audience.<br />Just words, when you're ready.
        </p>

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <div className="animate-fade-up" style={{ display: 'flex', marginBottom: 48, animationDelay: '0.22s' }}>
          {stats.map((s, i) => (
            <StatCard key={s.label} stat={s} index={i} total={stats.length} navigate={navigate} />
          ))}
        </div>

        {/* ── Compose CTA (seeker / both only) ──────────────────────── */}
        {canWriteStranger && (
          <div
            className="animate-fade-up"
            onMouseEnter={() => setCtaHov(true)}
            onMouseLeave={() => setCtaHov(false)}
            onClick={() => navigate('write')}
            style={{
              marginBottom: 48, animationDelay: '0.28s',
              background: 'var(--ink)', borderRadius: 14, padding: '32px 36px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
              cursor: 'pointer', overflow: 'hidden', position: 'relative',
              transform: ctaHov ? 'scale(1.005)' : 'scale(1)', transition: 'transform 0.2s',
            }}
          >
            <span style={{ position: 'absolute', right: 100, top: 16, fontSize: 10, color: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }}>✦</span>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Begin Writing</div>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 24, color: 'var(--cream)', fontWeight: 700, lineHeight: 1.25 }}>
                Pour your heart<br />into a <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>new letter</em>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.5)', marginTop: 6, lineHeight: 1.6 }}>Unsent letters heal too. Start whenever you feel it.</div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); navigate('write') }}
              onMouseEnter={() => setCtaBtnHov(true)}
              onMouseLeave={() => setCtaBtnHov(false)}
              style={{ background: ctaBtnHov ? '#D97040' : 'var(--tc)', color: '#fff', border: 'none', borderRadius: 8, padding: '13px 24px', fontSize: 13, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0, transform: ctaBtnHov ? 'scale(1.03)' : 'scale(1)', transition: 'background 0.2s, transform 0.15s' }}
            >
              ✦ Compose Letter
            </button>
          </div>
        )}

        {/* ── Personal letters section ───────────────────────────────── */}
        <section className="animate-fade-up" style={{ marginBottom: 48, animationDelay: '0.34s' }}>
          <SectionHeader
            title="Your thoughts"
            subtitle="Letters written for yourself, and no one else."
            seeAll={personalLetters.length > 0}
            onSeeAll={() => navigate('myspace')}
          />
          <div style={{ marginTop: 20 }}>
            {recentPersonal.length === 0 ? (
              <EmptySection
                icon="🪞"
                text="You haven't written anything yet. Start your first personal letter."
                cta="Write your first letter →"
                onCta={() => navigate('write')}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {recentPersonal.map(l => (
                  <LetterCard key={l._id} letter={l} onClick={() => openLetterPanel(l)} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Listener: From the world ───────────────────────────────── */}
        {canReadFeed && (
          <section className="animate-fade-up" style={{ marginBottom: 48, animationDelay: '0.40s' }}>
            <SectionHeader
              title="From the world"
              subtitle="A stranger wrote this. Maybe it's for you."
              seeAll={strangerLetters.length > 0}
              onSeeAll={() => navigate('listenerread')}
            />
            <div style={{ marginTop: 20 }}>
              {recentStranger.length === 0 ? (
                <EmptySection
                  icon="📭"
                  text="The feed is quiet — no new letters waiting. Check back soon."
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {recentStranger.map(l => (
                    <WorldLetter
                      key={l._id}
                      letter={l}
                      onClick={() => navigate('listenerread')}
                      isNew={!l.hasRead}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Seeker: Connections nudge (no email accounts) ──────────── */}
        {userRole === 'seeker' && (
          <section className="animate-fade-up" style={{ animationDelay: '0.40s' }}>
            <div
              onClick={() => navigate('connections')}
              style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 14, padding: '24px 28px', border: `1px solid ${BD}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
            >
              <div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Connect an email</div>
                <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)' }}>Send letters straight to someone's inbox.</p>
              </div>
              <span style={{ fontSize: 22 }}>🔗</span>
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
