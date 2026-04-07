import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { apiFetch } from '../utils/api'

const PROVIDER_ICON = { gmail: '📧', zoho: '📮', outlook: '📨', smtp: '📬', sendgrid: '📤', ses: '📡', godaddy: '🌐' }

export default function SendEmailModal({ sal, body, recipientEmail, emailAccounts, onClose, initialSendFrom = 'system', systemEmail = '' }) {
  const { navigate, refreshLetters } = useApp()

  const [sendFrom, setSendFrom]       = useState(initialSendFrom)
  const [selectedEmail, setSelectedEmail] = useState(emailAccounts[0]?.emailAddress || '')
  const [to, setTo]                   = useState(recipientEmail || '')
  const [subject, setSubject]         = useState(sal ? `Dear ${sal}` : 'A letter from my heart')
  const [sending, setSending]         = useState(false)
  const [sent, setSent]               = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    if (emailAccounts.length > 0 && !selectedEmail) {
      setSelectedEmail(emailAccounts[0].emailAddress)
    }
  }, [emailAccounts])

  const selectedAccount = emailAccounts.find(a => a.emailAddress === selectedEmail)
  const usingSystem     = sendFrom === 'system'

  async function handleSend() {
    setError('')
    if (!to.trim() || !to.includes('@')) { setError('Enter a valid recipient email address.'); return }
    if (!body.trim()) { setError('Your letter body is empty — write something first.'); return }
    if (!usingSystem && !selectedEmail) { setError('Select a connected email account.'); return }

    const message = sal ? `Dear ${sal},\n\n${body}` : body

    setSending(true)
    try {
      const res = await apiFetch('/api/send-email', {
        method: 'POST',
        body: JSON.stringify({
          useSystem: usingSystem,
          from: usingSystem ? undefined : selectedEmail,
          to: to.trim(),
          subject: subject.trim() || 'A letter from my heart',
          message,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to send.'); return }
      setSent(true)
      refreshLetters()
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
        style={{ background: 'var(--cream)', border: '0.5px solid rgba(28,26,23,0.1)', boxShadow: '0 24px 64px rgba(28,26,23,0.25)', overflow: 'hidden', overflowX: 'hidden' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '0.5px solid rgba(28,26,23,0.07)' }}>
          <span className="font-lora text-[18px] font-medium text-ink">Send via Email</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer bg-transparent border-none text-[18px]"
          >×</button>
        </div>

        <div className="px-6 py-5">
          {/* No accounts state */}
          {emailAccounts.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-[28px] mb-3">📭</div>
              <div className="font-lora text-[17px] font-medium text-ink mb-2">No email connected</div>
              <div className="text-[13px] text-ink-muted font-light mb-5 leading-[1.6]">
                No email connected. Please connect one first.<br/>Zoho, Gmail, Outlook — any SMTP works.
              </div>
              <button
                onClick={() => { onClose(); navigate('connections') }}
                className="px-6 py-[10px] rounded-pill bg-ink text-cream text-[13px] font-medium font-sans border-none cursor-pointer transition-all duration-200 hover:bg-tc hover:-translate-y-px"
              >
                Go to Connections →
              </button>
            </div>
          ) : sent ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="text-[40px] mb-3 animate-float-up">💌</div>
              <div className="font-lora text-[22px] font-medium text-ink mb-2">Letter sent!</div>
              <div className="text-[13px] text-ink-muted font-light mb-1">Delivered to <strong>{to}</strong></div>
              <div className="text-[12px] text-ink-muted font-light mb-5">via {usingSystem ? (systemEmail || 'system email') : selectedEmail}</div>
              <button
                onClick={onClose}
                className="px-6 py-[10px] rounded-pill bg-ink text-cream text-[13px] font-medium font-sans border-none cursor-pointer transition-all duration-200 hover:bg-tc"
              >
                Close
              </button>
            </div>
          ) : (
            /* Form */
            <div className="flex flex-col gap-3">
              {/* Send From toggle */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-[1px] font-medium text-ink-muted">Send From</span>
                <div className="flex gap-2">
                  {[
                    { id: 'system', icon: '📮', label: 'System Email' },
                    { id: 'custom', icon: '✉️', label: 'My Email' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { if (opt.id === 'custom' && emailAccounts.length === 0) return; setSendFrom(opt.id) }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-[9px] rounded-[8px] font-sans text-[12px] font-medium border-none cursor-pointer transition-all duration-150"
                      style={sendFrom === opt.id
                        ? { background: 'var(--ink)', color: 'var(--cream)' }
                        : { background: 'var(--paper)', color: opt.id === 'custom' && emailAccounts.length === 0 ? 'var(--ink-muted)' : 'var(--ink-soft)', border: '0.5px solid rgba(28,26,23,0.12)', opacity: opt.id === 'custom' && emailAccounts.length === 0 ? 0.5 : 1 }
                      }
                    >
                      <span>{opt.icon}</span> {opt.label}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-ink-muted ml-0.5">
                  {usingSystem
                    ? `Sending via platform: ${systemEmail || 'system@letterfromheart.com'}`
                    : emailAccounts.length === 0 ? 'No account connected — go to Connections' : null}
                </div>
              </div>

              {/* Custom account selector — only when "My Email" selected */}
              {!usingSystem && emailAccounts.length > 0 && (
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
                  {selectedAccount && (
                    <div className="flex items-center gap-1.5 ml-1">
                      <span className="w-[5px] h-[5px] rounded-full bg-sage" />
                      <span className="text-[10px] text-ink-muted">Connected · {selectedAccount.smtp?.host || selectedAccount.provider}</span>
                    </div>
                  )}
                </label>
              )}

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
                <div
                  className="text-[12px] font-sans px-3 py-2 rounded-[7px]"
                  style={{ color: 'var(--tc)', background: 'rgba(196,99,58,0.07)', border: '0.5px solid rgba(196,99,58,0.2)' }}
                >
                  {error}
                </div>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={sending}
                className="mt-1 w-full py-[11px] rounded-pill font-sans text-[13px] font-medium border-none cursor-pointer transition-all duration-200 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'var(--ink)', color: 'var(--cream)' }}
              >
                {sending ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Sending…
                  </>
                ) : 'Send Letter 💌'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
