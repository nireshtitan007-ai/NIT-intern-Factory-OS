import mongoose, { Document, Schema } from 'mongoose';

export interface IInquiry extends Document {
  name: string;
  email: string;
  phone: string;
  company: string;
  fleetSize?: string;
  inquiryType: 'demo' | 'contact' | 'enterprise_quote' | 'pilot_registration';
  message?: string;
  status: 'new' | 'contacted' | 'approved' | 'closed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<IInquiry>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    fleetSize: { type: String, default: '1-5' },
    inquiryType: { 
      type: String, 
      enum: ['demo', 'contact', 'enterprise_quote', 'pilot_registration'], 
      default: 'contact' 
    },
    message: { type: String, default: '' },
    status: { 
      type: String, 
      enum: ['new', 'contacted', 'approved', 'closed'], 
      default: 'new' 
    },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Inquiry = mongoose.model<IInquiry>('Inquiry', InquirySchema);
