import request from 'supertest';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedBenchmarkData } from '../src/scripts/seedBenchmark';
import { Customer, Product, SalesOrder, User } from '../src/models';

const app = createApp();

jest.setTimeout(60000);

describe('Step 4: PWA Offline-First & Salesman My-Sales Summary Suite', () => {
  let salesmanAToken: string;
  let salesmanBToken: string;
  let auditorToken: string;
  let customerA: any;
  let customerB: any;
  let product: any;

  beforeAll(async () => {
    await connectDB();
    await seedBenchmarkData();

    // Authenticate Salesman A
    const resA = await request(app)
      .post('/api/auth/salesman-mobile-login')
      .send({ username: 'salesman_a', password: 'ZenLyft@123', routeTerritory: 'Tamil Nadu Field' });
    expect(resA.status).toBe(200);
    salesmanAToken = resA.body.token;

    // Authenticate Salesman B
    const resB = await request(app)
      .post('/api/auth/salesman-mobile-login')
      .send({ username: 'salesman_b', password: 'ZenLyft@123', routeTerritory: 'Karnataka Field' });
    expect(resB.status).toBe(200);
    salesmanBToken = resB.body.token;

    // Authenticate Auditor
    const resAuditor = await request(app)
      .post('/api/auth/login')
      .send({ username: 'auditor', password: 'ZenLyft@123' });
    expect(resAuditor.status).toBe(200);
    auditorToken = resAuditor.body.token;

    customerA = await Customer.findOne({ code: 'RET-A' });
    customerB = await Customer.findOne({ code: 'DIST-B' });
    product = await Product.findOne({ code: 'MUR-200G' });

    // Place an order for Salesman A
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesmanAToken}`)
      .send({
        customerId: customerA._id.toString(),
        items: [{ productCode: product.code, quantity: 50 }]
      });

    // Place an order for Salesman B
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesmanBToken}`)
      .send({
        customerId: customerB._id.toString(),
        items: [{ productCode: product.code, quantity: 30 }]
      });
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('1. GET /api/orders/mine/summary returns salesman-specific totals and status breakdown', async () => {
    const res = await request(app)
      .get('/api/orders/mine/summary')
      .set('Authorization', `Bearer ${salesmanAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary).toBeDefined();

    const summary = res.body.summary;
    expect(summary.totalOrders).toBeGreaterThanOrEqual(1);
    expect(summary.statusCounts).toBeDefined();
    expect(summary.statusCounts.SUBMITTED).toBeGreaterThanOrEqual(1);
    expect(summary.totalSales).toBeGreaterThan(0);
    expect(summary.customerTotals.length).toBeGreaterThanOrEqual(1);

    // Salesman A must only see Customer A in their customerTotals, not Customer B
    const custBInSummary = summary.customerTotals.find((c: any) => c.customerCode === 'DIST-B');
    expect(custBInSummary).toBeUndefined();
  });

  it('2. Rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/orders/mine/summary');
    expect(res.status).toBe(401);
  });

  it('3. Rejects non-salesman roles (e.g. auditor) with 403', async () => {
    const res = await request(app)
      .get('/api/orders/mine/summary')
      .set('Authorization', `Bearer ${auditorToken}`);
    expect(res.status).toBe(403);
  });
});
