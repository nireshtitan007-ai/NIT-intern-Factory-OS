import { Schema, model, Document, Types } from 'mongoose';

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
  itemType: StockItemType;
  itemId: Types.ObjectId;
  itemCode: string;
  itemName: string;
  movementType: StockMovementType;
  quantity: number; // positive = inward, negative = outward
  unit: string;
  unitCost: number;
  totalCost: number;
  sourceDocType: 'PURCHASE' | 'PRODUCTION_RUN' | 'INVOICE' | 'MANUAL_ADJUSTMENT' | 'OPENING';
  sourceDocId?: string;
  batchNumber?: string;
  runningBalance: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>({
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
  totalCost: { type: Number, default: 0 },
  sourceDocType: { 
    type: String, 
    required: true, 
    enum: ['PURCHASE', 'PRODUCTION_RUN', 'INVOICE', 'MANUAL_ADJUSTMENT', 'OPENING'] 
  },
  sourceDocId: { type: String },
  batchNumber: { type: String },
  runningBalance: { type: Number, required: true },
  notes: { type: String },
  createdBy: { type: String, default: 'SYSTEM' },
  createdAt: { type: Date, default: Date.now, index: true }
});

export const StockMovement = model<IStockMovement>('StockMovement', StockMovementSchema);

