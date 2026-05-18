import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google'), null);

        // If user already exists, return them
        let user = await User.findOne({ email });

        const rawAvatar = profile.photos?.[0]?.value || null;
        // Upgrade resolution: replace =s96-c with =s400-c for a bigger photo
        const avatarUrl = rawAvatar ? rawAvatar.replace(/=s\d+-c$/, '=s400-c') : null;

        if (user) {
          // Link googleId if not already linked, and always update avatar
          if (!user.googleId) user.googleId = profile.id;
          user.avatarUrl = avatarUrl;
          await user.save();
          return done(null, user);
        }

        // Create new user from Google profile
        user = await User.create({
          name: profile.displayName || email.split('@')[0],
          email,
          googleId: profile.id,
          avatarUrl,
          role: 'attendee',
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Needed for passport session serialization (we use JWT so these are minimal)
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
