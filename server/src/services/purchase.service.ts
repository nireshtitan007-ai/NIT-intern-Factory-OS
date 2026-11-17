import { Types } from 'mongoose';
import { Purchase, IPurchase, RawMaterial, AuditLog } from '../models';
import { StockLedgerService } from './stockLedger.service';

export interface CreatePurchaseParams {
  supplierName: string;
  items: Array<{
    materialCode: string;
    quantity: number;
    rate: number;
  }>;
  notes?: string;
  date?: Date;
  createdBy?: string;
}

export class PurchaseService {
  /**
   * Records a raw/packaging material purchase:
   * 1. Updates stock via StockMovement (PURCHASE_RECEIPT)
   * 2. Recalculates Weighted Average Cost (WAC)
   * 3. Creates Purchase document and audit log
   */
  static async recordPurchase(params: CreatePurchaseParams): Promise<IPurchase> {
    const count = await Purchase.countDocuments();
    const purchaseNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const purchaseItems: any[] = [];
    let grandTotal = 0;

    for (const item of params.items) {
      const material = await RawMaterial.findOne({ code: item.materialCode.toUpperCase() });
      if (!material) {
        throw new Error(`Material with code ${item.materialCode} not found`);
      }

      const lineTotal = Math.round(item.quantity * item.rate * 100) / 100;
      grandTotal += lineTotal;

      purchaseItems.push({
        materialId: material._id,
        materialCode: material.code,
        materialName: material.name,
        quantity: item.quantity,
        unit: material.unit,
        rate: item.rate,
        total: lineTotal
      });

      // Update Weighted Average Cost
      const oldStock = material.currentStock > 0 ? material.currentStock : 0;
      const oldRate = material.currentWeightedRate || material.standardRate;
      const totalCostValue = (oldStock * oldRate) + (item.quantity * item.rate);
      const newTotalStock = oldStock + item.quantity;
      const newWeightedRate = newTotalStock > 0 
        ? Math.round((totalCostValue / newTotalStock) * 1000) / 1000 
        : item.rate;

      material.currentWeightedRate = newWeightedRate;
      material.standardRate = item.rate;
      await material.save();

      // Record in Stock Movement Ledger
      await StockLedgerService.recordMovement({
        itemType: material.category,
        itemId: material._id,
        itemCode: material.code,
        itemName: material.name,
        movementType: 'PURCHASE_RECEIPT',
        quantity: item.quantity,
        unit: material.unit,
        unitCost: item.rate,
        sourceDocType: 'PURCHASE',
        sourceDocId: purchaseNumber,
        notes: `Purchase from ${params.supplierName} (${purchaseNumber})`,
        createdBy: params.createdBy || 'PURCHASE_MANAGER'
      });
    }

    const purchase = new Purchase({
      purchaseNumber,
      supplierName: params.supplierName,
      items: purchaseItems,
      totalAmount: grandTotal,
      notes: params.notes,
      date: params.date || new Date(),
      status: 'RECEIVED'
    });

    await purchase.save();

    await AuditLog.create({
      action: 'PURCHASE_RECORDED',
      entityType: 'Purchase',
      entityId: purchase._id.toString(),
      performedBy: params.createdBy || 'PURCHASE_MANAGER',
      role: 'purchase',
      details: {
        purchaseNumber,
        supplierName: params.supplierName,
        totalAmount: grandTotal,
        itemsCount: purchaseItems.length
      }
    });

    return purchase;
  }
}

