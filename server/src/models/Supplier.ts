import { Schema, model, Document } from 'mongoose';

export interface ISupplier extends Document {
  tenantId: string;
  code: string;
  name: string;
  gstin?: string;
  state: string;
  stateCode: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTermsDays?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>({
  tenantId: { 
    type: String, 
    required: true, 
    default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', 
    index: true 
  },
  code: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  gstin: { type: String },
  state: { type: String, required: true },
  stateCode: { type: String, required: true },
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  paymentTermsDays: { type: Number, default: 30 },
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true });

SupplierSchema.index({ tenantId: 1, code: 1 }, { unique: true });

export const Supplier = model<ISupplier>('Supplier', SupplierSchema);
