import { Schema, model, Document, Types } from 'mongoose';
import { integerPaiseValidator } from '../utils/money';

export interface IPurchaseItem {
  materialId: Types.ObjectId;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  rate: number;
  ratePaise?: number;
  total: number;
  totalPaise?: number;
}

export interface IPurchase extends Document {
  tenantId: string;
  purchaseNumber: string;
  supplierName: string;
  items: IPurchaseItem[];
  totalAmount: number;
  totalAmountPaise?: number;
  status: 'RECEIVED';
  notes?: string;
  date: Date;
  createdAt: Date;
}

const PurchaseItemSchema = new Schema<IPurchaseItem>({
  materialId: { type: Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
  materialCode: { type: String, required: true },
  materialName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  rate: { type: Number, required: true },
  ratePaise: { type: Number, default: 0, validate: integerPaiseValidator },
  total: { type: Number, required: true },
  totalPaise: { type: Number, default: 0, validate: integerPaiseValidator }
}, { _id: false });

const PurchaseSchema = new Schema<IPurchase>({
  tenantId: { type: String, required: true, default: 'TENANT_NASH_FOODS', index: true },
  purchaseNumber: { type: String, required: true, unique: true, index: true },
  supplierName: { type: String, required: true },
  items: [PurchaseItemSchema],
  totalAmount: { type: Number, required: true },
  totalAmountPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  status: { type: String, default: 'RECEIVED' },
  notes: { type: String },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

PurchaseSchema.pre('save', function (next) {
  if (!this.totalAmountPaise && this.totalAmount) {
    this.totalAmountPaise = Math.round(this.totalAmount * 100);
  }
  next();
});

export const Purchase = model<IPurchase>('Purchase', PurchaseSchema);
