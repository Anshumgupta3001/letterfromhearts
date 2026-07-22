// src/pages/FocusPage.jsx
// ─────────────────────────────────────────────────────────────────
// Focus — "the listening room". Editorial split hero with slow
// watercolor shapes, a featured session with atmospheric
// photography, paper-label category filters, and collectible
// listening cards. Playback queues inside the selected category
// via the global player (see FocusPlayerContext).
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useFocusPlayer } from '../context/FocusPlayerContext'
import { FOCUS_TRACKS, FOCUS_CATEGORIES } from '../data/focusTracks'

const serif = '"Inter", system-ui, sans-serif'
const sans  = '"Inter", system-ui, sans-serif'

// Subtle paper grain, used over photos and blobs
const GRAIN =
  'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\'/%3E%3C/filter%3E%3Crect width=\'120\' height=\'120\' filter=\'url(%23n)\' opacity=\'0.05\'/%3E%3C/svg%3E")'

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate:    { opacity: 1, y: 0,  filter: 'blur(0px)' },
  transition: { duration: 0.7, delay, ease: [0.22, 0.61, 0.36, 1] },
})

// ── Animated waveform (active track) ─────────────────────────────
function Waveform({ color = 'var(--tc)', playing }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2.5, height: 16 }}>
      {[9, 15, 11, 16, 8].map((h, i) => (
        <span key={i} style={{
          width: 2.5, height: h, borderRadius: 2, background: color,
          transformOrigin: 'center',
          animation: playing ? `focusWave 1.1s ease-in-out ${i * 0.13}s infinite alternate` : 'none',
          opacity: playing ? 0.9 : 0.4,
        }} />
      ))}
    </span>
  )
}

// ── Play / pause glyph ────────────────────────────────────────────
function PlayGlyph({ playing, size = 13 }) {
  return playing ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: size / 6 }}><polygon points="6 3 20 12 6 21 6 3"/></svg>
  )
}

// ── Watercolor hero shapes ────────────────────────────────────────
function HeroArt() {
  const shapes = [
    { size: 240, top: 12,  right: 30,  hue: 'rgba(244,129,63,0.5)',  dur: 38, dx: -10, dy: 12, r: '62% 38% 54% 46% / 48% 60% 40% 52%' },
    { size: 150, top: 130, right: 190, hue: 'rgba(224,107,40,0.45)', dur: 46, dx: 12,  dy: -9, r: '45% 55% 60% 40% / 55% 45% 55% 45%' },
    { size: 95,  top: 30,  right: 225, hue: 'rgba(122,140,101,0.4)', dur: 30, dx: -7,  dy: -10, r: '58% 42% 40% 60% / 50% 55% 45% 50%' },
    { size: 70,  top: 195, right: 90,  hue: 'rgba(138,90,68,0.35)',  dur: 52, dx: 8,   dy: 7,  r: '50% 50% 62% 38% / 42% 58% 42% 58%' },
  ]
  return (
    <div aria-hidden style={{ position: 'relative', height: 300, minWidth: 0 }}>
      {shapes.map((s, i) => (
        <motion.div
          key={i}
          animate={{ x: [0, s.dx, -s.dx * 0.6, 0], y: [0, s.dy, -s.dy * 0.5, 0], rotate: [0, 2.5, -1.5, 0] }}
          transition={{ duration: s.dur, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: s.top, right: s.right,
            width: s.size, height: s.size, borderRadius: s.r,
            background: `radial-gradient(circle at 32% 28%, ${s.hue}, transparent 72%)`,
            filter: 'blur(1px)',
            mixBlendMode: 'multiply',
          }}
        />
      ))}
      {/* paper grain over the art */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, pointerEvents: 'none' }} />
    </div>
  )
}

