// Firebase client SDK initialisation
// All values are read from Vite environment variables (VITE_ prefix)
// so the API key is never hardcoded in source.

import { initializeApp }        from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialise the Firebase app (singleton — safe to call multiple times)
const app = initializeApp(firebaseConfig)

// Auth instance used by sign-in methods
export const auth = getAuth(app)

// Google OAuth provider — prompts account selection every time
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
