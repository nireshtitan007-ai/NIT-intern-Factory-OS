import { Schema, model, Document, Types } from 'mongoose';
import { integerPaiseValidator, paiseToRupees } from '../utils/money';

export type OrderStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'INVOICED' | 'DISPATCHED';

export interface ISalesOrderItem {
  productId: Types.ObjectId;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitPricePaise: number;
  lineTotal: number;
  lineTotalPaise: number;
}

export interface ISalesOrder extends Document {
  tenantId: string;
  orderNumber: string;
  salesmanId?: Types.ObjectId;
  salesmanName: string;
  customerId: Types.ObjectId;
  customerCode: string;
  customerName: string;
  customerState: string;
  customerStateCode: string;
  items: ISalesOrderItem[];
  totalAmount: number;
  totalAmountPaise: number;
  status: OrderStatus;
  offlineSyncId?: string;
  stockCheck: {
    availableStock: number;
    isSufficient: boolean;
    shortageQuantity: number;
  };
  rejectionReason?: string;
  notes?: string;
  invoiceId?: Types.ObjectId;
  checkIn?: {
    lat: number;
    lng: number;
    accuracyMeters?: number;
    capturedAt?: Date;
  };
  createdAt: Date;
}

const CheckInSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  accuracyMeters: { type: Number },
  capturedAt: { type: Date }
}, { _id: false });

const SalesOrderItemSchema = new Schema<ISalesOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productCode: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPricePaise: { type: Number, required: true, validate: integerPaiseValidator },
  lineTotalPaise: { type: Number, required: true, validate: integerPaiseValidator }
}, { 
  _id: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

SalesOrderItemSchema.virtual('unitPrice')
  .get(function () {
    return paiseToRupees(this.unitPricePaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.unitPricePaise = Math.round(val * 100);
    }
  });

SalesOrderItemSchema.virtual('lineTotal')
  .get(function () {
    return paiseToRupees(this.lineTotalPaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.lineTotalPaise = Math.round(val * 100);
    }
  });

const SalesOrderSchema = new Schema<ISalesOrder>({
  tenantId: { type: String, required: true, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
  orderNumber: { type: String, required: true, unique: true, index: true },
  salesmanId: { type: Schema.Types.ObjectId, ref: 'User' },
  salesmanName: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  customerCode: { type: String, required: true },
  customerName: { type: String, required: true },
  customerState: { type: String, required: true },
  customerStateCode: { type: String, required: true },
  items: [SalesOrderItemSchema],
  totalAmountPaise: { type: Number, required: true, validate: integerPaiseValidator },
  status: { 
    type: String, 
    required: true, 
    enum: ['SUBMITTED', 'APPROVED', 'REJECTED', 'INVOICED', 'DISPATCHED'],
    default: 'SUBMITTED',
    index: true 
  },
  offlineSyncId: { type: String, index: true },
  stockCheck: {
    availableStock: { type: Number, required: true },
    isSufficient: { type: Boolean, required: true },
    shortageQuantity: { type: Number, default: 0 }
  },
  rejectionReason: { type: String },
  notes: { type: String },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  checkIn: { type: CheckInSchema, default: undefined },
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

SalesOrderSchema.virtual('totalAmount')
  .get(function () {
    return paiseToRupees(this.totalAmountPaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.totalAmountPaise = Math.round(val * 100);
    }
  });

SalesOrderSchema.pre('validate', function (next) {
  if (this.items && Array.isArray(this.items)) {
    for (const item of this.items as any[]) {
      if (item.unitPricePaise === undefined && item.unitPrice !== undefined) {
        item.unitPricePaise = Math.round(item.unitPrice * 100);
      }
      if (item.lineTotalPaise === undefined && item.lineTotal !== undefined) {
        item.lineTotalPaise = Math.round(item.lineTotal * 100);
      } else if (item.lineTotalPaise === undefined && item.quantity && item.unitPricePaise) {
        item.lineTotalPaise = Math.round(item.quantity * item.unitPricePaise);
      }
    }
  }
  if (this.totalAmountPaise === undefined && (this as any).totalAmount !== undefined) {
    this.totalAmountPaise = Math.round((this as any).totalAmount * 100);
  } else if (this.totalAmountPaise === undefined && this.items && Array.isArray(this.items)) {
    this.totalAmountPaise = this.items.reduce((s: number, it: any) => s + (it.lineTotalPaise || 0), 0);
  }
  next();
});

export const SalesOrder = model<ISalesOrder>('SalesOrder', SalesOrderSchema);
