import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  const mongoUri = env.mongoUri;
  mongoose.set('strictQuery', true);
  try {
    // Safely extract DB name — new URL() fails on multi-host Atlas URIs
    const dbNameMatch = mongoUri.match(/\/([^/?]+)(\?|$)/);
    const dbName = dbNameMatch?.[1] || 'event_mgmt';

    await mongoose.connect(mongoUri, { dbName });
    console.log(`MongoDB connected → ${dbName}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}



