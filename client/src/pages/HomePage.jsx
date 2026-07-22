import { useApp } from '../context/AppContext'

// ── Hand-drawn underline stroke (like the reference's marker highlight) ──
function Underline({ color = 'var(--gold)', width = '100%' }) {
  return (
    <svg
      viewBox="0 0 120 10"
      fill="none"
      preserveAspectRatio="none"
      style={{ position: 'absolute', left: 0, bottom: -8, width, height: 9, pointerEvents: 'none' }}
    >
      <path d="M2 7 C 30 2, 60 9, 118 4" stroke={color} strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

// ── Organic blob for the pastel tiles ──
function TileBlob() {
  return (
    <svg className="tile-blob" viewBox="0 0 200 200" aria-hidden="true">
      <path
        fill="#fff"
        d="M45.7,-59.2C58.9,-49.9,69.2,-35.4,73.4,-19.1C77.6,-2.8,75.7,15.3,67.5,29.6C59.3,43.9,44.8,54.4,29.2,60.9C13.6,67.4,-3.1,69.9,-19.4,66.2C-35.7,62.5,-51.6,52.6,-61.1,38.5C-70.6,24.4,-73.7,6.1,-70.3,-10.5C-66.9,-27.1,-57,-42,-43.9,-51.4C-30.8,-60.8,-15.4,-64.7,0.6,-65.4C16.6,-66.1,32.5,-68.5,45.7,-59.2Z"
        transform="translate(100 100)"
      />
    </svg>
  )
}

// ── Quick-nav pastel tile ──────────────────────────────────────────────────────
const TILE_TONES = ['t-mint', 't-blush', 't-lav', 't-sky']

function QuickTile({ card, tone }) {
  return (
    <button className={`tile ${tone}`} onClick={card.onClick}>
      <TileBlob />
      <div className="tile-count">{card.count}</div>
      <div className="tile-label">{card.label}</div>
      <div className="tile-desc">{card.desc}</div>
      <div className="tile-go">Explore <span>→</span></div>
    </button>
  )
}

// ── Letter cards ────────────────────────────────────────────────────────────────
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function PersonalCard({ letter, onClick }) {
  return (
    <button className="lcard" onClick={onClick}>
      <div className="lcard-row"><span className="pill pill-me">Personal</span></div>
      <h3 className="lcard-title">{letter.subject}</h3>
      <p className="lcard-excerpt">{letter.message}</p>
      <div className="lcard-date">{fmtDate(letter.createdAt)}</div>
    </button>
  )
}

function WorldCard({ letter, onClick, isNew }) {
  return (
    <button className="lcard" onClick={onClick}>
      <div className="lcard-row">
        <span className="pill pill-anon">Anonymous</span>
        {isNew && <span className="pill pill-new">New</span>}
      </div>
      <h3 className="lcard-title">{letter.subject}</h3>
      <p className="lcard-excerpt">{letter.message}</p>
      <div className="lcard-date">{fmtDate(letter.createdAt)}</div>
    </button>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────────
function EmptyState({ icon, text, cta, onCta }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <p className="empty-text">{text}</p>
      {cta && <button className="empty-cta" onClick={onCta}>{cta}</button>}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const {
    navigate, authUser, userRole,
    personalLetters, strangerLetters, sentLetters, receivedLetters,
    ownStrangerLetters,
    canWriteStranger, canReadFeed, openLetterPanel,
  } = useApp()

  const firstName = authUser?.name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Still awake' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const recentPersonal = personalLetters.slice(0, 2)
  const recentStranger = strangerLetters.filter(l => !l.hasRead).slice(0, 2)

  const quickNav = [
    {
      label: 'Sent to a stranger',
      desc: 'Anonymous letters you shared with the world',
      count: ownStrangerLetters?.length ?? 0,
      onClick: () => navigate('myspace', 'stranger'),
      show: canWriteStranger,
    },
    {
      label: 'Sent to someone you know',
      desc: "Letters delivered straight to someone's inbox",
      count: sentLetters?.length ?? 0,
      onClick: () => navigate('myspace', 'sent'),
      show: true,
    },
    {
      label: 'Letters from the world',
      desc: 'Strangers writing openly, waiting to be heard',
      count: strangerLetters?.length ?? 0,
      onClick: () => navigate('listenerread'),
      show: canReadFeed,
    },
    {
      label: 'Letters received',
      desc: 'Messages sent to you by people you know',
      count: receivedLetters?.length ?? 0,
      onClick: () => navigate('myspace', 'received'),
      show: true,
    },
  ].filter(c => c.show)

  return (
    <main className="sunrise-home">
      <div className="wrap">

        {/* ── Greeting ── */}
        <div className="chip fade" style={{ animationDelay: '0s' }}>
          <span className="chip-dot" /> {greeting}
        </div>

        <h1 className="hero-h1 fade" style={{ animationDelay: '.07s' }}>
          {firstName}, what would you like to{' '}
          <span className="hl">express<Underline color="var(--yellow)" /></span> today?
        </h1>

        <p className="hero-sub fade" style={{ animationDelay: '.13s' }}>
          Everything you write here is yours — share it with the world, send it to someone, or keep it close.
        </p>

        {/* ── Quick-nav pastel tiles ── */}
        <div className="tiles fade" style={{ animationDelay: '.2s' }}>
          {quickNav.map((card, i) => (
            <QuickTile key={card.label} card={card} tone={TILE_TONES[i % TILE_TONES.length]} />
          ))}
        </div>

        {/* ── Compose banner (the sun) ── */}
        {canWriteStranger && (
          <div className="compose fade" style={{ animationDelay: '.28s' }}>
            <div className="compose-sun" aria-hidden="true" />
            <div className="compose-copy">
              <div className="compose-kicker">Begin writing</div>
              <h2 className="compose-h2">Pour your heart into a new letter</h2>
              <p className="compose-p">Unsent letters heal too. Start whenever you feel it.</p>
            </div>
            <button className="compose-btn" onClick={() => navigate('write')}>Begin writing →</button>
          </div>
        )}

        {/* ── Your thoughts ── */}
        <section className="fade" style={{ animationDelay: '.34s' }}>
          <div className="sec-head">
            <h2 className="sec-title">
              Your thoughts<Underline color="var(--blush)" width="72%" />
            </h2>
            {personalLetters.length > 0 && (
              <button className="see-all" onClick={() => navigate('myspace')}>See all →</button>
            )}
          </div>
          <p className="sec-sub">Letters written for yourself, and no one else.</p>
          {recentPersonal.length === 0 ? (
            <EmptyState
              icon="🪞"
              text="You haven't written anything yet. Your words matter — even the ones just for you."
              cta="Start your first letter"
              onCta={() => navigate('write')}
            />
          ) : (
            <div className="grid">
              {recentPersonal.map(l => (
                <PersonalCard key={l._id} letter={l} onClick={() => openLetterPanel(l)} />
              ))}
            </div>
          )}
        </section>

        {/* ── From the world ── */}
        {canReadFeed && (
          <section className="fade" style={{ animationDelay: '.4s' }}>
            <div className="sec-head">
              <h2 className="sec-title">
                From the world<Underline color="var(--lav)" width="66%" />
              </h2>
              {strangerLetters.length > 0 && (
                <button className="see-all" onClick={() => navigate('listenerread')}>See all →</button>
              )}
            </div>
            <p className="sec-sub">A stranger wrote this. Maybe it's for you.</p>
            {recentStranger.length === 0 ? (
              <EmptyState
                icon="📭"
                text="The feed is quiet right now. Someone out there is writing. Check back soon."
              />
            ) : (
              <div className="grid">
                {recentStranger.map(l => (
                  <WorldCard key={l._id} letter={l} onClick={() => navigate('listenerread')} isNew={!l.hasRead} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Connect nudge ── */}
        {userRole === 'seeker' && (
          <div className="nudge fade" style={{ animationDelay: '.46s' }} onClick={() => navigate('connections')}>
            <div>
              <h3 className="nudge-title">Connect an email to send letters</h3>
              <p className="nudge-p">Your letters can arrive straight in someone's inbox — personal and beautiful.</p>
            </div>
            <span className="nudge-btn">Connect →</span>
          </div>
        )}

      </div>

      <style>{`
        .sunrise-home{ background:var(--cream); min-height:100%; }
        .sunrise-home .wrap{ max-width:1080px; margin:0 auto; padding:52px 28px 120px; }

        /* Greeting */
        .sunrise-home .chip{ display:inline-flex; align-items:center; gap:8px; background:var(--yellow); color:var(--ink); font-size:13px; font-weight:700; padding:8px 16px; border-radius:100px; margin-bottom:24px; }
        .sunrise-home .chip-dot{ width:8px; height:8px; border-radius:50%; background:var(--ink); animation:pulseDot 2.4s ease-in-out infinite; }
        @keyframes pulseDot{ 0%,100%{ transform:scale(1); opacity:1 } 50%{ transform:scale(1.5); opacity:.6 } }
        .sunrise-home .hero-h1{ font-size:clamp(34px,4.8vw,52px); font-weight:800; line-height:1.14; letter-spacing:-.02em; max-width:18ch; color:var(--ink); margin:0; }
        .sunrise-home .hero-h1 .hl{ color:var(--tc); position:relative; white-space:nowrap; }
        .sunrise-home .hero-sub{ margin-top:18px; font-size:16.5px; color:var(--ink-muted); font-weight:500; max-width:44ch; line-height:1.65; }

        /* Tiles */
        .sunrise-home .tiles{ margin-top:52px; display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:16px; }
        .sunrise-home .tile{ border-radius:26px; padding:26px 24px; cursor:pointer; position:relative; overflow:hidden; text-align:left; border:none; font-family:inherit; transition:transform .25s cubic-bezier(.2,.8,.3,1.2), box-shadow .25s; min-height:190px; display:flex; flex-direction:column; color:var(--ink); }
        .sunrise-home .tile:hover{ transform:translateY(-6px) rotate(-.6deg); box-shadow:0 18px 44px rgba(59,54,99,.14); }
        .sunrise-home .tile.t-mint{ background:var(--mint) } .sunrise-home .tile.t-blush{ background:var(--blush) }
        .sunrise-home .tile.t-sky{ background:var(--sky) } .sunrise-home .tile.t-lav{ background:var(--lav) }
        .sunrise-home .tile-blob{ position:absolute; right:-30px; bottom:-40px; width:130px; height:130px; opacity:.5; }
        .sunrise-home .tile-count{ font-size:34px; font-weight:800; letter-spacing:-.03em; line-height:1; }
        .sunrise-home .tile-label{ font-size:15.5px; font-weight:700; margin-top:10px; line-height:1.3; }
        .sunrise-home .tile-desc{ font-size:12.5px; font-weight:500; color:var(--ink-soft); margin-top:6px; line-height:1.5; max-width:24ch; }
        .sunrise-home .tile-go{ margin-top:auto; padding-top:14px; font-size:13px; font-weight:700; display:flex; align-items:center; gap:6px; }
        .sunrise-home .tile-go span{ transition:transform .25s; }
        .sunrise-home .tile:hover .tile-go span{ transform:translateX(4px); }

        /* Compose */
        .sunrise-home .compose{ margin-top:64px; background:var(--tc); border-radius:32px; padding:clamp(36px,5vw,56px); color:#fff; display:flex; align-items:center; justify-content:space-between; gap:32px; flex-wrap:wrap; position:relative; overflow:hidden; }
        .sunrise-home .compose-sun{ position:absolute; right:-60px; top:-90px; width:300px; height:300px; border-radius:50%; background:var(--yellow); opacity:.9; }
        .sunrise-home .compose-sun::after{ content:''; position:absolute; inset:36px; border-radius:50%; background:var(--tc); opacity:.25; }
        .sunrise-home .compose-copy{ position:relative; }
        .sunrise-home .compose-kicker{ font-size:12px; font-weight:800; letter-spacing:.18em; text-transform:uppercase; opacity:.85; margin-bottom:12px; }
        .sunrise-home .compose-h2{ font-size:clamp(26px,3.4vw,38px); font-weight:800; line-height:1.15; letter-spacing:-.02em; max-width:16ch; margin:0; }
        .sunrise-home .compose-p{ margin-top:12px; font-size:15px; font-weight:500; opacity:.92; max-width:36ch; line-height:1.6; }
        .sunrise-home .compose-btn{ position:relative; background:#fff; color:var(--tc-2); border:none; border-radius:100px; padding:17px 32px; font-family:inherit; font-size:15.5px; font-weight:800; cursor:pointer; transition:transform .2s, box-shadow .2s; flex-shrink:0; }
        .sunrise-home .compose-btn:hover{ transform:scale(1.05); box-shadow:0 12px 30px rgba(0,0,0,.2); }

        /* Sections */
        .sunrise-home section{ margin-top:84px; }
        .sunrise-home .sec-head{ display:flex; align-items:center; justify-content:space-between; gap:20px; }
        .sunrise-home .sec-title{ font-size:26px; font-weight:800; letter-spacing:-.02em; position:relative; display:inline-block; color:var(--ink); margin:0; }
        .sunrise-home .sec-sub{ font-size:14.5px; color:var(--ink-muted); font-weight:500; margin-top:16px; margin-bottom:28px; }
        .sunrise-home .see-all{ background:var(--card); border:2px solid var(--line-strong); color:var(--ink); font-size:13px; font-weight:700; padding:10px 18px; border-radius:100px; cursor:pointer; font-family:inherit; transition:background .2s, border-color .2s; white-space:nowrap; }
        .sunrise-home .see-all:hover{ background:var(--yellow); border-color:var(--yellow); }

        /* Letter cards */
        .sunrise-home .grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:18px; }
        .sunrise-home .lcard{ background:var(--card); border:2px solid var(--line); border-radius:24px; padding:26px; cursor:pointer; text-align:left; font-family:inherit; transition:transform .25s, border-color .25s, box-shadow .25s; display:flex; flex-direction:column; gap:11px; }
        .sunrise-home .lcard:hover{ transform:translateY(-5px); border-color:var(--tc); box-shadow:0 16px 40px rgba(59,54,99,.1); }
        .sunrise-home .lcard-row{ display:flex; align-items:center; gap:8px; }
        .sunrise-home .pill{ font-size:11px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; padding:6px 12px; border-radius:100px; }
        .sunrise-home .pill-me{ background:var(--blush); color:#B05A1F; }
        .sunrise-home .pill-anon{ background:var(--lav); color:#5C4FA8; }
        .sunrise-home .pill-new{ background:var(--mint); color:#2E7D5B; }
        .sunrise-home .lcard-title{ font-size:17.5px; font-weight:700; line-height:1.35; letter-spacing:-.01em; color:var(--ink); margin:0; }
        .sunrise-home .lcard-excerpt{ font-size:14px; font-weight:500; color:var(--ink-soft); line-height:1.65; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin:0; }
        .sunrise-home .lcard-date{ margin-top:auto; padding-top:12px; font-size:12.5px; font-weight:600; color:var(--ink-muted); }

        /* Empty */
        .sunrise-home .empty{ background:var(--card); border:2px dashed var(--line-strong); border-radius:24px; padding:44px 32px; text-align:center; }
        .sunrise-home .empty-icon{ font-size:34px; margin-bottom:14px; opacity:.5; }
        .sunrise-home .empty-text{ font-size:14.5px; color:var(--ink-muted); font-weight:500; line-height:1.7; max-width:340px; margin:0 auto; }
        .sunrise-home .empty-cta{ margin-top:20px; background:var(--tc); color:#fff; border:none; border-radius:100px; padding:13px 24px; font-family:inherit; font-size:13.5px; font-weight:700; cursor:pointer; transition:transform .2s, box-shadow .2s; }
        .sunrise-home .empty-cta:hover{ transform:translateY(-2px); box-shadow:0 10px 26px var(--tc-s); }

        /* Nudge */
        .sunrise-home .nudge{ margin-top:84px; background:var(--sky); border-radius:28px; padding:34px 38px; display:flex; align-items:center; justify-content:space-between; gap:24px; cursor:pointer; transition:transform .25s; }
        .sunrise-home .nudge:hover{ transform:translateY(-4px); }
        .sunrise-home .nudge-title{ font-size:20px; font-weight:800; margin-bottom:6px; color:var(--ink); margin-top:0; }
        .sunrise-home .nudge-p{ font-size:14px; font-weight:500; color:var(--ink-soft); margin:0; }
        .sunrise-home .nudge-btn{ background:var(--ink); color:#fff; font-size:13.5px; font-weight:700; padding:13px 22px; border-radius:100px; white-space:nowrap; }

        /* Fade-in */
        .sunrise-home .fade{ opacity:0; transform:translateY(16px); animation:sunFade .6s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes sunFade{ to{ opacity:1; transform:none } }
        @media (prefers-reduced-motion:reduce){
          .sunrise-home .fade{ animation:none; opacity:1; transform:none }
          .sunrise-home .chip-dot{ animation:none }
        }
        @media (max-width:560px){
          .sunrise-home .wrap{ padding:36px 20px 90px; }
          .sunrise-home .compose{ flex-direction:column; align-items:flex-start; }
        }
      `}</style>
    </main>
  )
}
