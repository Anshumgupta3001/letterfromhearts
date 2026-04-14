import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

const PROVIDER_ICON = { gmail: '📧', zoho: '📮', outlook: '📨', smtp: '📬', sendgrid: '📤', ses: '📡', godaddy: '🌐' }

// The modal ALWAYS shows the send form.
// System email is the default and is always available.
// Custom account is an option only when the user has connected one.
// Minimum datetime-local value = 5 minutes from now (avoids submitting a time already past)
// MUST use local time format — datetime-local input interprets the min attribute as local time
function minScheduleTime() {
  const d = new Date(Date.now() + 5 * 60 * 1000)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatScheduled(isoString) {
  if (!isoString) return ''
  // Always display in user's local timezone (works correctly for IST and any other tz)
  return new Date(isoString).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
}

export default function SendEmailModal({ sal, body, recipientEmail, emailAccounts, onClose, initialSendFrom = 'system', initialDeliveryType = 'now', systemEmail = '' }) {
  const { refreshLetters } = useApp()

  // Default to 'system' regardless of initialSendFrom — always safe
  const [sendFrom,      setSendFrom]      = useState('system')
  const [selectedEmail, setSelectedEmail] = useState(emailAccounts[0]?.emailAddress || '')
  const [to,            setTo]            = useState(recipientEmail || '')
  const [subject,       setSubject]       = useState(sal ? `Dear ${sal}` : 'A letter from my heart')
  const [sending,       setSending]       = useState(false)
  const [sent,          setSent]          = useState(false)
  const [error,         setError]         = useState('')
  // Scheduling
  const [deliveryMode,  setDeliveryMode]  = useState(initialDeliveryType === 'schedule' ? 'schedule' : 'now')
  const [sendAt,        setSendAt]        = useState('')
  const [scheduledFor,  setScheduledFor]  = useState(null)  // returned after successful schedule

  const hasAccounts = emailAccounts.length > 0

  useEffect(() => {
    if (hasAccounts && !selectedEmail) setSelectedEmail(emailAccounts[0].emailAddress)
  }, [emailAccounts]) // eslint-disable-line

  const usingSystem     = sendFrom === 'system'
  const selectedAccount = emailAccounts.find(a => a.emailAddress === selectedEmail)

  async function handleSend() {
    setError('')
    if (!to.trim() || !to.includes('@')) { setError('Enter a valid recipient email address.'); return }
    if (!body.trim()) { setError('Your letter body is empty — write something first.'); return }
    if (deliveryMode === 'schedule' && !sendAt) { setError('Pick a date and time to schedule delivery.'); return }
    if (deliveryMode === 'schedule' && new Date(sendAt) <= new Date()) { setError('Schedule time must be in the future.'); return }

    const message = sal ? `Dear ${sal},\n\n${body}` : body

    setSending(true)
    try {
      if (deliveryMode === 'schedule') {
        // ── Scheduled send ──────────────────────────────────────────────────
        // Convert datetime-local string (naive local time) to UTC ISO string.
        // This is critical: without this, the server on UTC/AWS would interpret
        // "2025-06-01T14:30" as UTC instead of IST, scheduling 5h30m late.
        const sendAtUTC = new Date(sendAt).toISOString()
        const res  = await apiFetch('/api/schedule-email', {
          method: 'POST',
          body: JSON.stringify({
            useSystem: usingSystem,
            from:      usingSystem ? undefined : selectedEmail,
            to:        to.trim(),
            subject:   subject.trim() || 'A letter from my heart',
            message,
            sendAt:    sendAtUTC,
          }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) { setError(json.error || 'Failed to schedule.'); return }
        setScheduledFor(json.scheduledFor)
        setSent(true)
        refreshLetters()
      } else {
        // ── Instant send ────────────────────────────────────────────────────
        const res  = await apiFetch('/api/send-email', {
          method: 'POST',
          body: JSON.stringify({
            useSystem: usingSystem,
            from:      usingSystem ? undefined : selectedEmail,
            to:        to.trim(),
            subject:   subject.trim() || 'A letter from my heart',
            message,
          }),
        })
        const json = await res.json()
        if (!res.ok) { setError(json.error || 'Failed to send.'); return }
        setSent(true)
        refreshLetters()
      }
    } catch (e) {
      setError(e.message || 'Network error — check your connection.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'rgba(22,16,8,0.48)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 600 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative rounded-[14px] w-full max-w-[480px] mx-4 animate-fade-up"
        style={{ background: 'var(--cream)', border: '0.5px solid rgba(28,26,23,0.1)', boxShadow: '0 24px 64px rgba(28,26,23,0.25)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '0.5px solid rgba(28,26,23,0.07)' }}>
          <span className="font-lora text-[18px] font-medium text-ink">Send your letter</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer bg-transparent border-none text-[18px]">×</button>
        </div>

        <div className="px-6 py-5">
          {sent ? (
            /* ── Success state ────────────────────────────────────────── */
            <div className="text-center py-4">
              <div className="text-[40px] mb-3 animate-float-up">{scheduledFor ? '⏳' : '💌'}</div>
              <div className="font-lora text-[22px] font-medium text-ink mb-2">
                {scheduledFor ? 'Letter scheduled!' : 'Letter sent!'}
              </div>
              {scheduledFor ? (
                <>
                  <div className="text-[13px] text-ink-muted font-light mb-1">
                    Will be delivered to <strong>{to}</strong>
                  </div>
                  <div className="text-[12px] font-medium mb-1" style={{ color: 'var(--tc)' }}>
                    {formatScheduled(scheduledFor)}
                  </div>
                  <div className="text-[11px] text-ink-muted font-light mb-5">
                    via {usingSystem ? (systemEmail || 'system email') : selectedEmail}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[13px] text-ink-muted font-light mb-1">Delivered to <strong>{to}</strong></div>
                  <div className="text-[12px] text-ink-muted font-light mb-5">
                    via {usingSystem ? (systemEmail || 'system email') : selectedEmail}
                  </div>
                </>
              )}
              <button
                onClick={onClose}
                className="px-6 py-[10px] rounded-pill bg-ink text-cream text-[13px] font-medium font-sans border-none cursor-pointer transition-all duration-200 hover:bg-tc"
              >
                Close
              </button>
            </div>
          ) : (
            /* ── Send form — always shown ──────────────────────────────── */
            <div className="flex flex-col gap-3">

              {/* Send From */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-[1px] font-medium text-ink-muted">Send From</span>
                <div className="flex gap-2">
                  {/* System email — always available */}
                  <button
                    onClick={() => setSendFrom('system')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-[9px] rounded-[8px] font-sans text-[12px] font-medium border-none cursor-pointer transition-all duration-150"
                    style={sendFrom === 'system'
                      ? { background: 'var(--ink)', color: 'var(--cream)' }
                      : { background: 'var(--paper)', color: 'var(--ink-soft)', border: '0.5px solid rgba(28,26,23,0.12)' }
                    }
                  >
                    <span>📮</span> System Email
                  </button>
                  {/* My email — only selectable if account connected */}
                  <button
                    onClick={() => { if (hasAccounts) setSendFrom('custom') }}
                    title={!hasAccounts ? 'Connect an account in Connections to use your own email' : ''}
                    className="flex-1 flex items-center justify-center gap-1.5 py-[9px] rounded-[8px] font-sans text-[12px] font-medium border-none transition-all duration-150"
                    style={{
                      background: sendFrom === 'custom' ? 'var(--ink)' : 'var(--paper)',
                      color: sendFrom === 'custom' ? 'var(--cream)' : hasAccounts ? 'var(--ink-soft)' : 'var(--ink-muted)',
                      border: sendFrom === 'custom' ? 'none' : '0.5px solid rgba(28,26,23,0.12)',
                      opacity: hasAccounts ? 1 : 0.5,
                      cursor: hasAccounts ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <span>✉️</span> My Email
                  </button>
                </div>
                <div className="text-[10px] text-ink-muted ml-0.5" style={{ fontFamily: 'Lora, serif', fontStyle: 'italic' }}>
                  {usingSystem
                    ? `Sending via platform: ${systemEmail || 'system email'}`
                    : `Sending from: ${selectedEmail}`}
                </div>
              </div>

              {/* Custom account selector */}
              {!usingSystem && hasAccounts && (
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-[1px] font-medium text-ink-muted">Account</span>
                  <div className="relative">
                    <select
                      value={selectedEmail}
                      onChange={e => setSelectedEmail(e.target.value)}
                      className="w-full px-3 py-[10px] pl-8 rounded-[8px] font-sans text-[13px] text-ink outline-none cursor-pointer appearance-none"
                      style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.15)' }}
                    >
                      {emailAccounts.map(acc => (
                        <option key={acc._id || acc.emailAddress} value={acc.emailAddress}>
                          {acc.emailAddress} ({acc.provider})
                        </option>
                      ))}
                    </select>
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none">
                      {PROVIDER_ICON[selectedAccount?.provider] || '📬'}
                    </span>
                  </div>
                </label>
              )}

              {/* When to send */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-[1px] font-medium text-ink-muted">When to send</span>
                <div className="flex gap-2">
                  {[
                    { id: 'now',      label: '📨 Send Now' },
                    { id: 'schedule', label: '⏳ Schedule' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setDeliveryMode(opt.id); setError('') }}
                      className="flex-1 py-[9px] rounded-[8px] font-sans text-[12px] font-medium border-none cursor-pointer transition-all duration-150"
                      style={deliveryMode === opt.id
                        ? { background: 'var(--ink)', color: 'var(--cream)' }
                        : { background: 'var(--paper)', color: 'var(--ink-soft)', border: '0.5px solid rgba(28,26,23,0.12)' }
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {deliveryMode === 'schedule' && (
                  <input
                    type="datetime-local"
                    value={sendAt}
                    min={minScheduleTime()}
                    onChange={e => { setSendAt(e.target.value); setError('') }}
                    className="w-full px-3 py-[10px] rounded-[8px] font-sans text-[13px] text-ink outline-none"
                    style={{ background: 'var(--paper)', border: '0.5px solid rgba(196,99,58,0.35)' }}
                  />
                )}
              </div>

              {/* To */}
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-[1px] font-medium text-ink-muted">To</span>
                <input
                  type="email"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  placeholder="recipient@email.com"
                  className="w-full px-3 py-[10px] rounded-[8px] font-sans text-[13px] text-ink outline-none"
                  style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.15)' }}
                />
              </label>

              {/* Subject */}
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-[1px] font-medium text-ink-muted">Subject</span>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-[10px] rounded-[8px] font-sans text-[13px] text-ink outline-none"
                  style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.15)' }}
                />
              </label>

              {/* Letter preview */}
              <div>
                <div className="text-[11px] uppercase tracking-[1px] font-medium text-ink-muted mb-1">Preview</div>
                <div
                  className="rounded-[8px] px-4 py-3 max-h-[130px] overflow-y-auto text-[12px] font-lora text-ink-soft leading-[1.9]"
                  style={{ background: 'var(--paper)', border: '0.5px solid rgba(28,26,23,0.08)' }}
                >
                  {sal && <div className="font-medium text-ink mb-1">Dear {sal},</div>}
                  <div className="whitespace-pre-wrap">
                    {body || <span className="italic text-ink-muted">Write your letter first…</span>}
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="text-[12px] font-sans px-3 py-2 rounded-[7px]" style={{ color: 'var(--tc)', background: 'rgba(196,99,58,0.07)', border: '0.5px solid rgba(196,99,58,0.2)' }}>
                  {error}
                </div>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={sending}
                className="mt-1 w-full py-[11px] rounded-pill font-sans text-[13px] font-medium border-none cursor-pointer transition-all duration-200 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                onMouseEnter={e => { if (!sending) e.currentTarget.style.background = 'var(--tc)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--ink)' }}
              >
                {sending ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Sending…
                  </>
                ) : deliveryMode === 'schedule' ? 'Schedule delivery ⏳' : 'Send your letter 💌'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
