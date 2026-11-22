import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
  process.env.ALLOW_LEDGER_RESET = 'true';
  console.log('[Seed] Clearing all existing collections...');
  try {
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
  } finally {
    process.env.ALLOW_LEDGER_RESET = 'false';
  }

  console.log('[Seed] Inserting Users with secure credentials & roles...');
  const salt = await bcrypt.genSalt(10);
  const defaultPass = await bcrypt.hash('Nash@123', salt);
  const adminPass = await bcrypt.hash('Admin@123', salt);

  const users = await User.insertMany([
    { 
      username: 'factory_admin', 
      passwordHash: adminPass, 
      name: 'Factory Admin Desk', 
      role: 'admin', 
      department: 'Executive Management', 
      branch: 'Main Plant - Tiruchirappalli',
      permissions: ['*']
    },
    { 
      username: 'salesman_a', 
      passwordHash: defaultPass, 
      name: 'Salesman A (Tamil Nadu)', 
      role: 'salesman', 
      department: 'Sales', 
      branch: 'Tamil Nadu Field',
      permissions: ['orders:create', 'orders:view', 'payments:collect', 'customers:view']
    },
    { 
      username: 'salesman_b', 
      passwordHash: defaultPass, 
      name: 'Salesman B (Karnataka)', 
      role: 'salesman', 
      department: 'Sales', 
      branch: 'Karnataka Field',
      permissions: ['orders:create', 'orders:view', 'payments:collect', 'customers:view']
    },
    { 
      username: 'sales_mgr', 
      passwordHash: defaultPass, 
      name: 'Sales Manager', 
      role: 'sales_manager', 
      department: 'Sales & Distribution', 
      branch: 'Main Plant - Tiruchirappalli',
      permissions: ['orders:view', 'orders:create', 'orders:approve', 'customers:manage']
    },
    { 
      username: 'supervisor', 
      passwordHash: defaultPass, 
      name: 'Production Supervisor', 
      role: 'production', 
      department: 'Manufacturing & Floor', 
      branch: 'Main Plant - Tiruchirappalli',
      permissions: ['production:run', 'production:view', 'bom:view', 'waste:record']
    },
    { 
      username: 'inventory_mgr', 
      passwordHash: defaultPass, 
      name: 'Inventory Manager', 
      role: 'inventory', 
      department: 'Warehouse & Stores', 
      branch: 'Main Plant - Tiruchirappalli',
      permissions: ['inventory:view', 'stock:movement', 'stock:receipt']
    },
    { 
      username: 'purchase_mgr', 
      passwordHash: defaultPass, 
      name: 'Purchase Manager', 
      role: 'purchase', 
      department: 'Procurement', 
      branch: 'Main Plant - Tiruchirappalli',
      permissions: ['purchases:view', 'purchases:create', 'suppliers:manage']
    },
    { 
      username: 'accountant', 
      passwordHash: defaultPass, 
      name: 'Senior Accountant', 
      role: 'accountant', 
      department: 'Finance & Accounts', 
      branch: 'Main Plant - Tiruchirappalli',
      permissions: ['invoices:view', 'payments:record', 'gst:view', 'reports:finance']
    },
    { 
      username: 'auditor', 
      passwordHash: defaultPass, 
      name: 'Statutory Auditor', 
      role: 'auditor', 
      department: 'Internal & External Audit', 
      branch: 'Main Plant - Tiruchirappalli',
      permissions: ['audit:view', 'reports:export', 'ledger:view', 'readonly:*']
    },
    { 
      username: 'owner', 
      passwordHash: adminPass, 
      name: 'Factory Business Owner', 
      role: 'owner', 
      department: 'Board & Executive', 
      branch: 'Main Plant - Tiruchirappalli',
      permissions: ['*']
    }
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
      standardRatePaise: 4200,
      currentWeightedRate: 42,
      currentWeightedRatePaise: 4200,
      totalValuePaise: 420000,
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
      standardRatePaise: 14000,
      currentWeightedRate: 140,
      currentWeightedRatePaise: 14000,
      totalValuePaise: 420000,
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
      standardRatePaise: 20000,
      currentWeightedRate: 200,
      currentWeightedRatePaise: 20000,
      totalValuePaise: 100000,
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
      standardRatePaise: 250,
      currentWeightedRate: 2.50,
      currentWeightedRatePaise: 250,
      totalValuePaise: 125000,
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
      standardRatePaise: 1500,
      currentWeightedRate: 15,
      currentWeightedRatePaise: 1500,
      totalValuePaise: 45000,
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

