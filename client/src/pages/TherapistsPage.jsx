import { useState, useEffect, useCallback } from 'react'
import TherapistApplicationModal from '../components/TherapistApplicationModal'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')

// ── Avatar tones (cycled by name hash, like the reference's av-1/2/3) ─────────
const AVATAR_TONES = ['av-1', 'av-2', 'av-3', 'av-4']

function avatarTone(name = '') {
  let sum = 0
  for (const c of name) sum += c.charCodeAt(0)
  return AVATAR_TONES[sum % AVATAR_TONES.length]
}

function initials(firstName = '', lastName = '') {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
}

// ── Therapist card ────────────────────────────────────────────────────────────
function TherapistCard({ therapist }) {
  const { firstName, lastName, about, location, specializations,
          quote, website, bookingLink, sessionType, profileImage } = therapist
  const tone = avatarTone(`${firstName}${lastName}`)

  return (
    <div className="card">
      <div className="top">
        {profileImage ? (
          <img
            className="avatar-img"
            src={profileImage}
            alt={`${firstName} ${lastName}`}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
        ) : null}
        <div className={`avatar ${tone}`} style={{ display: profileImage ? 'none' : 'flex' }}>
          {initials(firstName, lastName)}
        </div>

        <div className="who">
          <div className="name-row">
            <span className="name">{firstName} {lastName}</span>
            <span className="verified">✓ Verified</span>
          </div>
          {(location || sessionType) && (
            <div className="meta">
              {location && <span>📍 {location}</span>}
              {location && sessionType && <span className="dot">·</span>}
              {sessionType && <span>{sessionType}</span>}
            </div>
          )}
        </div>
      </div>

      {about && <p className="about">{about}</p>}

      {specializations?.length > 0 && (
        <div className="tags">
          {specializations.map(s => <span key={s} className="tag">{s}</span>)}
        </div>
      )}

      {quote && (
        <div className="quote">
          <div className="qt">Why I recommend Letter from Heart</div>
          <p>"{quote}"</p>
        </div>
      )}

      {(bookingLink || website) && (
        <div className="actions">
          {bookingLink && <span className="book">Book a session (coming soon)</span>}
          {website && (
            <a className="website" href={website} target="_blank" rel="noopener noreferrer">
              🌐 Website
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TherapistsPage() {
  const [therapists,      setTherapists]      = useState([])
  const [specializations, setSpecializations] = useState([])
  const [stats,           setStats]           = useState(null)
  const [activeFilter,    setActiveFilter]    = useState('all')
  const [loading,         setLoading]         = useState(true)
  const [modalOpen,       setModalOpen]       = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, sRes, specRes] = await Promise.all([
        fetch(`${API}/api/therapists`),
        fetch(`${API}/api/therapists/stats`),
        fetch(`${API}/api/therapists/specializations`),
      ])
      const [tJson, sJson, specJson] = await Promise.all([tRes.json(), sRes.json(), specRes.json()])
      if (tJson.success)    setTherapists(tJson.data)
      if (sJson.success)    setStats(sJson.data)
      if (specJson.success) setSpecializations(specJson.data)
    } catch { /* network error — fail silently, show empty state */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const fetchFiltered = useCallback(async (filter) => {
    setLoading(true)
    try {
      const url = filter === 'all'
        ? `${API}/api/therapists`
        : `${API}/api/therapists?specialization=${encodeURIComponent(filter)}`
      const res  = await fetch(url)
      const json = await res.json()
      if (json.success) setTherapists(json.data)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  function handleFilter(f) {
    setActiveFilter(f)
    fetchFiltered(f)
  }

  const filters = ['All', ...specializations]

  return (
    <main className="sunrise-therapists">
      <div className="wrap">

        <div className="chip fade">✦ For professionals</div>

        <h1 className="t-h1 fade" style={{ animationDelay: '.07s' }}>
          Therapists who recommend{' '}
          <span className="hl">
            Letter from Heart
            <svg viewBox="0 0 200 10" fill="none" preserveAspectRatio="none" className="underline">
              <path d="M2 7 C 50 2, 100 9, 198 4" stroke="var(--yellow)" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        <p className="t-sub fade" style={{ animationDelay: '.13s' }}>
          These professionals use Letter from Heart as a complementary tool alongside their practice — for
          expressive writing, emotional processing, and human connection.
        </p>

        {/* ── Trust cards ── */}
        <div className="trust fade" style={{ animationDelay: '.2s' }}>
          <div className="tcard a">
            <div className="ico">🔒</div>
            <h3>Manual verification</h3>
            <p>Every therapist is personally reviewed. We verify credentials and license numbers before any profile goes live.</p>
          </div>
          <div className="tcard b">
            <div className="ico">✦</div>
            <h3>Complementary care</h3>
            <p>These therapists actively recommend letter-writing as an expressive tool alongside professional therapy — not as a replacement.</p>
          </div>
        </div>

        {/* ── Directory header + filters ── */}
        <div className="dir-head fade" style={{ animationDelay: '.28s' }}>
          <h2 className="dir-title">
            Browse therapists
            <svg viewBox="0 0 120 10" fill="none" preserveAspectRatio="none" className="underline">
              <path d="M2 6 C 35 2, 70 9, 118 4" stroke="var(--lav)" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </h2>
          {specializations.length > 0 && (
            <div className="filters">
              {filters.map(f => {
                const id = f === 'All' ? 'all' : f
                return (
                  <button
                    key={id}
                    className={`f ${activeFilter === id ? 'active' : ''}`}
                    onClick={() => handleFilter(id)}
                  >
                    {f}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Directory ── */}
        <div className="fade" style={{ animationDelay: '.34s' }}>
          {loading ? (
            <div className="grid">
              {[1, 2, 3].map(i => <div key={i} className="skeleton" />)}
            </div>
          ) : therapists.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <h3 className="empty-title">
                {activeFilter === 'all' ? 'No therapists yet' : `No therapists for "${activeFilter}"`}
              </h3>
              <p className="empty-text">
                {activeFilter === 'all'
                  ? "We're building our network. Check back soon."
                  : 'Try a different specialization, or view everyone.'}
              </p>
              {activeFilter !== 'all' && (
                <button className="empty-cta" onClick={() => handleFilter('all')}>View all therapists</button>
              )}
            </div>
          ) : (
            <div className="grid">
              {therapists.map(t => <TherapistCard key={t._id} therapist={t} />)}
            </div>
          )}
        </div>

        {/* ── Apply CTA ── */}
        {!loading && (
          <div className="cta fade" style={{ animationDelay: '.42s' }}>
            <div className="cta-sun" aria-hidden="true" />
            <div className="cta-copy">
              <h3>Are you a therapist?</h3>
              <p>Join our growing network of professionals who recommend Letter from Heart alongside their practice.</p>
            </div>
            <button className="cta-btn" onClick={() => setModalOpen(true)}>Apply to join →</button>
          </div>
        )}

      </div>

      {modalOpen && <TherapistApplicationModal onClose={() => setModalOpen(false)} />}

      <style>{`
        .sunrise-therapists{ background:var(--cream); min-height:100%; }
        .sunrise-therapists .wrap{ max-width:920px; margin:0 auto; padding:52px 28px 120px; }

        .sunrise-therapists .chip{ display:inline-flex; align-items:center; gap:8px; background:var(--lav); color:#5C4FA8; font-size:12px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; padding:8px 16px; border-radius:100px; margin-bottom:22px; }
        .sunrise-therapists .t-h1{ font-size:clamp(28px,4vw,42px); font-weight:800; line-height:1.14; letter-spacing:-.02em; max-width:18ch; color:var(--ink); margin:0; }
        .sunrise-therapists .t-h1 .hl{ color:var(--tc); position:relative; white-space:nowrap; }
        .sunrise-therapists .underline{ position:absolute; left:0; bottom:-8px; width:100%; height:9px; pointer-events:none; }
        .sunrise-therapists .t-sub{ margin-top:18px; font-size:15.5px; color:var(--ink-muted); font-weight:500; max-width:56ch; line-height:1.65; }

        /* Trust cards */
        .sunrise-therapists .trust{ margin-top:36px; display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .sunrise-therapists .tcard{ border-radius:22px; padding:24px; border:2px solid transparent; }
        .sunrise-therapists .tcard.a{ background:#EAF6EF; } .sunrise-therapists .tcard.b{ background:#FDEFE4; }
        .sunrise-therapists .tcard .ico{ width:44px; height:44px; border-radius:14px; background:#fff; display:flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:14px; }
        .sunrise-therapists .tcard h3{ font-size:15px; font-weight:800; margin:0 0 6px; color:var(--ink); }
        .sunrise-therapists .tcard p{ font-size:13px; font-weight:500; color:var(--ink-soft); line-height:1.6; margin:0; }

        /* Directory header */
        .sunrise-therapists .dir-head{ margin-top:48px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
        .sunrise-therapists .dir-title{ font-size:22px; font-weight:800; letter-spacing:-.01em; position:relative; display:inline-block; color:var(--ink); margin:0; }
        .sunrise-therapists .dir-title .underline{ width:60%; }
        .sunrise-therapists .filters{ display:flex; gap:8px; flex-wrap:wrap; }
        .sunrise-therapists .f{ border:2px solid var(--line); background:var(--card); color:var(--ink-soft); border-radius:100px; padding:9px 16px; font-family:inherit; font-size:12.5px; font-weight:700; cursor:pointer; transition:all .2s; }
        .sunrise-therapists .f:hover{ transform:translateY(-2px); }
        .sunrise-therapists .f.active{ background:var(--ink); border-color:var(--ink); color:#fff; }

        /* Cards */
        .sunrise-therapists .grid{ display:flex; flex-direction:column; gap:16px; }
        .sunrise-therapists .card{ background:var(--card); border:2px solid var(--line); border-radius:24px; padding:26px; transition:transform .25s, border-color .25s, box-shadow .25s; }
        .sunrise-therapists .card:hover{ transform:translateY(-4px); border-color:var(--lav); box-shadow:0 16px 40px rgba(59,54,99,.1); }
        .sunrise-therapists .top{ display:flex; align-items:flex-start; gap:16px; margin-bottom:14px; }
        .sunrise-therapists .avatar,
        .sunrise-therapists .avatar-img{ width:56px; height:56px; border-radius:20px; flex-shrink:0; }
        .sunrise-therapists .avatar{ display:flex; align-items:center; justify-content:center; font-size:19px; font-weight:800; }
        .sunrise-therapists .avatar-img{ object-fit:cover; }
        .sunrise-therapists .av-1{ background:var(--blush); color:#B05A1F; }
        .sunrise-therapists .av-2{ background:var(--mint);  color:#2E7D5B; }
        .sunrise-therapists .av-3{ background:var(--lav);   color:#5C4FA8; }
        .sunrise-therapists .av-4{ background:var(--sky);   color:#3E6FA8; }
        .sunrise-therapists .who{ flex:1; min-width:0; }
        .sunrise-therapists .name-row{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:5px; }
        .sunrise-therapists .name{ font-size:18px; font-weight:800; letter-spacing:-.01em; color:var(--ink); }
        .sunrise-therapists .verified{ display:inline-flex; align-items:center; gap:4px; font-size:10.5px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; padding:4px 11px; border-radius:100px; background:var(--mint); color:#2E7D5B; }
        .sunrise-therapists .meta{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:12.5px; font-weight:600; color:var(--ink-muted); }
        .sunrise-therapists .meta .dot{ opacity:.4; }
        .sunrise-therapists .about{ font-size:14px; font-weight:500; color:var(--ink-soft); line-height:1.65; margin:0 0 14px; }
        .sunrise-therapists .tags{ display:flex; flex-wrap:wrap; gap:7px; margin-bottom:16px; }
        .sunrise-therapists .tag{ font-size:11px; font-weight:700; padding:6px 13px; border-radius:100px; background:#fff; border:2px solid var(--line); color:var(--ink-soft); }
        .sunrise-therapists .quote{ background:#FFF7E3; border-radius:16px; padding:16px 18px; margin-bottom:16px; }
        .sunrise-therapists .quote .qt{ font-size:10px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#8A6D1B; margin-bottom:7px; }
        .sunrise-therapists .quote p{ font-size:14px; font-weight:500; font-style:italic; color:var(--ink-soft); line-height:1.65; margin:0; }
        .sunrise-therapists .actions{ display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
        .sunrise-therapists .book{ flex:1 1 160px; text-align:center; padding:12px; border-radius:100px; background:var(--blush); color:#C89372; font-size:12.5px; font-weight:800; cursor:not-allowed; user-select:none; }
        .sunrise-therapists .website{ display:inline-flex; align-items:center; gap:6px; padding:12px 20px; border-radius:100px; border:2px solid var(--line); background:#fff; color:var(--ink-soft); font-size:12.5px; font-weight:700; text-decoration:none; transition:all .2s; }
        .sunrise-therapists .website:hover{ border-color:var(--tc); color:var(--tc-2); }

        /* Skeleton */
        .sunrise-therapists .skeleton{ height:200px; border-radius:24px; background:var(--card); border:2px solid var(--line); animation:tSkel 1.4s ease-in-out infinite; }
        @keyframes tSkel{ 0%,100%{ opacity:1 } 50%{ opacity:.55 } }

        /* Empty */
        .sunrise-therapists .empty{ background:var(--card); border:2px dashed var(--line-strong); border-radius:24px; padding:56px 32px; text-align:center; }
        .sunrise-therapists .empty-icon{ font-size:40px; margin-bottom:14px; opacity:.5; }
        .sunrise-therapists .empty-title{ font-size:19px; font-weight:800; color:var(--ink); margin:0 0 8px; }
        .sunrise-therapists .empty-text{ font-size:14px; color:var(--ink-muted); font-weight:500; line-height:1.7; max-width:330px; margin:0 auto; }
        .sunrise-therapists .empty-cta{ margin-top:22px; background:var(--tc); color:#fff; border:none; border-radius:100px; padding:13px 24px; font-family:inherit; font-size:13.5px; font-weight:800; cursor:pointer; transition:transform .2s, box-shadow .2s; }
        .sunrise-therapists .empty-cta:hover{ transform:translateY(-2px); box-shadow:0 10px 26px rgba(244,129,63,.35); }

        /* CTA banner */
        .sunrise-therapists .cta{ margin-top:32px; background:var(--tc); border-radius:28px; padding:32px 36px; display:flex; align-items:center; justify-content:space-between; gap:24px; flex-wrap:wrap; position:relative; overflow:hidden; color:#fff; }
        .sunrise-therapists .cta-sun{ position:absolute; right:-50px; top:-70px; width:220px; height:220px; border-radius:50%; background:var(--yellow); opacity:.85; }
        .sunrise-therapists .cta-sun::after{ content:''; position:absolute; inset:30px; border-radius:50%; background:var(--tc); opacity:.25; }
        .sunrise-therapists .cta-copy{ position:relative; }
        .sunrise-therapists .cta h3{ font-size:22px; font-weight:800; letter-spacing:-.01em; margin:0 0 6px; }
        .sunrise-therapists .cta p{ font-size:14px; font-weight:500; opacity:.95; max-width:44ch; line-height:1.55; margin:0; }
        .sunrise-therapists .cta-btn{ position:relative; background:#fff; color:var(--tc-2); border:none; border-radius:100px; padding:15px 28px; font-family:inherit; font-size:14px; font-weight:800; cursor:pointer; transition:transform .2s, box-shadow .2s; flex-shrink:0; }
        .sunrise-therapists .cta-btn:hover{ transform:scale(1.05); box-shadow:0 12px 30px rgba(0,0,0,.2); }

        .sunrise-therapists .fade{ opacity:0; transform:translateY(16px); animation:sunFade .6s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes sunFade{ to{ opacity:1; transform:none } }
        @media (prefers-reduced-motion:reduce){
          .sunrise-therapists .fade{ animation:none; opacity:1; transform:none }
          .sunrise-therapists .skeleton{ animation:none }
        }
        @media (max-width:640px){
          .sunrise-therapists .wrap{ padding:36px 20px 90px; }
          .sunrise-therapists .trust{ grid-template-columns:1fr; }
          .sunrise-therapists .cta{ padding:28px 24px; }
        }
      `}</style>
    </main>
  )
}
