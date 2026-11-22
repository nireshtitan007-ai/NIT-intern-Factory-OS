import { Schema, model, Document } from 'mongoose';
import { integerPaiseValidator, paiseToRupees } from '../utils/money';

export type CustomerType = 'RETAILER' | 'DISTRIBUTOR';

export interface ICustomerPriceListItem {
  productCode: string;
  unitPrice: number;
  unitPricePaise: number;
}

export interface ICustomer extends Document {
  tenantId: string;
  code: string;
  name: string;
  type: CustomerType;
  state: string;
  stateCode: string;
  gstin?: string;
  address: string;
  city: string;
  phone: string;
  creditLimit: number;
  creditLimitPaise: number;
  outstandingBalance: number;
  outstandingBalancePaise: number;
  assignedSalesmanId?: string;
  priceList?: ICustomerPriceListItem[];
  active: boolean;
  createdAt: Date;
}

const CustomerPriceListItemSchema = new Schema<ICustomerPriceListItem>({
  productCode: { type: String, required: true },
  unitPricePaise: { type: Number, required: true, validate: integerPaiseValidator }
}, {
  _id: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

CustomerPriceListItemSchema.virtual('unitPrice')
  .get(function () {
    return paiseToRupees(this.unitPricePaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.unitPricePaise = Math.round(val * 100);
    }
  });

const CustomerSchema = new Schema<ICustomer>({
  tenantId: { type: String, required: true, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
  code: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['RETAILER', 'DISTRIBUTOR'] },
  state: { type: String, required: true },
  stateCode: { type: String, required: true },
  gstin: { type: String },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  phone: { type: String, default: '' },
  creditLimitPaise: { type: Number, default: 5000000, validate: integerPaiseValidator },
  outstandingBalancePaise: { type: Number, default: 0, validate: integerPaiseValidator },
  assignedSalesmanId: { type: String },
  priceList: [CustomerPriceListItemSchema],
  active: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

CustomerSchema.index({ tenantId: 1, code: 1 }, { unique: true });

CustomerSchema.virtual('creditLimit')
  .get(function () {
    return paiseToRupees(this.creditLimitPaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.creditLimitPaise = Math.round(val * 100);
    }
  });

CustomerSchema.virtual('outstandingBalance')
  .get(function () {
    return paiseToRupees(this.outstandingBalancePaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.outstandingBalancePaise = Math.round(val * 100);
    }
  });

CustomerSchema.pre('validate', function (next) {
  if (this.creditLimitPaise === undefined && (this as any).creditLimit !== undefined) {
    this.creditLimitPaise = Math.round((this as any).creditLimit * 100);
  }
  if (this.outstandingBalancePaise === undefined && (this as any).outstandingBalance !== undefined) {
    this.outstandingBalancePaise = Math.round((this as any).outstandingBalance * 100);
  }
  if (this.priceList && Array.isArray(this.priceList)) {
    for (const item of this.priceList as any[]) {
      if (item.unitPricePaise === undefined && item.unitPrice !== undefined) {
        item.unitPricePaise = Math.round(item.unitPrice * 100);
      }
    }
  }
  next();
});

export const Customer = model<ICustomer>('Customer', CustomerSchema);
