import request from 'supertest';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedBenchmarkData } from '../src/scripts/seedBenchmark';
import { User } from '../src/models';
import { generateToken } from '../src/middleware/auth.middleware';
import { TallyExportUtil } from '../src/utils/tallyExport';
import { IInvoice } from '../src/models/Invoice';
import mongoose from 'mongoose';

const app = createApp();
jest.setTimeout(180000);

describe('Step 6: Tally XML Sales Vouchers Export & Accounting Invariants', () => {
  let seededData: any;
  let adminToken: string;
  let auditorToken: string;
  let salesmanToken: string;

  beforeAll(async () => {
    await connectDB();
    seededData = await seedBenchmarkData();

    const admin = await User.findOne({ username: 'factory_admin' });
    const auditor = await User.findOne({ username: 'auditor' });
    const salesman = await User.findOne({ username: 'salesman_a' });

    adminToken = generateToken(admin!);
    auditorToken = generateToken(auditor!);
    salesmanToken = generateToken(salesman!);
  }, 180000);

  afterAll(async () => {
    await disconnectDB();
  });

  describe('TallyExportUtil Unit Tests & Invariants', () => {
    it('generates valid Tally ERP / Tally Prime XML structure for intra-state invoice', () => {
      const mockInvoice = {
        _id: new mongoose.Types.ObjectId(),
        invoiceNumber: 'INV/2026-27/0103',
        customerName: 'Retailer A & Co',
        createdAt: new Date('2026-04-01T10:00:00Z'),
        isInterState: false,
        taxableValuePaise: 750000, // ₹7,500.00
        cgstTotalPaise: 18750,    // ₹187.50
        sgstTotalPaise: 18750,    // ₹187.50
        igstTotalPaise: 0,
        grandTotalPaise: 787500    // ₹7,875.00
      } as unknown as IInvoice;

      const xml = TallyExportUtil.generateSalesVouchersXml([mockInvoice]);

      expect(xml).toContain('<ENVELOPE>');
      expect(xml).toContain('<TALLYREQUEST>Import Data</TALLYREQUEST>');
      expect(xml).toContain('<VOUCHER VCHTYPE="Sales" ACTION="Create"');
      expect(xml).toContain('<DATE>20260401</DATE>');
      expect(xml).toContain('<VOUCHERNUMBER>INV/2026-27/0103</VOUCHERNUMBER>');
      expect(xml).toContain('<PARTYLEDGERNAME>Retailer A &amp; Co</PARTYLEDGERNAME>');

      // Verify Debit to Party Ledger
      expect(xml).toContain('<LEDGERNAME>Retailer A &amp; Co</LEDGERNAME>');
      expect(xml).toContain('<ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>');
      expect(xml).toContain('<AMOUNT>-7875.00</AMOUNT>');

      // Verify Credit to Sales & Tax Ledgers
      expect(xml).toContain('<LEDGERNAME>Sales Account</LEDGERNAME>');
      expect(xml).toContain('<AMOUNT>7500.00</AMOUNT>');
      expect(xml).toContain('<LEDGERNAME>Output CGST</LEDGERNAME>');
      expect(xml).toContain('<AMOUNT>187.50</AMOUNT>');
      expect(xml).toContain('<LEDGERNAME>Output SGST</LEDGERNAME>');
      expect(xml).toContain('<AMOUNT>187.50</AMOUNT>');

      // Accounting balance check: -7875 + 7500 + 187.50 + 187.50 = 0
      const amounts = Array.from(xml.matchAll(/<AMOUNT>(-?[\d\.]+)<\/AMOUNT>/g)).map(m => parseFloat(m[1]));
      const sum = amounts.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum)).toBeLessThan(0.0001);
    });

    it('generates valid Tally XML for inter-state invoice with IGST ledger', () => {
      const mockInvoice = {
        _id: new mongoose.Types.ObjectId(),
        invoiceNumber: 'INV/2026-27/0104',
        customerName: 'Distributor B (Kerala)',
        createdAt: new Date('2026-04-02T12:00:00Z'),
        isInterState: true,
        taxableValuePaise: 600000, // ₹6,000.00
        cgstTotalPaise: 0,
        sgstTotalPaise: 0,
        igstTotalPaise: 30000,    // ₹300.00 (5% IGST)
        grandTotalPaise: 630000    // ₹6,300.00
      } as unknown as IInvoice;

      const xml = TallyExportUtil.generateSalesVouchersXml([mockInvoice]);

      expect(xml).toContain('<LEDGERNAME>Output IGST</LEDGERNAME>');
      expect(xml).toContain('<AMOUNT>300.00</AMOUNT>');
      expect(xml).not.toContain('<LEDGERNAME>Output CGST</LEDGERNAME>');
      expect(xml).not.toContain('<LEDGERNAME>Output SGST</LEDGERNAME>');

      // Accounting balance check: -6300 + 6000 + 300 = 0
      const amounts = Array.from(xml.matchAll(/<AMOUNT>(-?[\d\.]+)<\/AMOUNT>/g)).map(m => parseFloat(m[1]));
      const sum = amounts.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum)).toBeLessThan(0.0001);
    });
  });

  describe('GET /api/reports/tally-sales-vouchers HTTP Endpoint & RBAC', () => {
    it('allows Auditor to export Tally XML sales vouchers', async () => {
      const res = await request(app)
        .get('/api/reports/tally-sales-vouchers')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('xml');
      expect(res.headers['content-disposition']).toContain('tally_sales_vouchers.xml');
      expect(res.text).toContain('<ENVELOPE>');
      expect(res.text).toContain('<TALLYREQUEST>Import Data</TALLYREQUEST>');
    });

    it('allows Admin to export Tally XML sales vouchers', async () => {
      const res = await request(app)
        .get('/api/reports/tally-sales-vouchers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.text).toContain('<ENVELOPE>');
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/reports/tally-sales-vouchers');
      expect(res.status).toBe(401);
    });

    it('rejects Salesman from accessing Tally XML export with 403', async () => {
      const res = await request(app)
        .get('/api/reports/tally-sales-vouchers')
        .set('Authorization', `Bearer ${salesmanToken}`);

      expect(res.status).toBe(403);
    });
  });
});
