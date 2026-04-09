// GoogleRoleSetupModal — shown once after a brand-new Google OAuth signup.
// Lets the user choose their account role; calls PATCH /api/auth/me to save it.

import { useState } from 'react'
import { apiFetch } from '../../utils/api'
import { useApp } from '../../context/AppContext'

const ROLES = [
  {
    id:    'seeker',
    icon:  '✍️',
    label: 'Seeker',
    desc:  'I want to write letters — to myself, a stranger, or someone I know.',
  },
  {
    id:    'listener',
    icon:  '👂',
    label: 'Listener',
    desc:  'I want to read letters and show up for people who need to be heard.',
  },
  {
    id:    'both',
    icon:  '🌿',
    label: 'Seeker + Listener',
    desc:  'I want to write and listen — give words and receive them.',
  },
]

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

export default function GoogleRoleSetupModal() {
  const { authUser, updateAuthUser, setPendingRoleSetup } = useApp()
  // null = nothing selected yet — user must make an explicit choice
  const [role,    setRole]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSave() {
    if (!role) { setError('Please select how you want to use Letter from Heart.'); return }
    setError('')
    setLoading(true)
    try {
      const res  = await apiFetch('/api/auth/me', { method: 'PATCH', body: JSON.stringify({ role }) })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not save your preference.'); return }
      updateAuthUser({ role })
      setPendingRoleSetup(false)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(28,26,23,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-[420px] rounded-[20px] px-7 py-7"
        style={{
          background: 'var(--paper)',
          border: '0.5px solid rgba(28,26,23,0.1)',
          boxShadow: '0 24px 64px rgba(28,26,23,0.18)',
        }}
      >
        {/* Header */}
        <div className="mb-5">
          <div className="text-[24px] mb-1">👋</div>
          <h2 className="font-lora text-[20px] font-medium" style={{ color: 'var(--ink)' }}>
            Welcome, {authUser?.name?.split(' ')[0] || 'friend'}!
          </h2>
          <p className="text-[12.5px] font-light mt-1 leading-[1.6]" style={{ color: 'var(--ink-muted)' }}>
            How would you like to use Letter from Heart? You can change this anytime.
          </p>
        </div>

        {/* Role selector */}
        <div className="flex flex-col gap-2 mb-5">
          {ROLES.map(r => {
            const active = role === r.id
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                disabled={loading}
                className="flex items-start gap-3 px-4 py-3 rounded-[11px] text-left cursor-pointer border-none outline-none transition-all duration-200 disabled:opacity-60"
                style={{
                  background: active ? 'rgba(196,99,58,0.06)' : 'var(--cream)',
                  border: `1px solid ${active ? 'var(--tc)' : 'rgba(28,26,23,0.1)'}`,
                  boxShadow: active ? '0 0 0 3px rgba(196,99,58,0.07)' : 'none',
                }}
              >
                <span className="text-[17px] flex-shrink-0 mt-0.5">{r.icon}</span>
                <div className="flex-1">
                  <div className="text-[13px] font-medium font-sans" style={{ color: active ? 'var(--tc)' : 'var(--ink)' }}>
                    {r.label}
                  </div>
                  <div className="text-[11px] font-light mt-0.5" style={{ color: 'var(--ink-muted)' }}>{r.desc}</div>
                </div>
                {active && (
                  <span className="ml-auto flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ background: 'var(--tc)' }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <div
            className="text-[12px] px-3 py-2.5 rounded-[9px] font-sans mb-4"
            style={{ background: 'rgba(196,99,58,0.07)', color: 'var(--tc)', border: '0.5px solid rgba(196,99,58,0.2)' }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !role}
          className="w-full py-[13px] rounded-[10px] font-sans text-[14px] font-medium border-none cursor-pointer transition-all duration-200 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: 'var(--ink)', color: 'var(--cream)', boxShadow: '0 4px 14px rgba(28,26,23,0.18)' }}
        >
          {loading && <Spinner />}
          {loading ? 'Saving…' : 'Get Started →'}
        </button>
      </div>
    </div>
  )
}
