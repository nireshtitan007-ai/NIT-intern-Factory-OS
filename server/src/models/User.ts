import { Schema, model, Document } from 'mongoose';

export type UserRole = 'salesman' | 'admin' | 'production' | 'accountant' | 'owner';

export interface IUser extends Document {
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  active: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['salesman', 'admin', 'production', 'accountant', 'owner'],
    index: true 
  },
  phone: { type: String },
  email: { type: String },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const User = model<IUser>('User', UserSchema);

