import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 
  | 'admin'
  | 'production'
  | 'salesman'
  | 'sales_manager'
  | 'inventory'
  | 'purchase'
  | 'accountant'
  | 'auditor'
  | 'owner';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  tenantId: string;
  department: string;
  branch: string;
  phone?: string;
  email?: string;
  permissions: string[];
  active: boolean;
  lastLoginAt?: Date;
  loginCount: number;
  failedLoginAttempts: number;
  isLocked: boolean;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['admin', 'production', 'salesman', 'sales_manager', 'inventory', 'purchase', 'accountant', 'auditor', 'owner'],
    index: true 
  },
  tenantId: { type: String, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
  department: { type: String, default: 'General' },
  branch: { type: String, default: 'Main Plant - Tiruchirappalli' },
  phone: { type: String },
  email: { type: String },
  permissions: [{ type: String }],
  active: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
  loginCount: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = model<IUser>('User', UserSchema);
