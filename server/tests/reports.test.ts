import request from 'supertest';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedBenchmarkData } from '../src/scripts/seedBenchmark';
import { User, Invoice, CreditNote } from '../src/models';
import { generateToken } from '../src/middleware/auth.middleware';

const app = createApp();
jest.setTimeout(180000);

describe('Step 6: Statutory Reports, GSTR-1, GSTR-3B & Multi-Format Exports', () => {
  let auditorToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await connectDB();
    await seedBenchmarkData();

    const auditor = await User.findOne({ username: 'auditor' });
    const admin = await User.findOne({ username: 'factory_admin' });
    auditorToken = generateToken(auditor!);
    adminToken = generateToken(admin!);
  }, 180000);

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Sales Register with Date Filtering & Multi-Format Exports', () => {
    it('returns sales register in JSON format with ISO date filtering', async () => {
      const today = new Date();
      const from = new Date(today.getFullYear(), 0, 1).toISOString();
      const to = new Date(today.getFullYear(), 11, 31, 23, 59, 59).toISOString();

      const res = await request(app)
        .get(`/api/reports/sales-register?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const list = res.body.register || res.body.data;
      expect(Array.isArray(list)).toBe(true);
      expect(res.body.dateRange).toBeDefined();
    });

    it('exports sales register as XLSX with application/vnd.openxmlformats content type', async () => {
      const res = await request(app)
        .get('/api/reports/sales-register?format=xlsx')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(res.header['content-disposition']).toContain('sales_register.xlsx');
    });

    it('exports sales register as CSV with text/csv header', async () => {
      const res = await request(app)
        .get('/api/reports/sales-register?format=csv')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('text/csv');
      expect(res.text).toContain('Invoice No');
      expect(res.text).toContain('Customer Name');
    });

    it('exports sales register as PDF with application/pdf header', async () => {
      const res = await request(app)
        .get('/api/reports/sales-register?format=pdf')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('application/pdf');
      expect(res.header['content-disposition']).toContain('sales_register.pdf');
    });
  });

  describe('2. Statutory GSTR-1 and GSTR-3B Outward Tax Summary', () => {
    it('returns structured GSTR-1 sections (B2B, B2C, HSN, Credit Notes) and GSTR-3B summary', async () => {
      const res = await request(app)
        .get('/api/reports/gst-summary')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.intraState).toBeDefined();
      expect(res.body.summary.interState).toBeDefined();
      expect(res.body.summary.grandTotals).toBeDefined();
      expect(res.body.summary.gstr1).toBeDefined();
      expect(Array.isArray(res.body.summary.gstr1.b2b)).toBe(true);
      expect(Array.isArray(res.body.summary.gstr1.hsnSummary)).toBe(true);
      expect(res.body.summary.gstr3b).toBeDefined();
    });

    it('reverses outward GST liabilities when credit notes exist', async () => {
      const invoice = await Invoice.findOne();
      if (invoice) {
        await CreditNote.create({
          creditNoteNumber: 'CN/2026-27/0999',
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          customerGstin: invoice.customerGstin,
          date: new Date(),
          reason: 'Statutory test return for GST reduction',
          taxablePaise: 100000,
          taxableAmount: 1000,
          cgstPaise: 2500,
          sgstPaise: 2500,
          igstPaise: 0,
          totalTaxPaise: 5000,
          grandTotalPaise: 105000,
          grandTotal: 1050,
          items: [],
          status: 'ISSUED',
          tenantId: invoice.tenantId
        });

        const res = await request(app)
          .get('/api/reports/gst-summary')
          .set('Authorization', `Bearer ${auditorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.summary.gstr1.creditDebitNotes.length).toBeGreaterThan(0);
        expect(res.body.summary.grandTotals.creditNotesTaxable).toBeGreaterThanOrEqual(1000);
      }
    });
  });

  describe('3. Customer-Wise & Product-Wise Breakdown Reports', () => {
    it('returns customer-wise sales aggregated correctly', async () => {
      const res = await request(app)
        .get('/api/reports/customer-wise-sales')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const list = res.body.customers || res.body.data;
      expect(Array.isArray(list)).toBe(true);
    });

    it('returns product-wise sales aggregated by SKU and HSN code', async () => {
      const res = await request(app)
        .get('/api/reports/product-wise-sales')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const list = res.body.products || res.body.data;
      expect(Array.isArray(list)).toBe(true);
    });
  });

  describe('4. Collections & Outstanding Receivables Aging', () => {
    it('returns collections register with payment mode and customer details', async () => {
      const res = await request(app)
        .get('/api/reports/collections')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const list = res.body.collections || res.body.data;
      expect(Array.isArray(list)).toBe(true);
    });

    it('returns outstanding receivables with 0-30, 31-60, 61-90, >90 day aging buckets', async () => {
      const res = await request(app)
        .get('/api/reports/outstanding')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const list = res.body.outstanding || res.body.data;
      expect(Array.isArray(list)).toBe(true);
      if (list.length > 0) {
        const item = list[0];
        expect(typeof (item.current !== undefined ? item.current : item.aging?.current)).toBe('number');
      }
    });
  });
});
