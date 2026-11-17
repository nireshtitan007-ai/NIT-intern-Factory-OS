import { Schema, model, Document, Types } from 'mongoose';

export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface IInvoiceItem {
  productId: Types.ObjectId;
  productCode: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
}

export interface IInvoice extends Document {
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
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  isDispatched: boolean;
  dispatchDate?: Date;
  dueDate: Date;
  createdAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productCode: { type: String, required: true },
  productName: { type: String, required: true },
  hsnCode: { type: String, default: '19059040' },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxableAmount: { type: Number, required: true },
  cgstRate: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstRate: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>({
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
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    required: true, 
    enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'],
    default: 'UNPAID',
    index: true 
  },
  isDispatched: { type: Boolean, default: false },
  dispatchDate: { type: Date },
  dueDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  createdAt: { type: Date, default: Date.now, index: true }
});

export const Invoice = model<IInvoice>('Invoice', InvoiceSchema);
