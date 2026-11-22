import { Schema, model, Document, Types } from 'mongoose';
import { integerPaiseValidator, paiseToRupees } from '../utils/money';

export interface ICreditNote extends Document {
  tenantId: string;
  creditNoteNumber: string;
  invoiceId: Types.ObjectId;
  invoiceNumber: string;
  customerId: Types.ObjectId;
  customerCode: string;
  customerName: string;
  customerState: string;
  customerStateCode: string;
  customerGstin?: string;
  reason: string;
  taxableValuePaise: number;
  cgstTotalPaise: number;
  sgstTotalPaise: number;
  igstTotalPaise: number;
  grandTotalPaise: number;
  taxableValue: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  isInterState: boolean;
  financialYear: string;
  cancelledBy: string;
  role: string;
  createdAt: Date;
}

const CreditNoteSchema = new Schema<ICreditNote>({
  tenantId: { type: String, required: true, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
  creditNoteNumber: { type: String, required: true, unique: true, index: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
  invoiceNumber: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  customerCode: { type: String, required: true },
  customerName: { type: String, required: true },
  customerState: { type: String, required: true },
  customerStateCode: { type: String, required: true },
  customerGstin: { type: String },
  reason: { type: String, required: true },
  taxableValuePaise: { type: Number, required: true, validate: integerPaiseValidator },
  cgstTotalPaise: { type: Number, required: true, validate: integerPaiseValidator },
  sgstTotalPaise: { type: Number, required: true, validate: integerPaiseValidator },
  igstTotalPaise: { type: Number, required: true, validate: integerPaiseValidator },
  grandTotalPaise: { type: Number, required: true, validate: integerPaiseValidator },
  isInterState: { type: Boolean, required: true },
  financialYear: { type: String, required: true, index: true },
  cancelledBy: { type: String, required: true },
  role: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

CreditNoteSchema.virtual('taxableValue').get(function () {
  return paiseToRupees(this.taxableValuePaise);
});

CreditNoteSchema.virtual('cgstTotal').get(function () {
  return paiseToRupees(this.cgstTotalPaise);
});

CreditNoteSchema.virtual('sgstTotal').get(function () {
  return paiseToRupees(this.sgstTotalPaise);
});

CreditNoteSchema.virtual('igstTotal').get(function () {
  return paiseToRupees(this.igstTotalPaise);
});

CreditNoteSchema.virtual('grandTotal').get(function () {
  return paiseToRupees(this.grandTotalPaise);
});

export const CreditNote = model<ICreditNote>('CreditNote', CreditNoteSchema);
