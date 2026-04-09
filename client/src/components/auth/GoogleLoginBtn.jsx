// GoogleLoginBtn — redirects to GET /api/auth/google?mode={signup|login}.
// The backend handles the full OAuth flow and redirects back to the frontend
// with ?google_token=... (and ?google_new=true for new signups).
// Errors come back as ?google_error=... and are picked up by AppContext.

import { useApp } from '../../context/AppContext'

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

// mode: 'signup' | 'login'
export default function GoogleLoginBtn({ mode = 'login' }) {
  const { googleAuthError, setGoogleAuthError } = useApp()

  // Show error only when it's relevant to the current mode.
  // AppContext sets googleAuthError from the URL param after the OAuth redirect.
  const showError = !!googleAuthError

  function handleClick() {
    setGoogleAuthError('')
    window.location.href = `/api/auth/google?mode=${mode}`
  }

  const label = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-3 py-[11px] px-4 rounded-[10px] font-sans text-[13.5px] font-medium cursor-pointer transition-all duration-200 hover:-translate-y-px"
        style={{
          background: '#fff',
          border: '1px solid rgba(28,26,23,0.16)',
          color: 'var(--ink)',
          boxShadow: '0 1px 4px rgba(28,26,23,0.08)',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(28,26,23,0.12)' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(28,26,23,0.08)' }}
      >
        <GoogleIcon />
        {label}
      </button>

      {showError && (
        <div
          className="text-[12px] px-3 py-2 rounded-[8px] text-center font-sans"
          style={{ background: 'rgba(196,99,58,0.07)', color: 'var(--tc)', border: '0.5px solid rgba(196,99,58,0.2)' }}
        >
          {googleAuthError}
        </div>
      )}
    </div>
  )
}
