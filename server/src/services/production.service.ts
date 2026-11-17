import { Types } from 'mongoose';
import { 
  BOM, 
  Product, 
  RawMaterial, 
  ProductionRun, 
  IProductionRun, 
  AuditLog 
} from '../models';
import { StockLedgerService } from './stockLedger.service';

export interface ExecuteProductionRunParams {
  productId: string;
  batchExpectedOutput?: number; // defaults to BOM output (e.g. 200)
  materialIssues: Array<{
    materialCode: string;
    actualQtyIssued: number;
  }>;
  actualOutputPackets: number; // e.g. 188
  damagedPouches?: number; // e.g. 6
  cartonsUsed?: number; // e.g. 9
  directLaborCost?: number; // e.g. 1200
  directOverheadCost?: number; // e.g. 600
  supervisorName?: string;
  notes?: string;
}

export class ProductionService {
  /**
   * Executes a complete production run:
   * 1. Validates against BOM
   * 2. Computes consumption variance and yield variance
   * 3. Flags variances exceeding tolerance
   * 4. Deducts raw & packaging materials from stock ledger
   * 5. Credits finished goods to stock ledger
   * 6. Calculates cost-per-packet
   */
  static async executeRun(params: ExecuteProductionRunParams): Promise<IProductionRun> {
    const product = await Product.findById(params.productId);
    if (!product) throw new Error(`Product with ID ${params.productId} not found`);

    const bom = await BOM.findOne({ productId: product._id });
    if (!bom) throw new Error(`No BOM found for product ${product.name}`);

    const batchExpectedOutput = params.batchExpectedOutput || bom.batchExpectedOutput;
    const actualOutputPackets = params.actualOutputPackets;
    const damagedPouches = params.damagedPouches || 0;
    const cartonsUsed = params.cartonsUsed || 0;
    const tolerance = bom.tolerancePercent || 3;

    // Yield Calculations
    const yieldPercent = Math.round((actualOutputPackets / batchExpectedOutput) * 10000) / 100; // e.g. 94.00%
    const yieldVariancePercent = Math.round((yieldPercent - 100) * 100) / 100; // e.g. -6.00%
    const yieldVarianceFlagged = Math.abs(yieldVariancePercent) > tolerance;

    // Generate unique Run Number
    const count = await ProductionRun.countDocuments();
    const runNumber = `PR-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const issuedMaterialsList: any[] = [];
    let totalMaterialCost = 0;

    // Map input issues by code
    const issueMap = new Map<string, number>();
    for (const item of params.materialIssues) {
      issueMap.set(item.materialCode.toUpperCase(), item.actualQtyIssued);
    }

    // Process Raw Materials from BOM
    for (const bomRaw of bom.rawMaterials) {
      const rawMaterial = await RawMaterial.findById(bomRaw.materialId);
      if (!rawMaterial) continue;

      const code = rawMaterial.code.toUpperCase();
      const standardQty = bomRaw.quantityPerBatch;
      const actualQty = issueMap.has(code) ? (issueMap.get(code) as number) : standardQty;

      const varianceQty = Math.round((actualQty - standardQty) * 1000) / 1000;
      const variancePercent = Math.round(((actualQty - standardQty) / standardQty) * 10000) / 100;
      const varianceFlagged = Math.abs(variancePercent) > tolerance;

      const unitCost = rawMaterial.currentWeightedRate || rawMaterial.standardRate;
      const lineCost = Math.round(actualQty * unitCost * 100) / 100;
      totalMaterialCost += lineCost;

      issuedMaterialsList.push({
        materialId: rawMaterial._id,
        materialCode: rawMaterial.code,
        materialName: rawMaterial.name,
        standardQty,
        actualQtyIssued: actualQty,
        unit: rawMaterial.unit,
        unitCost,
        totalCost: lineCost,
        varianceQty,
        variancePercent,
        varianceFlagged
      });

      // Stock Ledger Movement: Outward Issue of Raw Material
      await StockLedgerService.recordMovement({
        itemType: 'RAW_MATERIAL',
        itemId: rawMaterial._id,
        itemCode: rawMaterial.code,
        itemName: rawMaterial.name,
        movementType: 'PRODUCTION_ISSUE',
        quantity: -actualQty,
        unit: rawMaterial.unit,
        unitCost,
        sourceDocType: 'PRODUCTION_RUN',
        sourceDocId: runNumber,
        notes: `Production Run ${runNumber} issue for ${product.name}`,
        createdBy: params.supervisorName || 'SUPERVISOR'
      });
    }

    // Process Packaging Materials (Pouches & Cartons)
    const pouchMaterial = await RawMaterial.findOne({ 
      $or: [{ code: 'POUCH-200G' }, { name: { $regex: /pouch/i } }] 
    });

    if (pouchMaterial) {
      // Total pouches consumed = actual good packets + damaged pouches
      const totalPouchesUsed = actualOutputPackets + damagedPouches;
      const standardPouches = batchExpectedOutput;
      const pouchUnitCost = pouchMaterial.currentWeightedRate || pouchMaterial.standardRate;
      const pouchTotalCost = Math.round(totalPouchesUsed * pouchUnitCost * 100) / 100;
      totalMaterialCost += pouchTotalCost;

      issuedMaterialsList.push({
        materialId: pouchMaterial._id,
        materialCode: pouchMaterial.code,
        materialName: pouchMaterial.name,
        standardQty: standardPouches,
        actualQtyIssued: totalPouchesUsed,
        unit: pouchMaterial.unit,
        unitCost: pouchUnitCost,
        totalCost: pouchTotalCost,
        varianceQty: totalPouchesUsed - standardPouches,
        variancePercent: Math.round(((totalPouchesUsed - standardPouches) / standardPouches) * 10000) / 100,
        varianceFlagged: Math.abs(((totalPouchesUsed - standardPouches) / standardPouches) * 100) > tolerance
      });

      await StockLedgerService.recordMovement({
        itemType: 'PACKAGING',
        itemId: pouchMaterial._id,
        itemCode: pouchMaterial.code,
        itemName: pouchMaterial.name,
        movementType: 'PRODUCTION_ISSUE',
        quantity: -totalPouchesUsed,
        unit: pouchMaterial.unit,
        unitCost: pouchUnitCost,
        sourceDocType: 'PRODUCTION_RUN',
        sourceDocId: runNumber,
        notes: `Pouch consumption (${actualOutputPackets} good + ${damagedPouches} damaged) for ${runNumber}`,
        createdBy: params.supervisorName || 'SUPERVISOR'
      });
    }

    const cartonMaterial = await RawMaterial.findOne({ 
      $or: [{ code: 'CARTON-20PKT' }, { name: { $regex: /carton/i } }] 
    });

    if (cartonMaterial && cartonsUsed > 0) {
      const standardCartons = Math.ceil(batchExpectedOutput / 20); // 10 cartons
      const cartonUnitCost = cartonMaterial.currentWeightedRate || cartonMaterial.standardRate;
      const cartonTotalCost = Math.round(cartonsUsed * cartonUnitCost * 100) / 100;
      totalMaterialCost += cartonTotalCost;

      issuedMaterialsList.push({
        materialId: cartonMaterial._id,
        materialCode: cartonMaterial.code,
        materialName: cartonMaterial.name,
        standardQty: standardCartons,
        actualQtyIssued: cartonsUsed,
        unit: cartonMaterial.unit,
        unitCost: cartonUnitCost,
        totalCost: cartonTotalCost,
        varianceQty: cartonsUsed - standardCartons,
        variancePercent: Math.round(((cartonsUsed - standardCartons) / standardCartons) * 10000) / 100,
        varianceFlagged: Math.abs(((cartonsUsed - standardCartons) / standardCartons) * 100) > tolerance
      });

      await StockLedgerService.recordMovement({
        itemType: 'PACKAGING',
        itemId: cartonMaterial._id,
        itemCode: cartonMaterial.code,
        itemName: cartonMaterial.name,
        movementType: 'PRODUCTION_ISSUE',
        quantity: -cartonsUsed,
        unit: cartonMaterial.unit,
        unitCost: cartonUnitCost,
        sourceDocType: 'PRODUCTION_RUN',
        sourceDocId: runNumber,
        notes: `Carton consumption for ${runNumber}`,
        createdBy: params.supervisorName || 'SUPERVISOR'
      });
    }

    // Finished Goods Receipt
    await StockLedgerService.recordMovement({
      itemType: 'FINISHED_GOOD',
      itemId: product._id,
      itemCode: product.code,
      itemName: `${product.name} (${product.packSize})`,
      movementType: 'PRODUCTION_RECEIPT',
      quantity: actualOutputPackets,
      unit: product.unit,
      unitCost: product.sellingPrice,
      sourceDocType: 'PRODUCTION_RUN',
      sourceDocId: runNumber,
      notes: `Production output received from ${runNumber}`,
      createdBy: params.supervisorName || 'SUPERVISOR'
    });

    // Costing calculation
    const directLaborCost = params.directLaborCost || 0;
    const directOverheadCost = params.directOverheadCost || 0;
    const totalProductionCost = Math.round((totalMaterialCost + directLaborCost + directOverheadCost) * 100) / 100;
    const costPerPacket = actualOutputPackets > 0 
      ? Math.round((totalProductionCost / actualOutputPackets) * 100) / 100 
      : 0;

    const productionRun = new ProductionRun({
      runNumber,
      productId: product._id,
      productCode: product.code,
      productName: product.name,
      batchExpectedOutput,
      actualOutputPackets,
      damagedPouches,
      cartonsUsed,
      yieldPercent,
      yieldVariancePercent,
      yieldVarianceFlagged,
      materialsIssued: issuedMaterialsList,
      directLaborCost,
      directOverheadCost,
      totalMaterialCost,
      totalProductionCost,
      costPerPacket,
      supervisorName: params.supervisorName || 'SUPERVISOR',
      notes: params.notes,
      status: 'COMPLETED',
      createdAt: new Date()
    });

    await productionRun.save();

    await AuditLog.create({
      action: 'PRODUCTION_RUN_COMPLETED',
      entityType: 'ProductionRun',
      entityId: productionRun._id.toString(),
      performedBy: params.supervisorName || 'SUPERVISOR',
      role: 'production',
      details: {
        runNumber,
        outputPackets: actualOutputPackets,
        yieldPercent,
        yieldVariancePercent,
        totalProductionCost,
        costPerPacket
      }
    });

    return productionRun;
  }

  /**
   * Update or add overhead costs (labor, power/gas) to an existing production run
   */
  static async updateOverheads(runId: string, laborCost: number, overheadCost: number) {
    const run = await ProductionRun.findById(runId);
    if (!run) throw new Error(`Production run ${runId} not found`);

    run.directLaborCost = laborCost;
    run.directOverheadCost = overheadCost;
    run.totalProductionCost = Math.round((run.totalMaterialCost + laborCost + overheadCost) * 100) / 100;
    run.costPerPacket = run.actualOutputPackets > 0 
      ? Math.round((run.totalProductionCost / run.actualOutputPackets) * 100) / 100 
      : 0;

    await run.save();

    await AuditLog.create({
      action: 'OVERHEADS_UPDATED',
      entityType: 'ProductionRun',
      entityId: run._id.toString(),
      performedBy: 'ADMIN',
      role: 'admin',
      details: {
        laborCost,
        overheadCost,
        totalProductionCost: run.totalProductionCost,
        costPerPacket: run.costPerPacket
      }
    });

    return run;
  }
}
