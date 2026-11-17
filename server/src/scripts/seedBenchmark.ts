import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { 
  User, 
  Customer, 
  Product, 
  RawMaterial, 
  BOM, 
  StockMovement, 
  Purchase, 
  ProductionRun, 
  SalesOrder, 
  Invoice, 
  Payment, 
  AuditLog 
} from '../models';
import { StockLedgerService } from '../services/stockLedger.service';

export async function seedBenchmarkData() {
  console.log('[Seed] Clearing all existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    Product.deleteMany({}),
    RawMaterial.deleteMany({}),
    BOM.deleteMany({}),
    StockMovement.deleteMany({}),
    Purchase.deleteMany({}),
    ProductionRun.deleteMany({}),
    SalesOrder.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  console.log('[Seed] Inserting Users...');
  const users = await User.insertMany([
    { username: 'salesman_a', name: 'Salesman A (Tamil Nadu)', role: 'salesman' },
    { username: 'salesman_b', name: 'Salesman B (Karnataka)', role: 'salesman' },
    { username: 'factory_admin', name: 'Factory Admin Desk', role: 'admin' },
    { username: 'supervisor', name: 'Production Supervisor', role: 'production' },
    { username: 'accountant', name: 'Auditor & Accountant', role: 'accountant' },
    { username: 'owner', name: 'Factory Business Owner', role: 'owner' }
  ]);

  console.log('[Seed] Inserting Customers...');
  const [retailerA, distributorB] = await Customer.insertMany([
    {
      code: 'RET-A',
      name: 'Retailer A',
      type: 'RETAILER',
      state: 'Tamil Nadu',
      stateCode: '33',
      gstin: '33AABCR1234F1Z1',
      address: '14 Bazaar Road, Madurai',
      city: 'Madurai',
      phone: '+91 98765 43210',
      creditLimit: 25000,
      outstandingBalance: 0
    },
    {
      code: 'DIST-B',
      name: 'Distributor B',
      type: 'DISTRIBUTOR',
      state: 'Karnataka',
      stateCode: '29',
      gstin: '29AABCD5678G1Z2',
      address: '88 Industrial Layout, Bengaluru',
      city: 'Bengaluru',
      phone: '+91 98765 12345',
      creditLimit: 100000,
      outstandingBalance: 0
    }
  ]);

  console.log('[Seed] Inserting Raw & Packaging Materials (Opening Stock)...');
  const materials = await RawMaterial.insertMany([
    {
      code: 'FLOUR',
      name: 'Flour',
      category: 'RAW_MATERIAL',
      unit: 'kg',
      openingStock: 100,
      currentStock: 100,
      standardRate: 42,
      currentWeightedRate: 42,
      reorderLevel: 50
    },
    {
      code: 'COOKING-OIL',
      name: 'Cooking oil',
      category: 'RAW_MATERIAL',
      unit: 'litre',
      openingStock: 30,
      currentStock: 30,
      standardRate: 140,
      currentWeightedRate: 140,
      reorderLevel: 15
    },
    {
      code: 'SPICE-MIX',
      name: 'Salt and spice mix',
      category: 'RAW_MATERIAL',
      unit: 'kg',
      openingStock: 5,
      currentStock: 5,
      standardRate: 200,
      currentWeightedRate: 200,
      reorderLevel: 2
    },
    {
      code: 'POUCH-200G',
      name: '200 g pouch',
      category: 'PACKAGING',
      unit: 'piece',
      openingStock: 500,
      currentStock: 500,
      standardRate: 2.50,
      currentWeightedRate: 2.50,
      reorderLevel: 200
    },
    {
      code: 'CARTON-20PKT',
      name: 'Carton (holds 20 packets)',
      category: 'PACKAGING',
      unit: 'piece',
      openingStock: 30,
      currentStock: 30,
      standardRate: 15,
      currentWeightedRate: 15,
      reorderLevel: 10
    }
  ]);

  console.log('[Seed] Recording Opening Stock Movements in Ledger...');
  for (const mat of materials) {
    await StockLedgerService.recordMovement({
      itemType: mat.category,
      itemId: mat._id,
      itemCode: mat.code,
      itemName: mat.name,
      movementType: 'OPENING_BALANCE',
      quantity: mat.openingStock,
      unit: mat.unit,
      unitCost: mat.standardRate,
      sourceDocType: 'OPENING',
      sourceDocId: 'INIT-OPENING',
      notes: 'Initial opening balance as per NIT Trichy Benchmark',
      createdBy: 'SYSTEM_SEED'
    });
  }

  console.log('[Seed] Inserting Finished Product (Murukku 200g)...');
  const product = await Product.create({
    code: 'MUR-200G',
    name: 'Murukku 200 g',
    packSize: '200g',
    unit: 'packet',
    sellingPrice: 50,
    gstRate: 5,
    hsnCode: '19059040',
    openingStock: 50,
    currentStock: 50
  });

  await StockLedgerService.recordMovement({
    itemType: 'FINISHED_GOOD',
    itemId: product._id,
    itemCode: product.code,
    itemName: 'Murukku 200 g',
    movementType: 'OPENING_BALANCE',
    quantity: 50,
    unit: 'packet',
    unitCost: 50,
    sourceDocType: 'OPENING',
    sourceDocId: 'INIT-OPENING',
    notes: 'Initial opening stock (50 packets) as per Section 5 Benchmark',
    createdBy: 'SYSTEM_SEED'
  });

  console.log('[Seed] Creating Bill of Materials (BOM) for Murukku 200 g...');
  const flourMat = materials.find(m => m.code === 'FLOUR')!;
  const oilMat = materials.find(m => m.code === 'COOKING-OIL')!;
  const spiceMat = materials.find(m => m.code === 'SPICE-MIX')!;
  const pouchMat = materials.find(m => m.code === 'POUCH-200G')!;
  const cartonMat = materials.find(m => m.code === 'CARTON-20PKT')!;

  const bom = await BOM.create({
    productId: product._id,
    productCode: product.code,
    productName: product.name,
    batchExpectedOutput: 200,
    outputUnit: 'packets',
    tolerancePercent: 3,
    rawMaterials: [
      {
        materialId: flourMat._id,
        materialCode: flourMat.code,
        materialName: flourMat.name,
        quantityPerBatch: 40,
        unit: 'kg',
        standardRate: 42
      },
      {
        materialId: oilMat._id,
        materialCode: oilMat.code,
        materialName: oilMat.name,
        quantityPerBatch: 10,
        unit: 'litre',
        standardRate: 140
      },
      {
        materialId: spiceMat._id,
        materialCode: spiceMat.code,
        materialName: spiceMat.name,
        quantityPerBatch: 1.2,
        unit: 'kg',
        standardRate: 200
      }
    ],
    packagingMaterials: [
      {
        materialId: pouchMat._id,
        materialCode: pouchMat.code,
        materialName: pouchMat.name,
        quantityPerBatch: 200,
        unit: 'piece',
        standardRate: 2.50
      },
      {
        materialId: cartonMat._id,
        materialCode: cartonMat.code,
        materialName: cartonMat.name,
        quantityPerBatch: 10,
        unit: 'piece',
        standardRate: 15
      }
    ]
  });

  console.log('[Seed] Benchmark Master Data seeded successfully.');
  return { users, retailerA, distributorB, materials, product, bom };
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedBenchmarkData();
      console.log('Done!');
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })();
}

