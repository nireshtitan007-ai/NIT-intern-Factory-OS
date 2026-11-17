import { Schema, model, Document, Types } from 'mongoose';

export interface IBOMItem {
  materialId: Types.ObjectId;
  materialCode: string;
  materialName: string;
  quantityPerBatch: number;
  unit: string;
  standardRate: number;
}

export interface IBOM extends Document {
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
  standardRate: { type: Number, required: true }
}, { _id: false });

const BOMSchema = new Schema<IBOM>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
  productCode: { type: String, required: true },
  productName: { type: String, required: true },
  batchExpectedOutput: { type: Number, required: true, default: 200 },
  outputUnit: { type: String, default: 'packets' },
  tolerancePercent: { type: Number, default: 3 },
  rawMaterials: [BOMItemSchema],
  packagingMaterials: [BOMItemSchema],
  createdAt: { type: Date, default: Date.now }
});

export const BOM = model<IBOM>('BOM', BOMSchema);
