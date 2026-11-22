import { Schema, model, Document, Types } from 'mongoose';

export type BOMConsumptionBasis = 'PER_BATCH' | 'PER_GOOD_PACKET_PLUS_SCRAP' | 'PER_N_PACKETS';

export interface IBOMItem {
  materialId: Types.ObjectId;
  materialCode: string;
  materialName: string;
  quantityPerBatch: number;
  unit: string;
  standardRate: number;
  standardRatePaise?: number;
  consumptionBasis?: BOMConsumptionBasis;
  packetsPerUnit?: number;
}

export interface IBOM extends Document {
  tenantId: string;
  productId: Types.ObjectId;
  productCode: string;
  productName: string;
  batchExpectedOutput: number; // e.g. 200 packets
  outputUnit: string; // 'packets'
  tolerancePercent: number; // e.g. 3%
  rawMaterials: IBOMItem[];
  packagingMaterials: IBOMItem[];
  createdAt: Date;
}

const BOMItemSchema = new Schema<IBOMItem>({
  materialId: { type: Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
  materialCode: { type: String, required: true },
  materialName: { type: String, required: true },
  quantityPerBatch: { type: Number, required: true },
  unit: { type: String, required: true },
  standardRate: { type: Number, required: true },
  standardRatePaise: { type: Number, default: 0 },
  consumptionBasis: { 
    type: String, 
    enum: ['PER_BATCH', 'PER_GOOD_PACKET_PLUS_SCRAP', 'PER_N_PACKETS'], 
    default: 'PER_BATCH' 
  },
  packetsPerUnit: { type: Number, default: 1 }
}, { _id: false });

const BOMSchema = new Schema<IBOM>({
  tenantId: { type: String, required: true, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productCode: { type: String, required: true },
  productName: { type: String, required: true },
  batchExpectedOutput: { type: Number, required: true, default: 200 },
  outputUnit: { type: String, default: 'packets' },
  tolerancePercent: { type: Number, default: 3 },
  rawMaterials: [BOMItemSchema],
  packagingMaterials: [BOMItemSchema],
  createdAt: { type: Date, default: Date.now }
});

BOMSchema.index({ tenantId: 1, productId: 1 }, { unique: true });

export const BOM = model<IBOM>('BOM', BOMSchema);
