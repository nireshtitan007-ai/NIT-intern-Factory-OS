import { Types } from 'mongoose';
import { Purchase, IPurchase, RawMaterial, AuditLog } from '../models';
import { StockLedgerService } from './stockLedger.service';
import { 
  rupeesToPaise, 
  paiseToRupees, 
  mulQtyRate, 
  computeWAC 
} from '../utils/money';

export interface CreatePurchaseParams {
  tenantId?: string;
  supplierName: string;
  items: Array<{
    materialCode: string;
    quantity: number;
    rate: number;
  }>;
  notes?: string;
  date?: Date;
  createdBy?: string;
  userRole?: string;
}

export class PurchaseService {
  /**
   * Records a raw/packaging material purchase:
   * 1. Updates stock via StockMovement (PURCHASE_RECEIPT)
   * 2. Recalculates Weighted Average Cost (WAC)
   * 3. Creates Purchase document and audit log
   */
  static async recordPurchase(params: CreatePurchaseParams): Promise<IPurchase> {
    const tenantId = params.tenantId || 'TENANT_NASH_FOODS';
    const count = await Purchase.countDocuments({ tenantId });
    const purchaseNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const purchaseItems: any[] = [];
    let grandTotalPaise = 0;

    for (const item of params.items) {
      const material = await RawMaterial.findOne({ 
        tenantId, 
        code: item.materialCode.toUpperCase() 
      }) || await RawMaterial.findOne({ code: item.materialCode.toUpperCase() });

      if (!material) {
        throw new Error(`Material with code ${item.materialCode} not found`);
      }

      const ratePaise = rupeesToPaise(item.rate);
      const lineTotalPaise = Math.round(item.quantity * ratePaise);
      const lineTotal = paiseToRupees(lineTotalPaise);
      grandTotalPaise += lineTotalPaise;

      purchaseItems.push({
        materialId: material._id,
        materialCode: material.code,
        materialName: material.name,
        quantity: item.quantity,
        unit: material.unit,
        rate: item.rate,
        ratePaise,
        total: lineTotal,
        totalPaise: lineTotalPaise
      });

      // Update Weighted Average Cost using exact integer paise precision
      const oldStock = material.currentStock > 0 ? material.currentStock : 0;
      const oldRatePaise = material.currentWeightedRatePaise || rupeesToPaise(material.currentWeightedRate || material.standardRate);
      const oldValuePaise = material.totalValuePaise || Math.round(oldStock * oldRatePaise);

      const wac = computeWAC(oldStock, oldValuePaise, item.quantity, ratePaise);

      material.totalValuePaise = wac.totalValuePaise;
      material.currentWeightedRate = wac.rateRupeesPerUnit;
      material.currentWeightedRatePaise = Math.round(wac.ratePaisePerUnit);
      material.standardRate = item.rate;
      material.standardRatePaise = ratePaise;
      await material.save();

      // Record in Stock Movement Ledger
      await StockLedgerService.recordMovement({
        tenantId,
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

    const grandTotal = paiseToRupees(grandTotalPaise);

    const purchase = new Purchase({
      tenantId,
      purchaseNumber,
      supplierName: params.supplierName,
      items: purchaseItems,
      totalAmount: grandTotal,
      totalAmountPaise: grandTotalPaise,
      notes: params.notes,
      date: params.date || new Date(),
      status: 'RECEIVED'
    });

    await purchase.save();

    await AuditLog.create({
      tenantId,
      action: 'PURCHASE_RECORDED',
      entityType: 'Purchase',
      entityId: purchase._id.toString(),
      performedBy: params.createdBy || 'Purchase Manager',
      role: params.userRole || 'purchase',
      details: {
        purchaseNumber,
        supplierName: params.supplierName,
        totalAmount: grandTotal,
        totalAmountPaise: grandTotalPaise,
        itemsCount: purchaseItems.length
      }
    });

    return purchase;
  }
}
