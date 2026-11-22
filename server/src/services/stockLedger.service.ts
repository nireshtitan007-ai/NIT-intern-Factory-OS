import { Types, ClientSession } from 'mongoose';
import { 
  StockMovement, 
  IStockMovement, 
  StockItemType, 
  StockMovementType, 
  RawMaterial, 
  Product 
} from '../models';
import { mulQtyRate } from '../utils/money';

export interface RecordMovementParams {
  tenantId?: string;
  itemType: StockItemType;
  itemId: string | Types.ObjectId;
  itemCode: string;
  itemName: string;
  movementType: StockMovementType;
  quantity: number; // positive for inward, negative for outward
  unit: string;
  unitCost?: number;
  unitCostPaise?: number;
  totalCost?: number;
  totalCostPaise?: number;
  sourceDocType: 'PURCHASE' | 'PRODUCTION_RUN' | 'INVOICE' | 'MANUAL_ADJUSTMENT' | 'OPENING';
  sourceDocId?: string;
  batchNumber?: string;
  expiryDate?: Date;
  notes?: string;
  createdBy?: string;
  session?: ClientSession | null;
}

export class StockLedgerService {
  /**
   * Appends an immutable stock movement to the ledger and updates cached stock atomically.
   * Concurrency-safe: utilizes findOneAndUpdate with condition `currentStock: { $gte: -qty }`
   * inside the mongoose transaction session.
   */
  static async recordMovement(params: RecordMovementParams): Promise<IStockMovement> {
    const objectId = typeof params.itemId === 'string' ? new Types.ObjectId(params.itemId) : params.itemId;
    const tenantId = params.tenantId || process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT';
    const session = params.session || undefined;
    
    let runningBalance: number;

    if (params.movementType === 'OPENING_BALANCE') {
      // Opening balance sets initial baseline stock without double-counting pre-set document fields
      let updatedDoc: any;
      if (params.itemType === 'FINISHED_GOOD') {
        updatedDoc = await Product.findOneAndUpdate(
          { _id: objectId, tenantId },
          { currentStock: params.quantity },
          { new: true, session }
        );
      } else {
        updatedDoc = await RawMaterial.findOneAndUpdate(
          { _id: objectId, tenantId },
          { currentStock: params.quantity },
          { new: true, session }
        );
      }
      runningBalance = updatedDoc ? updatedDoc.currentStock : params.quantity;
    } else if (params.quantity < 0) {
      // Outward movement: atomic decrement with stock-floor guard ($gte: Math.abs(qty))
      const requiredQty = Math.abs(params.quantity);
      let updatedDoc: any;

      if (params.itemType === 'FINISHED_GOOD') {
        updatedDoc = await Product.findOneAndUpdate(
          { _id: objectId, tenantId, currentStock: { $gte: requiredQty - 0.0001 } },
          { $inc: { currentStock: params.quantity } },
          { new: true, session }
        );
      } else {
        updatedDoc = await RawMaterial.findOneAndUpdate(
          { _id: objectId, tenantId, currentStock: { $gte: requiredQty - 0.0001 } },
          { $inc: { currentStock: params.quantity } },
          { new: true, session }
        );
      }

      if (!updatedDoc) {
        // Query current balance to return descriptive, defensive error message
        let currentStock = 0;
        if (params.itemType === 'FINISHED_GOOD') {
          const doc = await Product.findById(objectId).lean();
          currentStock = doc ? doc.currentStock : 0;
        } else {
          const doc = await RawMaterial.findById(objectId).lean();
          currentStock = doc ? doc.currentStock : 0;
        }

        throw new Error(
          `INSUFFICIENT_STOCK: Cannot issue ${requiredQty} ${params.unit} of ${params.itemCode}. Current stock is ${currentStock} ${params.unit}. Negative inventory is prohibited.`
        );
      }

      runningBalance = updatedDoc.currentStock;
    } else {
      // Inward movement: atomic increment
      let updatedDoc: any;
      if (params.itemType === 'FINISHED_GOOD') {
        updatedDoc = await Product.findOneAndUpdate(
          { _id: objectId, tenantId },
          { $inc: { currentStock: params.quantity } },
          { new: true, session }
        );
      } else {
        updatedDoc = await RawMaterial.findOneAndUpdate(
          { _id: objectId, tenantId },
          { $inc: { currentStock: params.quantity } },
          { new: true, session }
        );
      }
      runningBalance = updatedDoc ? updatedDoc.currentStock : params.quantity;
    }

    // Cost calculations with paise precision
    const unitCostPaise = params.unitCostPaise !== undefined 
      ? params.unitCostPaise 
      : (params.unitCost ? Math.round(params.unitCost * 100) : 0);
    const unitCost = params.unitCost !== undefined 
      ? params.unitCost 
      : (unitCostPaise / 100);

    const totalCostPaise = params.totalCostPaise !== undefined
      ? params.totalCostPaise
      : mulQtyRate(Math.abs(params.quantity), unitCostPaise);
    const totalCost = params.totalCost !== undefined
      ? params.totalCost
      : (totalCostPaise / 100);

    const roundedRunningBalance = Math.round(runningBalance * 1000) / 1000;

    const movement = new StockMovement({
      tenantId,
      itemType: params.itemType,
      itemId: objectId,
      itemCode: params.itemCode,
      itemName: params.itemName,
      movementType: params.movementType,
      quantity: params.quantity,
      unit: params.unit,
      unitCost,
      unitCostPaise,
      totalCost,
      totalCostPaise,
      sourceDocType: params.sourceDocType,
      sourceDocId: params.sourceDocId,
      batchNumber: params.batchNumber,
      expiryDate: params.expiryDate,
      runningBalance: roundedRunningBalance,
      notes: params.notes,
      createdBy: params.createdBy || 'SYSTEM',
      createdAt: new Date()
    });

    await movement.save({ session });
    return movement;
  }

