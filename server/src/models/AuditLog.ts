import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  tenantId: string;
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
  tenantId: { type: String, required: true, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, required: true, index: true },
  performedBy: { type: String, required: true },
  role: { type: String, required: true },
  details: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Enforce append-only immutable audit trail: no updates or deletes permitted
AuditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('IMMUTABLE_AUDIT_LOG_VIOLATION: AuditLog records are append-only and cannot be updated.'));
  }
  next();
});

const blockAuditMutation = function (this: any) {
  // Allow reset strictly during initial test DB wipe if ALLOW_LEDGER_RESET is enabled
  if (process.env.ALLOW_LEDGER_RESET === 'true') {
    return;
  }
  throw new Error('IMMUTABLE_AUDIT_LOG_VIOLATION: AuditLog entries are strictly append-only and cannot be modified or deleted.');
};

AuditLogSchema.pre('updateOne', blockAuditMutation);
AuditLogSchema.pre('updateMany', blockAuditMutation);
AuditLogSchema.pre('findOneAndUpdate', blockAuditMutation);
AuditLogSchema.pre('deleteOne', blockAuditMutation);
AuditLogSchema.pre('deleteMany', blockAuditMutation);
AuditLogSchema.pre('findOneAndDelete', blockAuditMutation);

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
