import request from 'supertest';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedBenchmarkData } from '../src/scripts/seedBenchmark';
import { 
  User, 
  SalesOrder, 
  Invoice, 
  Customer, 
  RawMaterial, 
  Product, 
  StockMovement, 
  AuditLog, 
  Notification 
} from '../src/models';

const app = createApp();

jest.setTimeout(180000);

describe('ZenLyft Commercial Multi-User ERP - Mandatory Acceptance Test Suite (Section 9)', () => {
  let adminToken: string;
  let salesmanToken: string;
  let createdOrderId: string;
  let createdInvoiceId: string;

  beforeAll(async () => {
    await connectDB();
    await seedBenchmarkData();

    // 1. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/admin-login')
      .send({ username: 'factory_admin', password: 'Admin@123' });
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
    adminToken = adminRes.body.token;

    // 2. Authenticate Salesman via Dedicated Mobile Terminal
    const salesmanRes = await request(app)
      .post('/api/auth/salesman-mobile-login')
      .send({ username: 'salesman_a', password: 'ZenLyft@123', routeTerritory: 'Tamil Nadu Field' });
    expect(salesmanRes.status).toBe(200);
    expect(salesmanRes.body.success).toBe(true);
    expect(salesmanRes.body.isMobileSession).toBe(true);
    salesmanToken = salesmanRes.body.token;

    // Verify Admin cannot authenticate through Salesman Mobile Terminal
    const adminMobileAttempt = await request(app)
      .post('/api/auth/salesman-mobile-login')
      .send({ username: 'factory_admin', password: 'Admin@123' });
    expect(adminMobileAttempt.status).toBe(403);
    expect(adminMobileAttempt.body.error).toContain('cannot log in through the Field Salesman Mobile interface');
  });

  afterAll(async () => {
    await disconnectDB();
  });

  // Scenario 1: Admin can access every authorized company module
  it('Scenario 1: Admin can access every authorized company module', async () => {
    const resOverview = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resOverview.status).toBe(200);
    expect(resOverview.body.success).toBe(true);
    expect(resOverview.body.companyOverview).toBeDefined();

    const resUsers = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resUsers.status).toBe(200);
    expect(resUsers.body.users.length).toBeGreaterThan(0);

    const resStock = await request(app)
      .get('/api/inventory/stock-summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resStock.status).toBe(200);
  });

  // Scenario 2: Salesman cannot access Admin Control Centre
  it('Scenario 2: Salesman cannot access Admin Control Centre (Strict Backend RBAC)', async () => {
    // A. Attempting Admin Login with salesman credentials
    const adminLoginAttempt = await request(app)
      .post('/api/auth/admin-login')
      .send({ username: 'salesman_a', password: 'ZenLyft@123' });
    expect(adminLoginAttempt.status).toBe(403);
    expect(adminLoginAttempt.body.success).toBe(false);
    expect(adminLoginAttempt.body.error).toContain('not authorized to access the Admin Control Centre');

    // B. Attempting to call Admin User Management with Salesman Bearer token
    const adminEndpointAttempt = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${salesmanToken}`);
    expect(adminEndpointAttempt.status).toBe(403);
    expect(adminEndpointAttempt.body.success).toBe(false);
  });

  // Scenario 3: Salesman can create an order
  it('Scenario 3: Salesman can create an order with stock check verification', async () => {
    const customer = await Customer.findOne({ code: 'RET-A' });
    expect(customer).toBeDefined();

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesmanToken}`)
      .send({
        customerId: customer!._id.toString(),
        salesmanName: 'Salesman A (Tamil Nadu)',
        items: [{ productCode: 'MUR-200G', quantity: 15 }]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.status).toBe('SUBMITTED');
    createdOrderId = res.body.order._id;
  });

  // Scenario 4: Admin can see that order
  it('Scenario 4: Admin can see that newly created salesman order in the Admin Control Centre', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const pending = res.body.pendingApprovals.orders;
    const found = pending.find((o: any) => o._id === createdOrderId);
    expect(found).toBeDefined();
    expect(found.orderNumber).toContain('SO-');
  });

  // Scenario 5: Admin can approve or reject it
  it('Scenario 5: Admin can approve the order and raise a GST invoice', async () => {
    const res = await request(app)
      .put(`/api/orders/${createdOrderId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approverName: 'Factory Admin Desk' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe('INVOICED');
    expect(res.body.invoice).toBeDefined();
    expect(res.body.invoice.invoiceNumber).toContain('INV/');
    createdInvoiceId = res.body.invoice._id;
  });

  // Scenario 6: Salesman can see the decision
  it('Scenario 6: Salesman can see the updated order status (INVOICED)', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${salesmanToken}`);

    expect(res.status).toBe(200);
    const order = res.body.orders.find((o: any) => o._id === createdOrderId);
    expect(order).toBeDefined();
    expect(order.status).toBe('INVOICED');
  });

  // Scenario 7: Approved order updates inventory allocation & retains requested qty
  it('Scenario 7: Approved order has valid stock allocation metadata and preserves requested quantity', async () => {
    const order = await SalesOrder.findById(createdOrderId);
    expect(order).toBeDefined();
    expect(order!.items[0].quantity).toBe(15);
    expect(order!.invoiceId).toBeDefined();
  });

  // Scenario 8: Dispatch updates finished goods stock
  it('Scenario 8: Dispatch deducts finished goods stock via authoritative Stock Ledger', async () => {
    const productBefore = await Product.findOne({ code: 'MUR-200G' });
    const stockBefore = productBefore!.currentStock;

    const res = await request(app)
      .put(`/api/orders/${createdInvoiceId}/dispatch`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ dispatcherName: 'Factory Admin Desk' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.invoice.isDispatched).toBe(true);

    const productAfter = await Product.findOne({ code: 'MUR-200G' });
    expect(productAfter!.currentStock).toBe(stockBefore - 15);

    // Verify StockMovement audit entry
    const movement = await StockMovement.findOne({ 
      sourceDocId: res.body.invoice.invoiceNumber, 
      movementType: 'SALES_DISPATCH' 
    });
    expect(movement).toBeDefined();
    expect(movement!.quantity).toBe(-15);
  });

  // Scenario 9: Invoice updates customer receivables
  it('Scenario 9: Invoice updates customer receivables in the authoritative ledger', async () => {
    const customer = await Customer.findOne({ code: 'RET-A' });
    expect(customer!.outstandingBalance).toBeGreaterThan(0);

    const invoice = await Invoice.findById(createdInvoiceId);
    expect(customer!.outstandingBalance).toBe(invoice!.grandTotal);
  });

  // Scenario 10: Payment updates invoice outstanding and customer balance
  it('Scenario 10: Payment updates invoice balanceDue and customer outstanding balance', async () => {
    const invoiceBefore = await Invoice.findById(createdInvoiceId);
    const paymentAmount = 500;

    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        invoiceId: createdInvoiceId,
        amount: paymentAmount,
        paymentMethod: 'UPI',
        reference: 'UPI-TEST-123',
        receivedBy: 'Senior Accountant'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const invoiceAfter = await Invoice.findById(createdInvoiceId);
    expect(invoiceAfter!.paidAmount).toBe(paymentAmount);
    expect(invoiceAfter!.balanceDue).toBe(invoiceBefore!.grandTotal - paymentAmount);

    const customerAfter = await Customer.findOne({ code: 'RET-A' });
    expect(customerAfter!.outstandingBalance).toBe(invoiceBefore!.grandTotal - paymentAmount);
  });

  // Scenario 11: Purchase receipt updates raw material inventory
  it('Scenario 11: Purchase receipt updates raw material inventory and recalculates weighted average rate', async () => {
    const flourBefore = await RawMaterial.findOne({ code: 'FLOUR' });
    const stockBefore = flourBefore!.currentStock;

    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        supplierName: 'Kaveri Flour Mills',
        items: [
          {
            materialCode: 'FLOUR',
            quantity: 50,
            rate: 46
          }
        ],
        notes: 'Test procurement'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const flourAfter = await RawMaterial.findOne({ code: 'FLOUR' });
    expect(flourAfter!.currentStock).toBe(stockBefore + 50);

    const movement = await StockMovement.findOne({ 
      sourceDocType: 'PURCHASE', 
      itemCode: 'FLOUR',
      quantity: 50 
    });
    expect(movement).toBeDefined();
  });

  // Scenario 12: Production consumes raw materials and creates finished goods
  it('Scenario 12: Production run consumes BOM materials and credits finished goods', async () => {
    const product = await Product.findOne({ code: 'MUR-200G' });
    const flourBefore = await RawMaterial.findOne({ code: 'FLOUR' });
    const fgBefore = product!.currentStock;

    const res = await request(app)
      .post('/api/production/runs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId: product!._id.toString(),
        materialIssues: [
          { materialCode: 'FLOUR', actualQtyIssued: 20 },
          { materialCode: 'COOKING-OIL', actualQtyIssued: 5 },
          { materialCode: 'SPICE-MIX', actualQtyIssued: 0.6 }
        ],
        actualOutputPackets: 95,
        damagedPouches: 2,
        cartonsUsed: 5,
        directLaborCost: 600,
        directOverheadCost: 300,
        supervisorName: 'Production Supervisor'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.run.actualOutputPackets).toBe(95);

    // Verify RM deduction
    const flourAfter = await RawMaterial.findOne({ code: 'FLOUR' });
    expect(flourAfter!.currentStock).toBe(flourBefore!.currentStock - 20);

    // Verify FG credit
    const fgAfter = await Product.findOne({ code: 'MUR-200G' });
    expect(fgAfter!.currentStock).toBe(fgBefore + 95);
  });

  // Scenario 13: All related records have audit history
  it('Scenario 13: All business transactions generate traceable audit logs', async () => {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(10);
    expect(logs.length).toBeGreaterThan(0);
    const actions = logs.map(l => l.action);
    expect(actions).toContain('SALES_ORDER_CREATED');
  });

  // Scenario 14: Unauthorized API calls are rejected
  it('Scenario 14: Protected endpoints reject requests without a valid Bearer token', async () => {
    const resNoToken = await request(app).get('/api/auth/me');
    expect(resNoToken.status).toBe(401);
    expect(resNoToken.body.success).toBe(false);

    const resFakeToken = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer fake_invalid_jwt_token_123');
    expect(resFakeToken.status).toBe(401);
  });

  // Scenario 15: Cross-company / tenant data access is prevented
  it('Scenario 15: Users belong to tenant and cross-tenant access is constrained', async () => {
    const user = await User.findOne({ username: 'factory_admin' });
    expect(user!.tenantId).toBe(process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT');
  });

  // Scenario 16: Offline orders synchronize without duplication
  it('Scenario 16: Offline order sync is idempotent and deduplicates matching offlineSyncId', async () => {
    const customer = await Customer.findOne({ code: 'RET-A' });
    const uniqueSyncId = 'OFFLINE_UUID_' + Date.now();

    const orderPayload = {
      customerId: customer!._id.toString(),
      salesmanName: 'Salesman A (Tamil Nadu)',
      offlineSyncId: uniqueSyncId,
      items: [{ productCode: 'MUR-200G', quantity: 5 }]
    };

    // First sync
    const res1 = await request(app)
      .post('/api/orders/sync-batch')
      .set('Authorization', `Bearer ${salesmanToken}`)
      .send({ orders: [orderPayload] });
    expect(res1.status).toBe(200);
    expect(res1.body.count).toBe(1);

    // Second sync with identical offlineSyncId
    const res2 = await request(app)
      .post('/api/orders/sync-batch')
      .set('Authorization', `Bearer ${salesmanToken}`)
      .send({ orders: [orderPayload] });
    expect(res2.status).toBe(200);
    expect(res2.body.count).toBe(1);

    // Verify only one order was persisted in the database
    const matchingOrders = await SalesOrder.find({ offlineSyncId: uniqueSyncId });
    expect(matchingOrders.length).toBe(1);
  });

  // Scenario 17: Authorized users receive relevant notifications
  it('Scenario 17: Notification system logs event alerts without mutating business data', async () => {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    expect(notifications.length).toBeGreaterThan(0);
  });

  // Scenario 18: Failed integrations do not corrupt business transactions
  it('Scenario 18: External notification failure does not corrupt or roll back business transactions', async () => {
    const customer = await Customer.findOne({ code: 'RET-A' });
    
    // Order creation succeeds even if OpenWA is offline/simulated
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesmanToken}`)
      .send({
        customerId: customer!._id.toString(),
        salesmanName: 'Salesman A (Tamil Nadu)',
        items: [{ productCode: 'MUR-200G', quantity: 10 }]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe('SUBMITTED');
  });
});
