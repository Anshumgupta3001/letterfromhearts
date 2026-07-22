import { useApp } from '../context/AppContext'

const ACTIONS = [
  {
    tone: 't-mint',
    label: 'Write a letter',
    desc: 'To yourself, a stranger, or someone you know.',
    page: 'write',
  },
  {
    tone: 't-blush',
    label: 'Listen to strangers',
    desc: 'Read letters from people who needed to be heard.',
    page: 'listen',
  },
  {
    tone: 't-lav',
    label: 'My space',
    desc: 'Your letters, received replies, and connections.',
    page: 'myspace',
  },
]

function Blob() {
  return (
    <svg className="w-blob" viewBox="0 0 200 200" aria-hidden="true">
      <path fill="#fff" d="M45.7,-59.2C58.9,-49.9,69.2,-35.4,73.4,-19.1C77.6,-2.8,75.7,15.3,67.5,29.6C59.3,43.9,44.8,54.4,29.2,60.9C13.6,67.4,-3.1,69.9,-19.4,66.2C-35.7,62.5,-51.6,52.6,-61.1,38.5C-70.6,24.4,-73.7,6.1,-70.3,-10.5C-66.9,-27.1,-57,-42,-43.9,-51.4C-30.8,-60.8,-15.4,-64.7,0.6,-65.4C16.6,-66.1,32.5,-68.5,45.7,-59.2Z" transform="translate(100 100)" />
    </svg>
  )
}

export default function WelcomePage() {
  const { authUser, navigate } = useApp()
  const firstName = authUser?.name?.split(' ')[0] || 'there'

  return (
    <main className="sunrise-welcome">
      <div className="w-wrap">
        <div className="chip fade"><span className="chip-dot" /> Welcome</div>

        <h1 className="w-h1 fade" style={{ animationDelay: '.07s' }}>
          Hi {firstName}, this is your{' '}
          <span className="hl">
            quiet space
            <svg viewBox="0 0 120 10" fill="none" preserveAspectRatio="none" className="w-underline">
              <path d="M2 7 C 30 2, 60 9, 118 4" stroke="var(--yellow)" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </span>.
        </h1>
        <p className="w-sub fade" style={{ animationDelay: '.13s' }}>
          Write freely, listen openly, or simply begin. Everything here is yours — private, and only shared when you choose.
        </p>

        <div className="w-tiles fade" style={{ animationDelay: '.2s' }}>
          {ACTIONS.map(a => (
            <button key={a.page} className={`w-tile ${a.tone}`} onClick={() => navigate(a.page)}>
              <Blob />
              <div className="w-tile-label">{a.label}</div>
              <div className="w-tile-desc">{a.desc}</div>
              <div className="w-tile-go">Begin <span>→</span></div>
            </button>
          ))}
        </div>

        <p className="w-foot fade" style={{ animationDelay: '.3s' }}>Private · Anonymous · No judgment.</p>
      </div>

      <style>{`
        .sunrise-welcome{ min-height:100vh; background:var(--cream); display:flex; align-items:center; justify-content:center; padding:48px 24px; }
        .sunrise-welcome .w-wrap{ width:100%; max-width:720px; }
        .sunrise-welcome .chip{ display:inline-flex; align-items:center; gap:8px; background:var(--yellow); color:var(--ink); font-size:13px; font-weight:700; padding:8px 16px; border-radius:100px; margin-bottom:24px; }
        .sunrise-welcome .chip-dot{ width:8px; height:8px; border-radius:50%; background:var(--ink); animation:pulseDot 2.4s ease-in-out infinite; }
        @keyframes pulseDot{ 0%,100%{ transform:scale(1); opacity:1 } 50%{ transform:scale(1.5); opacity:.6 } }
        .sunrise-welcome .w-h1{ font-size:clamp(32px,4.6vw,46px); font-weight:800; line-height:1.14; letter-spacing:-.02em; color:var(--ink); max-width:16ch; margin:0; }
        .sunrise-welcome .w-h1 .hl{ position:relative; color:var(--tc); white-space:nowrap; }
        .sunrise-welcome .w-underline{ position:absolute; left:0; bottom:-8px; width:100%; height:9px; pointer-events:none; }
        .sunrise-welcome .w-sub{ margin-top:18px; font-size:16px; color:var(--ink-muted); font-weight:500; max-width:46ch; line-height:1.65; }

        .sunrise-welcome .w-tiles{ margin-top:44px; display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; }
        .sunrise-welcome .w-tile{ position:relative; overflow:hidden; border:none; cursor:pointer; text-align:left; font-family:inherit; border-radius:26px; padding:26px 24px; min-height:176px; display:flex; flex-direction:column; color:var(--ink); transition:transform .25s cubic-bezier(.2,.8,.3,1.2), box-shadow .25s; }
        .sunrise-welcome .w-tile:hover{ transform:translateY(-6px) rotate(-.6deg); box-shadow:0 18px 44px rgba(59,54,99,.14); }
        .sunrise-welcome .w-tile.t-mint{ background:var(--mint) } .sunrise-welcome .w-tile.t-blush{ background:var(--blush) } .sunrise-welcome .w-tile.t-lav{ background:var(--lav) }
        .sunrise-welcome .w-blob{ position:absolute; right:-30px; bottom:-40px; width:120px; height:120px; opacity:.5; }
        .sunrise-welcome .w-tile-label{ font-size:16.5px; font-weight:800; letter-spacing:-.01em; line-height:1.25; }
        .sunrise-welcome .w-tile-desc{ font-size:12.5px; font-weight:500; color:var(--ink-soft); margin-top:8px; line-height:1.5; max-width:22ch; }
        .sunrise-welcome .w-tile-go{ margin-top:auto; padding-top:16px; font-size:13px; font-weight:700; display:flex; align-items:center; gap:6px; }
        .sunrise-welcome .w-tile-go span{ transition:transform .25s; }
        .sunrise-welcome .w-tile:hover .w-tile-go span{ transform:translateX(4px); }
        .sunrise-welcome .w-foot{ margin-top:28px; font-size:12.5px; font-weight:600; color:var(--ink-muted); letter-spacing:.02em; }

        .sunrise-welcome .fade{ opacity:0; transform:translateY(16px); animation:sunFade .6s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes sunFade{ to{ opacity:1; transform:none } }
        @media (prefers-reduced-motion:reduce){ .sunrise-welcome .fade{ animation:none; opacity:1; transform:none } .sunrise-welcome .chip-dot{ animation:none } }
      `}</style>
    </main>
  )
}
