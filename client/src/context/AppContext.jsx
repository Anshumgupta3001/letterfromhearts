import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { seekerLetters, listenerReplies, openLetters } from '../data/mockData'
import { apiFetch, getToken, setToken, removeToken } from '../utils/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const [authUser, setAuthUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lfh_user')) } catch { return null }
  })
  const [authLoading, setAuthLoading] = useState(true)

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

  // Verify token on mount
  useEffect(() => {
    const token = getToken()
    if (!token) { setAuthLoading(false); return }
    apiFetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.success) {
          setAuthUser(json.user)
          localStorage.setItem('lfh_user', JSON.stringify(json.user))
        } else {
          removeToken()
          setAuthUser(null)
        }
      })
      .catch(() => { removeToken(); setAuthUser(null) })
      .finally(() => setAuthLoading(false))
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

  function navigate(page, filter) {
    setCurrentPage(page)
    if (filter) {
      if (page === 'myletters') setMyLettersFilter(filter)
      if (page === 'myreplies') setRepliesFilter(filter)
    }
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

  return (
    <AppContext.Provider
      value={{
        // auth
        authUser, authLoading, login, logout, updateAuthUser,
        // role / email mode helpers
        userRole, userEmailMode, canWrite, canWriteStranger, canReadFeed,
        // nav
        currentPage, navigate,
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
