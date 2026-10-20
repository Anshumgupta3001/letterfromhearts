import mixpanel from 'mixpanel-browser'

let initialized = false

function init() {
  if (initialized) return
  initialized = true
  mixpanel.init('147e77267aa6aaffe15caac5e3f2aa75', {
    autocapture:             true,
    record_sessions_percent: 0,   // no session recording — page/event tracking only
  })
}

// ── Auth page views ───────────────────────────────────────────────────────────

export function trackLoginPageViewed() {
  init()
  mixpanel.track('Login Page Viewed', { page: '/login' })
}

export function trackSignupPageViewed() {
  init()
  mixpanel.track('Signup Page Viewed', { page: '/signup' })
}

// ── Login events ──────────────────────────────────────────────────────────────

export function trackLoginSuccess(loginMethod = 'email') {
  init()
  mixpanel.track('Login Success', { loginMethod })
}

export function trackLoginFailed(reason = '') {
  init()
  mixpanel.track('Login Failed', { reason })
}

// ── Signup events ─────────────────────────────────────────────────────────────

export function trackSignupSuccess(signupMethod = 'email', accountType = '') {
  init()
  mixpanel.track('Signup Success', { signupMethod, accountType })
}

export function trackSignupFailed(reason = '') {
  init()
  mixpanel.track('Signup Failed', { reason })
}

// ── User identity ─────────────────────────────────────────────────────────────
// Called once after a successful login or signup so events are attributed
// to the user rather than an anonymous ID.

export function identifyUser(user) {
  if (!user?._id) return
  init()
  mixpanel.identify(user._id)
  mixpanel.people.set({
    $email:      user.email  || '',
    accountType: user.role   || '',
  })
}
