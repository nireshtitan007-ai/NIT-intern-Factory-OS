import { Schema, model, Document, Types } from 'mongoose';

export interface IPurchaseItem {
  materialId: Types.ObjectId;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export interface IPurchase extends Document {
  purchaseNumber: string;
  supplierName: string;
  items: IPurchaseItem[];
  totalAmount: number;
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
  total: { type: Number, required: true }
}, { _id: false });

const PurchaseSchema = new Schema<IPurchase>({
  purchaseNumber: { type: String, required: true, unique: true, index: true },
  supplierName: { type: String, required: true },
  items: [PurchaseItemSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'RECEIVED' },
  notes: { type: String },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export const Purchase = model<IPurchase>('Purchase', PurchaseSchema);
