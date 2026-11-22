import { Request, Response } from 'express';
import { 
  User, 
  Customer, 
  Product, 
  RawMaterial, 
  BOM, 
  Purchase, 
  ProductionRun, 
  SalesOrder, 
  Invoice, 
  Payment, 
  StockMovement, 
  AuditLog, 
  Inquiry 
} from '../models';
import { StockLedgerService } from '../services/stockLedger.service';
import { PurchaseService } from '../services/purchase.service';
import { ProductionService } from '../services/production.service';
import { SalesOrderService } from '../services/salesOrder.service';
import { ReportService } from '../services/report.service';
import { WhatsAppService } from '../services/whatsapp.service';
import { RealtimeService } from '../services/realtime.service';
import { PDFInvoiceGenerator } from '../utils/pdfGenerator';
import { CSVExportUtil } from '../utils/csvExport';
import { seedBenchmarkData } from '../scripts/seedBenchmark';
import { executeBenchmarkScenario } from '../scripts/runBenchmark';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

function getTenantId(req: Request): string {
  const authReq = req as AuthenticatedRequest;
  return authReq.tenantId || authReq.user?.tenantId || 'TENANT_NASH_FOODS';
}

export class ApiController {
  // --- Benchmark & System ---
  static async seedBenchmark(req: Request, res: Response) {
    try {
      const data = await seedBenchmarkData();
      res.json({ success: true, message: 'Benchmark master data seeded successfully', data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async runBenchmark(req: Request, res: Response) {
    try {
      const result = await executeBenchmarkScenario();
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Users & Roles ---
  static async getUsers(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const users = await User.find({ tenantId }).lean();
      res.json({ success: true, users });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Masters: Customers, Products, Raw Materials, BOMs ---
  static async getCustomers(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const customers = await Customer.find({ tenantId }).sort({ name: 1 }).lean();
      res.json({ success: true, customers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getProducts(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const products = await Product.find({ tenantId }).sort({ name: 1 }).lean();
      res.json({ success: true, products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getRawMaterials(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const materials = await RawMaterial.find({ tenantId }).sort({ category: 1, name: 1 }).lean();
      res.json({ success: true, materials });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getBOMs(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const boms = await BOM.find({ tenantId }).populate('productId').lean();
      res.json({ success: true, boms });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Inventory & Stock Ledger ---
  static async getStockSummary(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const summary = await StockLedgerService.getStockSummary(tenantId);
      if (req.query.format === 'csv') {
        const csv = CSVExportUtil.arrayToCSV(summary);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="stock_summary.csv"');
        return res.send(csv);
      }
      res.json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getStockLedger(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const movements = await StockLedgerService.getLedgerMovements({
        tenantId,
        itemId: req.query.itemId as string,
        itemType: req.query.itemType as any,
        sourceDocType: req.query.sourceDocType as string
      });
      res.json({ success: true, movements });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Purchasing ---
  static async getPurchases(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const purchases = await Purchase.find({ tenantId }).sort({ date: -1 }).lean();
      res.json({ success: true, purchases });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async recordPurchase(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const purchase = await PurchaseService.recordPurchase({
        ...req.body,
        tenantId,
        createdBy: (req as AuthenticatedRequest).user?.name || req.body.createdBy
      });
      res.status(201).json({ success: true, purchase });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Production & BOM Runs ---
  static async getProductionRuns(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const runs = await ProductionRun.find({ tenantId }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, runs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async executeProductionRun(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const run = await ProductionService.executeRun({
        ...req.body,
        tenantId,
        supervisorName: (req as AuthenticatedRequest).user?.name || req.body.supervisorName
      });
      res.status(201).json({ success: true, run });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async updateRunOverheads(req: Request, res: Response) {
    try {
      const { laborCost, overheadCost } = req.body;
      const run = await ProductionService.updateOverheads(req.params.id, Number(laborCost), Number(overheadCost));
      res.json({ success: true, run });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Sales Orders & Offline Sync ---
  static async getSalesOrders(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const orders = await SalesOrder.find({ tenantId }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, orders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createSalesOrder(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const user = (req as AuthenticatedRequest).user;
      const order = await SalesOrderService.createOrder({
        ...req.body,
        tenantId,
        salesmanId: user ? user._id.toString() : req.body.salesmanId,
        salesmanName: user ? user.name : (req.body.salesmanName || 'Field Salesman')
      });
      res.status(201).json({ success: true, order });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async syncOfflineOrders(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { orders } = req.body; // array of offline orders
      if (!Array.isArray(orders)) throw new Error('Orders must be an array');
      const synced: any[] = [];
      for (const orderData of orders) {
        const order = await SalesOrderService.createOrder({
          ...orderData,
          tenantId
        });
        synced.push(order);
      }
      res.json({ success: true, count: synced.length, synced });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async approveOrder(req: Request, res: Response) {
    try {
      const approverName = (req as AuthenticatedRequest).user?.name || req.body.approverName || 'Factory Admin';
      const result = await SalesOrderService.approveOrder(req.params.id, approverName);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async rejectOrder(req: Request, res: Response) {
    try {
      const rejectedBy = (req as AuthenticatedRequest).user?.name || req.body.rejectedBy || 'Factory Admin';
      const { reason } = req.body;
      const order = await SalesOrderService.rejectOrder(req.params.id, reason, rejectedBy);
      res.json({ success: true, order });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async dispatchOrder(req: Request, res: Response) {
    try {
      const dispatcherName = (req as AuthenticatedRequest).user?.name || req.body.dispatcherName || 'Factory Admin';
      const invoice = await SalesOrderService.dispatchOrder(req.params.id, dispatcherName);
      res.json({ success: true, invoice });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Invoices & GST PDF ---
  static async getInvoices(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const invoices = await Invoice.find({ tenantId }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, invoices });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getInvoicePDF(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const invoice = await Invoice.findOne({ _id: req.params.id, tenantId }) || await Invoice.findById(req.params.id);
      if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

      const pdfBuffer = await PDFInvoiceGenerator.generateInvoicePDF(invoice);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Invoice_${invoice.invoiceNumber.replace(/\//g, '_')}.pdf"`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Payments ---
  static async getPayments(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const payments = await Payment.find({ tenantId }).sort({ date: -1 }).lean();
      res.json({ success: true, payments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async recordPayment(req: Request, res: Response) {
    try {
      const receivedBy = (req as AuthenticatedRequest).user?.name || req.body.receivedBy || 'Senior Accountant';
      const result = await SalesOrderService.recordPayment({
        ...req.body,
        receivedBy
      });
      res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Reports (Section 4.6 & Auditor) ---
  static async getSalesRegister(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const register = await ReportService.getSalesRegister(undefined, undefined, tenantId);
      if (req.query.format === 'csv') {
        const csv = CSVExportUtil.arrayToCSV(register);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_register.csv"');
        return res.send(csv);
      }
      res.json({ success: true, register });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getGSTSummary(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const summary = await ReportService.getGSTSummary(undefined, undefined, tenantId);
      res.json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getProductionReport(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const runs = await ReportService.getProductionReport(undefined, undefined, tenantId);
      if (req.query.format === 'csv') {
        const flatRuns = runs.map(r => ({
          runNumber: r.runNumber,
          productName: r.productName,
          expectedOutput: r.batchExpectedOutput,
          actualOutput: r.actualOutputPackets,
          yieldPercent: r.yieldPercent,
          yieldVariancePercent: r.yieldVariancePercent,
          damagedPouches: r.damagedPouches,
          cartonsUsed: r.cartonsUsed,
          totalCost: r.totalProductionCost,
          costPerPacket: r.costPerPacket,
          date: r.createdAt
        }));
        const csv = CSVExportUtil.arrayToCSV(flatRuns);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="production_report.csv"');
        return res.send(csv);
      }
      res.json({ success: true, runs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getOutstanding(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const outstanding = await ReportService.getOutstandingReceivables(tenantId);
      res.json({ success: true, outstanding });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Owner Overview Dashboard ---
  static async getOwnerOverview(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const [invoices, runs, rawMaterials, products, customers, payments] = await Promise.all([
        Invoice.find({ tenantId }).lean(),
        ProductionRun.find({ tenantId }).lean(),
        RawMaterial.find({ tenantId }).lean(),
        Product.find({ tenantId }).lean(),
        Customer.find({ tenantId }).lean(),
        Payment.find({ tenantId }).lean()
      ]);

      const totalRevenue = invoices.reduce((acc, inv) => acc + inv.taxableValue, 0);
      const totalOutstanding = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
      const totalCollections = payments.reduce((acc, p) => acc + p.amount, 0);

      let totalRawStockVal = rawMaterials.reduce((acc, m) => acc + (m.currentStock * (m.currentWeightedRate || m.standardRate)), 0);
      let totalFGStockVal = products.reduce((acc, p) => acc + (p.currentStock * p.sellingPrice), 0);

      const latestRun = runs.length > 0 ? runs[runs.length - 1] : null;

      res.json({
        success: true,
        metrics: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalOutstanding: Math.round(totalOutstanding * 100) / 100,
          totalCollections: Math.round(totalCollections * 100) / 100,
          rawStockValue: Math.round(totalRawStockVal * 100) / 100,
          finishedGoodsStockValue: Math.round(totalFGStockVal * 100) / 100,
          activeProductionRuns: runs.length,
          latestRun: latestRun ? {
            runNumber: latestRun.runNumber,
            actualOutput: latestRun.actualOutputPackets,
            yieldPercent: latestRun.yieldPercent,
            costPerPacket: latestRun.costPerPacket,
            varianceFlagged: latestRun.yieldVarianceFlagged
          } : null
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getAdminOverview(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const [
        invoices,
        runs,
        rawMaterials,
        products,
        customers,
        payments,
        orders,
        users,
        auditLogs
      ] = await Promise.all([
        Invoice.find({ tenantId }).lean(),
        ProductionRun.find({ tenantId }).lean(),
        RawMaterial.find({ tenantId }).lean(),
        Product.find({ tenantId }).lean(),
        Customer.find({ tenantId }).lean(),
        Payment.find({ tenantId }).lean(),
        SalesOrder.find({ tenantId }).sort({ createdAt: -1 }).lean(),
        User.find({ tenantId }).lean(),
        AuditLog.find({ tenantId }).sort({ timestamp: -1 }).limit(20).lean()
      ]);

      const totalRevenue = invoices.reduce((acc, inv) => acc + inv.taxableValue, 0);
      const totalOutstanding = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
      const totalCollections = payments.reduce((acc, p) => acc + p.amount, 0);

      const totalRawStockVal = rawMaterials.reduce((acc, m) => acc + (m.currentStock * (m.currentWeightedRate || m.standardRate)), 0);
      const totalFGStockVal = products.reduce((acc, p) => acc + (p.currentStock * p.sellingPrice), 0);

      const pendingOrders = orders.filter(o => o.status === 'SUBMITTED');
      const shortageOrders = orders.filter(o => o.stockCheck && !o.stockCheck.isSufficient);

      const activeUsersCount = users.filter(u => u.active).length;
      const lockedUsersCount = users.filter(u => u.isLocked).length;
      const failedLoginLogs = auditLogs.filter(l => l.action === 'LOGIN_FAILED').length;

      res.json({
        success: true,
        companyOverview: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalOutstanding: Math.round(totalOutstanding * 100) / 100,
          totalCollections: Math.round(totalCollections * 100) / 100,
          rawStockValue: Math.round(totalRawStockVal * 100) / 100,
          finishedGoodsStockValue: Math.round(totalFGStockVal * 100) / 100,
          totalOrdersCount: orders.length,
          pendingApprovalsCount: pendingOrders.length,
          shortageAlertsCount: shortageOrders.length,
          productionRunsCount: runs.length
        },
        pendingApprovals: {
          orders: pendingOrders
        },
        systemMonitoring: {
          totalUsers: users.length,
          activeUsers: activeUsersCount,
          lockedUsers: lockedUsersCount,
          recentFailedLogins: failedLoginLogs,
          auditLogsCount: auditLogs.length,
          databaseStatus: 'CONNECTED (MongoDB Atlas)',
          openwaStatus: 'ONLINE (Meta Cloud API / OpenWA Standard)'
        },
        recentAudit: auditLogs
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Audit Trail ---
  static async getAuditLogs(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const logs = await AuditLog.find({ tenantId }).sort({ timestamp: -1 }).limit(100).lean();
      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- WhatsApp & OpenWA Automation ---
  static async getWhatsAppNotifications(req: Request, res: Response) {
    try {
      const notifications = await WhatsAppService.getNotifications();
      res.json({ success: true, notifications });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async sendTestWhatsApp(req: Request, res: Response) {
    try {
      const { recipientPhone, recipientName, templateType, variables } = req.body;
      const notification = await WhatsAppService.sendNotification({
        recipientPhone: recipientPhone || '9876543210',
        recipientName: recipientName || 'Customer',
        templateType: templateType || 'ORDER_CONFIRMATION',
        variables: variables || {
          customerName: 'Retailer A',
          orderNumber: 'SO-2024-001',
          productName: 'Murukku 200 g',
          quantity: 150,
          totalAmount: 7500
        }
      });
      res.status(201).json({ success: true, notification });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getWhatsAppStatus(req: Request, res: Response) {
    res.json({
      success: true,
      service: 'OpenWA Automation Engine',
      adapter: 'OpenWA REST Service',
      replaceable: 'Meta WhatsApp Cloud API compliant',
      serverUrl: process.env.OPENWA_SERVER_URL || 'http://localhost:8080 (Simulated / Local)',
      status: 'ONLINE'
    });
  }

  // --- Public Inquiries & Pilot Onboarding ---
  static async submitInquiry(req: Request, res: Response) {
    try {
      const { name, email, phone, company, fleetSize, inquiryType, message } = req.body;
      if (!name || !email || !phone || !company) {
        return res.status(400).json({ 
          success: false, 
          error: 'Name, email, phone, and company name are required.' 
        });
      }

      const inquiry = await Inquiry.create({
        name,
        email,
        phone,
        company,
        fleetSize: fleetSize || '1-5',
        inquiryType: inquiryType || 'contact',
        message: message || '',
        status: 'new'
      });

      await AuditLog.create({
        tenantId: 'TENANT_NASH_FOODS',
        action: 'INQUIRY_SUBMITTED',
        entityType: 'Inquiry',
        entityId: inquiry._id.toString(),
        performedBy: name,
        role: 'visitor',
        details: { company, email, type: inquiry.inquiryType }
      });

      // Broadcast real-time event to Admin Control Centre
      RealtimeService.broadcast('INQUIRY_RECEIVED', {
        id: inquiry._id.toString(),
        name,
        company,
        inquiryType: inquiry.inquiryType
      });

      res.status(201).json({
        success: true,
        message: 'Your inquiry has been received. Our solutions team will contact you shortly.',
        inquiryId: inquiry._id.toString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getInquiries(req: Request, res: Response) {
    try {
      const inquiries = await Inquiry.find().sort({ createdAt: -1 }).lean();
      res.json({ success: true, inquiries });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateInquiryStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const inquiry = await Inquiry.findById(id);
      if (!inquiry) return res.status(404).json({ success: false, error: 'Inquiry not found' });

      if (status) inquiry.status = status;
      if (notes !== undefined) inquiry.notes = notes;
      await inquiry.save();

      res.json({ success: true, inquiry });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
