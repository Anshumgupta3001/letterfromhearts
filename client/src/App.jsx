import { useRef } from 'react'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Drawer from './components/Drawer'
import LetterDrawer from './components/LetterDrawer'
import GoogleRoleSetupModal from './components/auth/GoogleRoleSetupModal'
import HomePage from './pages/HomePage'
import WritePage from './pages/WritePage'
import MySpacePage from './pages/MySpacePage'
import MyLettersPage from './pages/MyLettersPage'
import ListenPage from './pages/ListenPage'
import MyRepliesPage from './pages/MyRepliesPage'
import ConnectionsPage from './pages/ConnectionsPage'
import SentLettersPage from './pages/SentLettersPage'
import PersonalLettersPage from './pages/PersonalLettersPage'
import CaringStrangerPage from './pages/CaringStrangerPage'
import ListenerReadPage from './pages/ListenerReadPage'
import ReportIssuePage from './pages/ReportIssuePage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AuthPage from './pages/AuthPage'
import OnboardingModal from './components/OnboardingModal'
import { useApp } from './context/AppContext'

// Only show onboarding for accounts created on or after this date.
// Users who signed up before onboarding was launched are auto-skipped.
const ONBOARDING_LAUNCH = new Date('2026-05-16')

// ── Deep link parser ──────────────────────────────────────────────────────────
// Translates /welcome/* paths (from email CTAs) to their navigation intent.
// Returns { type: 'letter'|'reply'|'notifications', id? } or null.
function parseDeepLink(path) {
  const letterMatch = path.match(/^\/welcome\/letters\/([a-f0-9]{24})$/)
  if (letterMatch) return { type: 'letter', id: letterMatch[1] }
  const replyMatch  = path.match(/^\/welcome\/reply\/([a-f0-9]{24})$/)
  if (replyMatch)  return { type: 'reply',  id: replyMatch[1]  }
  if (path === '/welcome/notifications') return { type: 'notifications' }
  return null
}

// Auth-specific paths that the URL router recognises
const AUTH_PATHS    = ['/signup', '/login']
const WELCOME_PATH  = '/welcome'

function PageRouter() {
  const { currentPage, authUser, authLoading, pendingRoleSetup, navigate } = useApp()
  const path = window.location.pathname
  const deepLink = parseDeepLink(path)
  const deepLinkHandled = useRef(false)

  // Admin bypass — no auth required, no URL rewriting
  const adminPaths = ['/admin-secret-dashboard', '/admin/dashboard']
  if (adminPaths.includes(path)) return <AdminDashboardPage />

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[13px] text-ink-muted font-light animate-pulse">Loading…</div>
      </div>
    )
  }

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!authUser) {
    if (deepLink) {
      // Email deep link — preserve destination in ?redirect= and send to login
      window.history.replaceState({}, '', `/login?redirect=${encodeURIComponent(path)}`)
      return <AuthPage initialMode="login" />
    }
    // Normalise any non-auth URL to /signup so refresh works cleanly
    if (!AUTH_PATHS.includes(path)) {
      window.history.replaceState({}, '', '/signup')
    }
    const initialMode = window.location.pathname === '/login' ? 'login' : 'signup'
    return <AuthPage initialMode={initialMode} />
  }

  // ── Authenticated ──────────────────────────────────────────────────────────
  // Deep link: authenticated user clicking an email CTA directly (already logged in).
  // AppContext.init handles this via pathname check, but as a safety net we also
  // handle it here for cases where auth was already resolved at render time.
  if (deepLink && !deepLinkHandled.current) {
    deepLinkHandled.current = true
    if (deepLink.type === 'letter' || deepLink.type === 'reply') {
      navigate('myspace', 'received')
    } else if (deepLink.type === 'notifications') {
      navigate('home')
    }
    window.history.replaceState({}, '', WELCOME_PATH)
  }

  // Swap auth/root paths to /welcome in the address bar
  if (AUTH_PATHS.includes(path) || path === '/') {
    window.history.replaceState({}, '', WELCOME_PATH)
  }

  const createdAt = authUser?.createdAt ? new Date(authUser.createdAt) : null
  const showOnboarding = (
    authUser &&
    !authUser.hasCompletedOnboarding &&
    createdAt && createdAt >= ONBOARDING_LAUNCH
  )

  return (
    <>
      <Layout>
        {currentPage === 'home'           && <HomePage />}
        {currentPage === 'myspace'        && <MySpacePage />}
        {currentPage === 'write'          && <WritePage />}
        {currentPage === 'myletters'      && <MyLettersPage />}
        {currentPage === 'listen'         && <ListenPage />}
        {currentPage === 'myreplies'      && <MyRepliesPage />}
        {currentPage === 'connections'    && <ConnectionsPage />}
        {currentPage === 'sentletters'    && <SentLettersPage />}
        {currentPage === 'personalletters'&& <PersonalLettersPage />}
        {currentPage === 'caringstranger' && <CaringStrangerPage />}
        {currentPage === 'listenerread'   && <ListenerReadPage />}
        {currentPage === 'reportissue'    && <ReportIssuePage />}
      </Layout>
      <Drawer />
      <LetterDrawer />
      {pendingRoleSetup && <GoogleRoleSetupModal />}
      {showOnboarding  && <OnboardingModal />}
    </>
  )

}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-cream font-sans">
        <PageRouter />
      </div>
    </AppProvider>
  )
}
