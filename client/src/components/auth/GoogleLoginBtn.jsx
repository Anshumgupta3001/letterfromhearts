// GoogleLoginBtn — triggers Firebase Google popup.
// mode='signup' → shows GoogleAccountTypeModal → POST /api/auth/google-signup
// mode='login'  → POST /api/auth/google-login (returns 404 if no account)

import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../firebase/firebase.config'
import { useApp } from '../../context/AppContext'
import { setToken } from '../../utils/api'
import GoogleAccountTypeModal from './GoogleAccountTypeModal'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

// mode: 'signup' | 'login'
export default function GoogleLoginBtn({ mode = 'login' }) {
  const { login } = useApp()

  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  // signup-only: pending idToken + name while modal is open
  const [modalOpen,   setModalOpen]   = useState(false)
  const [pendingToken, setPendingToken] = useState(null)
  const [googleName,   setGoogleName]   = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError,   setModalError]   = useState('')

  const label = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'

  async function handleClick() {
    setError('')
    setLoading(true)
    try {
      const result  = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()

      if (mode === 'signup') {
        // Store the token and open the role-selection modal
        setPendingToken(idToken)
        setGoogleName(result.user.displayName || '')
        setModalOpen(true)
        return
      }

      // Login mode — send straight to backend
      const res  = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Google sign-in failed. Please try again.')
        return
      }

      setToken(json.token)
      localStorage.setItem('lfh_user', JSON.stringify(json.user))
      await login(json.token, json.user)

    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return
      }
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleModalConfirm(role) {
    setModalError('')
    setModalLoading(true)
    try {
      const res  = await fetch('/api/auth/google-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: pendingToken, role }),
      })
      const json = await res.json()

      if (!res.ok) {
        setModalError(json.error || 'Sign-up failed. Please try again.')
        return
      }

      setModalOpen(false)
      setToken(json.token)
      localStorage.setItem('lfh_user', JSON.stringify(json.user))
      await login(json.token, json.user)

    } catch (err) {
      setModalError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setModalLoading(false)
    }
  }

  function handleModalCancel() {
    setModalOpen(false)
    setPendingToken(null)
    setGoogleName('')
    setModalError('')
    setError('Account type is required to complete signup.')
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-[11px] px-4 rounded-[10px] font-sans text-[13.5px] font-medium cursor-pointer transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: '#fff',
            border: '1px solid rgba(28,26,23,0.16)',
            color: 'var(--ink)',
            boxShadow: '0 1px 4px rgba(28,26,23,0.08)',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 14px rgba(28,26,23,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(28,26,23,0.08)' }}
        >
          {loading ? <Spinner /> : <GoogleIcon />}
          {loading ? (mode === 'signup' ? 'Connecting…' : 'Signing in…') : label}
        </button>

        {error && (
          <div
            className="text-[12px] px-3 py-2 rounded-[8px] text-center font-sans"
            style={{ background: 'rgba(196,99,58,0.07)', color: 'var(--tc)', border: '0.5px solid rgba(196,99,58,0.2)' }}
          >
            {error}
          </div>
        )}
      </div>

      {modalOpen && (
        <GoogleAccountTypeModal
          googleName={googleName}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
          loading={modalLoading}
          error={modalError}
        />
      )}
    </>
  )
}
