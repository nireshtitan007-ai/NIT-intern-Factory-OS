import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
  code: string;
  name: string;
  packSize: string; // e.g., '200g'
  unit: string; // 'packet'
  sellingPrice: number; // in INR (before tax) e.g. 50
  gstRate: number; // in percentage e.g. 5
  hsnCode: string; // e.g. '19059040'
  currentStock: number; // packets
  openingStock: number;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  packSize: { type: String, required: true },
  unit: { type: String, default: 'packet' },
  sellingPrice: { type: Number, required: true },
  gstRate: { type: Number, default: 5 },
  hsnCode: { type: String, default: '19059040' },
  currentStock: { type: Number, default: 0 },
  openingStock: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const Product = model<IProduct>('Product', ProductSchema);
