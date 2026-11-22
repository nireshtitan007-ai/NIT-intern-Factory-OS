import { Schema, model, Document } from 'mongoose';
import { integerPaiseValidator, paiseToRupees } from '../utils/money';

export interface IProduct extends Document {
  tenantId: string;
  code: string;
  name: string;
  packSize: string; // e.g., '200g'
  unit: string; // 'packet'
  sellingPrice: number; // in INR (before tax) e.g. 50
  sellingPricePaise: number; // in paise e.g. 5000
  gstRate: number; // in percentage e.g. 5
  hsnCode: string; // e.g. '19059040'
  packetsPerCarton?: number; // e.g. 20 packets per carton
  shelfLifeDays?: number; // e.g. 90 days for FEFO dispatch
  currentStock: number; // packets
  openingStock: number;
  active: boolean;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  tenantId: { type: String, required: true, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
  code: { type: String, required: true, index: true },
  name: { type: String, required: true },
  packSize: { type: String, required: true },
  unit: { type: String, default: 'packet' },
  sellingPricePaise: { type: Number, required: true, validate: integerPaiseValidator },
  gstRate: { type: Number, default: 5 },
  hsnCode: { type: String, default: '19059040' },
  packetsPerCarton: { type: Number, default: 20 },
  shelfLifeDays: { type: Number, default: 90 },
  currentStock: { type: Number, default: 0 },
  openingStock: { type: Number, default: 0 },
  active: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ProductSchema.index({ tenantId: 1, code: 1 }, { unique: true });

ProductSchema.virtual('sellingPrice')
  .get(function () {
    return paiseToRupees(this.sellingPricePaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.sellingPricePaise = Math.round(val * 100);
    }
  });

ProductSchema.pre('validate', function (next) {
  if (this.sellingPricePaise === undefined && (this as any).sellingPrice !== undefined) {
    this.sellingPricePaise = Math.round((this as any).sellingPrice * 100);
  }
  next();
});

export const Product = model<IProduct>('Product', ProductSchema);
