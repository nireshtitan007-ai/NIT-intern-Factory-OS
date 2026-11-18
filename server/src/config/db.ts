import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongodInstance: MongoMemoryServer | null = null;

export const connectDB = async (customUri?: string): Promise<string> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.host;
  }
  let uri = customUri || process.env.MONGODB_URI;

  if (!uri) {
    try {
      mongodInstance = await MongoMemoryServer.create();
      uri = mongodInstance.getUri();
      console.log(`[Database] Initialized In-Memory MongoDB Engine at ${uri}`);
    } catch (err) {
      console.error('[Database] Failed to start MongoMemoryServer, falling back to localhost:27017/zenlyft_erp', err);
      uri = 'mongodb://127.0.0.1:27017/zenlyft_erp';
    }
  }

  try {
    await mongoose.connect(uri);
    console.log(`[Database] Connected successfully to MongoDB: ${uri.split('@').pop()?.split('?')[0]}`);
    return uri;
  } catch (error) {
    console.error('[Database] Connection error:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
};

