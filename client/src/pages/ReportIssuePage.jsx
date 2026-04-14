import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

const BD = 'rgba(28,26,23,0.08)'

const ISSUE_TYPES = [
  { value: 'bug',     label: 'Something is not working' },
  { value: 'content', label: 'I found a bug' },
  { value: 'account', label: 'UI looks wrong or broken' },
  { value: 'feature', label: 'I have a suggestion' },
  { value: 'other',   label: 'Something else' },
]

export default function ReportIssuePage() {
  const { navigate } = useApp()

  const [type,    setType]    = useState(ISSUE_TYPES[0].value)
  const [subject, setSubject] = useState(ISSUE_TYPES[0].label)
  const [description, setDescription] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [submitted,   setSubmitted]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!subject.trim())      return setError('Please add a subject.')
    if (!description.trim())  return setError('Please describe the issue.')

    setLoading(true)
    try {
      const res  = await apiFetch('/api/report-issue', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type, subject: subject.trim(), description: description.trim() }),
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

  return (
    <main className="flex justify-center px-4 sm:px-6" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div className="w-full" style={{ maxWidth: 560 }}>

        {/* Back */}
        <button
          onClick={() => navigate('home')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--ink-muted)', background: 'rgba(28,26,23,0.05)',
            border: `0.5px solid ${BD}`, borderRadius: 7, padding: '5px 11px',
            cursor: 'pointer', marginBottom: 32, fontFamily: '"DM Sans", sans-serif',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
        >
          ← Back
        </button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: '"Lora", serif', fontSize: 26, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.4px', marginBottom: 5 }}>
            Report an Issue
          </h1>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
            Something wrong? Every report helps us keep this a safe, quiet space.
          </p>
        </div>

        {submitted ? (
          /* ── Success state ── */
          <div style={{
            background: 'var(--paper)',
            border: `0.5px solid rgba(122,158,142,0.3)`,
            borderRadius: 16, padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(28,26,23,0.06)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>💌</div>
            <div style={{ fontFamily: '"Lora", serif', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>
              Thank you for letting us know
            </div>
            <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 28 }}>
              Your report has been received. We'll look into it and get back to you if needed.
            </p>
            <button
              onClick={() => navigate('home')}
              style={{
                padding: '10px 24px', borderRadius: 999,
                background: 'var(--tc)', color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#D97040'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--tc)'}
            >
              Back to Home
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Issue type */}
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-soft)', fontFamily: '"DM Sans", sans-serif', marginBottom: 10 }}>
                What's the issue about?
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ISSUE_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => { setType(t.value); setSubject(t.label); setError('') }}
                    style={{
                      padding: '7px 14px', borderRadius: 999, fontSize: 12.5,
                      fontFamily: '"DM Sans", sans-serif', fontWeight: type === t.value ? 500 : 400,
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: type === t.value ? 'var(--tc)' : 'var(--paper)',
                      color:      type === t.value ? '#fff' : 'var(--ink-soft)',
                      border:     type === t.value ? '1px solid var(--tc)' : `0.5px solid ${BD}`,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject — auto-filled, still editable */}
            <div>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', marginBottom: 8 }}>
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => { setSubject(e.target.value); setError('') }}
                placeholder="Brief summary of the issue"
                maxLength={120}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: `0.5px solid ${BD}`, background: 'var(--paper)',
                  fontSize: 14, fontFamily: '"DM Sans", sans-serif', color: 'var(--ink)',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.35)'}
                onBlur={e => e.target.style.borderColor = BD}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', marginBottom: 8 }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={e => { setDescription(e.target.value); setError('') }}
                placeholder="Describe what happened, what you expected, and any steps to reproduce..."
                rows={6}
                maxLength={2000}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: `0.5px solid ${BD}`, background: 'var(--paper)',
                  fontSize: 14, fontFamily: '"DM Sans", sans-serif', color: 'var(--ink)',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  lineHeight: 1.65, transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(196,99,58,0.35)'}
                onBlur={e => e.target.style.borderColor = BD}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--ink-muted)', fontFamily: '"DM Sans", sans-serif', marginTop: 4 }}>
                {description.length}/2000
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(196,99,58,0.07)', border: '0.5px solid rgba(196,99,58,0.2)',
                borderRadius: 9, padding: '10px 13px',
                fontSize: 13, color: 'var(--tc)', fontFamily: '"DM Sans", sans-serif',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 28px', borderRadius: 999,
                background: loading ? 'rgba(196,99,58,0.5)' : 'var(--tc)',
                color: '#fff', border: 'none',
                cursor: loading ? 'default' : 'pointer',
                fontSize: 14, fontFamily: '"DM Sans", sans-serif', fontWeight: 500,
                alignSelf: 'flex-start', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#D97040' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--tc)' }}
            >
              {loading ? 'Sending…' : 'Send Report'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
