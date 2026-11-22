import { Schema, model, Document, Types } from 'mongoose';
import { integerPaiseValidator } from '../utils/money';

export type StockItemType = 'RAW_MATERIAL' | 'PACKAGING' | 'FINISHED_GOOD';
export type StockMovementType = 
  | 'OPENING_BALANCE'
  | 'PURCHASE_RECEIPT'
  | 'PRODUCTION_ISSUE'
  | 'PRODUCTION_RECEIPT'
  | 'SALES_DISPATCH'
  | 'DAMAGED_SCRAP'
  | 'ADJUSTMENT';

export interface IStockMovement extends Document {
  tenantId: string;
  itemType: StockItemType;
  itemId: Types.ObjectId;
  itemCode: string;
  itemName: string;
  movementType: StockMovementType;
  quantity: number; // positive = inward, negative = outward
  unit: string;
  unitCost: number; // in INR
  unitCostPaise?: number;
  totalCost: number; // in INR
  totalCostPaise?: number;
  sourceDocType: 'PURCHASE' | 'PRODUCTION_RUN' | 'INVOICE' | 'MANUAL_ADJUSTMENT' | 'OPENING';
  sourceDocId?: string;
  batchNumber?: string;
  expiryDate?: Date;
  runningBalance: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>({
  tenantId: { type: String, required: true, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
  itemType: { 
    type: String, 
    required: true, 
    enum: ['RAW_MATERIAL', 'PACKAGING', 'FINISHED_GOOD'],
    index: true 
  },
  itemId: { type: Schema.Types.ObjectId, required: true, index: true },
  itemCode: { type: String, required: true },
  itemName: { type: String, required: true },
  movementType: { 
    type: String, 
    required: true, 
    enum: [
      'OPENING_BALANCE',
      'PURCHASE_RECEIPT',
      'PRODUCTION_ISSUE',
      'PRODUCTION_RECEIPT',
      'SALES_DISPATCH',
      'DAMAGED_SCRAP',
      'ADJUSTMENT'
    ],
    index: true 
  },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  unitCost: { type: Number, default: 0 },
  unitCostPaise: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  totalCostPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  sourceDocType: { 
    type: String, 
    required: true, 
    enum: ['PURCHASE', 'PRODUCTION_RUN', 'INVOICE', 'MANUAL_ADJUSTMENT', 'OPENING'] 
  },
  sourceDocId: { type: String },
  batchNumber: { type: String },
  expiryDate: { type: Date },
  runningBalance: { type: Number, required: true },
  notes: { type: String },
  createdBy: { type: String, default: 'SYSTEM' },
  createdAt: { type: Date, default: Date.now, index: true }
});

// Enforce strict ledger immutability
StockMovementSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('IMMUTABLE_LEDGER_VIOLATION: Existing StockMovement records cannot be modified.'));
  }
  if (!this.unitCostPaise && this.unitCost) {
    this.unitCostPaise = Math.round(this.unitCost * 100);
  }
  if (!this.totalCostPaise && this.totalCost) {
    this.totalCostPaise = Math.round(this.totalCost * 100);
  }
  next();
});

const blockMutation = function (this: any) {
  // Allow reset strictly during initial test DB wipe if ALLOW_LEDGER_RESET is enabled
  if (process.env.ALLOW_LEDGER_RESET === 'true') {
    return;
  }
  throw new Error('IMMUTABLE_LEDGER_VIOLATION: StockMovement ledger entries are strictly immutable and cannot be updated or deleted.');
};

StockMovementSchema.pre('updateOne', blockMutation);
StockMovementSchema.pre('updateMany', blockMutation);
StockMovementSchema.pre('findOneAndUpdate', blockMutation);
StockMovementSchema.pre('deleteOne', blockMutation);
StockMovementSchema.pre('deleteMany', blockMutation);
StockMovementSchema.pre('findOneAndDelete', blockMutation);

export const StockMovement = model<IStockMovement>('StockMovement', StockMovementSchema);