// ── Featured session ──────────────────────────────────────────────
function FeaturedSession({ track, queue }) {
  const { currentTrack, isPlaying, play } = useFocusPlayer()
  const [hov, setHov] = useState(false)
  const playing = currentTrack?.id === track.id && isPlaying
  const catLabel = FOCUS_CATEGORIES.find(c => c.id === track.category)?.label

  return (
    <motion.div
      {...fadeUp(0.15)}
      onClick={() => play(track, queue)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="lfh-featured"
      style={{
        display: 'grid', gridTemplateColumns: '1.5fr 1fr',
        background: 'var(--paper)', borderRadius: 24,
        border: '1px solid rgba(59,54,99,0.08)',
        overflow: 'hidden', cursor: 'pointer', marginBottom: 56,
        boxShadow: hov ? '0 22px 60px rgba(26,18,8,0.12)' : '0 10px 40px rgba(26,18,8,0.06)',
        transition: 'box-shadow 0.35s ease',
      }}
    >
      {/* Copy */}
      <div style={{ padding: 'clamp(26px, 4vw, 44px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 600, letterSpacing: '2.2px', textTransform: 'uppercase', color: 'var(--tc)', fontFamily: sans, marginBottom: 16 }}>
          <span style={{ width: 20, height: 1, background: 'var(--tc)', opacity: 0.5 }} />
          Featured session
        </div>
        <h2 style={{ fontFamily: serif, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.5px', lineHeight: 1.15, marginBottom: 10 }}>
          {track.title}
        </h2>
        <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.75, margin: '0 0 18px', maxWidth: 360 }}>
          {track.subtitle}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <button
            aria-label={playing ? 'Pause featured session' : 'Play featured session'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '11px 22px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: 'var(--tc)', color: '#fff',
              fontFamily: sans, fontSize: 13, fontWeight: 500, letterSpacing: '0.2px',
              boxShadow: hov ? '0 8px 24px rgba(244,129,63,0.35)' : '0 4px 14px rgba(244,129,63,0.25)',
              transform: hov ? 'translateY(-1px)' : 'none',
              transition: 'box-shadow 0.25s, transform 0.25s',
            }}
          >
            <PlayGlyph playing={playing} size={12} />
            {playing ? 'Pause' : 'Begin listening'}
          </button>
          <span style={{ fontFamily: sans, fontSize: 12, color: 'var(--ink-muted)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            {playing && <Waveform playing />}
            {track.duration} · {catLabel} · loops onward
          </span>
        </div>
      </div>

      {/* Photograph */}
      <div className="lfh-featured-img" style={{ position: 'relative', minHeight: 220, background: track.gradient, overflow: 'hidden' }}>
        <img
          src={track.image} alt="" loading="lazy"
          onError={e => { e.currentTarget.style.display = 'none' }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            transform: hov ? 'scale(1.045)' : 'scale(1)',
            transition: 'transform 1.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
        />
        {/* warm overlay + gradient toward the copy side */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.25) 0%, rgba(60,35,18,0.05) 30%, rgba(40,22,10,0.28) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, pointerEvents: 'none' }} />
      </div>
    </motion.div>
  )
}

// ── Listening card ────────────────────────────────────────────────
function TrackCard({ track, queue, index }) {
  const { currentTrack, isPlaying, play } = useFocusPlayer()
  const [hov, setHov] = useState(false)

  const isActive      = currentTrack?.id === track.id
  const isThisPlaying = isActive && isPlaying

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.045, 0.45), ease: [0.22, 0.61, 0.36, 1] }}
      onClick={() => play(track, queue)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--paper)', borderRadius: 18,
        border: `1px solid ${isActive ? 'rgba(244,129,63,0.45)' : 'rgba(59,54,99,0.09)'}`,
        overflow: 'hidden', cursor: 'pointer', position: 'relative',
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov
          ? '0 16px 44px rgba(26,18,8,0.11)'
          : isActive
            ? '0 6px 26px rgba(244,129,63,0.16)'
            : '0 2px 10px rgba(26,18,8,0.04)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Atmospheric image */}
      <div style={{ position: 'relative', height: 118, background: track.gradient, overflow: 'hidden' }}>
        <img
          src={track.image} alt="" loading="lazy"
          onError={e => { e.currentTarget.style.display = 'none' }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            transform: hov ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 1.2s cubic-bezier(0.22, 0.61, 0.36, 1)',
            filter: 'saturate(0.85)',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(40,22,10,0.05) 40%, rgba(40,22,10,0.32) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, pointerEvents: 'none' }} />

        {/* Playing badge */}
        {isThisPlaying && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(255,255,255,0.92)', color: 'var(--tc)', fontFamily: sans,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--tc)', animation: 'focusBlink 1.6s ease-in-out infinite' }} />
            Playing
          </span>
        )}

        {/* Play button */}
        <div style={{
          position: 'absolute', right: 12, bottom: 12,
          width: 36, height: 36, borderRadius: '50%',
          background: isThisPlaying ? 'var(--ink)' : 'rgba(255,255,255,0.94)',
          color: isThisPlaying ? '#fff' : 'var(--tc)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(59,54,99,0.28)',
          transform: hov ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.2s, background 0.2s, color 0.2s',
        }}>
          <PlayGlyph playing={isThisPlaying} size={12} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '15px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontFamily: serif, fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.2px' }}>
            {track.title}
          </div>
          {isActive && <Waveform playing={isThisPlaying} />}
        </div>
        <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.6, margin: '5px 0 0', minHeight: 36 }}>
          {track.subtitle}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 11, color: 'var(--ink-muted)', fontFamily: sans }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.55 }}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          {track.duration}
        </div>
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────
export default function FocusPage() {
  const [category, setCategory] = useState('all')
  const { currentTrack, updateQueue } = useFocusPlayer()

  const filtered = useMemo(
    () => category === 'all' ? FOCUS_TRACKS : FOCUS_TRACKS.filter(t => t.category === category),
    [category],
  )

  // Category change rebuilds the playback queue immediately
  useEffect(() => {
    if (currentTrack) updateQueue(filtered)
  }, [filtered]) // eslint-disable-line react-hooks/exhaustive-deps

  const featured = FOCUS_TRACKS[0]

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px) 140px' }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="lfh-hero" style={{
        display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 40,
        alignItems: 'center', padding: '56px 0 60px',
      }}>
        <div>
          <motion.div {...fadeUp(0)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 10.5, fontWeight: 600, letterSpacing: '2.2px', textTransform: 'uppercase',
            color: 'var(--tc)', fontFamily: sans, marginBottom: 18,
          }}>
            <span style={{ width: 22, height: 1, background: 'var(--tc)', opacity: 0.5 }} />
            A quiet space
          </motion.div>
          <motion.h1 {...fadeUp(0.08)} style={{
            fontFamily: serif, fontSize: 'clamp(32px, 4.6vw, 46px)', fontWeight: 700,
            color: 'var(--ink)', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 16,
          }}>
            Find your <em style={{ color: 'var(--tc)' }}>focus.</em>
          </motion.h1>
          <motion.p {...fadeUp(0.16)} style={{
            fontFamily: serif, fontStyle: 'italic', fontSize: 15.5,
            color: 'var(--ink-soft)', lineHeight: 1.8, maxWidth: 420, margin: 0,
          }}>
            Soundscapes to write, reflect, work, and simply be. Start listening once—the music follows you everywhere on Letter from Heart.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.2 }}
          className="lfh-hero-art"
        >
          <HeroArt />
        </motion.div>
      </div>

      {/* ── Featured session ─────────────────────────────────── */}
      <FeaturedSession track={featured} queue={FOCUS_TRACKS} />

      {/* ── Category pills ───────────────────────────────────── */}
      <motion.div {...fadeUp(0.05)} style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 26 }}>
        {FOCUS_CATEGORIES.map(c => {
          const active = category === c.id
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              style={{
                padding: '8px 17px', borderRadius: 999, fontSize: 12.5,
                fontFamily: sans, fontWeight: active ? 500 : 400,
                cursor: 'pointer',
                background: active ? 'var(--tc)' : 'var(--paper)',
                color:      active ? '#fff' : 'var(--ink-soft)',
                border:     active ? '1px solid var(--tc)' : '1px solid rgba(59,54,99,0.12)',
                boxShadow:  active ? '0 4px 14px rgba(244,129,63,0.25)' : '0 1px 4px rgba(26,18,8,0.05)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(26,18,8,0.09)' } }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = active ? '0 4px 14px rgba(244,129,63,0.25)' : '0 1px 4px rgba(26,18,8,0.05)' }}
            >
              {c.label}
            </button>
          )
        })}
      </motion.div>

      {/* ── Track grid ───────────────────────────────────────── */}
      <div key={category} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: 18,
      }}>
        {filtered.map((t, i) => <TrackCard key={t.id} track={t} queue={filtered} index={i} />)}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--ink-muted)', fontFamily: serif, fontStyle: 'italic', fontSize: 14 }}>
          Nothing here yet — more sounds coming soon.
        </div>
      )}

      <style>{`
        @keyframes focusWave {
          from { transform: scaleY(0.45); }
          to   { transform: scaleY(1.15); }
        }
        @keyframes focusBlink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
        @media (max-width: 760px) {
          .lfh-hero { grid-template-columns: 1fr !important; padding: 36px 0 36px !important; gap: 8px !important; }
          .lfh-hero-art { display: none; }
          .lfh-featured { grid-template-columns: 1fr !important; }
          .lfh-featured-img { order: -1; min-height: 170px !important; }
        }
      `}</style>
    </div>
  )
}
