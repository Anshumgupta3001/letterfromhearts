import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')

const BD = 'rgba(28,26,23,0.1)'

const INPUT_STYLE = {
  width: '100%', padding: '10px 13px', borderRadius: 10,
  fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink)',
  outline: 'none', background: 'rgba(253,249,243,0.95)',
  border: `1.5px solid ${BD}`,
  transition: 'border-color 0.18s', boxSizing: 'border-box',
}
const LABEL_STYLE = {
  fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.2px',
  fontWeight: 600, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif',
  marginBottom: 6, display: 'block',
}

const SPECIALIZATION_OPTIONS = [
  'Grief', 'Anxiety', 'Depression', 'Trauma', 'PTSD', 'Relationships',
  'Couples', 'Family', 'Communication', 'Life Transitions', 'Expressive Writing',
  'Loneliness', 'Burnout', 'Self-esteem', 'Addiction', 'LGBTQ+',
]

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Mandarin', 'Hindi',
  'Arabic', 'Portuguese', 'Japanese', 'Korean', 'Italian', 'Russian',
]

const SESSION_TYPE_OPTIONS = ['In-person', 'Online', 'In-person & Online']

function TagSelect({ options, selected, onChange, placeholder }) {
  const [custom, setCustom] = useState('')

  function toggle(val) {
    if (selected.includes(val)) onChange(selected.filter(s => s !== val))
    else onChange([...selected, val])
  }

  function addCustom(e) {
    e.preventDefault()
    const v = custom.trim()
    if (v && !selected.includes(v)) onChange([...selected, v])
    setCustom('')
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {options.map(opt => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              style={{
                padding: '4px 12px', borderRadius: 100, fontSize: 12,
                fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                transition: 'all 0.12s',
                background: active ? 'var(--tc)' : 'var(--paper)',
                color: active ? '#fff' : 'var(--ink-soft)',
                border: active ? '1.5px solid var(--tc)' : `1.5px solid ${BD}`,
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {selected.filter(s => !options.includes(s)).map(s => (
        <button
          key={s}
          type="button"
          onClick={() => toggle(s)}
          style={{
            padding: '4px 12px', borderRadius: 100, fontSize: 12,
            fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
            background: 'var(--tc)', color: '#fff',
            border: '1.5px solid var(--tc)', marginRight: 6, marginBottom: 6,
          }}
        >
          {s} ×
        </button>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <input
          type="text"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addCustom(e) }}
          placeholder={placeholder || 'Add custom…'}
          style={{ ...INPUT_STYLE, flex: 1, padding: '7px 11px', fontSize: 12 }}
        />
        <button
          type="button"
          onClick={addCustom}
          style={{
            padding: '7px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
            background: 'var(--paper)', border: `1.5px solid ${BD}`,
            color: 'var(--ink-soft)', fontFamily: '"DM Sans", sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

export default function TherapistApplicationModal({ onClose }) {
  const { authUser } = useApp()
  const overlayRef  = useRef(null)

  const [form, setForm] = useState({
    firstName:       '',
    lastName:        '',
    email:           authUser?.email || '',
    phone:           '',
    website:         '',
    bookingLink:     '',
    location:        '',
    about:           '',
    quote:           '',
    profileImage:    '',
    licenseNumber:   '',
    sessionType:     '',
    specializations: [],
    languages:       [],
  })
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.firstName.trim())     return setError('First name is required.')
    if (!form.lastName.trim())      return setError('Last name is required.')
    if (!form.email.trim())         return setError('Email is required.')
    if (!form.location.trim())      return setError('Location is required.')
    if (!form.licenseNumber.trim()) return setError('License number is required.')
    if (!form.about.trim())         return setError('Please tell us about your practice.')

    setLoading(true)
    try {
      const res  = await fetch(`${API}/api/therapists/apply`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        setSubmitted(true)
      } else {
        setError(json.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose()
  }

  if (submitted) {
    return (
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(28,26,23,0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div
          className="animate-fade-up"
          style={{
            background: 'var(--paper)', borderRadius: 18,
            border: '0.5px solid rgba(28,26,23,0.09)',
            boxShadow: '0 24px 72px rgba(28,26,23,0.18)',
            maxWidth: 420, width: '100%',
            padding: '48px 32px', textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 18 }}>💌</div>
          <h2 style={{ fontFamily: '"Lora", serif', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, letterSpacing: '-0.3px' }}>
            Application received
          </h2>
          <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 28 }}>
            Thank you for joining our therapist network. We'll review your application and reach out within a few business days.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '11px 28px', borderRadius: 100,
              background: 'var(--tc)', color: '#fff',
              border: 'none', cursor: 'pointer',
              fontSize: 13.5, fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
            }}
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(28,26,23,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '24px 16px',
      }}
    >
      <div
        className="animate-fade-up"
        style={{
          background: 'var(--paper)', borderRadius: 18,
          border: '0.5px solid rgba(28,26,23,0.09)',
          boxShadow: '0 24px 72px rgba(28,26,23,0.18)',
          width: '100%', maxWidth: 620,
          marginBottom: 24,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '22px 24px 18px',
          borderBottom: '0.5px solid rgba(28,26,23,0.07)',
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--tc)', marginBottom: 6, fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
              For professionals
            </div>
            <h2 style={{ fontFamily: '"Lora", serif', fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>
              Apply to join our therapist network
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', lineHeight: 1.5 }}>
              Applications are reviewed manually. Approved therapists appear in the public directory.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0, marginLeft: 16,
              width: 32, height: 32, borderRadius: 8,
              border: '0.5px solid rgba(28,26,23,0.1)',
              background: 'rgba(28,26,23,0.04)', color: 'var(--ink-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20, lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL_STYLE}>First Name *</label>
                <input
                  style={INPUT_STYLE}
                  type="text"
                  value={form.firstName}
                  onChange={set('firstName')}
                  placeholder="Sarah"
                  maxLength={60}
                  onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.45)'}
                  onBlur={e => e.target.style.borderColor = BD}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Last Name *</label>
                <input
                  style={INPUT_STYLE}
                  type="text"
                  value={form.lastName}
                  onChange={set('lastName')}
                  placeholder="Reynolds"
                  maxLength={60}
                  onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.45)'}
                  onBlur={e => e.target.style.borderColor = BD}
                />
              </div>
            </div>

            {/* Email + Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL_STYLE}>Email *</label>
                <input
                  style={INPUT_STYLE}
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@practice.com"
                  maxLength={120}
                  onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.45)'}
                  onBlur={e => e.target.style.borderColor = BD}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Phone</label>
                <input
                  style={INPUT_STYLE}
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+1 (555) 000-0000"
                  maxLength={30}
                  onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.45)'}
                  onBlur={e => e.target.style.borderColor = BD}
                />
              </div>
            </div>

            {/* Website + Booking */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL_STYLE}>Website</label>
                <input
                  style={INPUT_STYLE}
                  type="url"
                  value={form.website}
                  onChange={set('website')}
                  placeholder="https://yourpractice.com"
                  maxLength={200}
                  onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.45)'}
                  onBlur={e => e.target.style.borderColor = BD}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Booking Link</label>
                <input
                  style={INPUT_STYLE}
                  type="url"
                  value={form.bookingLink}
                  onChange={set('bookingLink')}
                  placeholder="https://calendly.com/you"
                  maxLength={200}
                  onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.45)'}
                  onBlur={e => e.target.style.borderColor = BD}
                />
              </div>
            </div>

            {/* Location + License */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL_STYLE}>Location *</label>
                <input
                  style={INPUT_STYLE}
                  type="text"
                  value={form.location}
                  onChange={set('location')}
                  placeholder="New York, NY"
                  maxLength={100}
                  onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.45)'}
                  onBlur={e => e.target.style.borderColor = BD}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>License Number *</label>
                <input
                  style={INPUT_STYLE}
                  type="text"
                  value={form.licenseNumber}
                  onChange={set('licenseNumber')}
                  placeholder="NY Lic. #PSY-00000"
                  maxLength={80}
                  onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.45)'}
                  onBlur={e => e.target.style.borderColor = BD}
                />
              </div>
            </div>

            {/* Session type */}
            <div>
              <label style={LABEL_STYLE}>Session Type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SESSION_TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, sessionType: opt }))}
                    style={{
                      padding: '6px 16px', borderRadius: 100, fontSize: 12,
                      fontFamily: '"DM Sans", sans-serif', cursor: 'pointer', transition: 'all 0.12s',
                      background: form.sessionType === opt ? 'var(--tc)' : 'var(--paper)',
                      color: form.sessionType === opt ? '#fff' : 'var(--ink-soft)',
                      border: form.sessionType === opt ? '1.5px solid var(--tc)' : `1.5px solid ${BD}`,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Specializations */}
            <div>
              <label style={LABEL_STYLE}>Specializations</label>
              <TagSelect
                options={SPECIALIZATION_OPTIONS}
                selected={form.specializations}
                onChange={v => setForm(f => ({ ...f, specializations: v }))}
                placeholder="Add specialization…"
              />
            </div>

            {/* Languages */}
            <div>
              <label style={LABEL_STYLE}>Languages</label>
              <TagSelect
                options={LANGUAGE_OPTIONS}
                selected={form.languages}
                onChange={v => setForm(f => ({ ...f, languages: v }))}
                placeholder="Add language…"
              />
            </div>

            {/* About */}
            <div>
              <label style={LABEL_STYLE}>About Your Practice *</label>
              <textarea
                style={{ ...INPUT_STYLE, minHeight: 90, resize: 'vertical', lineHeight: 1.6 }}
                value={form.about}
                onChange={set('about')}
                placeholder="Describe your background, approach, and how you support clients…"
                maxLength={1200}
                onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.45)'}
                onBlur={e => e.target.style.borderColor = BD}
              />
              <div style={{ textAlign: 'right', fontSize: 10.5, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', marginTop: 3 }}>
                {form.about.length}/1200
              </div>
            </div>

            {/* Quote about LFH */}
            <div>
              <label style={LABEL_STYLE}>Your Quote About Letter from Heart</label>
              <textarea
                style={{ ...INPUT_STYLE, minHeight: 70, resize: 'vertical', lineHeight: 1.6 }}
                value={form.quote}
                onChange={set('quote')}
                placeholder="How do you recommend Letter from Heart to your clients?"
                maxLength={400}
                onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.45)'}
                onBlur={e => e.target.style.borderColor = BD}
              />
              <div style={{ textAlign: 'right', fontSize: 10.5, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', marginTop: 3 }}>
                {form.quote.length}/400
              </div>
            </div>

            {/* Profile image URL — commented out for now
            <div>
              <label style={LABEL_STYLE}>Profile Photo URL</label>
              <input
                style={INPUT_STYLE}
                type="url"
                value={form.profileImage}
                onChange={set('profileImage')}
                placeholder="https://… (link to a professional headshot)"
                maxLength={500}
                onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.45)'}
                onBlur={e => e.target.style.borderColor = BD}
              />
              <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif' }}>
                Link to a publicly accessible image (LinkedIn, your website, etc.)
              </p>
            </div>
            */}

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(196,99,58,0.07)', border: '0.5px solid rgba(196,99,58,0.25)',
                borderRadius: 10, padding: '11px 14px',
                fontSize: 13, color: 'var(--tc)', fontFamily: '"DM Sans", sans-serif',
              }}>
                {error}
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 8, borderTop: '0.5px solid rgba(28,26,23,0.07)' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', lineHeight: 1.55 }}>
                🔒 Your application is reviewed privately. We'll email you once a decision is made.
              </p>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 20px', borderRadius: 100, fontSize: 13,
                    fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                    background: 'transparent', color: 'var(--ink-muted)',
                    border: '0.5px solid rgba(28,26,23,0.15)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 26px', borderRadius: 100, fontSize: 13,
                    fontFamily: '"DM Sans", sans-serif', fontWeight: 500, cursor: loading ? 'default' : 'pointer',
                    background: loading ? 'rgba(196,99,58,0.5)' : 'var(--tc)', color: '#fff',
                    border: 'none', transition: 'background 0.15s',
                  }}
                >
                  {loading ? 'Submitting…' : 'Submit application'}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
