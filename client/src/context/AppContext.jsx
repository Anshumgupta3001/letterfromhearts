import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { seekerLetters, listenerReplies, openLetters } from '../data/mockData'
import { apiFetch, getToken, setToken, removeToken } from '../utils/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const [authUser,          setAuthUser]          = useState(() => {
    try { return JSON.parse(localStorage.getItem('lfh_user')) } catch { return null }
  })
  const [authLoading,       setAuthLoading]       = useState(true)
  // Set to true when a brand-new Google user signs up via OAuth redirect
  const [pendingRoleSetup,  setPendingRoleSetup]  = useState(false)

  async function login(token, user) {
    setToken(token)
    localStorage.setItem('lfh_user', JSON.stringify(user))
    setAuthUser(user)
  }

  function logout() {
    removeToken()
    setAuthUser(null)
    setEmailAccounts([])
    setCurrentPage('home')
  }

  function updateAuthUser(patch) {
    setAuthUser(prev => {
      const updated = { ...prev, ...patch }
      localStorage.setItem('lfh_user', JSON.stringify(updated))
      return updated
    })
  }

  // Verify token on mount — also handles Google OAuth redirect callback
  const [googleAuthError, setGoogleAuthError] = useState('')

  useEffect(() => {
    async function init() {
      // ── 1. Check for Google OAuth callback params in URL ─────────────────
      const params      = new URLSearchParams(window.location.search)
      const googleToken = params.get('google_token')
      const googleNew   = params.get('google_new') === 'true'
      const googleError = params.get('google_error')

      if (googleError) {
        const msgs = {
          no_account:    'No account found. Please sign up first.',
          already_exists:'An account already exists. Please log in.',
          auth_failed:   'Google sign-in failed. Please try again.',
          no_email:      'Google account must have an email address.',
          server_error:  'Server error during Google sign-in.',
        }
        setGoogleAuthError(msgs[googleError] || 'Google sign-in failed.')
        window.history.replaceState({}, '', '/')
      }

      if (googleToken) {
        setToken(googleToken)
        window.history.replaceState({}, '', '/')
        if (googleNew) setPendingRoleSetup(true)
      }

      // ── 2. Verify stored token via /api/auth/me ──────────────────────────
      const token = getToken()
      if (!token) { setAuthLoading(false); return }

      try {
        const r    = await apiFetch('/api/auth/me')
        const json = r.ok ? await r.json() : null
        if (json?.success) {
          setAuthUser(json.user)
          localStorage.setItem('lfh_user', JSON.stringify(json.user))
          // Show role setup modal if this is a Google user who never set a role
          if (!json.user.role && json.user.authProvider === 'google') {
            setPendingRoleSetup(true)
          }
        } else {
          removeToken()
          setAuthUser(null)
        }
      } catch {
        removeToken()
        setAuthUser(null)
      } finally {
        setAuthLoading(false)
      }
    }
    init()
  }, []) // eslint-disable-line

  // ── Role helpers ──────────────────────────────────────────────────────────────
  const userRole         = authUser?.role      || 'both'
  const userEmailMode    = authUser?.emailMode || 'custom'
  // Everyone can write letters (personal); only seeker/both can write stranger letters
  const canWrite         = true
  const canWriteStranger = userRole === 'seeker' || userRole === 'both'
  const canReadFeed      = userRole === 'listener' || userRole === 'both'

  // ── Navigation ────────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState('home')
  const [drawer, setDrawer] = useState({ open: false, id: null, type: null })
  const [claimedLetterIds, setClaimedLetterIds] = useState([])
  const [myLettersFilter, setMyLettersFilter] = useState('all')
  const [listenFilter, setListenFilter] = useState('all')
  const [repliesFilter, setRepliesFilter] = useState('all')
  const [mySpaceTab, setMySpaceTab] = useState(null)  // null = use default tab

  function navigate(page, filter) {
    setCurrentPage(page)
    if (filter) {
      if (page === 'myletters') setMyLettersFilter(filter)
      if (page === 'myreplies') setRepliesFilter(filter)
      if (page === 'myspace')   setMySpaceTab(filter)
    } else if (page === 'myspace') {
      setMySpaceTab(null)  // reset to default when navigating without a tab
    }
    if (page === 'home') refreshAnalytics()
    window.scrollTo(0, 0)
  }

  // ── Drawers (mock data) ───────────────────────────────────────────────────────
  function openSeekerDrawer(id)  { setDrawer({ open: true, id, type: 'seeker' });   document.body.style.overflow = 'hidden' }
  function openListenerDrawer(id){ setDrawer({ open: true, id, type: 'listener' }); document.body.style.overflow = 'hidden' }
  function openLetterDrawer(id)  { setDrawer({ open: true, id, type: 'open' });     document.body.style.overflow = 'hidden' }
  function openDrawer(id) {
    const seeker   = seekerLetters.find(l => l.id === id)
    const listener = listenerReplies.find(r => r.id === id)
    if (seeker)   openSeekerDrawer(id)
    else if (listener) openListenerDrawer(id)
  }
  function closeDrawer() { setDrawer({ open: false, id: null, type: null }); document.body.style.overflow = '' }
  function claimLetter(id) { setClaimedLetterIds(prev => [...prev, id]) }

  const filteredOpenLetters = openLetters.filter(l => !claimedLetterIds.includes(l.id))

  // ── Letter Panel (right-side full-view panel) ─────────────────────────────────
  const [letterPanel, setLetterPanel] = useState({ open: false, letter: null })

  function openLetterPanel(letter) {
    setLetterPanel({ open: true, letter })
    document.body.style.overflow = 'hidden'
  }
  function closeLetterPanel() {
    setLetterPanel({ open: false, letter: null })
    document.body.style.overflow = ''
  }

  // ── Email accounts ────────────────────────────────────────────────────────────
  const [emailAccounts, setEmailAccounts] = useState([])

  const refreshEmailAccounts = useCallback(async () => {
    if (!getToken()) return
    try {
      const res  = await apiFetch('/api/email-accounts')
      const json = await res.json()
      if (json.success) setEmailAccounts(json.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!authLoading && authUser) refreshEmailAccounts()
  }, [authLoading, authUser, refreshEmailAccounts])

  // ── Sent letters ──────────────────────────────────────────────────────────────
  const [sentLetters, setSentLetters] = useState([])

  const refreshLetters = useCallback(async () => {
    if (!getToken()) return
    try {
      const res  = await apiFetch('/api/letters?type=sent')
      const json = await res.json()
      if (json.success) setSentLetters(json.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!authLoading && authUser) refreshLetters()
  }, [authLoading, authUser, refreshLetters])

  // ── Personal letters ──────────────────────────────────────────────────────────
  const [personalLetters, setPersonalLetters] = useState([])

  const refreshPersonalLetters = useCallback(async () => {
    if (!getToken()) return
    try {
      const res  = await apiFetch('/api/letters?type=personal')
      const json = await res.json()
      if (json.success) setPersonalLetters(json.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!authLoading && authUser) refreshPersonalLetters()
  }, [authLoading, authUser, refreshPersonalLetters])

  // ── Own stranger letters (what the user wrote to the community) ───────────────
  const [ownStrangerLetters, setOwnStrangerLetters] = useState([])

  const refreshOwnStrangerLetters = useCallback(async () => {
    if (!getToken()) return
    try {
      const res  = await apiFetch('/api/letters?type=stranger')
      const json = await res.json()
      if (json.success) setOwnStrangerLetters(json.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!authLoading && authUser) refreshOwnStrangerLetters()
  }, [authLoading, authUser, refreshOwnStrangerLetters])

  // ── Caring Stranger feed (community feed for listeners) ───────────────────────
  const [strangerLetters, setStrangerLetters] = useState([])

  const refreshStrangerLetters = useCallback(async () => {
    if (!getToken()) return
    try {
      const res  = await apiFetch('/api/letters/stranger-feed')
      const json = await res.json()
      if (json.success) setStrangerLetters(json.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!authLoading && authUser) refreshStrangerLetters()
  }, [authLoading, authUser, refreshStrangerLetters])

  // ── Notifications ─────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([])

  const refreshNotifications = useCallback(async () => {
    if (!getToken()) return
    try {
      const res  = await apiFetch('/api/notifications')
      if (!res.ok) {
        console.warn('[Notifications] API error:', res.status)
        return
      }
      const json = await res.json()
      console.log('[Notifications] API response:', json)
      if (json.success) {
        setNotifications(json.data)
      } else {
        console.warn('[Notifications] Unexpected response:', json)
      }
    } catch (err) {
      console.error('[Notifications] Fetch failed:', err.message)
    }
  }, [])

  const markNotificationsRead = useCallback(async () => {
    if (!getToken()) return
    try {
      await apiFetch('/api/notifications/mark-all-read', { method: 'PATCH' })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!authLoading && authUser) {
      refreshNotifications()
      // Poll every 15 seconds for new notifications
      const interval = setInterval(refreshNotifications, 15_000)
      return () => clearInterval(interval)
    }
  }, [authLoading, authUser, refreshNotifications])

  // ── Analytics ─────────────────────────────────────────────────────────────────
  const [analytics,           setAnalytics]           = useState(null)
  const [analyticsDays,       setAnalyticsDays]       = useState(30)
  const [analyticsRefreshing, setAnalyticsRefreshing] = useState(false)

  const refreshAnalytics = useCallback(async (days = analyticsDays) => {
    if (!getToken()) return
    setAnalyticsRefreshing(true)
    try {
      const res  = await apiFetch(`/api/letters/analytics?days=${days}`)
      const json = await res.json()
      if (json.success) setAnalytics(json.data)
    } catch { /* ignore */ }
    finally { setAnalyticsRefreshing(false) }
  }, [analyticsDays]) // eslint-disable-line

  useEffect(() => {
    if (!authLoading && authUser) refreshAnalytics(analyticsDays)
  }, [authLoading, authUser, analyticsDays]) // eslint-disable-line

  return (
    <AppContext.Provider
      value={{
        // auth
        authUser, authLoading, login, logout, updateAuthUser,
        pendingRoleSetup, setPendingRoleSetup,
        googleAuthError, setGoogleAuthError,
        // role / email mode helpers
        userRole, userEmailMode, canWrite, canWriteStranger, canReadFeed,
        // nav
        currentPage, navigate, mySpaceTab,
        // drawers (mock data legacy)
        drawer, openDrawer, openLetterDrawer, closeDrawer,
        claimedLetterIds, claimLetter, filteredOpenLetters,
        seekerLetters, listenerReplies, openLetters,
        // filters
        myLettersFilter, setMyLettersFilter,
        listenFilter, setListenFilter,
        repliesFilter, setRepliesFilter,
        // letter panel (right-side panel)
        letterPanel, openLetterPanel, closeLetterPanel,
        // email accounts
        emailAccounts, setEmailAccounts, refreshEmailAccounts,
        // sent letters
        sentLetters, refreshLetters,
        // personal letters
        personalLetters, refreshPersonalLetters,
        // own stranger letters
        ownStrangerLetters, refreshOwnStrangerLetters,
        // caring stranger feed
        strangerLetters, refreshStrangerLetters,
        // notifications
        notifications, refreshNotifications, markNotificationsRead,
        // analytics
        analytics, analyticsDays, setAnalyticsDays, refreshAnalytics, analyticsRefreshing,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
