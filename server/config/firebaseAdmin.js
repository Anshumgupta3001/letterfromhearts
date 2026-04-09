// Firebase Admin SDK initialisation (server-side only).
// Used to verify Firebase ID tokens sent from the React client.
// The service account key file must be present at server/config/serviceAccountKey.json.

import { createRequire } from 'module'
import admin from 'firebase-admin'

// createRequire lets us use require() to load JSON in an ES-module context
const require = createRequire(import.meta.url)

// Only initialise once — guard against hot-reload double-init in dev
if (!admin.apps.length) {
  let serviceAccount

  try {
    serviceAccount = require('./serviceAccountKey.json')
  } catch {
    // serviceAccountKey.json not present — fall back gracefully so the server
    // still boots; the /api/auth/google route will return a 503 if called.
    console.warn(
      '⚠️  Firebase Admin: serviceAccountKey.json not found at server/config/. ' +
      'Google login will be unavailable until the file is added.'
    )
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    console.log('🔥  Firebase Admin SDK initialised.')
  }
}

export default admin
