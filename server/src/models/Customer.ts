import { Schema, model, Document } from 'mongoose';

export type CustomerType = 'RETAILER' | 'DISTRIBUTOR';

export interface ICustomer extends Document {
  code: string;
  name: string;
  type: CustomerType;
  state: string; // e.g. 'Tamil Nadu' or 'Karnataka'
  stateCode: string; // e.g. '33' or '29'
  gstin?: string;
  address: string;
  city: string;
  phone: string;
  creditLimit: number;
  outstandingBalance: number;
  assignedSalesmanId?: string;
  createdAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['RETAILER', 'DISTRIBUTOR'] },
  state: { type: String, required: true },
  stateCode: { type: String, required: true },
  gstin: { type: String },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  phone: { type: String, default: '' },
  creditLimit: { type: Number, default: 50000 },
  outstandingBalance: { type: Number, default: 0 },
  assignedSalesmanId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Customer = model<ICustomer>('Customer', CustomerSchema);