  /**
   * Recomputes exact balance by aggregating all historical movements
   */
  static async calculateBalanceFromLedger(itemId: string | Types.ObjectId, tenantId: string = process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT'): Promise<number> {
    const objectId = typeof itemId === 'string' ? new Types.ObjectId(itemId) : itemId;
    const result = await StockMovement.aggregate([
      { $match: { tenantId, itemId: objectId } },
      { $group: { _id: '$itemId', totalBalance: { $sum: '$quantity' } } }
    ]);
    return result.length > 0 ? Math.round(result[0].totalBalance * 1000) / 1000 : 0;
  }

  /**
   * Reconciles cached currentStock on Product and RawMaterial against the immutable ledger sum.
   * Section 4.4 & 4.6 Audit Requirement.
   */
  static async reconcileInventory(tenantId: string = process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT') {
    const items: Array<{
      itemId: string;
      itemCode: string;
      itemName: string;
      itemType: StockItemType;
      cachedStock: number;
      ledgerStock: number;
      discrepancy: number;
      isBalanced: boolean;
    }> = [];

    const rawMaterials = await RawMaterial.find({ tenantId }).lean();
    for (const mat of rawMaterials) {
      const ledgerTotal = await this.calculateBalanceFromLedger(mat._id, tenantId);
      const cachedStock = mat.currentStock || 0;
      const discrepancy = Math.round((cachedStock - ledgerTotal) * 1000) / 1000;
      items.push({
        itemId: mat._id.toString(),
        itemCode: mat.code,
        itemName: mat.name,
        itemType: mat.category as StockItemType,
        cachedStock,
        ledgerStock: ledgerTotal,
        discrepancy,
        isBalanced: Math.abs(discrepancy) < 0.001
      });
    }

    const products = await Product.find({ tenantId }).lean();
    for (const prod of products) {
      const ledgerTotal = await this.calculateBalanceFromLedger(prod._id, tenantId);
      const cachedStock = prod.currentStock || 0;
      const discrepancy = Math.round((cachedStock - ledgerTotal) * 1000) / 1000;
      items.push({
        itemId: prod._id.toString(),
        itemCode: prod.code,
        itemName: prod.name,
        itemType: 'FINISHED_GOOD',
        cachedStock,
        ledgerStock: ledgerTotal,
        discrepancy,
        isBalanced: Math.abs(discrepancy) < 0.001
      });
    }

    const hasMismatches = items.some(i => !i.isBalanced);
    return {
      tenantId,
      timestamp: new Date().toISOString(),
      isFullyReconciled: !hasMismatches,
      totalItemsChecked: items.length,
      items
    };
  }

