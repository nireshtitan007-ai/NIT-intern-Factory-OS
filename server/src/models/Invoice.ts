import { Schema, model, Document, Types } from 'mongoose';
import { integerPaiseValidator } from '../utils/money';

export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface IInvoiceItem {
  productId: Types.ObjectId;
  productCode: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  dispatchedQty?: number;
  unitPrice: number;
  unitPricePaise?: number;
  taxableAmount: number;
  taxableAmountPaise?: number;
  cgstRate: number;
  cgstAmount: number;
  cgstAmountPaise?: number;
  sgstRate: number;
  sgstAmount: number;
  sgstAmountPaise?: number;
  igstRate: number;
  igstAmount: number;
  igstAmountPaise?: number;
  totalAmount: number;
  totalAmountPaise?: number;
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
  taxableValuePaise?: number;
  cgstTotal: number;
  cgstTotalPaise?: number;
  sgstTotal: number;
  sgstTotalPaise?: number;
  igstTotal: number;
  igstTotalPaise?: number;
  grandTotal: number;
  grandTotalPaise?: number;
  paidAmount: number;
  paidAmountPaise?: number;
  balanceDue: number;
  balanceDuePaise?: number;
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
  unitPrice: { type: Number, required: true },
  unitPricePaise: { type: Number, default: 0, validate: integerPaiseValidator },
  taxableAmount: { type: Number, required: true },
  taxableAmountPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  cgstRate: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  cgstAmountPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  sgstRate: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  sgstAmountPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  igstRate: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  igstAmountPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  totalAmount: { type: Number, required: true },
  totalAmountPaise: { type: Number, default: 0, validate: integerPaiseValidator }
}, { _id: false });

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
  taxableValue: { type: Number, required: true },
  taxableValuePaise: { type: Number, default: 0, validate: integerPaiseValidator },
  cgstTotal: { type: Number, default: 0 },
  cgstTotalPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  sgstTotal: { type: Number, default: 0 },
  sgstTotalPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  igstTotal: { type: Number, default: 0 },
  igstTotalPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  grandTotal: { type: Number, required: true },
  grandTotalPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  paidAmount: { type: Number, default: 0 },
  paidAmountPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  balanceDue: { type: Number, required: true },
  balanceDuePaise: { type: Number, default: 0, validate: integerPaiseValidator },
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
});

InvoiceSchema.pre('save', function (next) {
  if (!this.taxableValuePaise && this.taxableValue) this.taxableValuePaise = Math.round(this.taxableValue * 100);
  if (!this.cgstTotalPaise && this.cgstTotal) this.cgstTotalPaise = Math.round(this.cgstTotal * 100);
  if (!this.sgstTotalPaise && this.sgstTotal) this.sgstTotalPaise = Math.round(this.sgstTotal * 100);
  if (!this.igstTotalPaise && this.igstTotal) this.igstTotalPaise = Math.round(this.igstTotal * 100);
  if (!this.grandTotalPaise && this.grandTotal) this.grandTotalPaise = Math.round(this.grandTotal * 100);
  if (!this.balanceDuePaise && this.balanceDue !== undefined) this.balanceDuePaise = Math.round(this.balanceDue * 100);
  if (!this.paidAmountPaise && this.paidAmount !== undefined) this.paidAmountPaise = Math.round(this.paidAmount * 100);
  next();
});

export const Invoice = model<IInvoice>('Invoice', InvoiceSchema);
