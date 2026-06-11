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

function TypeaheadTagSelect({ options, selected, onChange, placeholder }) {
  const [query,       setQuery]       = useState('')
  const [open,        setOpen]        = useState(false)
  const [customMode,  setCustomMode]  = useState(false)
  const [customVal,   setCustomVal]   = useState('')

  const suggestions = options.filter(
    o => !selected.includes(o) && o.toLowerCase().includes(query.toLowerCase())
  )

  function add(val) {
    const v = val.trim()
    if (v && !selected.includes(v)) onChange([...selected, v])
    setQuery('')
    setOpen(false)
  }

  function addCustom(e) {
    e.preventDefault()
    const v = customVal.trim()
    if (v && !selected.includes(v)) onChange([...selected, v])
    setCustomVal('')
    setCustomMode(false)
  }

  function remove(val) {
    onChange(selected.filter(s => s !== val))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0) add(suggestions[0])
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {selected.map(s => (
            <span
              key={s}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 100, fontSize: 12,
                fontFamily: '"DM Sans", sans-serif',
                background: 'var(--tc)', color: '#fff',
                border: '1.5px solid var(--tc)',
              }}
            >
              {s}
              <button
                type="button"
                onClick={() => remove(s)}
                style={{
                  background: 'none', border: 'none', color: '#fff',
                  cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1,
                  opacity: 0.8, display: 'flex', alignItems: 'center',
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={e => { setOpen(true); e.target.style.borderColor = 'rgba(196,99,58,0.45)' }}
        onBlur={e => { e.target.style.borderColor = BD; setTimeout(() => setOpen(false), 150) }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Type to search…'}
        style={{ ...INPUT_STYLE, fontSize: 13 }}
      />

      {open && (suggestions.length > 0 || true) && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
          background: 'var(--paper)', borderRadius: 10,
          border: `1.5px solid rgba(196,99,58,0.3)`,
          boxShadow: '0 8px 24px rgba(28,26,23,0.1)',
          overflow: 'hidden',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {suggestions.map(s => (
            <div
              key={s}
              onMouseDown={() => add(s)}
              style={{
                padding: '9px 13px', fontSize: 13, fontFamily: '"DM Sans", sans-serif',
                color: 'var(--ink)', cursor: 'pointer',
                borderBottom: `0.5px solid rgba(28,26,23,0.05)`,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,99,58,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {s}
            </div>
          ))}
          <div
            onMouseDown={e => { e.preventDefault(); setOpen(false); setCustomMode(true) }}
            style={{
              padding: '9px 13px', fontSize: 12.5, fontFamily: '"DM Sans", sans-serif',
              color: 'var(--ink-muted)', cursor: 'pointer',
              borderTop: suggestions.length > 0 ? `0.5px solid rgba(28,26,23,0.08)` : 'none',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,99,58,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>+</span>
            Other — type your own
          </div>
        </div>
      )}

      {customMode && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input
            type="text"
            value={customVal}
            onChange={e => setCustomVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCustom(e); if (e.key === 'Escape') { setCustomMode(false); setCustomVal('') } }}
            placeholder="Type and click Add…"
            autoFocus
            style={{ ...INPUT_STYLE, flex: 1, padding: '8px 11px', fontSize: 12.5 }}
            onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.45)'}
            onBlur={e => e.target.style.borderColor = BD}
          />
          <button
            type="button"
            onClick={addCustom}
            style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 12.5, cursor: 'pointer',
              background: 'var(--tc)', border: 'none',
              color: '#fff', fontFamily: '"DM Sans", sans-serif', whiteSpace: 'nowrap',
              fontWeight: 500,
            }}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setCustomMode(false); setCustomVal('') }}
            style={{
              padding: '8px 10px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
              background: 'var(--paper)', border: `1.5px solid ${BD}`,
              color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif',
            }}
          >
            ×
          </button>
        </div>
      )}
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

    if (!form.firstName.trim())           return setError('First name is required.')
    if (!form.lastName.trim())            return setError('Last name is required.')
    if (!form.email.trim())               return setError('Email is required.')
    if (!form.phone.trim())               return setError('Phone number is required.')
    if (!form.website.trim())             return setError('Website is required.')
    if (!form.bookingLink.trim())         return setError('Booking link is required.')
    if (!form.location.trim())            return setError('Location is required.')
    if (!form.sessionType)                return setError('Please select a session type.')
    if (!form.specializations.length)     return setError('Please select at least one specialization.')
    if (!form.about.trim())               return setError('Please tell us about your practice.')
    if (!form.quote.trim())               return setError('Your quote about Letter from Heart is required.')
    if (!form.profileImage.trim())        return setError('Profile photo URL is required.')
    if (!form.languages.length)           return setError('Please select at least one language.')

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
                <label style={LABEL_STYLE}>Phone *</label>
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
                <label style={LABEL_STYLE}>Website *</label>
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
                <label style={LABEL_STYLE}>Booking Link *</label>
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
                <label style={LABEL_STYLE}>License Number</label>
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
              <label style={LABEL_STYLE}>Session Type *</label>
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
              <label style={LABEL_STYLE}>Specializations *</label>
              <TypeaheadTagSelect
                options={SPECIALIZATION_OPTIONS}
                selected={form.specializations}
                onChange={v => setForm(f => ({ ...f, specializations: v }))}
                placeholder="Select a specialization…"
              />
            </div>

            {/* Languages */}
            <div>
              <label style={LABEL_STYLE}>Languages *</label>
              <TypeaheadTagSelect
                options={LANGUAGE_OPTIONS}
                selected={form.languages}
                onChange={v => setForm(f => ({ ...f, languages: v }))}
                placeholder="Select a language…"
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
              <label style={LABEL_STYLE}>Your Quote About Letter from Heart *</label>
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

            {/* Profile photo */}
            <div>
              <label style={LABEL_STYLE}>Profile Photo URL *</label>
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
