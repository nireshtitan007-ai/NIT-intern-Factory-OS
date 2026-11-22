import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedBenchmarkData } from '../src/scripts/seedBenchmark';
import { ProductionService } from '../src/services/production.service';
import { StockLedgerService } from '../src/services/stockLedger.service';
import { SalesOrderService } from '../src/services/salesOrder.service';
import { PurchaseService } from '../src/services/purchase.service';
import { Product, RawMaterial, StockMovement, BOM, User } from '../src/models';
import { generateToken } from '../src/middleware/auth.middleware';

describe('Step 2: BOM-Driven Production, Multi-SKU, Atomic Ledger & FEFO Acceptance Suite', () => {
  let app: any;
  let adminToken: string;
  let supervisorToken: string;
  let auditorToken: string;
  let seededData: any;

  beforeAll(async () => {
    await connectDB();
    app = createApp();
  });

  beforeEach(async () => {
    seededData = await seedBenchmarkData();
    const adminUser = await User.findOne({ username: 'factory_admin' });
    const supervisorUser = await User.findOne({ username: 'supervisor' });
    const auditorUser = await User.findOne({ username: 'auditor' });

    adminToken = generateToken(adminUser!);
    supervisorToken = generateToken(supervisorUser!);
    auditorToken = generateToken(auditorUser!);
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Scaled Batches & Dynamic BOM Execution', () => {
    it('executes fractional 0.5 batch scaling expected outputs and material requirements', async () => {
      // 0.5 batch of Murukku 200g: standard expected = 100 packets, standard flour = 20 kg
      const flourBefore = await RawMaterial.findOne({ code: 'FLOUR' });
      const initialFlour = flourBefore!.currentStock;

      const run = await ProductionService.executeRun({
        productId: seededData.product._id.toString(),
        batches: 0.5,
        actualOutputPackets: 95,
        damagedPouches: 2,
        cartonsUsed: 5,
        supervisorName: 'Supervisor Test'
      });

      expect(run.batchExpectedOutput).toBe(100);
      expect(run.actualOutputPackets).toBe(95);
      expect(run.yieldPercent).toBe(95);
      expect(run.yieldVariancePercent).toBe(-5);
      expect(run.yieldVarianceFlagged).toBe(true);

      const flourIssue = run.materialsIssued.find(m => m.materialCode === 'FLOUR');
      expect(flourIssue?.standardQty).toBe(20);
      expect(flourIssue?.actualQtyIssued).toBe(20);

      const flourAfter = await RawMaterial.findOne({ code: 'FLOUR' });
      expect(flourAfter!.currentStock).toBe(initialFlour - 20);
    });

    it('executes 2x scaled batch scaling expected outputs and packaging', async () => {
      // 2 batches of Murukku 200g: standard expected = 400 packets, flour = 80 kg
      const run = await ProductionService.executeRun({
        productId: seededData.product._id.toString(),
        batches: 2,
        actualOutputPackets: 380,
        damagedPouches: 10,
        cartonsUsed: 19,
        supervisorName: 'Supervisor Test'
      });

      expect(run.batchExpectedOutput).toBe(400);
      expect(run.actualOutputPackets).toBe(380);
      expect(run.yieldPercent).toBe(95);

      const cartonIssue = run.materialsIssued.find(m => m.materialCode.includes('CARTON'));
      expect(cartonIssue?.standardQty).toBe(20); // 400 pkts / 20 pkts per carton
      expect(cartonIssue?.actualQtyIssued).toBe(19);
    });
  });

  describe('2. Multi-Unit Issues in Production Run', () => {
    it('allows issuing raw materials in grams (40,000 g) and converts accurately to base kg', async () => {
      const flourBefore = await RawMaterial.findOne({ code: 'FLOUR' });
      const initialFlour = flourBefore!.currentStock;

      const run = await ProductionService.executeRun({
        productId: seededData.product._id.toString(),
        batches: 1,
        materialIssues: [
          { materialCode: 'FLOUR', actualQtyIssued: 40000, unit: 'g' }
        ],
        actualOutputPackets: 190,
        damagedPouches: 5,
        cartonsUsed: 10
      });

      const flourIssue = run.materialsIssued.find(m => m.materialCode === 'FLOUR');
      expect(flourIssue?.actualQtyIssued).toBe(40); // Converted 40000 g -> 40 kg
      expect(flourIssue?.unit).toBe('kg');

      const flourAfter = await RawMaterial.findOne({ code: 'FLOUR' });
      expect(flourAfter!.currentStock).toBe(initialFlour - 40);
    });
  });

  describe('3. Multi-SKU Live Interview Test (Murukku 500 g with ZERO code change)', () => {
    it('executes Murukku 500 g run flawlessly without touching production code', async () => {
      const prod500 = await Product.findOne({ code: 'MUR-500G' });
      expect(prod500).toBeDefined();

      const run500 = await ProductionService.executeRun({
        productId: prod500!._id.toString(),
        batches: 1,
        actualOutputPackets: 96,
        damagedPouches: 4,
        cartonsUsed: 10,
        supervisorName: 'Murugan Supervisor'
      });

      expect(run500.productCode).toBe('MUR-500G');
      expect(run500.batchExpectedOutput).toBe(100);
      expect(run500.actualOutputPackets).toBe(96);
      expect(run500.yieldPercent).toBe(96);
      expect(run500.costPerPacket).toBeGreaterThan(0);

      // Verify finished goods stock increased for 500g product
      const updatedProd500 = await Product.findOne({ code: 'MUR-500G' });
      expect(updatedProd500!.currentStock).toBe(20 + 96); // 20 opening + 96 produced = 116
    });
  });

  describe('4. Transactional Rollback on Insufficient Stock', () => {
    it('rejects run with 400 when stock is insufficient and persists ZERO movements', async () => {
      const flourBefore = await RawMaterial.findOne({ code: 'FLOUR' });
      const movementsBefore = await StockMovement.countDocuments({});

      // Request 500 kg flour when only 100 kg is in stock
      await expect(
        ProductionService.executeRun({
          productId: seededData.product._id.toString(),
          batches: 1,
          materialIssues: [
            { materialCode: 'FLOUR', actualQtyIssued: 500, unit: 'kg' }
          ],
          actualOutputPackets: 188
        })
      ).rejects.toThrow(/INSUFFICIENT_STOCK/);

      // Verify stock was NOT deducted and no movements persisted
      const flourAfter = await RawMaterial.findOne({ code: 'FLOUR' });
      expect(flourAfter!.currentStock).toBe(flourBefore!.currentStock);

      const movementsAfter = await StockMovement.countDocuments({});
      expect(movementsAfter).toBe(movementsBefore);
    });
  });

  describe('5. Inventory Reconciliation Endpoint (Section 4.4 & 4.6)', () => {
    it('GET /api/inventory/reconcile verifies exact match between cached stock and ledger sum', async () => {
      const res = await request(app)
        .get('/api/inventory/reconcile')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.report.isFullyReconciled).toBe(true);
      expect(res.body.report.totalItemsChecked).toBeGreaterThan(0);
    });
  });

  describe('6. FEFO Batch Dispatch Allocation', () => {
    it('allocates finished goods dispatch to earliest expiry batch and notes allocations', async () => {
      // 1. Production Run 1 (Murukku 200g, 100 packets, expires in 30 days)
      const run1 = await ProductionService.executeRun({
        productId: seededData.product._id.toString(),
        batches: 0.5,
        actualOutputPackets: 100,
        supervisorName: 'Supervisor Batch 1'
      });

      // 2. Create order for 40 packets
      const order = await SalesOrderService.createOrder({
        customerId: seededData.retailerA._id.toString(),
        salesmanName: 'Salesman A',
        items: [{ productCode: 'MUR-200G', quantity: 40, unitPrice: 50 }]
      });

      // 3. Approve and dispatch
      const { invoice } = await SalesOrderService.approveOrder(order._id.toString(), 'Admin Approver');
      await SalesOrderService.dispatchOrder(invoice._id.toString(), 'Admin Dispatcher');

      const dispatchMovement = await StockMovement.findOne({
        sourceDocId: invoice.invoiceNumber,
        movementType: 'SALES_DISPATCH'
      });

      expect(dispatchMovement).toBeDefined();
      expect(dispatchMovement?.notes).toContain('FEFO Batches:');
    });
  });

  describe('7. Concurrency Safety: 20 Concurrent Dispatches', () => {
    it('executes 20 concurrent outward movements and guarantees cached stock == ledger balance', async () => {
      const product = await Product.findOne({ code: 'MUR-200G' });
      const initialStock = product!.currentStock; // e.g. 50 packets

      // Run 20 concurrent dispatches of 1 packet each
      const dispatchPromises = Array.from({ length: 20 }, (_, idx) => 
        StockLedgerService.recordMovement({
          tenantId: product!.tenantId,
          itemType: 'FINISHED_GOOD',
          itemId: product!._id,
          itemCode: product!.code,
          itemName: product!.name,
          movementType: 'SALES_DISPATCH',
          quantity: -1,
          unit: product!.unit,
          unitCost: 50,
          sourceDocType: 'INVOICE',
          sourceDocId: `INV-CONCURRENCY-${idx}`,
          notes: `Concurrent stress test dispatch #${idx + 1}`
        })
      );

      await Promise.all(dispatchPromises);

      const updatedProduct = await Product.findById(product!._id);
      const ledgerTotal = await StockLedgerService.calculateBalanceFromLedger(product!._id, product!.tenantId);

      expect(updatedProduct!.currentStock).toBe(initialStock - 20);
      expect(ledgerTotal).toBe(initialStock - 20);
      expect(updatedProduct!.currentStock).toBe(ledgerTotal);
    });
  });

  describe('8. Zero Overhead Defaults & Post-Run Cost Allocation', () => {
    it('a run with no costs has costPerPacket = materials only (₹4,055 / 188 ≈ ₹21.57), and after updateOverheads(1200, 600) it is ₹31.14', async () => {
      // Record purchase of 60 kg flour @ ₹45/kg (Benchmark Step 1) to establish WAC rate 43.125
      await PurchaseService.recordPurchase({
        supplierName: 'Sri Lakshmi Agro Mills',
        items: [{ materialCode: 'FLOUR', quantity: 60, rate: 45 }],
        notes: 'Benchmark Step 1 purchase for WAC calculation'
      });

      const prod = await Product.findOne({ code: 'MUR-200G' });
      const initialRun = await ProductionService.executeRun({
        productId: prod!._id.toString(),
        batchExpectedOutput: 200,
        materialIssues: [
          { materialCode: 'FLOUR', actualQtyIssued: 40 },
          { materialCode: 'COOKING-OIL', actualQtyIssued: 10.5 },
          { materialCode: 'SPICE-MIX', actualQtyIssued: 1.2 }
        ],
        actualOutputPackets: 188,
        damagedPouches: 6,
        cartonsUsed: 9,
        supervisorName: 'Test Supervisor'
      });

      // Default labor and overhead costs are strictly zero (no hidden defaults)
      expect(initialRun.directLaborCost).toBe(0);
      expect(initialRun.directOverheadCost).toBe(0);
      expect(initialRun.directLaborCostPaise).toBe(0);
      expect(initialRun.directOverheadCostPaise).toBe(0);

      // Total material cost = ₹4,055 (1725 flour [WAC 43.125] + 1365 oil + 300 spice + 291 pouches + 369 cartons)
      expect(initialRun.totalMaterialCostPaise).toBe(405500);
      expect(initialRun.totalMaterialCost).toBe(4055);
      expect(initialRun.totalProductionCostPaise).toBe(405500);
      expect(initialRun.totalProductionCost).toBe(4055);
      // Cost per packet = Math.round(405500 / 188) / 100 = 2157 paise = ₹21.57
      expect(initialRun.costPerPacket).toBe(21.57);

      // Verify flour issue line cost and ledger movement match exactly at 172500 paise
      const flourIssue = initialRun.materialsIssued.find(m => m.materialCode === 'FLOUR');
      expect(flourIssue).toBeDefined();
      expect(flourIssue?.totalCostPaise).toBe(172500);
      expect(flourIssue?.totalCost).toBe(1725);

      const flourLedgerMovement = await StockMovement.findOne({
        sourceDocId: initialRun.runNumber,
        itemCode: 'FLOUR',
        movementType: 'PRODUCTION_ISSUE'
      });
      expect(flourLedgerMovement).toBeDefined();
      expect(flourLedgerMovement?.totalCostPaise).toBe(172500);
      expect(flourLedgerMovement?.totalCostPaise).toBe(flourIssue?.totalCostPaise);

      // Update overheads post-run: ₹1,200 labour, ₹600 power/gas
      const updatedRun = await ProductionService.updateOverheads(initialRun._id.toString(), 1200, 600);
      expect(updatedRun.directLaborCost).toBe(1200);
      expect(updatedRun.directOverheadCost).toBe(600);
      expect(updatedRun.totalProductionCost).toBe(5855); // 4055 + 1800
      // Cost per packet = Math.round(585500 / 188) / 100 = 3114 paise = ₹31.14
      expect(updatedRun.costPerPacket).toBe(31.14);
    });
  });
});
