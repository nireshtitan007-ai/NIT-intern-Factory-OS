import path from 'path';
import dotenv from 'dotenv';
// Load .env explicitly from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSetInstance: MongoMemoryReplSet | null = null;

export const connectDB = async (customUri?: string): Promise<string> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.host;
  }
  let uri = customUri || process.env.MONGODB_URI;

  if (!uri) {
    try {
      // In-memory single-node replica set enabling multi-document transactions in clean test environments
      replSetInstance = await MongoMemoryReplSet.create({
        replSet: { count: 1 }
      });
      uri = replSetInstance.getUri();
      console.log(`[Database] Initialized In-Memory MongoDB Replica Set at ${uri}`);
    } catch (err) {
      console.error('[Database] Failed to start MongoMemoryReplSet, falling back to localhost:27017/zenlyft_erp', err);
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
  if (replSetInstance) {
    await replSetInstance.stop();
    replSetInstance = null;
  }
};
