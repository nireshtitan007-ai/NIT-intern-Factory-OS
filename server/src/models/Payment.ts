import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  paymentNumber: string;
  customerId: Types.ObjectId;
  customerCode: string;
  customerName: string;
  invoiceId: Types.ObjectId;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  date: Date;
  notes?: string;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  paymentNumber: { type: String, required: true, unique: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  customerCode: { type: String, required: true },
  customerName: { type: String, required: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
  invoiceNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'BANK_TRANSFER' },
  reference: { type: String },
  date: { type: Date, default: Date.now },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Payment = model<IPayment>('Payment', PaymentSchema);

