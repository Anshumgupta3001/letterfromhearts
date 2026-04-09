// ProtectedRoute — wraps any component/page that requires authentication.
// The app uses a custom navigation system (currentPage state in AppContext),
// so this component works by checking the auth state from AppContext.
// If no JWT is present in localStorage, it renders the AuthPage fallback.

import { useApp } from '../../context/AppContext'
import { getToken } from '../../utils/api'

export default function ProtectedRoute({ children }) {
  const { authUser, authLoading } = useApp()

  // Still loading initial auth check — render nothing to avoid flash
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--cream)' }}
      >
        <div className="text-[13px] font-light animate-pulse" style={{ color: 'var(--ink-muted)' }}>
          Loading…
        </div>
      </div>
    )
  }

  // No auth user and no token → not authenticated
  if (!authUser && !getToken()) {
    // App.jsx already handles this by rendering AuthPage when authUser is null.
    // Return null here; the parent PageRouter will show AuthPage automatically.
    return null
  }

  return children
}
