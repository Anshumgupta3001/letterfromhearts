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
          <h3 style={{ fontFamily: '"Lora", serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
            {letter.subject}
          </h3>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', background: '#fdf0ee', color: 'var(--tc)', flexShrink: 0, border: '1px solid #f5d4ce' }}>
            ✦ Personal
          </span>
        </div>
        <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
          <h3 style={{ fontFamily: '"Lora", serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>
            {letter.subject}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', background: 'rgba(122,158,142,0.1)', color: 'var(--sage)', border: '1px solid rgba(122,158,142,0.25)' }}>🔒 Anon</span>
            {isNew && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: 'rgba(122,158,142,0.08)', color: 'var(--sage)' }}>● New</span>}
          </div>
        </div>
        <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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

// ── Quick-nav option card ─────────────────────────────────────────────────────
function QuickNavCard({ card }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={card.onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? card.accentBg : '#fff',
        border: `1px solid ${hov ? card.accentBorder : BD}`,
        borderRadius: 14, padding: '16px 18px',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? '0 8px 24px rgba(28,18,8,0.08)' : '0 1px 4px rgba(28,18,8,0.03)',
        transition: 'all 0.2s',
      }}
    >
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: card.accent, borderRadius: '4px 0 0 4px', opacity: hov ? 1 : 0.4, transition: 'opacity 0.2s' }} />
      <div style={{ paddingLeft: 6 }}>
        {/* Icon + count row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>{card.icon}</span>
          <span style={{
            fontFamily: '"Lora", serif', fontSize: 22, fontWeight: 600,
            color: 'var(--ink)', letterSpacing: '-0.5px', lineHeight: 1,
            flexShrink: 0,
          }}>
            {card.count}
          </span>
        </div>
        {/* Label */}
        <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12.5, fontWeight: 500, color: 'var(--ink-soft)', lineHeight: 1.3, letterSpacing: '-0.1px', marginBottom: 5 }}>
          {card.label}
        </div>
        {/* Description */}
        <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 11.5, color: 'var(--ink-muted)', lineHeight: 1.55, margin: 0 }}>
          {card.desc}
        </p>
      </div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, seeAll, onSeeAll }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
      <div>
        <h2 style={{ fontFamily: '"Lora", serif', fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 3, lineHeight: 1.2 }}>{title}</h2>
        {subtitle && <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.6 }}>{subtitle}</p>}
      </div>
      {seeAll && (
        <button onClick={onSeeAll} style={{ fontSize: 12, color: 'var(--tc)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', fontWeight: 500, letterSpacing: '0.3px', whiteSpace: 'nowrap', marginTop: 4, flexShrink: 0, padding: '4px 0', borderBottom: '1px solid rgba(196,99,58,0.25)', transition: 'opacity 0.15s' }}>
          See all →
        </button>
      )}
    </div>
  )
}

