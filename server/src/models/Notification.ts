import { Schema, model, Document } from 'mongoose';

export type NotificationStatus = 'PENDING' | 'QUEUED' | 'SENT' | 'FAILED';
export type NotificationTemplateType = 
  | 'ORDER_CONFIRMATION'
  | 'INVOICE_DELIVERY'
  | 'DISPATCH_ALERT'
  | 'PAYMENT_RECEIPT'
  | 'LOW_STOCK_ALERT'
  | 'PRODUCTION_VARIANCE_ALERT';

export interface INotification extends Document {
  recipientPhone: string;
  recipientName: string;
  templateType: NotificationTemplateType;
  messageBody: string;
  status: NotificationStatus;
  provider: 'OPENWA' | 'META_CLOUD_API';
  sourceDocType?: string;
  sourceDocId?: string;
  retryCount: number;
  deliveryStatus?: string;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipientPhone: { type: String, required: true, index: true },
  recipientName: { type: String, required: true },
  templateType: { 
    type: String, 
    required: true, 
    enum: [
      'ORDER_CONFIRMATION',
      'INVOICE_DELIVERY',
      'DISPATCH_ALERT',
      'PAYMENT_RECEIPT',
      'LOW_STOCK_ALERT',
      'PRODUCTION_VARIANCE_ALERT'
    ],
    index: true 
  },
  messageBody: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['PENDING', 'QUEUED', 'SENT', 'FAILED'],
    default: 'QUEUED',
    index: true 
  },
  provider: { type: String, default: 'OPENWA' },
  sourceDocType: { type: String },
  sourceDocId: { type: String },
  retryCount: { type: Number, default: 0 },
  deliveryStatus: { type: String, default: 'DELIVERED' },
  sentAt: { type: Date },
  error: { type: String },
  createdAt: { type: Date, default: Date.now, index: true }
});

export const Notification = model<INotification>('Notification', NotificationSchema);
