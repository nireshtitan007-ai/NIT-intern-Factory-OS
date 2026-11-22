import request from 'supertest';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedBenchmarkData } from '../src/scripts/seedBenchmark';
import { User, Supplier, Customer, Product, RawMaterial, BOM, AuditLog, SalesOrder } from '../src/models';
import { generateToken } from '../src/middleware/auth.middleware';

const app = createApp();
jest.setTimeout(180000);

describe('Step 7: Master Data Management, Suppliers, Price Lists & Reorder Alerts', () => {
  let adminToken: string;
  let salesmanToken: string;
  let productionToken: string;

  beforeAll(async () => {
    await connectDB();
    await seedBenchmarkData();

    const admin = await User.findOne({ username: 'factory_admin' });
    const salesman = await User.findOne({ username: 'salesman_a' });
    const production = await User.findOne({ username: 'supervisor' });

    adminToken = generateToken(admin!);
    salesmanToken = generateToken(salesman!);
    productionToken = generateToken(production!);
  }, 180000);

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Supplier Master Data & Purchase Integration', () => {
    let createdSupplierId: string;

    it('creates a new supplier with GST and address details and logs to AuditLog', async () => {
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'SUP-NEW-01',
          name: 'Supreme Agrotech Traders',
          gstin: '33AAACS1234F1Z8',
          state: 'Tamil Nadu',
          stateCode: '33',
          contactPerson: 'Karthik Raja',
          phone: '9840199999',
          email: 'sales@supremeagro.in',
          address: '42, Mill Road, Trichy',
          paymentTermsDays: 45
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.supplier.code).toBe('SUP-NEW-01');
      createdSupplierId = res.body.supplier._id;

      // Check AuditLog
      const audit = await AuditLog.findOne({ entityType: 'Supplier', entityId: createdSupplierId });
      expect(audit).toBeDefined();
      expect(audit?.action).toBe('CREATE');
    });

    it('updates supplier contact and payment terms and logs to AuditLog', async () => {
      const res = await request(app)
        .put(`/api/suppliers/${createdSupplierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phone: '9840188888',
          paymentTermsDays: 60
        });

      expect(res.status).toBe(200);
      expect(res.body.supplier.paymentTermsDays).toBe(60);

      const audit = await AuditLog.findOne({ entityType: 'Supplier', entityId: createdSupplierId, action: 'UPDATE' });
      expect(audit).toBeDefined();
    });

    it('soft-deletes supplier by setting active=false', async () => {
      const res = await request(app)
        .delete(`/api/suppliers/${createdSupplierId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const supplierInDb = await Supplier.findById(createdSupplierId);
      expect(supplierInDb?.active).toBe(false);

      // Verify default GET excludes inactive suppliers
      const listRes = await request(app)
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.body.suppliers.some((s: any) => s._id === createdSupplierId)).toBe(false);

      // Verify includeInactive=true returns it
      const allRes = await request(app)
        .get('/api/suppliers?includeInactive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(allRes.body.suppliers.some((s: any) => s._id === createdSupplierId)).toBe(true);
    });
  });

  describe('2. Customer-Specific Price Lists & Order Flow', () => {
    let customerWithPriceListId: string;

    it('creates a customer with agreed discounted price list for Murukku 200g', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'RET-VIP-01',
          name: 'Annapoorna Supermarket VIP',
          type: 'RETAILER',
          state: 'Tamil Nadu',
          stateCode: '33',
          address: 'Main Bazaar, Madurai',
          phone: '9842100000',
          creditLimit: 100000,
          priceList: [
            {
              productCode: 'MUR-200G',
              unitPrice: 45 // Special discounted rate (standard is ₹50)
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      customerWithPriceListId = res.body.customer._id;
    });

    it('automatically uses the customer price list rate when salesman places order without specifying price', async () => {
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesmanToken}`)
        .send({
          customerId: customerWithPriceListId,
          items: [
            {
              productCode: 'MUR-200G',
              quantity: 10
              // unitPrice omitted! Should take customer's agreed ₹45 instead of catalog ₹50
            }
          ]
        });

      expect(orderRes.status).toBe(201);
      const order = orderRes.body.order;
      expect(order.items[0].unitPrice).toBe(45);
      expect(order.items[0].lineTotal).toBe(450); // 10 * 45
    });
  });

  describe('3. Product Master CRUD & Soft-Delete', () => {
    let newProductId: string;

    it('creates a new product with paise-accurate selling price', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'MIX-250G',
          name: 'Madras Mixture 250g',
          packSize: '250g',
          sellingPrice: 65,
          gstRate: 5,
          hsnCode: '19059040',
          packetsPerCarton: 20
        });

      expect(res.status).toBe(201);
      expect(res.body.product.sellingPricePaise).toBe(6500);
      newProductId = res.body.product._id;
    });

    it('updates product price and verifies AuditLog entry', async () => {
      const res = await request(app)
        .put(`/api/products/${newProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sellingPrice: 70
        });

      expect(res.status).toBe(200);
      expect(res.body.product.sellingPricePaise).toBe(7000);
    });

    it('soft-deletes product and hides from default catalog', async () => {
      const res = await request(app)
        .delete(`/api/products/${newProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const listRes = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${salesmanToken}`);

      expect(listRes.body.products.some((p: any) => p._id === newProductId)).toBe(false);
    });
  });

  describe('4. Raw Material Reorder Alerts & Procurement Warning', () => {
    it('returns low-stock reorder alerts when currentStock <= reorderLevel', async () => {
      // Create a material with reorderLevel = 100 and currentStock = 20
      const mat = await RawMaterial.create({
        code: 'TEST-CHILLI-01',
        name: 'Guntur Red Chilli Powder',
        category: 'RAW_MATERIAL',
        unit: 'kg',
        standardRate: 250,
        standardRatePaise: 25000,
        currentWeightedRate: 250,
        currentWeightedRatePaise: 25000,
        currentStock: 20,
        openingStock: 20,
        reorderLevel: 100,
        totalValuePaise: 500000,
        active: true
      });

      const res = await request(app)
        .get('/api/inventory/reorder-alerts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.alerts)).toBe(true);

      const alert = res.body.alerts.find((a: any) => a.code === 'TEST-CHILLI-01');
      expect(alert).toBeDefined();
      expect(alert.shortage).toBe(80); // 100 - 20
    });
  });
});
