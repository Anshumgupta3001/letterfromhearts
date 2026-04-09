// Passport.js configuration — Google OAuth 2.0 strategy.
// The strategy only verifies identity and returns the raw profile;
// user find/create logic lives in the route callback.

import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import config from './index.js'

if (config.googleClientId && config.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL:  config.googleCallbackUrl,
      },
      // accessToken, refreshToken not needed — JWT is issued by our own server
      (_accessToken, _refreshToken, profile, done) => {
        done(null, {
          googleId: profile.id,
          name:     profile.displayName || '',
          email:    profile.emails?.[0]?.value?.toLowerCase() || '',
          avatar:   profile.photos?.[0]?.value  || '',
        })
      }
    )
  )
  console.log('✅  Passport Google Strategy initialised.')
} else {
  console.warn('⚠️  Google OAuth: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set. /api/auth/google will return 503.')
}

export default passport
