import request from 'supertest';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedBenchmarkData } from '../src/scripts/seedBenchmark';
import { Customer, Product, SalesOrder, AuditLog } from '../src/models';

const app = createApp();

jest.setTimeout(180000);

describe('Step 2: Salesman Field GPS Check-In Acceptance Suite', () => {
  let salesmanToken: string;
  let customer: any;
  let product: any;

  beforeAll(async () => {
    await connectDB();
    await seedBenchmarkData();

    // Authenticate Salesman A
    const salesmanRes = await request(app)
      .post('/api/auth/salesman-mobile-login')
      .send({ username: 'salesman_a', password: 'ZenLyft@123', routeTerritory: 'Tamil Nadu Field' });
    expect(salesmanRes.status).toBe(200);
    salesmanToken = salesmanRes.body.token;

    customer = await Customer.findOne({ code: 'RET-A' });
    product = await Product.findOne({ code: 'MUR-200G' });
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('1. successfully creates order with valid GPS coordinates and stores checkIn metadata', async () => {
    const validLat = 9.9252; // Madurai Retailer A coordinates
    const validLng = 78.1198;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesmanToken}`)
      .send({
        customerId: customer._id.toString(),
        items: [{ productCode: product.code, quantity: 20, unitPrice: product.sellingPrice }],
        checkIn: {
          lat: validLat,
          lng: validLng,
          accuracyMeters: 12,
          capturedAt: new Date().toISOString()
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order.checkIn).toBeDefined();
    expect(res.body.order.checkIn.lat).toBe(validLat);
    expect(res.body.order.checkIn.lng).toBe(validLng);

    // Verify stored in Database
    const savedOrder = await SalesOrder.findById(res.body.order._id);
    expect(savedOrder?.checkIn).toBeDefined();
    expect(savedOrder?.checkIn?.lat).toBe(validLat);
    expect(savedOrder?.checkIn?.lng).toBe(validLng);
    expect(savedOrder?.checkIn?.accuracyMeters).toBe(12);

    // Verify logged in AuditLog details
    const audit = await AuditLog.findOne({
      entityType: 'SalesOrder',
      entityId: savedOrder?._id.toString(),
      action: 'SALES_ORDER_CREATED'
    });
    expect(audit).toBeDefined();
    expect(audit?.details?.checkIn).toBeDefined();
    expect(audit?.details?.checkIn?.lat).toBe(validLat);
  });

  it('2. rejects order creation when latitude is out of bounds (> 90 or < -90)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesmanToken}`)
      .send({
        customerId: customer._id.toString(),
        items: [{ productCode: product.code, quantity: 10, unitPrice: product.sellingPrice }],
        checkIn: {
          lat: 95.1234, // Out of range (> 90)
          lng: 78.1198
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors?.[0]?.message || res.body.error).toContain('Latitude must be between -90 and 90');
  });

  it('3. rejects order creation when longitude is out of bounds (> 180 or < -180)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesmanToken}`)
      .send({
        customerId: customer._id.toString(),
        items: [{ productCode: product.code, quantity: 10, unitPrice: product.sellingPrice }],
        checkIn: {
          lat: 9.9252,
          lng: -185.0 // Out of range (< -180)
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors?.[0]?.message || res.body.error).toContain('Longitude must be between -180 and 180');
  });

  it('4. order without GPS check-in creates successfully (never blocks when GPS denied)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${salesmanToken}`)
      .send({
        customerId: customer._id.toString(),
        items: [{ productCode: product.code, quantity: 15, unitPrice: product.sellingPrice }]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order.orderNumber).toBeDefined();

    const savedOrder = await SalesOrder.findById(res.body.order._id);
    expect(!savedOrder?.checkIn || savedOrder?.checkIn?.lat === undefined).toBe(true);
  });

  it('5. GPS check-in survives offline sync batch (/api/orders/sync-batch)', async () => {
    const offlineSyncUuid = 'offline_gps_test_' + Date.now();
    const offlineLat = 10.7905;
    const offlineLng = 78.7047;

    const res = await request(app)
      .post('/api/orders/sync-batch')
      .set('Authorization', `Bearer ${salesmanToken}`)
      .send({
        orders: [
          {
            customerId: customer._id.toString(),
            offlineSyncId: offlineSyncUuid,
            items: [{ productCode: product.code, quantity: 25, unitPrice: product.sellingPrice }],
            checkIn: {
              lat: offlineLat,
              lng: offlineLng,
              accuracyMeters: 8,
              capturedAt: new Date().toISOString()
            }
          }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);

    const syncedOrder = await SalesOrder.findOne({ offlineSyncId: offlineSyncUuid });
    expect(syncedOrder).toBeDefined();
    expect(syncedOrder?.checkIn?.lat).toBe(offlineLat);
    expect(syncedOrder?.checkIn?.lng).toBe(offlineLng);
    expect(syncedOrder?.checkIn?.accuracyMeters).toBe(8);
  });
});
