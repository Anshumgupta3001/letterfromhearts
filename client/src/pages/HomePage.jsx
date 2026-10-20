import { useState } from 'react'
import { useApp } from '../context/AppContext'

const BD = '#F0DFD1'
const FT = '#F0DFD1'

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
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, var(--tc), var(--gold))', borderRadius: '4px 0 0 4px', display: 'none' }} />
      <div style={{ padding: '20px 20px 16px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <h3 style={{ fontFamily: '"Gambetta", serif', fontSize: 22, fontWeight: 400, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.03em' }}>
            {letter.subject}
          </h3>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, padding: '3px 8px', borderRadius: 6, fontWeight: 600, background: '#fdf0ee', color: 'var(--tc)', flexShrink: 0, border: '1px solid #f5d4ce' }}>
            ✦ Personal
          </span>
        </div>
        <p style={{ fontFamily: '"General Sans", sans-serif', fontSize: 15, color: 'var(--ink-muted)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {letter.message}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 20px 8px 26px', borderTop: `1px solid ${FT}`, background: 'rgba(245,240,232,0.4)', fontSize: 12, color: 'var(--ink-muted)' }}>
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
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, var(--sage), var(--gold))', borderRadius: '4px 0 0 4px', display: 'none' }} />
      <div style={{ padding: '20px 20px 16px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <h3 style={{ fontFamily: '"Gambetta", serif', letterSpacing: '-0.03em', fontSize: 22, fontWeight: 400, color: 'var(--ink)', lineHeight: 1.2 }}>
            {letter.subject}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
            <span style={{ fontSize: 13, padding: '3px 8px', borderRadius: 6, fontWeight: 600, background: 'rgba(88,143,96,0.1)', color: 'var(--sage)', border: '1px solid rgba(88,143,96,0.25)' }}>🔒 Anon</span>
            {isNew && <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, fontWeight: 600, background: 'rgba(88,143,96,0.08)', color: 'var(--sage)' }}>● New</span>}
          </div>
        </div>
        <p style={{ fontFamily: '"General Sans", sans-serif', fontSize: 15, color: 'var(--ink-muted)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {letter.message}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 20px 8px 26px', borderTop: `1px solid ${FT}`, background: 'rgba(245,240,232,0.4)', fontSize: 12, color: 'var(--ink-muted)' }}>
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
        background: '#fff',
        border: `1px solid ${hov ? 'var(--rose)' : '#EFE7E2'}`,
        borderRadius: 16, padding: '18px',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? '0 8px 24px rgba(40,3,15,0.08)' : '0 1px 4px rgba(40,3,15,0.03)',
        transition: 'all 0.2s',
      }}
    >
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: card.accent, borderRadius: '4px 0 0 4px', opacity: hov ? 1 : 0.4, transition: 'opacity 0.2s', display: 'none' }} />
      <div style={{ paddingLeft: 6 }}>
        {/* Icon + count row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
          <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 10, background: card.iconBg || 'var(--lemon)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={card.iconColor || 'var(--ink)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={card.iconPath || 'M4 6h16v12H4zM4 7l8 6 8-6'} /></svg>
          </span>
          <span style={{
            fontFamily: '"Gambetta", serif', fontSize: 32, fontWeight: 400,
            color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1,
            flexShrink: 0,
          }}>
            {card.count}
          </span>
        </div>
        {/* Label */}
        <div style={{ fontFamily: '"General Sans", sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3, marginTop: 10, marginBottom: 5 }}>
          {card.label}
        </div>
        {/* Description */}
        <p style={{ fontFamily: '"General Sans", sans-serif', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.45, margin: 0 }}>
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
        <h2 style={{ fontFamily: '"Gambetta", serif', letterSpacing: '-0.04em', fontSize: 30, fontWeight: 400, color: 'inherit', marginBottom: 3, lineHeight: 1.1 }}>{title}</h2>
        {subtitle && <p style={{ fontFamily: '"General Sans", sans-serif', fontSize: 15, color: 'inherit', opacity: 0.75, lineHeight: 1.6 }}>{subtitle}</p>}
      </div>
      {seeAll && (
        <button onClick={onSeeAll} style={{ fontSize: 15, color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"General Sans", sans-serif', fontWeight: 500, letterSpacing: '0.3px', whiteSpace: 'nowrap', marginTop: 4, flexShrink: 0, padding: '4px 0', borderBottom: '1px solid currentColor', transition: 'opacity 0.15s' }}>
          See all →
        </button>
      )}
    </div>
  )
}

// ── Empty section ─────────────────────────────────────────────────────────────
function EmptySection({ icon, text, cta, onCta }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '40px 32px', textAlign: 'center', border: '1px solid #EFE7E2' }}>
      <div style={{ fontSize: 34, marginBottom: 14, opacity: 0.35 }}>{icon}</div>
      <p style={{ fontFamily: '"General Sans", sans-serif', fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.75, marginBottom: cta ? 20 : 0, maxWidth: 320, margin: cta ? '0 auto 20px' : '0 auto' }}>{text}</p>
      {cta && (
        <button onClick={onCta} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: '"General Sans", sans-serif', fontSize: 13, color: '#fff', background: 'var(--tc)', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, boxShadow: '0 4px 14px rgba(40,3,15,0.2)', transition: 'all 0.2s' }}>{cta}</button>
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
      iconBg: 'var(--lemon)', iconColor: 'var(--ink)', iconPath: 'M4 6h16v12H4zM4 7l8 6 8-6',
      desc: 'Anonymous letters you shared with the world',
      count: ownStrangerLetters?.length ?? 0,
      accent: 'var(--sage)',
      accentBg: 'rgba(88,143,96,0.06)',
      accentBorder: 'rgba(88,143,96,0.2)',
      onClick: () => navigate('myspace', 'stranger'),
      show: canWriteStranger,
    },
    {
      icon: '🫂',
      label: 'Sent to Someone You Know',
      iconBg: 'var(--sand)', iconColor: 'var(--ink)', iconPath: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
      desc: 'Letters delivered straight to someone\'s inbox',
      count: sentLetters?.length ?? 0,
      accent: 'var(--gold)',
      accentBg: 'rgba(117,87,96,0.06)',
      accentBorder: 'rgba(117,87,96,0.2)',
      onClick: () => navigate('myspace', 'sent'),
      show: true,
    },
    {
      icon: '🌍',
      label: 'Letters from the World',
      iconBg: '#E4EAF1', iconColor: 'var(--slate)', iconPath: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
      desc: 'Strangers writing openly, waiting to be heard',
      count: strangerLetters?.length ?? 0,
      accent: 'var(--purple)',
      accentBg: 'rgba(51,85,127,0.06)',
      accentBorder: 'rgba(51,85,127,0.2)',
      onClick: () => navigate('listenerread'),
      show: canReadFeed,
    },
    {
      icon: '📥',
      label: 'Letters Received',
      iconBg: '#E3EEE4', iconColor: 'var(--fern)', iconPath: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z',
      desc: 'Messages sent to you by people you know',
      count: receivedLetters?.length ?? 0,
      accent: 'var(--tc)',
      accentBg: 'rgba(40,3,15,0.06)',
      accentBorder: 'rgba(40,3,15,0.2)',
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
        <div className="animate-fade-up" style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, fontFamily: '"General Sans", sans-serif' }}>
          {greetingWord}
          <span style={{ flex: 1, height: 1, background: BD, maxWidth: 60 }} />
        </div>

        <h1
          className="animate-fade-up"
          style={{ fontFamily: '"Gambetta", serif', fontSize: 'clamp(18px, 2.2vw, 24px)', fontWeight: 400, lineHeight: 1.45, color: 'var(--ink)', marginBottom: 20, letterSpacing: '-0.03em', animationDelay: '0.08s' }}
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
              background: 'var(--lemon)',
              border: 'none',
              borderRadius: 24, padding: 'clamp(22px, 3vw, 32px) clamp(22px, 3vw, 36px)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
              flexWrap: 'wrap',
              cursor: 'pointer', overflow: 'hidden', position: 'relative',
              boxShadow: ctaHov ? '0 10px 32px rgba(40,3,15,0.08)' : '0 2px 8px rgba(40,3,15,0.04)',
              transform: ctaHov ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'box-shadow 0.2s, transform 0.2s',
            }}
          >
            {/* Left accent bar */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg, var(--tc), var(--gold))', borderRadius: '4px 0 0 4px', display: 'none' }} />
            {/* Decorative symbol */}

            <div style={{ paddingLeft: 8 }}>
              <div style={{ fontFamily: '"Gambetta", serif', fontSize: 'clamp(28px, 3vw, 40px)', color: 'var(--ink)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.045em' }}>
                Pour your heart into a <em style={{ fontStyle: 'italic' }}>new letter.</em>
              </div>
              <div style={{ fontFamily: '"General Sans", sans-serif', fontSize: 16, color: 'var(--ink)', marginTop: 8, lineHeight: 1.5 }}>
                Unsent letters heal too. Start whenever you feel it.
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); navigate('write') }}
              onMouseEnter={() => setCtaBtnHov(true)}
              onMouseLeave={() => setCtaBtnHov(false)}
              style={{
                background: 'var(--ink)', opacity: ctaBtnHov ? 0.9 : 1,
                color: 'var(--paper)', border: 'none', borderRadius: 8,
                height: 50, padding: '0 22px', fontSize: 16, cursor: 'pointer',
                fontFamily: '"General Sans", sans-serif', fontWeight: 500,
                whiteSpace: 'nowrap', flexShrink: 0,

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
          <section className="animate-fade-up" style={{ marginBottom: 56, animationDelay: '0.40s', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 24, padding: 'clamp(22px, 3vw, 32px) clamp(22px, 3vw, 36px)' }}>
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
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(40,3,15,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div>
                <div style={{ fontFamily: '"Gambetta", serif', letterSpacing: '-0.03em', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>Connect an email to send letters</div>
                <p style={{ fontFamily: '"General Sans", sans-serif', fontSize: 15, color: 'var(--ink-muted)', lineHeight: 1.6 }}>Your letters can arrive straight in someone's inbox — personal and beautiful.</p>
              </div>
              <span style={{ fontSize: 26, flexShrink: 0 }}>🔗</span>
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