// ── Empty section ─────────────────────────────────────────────────────────────
function EmptySection({ icon, text, cta, onCta }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.45)', borderRadius: 14, padding: '44px 32px', textAlign: 'center', border: `1.5px dashed ${BD}` }}>
      <div style={{ fontSize: 34, marginBottom: 14, opacity: 0.35 }}>{icon}</div>
      <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.75, marginBottom: cta ? 20 : 0, maxWidth: 320, margin: cta ? '0 auto 20px' : '0 auto' }}>{text}</p>
      {cta && (
        <button onClick={onCta} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#fff', background: 'var(--tc)', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, boxShadow: '0 4px 14px rgba(196,99,58,0.2)', transition: 'all 0.2s' }}>{cta}</button>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const {
    navigate, authUser, userRole,
    personalLetters, strangerLetters, sentLetters, receivedLetters,
    ownStrangerLetters,
    canWriteStranger, canReadFeed, openLetterPanel,
  } = useApp()

  const firstName    = authUser?.name?.split(' ')[0] || 'there'
  const hour         = new Date().getHours()
  const greetingWord = hour < 5 ? 'Still Awake' : hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  const [ctaHov, setCtaHov] = useState(false)
  const [ctaBtnHov, setCtaBtnHov] = useState(false)

  const recentPersonal = personalLetters.slice(0, 4)
  const recentStranger = strangerLetters.filter(l => !l.hasRead).slice(0, 3)

  // Quick-nav option cards shown below the greeting
  const quickNav = [
    {
      icon: '💌',
      label: 'Sent to Stranger',
      desc: 'Anonymous letters you shared with the world',
      count: ownStrangerLetters?.length ?? 0,
      accent: 'var(--sage)',
      accentBg: 'rgba(122,158,142,0.06)',
      accentBorder: 'rgba(122,158,142,0.2)',
      onClick: () => navigate('myspace', 'stranger'),
      show: canWriteStranger,
    },
    {
      icon: '🫂',
      label: 'Sent to Someone You Know',
      desc: 'Letters delivered straight to someone\'s inbox',
      count: sentLetters?.length ?? 0,
      accent: 'var(--gold)',
      accentBg: 'rgba(196,160,58,0.06)',
      accentBorder: 'rgba(196,160,58,0.2)',
      onClick: () => navigate('myspace', 'sent'),
      show: true,
    },
    {
      icon: '🌍',
      label: 'Letters from the World',
      desc: 'Strangers writing openly, waiting to be heard',
      count: strangerLetters?.length ?? 0,
      accent: 'var(--purple)',
      accentBg: 'rgba(139,126,200,0.06)',
      accentBorder: 'rgba(139,126,200,0.2)',
      onClick: () => navigate('listenerread'),
      show: canReadFeed,
    },
    {
      icon: '📥',
      label: 'Letters Received',
      desc: 'Messages sent to you by people you know',
      count: receivedLetters?.length ?? 0,
      accent: 'var(--tc)',
      accentBg: 'rgba(196,99,58,0.06)',
      accentBorder: 'rgba(196,99,58,0.2)',
      onClick: () => navigate('myspace', 'received'),
      show: true,
    },
  ].filter(c => c.show)

  return (
    <main className="page-enter" style={{ position: 'relative' }}>
      {/* Subtle grain */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E\")", pointerEvents: 'none', zIndex: 0, opacity: 0.6 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(24px, 4vw, 40px) clamp(20px, 4vw, 48px)' }}>

        {/* ── Greeting ──────────────────────────────────────────────── */}
        <div className="animate-fade-up" style={{ fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, fontFamily: '"DM Sans", sans-serif' }}>
          {greetingWord}
          <span style={{ flex: 1, height: 1, background: BD, maxWidth: 60 }} />
        </div>

        <h1
          className="animate-fade-up"
          style={{ fontFamily: '"Lora", serif', fontSize: 'clamp(18px, 2.2vw, 24px)', fontWeight: 500, lineHeight: 1.45, color: 'var(--ink)', marginBottom: 20, letterSpacing: '-0.1px', animationDelay: '0.08s' }}
        >
          <em style={{ color: 'var(--tc)', fontStyle: 'italic' }}>{firstName},</em> what would<br />
          you like to <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>express</em> today?
        </h1>

        {/* ── Quick-nav option cards ─────────────────────────────────── */}
        <div className="animate-fade-up grid grid-cols-2 lg:grid-cols-4" style={{ gap: 10, marginBottom: 32, animationDelay: '0.22s' }}>
          {quickNav.map(card => (
            <QuickNavCard key={card.label} card={card} />
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
              marginBottom: 32, animationDelay: '0.28s',
              background: '#fff',
              border: `1px solid ${BD}`,
              borderRadius: 14, padding: '20px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
              flexWrap: 'wrap',
              cursor: 'pointer', overflow: 'hidden', position: 'relative',
              boxShadow: ctaHov ? '0 10px 32px rgba(28,18,8,0.08)' : '0 2px 8px rgba(28,18,8,0.04)',
              transform: ctaHov ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'box-shadow 0.2s, transform 0.2s',
            }}
          >
            {/* Left accent bar */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, var(--tc), var(--gold))', borderRadius: '4px 0 0 4px' }} />
            {/* Decorative symbol */}
            <span style={{ position: 'absolute', right: 24, top: 16, fontSize: 22, color: 'rgba(196,99,58,0.07)', pointerEvents: 'none', userSelect: 'none' }}>✦</span>
            <div style={{ paddingLeft: 8 }}>
              <div style={{ fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--tc)', marginBottom: 8, fontFamily: '"DM Sans", sans-serif', fontWeight: 500 }}>Begin Writing</div>
              <div style={{ fontFamily: '"Lora", serif', fontSize: 'clamp(16px, 2vw, 21px)', color: 'var(--ink)', fontWeight: 500, lineHeight: 1.45, letterSpacing: '-0.1px' }}>
                Pour your heart<br />into a <em style={{ fontStyle: 'italic', color: 'var(--tc)' }}>new letter</em>
              </div>
              <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-muted)', marginTop: 7, lineHeight: 1.65 }}>
                Unsent letters heal too. Start whenever you feel it.
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); navigate('write') }}
              onMouseEnter={() => setCtaBtnHov(true)}
              onMouseLeave={() => setCtaBtnHov(false)}
              style={{
                background: ctaBtnHov ? '#D97040' : 'var(--tc)',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontSize: 12.5, cursor: 'pointer',
                fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
                whiteSpace: 'nowrap', flexShrink: 0,
                transform: ctaBtnHov ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: ctaBtnHov ? '0 6px 18px rgba(196,99,58,0.3)' : '0 3px 10px rgba(196,99,58,0.2)',
                transition: 'all 0.2s',
              }}
            >
              Begin writing →
            </button>
          </div>
        )}

        {/* ── Personal letters section ───────────────────────────────── */}
        <section className="animate-fade-up" style={{ marginBottom: 36, animationDelay: '0.34s' }}>
          <SectionHeader
            title="Your thoughts"
            subtitle="Letters written for yourself, and no one else."
            seeAll={personalLetters.length > 0}
            onSeeAll={() => navigate('myspace')}
          />
          <div style={{ marginTop: 14 }}>
            {recentPersonal.length === 0 ? (
              <EmptySection
                icon="🪞"
                text="You haven't written anything yet. Your words matter — even the ones just for you."
                cta="Start your first letter"
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
          <section className="animate-fade-up" style={{ marginBottom: 56, animationDelay: '0.40s' }}>
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
                  text="The feed is quiet right now. Someone out there is writing. Check back soon."
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

        {/* ── Seeker: Connections nudge ──────────────────────────────── */}
        {userRole === 'seeker' && (
          <section className="animate-fade-up" style={{ animationDelay: '0.40s' }}>
            <div
              onClick={() => navigate('connections')}
              style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 14, padding: '28px 32px', border: `1px solid ${BD}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, transition: 'box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(28,26,23,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div>
                <div style={{ fontFamily: '"Lora", serif', fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Connect an email to send letters</div>
                <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.6 }}>Your letters can arrive straight in someone's inbox — personal and beautiful.</p>
              </div>
              <span style={{ fontSize: 26, flexShrink: 0 }}>🔗</span>
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
