import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  const mongoUri = env.mongoUri;
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(mongoUri);
    // Show which database we actually connected to
    const dbName = mongoose.connection.db.databaseName;
    console.log(`MongoDB connected → database: "${dbName}"`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error(
      'Common Atlas fixes:\n' +
      '  1. Wrong password in MONGO_URI — double-check backend/.env\n' +
      '  2. Your IP is not whitelisted — go to Atlas → Network Access → Add 0.0.0.0/0\n' +
      '  3. Cluster is paused — resume it in Atlas dashboard'
    );
    process.exit(1);
  }
}