  /**
   * Returns a complete stock summary report matching Section 4.4 / Section 4.6
   */
  static async getStockSummary(tenantId?: string) {
    const filter = tenantId ? { tenantId } : {};
    const rawAndPackaging = await RawMaterial.find(filter).sort({ category: 1, name: 1 }).lean();
    const finishedGoods = await Product.find(filter).sort({ name: 1 }).lean();

    const summary: Array<{
      id: string;
      code: string;
      name: string;
      category: string;
      unit: string;
      openingStock: number;
      receipts: number;
      issuesOrSales: number;
      closingStock: number;
      ledgerBalance: number;
      rate: number;
      stockValue: number;
    }> = [];

    // Calculate movements for raw & packaging
    for (const mat of rawAndPackaging) {
      const movements = await StockMovement.find({ 
        itemId: mat._id,
        ...(tenantId ? { tenantId } : {})
      }).lean();
      let receipts = 0;
      let issues = 0;
      for (const m of movements) {
        if (m.movementType === 'OPENING_BALANCE') continue;
        if (m.quantity > 0) receipts += m.quantity;
        else issues += Math.abs(m.quantity);
      }

      const ledgerBalance = Math.round((mat.openingStock + receipts - issues) * 1000) / 1000;
      const rate = mat.currentWeightedRate || mat.standardRate;

      summary.push({
        id: mat._id.toString(),
        code: mat.code,
        name: mat.name,
        category: mat.category,
        unit: mat.unit,
        openingStock: mat.openingStock,
        receipts: Math.round(receipts * 1000) / 1000,
        issuesOrSales: Math.round(issues * 1000) / 1000,
        closingStock: mat.currentStock,
        ledgerBalance,
        rate,
        stockValue: Math.round(mat.currentStock * rate * 100) / 100
      });
    }

    // Calculate movements for finished goods
    for (const prod of finishedGoods) {
      const movements = await StockMovement.find({ 
        itemId: prod._id,
        ...(tenantId ? { tenantId } : {})
      }).lean();
      let receipts = 0;
      let sales = 0;
      for (const m of movements) {
        if (m.movementType === 'OPENING_BALANCE') continue;
        if (m.quantity > 0) receipts += m.quantity;
        else sales += Math.abs(m.quantity);
      }

      const ledgerBalance = Math.round((prod.openingStock + receipts - sales) * 1000) / 1000;

      summary.push({
        id: prod._id.toString(),
        code: prod.code,
        name: `${prod.name} (${prod.packSize})`,
        category: 'FINISHED_GOOD',
        unit: prod.unit,
        openingStock: prod.openingStock,
        receipts: Math.round(receipts * 1000) / 1000,
        issuesOrSales: Math.round(sales * 1000) / 1000,
        closingStock: prod.currentStock,
        ledgerBalance,
        rate: prod.sellingPrice,
        stockValue: Math.round(prod.currentStock * prod.sellingPrice * 100) / 100
      });
    }

    return summary;
  }

  /**
   * Retrieves full ledger movements with optional filters
   */
  static async getLedgerMovements(filters: {
    tenantId?: string;
    itemId?: string;
    itemType?: StockItemType;
    sourceDocType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const query: any = {};
    if (filters.tenantId) query.tenantId = filters.tenantId;
    if (filters.itemId) query.itemId = new Types.ObjectId(filters.itemId);
    if (filters.itemType) query.itemType = filters.itemType;
    if (filters.sourceDocType) query.sourceDocType = filters.sourceDocType;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    return StockMovement.find(query).sort({ createdAt: -1, _id: -1 }).lean();
  }
}
