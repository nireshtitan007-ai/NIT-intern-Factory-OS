import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedBenchmarkData } from '../src/scripts/seedBenchmark';
import { 
  User, 
  Customer, 
  Product, 
  RawMaterial, 
  StockMovement, 
  SalesOrder, 
  Invoice, 
  Payment 
} from '../src/models';
import { StockLedgerService } from '../src/services/stockLedger.service';
import { generateToken } from '../src/middleware/auth.middleware';

const app = createApp();

jest.setTimeout(180000);

describe('ZenLyft Phase 1 - Security and Correctness Acceptance Test Suite', () => {
  let adminToken: string;
  let salesmanToken: string;
  let auditorToken: string;
  let productionToken: string;

  beforeAll(async () => {
    await connectDB();
    await seedBenchmarkData();

    // Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/admin-login')
      .send({ username: 'factory_admin', password: 'Admin@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // Authenticate Salesman
    const salesmanRes = await request(app)
      .post('/api/auth/salesman-mobile-login')
      .send({ username: 'salesman_a', password: 'Nash@123', routeTerritory: 'Tamil Nadu Field' });
    expect(salesmanRes.status).toBe(200);
    salesmanToken = salesmanRes.body.token;

    // Authenticate Auditor
    const auditorRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'auditor', password: 'Nash@123' });
    expect(auditorRes.status).toBe(200);
    auditorToken = auditorRes.body.token;

    // Authenticate Production Supervisor
    const prodRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'supervisor', password: 'Nash@123' });
    expect(prodRes.status).toBe(200);
    productionToken = prodRes.body.token;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Unauthenticated Access Rejection (401 on every route)', () => {
    const unauthGetRoutes = [
      '/api/auth/me',
      '/api/customers',
      '/api/products',
      '/api/raw-materials',
      '/api/boms',
      '/api/inventory/stock-summary',
      '/api/inventory/ledger',
      '/api/purchases',
      '/api/production/runs',
      '/api/orders',
      '/api/invoices',
      '/api/payments',
      '/api/reports/sales-register',
      '/api/reports/gst-summary',
      '/api/reports/production-report',
      '/api/reports/outstanding',
      '/api/admin/overview',
      '/api/owner/overview',
      '/api/audit-logs',
      '/api/whatsapp/notifications',
      '/api/whatsapp/status',
      '/api/realtime/events'
    ];

    test.each(unauthGetRoutes)('GET %s without Bearer token returns 401', async (route) => {
      const res = await request(app).get(route);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/orders without token returns 401', async () => {
      const res = await request(app).post('/api/orders').send({});
      expect(res.status).toBe(401);
    });

    it('POST /api/purchases without token returns 401', async () => {
      const res = await request(app).post('/api/purchases').send({});
      expect(res.status).toBe(401);
    });

    it('POST /api/payments without token returns 401', async () => {
      const res = await request(app).post('/api/payments').send({});
      expect(res.status).toBe(401);
    });

    it('POST /api/benchmark/seed without token returns 401', async () => {
      const res = await request(app).post('/api/benchmark/seed').send({});
      expect(res.status).toBe(401);
    });
  });

  describe('2. Role and Permission Enforcement Matrix', () => {
    it('Auditor can read master and reporting data', async () => {
      const resCustomers = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${auditorToken}`);
      expect(resCustomers.status).toBe(200);

      const resInvoices = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${auditorToken}`);
      expect(resInvoices.status).toBe(200);

      const resGST = await request(app)
        .get('/api/reports/gst-summary')
        .set('Authorization', `Bearer ${auditorToken}`);
      expect(resGST.status).toBe(200);
    });

    it('Auditor is strictly read-only: any mutating POST/PUT returns 403', async () => {
      // Attempting to create order as Auditor
      const resOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${auditorToken}`)
        .send({ customerId: 'fake_id', items: [{ productCode: 'MUR-200G', quantity: 5 }] });
      expect(resOrder.status).toBe(403);
      expect(resOrder.body.error).toContain('Auditor role is strictly read-only');

      // Attempting to record payment as Auditor
      const resPayment = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${auditorToken}`)
        .send({ invoiceId: 'fake_id', amount: 500 });
      expect(resPayment.status).toBe(403);
      expect(resPayment.body.error).toContain('Auditor role is strictly read-only');

      // Attempting to record purchase as Auditor
      const resPurchase = await request(app)
        .post('/api/purchases')
        .set('Authorization', `Bearer ${auditorToken}`)
        .send({ supplierName: 'Test', items: [] });
      expect(resPurchase.status).toBe(403);

      // Attempting to approve order as Auditor
      const resApprove = await request(app)
        .put('/api/orders/507f1f77bcf86cd799439011/approve')
        .set('Authorization', `Bearer ${auditorToken}`)
        .send({ approverName: 'Auditor' });
      expect(resApprove.status).toBe(403);
      expect(resApprove.body.error).toContain('Auditor role is strictly read-only');

      // Attempting to update overheads as Auditor
      const resCosts = await request(app)
        .put('/api/production/runs/507f1f77bcf86cd799439011/costs')
        .set('Authorization', `Bearer ${auditorToken}`)
        .send({ laborCost: 100, overheadCost: 50 });
      expect(resCosts.status).toBe(403);
    });

    it('Salesman cannot access procurement, production, payments, reports, or admin control centre', async () => {
      // Salesman blocked from purchases
      const resPurchases = await request(app)
        .post('/api/purchases')
        .set('Authorization', `Bearer ${salesmanToken}`)
        .send({ supplierName: 'Test', items: [{ materialCode: 'FLOUR', quantity: 10, rate: 40 }] });
      expect(resPurchases.status).toBe(403);

      // Salesman blocked from production runs
      const resProd = await request(app)
        .post('/api/production/runs')
        .set('Authorization', `Bearer ${salesmanToken}`)
        .send({ productId: 'fake_id', actualOutputPackets: 100 });
      expect(resProd.status).toBe(403);

      // Salesman blocked from payments
      const resPayment = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${salesmanToken}`)
        .send({ invoiceId: '507f1f77bcf86cd799439011', amount: 500 });
      expect(resPayment.status).toBe(403);

      // Salesman blocked from sales register report
      const resReport = await request(app)
        .get('/api/reports/sales-register')
        .set('Authorization', `Bearer ${salesmanToken}`);
      expect(resReport.status).toBe(403);

      // Salesman blocked from admin overview
      const resAdmin = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${salesmanToken}`);
      expect(resAdmin.status).toBe(403);
    });

    it('Salesman sees ONLY their own orders in GET /api/orders', async () => {
      // Login as Salesman B
      const salesmanBRes = await request(app)
        .post('/api/auth/salesman-mobile-login')
        .send({ username: 'salesman_b', password: 'Nash@123', routeTerritory: 'Karnataka Field' });
      expect(salesmanBRes.status).toBe(200);
      const salesmanBToken = salesmanBRes.body.token;

      const customer = await Customer.findOne({ code: 'RET-A' });

      // Salesman A creates an order
      const orderARes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesmanToken}`)
        .send({
          customerId: customer!._id.toString(),
          items: [{ productCode: 'MUR-200G', quantity: 10 }]
        });
      expect(orderARes.status).toBe(201);
      const orderAId = orderARes.body.order._id;

      // Salesman B creates an order
      const orderBRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesmanBToken}`)
        .send({
          customerId: customer!._id.toString(),
          items: [{ productCode: 'MUR-200G', quantity: 20 }]
        });
      expect(orderBRes.status).toBe(201);
      const orderBId = orderBRes.body.order._id;

      // Salesman A fetches orders: must see Order A, but NOT Order B
      const listARes = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${salesmanToken}`);
      expect(listARes.status).toBe(200);
      const orderIdsA = listARes.body.orders.map((o: any) => o._id);
      expect(orderIdsA).toContain(orderAId);
      expect(orderIdsA).not.toContain(orderBId);

      // Salesman B fetches orders: must see Order B, but NOT Order A
      const listBRes = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${salesmanBToken}`);
      expect(listBRes.status).toBe(200);
      const orderIdsB = listBRes.body.orders.map((o: any) => o._id);
      expect(orderIdsB).toContain(orderBId);
      expect(orderIdsB).not.toContain(orderAId);

      // Admin fetches orders: sees both orders
      const listAdminRes = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listAdminRes.status).toBe(200);
      const allOrderIds = listAdminRes.body.orders.map((o: any) => o._id);
      expect(allOrderIds).toContain(orderAId);
      expect(allOrderIds).toContain(orderBId);
    });

    it('Production supervisor cannot create sales orders', async () => {
      const customer = await Customer.findOne({ code: 'RET-A' });
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${productionToken}`)
        .send({ customerId: customer!._id.toString(), items: [{ productCode: 'MUR-200G', quantity: 5 }] });
      expect(res.status).toBe(403);
    });
  });

  describe('3. Multi-Tenancy Isolation', () => {
    let tenantBToken: string;

    beforeAll(async () => {
      // Create Tenant B Admin User
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('TenantB@123', salt);
      const userB = await User.create({
        username: 'tenant_b_admin',
        passwordHash: hash,
        name: 'Madurai Snacks Admin',
        role: 'admin',
        tenantId: 'TENANT_MADURAI_SNACKS',
        department: 'Management',
        permissions: ['*']
      });
      tenantBToken = generateToken(userB);

      // Create distinct customer for Tenant B
      await Customer.create({
        tenantId: 'TENANT_MADURAI_SNACKS',
        code: 'TENANT_B_CUST_1',
        name: 'Madurai Local Store',
        type: 'RETAILER',
        state: 'Tamil Nadu',
        stateCode: '33',
        outstandingBalance: 12500
      });
    });

    it('Tenant A cannot see Tenant B customers', async () => {
      const resA = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resA.status).toBe(200);
      const foundInA = resA.body.customers.find((c: any) => c.code === 'TENANT_B_CUST_1');
      expect(foundInA).toBeUndefined();
    });

    it('Tenant B sees only Tenant B customers', async () => {
      const resB = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${tenantBToken}`);
      expect(resB.status).toBe(200);
      const codes = resB.body.customers.map((c: any) => c.code);
      expect(codes).toContain('TENANT_B_CUST_1');
      expect(codes).not.toContain('RET-A');
    });

    it('Tenant B cannot access Tenant A order overview or invoices', async () => {
      const resB = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${tenantBToken}`);
      expect(resB.status).toBe(200);
      expect(resB.body.invoices.length).toBe(0);
    });
  });

  describe('4. Stock Movement Ledger Immutability & Negative Stock Prevention', () => {
    it('Direct mutation or deletion of StockMovement throws IMMUTABLE_LEDGER_VIOLATION', async () => {
      const movement = await StockMovement.findOne();
      expect(movement).toBeDefined();

      // Attempting updateOne directly
      await expect(
        StockMovement.updateOne({ _id: movement!._id }, { quantity: 9999 })
      ).rejects.toThrow('IMMUTABLE_LEDGER_VIOLATION');

      // Attempting deleteOne directly
      await expect(
        StockMovement.deleteOne({ _id: movement!._id })
      ).rejects.toThrow('IMMUTABLE_LEDGER_VIOLATION');
    });

    it('StockLedgerService strictly rejects negative inventory for outward movements', async () => {
      const product = await Product.findOne({ code: 'MUR-200G' });
      expect(product).toBeDefined();

      const currentBalance = product!.currentStock;
      const excessiveQuantity = -(currentBalance + 500);

      await expect(
        StockLedgerService.recordMovement({
          tenantId: 'TENANT_NASH_FOODS',
          itemType: 'FINISHED_GOOD',
          itemId: product!._id,
          itemCode: product!.code,
          itemName: product!.name,
          movementType: 'SALES_DISPATCH',
          quantity: excessiveQuantity,
          unit: 'packet',
          sourceDocType: 'INVOICE',
          sourceDocId: 'INV-TEST-FAIL'
        })
      ).rejects.toThrow('INSUFFICIENT_STOCK');
    });
  });

  describe('5. Input Validation (Zod Validation Middleware)', () => {
    it('Rejects invalid order payload with 400 and structured validation issues', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesmanToken}`)
        .send({
          customerId: '', // empty
          items: [] // empty
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Validation failed');
      expect(res.body.details).toBeDefined();
    });

    it('Rejects negative payment amount with 400', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: 'some_id',
          amount: -100 // invalid
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
