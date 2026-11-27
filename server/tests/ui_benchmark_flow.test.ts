import request from 'supertest';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedBenchmarkData } from '../src/scripts/seedBenchmark';
import { RawMaterial, Product, Customer, ProductionRun } from '../src/models';

const app = createApp();

jest.setTimeout(180000);

describe('UI Benchmark Flow E2E Acceptance Test Suite', () => {
  let adminToken: string;
  let supervisorToken: string;
  let salesmanAToken: string;
  let salesmanBToken: string;
  let accountantToken: string;
  let auditorToken: string;
  let inventoryToken: string;

  let retailerAId: string;
  let distributorBId: string;
  let murukkuProductId: string;

  beforeAll(async () => {
    await connectDB();
    const seeded = await seedBenchmarkData();
    retailerAId = seeded.retailerA._id.toString();
    distributorBId = seeded.distributorB._id.toString();
    murukkuProductId = seeded.product._id.toString();

    // Authenticate users across all UI roles
    const adminRes = await request(app)
      .post('/api/auth/admin-login')
      .send({ username: 'factory_admin', password: 'Admin@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    const supRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'supervisor', password: 'ZenLyft@123' });
    expect(supRes.status).toBe(200);
    supervisorToken = supRes.body.token;

    const salesARes = await request(app)
      .post('/api/auth/salesman-mobile-login')
      .send({ username: 'salesman_a', password: 'ZenLyft@123', routeTerritory: 'Tamil Nadu Field' });
    expect(salesARes.status).toBe(200);
    salesmanAToken = salesARes.body.token;

    const salesBRes = await request(app)
      .post('/api/auth/salesman-mobile-login')
      .send({ username: 'salesman_b', password: 'ZenLyft@123', routeTerritory: 'Karnataka Field' });
    expect(salesBRes.status).toBe(200);
    salesmanBToken = salesBRes.body.token;

    const accRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'accountant', password: 'ZenLyft@123' });
    expect(accRes.status).toBe(200);
    accountantToken = accRes.body.token;

    const audRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'auditor', password: 'ZenLyft@123' });
    expect(audRes.status).toBe(200);
    auditorToken = audRes.body.token;

    const invRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'inventory_mgr', password: 'ZenLyft@123' });
    expect(invRes.status).toBe(200);
    inventoryToken = invRes.body.token;
  }, 180000);

  afterAll(async () => {
    await disconnectDB();
  });

  it('executes the full Section 5 Benchmark UI flow end-to-end and validates all 11 criteria', async () => {
    // -------------------------------------------------------------
    // UI Screen 1: Inventory / Procurement (Purchase 60 kg flour @ ₹45/kg)
    // -------------------------------------------------------------
    const purchaseRes = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${inventoryToken}`)
      .send({
        supplierName: 'Premier Milling Corp',
        items: [{ materialCode: 'FLOUR', quantity: 60, rate: 45 }],
        notes: 'UI Benchmark Step 1 - Inward 60 kg Flour'
      });

    expect(purchaseRes.status).toBe(201);
    expect(purchaseRes.body.success).toBe(true);
    expect(purchaseRes.body.purchase.totalAmount).toBe(2700);

    const flourAfterPurchase = await RawMaterial.findOne({ code: 'FLOUR' });
    expect(flourAfterPurchase?.currentStock).toBe(160);
    expect(flourAfterPurchase?.currentWeightedRate).toBeCloseTo(43.125, 3);

    // -------------------------------------------------------------
    // UI Screen 2: Production Floor (Execute Run with variances)
    // -------------------------------------------------------------
    const runRes = await request(app)
      .post('/api/production/runs')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        productId: murukkuProductId,
        batchExpectedOutput: 200,
        materialIssues: [
          { materialCode: 'FLOUR', actualQtyIssued: 40 },
          { materialCode: 'COOKING-OIL', actualQtyIssued: 10.5 },
          { materialCode: 'SPICE-MIX', actualQtyIssued: 1.2 }
        ],
        actualOutputPackets: 188,
        damagedPouches: 6,
        cartonsUsed: 9,
        supervisorName: 'Supervisor Murugan'
      });

    expect(runRes.status).toBe(201);
    expect(runRes.body.success).toBe(true);
    const run = runRes.body.run;
    expect(run.actualOutputPackets).toBe(188);
    expect(run.yieldVariancePercent).toBe(-6);
    expect(run.yieldVarianceFlagged).toBe(true);

    const oilIssue = run.materialsIssued.find((m: any) => m.materialCode === 'COOKING-OIL');
    expect(oilIssue.variancePercent).toBe(5);
    expect(oilIssue.varianceFlagged).toBe(true);

    const murukkuBeforeDispatch = await Product.findById(murukkuProductId);
    expect(murukkuBeforeDispatch?.currentStock).toBe(238); // 50 opening + 188 produced

    // -------------------------------------------------------------
    // UI Screen 3: Salesman PWA (Salesman A books 150 pkts for Retailer A)
    // -------------------------------------------------------------
    const orderARes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesmanAToken}`)
      .send({
        customerId: retailerAId,
        salesmanName: 'Salesman A (Tamil Nadu)',
        items: [{ productCode: 'MUR-200G', quantity: 150, unitPrice: 50 }],
        notes: 'Order from Retailer A'
      });

    expect(orderARes.status).toBe(201);
    expect(orderARes.body.success).toBe(true);
    const orderA = orderARes.body.order;
    expect(orderA.stockCheck.isSufficient).toBe(true);
    expect(orderA.totalAmount).toBe(7500);

    // -------------------------------------------------------------
    // UI Screen 4: Admin Billing Desk (Approve Order & Generate GST Invoice)
    // -------------------------------------------------------------
    const approveRes = await request(app)
      .put(`/api/orders/${orderA._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ adminName: 'Factory Admin' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    const invoiceA = approveRes.body.invoice;
    expect(invoiceA.taxableValue).toBe(7500);
    expect(invoiceA.cgstTotal).toBe(187.5);
    expect(invoiceA.sgstTotal).toBe(187.5);
    expect(invoiceA.igstTotal).toBe(0);
    expect(invoiceA.grandTotal).toBe(7875);

    // -------------------------------------------------------------
    // UI Screen 5: Warehouse / Inventory (Dispatch Invoice A)
    // -------------------------------------------------------------
    const dispatchRes = await request(app)
      .post(`/api/invoices/${invoiceA._id}/dispatch`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Dispatched 150 packets' });

    expect(dispatchRes.status).toBe(200);
    expect(dispatchRes.body.success).toBe(true);

    const murukkuAfterDispatch = await Product.findById(murukkuProductId);
    expect(murukkuAfterDispatch?.currentStock).toBe(88); // 238 - 150

    // -------------------------------------------------------------
    // UI Screen 6: Salesman PWA (Salesman B books 120 pkts for Distributor B)
    // -------------------------------------------------------------
    const orderBRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesmanBToken}`)
      .send({
        customerId: distributorBId,
        salesmanName: 'Salesman B (Karnataka)',
        items: [{ productCode: 'MUR-200G', quantity: 120, unitPrice: 50 }],
        notes: 'Order for Distributor B (Inter-State)'
      });

    expect(orderBRes.status).toBe(201);
    expect(orderBRes.body.success).toBe(true);
    const orderB = orderBRes.body.order;
    expect(orderB.stockCheck.isSufficient).toBe(false);
    expect(orderB.stockCheck.shortageQuantity).toBe(32); // 120 requested - 88 available
    expect(orderB.items[0].quantity).toBe(120); // Preserved without silent mutation

    // -------------------------------------------------------------
    // UI Screen 7: Accountant Billing Desk (Record ₹4,000 Payment for Retailer A)
    // -------------------------------------------------------------
    const paymentRes = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        invoiceId: invoiceA._id,
        amount: 4000,
        paymentMethod: 'BANK_TRANSFER',
        reference: 'NEFT/TN/2024/098765',
        notes: 'Partial payment from Retailer A'
      });

    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.success).toBe(true);
    expect(paymentRes.body.invoice.balanceDue).toBe(3875);
    expect(paymentRes.body.customer.outstandingBalance).toBe(3875);

    // -------------------------------------------------------------
    // UI Screen 8: Production Floor (Overhead Editing: Labour ₹1,200 + Power ₹600)
    // -------------------------------------------------------------
    const overheadRes = await request(app)
      .put(`/api/production/runs/${run._id}/costs`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        directLaborCost: 1200,
        directOverheadCost: 600
      });

    expect(overheadRes.status).toBe(200);
    expect(overheadRes.body.success).toBe(true);
    const updatedRun = overheadRes.body.run;
    expect(updatedRun.totalMaterialCost).toBe(4055);
    expect(updatedRun.directLaborCost).toBe(1200);
    expect(updatedRun.directOverheadCost).toBe(600);
    expect(updatedRun.totalProductionCost).toBe(5855);
    expect(updatedRun.costPerPacket).toBeCloseTo(31.14, 2);

    // -------------------------------------------------------------
    // Final Audit Checklist: All 11 Criteria Match Section 5 Exactly
    // -------------------------------------------------------------
    const finalFlour = await RawMaterial.findOne({ code: 'FLOUR' });
    const finalOil = await RawMaterial.findOne({ code: 'COOKING-OIL' });
    const finalPouches = await RawMaterial.findOne({ code: 'POUCH-200G' });
    const finalCartons = await RawMaterial.findOne({ code: 'CARTON-20PKT' });
    const finalMurukku = await Product.findOne({ code: 'MUR-200G' });
    const finalCustomerA = await Customer.findById(retailerAId);

    // 1. Flour: 100 + 60 - 40 = 120 kg
    expect(finalFlour?.currentStock).toBe(120);

    // 2. Oil: 30 - 10.5 = 19.5 L
    expect(finalOil?.currentStock).toBe(19.5);

    // 3. Pouches: 500 - 188 - 6 = 306 pcs
    expect(finalPouches?.currentStock).toBe(306);

    // 4. Cartons: 30 - 9 = 21 cartons
    expect(finalCartons?.currentStock).toBe(21);

    // 5. Finished goods: 88 packets
    expect(finalMurukku?.currentStock).toBe(88);

    // 6. Yield variance: -6% flagged
    expect(updatedRun.yieldVariancePercent).toBe(-6);
    expect(updatedRun.yieldVarianceFlagged).toBe(true);

    // 7. Oil variance: +5% flagged
    const finalOilIssue = updatedRun.materialsIssued.find((m: any) => m.materialCode === 'COOKING-OIL');
    expect(finalOilIssue.variancePercent).toBe(5);
    expect(finalOilIssue.varianceFlagged).toBe(true);

    // 8. Invoice A: ₹7,500 + ₹187.50 + ₹187.50 = ₹7,875
    expect(invoiceA.grandTotal).toBe(7875);

    // 9. Outstanding balance: ₹3,875
    expect(finalCustomerA?.outstandingBalance).toBe(3875);

    // 10. Distributor B shortage: 32 pkts flagged
    expect(orderB.stockCheck.shortageQuantity).toBe(32);

    // 11. Cost per packet: ₹31.14
    expect(updatedRun.costPerPacket).toBeCloseTo(31.14, 2);
  });
});
