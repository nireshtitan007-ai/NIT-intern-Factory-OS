import { Schema, model, Document } from 'mongoose';

export type MaterialCategory = 'RAW_MATERIAL' | 'PACKAGING';

export interface IRawMaterial extends Document {
  code: string;
  name: string;
  category: MaterialCategory;
  unit: string; // 'kg', 'litre', 'piece'
  openingStock: number;
  currentStock: number;
  standardRate: number; // in INR
  currentWeightedRate: number; // in INR
  reorderLevel: number;
  createdAt: Date;
}

const RawMaterialSchema = new Schema<IRawMaterial>({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['RAW_MATERIAL', 'PACKAGING'] 
  },
  unit: { type: String, required: true },
  openingStock: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  standardRate: { type: Number, required: true },
  currentWeightedRate: { type: Number, required: true },
  reorderLevel: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const RawMaterial = model<IRawMaterial>('RawMaterial', RawMaterialSchema);
