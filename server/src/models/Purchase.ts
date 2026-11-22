import { Schema, model, Document, Types } from 'mongoose';
import { integerPaiseValidator, paiseToRupees } from '../utils/money';

export interface IPurchaseItem {
  materialId: Types.ObjectId;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  rate: number;
  ratePaise: number;
  total: number;
  totalPaise: number;
}

export interface IPurchase extends Document {
  tenantId: string;
  purchaseNumber: string;
  supplierId?: Types.ObjectId;
  supplierName: string;
  items: IPurchaseItem[];
  totalAmount: number;
  totalAmountPaise: number;
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
  ratePaise: { type: Number, required: true, validate: integerPaiseValidator },
  totalPaise: { type: Number, required: true, validate: integerPaiseValidator }
}, { 
  _id: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

PurchaseItemSchema.virtual('rate')
  .get(function () {
    return paiseToRupees(this.ratePaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.ratePaise = Math.round(val * 100);
    }
  });

PurchaseItemSchema.virtual('total')
  .get(function () {
    return paiseToRupees(this.totalPaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.totalPaise = Math.round(val * 100);
    }
  });

const PurchaseSchema = new Schema<IPurchase>({
  tenantId: { type: String, required: true, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
  purchaseNumber: { type: String, required: true, unique: true, index: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  supplierName: { type: String, required: true },
  items: [PurchaseItemSchema],
  totalAmountPaise: { type: Number, required: true, validate: integerPaiseValidator },
  status: { type: String, default: 'RECEIVED' },
  notes: { type: String },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

PurchaseSchema.virtual('totalAmount')
  .get(function () {
    return paiseToRupees(this.totalAmountPaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.totalAmountPaise = Math.round(val * 100);
    }
  });

PurchaseSchema.pre('validate', function (next) {
  if (this.items && Array.isArray(this.items)) {
    for (const item of this.items as any[]) {
      if (item.ratePaise === undefined && item.rate !== undefined) {
        item.ratePaise = Math.round(item.rate * 100);
      }
      if (item.totalPaise === undefined && item.total !== undefined) {
        item.totalPaise = Math.round(item.total * 100);
      } else if (item.totalPaise === undefined && item.quantity && item.ratePaise) {
        item.totalPaise = Math.round(item.quantity * item.ratePaise);
      }
    }
  }
  if (this.totalAmountPaise === undefined && (this as any).totalAmount !== undefined) {
    this.totalAmountPaise = Math.round((this as any).totalAmount * 100);
  }
  next();
});

export const Purchase = model<IPurchase>('Purchase', PurchaseSchema);
