import { Schema, model, Document } from 'mongoose';
import { integerPaiseValidator, paiseToRupees } from '../utils/money';

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
  standardRatePaise: number;
  currentWeightedRate: number; // in INR
  currentWeightedRatePaise: number;
  totalValue: number;
  totalValuePaise: number;
  reorderLevel: number;
  active: boolean;
  createdAt: Date;
}

const RawMaterialSchema = new Schema<IRawMaterial>({
  tenantId: { type: String, required: true, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
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
  standardRatePaise: { type: Number, required: true, validate: integerPaiseValidator },
  totalValuePaise: { type: Number, default: 0, validate: integerPaiseValidator },
  reorderLevel: { type: Number, default: 0 },
  active: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

RawMaterialSchema.index({ tenantId: 1, code: 1 }, { unique: true });

RawMaterialSchema.virtual('standardRate')
  .get(function () {
    return paiseToRupees(this.standardRatePaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.standardRatePaise = Math.round(val * 100);
      if (!this.totalValuePaise && this.currentStock) {
        this.totalValuePaise = Math.round(this.currentStock * this.standardRatePaise);
      }
    }
  });

RawMaterialSchema.virtual('currentWeightedRatePaise').get(function () {
  if (this.currentStock > 0 && this.totalValuePaise) {
    return this.totalValuePaise / this.currentStock;
  }
  return this.standardRatePaise;
});

RawMaterialSchema.virtual('currentWeightedRate')
  .get(function () {
    return (this.currentWeightedRatePaise as number) / 100;
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      const paiseRate = val * 100;
      if (this.currentStock > 0) {
        this.totalValuePaise = Math.round(this.currentStock * paiseRate);
      }
      if (this.standardRatePaise === undefined) {
        this.standardRatePaise = Math.round(paiseRate);
      }
    }
  });

RawMaterialSchema.virtual('totalValue')
  .get(function () {
    return paiseToRupees(this.totalValuePaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.totalValuePaise = Math.round(val * 100);
    }
  });

RawMaterialSchema.pre('validate', function (next) {
  if (this.standardRatePaise === undefined && (this as any).standardRate !== undefined) {
    this.standardRatePaise = Math.round((this as any).standardRate * 100);
  }
  if (!this.totalValuePaise && this.currentStock && (this.standardRatePaise || (this as any).standardRate)) {
    const rate = this.standardRatePaise || Math.round((this as any).standardRate * 100);
    this.totalValuePaise = Math.round(this.currentStock * rate);
  }
  next();
});

export const RawMaterial = model<IRawMaterial>('RawMaterial', RawMaterialSchema);
