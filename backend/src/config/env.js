import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

// Debug (remove later)
console.log("JWT_SECRET:", process.env.JWT_SECRET);

// Validate required env vars
const requiredEnvVars = ['JWT_SECRET'];

if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.push('MONGO_URI', 'CLIENT_URL');
}

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}. Copy backend/.env.example to backend/.env and fill in the values.`
    );
  }
}

// ✅ ONLY ONE EXPORT
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5050),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_mgmt',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',

  appName: process.env.APP_NAME?.toString().trim() || 'eventone',
  emailFrom:
    process.env.EMAIL_FROM ||
    `${process.env.APP_NAME || 'eventone'} <no-reply@eventone.local>`,

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
};

export default env;
