import { Schema, model, Document } from 'mongoose';

export type MaterialCategory = 'RAW_MATERIAL' | 'PACKAGING';

export interface IRawMaterial extends Document {
  tenantId: string;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: string; // 'kg', 'litre', 'piece'
  openingStock: number;
  currentStock: number;
  standardRate: number; // in INR
  standardRatePaise?: number;
  currentWeightedRate: number; // in INR
  currentWeightedRatePaise?: number;
  reorderLevel: number;
  createdAt: Date;
}

const RawMaterialSchema = new Schema<IRawMaterial>({
  tenantId: { type: String, required: true, default: 'TENANT_NASH_FOODS', index: true },
  code: { type: String, required: true, index: true },
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
  standardRatePaise: { type: Number, default: 0 },
  currentWeightedRate: { type: Number, required: true },
  currentWeightedRatePaise: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

RawMaterialSchema.index({ tenantId: 1, code: 1 }, { unique: true });

RawMaterialSchema.pre('save', function (next) {
  if (!this.standardRatePaise && this.standardRate) {
    this.standardRatePaise = Math.round(this.standardRate * 100);
  }
  if (!this.currentWeightedRatePaise && this.currentWeightedRate) {
    this.currentWeightedRatePaise = Math.round(this.currentWeightedRate * 100);
  }
  next();
});

export const RawMaterial = model<IRawMaterial>('RawMaterial', RawMaterialSchema);
