import request from 'supertest';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedBenchmarkData } from '../src/scripts/seedBenchmark';
import { User, SalesOrder, Product, Customer, Invoice, CreditNote, AuditLog, StockMovement } from '../src/models';
import { generateToken } from '../src/middleware/auth.middleware';
import { ReportService } from '../src/services/report.service';

const app = createApp();

jest.setTimeout(180000);

describe('Step 5: Sales, Invoice, and Audit Completeness Acceptance Suite', () => {
  let adminToken: string;
  let salesmanToken: string;
  let adminUser: any;
  let productMurukku: any;
  let retailerA: any;

  beforeAll(async () => {
    await connectDB();
    await seedBenchmarkData();

    adminUser = await User.findOne({ username: 'factory_admin' });
    const salesmanUser = await User.findOne({ username: 'salesman_a' });
    adminToken = generateToken(adminUser!);
    salesmanToken = generateToken(salesmanUser!);

    productMurukku = await Product.findOne({ code: 'MUR-200G' });
    retailerA = await Customer.findOne({ code: 'RET-A' });
  }, 180000);

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Sales Order Edit (PUT /api/orders/:id)', () => {
    let orderId: string;

    beforeEach(async () => {
      // Place a fresh submitted order
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesmanToken}`)
        .send({
          customerId: retailerA._id.toString(),
          items: [{ productCode: productMurukku.code, quantity: 20, unitPrice: 50 }]
        });
      expect(res.status).toBe(201);
      orderId = res.body.order._id;
    });

    it('allows admin to edit quantities and prices on a SUBMITTED order and logs old/new in AuditLog', async () => {
      const editRes = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ productCode: productMurukku.code, quantity: 25, unitPrice: 55 }]
        });

      expect(editRes.status).toBe(200);
      expect(editRes.body.order.items[0].quantity).toBe(25);
      expect(editRes.body.order.items[0].unitPrice).toBe(55);
      expect(editRes.body.order.totalAmount).toBe(1375); // 25 * 55

      // Verify AuditLog captured the old vs new values
      const log = await AuditLog.findOne({
        action: 'SALES_ORDER_EDITED',
        entityId: editRes.body.order.orderNumber
      }).sort({ timestamp: -1 });

      expect(log).toBeDefined();
      expect(log?.performedBy).toBe(adminUser.name);
      expect(log?.details.oldItems[0].quantity).toBe(20);
      expect(log?.details.newItems[0].quantity).toBe(25);
      expect(log?.details.newTotalAmountPaise).toBe(137500);
    });

    it('rejects editing an order once it is approved and invoiced', async () => {
      // Approve order
      const approveRes = await request(app)
        .put(`/api/orders/${orderId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approverName: 'Admin Approver' });
      expect(approveRes.status).toBe(200);

      // Attempt edit
      const editRes = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ productCode: productMurukku.code, quantity: 30, unitPrice: 50 }]
        });

      expect(editRes.status).toBe(400);
      expect(editRes.body.error).toContain('ORDER_NOT_EDITABLE');
    });
  });

  describe('2. Partial Dispatch Flow', () => {
    let invoiceId: string;

    beforeEach(async () => {
      // Create and approve an order of 40 packets
      const createRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesmanToken}`)
        .send({
          customerId: retailerA._id.toString(),
          items: [{ productCode: productMurukku.code, quantity: 40, unitPrice: 50 }]
        });
      const orderId = createRes.body.order._id;

      const approveRes = await request(app)
        .put(`/api/orders/${orderId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approverName: 'Factory Admin' });

      invoiceId = approveRes.body.invoice._id;
    });

    it('supports partial dispatch: sets status PARTIALLY_DISPATCHED, then DISPATCHED on completion', async () => {
      // 1. First partial dispatch: 15 out of 40 packets
      const part1Res = await request(app)
        .post(`/api/invoices/${invoiceId}/dispatch`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dispatcherName: 'Floor Supervisor',
          items: [{ productId: productMurukku._id.toString(), dispatchQty: 15 }]
        });

      expect(part1Res.status).toBe(200);
      expect(part1Res.body.invoice.dispatchStatus).toBe('PARTIALLY_DISPATCHED');
      expect(part1Res.body.invoice.items[0].dispatchedQty).toBe(15);
      expect(part1Res.body.invoice.isDispatched).toBe(false);

      // 2. Second partial dispatch: remaining 25 packets
      const part2Res = await request(app)
        .post(`/api/invoices/${invoiceId}/dispatch`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dispatcherName: 'Floor Supervisor',
          items: [{ productId: productMurukku._id.toString(), dispatchQty: 25 }]
        });

      expect(part2Res.status).toBe(200);
      expect(part2Res.body.invoice.dispatchStatus).toBe('DISPATCHED');
      expect(part2Res.body.invoice.items[0].dispatchedQty).toBe(40);
      expect(part2Res.body.invoice.isDispatched).toBe(true);
    });
  });

  describe('3. Invoice Cancellation & Statutory Credit Note', () => {
    let invoiceId: string;
    let originalOutstanding: number;

    beforeEach(async () => {
      const custBefore = await Customer.findById(retailerA._id);
      originalOutstanding = custBefore?.outstandingBalancePaise || 0;

      const createRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesmanToken}`)
        .send({
          customerId: retailerA._id.toString(),
          items: [{ productCode: productMurukku.code, quantity: 10, unitPrice: 50 }]
        });
      const orderId = createRes.body.order._id;

      const approveRes = await request(app)
        .put(`/api/orders/${orderId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approverName: 'Admin' });

      invoiceId = approveRes.body.invoice._id;
    });

    it('requires a business reason to cancel an invoice and issue a credit note', async () => {
      const failRes = await request(app)
        .post(`/api/invoices/${invoiceId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: '' });

      expect(failRes.status).toBe(400);
      expect(failRes.body.error).toContain('CANCELLATION_REASON_REQUIRED');
    });

    it('cancels invoice, issues CreditNote CN/<FY>/<seq>, reverses GST outward, and restores receivables', async () => {
      // Dispatch 10 packets first
      await request(app)
        .post(`/api/invoices/${invoiceId}/dispatch`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dispatcherName: 'Dispatcher' });

      const stockBeforeCancel = (await Product.findById(productMurukku._id))?.currentStock || 0;

      const gstBefore = await ReportService.getGSTSummary();

      // Cancel invoice
      const cancelRes = await request(app)
        .post(`/api/invoices/${invoiceId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Retailer cancelled consignment due to transport delay' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.invoice.isCancelled).toBe(true);
      expect(cancelRes.body.invoice.creditNoteNumber).toMatch(/^CN\/\d{4}-\d{2}\/\d{4}$/);
      expect(cancelRes.body.creditNote.creditNoteNumber).toBe(cancelRes.body.invoice.creditNoteNumber);

      // Verify customer outstanding decreased back
      const custAfter = await Customer.findById(retailerA._id);
      expect(custAfter?.outstandingBalancePaise).toBe(originalOutstanding);

      // Verify finished goods stock was restored via SALES_RETURN
      const stockAfterCancel = (await Product.findById(productMurukku._id))?.currentStock || 0;
      expect(stockAfterCancel).toBe(stockBeforeCancel + 10);

      // Verify cancelled invoice is excluded from GST outward totals
      const gstAfter = await ReportService.getGSTSummary();
      expect(gstAfter.grandTotals.totalTaxable).toBeLessThan(gstBefore.grandTotals.totalTaxable);
    });
  });

  describe('4. AuditLog Append-Only Immutability', () => {
    it('strictly prohibits direct mutation or deletion of audit logs', async () => {
      const anyLog = await AuditLog.findOne();
      expect(anyLog).toBeDefined();

      await expect(
        AuditLog.updateOne({ _id: anyLog!._id }, { action: 'MUTATED_ACTION' })
      ).rejects.toThrow('IMMUTABLE_AUDIT_LOG_VIOLATION');

      await expect(
        AuditLog.deleteOne({ _id: anyLog!._id })
      ).rejects.toThrow('IMMUTABLE_AUDIT_LOG_VIOLATION');
    });
  });
});
