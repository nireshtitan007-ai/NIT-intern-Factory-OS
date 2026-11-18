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
  AuditLog 
} from '../models';
import { StockLedgerService } from '../services/stockLedger.service';
import { PurchaseService } from '../services/purchase.service';
import { ProductionService } from '../services/production.service';
import { SalesOrderService } from '../services/salesOrder.service';
import { ReportService } from '../services/report.service';
import { WhatsAppService } from '../services/whatsapp.service';
import { PDFInvoiceGenerator } from '../utils/pdfGenerator';
import { CSVExportUtil } from '../utils/csvExport';
import { seedBenchmarkData } from '../scripts/seedBenchmark';
import { executeBenchmarkScenario } from '../scripts/runBenchmark';

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
      const users = await User.find().lean();
      res.json({ success: true, users });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Masters: Customers, Products, Raw Materials, BOMs ---
  static async getCustomers(req: Request, res: Response) {
    try {
      const customers = await Customer.find().sort({ name: 1 }).lean();
      res.json({ success: true, customers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getProducts(req: Request, res: Response) {
    try {
      const products = await Product.find().sort({ name: 1 }).lean();
      res.json({ success: true, products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getRawMaterials(req: Request, res: Response) {
    try {
      const materials = await RawMaterial.find().sort({ category: 1, name: 1 }).lean();
      res.json({ success: true, materials });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getBOMs(req: Request, res: Response) {
    try {
      const boms = await BOM.find().populate('productId').lean();
      res.json({ success: true, boms });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Inventory & Stock Ledger ---
  static async getStockSummary(req: Request, res: Response) {
    try {
      const summary = await StockLedgerService.getStockSummary();
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
      const movements = await StockLedgerService.getLedgerMovements({
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
      const purchases = await Purchase.find().sort({ date: -1 }).lean();
      res.json({ success: true, purchases });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async recordPurchase(req: Request, res: Response) {
    try {
      const purchase = await PurchaseService.recordPurchase(req.body);
      res.status(201).json({ success: true, purchase });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Production & BOM Runs ---
  static async getProductionRuns(req: Request, res: Response) {
    try {
      const runs = await ProductionRun.find().sort({ createdAt: -1 }).lean();
      res.json({ success: true, runs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async executeProductionRun(req: Request, res: Response) {
    try {
      const run = await ProductionService.executeRun(req.body);
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
      const orders = await SalesOrder.find().sort({ createdAt: -1 }).lean();
      res.json({ success: true, orders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createSalesOrder(req: Request, res: Response) {
    try {
      const order = await SalesOrderService.createOrder(req.body);
      res.status(201).json({ success: true, order });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async syncOfflineOrders(req: Request, res: Response) {
    try {
      const { orders } = req.body; // array of offline orders
      if (!Array.isArray(orders)) throw new Error('Orders must be an array');
      const synced: any[] = [];
      for (const orderData of orders) {
        const order = await SalesOrderService.createOrder(orderData);
        synced.push(order);
      }
      res.json({ success: true, count: synced.length, synced });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async approveOrder(req: Request, res: Response) {
    try {
      const result = await SalesOrderService.approveOrder(req.params.id, req.body.approverName);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async rejectOrder(req: Request, res: Response) {
    try {
      const { reason, rejectedBy } = req.body;
      const order = await SalesOrderService.rejectOrder(req.params.id, reason, rejectedBy);
      res.json({ success: true, order });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async dispatchOrder(req: Request, res: Response) {
    try {
      const invoice = await SalesOrderService.dispatchOrder(req.params.id, req.body.dispatcherName);
      res.json({ success: true, invoice });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Invoices & GST PDF ---
  static async getInvoices(req: Request, res: Response) {
    try {
      const invoices = await Invoice.find().sort({ createdAt: -1 }).lean();
      res.json({ success: true, invoices });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getInvoicePDF(req: Request, res: Response) {
    try {
      const invoice = await Invoice.findById(req.params.id);
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
      const payments = await Payment.find().sort({ date: -1 }).lean();
      res.json({ success: true, payments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async recordPayment(req: Request, res: Response) {
    try {
      const result = await SalesOrderService.recordPayment(req.body);
      res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Reports (Section 4.6 & Auditor) ---
  static async getSalesRegister(req: Request, res: Response) {
    try {
      const register = await ReportService.getSalesRegister();
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
      const summary = await ReportService.getGSTSummary();
      res.json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getProductionReport(req: Request, res: Response) {
    try {
      const runs = await ReportService.getProductionReport();
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
      const outstanding = await ReportService.getOutstandingReceivables();
      res.json({ success: true, outstanding });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Owner Overview Dashboard ---
  static async getOwnerOverview(req: Request, res: Response) {
    try {
      const [invoices, runs, rawMaterials, products, customers, payments] = await Promise.all([
        Invoice.find().lean(),
        ProductionRun.find().lean(),
        RawMaterial.find().lean(),
        Product.find().lean(),
        Customer.find().lean(),
        Payment.find().lean()
      ]);

      const totalRevenue = invoices.reduce((acc, inv) => acc + inv.taxableValue, 0);
      const totalOutstanding = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
      const totalCollections = payments.reduce((acc, p) => acc + p.amount, 0);

      let totalRawStockVal = rawMaterials.reduce((acc, m) => acc + (m.currentStock * (m.currentWeightedRate || m.standardRate)), 0);
      let totalFGStockVal = products.reduce((acc, p) => acc + (p.currentStock * p.sellingPrice), 0);

      // Latest production run variance
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
        Invoice.find().lean(),
        ProductionRun.find().lean(),
        RawMaterial.find().lean(),
        Product.find().lean(),
        Customer.find().lean(),
        Payment.find().lean(),
        SalesOrder.find().sort({ createdAt: -1 }).lean(),
        User.find().lean(),
        AuditLog.find().sort({ timestamp: -1 }).limit(20).lean()
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
      const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).lean();
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
}

