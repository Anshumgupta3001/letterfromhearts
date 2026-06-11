import { useState, useEffect, useCallback } from 'react'
import TherapistApplicationModal from '../components/TherapistApplicationModal'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')
const BD = 'rgba(28,26,23,0.08)'

// ── Avatar helpers ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: 'rgba(196,99,58,0.12)',  color: 'var(--tc)'     },
  { bg: 'rgba(122,158,142,0.15)',color: 'var(--sage)'   },
  { bg: 'rgba(139,126,200,0.12)',color: 'var(--purple)' },
  { bg: 'rgba(201,168,76,0.13)', color: 'var(--gold)'   },
  { bg: 'rgba(74,70,64,0.1)',    color: 'var(--ink-soft)'},
]

function avatarColor(name = '') {
  let sum = 0
  for (const c of name) sum += c.charCodeAt(0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function initials(firstName = '', lastName = '') {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function TherapistsSidebar({ activeFilter, onFilter, specializations, stats, onApply }) {
  const filters = ['All', ...specializations]

  return (
    <div
      className="border-r hidden md:flex flex-col gap-5 px-[18px] py-7 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto"
      style={{ borderColor: BD, background: 'rgba(247,242,234,0.4)' }}
    >
      {/* Filter by specialty - re-enable when directory grows
      <div className="text-[9.5px] tracking-[2px] uppercase font-medium text-ink-muted">
        Filter by specialty
      </div>
      <div className="flex flex-col gap-0.5">
        {filters.map(f => {
          const id     = f === 'All' ? 'all' : f
          const active = activeFilter === id
          return (
            <div
              key={id}
              onClick={() => onFilter(id)}
              className="flex items-center gap-2 px-[11px] py-[9px] rounded-lg cursor-pointer transition-all duration-150 select-none text-[13px] text-ink-soft"
              style={{
                background:  active ? 'var(--paper)' : 'transparent',
                border:      active ? '0.5px solid rgba(28,26,23,0.07)' : '0.5px solid transparent',
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: active ? 'var(--tc)' : 'var(--ink-muted)', opacity: active ? 1 : 0.4 }}
              />
              {f}
            </div>
          )
        })}
      </div>
      */}

      {/* Stats mini-cards - re-enable when directory grows
      {stats && (
        <div className="mt-1">
          <div className="text-[9.5px] tracking-[2px] uppercase font-medium text-ink-muted mb-3">
            Network
          </div>
          <div className="flex flex-col gap-2">
            {[
              { value: stats.verified,       label: 'Verified therapists' },
              { value: stats.regions,        label: 'Regions covered'     },
              { value: stats.specializations,label: 'Specializations'     },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-[10px] px-[11px] py-[10px]"
                style={{ background: 'var(--paper)', border: `0.5px solid ${BD}` }}
              >
                <div className="font-lora text-[22px] font-medium text-ink leading-none">{value}</div>
                <div className="text-[11px] text-ink-muted font-light mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      */}

    </div>
  )
}

// ── Therapist Card ────────────────────────────────────────────────────────────
function TherapistCard({ therapist }) {
  const { firstName, lastName, about, location, specializations,
          quote, website, bookingLink, sessionType, profileImage } = therapist
  const ac = avatarColor(`${firstName}${lastName}`)

  return (
    <div
      className="letter-card"
      style={{
        background: 'var(--paper)',
        border: `0.5px solid ${BD}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(28,26,23,0.04)',
        transition: 'box-shadow 0.2s',
        padding: '22px 24px',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(28,26,23,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(28,26,23,0.04)'}
    >
      {/* Header: avatar + name/meta */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 15, marginBottom: 16 }}>
        {profileImage
          ? <img
              src={profileImage}
              alt={`${firstName} ${lastName}`}
              style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `0.5px solid ${BD}` }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
            />
          : null}
        <div
          style={{
            width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
            background: ac.bg, color: ac.color,
            display: profileImage ? 'none' : 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 19, fontFamily: '"DM Sans", sans-serif', fontWeight: 600,
          }}
        >
          {initials(firstName, lastName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: '"Lora", serif', fontSize: 16.5, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.2px' }}>
              {firstName} {lastName}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0,
              fontSize: 10.5, fontWeight: 500, padding: '3px 9px', borderRadius: 100,
              background: 'rgba(196,99,58,0.08)', color: 'var(--tc)',
              border: '0.5px solid rgba(196,99,58,0.18)',
              fontFamily: '"DM Sans", sans-serif',
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Verified
            </span>
          </div>
          {(location || sessionType) && (
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
              {location && (
                <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {location}
                </span>
              )}
              {location && sessionType && <span style={{ fontSize: 11, color: 'var(--ink-muted)', opacity: 0.4 }}>·</span>}
              {sessionType && (
                <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
                  {sessionType}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* About */}
      {about && (
        <p style={{
          fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.75,
          fontFamily: '"DM Sans", sans-serif', margin: '0 0 14px',
        }}>
          {about}
        </p>
      )}

      {/* Specialization tags */}
      {specializations?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
          {specializations.map(s => (
            <span key={s} style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 100,
              background: 'rgba(28,26,23,0.04)', color: 'var(--ink-soft)',
              border: `0.5px solid ${BD}`, fontFamily: '"DM Sans", sans-serif',
            }}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Quote — testimonial highlight */}
      {quote && (
        <div style={{
          background: 'rgba(196,99,58,0.05)',
          border: '0.5px solid rgba(196,99,58,0.22)',
          borderLeft: '3px solid var(--tc)',
          borderRadius: 10,
          padding: '13px 16px',
          marginBottom: 18,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--tc)', fontFamily: '"DM Sans", sans-serif', marginBottom: 6, opacity: 0.75 }}>
            Why I recommend Letter from Heart
          </div>
          <p style={{
            fontFamily: 'Lora, serif', fontStyle: 'italic',
            fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.75, margin: 0,
          }}>
            "{quote}"
          </p>
        </div>
      )}

      {/* Actions */}
      {(bookingLink || website) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {bookingLink && (
            <span style={{
              flex: '1 1 140px', textAlign: 'center',
              padding: '9px 14px', borderRadius: 10,
              background: 'rgba(196,99,58,0.28)', color: 'rgba(255,255,255,0.55)',
              fontSize: 12.5, fontWeight: 500, fontFamily: '"DM Sans", sans-serif',
              cursor: 'not-allowed', userSelect: 'none', display: 'block',
            }}>
              Book a session (coming soon)
            </span>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '9px 15px', borderRadius: 10,
                border: `0.5px solid ${BD}`, background: 'transparent',
                color: 'var(--ink-soft)', fontSize: 12.5, fontFamily: '"DM Sans", sans-serif',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,26,23,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              Website
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyTherapists({ filter, onClear }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.35 }}>🔍</div>
      <div style={{ fontFamily: '"Lora", serif', fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
        {filter === 'all' ? 'No therapists yet' : `No therapists for "${filter}"`}
      </div>
      <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto 20px' }}>
        {filter === 'all'
          ? 'We\'re building our network. Check back soon.'
          : 'Try a different specialization or view all.'}
      </p>
      {filter !== 'all' && (
        <button
          onClick={onClear}
          style={{
            padding: '8px 20px', borderRadius: 100, fontSize: 12.5,
            fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
            background: 'transparent', color: 'var(--tc)',
            border: '0.5px solid rgba(196,99,58,0.3)',
          }}
        >
          View all therapists
        </button>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TherapistsPage() {
  const [therapists,     setTherapists]     = useState([])
  const [specializations,setSpecializations]= useState([])
  const [stats,          setStats]          = useState(null)
  const [activeFilter,   setActiveFilter]   = useState('all')
  const [loading,        setLoading]        = useState(true)
  const [modalOpen,      setModalOpen]      = useState(false)

  const BD_LINE = '#E0D4BC'

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
    } catch { /* network error - fail silently, show empty state */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const fetchFiltered = useCallback(async (filter) => {
    setLoading(true)
    try {
      const url = filter === 'all' ? `${API}/api/therapists` : `${API}/api/therapists?specialization=${encodeURIComponent(filter)}`
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

  return (
    <>
      <div className="min-h-[calc(100vh-56px)]">

        {/* Main content */}
        <div className="page-enter px-4 sm:px-6 md:px-10 lg:px-16 py-6 md:py-8 max-w-3xl mx-auto" style={{ minWidth: 0 }}>

          {/* ── Hero ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
              <span style={{ width: 18, height: 1, background: BD_LINE, display: 'inline-block' }} />
              For professionals
            </div>
            <h1 style={{ fontFamily: '"Lora", serif', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15, letterSpacing: '-0.5px', marginBottom: 10 }}>
              Therapists who recommend<br />Letter from Heart
            </h1>
            <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.7, maxWidth: 480 }}>
              These professionals use Letter from Heart as a complementary tool alongside their practice - for expressive writing, emotional processing, and human connection.
            </p>
          </div>

          {/* ── Stats row - re-enable when directory grows ──────────── */}
          {/* {stats && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { n: stats.verified,       l: 'Verified therapists' },
                { n: stats.regions,        l: 'Regions covered'     },
                { n: stats.specializations,l: 'Specializations'     },
              ].map(({ n, l }) => (
                <div
                  key={l}
                  className="stat-card rounded-[12px] p-4 text-center"
                  style={{ background: 'var(--paper)', border: `0.5px solid ${BD}` }}
                >
                  <div className="font-lora text-[26px] md:text-[30px] font-medium text-ink leading-none mb-1">
                    {n}
                  </div>
                  <div className="text-[11px] text-ink-muted" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                    {l}
                  </div>
                </div>
              ))}
            </div>
          )} */}

          {/* ── Trust row ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {[
              { icon: '🔒', title: 'Manual verification', body: 'Every therapist is personally reviewed. We verify credentials and license numbers before any profile goes live.' },
              { icon: '✦', title: 'Complementary care', body: 'These therapists actively recommend letter-writing as an expressive tool alongside professional therapy - not as a replacement.' },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="rounded-[12px] p-4"
                style={{ background: 'rgba(28,26,23,0.025)', border: `0.5px solid ${BD}` }}
              >
                <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 4, fontFamily: '"DM Sans", sans-serif' }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.55, fontFamily: '"DM Sans", sans-serif' }}>{body}</div>
              </div>
            ))}
          </div>

          {/* ── Directory header + filter pills ──────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div style={{ fontFamily: '"Lora", serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
              Browse therapists
            </div>
            {/* <button
              onClick={() => setModalOpen(true)}
              style={{
                padding: '8px 18px', borderRadius: 100, fontSize: 12.5,
                fontFamily: '"DM Sans", sans-serif', fontWeight: 500, cursor: 'pointer',
                background: 'var(--tc)', color: '#fff', border: 'none',
                boxShadow: '0 2px 10px rgba(196,99,58,0.25)',
                transition: 'opacity 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(196,99,58,0.32)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(196,99,58,0.25)' }}
            >
              Apply to join
            </button> */}
          </div>

          {/* Mobile filter pills */}
          <div className="flex md:hidden gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
            {['All', ...specializations].map(f => {
              const id     = f === 'All' ? 'all' : f
              const active = activeFilter === id
              return (
                <button
                  key={id}
                  onClick={() => handleFilter(id)}
                  style={{
                    padding: '6px 14px', borderRadius: 100, fontSize: 12, whiteSpace: 'nowrap',
                    fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                    border: `1px solid ${active ? 'var(--tc)' : 'rgba(28,26,23,0.12)'}`,
                    background: active ? 'rgba(196,99,58,0.1)' : 'transparent',
                    color: active ? 'var(--tc)' : 'var(--ink-muted)',
                    flexShrink: 0,
                  }}
                >
                  {f}
                </button>
              )
            })}
          </div>

          {/* ── Therapist directory ───────────────────────────────── */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="rounded-[14px] animate-pulse"
                  style={{ height: 200, background: 'rgba(28,26,23,0.04)', border: `0.5px solid ${BD}` }}
                />
              ))}
            </div>
          ) : therapists.length === 0 ? (
            <EmptyTherapists filter={activeFilter} onClear={() => handleFilter('all')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {therapists.map(t => (
                <TherapistCard key={t._id} therapist={t} />
              ))}
            </div>
          )}

          {/* ── Apply CTA banner ─────────────────────────────────── */}
          {!loading && (
            <div
              className="rounded-[14px] mt-8 p-5 sm:p-6 flex items-center justify-between gap-4 flex-wrap"
              style={{ background: 'rgba(196,99,58,0.05)', border: '0.5px solid rgba(196,99,58,0.18)' }}
            >
              <div>
                <div style={{ fontFamily: '"Lora", serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                  Are you a therapist?
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', lineHeight: 1.55 }}>
                  Join our growing network of professionals who recommend Letter from Heart alongside their practice.
                </div>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  flexShrink: 0, padding: '10px 24px', borderRadius: 100,
                  background: 'var(--tc)', color: '#fff',
                  fontSize: 13, fontWeight: 500, fontFamily: '"DM Sans", sans-serif',
                  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Apply to join
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Application Modal */}
      {modalOpen && <TherapistApplicationModal onClose={() => setModalOpen(false)} />}
    </>
  )
}
