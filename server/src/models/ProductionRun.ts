import { Schema, model, Document, Types } from 'mongoose';
import { integerPaiseValidator, paiseToRupees } from '../utils/money';

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
  totalCostPaise: number;
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
  directLaborCostPaise: number;
  directOverheadCost: number; // e.g. 600
  directOverheadCostPaise: number;
  totalMaterialCost: number;
  totalMaterialCostPaise: number;
  totalProductionCost: number;
  totalProductionCostPaise: number;
  costPerPacket: number;
  costPerPacketPaise: number;
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
  unitCostPaise: { type: Number, default: 0 },
  totalCostPaise: { type: Number, required: true, validate: integerPaiseValidator },
  varianceQty: { type: Number, required: true },
  variancePercent: { type: Number, required: true },
  varianceFlagged: { type: Boolean, default: false }
}, { 
  _id: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

IssuedMaterialSchema.virtual('unitCost')
  .get(function () {
    return paiseToRupees(this.unitCostPaise || 0);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.unitCostPaise = val * 100;
    }
  });

IssuedMaterialSchema.virtual('totalCost')
  .get(function () {
    return paiseToRupees(this.totalCostPaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) {
      this.totalCostPaise = Math.round(val * 100);
    }
  });

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
  directLaborCostPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  directOverheadCostPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  totalMaterialCostPaise: { type: Number, required: true, validate: integerPaiseValidator },
  totalProductionCostPaise: { type: Number, required: true, validate: integerPaiseValidator },
  costPerPacketPaise: { type: Number, default: 0, validate: integerPaiseValidator },
  supervisorName: { type: String, required: true },
  notes: { type: String },
  status: { type: String, default: 'COMPLETED' },
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ProductionRunSchema.virtual('directLaborCost')
  .get(function () {
    return paiseToRupees(this.directLaborCostPaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) this.directLaborCostPaise = Math.round(val * 100);
  });

ProductionRunSchema.virtual('directOverheadCost')
  .get(function () {
    return paiseToRupees(this.directOverheadCostPaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) this.directOverheadCostPaise = Math.round(val * 100);
  });

ProductionRunSchema.virtual('totalMaterialCost')
  .get(function () {
    return paiseToRupees(this.totalMaterialCostPaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) this.totalMaterialCostPaise = Math.round(val * 100);
  });

ProductionRunSchema.virtual('totalProductionCost')
  .get(function () {
    return paiseToRupees(this.totalProductionCostPaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) this.totalProductionCostPaise = Math.round(val * 100);
  });

ProductionRunSchema.virtual('costPerPacket')
  .get(function () {
    return paiseToRupees(this.costPerPacketPaise);
  })
  .set(function (val: number) {
    if (val !== undefined && val !== null) this.costPerPacketPaise = Math.round(val * 100);
  });

ProductionRunSchema.pre('validate', function (next) {
  if (this.materialsIssued && Array.isArray(this.materialsIssued)) {
    for (const item of this.materialsIssued as any[]) {
      if (item.unitCostPaise === undefined && item.unitCost !== undefined) {
        item.unitCostPaise = Math.round(item.unitCost * 100);
      }
      if (item.totalCostPaise === undefined && item.totalCost !== undefined) {
        item.totalCostPaise = Math.round(item.totalCost * 100);
      }
    }
  }
  if (this.directLaborCostPaise === undefined && (this as any).directLaborCost !== undefined) {
    this.directLaborCostPaise = Math.round((this as any).directLaborCost * 100);
  }
  if (this.directOverheadCostPaise === undefined && (this as any).directOverheadCost !== undefined) {
    this.directOverheadCostPaise = Math.round((this as any).directOverheadCost * 100);
  }
  if (this.totalMaterialCostPaise === undefined && (this as any).totalMaterialCost !== undefined) {
    this.totalMaterialCostPaise = Math.round((this as any).totalMaterialCost * 100);
  }
  if (this.totalProductionCostPaise === undefined && (this as any).totalProductionCost !== undefined) {
    this.totalProductionCostPaise = Math.round((this as any).totalProductionCost * 100);
  }
  if (this.costPerPacketPaise === undefined && (this as any).costPerPacket !== undefined) {
    this.costPerPacketPaise = Math.round((this as any).costPerPacket * 100);
  }
  next();
});

export const ProductionRun = model<IProductionRun>('ProductionRun', ProductionRunSchema);
