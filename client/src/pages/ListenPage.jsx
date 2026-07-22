import { useApp } from '../context/AppContext'

// Real moods from the letter data (mockData: vent / joy / love / grief / gratitude / longing / anger)
const MOODS = [
  { id: 'all',       label: 'All',        emoji: '',   tone: 'all'  },
  { id: 'grief',     label: 'Grief',      emoji: '🕯️', tone: 'lav'  },
  { id: 'vent',      label: 'Need to vent', emoji: '🌧️', tone: 'sky'  },
  { id: 'longing',   label: 'Longing',    emoji: '🌙', tone: 'blush' },
  { id: 'gratitude', label: 'Gratitude',  emoji: '🌿', tone: 'mint' },
  { id: 'love',      label: 'Love',       emoji: '💌', tone: 'rose' },
  { id: 'joy',       label: 'Joy',        emoji: '🌟', tone: 'yellow' },
]

// Pill styling per mood, used on the cards
const MOOD_PILL = {
  grief:     { bg: 'var(--lav)',   color: '#5C4FA8' },
  vent:      { bg: 'var(--sky)',   color: '#3E6FA8' },
  longing:   { bg: 'var(--blush)', color: '#B05A1F' },
  gratitude: { bg: 'var(--mint)',  color: '#2E7D5B' },
  love:      { bg: '#FBD9E4',      color: '#A8437A' },
  joy:       { bg: 'var(--yellow)',color: '#8A6D1B' },
  anger:     { bg: '#FBD9C6',      color: '#C74E3B' },
}

