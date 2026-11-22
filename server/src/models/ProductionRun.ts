import { Schema, model, Document, Types } from 'mongoose';
import { integerPaiseValidator } from '../utils/money';

export interface IIssuedMaterial {
  materialId: Types.ObjectId;
  materialCode: string;
  materialName: string;
  standardQty: number;
  actualQtyIssued: number;
  unit: string;
  unitCost: number;
  unitCostPaise?: number;
  totalCost: number;
  totalCostPaise?: number;
  varianceQty: number; // actual - standard
  variancePercent: number; // ((actual - standard) / standard) * 100
  varianceFlagged: boolean;
}

export interface IProductionRun extends Document {
  tenantId: string;
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
  directLaborCostPaise?: number;
  directOverheadCost: number; // e.g. 600
  directOverheadCostPaise?: number;
  totalMaterialCost: number;
  totalMaterialCostPaise?: number;
  totalProductionCost: number;
  totalProductionCostPaise?: number;
  costPerPacket: number;
  costPerPacketPaise?: number;
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
  unitCostPaise: { type: Number, default: 0 },
  totalCost: { type: Number, required: true },
  totalCostPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  varianceQty: { type: Number, required: true },
  variancePercent: { type: Number, required: true },
  varianceFlagged: { type: Boolean, default: false }
}, { _id: false });

const ProductionRunSchema = new Schema<IProductionRun>({
  tenantId: { type: String, required: true, default: () => process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT', index: true },
  runNumber: { type: String, required: true, unique: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
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
  directLaborCostPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  directOverheadCost: { type: Number, default: 0 },
  directOverheadCostPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  totalMaterialCost: { type: Number, required: true },
  totalMaterialCostPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  totalProductionCost: { type: Number, required: true },
  totalProductionCostPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  costPerPacket: { type: Number, required: true },
  costPerPacketPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  supervisorName: { type: String, required: true },
  notes: { type: String },
  status: { type: String, default: 'COMPLETED' },
  createdAt: { type: Date, default: Date.now, index: true }
});

ProductionRunSchema.pre('save', function (next) {
  if (!this.directLaborCostPaise && this.directLaborCost) this.directLaborCostPaise = Math.round(this.directLaborCost * 100);
  if (!this.directOverheadCostPaise && this.directOverheadCost) this.directOverheadCostPaise = Math.round(this.directOverheadCost * 100);
  if (!this.totalMaterialCostPaise && this.totalMaterialCost) this.totalMaterialCostPaise = Math.round(this.totalMaterialCost * 100);
  if (!this.totalProductionCostPaise && this.totalProductionCost) this.totalProductionCostPaise = Math.round(this.totalProductionCost * 100);
  if (!this.costPerPacketPaise && this.costPerPacket) this.costPerPacketPaise = Math.round(this.costPerPacket * 100);
  next();
});

export const ProductionRun = model<IProductionRun>('ProductionRun', ProductionRunSchema);
