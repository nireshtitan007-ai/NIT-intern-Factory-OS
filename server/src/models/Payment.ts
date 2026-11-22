import { Schema, model, Document, Types } from 'mongoose';
import { integerPaiseValidator, paiseToRupees } from '../utils/money';

export interface IPayment extends Document {
  tenantId: string;
  paymentNumber: string;
  customerId: Types.ObjectId;
  customerCode: string;
  customerName: string;
  invoiceId: Types.ObjectId;
  invoiceNumber: string;
  amount: number;
  amountPaise: number;
  paymentMethod: string;
  reference?: string;
  date: Date;
  notes?: string;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  tenantId: { type: String, required: true, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
  paymentNumber: { type: String, required: true, unique: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  customerCode: { type: String, required: true },
  customerName: { type: String, required: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
  invoiceNumber: { type: String, required: true },
  amountPaise: { type: Number, required: true, validate: integerPaiseValidator },
  paymentMethod: { type: String, default: 'BANK_TRANSFER' },
  reference: { type: String },
  date: { type: Date, default: Date.now },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

PaymentSchema.virtual('amount')
  .get(function () {
    return paiseToRupees(this.amountPaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.amountPaise = Math.round(val * 100);
    }
  });

PaymentSchema.pre('validate', function (next) {
  if (this.amountPaise === undefined && (this as any).amount !== undefined) {
    this.amountPaise = Math.round((this as any).amount * 100);
  }
  next();
});

export const Payment = model<IPayment>('Payment', PaymentSchema);
