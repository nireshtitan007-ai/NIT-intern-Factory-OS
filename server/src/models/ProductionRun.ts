import { Schema, model, Document, Types } from 'mongoose';

export interface IIssuedMaterial {
  materialId: Types.ObjectId;
  materialCode: string;
  materialName: string;
  standardQty: number;
  actualQtyIssued: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  varianceQty: number; // actual - standard
  variancePercent: number; // ((actual - standard) / standard) * 100
  varianceFlagged: boolean;
}

export interface IProductionRun extends Document {
  runNumber: string;
  productId: Types.ObjectId;
  productCode: string;
  productName: string;
  batchExpectedOutput: number; // e.g. 200
  actualOutputPackets: number; // e.g. 188
  damagedPouches: number; // e.g. 6
  cartonsUsed: number; // e.g. 9
  yieldPercent: number; // e.g. 94%
  yieldVariancePercent: number; // e.g. -6%
  yieldVarianceFlagged: boolean;
  materialsIssued: IIssuedMaterial[];
  directLaborCost: number; // e.g. 1200
  directOverheadCost: number; // e.g. 600
  totalMaterialCost: number;
  totalProductionCost: number;
  costPerPacket: number;
  supervisorName: string;
  notes?: string;
  status: 'COMPLETED';
  createdAt: Date;
}

const IssuedMaterialSchema = new Schema<IIssuedMaterial>({
  materialId: { type: Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
  materialCode: { type: String, required: true },
  materialName: { type: String, required: true },
  standardQty: { type: Number, required: true },
  actualQtyIssued: { type: Number, required: true },
  unit: { type: String, required: true },
  unitCost: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  varianceQty: { type: Number, required: true },
  variancePercent: { type: Number, required: true },
  varianceFlagged: { type: Boolean, default: false }
}, { _id: false });

const ProductionRunSchema = new Schema<IProductionRun>({
  runNumber: { type: String, required: true, unique: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productCode: { type: String, required: true },
  productName: { type: String, required: true },
  batchExpectedOutput: { type: Number, required: true },
  actualOutputPackets: { type: Number, required: true },
  damagedPouches: { type: Number, default: 0 },
  cartonsUsed: { type: Number, default: 0 },
  yieldPercent: { type: Number, required: true },
  yieldVariancePercent: { type: Number, required: true },
  yieldVarianceFlagged: { type: Boolean, default: false },
  materialsIssued: [IssuedMaterialSchema],
  directLaborCost: { type: Number, default: 0 },
  directOverheadCost: { type: Number, default: 0 },
  totalMaterialCost: { type: Number, default: 0 },
  totalProductionCost: { type: Number, default: 0 },
  costPerPacket: { type: Number, default: 0 },
  supervisorName: { type: String, default: 'Production Supervisor' },
  notes: { type: String },
  status: { type: String, default: 'COMPLETED' },
  createdAt: { type: Date, default: Date.now }
});

export const ProductionRun = model<IProductionRun>('ProductionRun', ProductionRunSchema);
