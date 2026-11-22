import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDB, disconnectDB } from '../config/db';
import { seedBenchmarkData } from './seedBenchmark';
import { PurchaseService } from '../services/purchase.service';
import { ProductionService } from '../services/production.service';
import { SalesOrderService } from '../services/salesOrder.service';
import { StockLedgerService } from '../services/stockLedger.service';
import { ReportService } from '../services/report.service';
import { RawMaterial, Product, Customer } from '../models';

export async function executeBenchmarkScenario() {
  console.log('======================================================================');
  console.log('   NIT TIRUCHIRAPPALLI - ORDER-TO-AUDIT BENCHMARK SCENARIO EXECUTION  ');
  console.log('   ZenLyft Manufacturing OS Verification Engine                       ');
  console.log('======================================================================\n');

  // Step 0: Seed initial master data
  console.log('--- Step 0: Loading Benchmark Master Data ---');
  const { retailerA, distributorB, product } = await seedBenchmarkData();
  console.log('✓ Master data seeded successfully.\n');

  // Step 1: Record purchase of 60 kg flour at ₹45/kg
  console.log('--- Step 1: Record Purchase of 60 kg Flour at ₹45/kg ---');
  const purchase = await PurchaseService.recordPurchase({
    supplierName: 'Premier Milling Corp',
    items: [{ materialCode: 'FLOUR', quantity: 60, rate: 45 }],
    notes: 'Purchase of 60 kg flour as per Section 5 Step 1',
    createdBy: 'Factory Admin'
  });
  console.log(`✓ Purchase recorded: ${purchase.purchaseNumber}, Total: ₹${purchase.totalAmount}`);
  const flourAfterPurchase = await RawMaterial.findOne({ code: 'FLOUR' });
  console.log(`  Flour stock after purchase: ${flourAfterPurchase?.currentStock} kg (Expected: 160 kg, WAC Rate: ₹${flourAfterPurchase?.currentWeightedRate}/kg)\n`);

  // Step 2 & 3: Production Run (Murukku 200g, 40kg flour, 10.5L oil, 1.2kg spice mix, 188 output, 6 damaged pouches, 9 cartons)
  console.log('--- Steps 2 & 3: Log Production Run of Murukku 200 g ---');
  console.log('  Issue: 40 kg Flour, 10.5 L Cooking Oil (+0.5 L over standard), 1.2 kg Spice Mix');
  console.log('  Output: 188 good packets, 6 damaged pouches, 9 cartons used');
  const run = await ProductionService.executeRun({
    productId: product._id.toString(),
    batchExpectedOutput: 200,
    materialIssues: [
      { materialCode: 'FLOUR', actualQtyIssued: 40 },
      { materialCode: 'COOKING-OIL', actualQtyIssued: 10.5 },
      { materialCode: 'SPICE-MIX', actualQtyIssued: 1.2 }
    ],
    actualOutputPackets: 188,
    damagedPouches: 6,
    cartonsUsed: 9,
    supervisorName: 'Murugan (Floor Supervisor)'
  });
  console.log(`✓ Production Run ${run.runNumber} recorded.`);
  console.log(`  Actual Output: ${run.actualOutputPackets} packets (Expected: 200 packets)`);
  console.log(`  Yield: ${run.yieldPercent}% | Yield Variance: ${run.yieldVariancePercent}% (Flagged: ${run.yieldVarianceFlagged})`);
  console.log(`  Initial Direct Materials Cost: ₹${run.totalMaterialCost.toFixed(2)} | Cost/Packet (Materials only): ₹${run.costPerPacket.toFixed(2)}`);
  
  const oilIssue = run.materialsIssued.find(m => m.materialCode === 'COOKING-OIL');
  console.log(`  Oil Consumption: ${oilIssue?.actualQtyIssued} L vs 10 L standard (+${oilIssue?.variancePercent}%, Flagged: ${oilIssue?.varianceFlagged})\n`);

  // Step 4: Salesman A places order for Retailer A (Tamil Nadu): 150 packets
  console.log('--- Step 4: Salesman A Places Order for Retailer A (150 Packets) ---');
  const orderA = await SalesOrderService.createOrder({
    customerId: retailerA._id.toString(),
    salesmanName: 'Salesman A (Tamil Nadu)',
    items: [{ productCode: 'MUR-200G', quantity: 150, unitPrice: 50 }],
    notes: 'Order from Retailer A'
  });
  console.log(`✓ Order ${orderA.orderNumber} placed for Retailer A: 150 packets. Total: ₹${orderA.totalAmount}`);
  console.log(`  Stock check: Available: ${orderA.stockCheck.availableStock}, Sufficient: ${orderA.stockCheck.isSufficient}\n`);

  // Step 5: Admin approves it, raises GST invoice (CGST + SGST), records dispatch
  console.log('--- Step 5: Admin Approves Order, Raises GST Invoice & Records Dispatch ---');
  const { invoice: invoiceA } = await SalesOrderService.approveOrder(orderA._id.toString(), 'Factory Admin');
  console.log(`✓ Invoice Raised: ${invoiceA.invoiceNumber}`);
  console.log(`  Taxable Value: ₹${invoiceA.taxableValue.toFixed(2)}`);
  console.log(`  CGST (2.5%):   ₹${invoiceA.cgstTotal.toFixed(2)}`);
  console.log(`  SGST (2.5%):   ₹${invoiceA.sgstTotal.toFixed(2)}`);
  console.log(`  Grand Total:   ₹${invoiceA.grandTotal.toFixed(2)} (Expected: ₹7,875.00)`);

  await SalesOrderService.dispatchOrder(invoiceA._id.toString(), 'Factory Admin');
  console.log(`✓ Goods dispatched for Invoice ${invoiceA.invoiceNumber}.\n`);

  // Step 6: Salesman B places order for Distributor B (Karnataka): 120 packets
  console.log('--- Step 6: Salesman B Places Order for Distributor B (120 Packets - Shortage Test) ---');
  const orderB = await SalesOrderService.createOrder({
    customerId: distributorB._id.toString(),
    salesmanName: 'Salesman B (Karnataka)',
    items: [{ productCode: 'MUR-200G', quantity: 120, unitPrice: 50 }],
    notes: 'Order for Distributor B (Karnataka - Inter-state)'
  });
  console.log(`✓ Order ${orderB.orderNumber} created for Distributor B: 120 packets.`);
  console.log(`  Stock Check Result: Available Stock: ${orderB.stockCheck.availableStock} packets`);
  console.log(`  Is Sufficient: ${orderB.stockCheck.isSufficient}`);
  console.log(`  Shortage Flagged: ${orderB.stockCheck.shortageQuantity} packets (Expected: 32 packets shortage)`);
  console.log(`  Requested quantity of 120 packets preserved without silent mutation.\n`);

  // Step 7: Record payment of ₹4,000 from Retailer A
  console.log('--- Step 7: Record Payment of ₹4,000 from Retailer A ---');
  const { payment, invoice: updatedInvoiceA, customer: updatedRetailerA } = await SalesOrderService.recordPayment({
    invoiceId: invoiceA._id.toString(),
    amount: 4000,
    paymentMethod: 'BANK_TRANSFER',
    reference: 'NEFT/TN/2024/098765',
    notes: 'Partial payment from Retailer A'
  });
  console.log(`✓ Payment ${payment.paymentNumber} recorded: ₹${payment.amount}`);
  console.log(`  Invoice ${updatedInvoiceA.invoiceNumber} Balance Due: ₹${updatedInvoiceA.balanceDue.toFixed(2)}`);
  console.log(`  Retailer A Total Outstanding: ₹${updatedRetailerA.outstandingBalance.toFixed(2)} (Expected: ₹3,875.00)\n`);

  // Step 8: Add labour ₹1,200 and gas/power ₹600 for the run, show cost per packet
  console.log('--- Step 8: Add Labour (₹1,200) & Power/Gas (₹600) Overheads ---');
  const updatedRun = await ProductionService.updateOverheads(run._id.toString(), 1200, 600);
  console.log(`✓ Overheads allocated to Production Run ${updatedRun.runNumber}:`);
  console.log(`  Direct Materials Cost: ₹${updatedRun.totalMaterialCost.toFixed(2)}`);
  console.log(`  Direct Labour Cost:    ₹${updatedRun.directLaborCost.toFixed(2)}`);
  console.log(`  Power & Gas Overhead:  ₹${updatedRun.directOverheadCost.toFixed(2)}`);
  console.log(`  Total Production Cost: ₹${updatedRun.totalProductionCost.toFixed(2)}`);
  console.log(`  Actual Output Packets: ${updatedRun.actualOutputPackets}`);
  console.log(`  Cost Per Packet:       ₹${updatedRun.costPerPacket.toFixed(2)} / packet`);
  const marginPerPacket = 50 - updatedRun.costPerPacket;
  const marginPercent = Math.round((marginPerPacket / 50) * 10000) / 100;
  console.log(`  Selling Price:         ₹50.00 / packet`);
  console.log(`  Gross Margin:          ₹${marginPerPacket.toFixed(2)} / packet (${marginPercent}%)\n`);

  // Step 9: Final Balances & Verification Checklist
  console.log('======================================================================');
  console.log('                   BENCHMARK AUDIT CHECKLIST VERIFICATION             ');
  console.log('======================================================================');

  const flour = await RawMaterial.findOne({ code: 'FLOUR' });
  const oil = await RawMaterial.findOne({ code: 'COOKING-OIL' });
  const pouches = await RawMaterial.findOne({ code: 'POUCH-200G' });
  const cartons = await RawMaterial.findOne({ code: 'CARTON-20PKT' });
  const murukku = await Product.findOne({ code: 'MUR-200G' });

  const checks = [
    {
      metric: 'Flour closing balance',
      actual: `${flour?.currentStock} kg`,
      expected: '120 kg (100 + 60 − 40)',
      pass: flour?.currentStock === 120
    },
    {
      metric: 'Oil closing balance',
      actual: `${oil?.currentStock} L`,
      expected: '19.5 L (30 − 10.5)',
      pass: oil?.currentStock === 19.5
    },
    {
      metric: 'Pouches closing balance',
      actual: `${pouches?.currentStock} pcs`,
      expected: '306 pcs (500 − 188 − 6)',
      pass: pouches?.currentStock === 306
    },
    {
      metric: 'Finished goods after Retailer A dispatch',
      actual: `${murukku?.currentStock} packets`,
      expected: '88 packets (50 + 188 − 150)',
      pass: murukku?.currentStock === 88
    },
    {
      metric: 'Yield variance',
      actual: `${run.yieldVariancePercent}%`,
      expected: '-6%, flagged',
      pass: run.yieldVariancePercent === -6 && run.yieldVarianceFlagged === true
    },
    {
      metric: 'Oil consumption variance',
      actual: `+${oilIssue?.variancePercent}%`,
      expected: '+5%, flagged',
      pass: oilIssue?.variancePercent === 5 && oilIssue?.varianceFlagged === true
    },
    {
      metric: 'Retailer A Invoice',
      actual: `₹${invoiceA.taxableValue} + ₹${invoiceA.cgstTotal} CGST + ₹${invoiceA.sgstTotal} SGST = ₹${invoiceA.grandTotal}`,
      expected: '₹7,500 taxable + ₹187.50 CGST + ₹187.50 SGST = ₹7,875',
      pass: invoiceA.taxableValue === 7500 && invoiceA.cgstTotal === 187.5 && invoiceA.sgstTotal === 187.5 && invoiceA.grandTotal === 7875
    },
    {
      metric: 'Retailer A outstanding after ₹4,000 payment',
      actual: `₹${updatedRetailerA.outstandingBalance}`,
      expected: '₹3,875',
      pass: updatedRetailerA.outstandingBalance === 3875
    },
    {
      metric: 'Distributor B order shortage',
      actual: `${orderB.stockCheck.shortageQuantity} packets shortage flagged`,
      expected: 'Shortage of 32 packets flagged',
      pass: orderB.stockCheck.shortageQuantity === 32 && orderB.stockCheck.isSufficient === false
    }
  ];

  console.table(checks);

  const allPassed = checks.every(c => c.pass);
  console.log(`\nOVERALL BENCHMARK VERIFICATION: ${allPassed ? '✓ 100% PASSED (ALL 9 CRITERIA MATCH EXACTLY)' : '✗ FAILED'}\n`);

  return { allPassed, checks };
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await executeBenchmarkScenario();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}

