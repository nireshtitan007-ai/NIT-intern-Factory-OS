import request from 'supertest';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedBenchmarkData } from '../src/scripts/seedBenchmark';
import { Customer, Product, Invoice, AuditLog, Settings } from '../src/models';
import { EInvoiceService } from '../src/services/einvoice.service';

const app = createApp();

jest.setTimeout(180000);

describe('Step 4: Mock NIC e-Invoice Schema v1.1 Export & Deterministic IRN Suite', () => {
  let adminToken: string;
  let auditorToken: string;
  let intraInvoice: any;
  let interInvoice: any;

  beforeAll(async () => {
    await connectDB();
    await seedBenchmarkData();

    // Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/admin-login')
      .send({ username: 'factory_admin', password: 'Admin@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // Authenticate Auditor
    const auditorRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'auditor', password: 'Nash@123' });
    expect(auditorRes.status).toBe(200);
    auditorToken = auditorRes.body.token;

    // Seed an intra-state invoice (TN -> TN, Retailer A)
    const retA = await Customer.findOne({ code: 'RET-A' });
    const distB = await Customer.findOne({ code: 'DIST-B' });
    const product = await Product.findOne({ code: 'MUR-200G' });

    intraInvoice = await Invoice.create({
      tenantId: 'DEFAULT_TENANT',
      invoiceNumber: 'INV/2026-27/0001',
      salesOrderId: retA!._id,
      customerId: retA!._id,
      customerCode: retA!.code,
      customerName: retA!.name,
      customerGstin: retA!.gstin || '33ABCDE1234F1Z5',
      customerState: retA!.state,
      customerStateCode: retA!.stateCode,
      factoryState: 'Tamil Nadu',
      placeOfSupply: retA!.state,
      isInterState: false,
      items: [{
        productId: product!._id,
        productCode: product!.code,
        productName: product!.name,
        hsnCode: '19059040',
        quantity: 50,
        unitPrice: 150,
        unitPricePaise: 15000,
        taxableAmount: 7500,
        taxableAmountPaise: 750000,
        cgstRate: 2.5,
        cgstAmount: 187.5,
        cgstAmountPaise: 18750,
        sgstRate: 2.5,
        sgstAmount: 187.5,
        sgstAmountPaise: 18750,
        igstRate: 0,
        igstAmount: 0,
        igstAmountPaise: 0,
        totalAmount: 7875,
        totalAmountPaise: 787500
      }],
      taxableValue: 7500,
      taxableValuePaise: 750000,
      cgstTotal: 187.5,
      cgstTotalPaise: 18750,
      sgstTotal: 187.5,
      sgstTotalPaise: 18750,
      igstTotal: 0,
      igstTotalPaise: 0,
      grandTotal: 7875,
      grandTotalPaise: 787500,
      balanceDue: 7875,
      balanceDuePaise: 787500,
      paymentStatus: 'UNPAID',
      dueDate: new Date(Date.now() + 30 * 86400000)
    });

    // Seed an inter-state invoice (TN -> Kerala, Distributor B)
    interInvoice = await Invoice.create({
      tenantId: 'DEFAULT_TENANT',
      invoiceNumber: 'INV/2026-27/0002',
      salesOrderId: distB!._id,
      customerId: distB!._id,
      customerCode: distB!.code,
      customerName: distB!.name,
      customerGstin: distB!.gstin || '32AABCB2222B1Z6',
      customerState: distB!.state,
      customerStateCode: distB!.stateCode,
      factoryState: 'Tamil Nadu',
      placeOfSupply: distB!.state,
      isInterState: true,
      items: [{
        productId: product!._id,
        productCode: product!.code,
        productName: product!.name,
        hsnCode: '19059040',
        quantity: 100,
        unitPrice: 150,
        unitPricePaise: 15000,
        taxableAmount: 15000,
        taxableAmountPaise: 1500000,
        cgstRate: 0,
        cgstAmount: 0,
        cgstAmountPaise: 0,
        sgstRate: 0,
        sgstAmount: 0,
        sgstAmountPaise: 0,
        igstRate: 5,
        igstAmount: 750,
        igstAmountPaise: 75000,
        totalAmount: 15750,
        totalAmountPaise: 1575000
      }],
      taxableValue: 15000,
      taxableValuePaise: 1500000,
      cgstTotal: 0,
      cgstTotalPaise: 0,
      sgstTotal: 0,
      sgstTotalPaise: 0,
      igstTotal: 750,
      igstTotalPaise: 75000,
      grandTotal: 15750,
      grandTotalPaise: 1575000,
      balanceDue: 15750,
      balanceDuePaise: 1575000,
      paymentStatus: 'UNPAID',
      dueDate: new Date(Date.now() + 30 * 86400000)
    });
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('1. generates a deterministic 64-char SHA-256 IRN, 15-digit Ack No, and logs audit entry', async () => {
    const res = await request(app)
      .post(`/api/invoices/${intraInvoice._id}/einvoice/generate-mock`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.invoice.irn).toHaveLength(64);
    expect(res.body.invoice.ackNo).toHaveLength(15);
    expect(res.body.invoice.isMockEInvoice).toBe(true);

    // Verify persisted in DB
    const persisted = await Invoice.findById(intraInvoice._id);
    expect(persisted?.irn).toBe(res.body.invoice.irn);
    expect(persisted?.ackNo).toBe(res.body.invoice.ackNo);

    // Verify AuditLog entry
    const log = await AuditLog.findOne({
      action: 'EINVOICE_IRN_GENERATED',
      entityId: intraInvoice._id.toString()
    });
    expect(log).not.toBeNull();
    expect(log?.details.isMock).toBe(true);
  });

  it('2. builds NIC Schema v1.1 payload for intra-state invoice with exact arithmetic and CGST+SGST', async () => {
    const res = await request(app)
      .get(`/api/invoices/${intraInvoice._id}/einvoice-json`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="einvoice-INV_2026-27_0001.json"/);

    const payload = res.body;
    expect(payload.Version).toBe('1.1');
    expect(payload._mock).toBe(true);
    expect(payload.TranDtls.TaxSch).toBe('GST');
    expect(payload.DocDtls.Typ).toBe('INV');
    expect(payload.DocDtls.No).toBe('INV/2026-27/0001');

    // Intra-state tax verification
    expect(payload.ValDtls.AssVal).toBe(7500);
    expect(payload.ValDtls.CgstVal).toBe(187.5);
    expect(payload.ValDtls.SgstVal).toBe(187.5);
    expect(payload.ValDtls.IgstVal).toBe(0);
    expect(payload.ValDtls.TotInvVal).toBe(7875);

    // Item verification
    expect(payload.ItemList).toHaveLength(1);
    expect(payload.ItemList[0].HsnCd).toBe('19059040');
    expect(payload.ItemList[0].CgstAmt).toBe(187.5);
    expect(payload.ItemList[0].SgstAmt).toBe(187.5);
    expect(payload.ItemList[0].IgstAmt).toBe(0);
    expect(payload.ItemList[0].TotItemVal).toBe(7875);

    // Arithmetic balance test: TotInvVal === sum(TotItemVal) + RndOffAmt
    const itemTotalSum = payload.ItemList.reduce((s: number, it: any) => s + it.TotItemVal, 0);
    expect(payload.ValDtls.TotInvVal).toBe(itemTotalSum + payload.ValDtls.RndOffAmt);
  });

  it('3. builds NIC Schema v1.1 payload for inter-state invoice with IGST breakdown', async () => {
    const res = await request(app)
      .get(`/api/invoices/${interInvoice._id}/einvoice-json`)
      .set('Authorization', `Bearer ${auditorToken}`);

    expect(res.status).toBe(200);
    const payload = res.body;

    expect(payload.ValDtls.AssVal).toBe(15000);
    expect(payload.ValDtls.CgstVal).toBe(0);
    expect(payload.ValDtls.SgstVal).toBe(0);
    expect(payload.ValDtls.IgstVal).toBe(750);
    expect(payload.ValDtls.TotInvVal).toBe(15750);

    expect(payload.ItemList[0].IgstAmt).toBe(750);
    expect(payload.ItemList[0].CgstAmt).toBe(0);
    expect(payload.ItemList[0].SgstAmt).toBe(0);
    expect(payload.ItemList[0].GstRt).toBe(5);
  });

  it('4. verifies IRN generation is deterministic for identical company and invoice inputs', async () => {
    const inv1 = await Invoice.findById(intraInvoice._id);
    const irnFirst = inv1?.irn;

    // Re-run generateMockIRN
    const invSecond = await EInvoiceService.generateMockIRN(intraInvoice._id.toString());
    expect(invSecond.irn).toBe(irnFirst);
  });

  it('5. rejects mock IRN generation for a cancelled invoice with HTTP 400', async () => {
    const cancelledInvoice = await Invoice.create({
      tenantId: 'DEFAULT_TENANT',
      invoiceNumber: 'INV/2026-27/0009-CANCELLED',
      salesOrderId: intraInvoice.salesOrderId,
      customerId: intraInvoice.customerId,
      customerCode: 'RET-A',
      customerName: 'Retailer A',
      customerState: 'Tamil Nadu',
      customerStateCode: '33',
      factoryState: 'Tamil Nadu',
      placeOfSupply: 'Tamil Nadu',
      isInterState: false,
      items: intraInvoice.items,
      taxableValue: 7500,
      grandTotal: 7875,
      balanceDue: 0,
      paymentStatus: 'CANCELLED',
      isCancelled: true,
      cancellationReason: 'Order cancelled by customer',
      cancelledAt: new Date(),
      dueDate: new Date()
    });

    const res = await request(app)
      .post(`/api/invoices/${cancelledInvoice._id}/einvoice/generate-mock`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Cannot generate IRN for cancelled invoice/i);
  });

  it('6. enforces role-based access: auditor is read-only and cannot POST mock generation', async () => {
    const res = await request(app)
      .post(`/api/invoices/${interInvoice._id}/einvoice/generate-mock`)
      .set('Authorization', `Bearer ${auditorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/access denied/i);
  });
});
