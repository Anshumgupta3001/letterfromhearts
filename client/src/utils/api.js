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
  return res
}
