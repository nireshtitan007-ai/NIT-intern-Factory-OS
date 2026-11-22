import { Schema, model, Document, Types } from 'mongoose';
import { integerPaiseValidator } from '../utils/money';

export type OrderStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'INVOICED' | 'DISPATCHED';

export interface ISalesOrderItem {
  productId: Types.ObjectId;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitPricePaise?: number;
  lineTotal: number;
  lineTotalPaise?: number;
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
  totalAmountPaise?: number;
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
  createdAt: Date;
}

const SalesOrderItemSchema = new Schema<ISalesOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productCode: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  unitPricePaise: { type: Number, default: 0, validate: integerPaiseValidator },
  lineTotal: { type: Number, required: true },
  lineTotalPaise: { type: Number, default: 0, validate: integerPaiseValidator }
}, { _id: false });

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
  totalAmount: { type: Number, required: true },
  totalAmountPaise: { type: Number, default: 0, validate: integerPaiseValidator },
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
  createdAt: { type: Date, default: Date.now, index: true }
});

SalesOrderSchema.pre('save', function (next) {
  if (!this.totalAmountPaise && this.totalAmount) {
    this.totalAmountPaise = Math.round(this.totalAmount * 100);
  }
  next();
});

export const SalesOrder = model<ISalesOrder>('SalesOrder', SalesOrderSchema);
