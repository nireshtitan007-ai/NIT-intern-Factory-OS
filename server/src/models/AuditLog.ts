import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  role: string;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, required: true, index: true },
  performedBy: { type: String, required: true },
  role: { type: String, required: true },
  details: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
});

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
