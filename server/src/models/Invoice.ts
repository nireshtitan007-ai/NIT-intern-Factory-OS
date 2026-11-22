import { Schema, model, Document, Types } from 'mongoose';
import { integerPaiseValidator, paiseToRupees } from '../utils/money';

export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface IInvoiceItem {
  productId: Types.ObjectId;
  productCode: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  dispatchedQty?: number;
  unitPrice: number;
  unitPricePaise: number;
  taxableAmount: number;
  taxableAmountPaise: number;
  cgstRate: number;
  cgstAmount: number;
  cgstAmountPaise: number;
  sgstRate: number;
  sgstAmount: number;
  sgstAmountPaise: number;
  igstRate: number;
  igstAmount: number;
  igstAmountPaise: number;
  totalAmount: number;
  totalAmountPaise: number;
}

export interface IInvoice extends Document {
  tenantId: string;
  invoiceNumber: string;
  salesOrderId: Types.ObjectId;
  customerId: Types.ObjectId;
  customerCode: string;
  customerName: string;
  customerGstin?: string;
  customerState: string;
  customerStateCode: string;
  factoryState: string;
  placeOfSupply: string;
  isInterState: boolean;
  items: IInvoiceItem[];
  taxableValue: number;
  taxableValuePaise: number;
  cgstTotal: number;
  cgstTotalPaise: number;
  sgstTotal: number;
  sgstTotalPaise: number;
  igstTotal: number;
  igstTotalPaise: number;
  grandTotal: number;
  grandTotalPaise: number;
  paidAmount: number;
  paidAmountPaise: number;
  balanceDue: number;
  balanceDuePaise: number;
  paymentStatus: PaymentStatus;
  isDispatched: boolean;
  dispatchStatus?: 'PENDING' | 'PARTIALLY_DISPATCHED' | 'DISPATCHED';
  dispatchDate?: Date;
  isCancelled?: boolean;
  cancelledAt?: Date;
  cancellationReason?: string;
  creditNoteId?: Types.ObjectId;
  creditNoteNumber?: string;
  irn?: string;
  ackNo?: string;
  ackDate?: Date;
  isMockEInvoice?: boolean;
  dueDate: Date;
  createdAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productCode: { type: String, required: true },
  productName: { type: String, required: true },
  hsnCode: { type: String, default: '19059040' },
  quantity: { type: Number, required: true },
  dispatchedQty: { type: Number, default: 0 },
  unitPricePaise: { type: Number, required: true, validate: integerPaiseValidator },
  taxableAmountPaise: { type: Number, required: true, validate: integerPaiseValidator },
  cgstRate: { type: Number, default: 0 },
  cgstAmountPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  sgstRate: { type: Number, default: 0 },
  sgstAmountPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  igstRate: { type: Number, default: 0 },
  igstAmountPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  totalAmountPaise: { type: Number, required: true, validate: integerPaiseValidator }
}, { 
  _id: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

InvoiceItemSchema.virtual('unitPrice')
  .get(function () { return paiseToRupees(this.unitPricePaise); })
  .set(function (val: number) { if (val !== undefined && val !== null) this.unitPricePaise = Math.round(val * 100); });

InvoiceItemSchema.virtual('taxableAmount')
  .get(function () { return paiseToRupees(this.taxableAmountPaise); })
  .set(function (val: number) { if (val !== undefined && val !== null) this.taxableAmountPaise = Math.round(val * 100); });

InvoiceItemSchema.virtual('cgstAmount')
  .get(function () { return paiseToRupees(this.cgstAmountPaise); })
  .set(function (val: number) { if (val !== undefined && val !== null) this.cgstAmountPaise = Math.round(val * 100); });

InvoiceItemSchema.virtual('sgstAmount')
  .get(function () { return paiseToRupees(this.sgstAmountPaise); })
  .set(function (val: number) { if (val !== undefined && val !== null) this.sgstAmountPaise = Math.round(val * 100); });

InvoiceItemSchema.virtual('igstAmount')
  .get(function () { return paiseToRupees(this.igstAmountPaise); })
  .set(function (val: number) { if (val !== undefined && val !== null) this.igstAmountPaise = Math.round(val * 100); });

InvoiceItemSchema.virtual('totalAmount')
  .get(function () { return paiseToRupees(this.totalAmountPaise); })
  .set(function (val: number) { if (val !== undefined && val !== null) this.totalAmountPaise = Math.round(val * 100); });

const InvoiceSchema = new Schema<IInvoice>({
  tenantId: { type: String, required: true, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
  invoiceNumber: { type: String, required: true, unique: true, index: true },
  salesOrderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  customerCode: { type: String, required: true },
  customerName: { type: String, required: true },
  customerGstin: { type: String },
  customerState: { type: String, required: true },
  customerStateCode: { type: String, required: true },
  factoryState: { type: String, default: 'Tamil Nadu' },
  placeOfSupply: { type: String, required: true },
  isInterState: { type: Boolean, required: true },
  items: [InvoiceItemSchema],
  taxableValuePaise: { type: Number, required: true, validate: integerPaiseValidator },
  cgstTotalPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  sgstTotalPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  igstTotalPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  grandTotalPaise: { type: Number, required: true, validate: integerPaiseValidator },
  paidAmountPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  balanceDuePaise: { type: Number, required: true, validate: integerPaiseValidator },
  paymentStatus: { 
    type: String, 
    required: true, 
    enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'],
    default: 'UNPAID',
    index: true 
  },
  isDispatched: { type: Boolean, default: false },
  dispatchStatus: { 
    type: String, 
    enum: ['PENDING', 'PARTIALLY_DISPATCHED', 'DISPATCHED'], 
    default: 'PENDING', 
    index: true 
  },
  dispatchDate: { type: Date },
  isCancelled: { type: Boolean, default: false, index: true },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  creditNoteId: { type: Schema.Types.ObjectId, ref: 'CreditNote' },
  creditNoteNumber: { type: String },
  irn: { type: String, index: true },
  ackNo: { type: String },
  ackDate: { type: Date },
  isMockEInvoice: { type: Boolean, default: false },
  dueDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

InvoiceSchema.virtual('taxableValue')
  .get(function () { return paiseToRupees(this.taxableValuePaise); })
  .set(function (val: number) { if (val !== undefined && val !== null) this.taxableValuePaise = Math.round(val * 100); });

InvoiceSchema.virtual('cgstTotal')
  .get(function () { return paiseToRupees(this.cgstTotalPaise); })
  .set(function (val: number) { if (val !== undefined && val !== null) this.cgstTotalPaise = Math.round(val * 100); });

InvoiceSchema.virtual('sgstTotal')
  .get(function () { return paiseToRupees(this.sgstTotalPaise); })
  .set(function (val: number) { if (val !== undefined && val !== null) this.sgstTotalPaise = Math.round(val * 100); });

InvoiceSchema.virtual('igstTotal')
  .get(function () { return paiseToRupees(this.igstTotalPaise); })
  .set(function (val: number) { if (val !== undefined && val !== null) this.igstTotalPaise = Math.round(val * 100); });

InvoiceSchema.virtual('grandTotal')
  .get(function () { return paiseToRupees(this.grandTotalPaise); })
  .set(function (val: number) { if (val !== undefined && val !== null) this.grandTotalPaise = Math.round(val * 100); });

InvoiceSchema.virtual('paidAmount')
  .get(function () { return paiseToRupees(this.paidAmountPaise); })
  .set(function (val: number) { if (val !== undefined && val !== null) this.paidAmountPaise = Math.round(val * 100); });

InvoiceSchema.virtual('balanceDue')
  .get(function () { return paiseToRupees(this.balanceDuePaise); })
  .set(function (val: number) { if (val !== undefined && val !== null) this.balanceDuePaise = Math.round(val * 100); });

InvoiceSchema.pre('validate', function (next) {
  if (this.items && Array.isArray(this.items)) {
    for (const item of this.items as any[]) {
      if (item.unitPricePaise === undefined && item.unitPrice !== undefined) item.unitPricePaise = Math.round(item.unitPrice * 100);
      if (item.taxableAmountPaise === undefined && item.taxableAmount !== undefined) item.taxableAmountPaise = Math.round(item.taxableAmount * 100);
      if (item.cgstAmountPaise === undefined && item.cgstAmount !== undefined) item.cgstAmountPaise = Math.round(item.cgstAmount * 100);
      if (item.sgstAmountPaise === undefined && item.sgstAmount !== undefined) item.sgstAmountPaise = Math.round(item.sgstAmount * 100);
      if (item.igstAmountPaise === undefined && item.igstAmount !== undefined) item.igstAmountPaise = Math.round(item.igstAmount * 100);
      if (item.totalAmountPaise === undefined && item.totalAmount !== undefined) item.totalAmountPaise = Math.round(item.totalAmount * 100);
    }
  }
  if (this.taxableValuePaise === undefined && (this as any).taxableValue !== undefined) this.taxableValuePaise = Math.round((this as any).taxableValue * 100);
  if (this.cgstTotalPaise === undefined && (this as any).cgstTotal !== undefined) this.cgstTotalPaise = Math.round((this as any).cgstTotal * 100);
  if (this.sgstTotalPaise === undefined && (this as any).sgstTotal !== undefined) this.sgstTotalPaise = Math.round((this as any).sgstTotal * 100);
  if (this.igstTotalPaise === undefined && (this as any).igstTotal !== undefined) this.igstTotalPaise = Math.round((this as any).igstTotal * 100);
  if (this.grandTotalPaise === undefined && (this as any).grandTotal !== undefined) this.grandTotalPaise = Math.round((this as any).grandTotal * 100);
  if (this.balanceDuePaise === undefined && (this as any).balanceDue !== undefined) this.balanceDuePaise = Math.round((this as any).balanceDue * 100);
  if (this.paidAmountPaise === undefined && (this as any).paidAmount !== undefined) this.paidAmountPaise = Math.round((this as any).paidAmount * 100);
  next();
});

export const Invoice = model<IInvoice>('Invoice', InvoiceSchema);
