import { Schema, model, Document } from 'mongoose';
import { integerPaiseValidator } from '../utils/money';

export type CustomerType = 'RETAILER' | 'DISTRIBUTOR';

export interface ICustomer extends Document {
  tenantId: string;
  code: string;
  name: string;
  type: CustomerType;
  state: string;
  stateCode: string;
  gstin?: string;
  address: string;
  city: string;
  phone: string;
  creditLimit: number;
  creditLimitPaise?: number;
  outstandingBalance: number;
  outstandingBalancePaise?: number;
  assignedSalesmanId?: string;
  createdAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  tenantId: { type: String, required: true, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
  code: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['RETAILER', 'DISTRIBUTOR'] },
  state: { type: String, required: true },
  stateCode: { type: String, required: true },
  gstin: { type: String },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  phone: { type: String, default: '' },
  creditLimit: { type: Number, default: 50000 },
  creditLimitPaise: { type: Number, default: 5000000, validate: integerPaiseValidator },
  outstandingBalance: { type: Number, default: 0 },
  outstandingBalancePaise: { type: Number, default: 0, validate: integerPaiseValidator },
  assignedSalesmanId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

CustomerSchema.index({ tenantId: 1, code: 1 }, { unique: true });

CustomerSchema.pre('save', function (next) {
  if (!this.creditLimitPaise && this.creditLimit) this.creditLimitPaise = Math.round(this.creditLimit * 100);
  if (!this.outstandingBalancePaise && this.outstandingBalance !== undefined) this.outstandingBalancePaise = Math.round(this.outstandingBalance * 100);
  next();
});

export const Customer = model<ICustomer>('Customer', CustomerSchema);
