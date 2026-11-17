import { Types } from 'mongoose';
import { 
  StockMovement, 
  IStockMovement, 
  StockItemType, 
  StockMovementType, 
  RawMaterial, 
  Product 
} from '../models';

export interface RecordMovementParams {
  itemType: StockItemType;
  itemId: string | Types.ObjectId;
  itemCode: string;
  itemName: string;
  movementType: StockMovementType;
  quantity: number; // positive for inward, negative for outward
  unit: string;
  unitCost?: number;
  sourceDocType: 'PURCHASE' | 'PRODUCTION_RUN' | 'INVOICE' | 'MANUAL_ADJUSTMENT' | 'OPENING';
  sourceDocId?: string;
  batchNumber?: string;
  notes?: string;
  createdBy?: string;
}

export class StockLedgerService {
  /**
   * Appends an immutable stock movement to the ledger and updates cached stock.
   */
  static async recordMovement(params: RecordMovementParams): Promise<IStockMovement> {
    const objectId = typeof params.itemId === 'string' ? new Types.ObjectId(params.itemId) : params.itemId;
    
    // Find latest movement for this item to determine previous running balance
    const lastMovement = await StockMovement.findOne({ itemId: objectId })
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    const previousBalance = lastMovement ? lastMovement.runningBalance : 0;
    // Round to 3 decimal places to prevent float precision drift
    const newRunningBalance = Math.round((previousBalance + params.quantity) * 1000) / 1000;

    const unitCost = params.unitCost || 0;
    const totalCost = Math.round(Math.abs(params.quantity) * unitCost * 100) / 100;

    const movement = new StockMovement({
      itemType: params.itemType,
      itemId: objectId,
      itemCode: params.itemCode,
      itemName: params.itemName,
      movementType: params.movementType,
      quantity: params.quantity,
      unit: params.unit,
      unitCost,
      totalCost,
      sourceDocType: params.sourceDocType,
      sourceDocId: params.sourceDocId,
      batchNumber: params.batchNumber,
      runningBalance: newRunningBalance,
      notes: params.notes,
      createdBy: params.createdBy || 'SYSTEM',
      createdAt: new Date()
    });

    await movement.save();

    // Synchronize fast-lookup balance on parent document
    if (params.itemType === 'FINISHED_GOOD') {
      await Product.findByIdAndUpdate(objectId, { currentStock: newRunningBalance });
    } else {
      await RawMaterial.findByIdAndUpdate(objectId, { currentStock: newRunningBalance });
    }

    return movement;
  }

  /**
   * Recomputes exact balance by aggregating all historical movements
   */
  static async calculateBalanceFromLedger(itemId: string | Types.ObjectId): Promise<number> {
    const objectId = typeof itemId === 'string' ? new Types.ObjectId(itemId) : itemId;
    const result = await StockMovement.aggregate([
      { $match: { itemId: objectId } },
      { $group: { _id: '$itemId', totalBalance: { $sum: '$quantity' } } }
    ]);
    return result.length > 0 ? Math.round(result[0].totalBalance * 1000) / 1000 : 0;
  }

  /**
   * Returns a complete stock summary report matching Section 4.4 / Section 4.6
   */
  static async getStockSummary() {
    const rawAndPackaging = await RawMaterial.find().sort({ category: 1, name: 1 }).lean();
    const finishedGoods = await Product.find().sort({ name: 1 }).lean();

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
      const movements = await StockMovement.find({ itemId: mat._id }).lean();
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
      const movements = await StockMovement.find({ itemId: prod._id }).lean();
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
    itemId?: string;
    itemType?: StockItemType;
    sourceDocType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const query: any = {};
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
