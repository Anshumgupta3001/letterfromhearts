// Centralised fetch wrapper that injects the JWT token
export function getToken() {
  return localStorage.getItem('lfh_token')
}

export function setToken(token) {
  localStorage.setItem('lfh_token', token)
}

export function removeToken() {
  localStorage.removeItem('lfh_token')
  localStorage.removeItem('lfh_user')
}

export async function apiFetch(url, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(url, { ...options, headers })
  // Log 429s so they surface clearly in dev tools — callers receive the response
  // as-is and handle the error state through their normal flow (no auto-retry,
  // which would compound the problem).
  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After')
    console.warn(`[apiFetch] 429 Too Many Requests — ${url}${retryAfter ? ` (retry after ${retryAfter}s)` : ''}`)
  }
  return res
}