export default function ListenPage() {
  const { filteredOpenLetters, openLetterDrawer, listenFilter, setListenFilter, navigate } = useApp()

  const filtered =
    listenFilter === 'all'
      ? filteredOpenLetters
      : filteredOpenLetters.filter(l => l.mood === listenFilter)

  return (
    <main className="sunrise-listen">
      <div className="wrap">

        <div className="chip fade">🎧 Open letters</div>

        <h1 className="l-h1 fade" style={{ animationDelay: '.07s' }}>
          Letters waiting to be{' '}
          <span className="hl">
            heard
            <svg viewBox="0 0 120 10" fill="none" preserveAspectRatio="none" className="underline">
              <path d="M2 7 C 30 2, 60 9, 118 4" stroke="var(--yellow)" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        <p className="l-sub fade" style={{ animationDelay: '.13s' }}>
          Each one is a real person. Take your time before you choose. Your presence matters.
        </p>

        <div className="intent fade" style={{ animationDelay: '.18s' }}>
          <span className="intent-ico">💛</span>
          <p>You don't have to reply to everything. Read with care, respond when it feels right.</p>
        </div>

        <div className="moods fade" style={{ animationDelay: '.24s' }}>
          {MOODS.map(m => (
            <button
              key={m.id}
              className={`m m-${m.tone} ${listenFilter === m.id ? 'active' : ''}`}
              onClick={() => setListenFilter(m.id)}
            >
              {m.emoji && <span>{m.emoji}</span>}{m.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty fade" style={{ animationDelay: '.3s' }}>
            <div className="empty-icon">📭</div>
            <h3 className="empty-title">No letters here right now</h3>
            <p className="empty-text">The feed is quiet — someone out there is writing. Check back soon.</p>
            <button className="empty-cta" onClick={() => navigate('write')}>Write a letter instead</button>
          </div>
        ) : (
          <div className="grid fade" style={{ animationDelay: '.3s' }}>
            {filtered.map(letter => {
              const pill = MOOD_PILL[letter.mood] || { bg: 'var(--card)', color: 'var(--ink-soft)' }
              return (
                <div key={letter.id} className="card" onClick={() => openLetterDrawer(letter.id)}>
                  <div className="row">
                    <span className="pill" style={{ background: pill.bg, color: pill.color }}>
                      {letter.emoji} {letter.moodLabel}
                    </span>
                    <span className="time">{letter.timeAgo}</span>
                  </div>
                  <h3 className="card-title">{letter.sal}</h3>
                  <p className="excerpt">{letter.exc}</p>
                  <div className="foot">
                    <span className="anon">Anonymous</span>
                    <button
                      className="hold"
                      onClick={e => { e.stopPropagation(); openLetterDrawer(letter.id) }}
                    >
                      Hold this →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      <style>{`
        .sunrise-listen{ background:var(--cream); min-height:100%; }
        .sunrise-listen .wrap{ max-width:1040px; margin:0 auto; padding:52px 28px 120px; }

        .sunrise-listen .chip{ display:inline-flex; align-items:center; gap:8px; background:var(--mint); color:#2E7D5B; font-size:12.5px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; padding:8px 16px; border-radius:100px; margin-bottom:22px; }
        .sunrise-listen .l-h1{ font-size:clamp(32px,4.6vw,50px); font-weight:800; line-height:1.14; letter-spacing:-.02em; max-width:16ch; color:var(--ink); margin:0; }
        .sunrise-listen .l-h1 .hl{ color:var(--tc); position:relative; white-space:nowrap; }
        .sunrise-listen .underline{ position:absolute; left:0; bottom:-8px; width:100%; height:9px; pointer-events:none; }
        .sunrise-listen .l-sub{ margin-top:18px; font-size:16px; color:var(--ink-muted); font-weight:500; max-width:46ch; line-height:1.65; }

        .sunrise-listen .intent{ margin-top:32px; background:#FFF7E3; border-radius:20px; padding:20px 26px; display:flex; align-items:flex-start; gap:14px; max-width:640px; }
        .sunrise-listen .intent-ico{ font-size:20px; flex-shrink:0; }
        .sunrise-listen .intent p{ font-size:14px; font-weight:600; color:#8A6D1B; line-height:1.6; margin:0; }

        .sunrise-listen .moods{ margin-top:40px; display:flex; gap:8px; flex-wrap:wrap; }
        .sunrise-listen .m{ border:2px solid var(--line); background:var(--card); color:var(--ink-soft); border-radius:100px; padding:10px 18px; font-family:inherit; font-size:13.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:all .2s; }
        .sunrise-listen .m:hover{ transform:translateY(-2px); }
        .sunrise-listen .m.active{ background:var(--ink); border-color:var(--ink); color:#fff; }
        .sunrise-listen .m-lav:hover:not(.active){ background:var(--lav); border-color:var(--lav); }
        .sunrise-listen .m-sky:hover:not(.active){ background:var(--sky); border-color:var(--sky); }
        .sunrise-listen .m-blush:hover:not(.active){ background:var(--blush); border-color:var(--blush); }
        .sunrise-listen .m-mint:hover:not(.active){ background:var(--mint); border-color:var(--mint); }
        .sunrise-listen .m-rose:hover:not(.active){ background:#FBD9E4; border-color:#FBD9E4; }
        .sunrise-listen .m-yellow:hover:not(.active){ background:var(--yellow); border-color:var(--yellow); }

        .sunrise-listen .grid{ margin-top:32px; display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:18px; }
        .sunrise-listen .card{ background:var(--card); border:2px solid var(--line); border-radius:24px; padding:26px; cursor:pointer; transition:transform .25s cubic-bezier(.2,.8,.3,1.2), border-color .25s, box-shadow .25s; display:flex; flex-direction:column; gap:11px; }
        .sunrise-listen .card:hover{ transform:translateY(-6px) rotate(-.4deg); border-color:var(--tc); box-shadow:0 18px 44px rgba(59,54,99,.12); }
        .sunrise-listen .row{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .sunrise-listen .pill{ font-size:11px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; padding:6px 13px; border-radius:100px; }
        .sunrise-listen .time{ font-size:12px; font-weight:700; color:var(--ink-muted); white-space:nowrap; }
        .sunrise-listen .card-title{ font-size:17.5px; font-weight:700; line-height:1.35; color:var(--ink); margin:0; }
        .sunrise-listen .excerpt{ font-size:13.5px; font-weight:500; color:var(--ink-soft); line-height:1.65; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; margin:0; }
        .sunrise-listen .foot{ margin-top:auto; padding-top:12px; display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .sunrise-listen .anon{ font-size:12px; font-weight:700; color:var(--ink-muted); }
        .sunrise-listen .hold{ background:var(--ink); color:#fff; border:none; border-radius:100px; padding:9px 16px; font-family:inherit; font-size:12px; font-weight:800; cursor:pointer; transition:background .2s, transform .2s; white-space:nowrap; }
        .sunrise-listen .hold:hover{ background:var(--tc); transform:scale(1.05); }

        .sunrise-listen .empty{ margin-top:32px; background:var(--card); border:2px dashed var(--line-strong); border-radius:24px; padding:56px 32px; text-align:center; }
        .sunrise-listen .empty-icon{ font-size:40px; margin-bottom:14px; opacity:.5; }
        .sunrise-listen .empty-title{ font-size:19px; font-weight:800; color:var(--ink); margin:0 0 8px; }
        .sunrise-listen .empty-text{ font-size:14px; color:var(--ink-muted); font-weight:500; line-height:1.7; max-width:330px; margin:0 auto; }
        .sunrise-listen .empty-cta{ margin-top:22px; background:var(--tc); color:#fff; border:none; border-radius:100px; padding:13px 24px; font-family:inherit; font-size:13.5px; font-weight:800; cursor:pointer; transition:transform .2s, box-shadow .2s; }
        .sunrise-listen .empty-cta:hover{ transform:translateY(-2px); box-shadow:0 10px 26px rgba(244,129,63,.35); }

        .sunrise-listen .fade{ opacity:0; transform:translateY(16px); animation:sunFade .6s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes sunFade{ to{ opacity:1; transform:none } }
        @media (prefers-reduced-motion:reduce){ .sunrise-listen .fade{ animation:none; opacity:1; transform:none } }
        @media (max-width:560px){ .sunrise-listen .wrap{ padding:36px 20px 90px; } }
      `}</style>
    </main>
  )
}
