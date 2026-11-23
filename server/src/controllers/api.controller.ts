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
  Inquiry,
  Supplier 
} from '../models';
import { StockLedgerService } from '../services/stockLedger.service';
import { PurchaseService } from '../services/purchase.service';
import { ProductionService } from '../services/production.service';
import { SalesOrderService } from '../services/salesOrder.service';
import { ReportService } from '../services/report.service';
import { WhatsAppService } from '../services/whatsapp.service';
import { RealtimeService } from '../services/realtime.service';
import { EInvoiceService } from '../services/einvoice.service';
import { PDFInvoiceGenerator } from '../utils/pdfGenerator';
import { CSVExportUtil } from '../utils/csvExport';
import { seedBenchmarkData } from '../scripts/seedBenchmark';
import { executeBenchmarkScenario } from '../scripts/runBenchmark';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Serializers } from '../utils/serializers';
import { ReportExporter, ReportColumnDef } from '../utils/reportExporter';
import { paiseToRupees } from '../utils/money';
import { TallyExportUtil } from '../utils/tallyExport';

function parseDateRange(req: Request): { from?: Date; to?: Date } {
  let from: Date | undefined;
  let to: Date | undefined;
  if (req.query.from) {
    from = new Date(req.query.from as string);
    if (isNaN(from.getTime())) throw new Error('INVALID_DATE: "from" parameter must be a valid ISO date.');
  }
  if (req.query.to) {
    to = new Date(req.query.to as string);
    if (isNaN(to.getTime())) throw new Error('INVALID_DATE: "to" parameter must be a valid ISO date.');
  }
  return { from, to };
}

function getTenantId(req: Request): string {
  const authReq = req as AuthenticatedRequest;
  return authReq.tenantId || authReq.user?.tenantId || process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT';
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

  // --- Masters: Customers, Products, Raw Materials, BOMs, Suppliers ---
  static async getCustomers(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const query: any = { tenantId };
      if (req.query.includeInactive !== 'true') query.active = { $ne: false };
      const customers = await Customer.find(query).sort({ name: 1 }).lean();
      res.json({ success: true, customers: customers.map(c => Serializers.serializeCustomer(c)) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createCustomer(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const code = req.body.code.toUpperCase();
      const existing = await Customer.findOne({ tenantId, code });
      if (existing) return res.status(400).json({ success: false, error: `Customer code ${code} already exists.` });

      const priceList = (req.body.priceList || []).map((p: any) => ({
        productCode: p.productCode.toUpperCase(),
        unitPrice: p.unitPrice,
        unitPricePaise: Math.round(p.unitPrice * 100)
      }));

      const customer = await Customer.create({
        ...req.body,
        code,
        priceList,
        tenantId,
        creditLimit: req.body.creditLimit ?? 50000,
        creditLimitPaise: Math.round((req.body.creditLimit ?? 50000) * 100),
        active: true
      });

      await AuditLog.create({
        tenantId,
        action: 'CREATE',
        entityType: 'Customer',
        entityId: customer._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: { code: customer.code, name: customer.name, type: customer.type }
      });

      res.status(201).json({ success: true, customer: Serializers.serializeCustomer(customer) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async updateCustomer(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const updates = { ...req.body };
      if (updates.code) updates.code = updates.code.toUpperCase();
      if (updates.creditLimit !== undefined) {
        updates.creditLimitPaise = Math.round(updates.creditLimit * 100);
      }
      if (updates.priceList) {
        updates.priceList = updates.priceList.map((p: any) => ({
          productCode: p.productCode.toUpperCase(),
          unitPrice: p.unitPrice,
          unitPricePaise: Math.round(p.unitPrice * 100)
        }));
      }

      const customer = await Customer.findOneAndUpdate({ _id: req.params.id, tenantId }, updates, { new: true });
      if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });

      await AuditLog.create({
        tenantId,
        action: 'UPDATE',
        entityType: 'Customer',
        entityId: customer._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: updates
      });

      res.json({ success: true, customer: Serializers.serializeCustomer(customer) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async deleteCustomer(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const customer = await Customer.findOneAndUpdate({ _id: req.params.id, tenantId }, { active: false }, { new: true });
      if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });

      await AuditLog.create({
        tenantId,
        action: 'SOFT_DELETE',
        entityType: 'Customer',
        entityId: customer._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: { active: false }
      });

      res.json({ success: true, message: 'Customer deactivated successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getProducts(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const query: any = { tenantId };
      if (req.query.includeInactive !== 'true') query.active = { $ne: false };
      const products = await Product.find(query).sort({ name: 1 }).lean();
      res.json({ success: true, products: products.map(p => Serializers.serializeProduct(p)) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createProduct(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const code = req.body.code.toUpperCase();
      const existing = await Product.findOne({ tenantId, code });
      if (existing) return res.status(400).json({ success: false, error: `Product code ${code} already exists.` });

      const sellingPricePaise = Math.round(req.body.sellingPrice * 100);
      const product = await Product.create({
        ...req.body,
        code,
        tenantId,
        sellingPricePaise,
        active: true
      });

      await AuditLog.create({
        tenantId,
        action: 'CREATE',
        entityType: 'Product',
        entityId: product._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: { code: product.code, name: product.name, sellingPrice: product.sellingPrice }
      });

      res.status(201).json({ success: true, product: Serializers.serializeProduct(product) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async updateProduct(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const updates = { ...req.body };
      if (updates.code) updates.code = updates.code.toUpperCase();
      if (updates.sellingPrice !== undefined) {
        updates.sellingPricePaise = Math.round(updates.sellingPrice * 100);
      }

      const product = await Product.findOneAndUpdate({ _id: req.params.id, tenantId }, updates, { new: true });
      if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

      await AuditLog.create({
        tenantId,
        action: 'UPDATE',
        entityType: 'Product',
        entityId: product._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: updates
      });

      res.json({ success: true, product: Serializers.serializeProduct(product) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async deleteProduct(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const product = await Product.findOneAndUpdate({ _id: req.params.id, tenantId }, { active: false }, { new: true });
      if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

      await AuditLog.create({
        tenantId,
        action: 'SOFT_DELETE',
        entityType: 'Product',
        entityId: product._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: { active: false }
      });

      res.json({ success: true, message: 'Product deactivated successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getRawMaterials(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const query: any = { tenantId };
      if (req.query.includeInactive !== 'true') query.active = { $ne: false };
      const materials = await RawMaterial.find(query).sort({ category: 1, name: 1 }).lean();
      res.json({ success: true, materials: materials.map(m => Serializers.serializeRawMaterial(m)) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createRawMaterial(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const code = req.body.code.toUpperCase();
      const existing = await RawMaterial.findOne({ tenantId, code });
      if (existing) return res.status(400).json({ success: false, error: `Material code ${code} already exists.` });

      const standardRatePaise = Math.round(req.body.standardRate * 100);
      const material = await RawMaterial.create({
        ...req.body,
        code,
        tenantId,
        standardRatePaise,
        currentWeightedRate: req.body.standardRate,
        currentWeightedRatePaise: standardRatePaise,
        currentStock: 0,
        openingStock: 0,
        totalValuePaise: 0,
        active: true
      });

      await AuditLog.create({
        tenantId,
        action: 'CREATE',
        entityType: 'RawMaterial',
        entityId: material._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: { code: material.code, name: material.name, category: material.category }
      });

      res.status(201).json({ success: true, material: Serializers.serializeRawMaterial(material) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async updateRawMaterial(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const updates = { ...req.body };
      if (updates.code) updates.code = updates.code.toUpperCase();
      if (updates.standardRate !== undefined) {
        updates.standardRatePaise = Math.round(updates.standardRate * 100);
      }

      const material = await RawMaterial.findOneAndUpdate({ _id: req.params.id, tenantId }, updates, { new: true });
      if (!material) return res.status(404).json({ success: false, error: 'Raw material not found' });

      await AuditLog.create({
        tenantId,
        action: 'UPDATE',
        entityType: 'RawMaterial',
        entityId: material._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: updates
      });

      res.json({ success: true, material: Serializers.serializeRawMaterial(material) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async deleteRawMaterial(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const material = await RawMaterial.findOneAndUpdate({ _id: req.params.id, tenantId }, { active: false }, { new: true });
      if (!material) return res.status(404).json({ success: false, error: 'Raw material not found' });

      await AuditLog.create({
        tenantId,
        action: 'SOFT_DELETE',
        entityType: 'RawMaterial',
        entityId: material._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: { active: false }
      });

      res.json({ success: true, message: 'Raw material deactivated successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getBOMs(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const query: any = { tenantId };
      if (req.query.includeInactive !== 'true') query.active = { $ne: false };
      const boms = await BOM.find(query).populate('productId').lean();
      res.json({ success: true, boms });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createBOM(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const product = await Product.findById(req.body.productId);
      if (!product) return res.status(400).json({ success: false, error: 'Product not found for BOM' });

      const bom = await BOM.create({
        ...req.body,
        tenantId,
        productCode: product.code,
        productName: product.name,
        active: true
      });

      await AuditLog.create({
        tenantId,
        action: 'CREATE',
        entityType: 'BOM',
        entityId: bom._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: { productCode: product.code, productName: product.name }
      });

      res.status(201).json({ success: true, bom });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async updateBOM(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const bom = await BOM.findOneAndUpdate({ _id: req.params.id, tenantId }, req.body, { new: true });
      if (!bom) return res.status(404).json({ success: false, error: 'BOM not found' });

      await AuditLog.create({
        tenantId,
        action: 'UPDATE',
        entityType: 'BOM',
        entityId: bom._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: req.body
      });

      res.json({ success: true, bom });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async deleteBOM(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const bom = await BOM.findOneAndUpdate({ _id: req.params.id, tenantId }, { active: false }, { new: true });
      if (!bom) return res.status(404).json({ success: false, error: 'BOM not found' });

      await AuditLog.create({
        tenantId,
        action: 'SOFT_DELETE',
        entityType: 'BOM',
        entityId: bom._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: { active: false }
      });

      res.json({ success: true, message: 'BOM deactivated successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Suppliers ---
  static async getSuppliers(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const query: any = { tenantId };
      if (req.query.includeInactive !== 'true') query.active = { $ne: false };
      const suppliers = await Supplier.find(query).sort({ name: 1 }).lean();
      res.json({ success: true, suppliers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createSupplier(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const code = req.body.code.toUpperCase();
      const existing = await Supplier.findOne({ tenantId, code });
      if (existing) return res.status(400).json({ success: false, error: `Supplier code ${code} already exists.` });

      const supplier = await Supplier.create({
        ...req.body,
        code,
        tenantId,
        active: true
      });

      await AuditLog.create({
        tenantId,
        action: 'CREATE',
        entityType: 'Supplier',
        entityId: supplier._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: { code: supplier.code, name: supplier.name }
      });

      res.status(201).json({ success: true, supplier });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async updateSupplier(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const updates = { ...req.body };
      if (updates.code) updates.code = updates.code.toUpperCase();

      const supplier = await Supplier.findOneAndUpdate({ _id: req.params.id, tenantId }, updates, { new: true });
      if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });

      await AuditLog.create({
        tenantId,
        action: 'UPDATE',
        entityType: 'Supplier',
        entityId: supplier._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: updates
      });

      res.json({ success: true, supplier });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async deleteSupplier(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const authReq = req as AuthenticatedRequest;
      const supplier = await Supplier.findOneAndUpdate({ _id: req.params.id, tenantId }, { active: false }, { new: true });
      if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });

      await AuditLog.create({
        tenantId,
        action: 'SOFT_DELETE',
        entityType: 'Supplier',
        entityId: supplier._id.toString(),
        performedBy: authReq.user?.username || 'ADMIN',
        role: authReq.user?.role || 'admin',
        details: { active: false }
      });

      res.json({ success: true, message: 'Supplier deactivated successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Low-Stock Reorder Alerts ---
  static async getReorderAlerts(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const materials = await RawMaterial.find({
        tenantId,
        active: { $ne: false },
        $expr: { $lte: ['$currentStock', '$reorderLevel'] }
      }).lean();

      res.json({
        success: true,
        alerts: materials.map(m => ({
          materialId: m._id,
          code: m.code,
          name: m.name,
          category: m.category,
          currentStock: m.currentStock,
          reorderLevel: m.reorderLevel,
          unit: m.unit,
          shortage: Math.max(0, m.reorderLevel - m.currentStock)
        }))
      });
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
      res.json({ success: true, movements: movements.map(m => Serializers.serializeStockMovement(m)) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async reconcileInventory(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const report = await StockLedgerService.reconcileInventory(tenantId);
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Purchasing ---
  static async getPurchases(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const purchases = await Purchase.find({ tenantId }).sort({ date: -1 }).lean();
      res.json({ success: true, purchases: purchases.map(p => Serializers.serializePurchase(p)) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async recordPurchase(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const user = (req as AuthenticatedRequest).user;
      const purchase = await PurchaseService.recordPurchase({
        ...req.body,
        tenantId,
        createdBy: user?.name || user?.username || req.body.createdBy,
        userRole: user?.role
      });
      res.status(201).json({ success: true, purchase: Serializers.serializePurchase(purchase) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Production & BOM Runs ---
  static async getProductionRuns(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const runs = await ProductionRun.find({ tenantId }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, runs: runs.map(r => Serializers.serializeProductionRun(r)) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getProductionPlan(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const plan = await ProductionService.getProductionPlan(tenantId);
      res.json({ success: true, plan });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async executeProductionRun(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const user = (req as AuthenticatedRequest).user;
      const run = await ProductionService.executeRun({
        ...req.body,
        tenantId,
        supervisorName: user?.name || user?.username || req.body.supervisorName,
        userRole: user?.role
      });
      res.status(201).json({ success: true, run: Serializers.serializeProductionRun(run) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async updateRunOverheads(req: Request, res: Response) {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { laborCost, overheadCost } = req.body;
      const run = await ProductionService.updateOverheads(
        req.params.id, 
        Number(laborCost), 
        Number(overheadCost),
        user?.name || user?.username || 'Factory Admin',
        user?.role || 'admin'
      );
      res.json({ success: true, run: Serializers.serializeProductionRun(run) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Sales Orders & Offline Sync ---
  static async getMySalesSummary(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const query = { tenantId, salesmanId: user._id.toString() };
      const orders = await SalesOrder.find(query).sort({ createdAt: -1 }).lean();

      const statusCounts: Record<string, number> = {
        SUBMITTED: 0,
        APPROVED: 0,
        INVOICED: 0,
        DISPATCHED: 0,
        REJECTED: 0
      };

      let totalSalesPaise = 0;
      const customerMap = new Map<string, { customerId: string; customerCode: string; customerName: string; orderCount: number; totalAmountPaise: number }>();

      for (const order of orders) {
        const status = order.status || 'SUBMITTED';
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        const orderAmountPaise = order.totalAmountPaise ?? Math.round((order.totalAmount || 0) * 100);
        totalSalesPaise += orderAmountPaise;

        const custId = order.customerId ? order.customerId.toString() : order.customerCode;
        if (!customerMap.has(custId)) {
          customerMap.set(custId, {
            customerId: custId,
            customerCode: order.customerCode,
            customerName: order.customerName,
            orderCount: 0,
            totalAmountPaise: 0
          });
        }
        const custEntry = customerMap.get(custId)!;
        custEntry.orderCount += 1;
        custEntry.totalAmountPaise += orderAmountPaise;
      }

      const customerTotals = Array.from(customerMap.values()).map(c => ({
        ...c,
        totalAmount: paiseToRupees(c.totalAmountPaise)
      })).sort((a, b) => b.totalAmountPaise - a.totalAmountPaise);

      res.json({
        success: true,
        summary: {
          salesmanName: user.name,
          salesmanRole: user.role,
          totalOrders: orders.length,
          totalSalesPaise,
          totalSales: paiseToRupees(totalSalesPaise),
          statusCounts,
          customerTotals,
          recentOrders: orders.slice(0, 5).map(o => Serializers.serializeSalesOrder(o))
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getSalesOrders(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const user = (req as AuthenticatedRequest).user;
      const query: any = { tenantId };
      if (user && (user.role === 'salesman' || user.role === 'sales_manager')) {
        query.salesmanId = user._id.toString();
      }
      const orders = await SalesOrder.find(query).sort({ createdAt: -1 }).lean();
      res.json({ success: true, orders: orders.map(o => Serializers.serializeSalesOrder(o)) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createSalesOrder(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const order = await SalesOrderService.createOrder({
        ...req.body,
        tenantId,
        salesmanId: user._id.toString(),
        salesmanName: user.name,
        userRole: user.role
      });
      res.status(201).json({ success: true, order: Serializers.serializeSalesOrder(order) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async syncOfflineOrders(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { orders } = req.body; // array of offline orders
      if (!Array.isArray(orders)) throw new Error('Orders must be an array');
      const synced: any[] = [];
      for (const orderData of orders) {
        const order = await SalesOrderService.createOrder({
          ...orderData,
          tenantId,
          salesmanId: user._id.toString(),
          salesmanName: user.name,
          userRole: user.role
        });
        synced.push(Serializers.serializeSalesOrder(order));
      }
      res.json({ success: true, count: synced.length, synced });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async approveOrder(req: Request, res: Response) {
    try {
      const user = (req as AuthenticatedRequest).user;
      const approverName = user?.name || user?.username || req.body.approverName || 'Factory Admin';
      const result = await SalesOrderService.approveOrder(req.params.id, approverName, user?.role || 'admin');
      res.json({ 
        success: true, 
        ...result,
        order: result.order ? Serializers.serializeSalesOrder(result.order) : undefined,
        invoice: result.invoice ? Serializers.serializeInvoice(result.invoice) : undefined
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async rejectOrder(req: Request, res: Response) {
    try {
      const user = (req as AuthenticatedRequest).user;
      const rejectedBy = user?.name || user?.username || req.body.rejectedBy || 'Factory Admin';
      const { reason } = req.body;
      const order = await SalesOrderService.rejectOrder(req.params.id, reason, rejectedBy, user?.role || 'admin');
      res.json({ success: true, order: Serializers.serializeSalesOrder(order) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async editOrder(req: Request, res: Response) {
    try {
      const user = (req as AuthenticatedRequest).user;
      const editorName = user?.name || user?.username || 'Admin';
      const items = req.body.items;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Items array is required for order edit.' });
      }
      const order = await SalesOrderService.editOrder(req.params.id, items, editorName, user?.role || 'admin');
      res.json({ success: true, order: Serializers.serializeSalesOrder(order) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async dispatchOrder(req: Request, res: Response) {
    try {
      const user = (req as AuthenticatedRequest).user;
      const dispatcherName = user?.name || user?.username || req.body.dispatcherName || 'Factory Admin';
      const dispatchItems = req.body.items;
      const invoice = await SalesOrderService.dispatchOrder(req.params.id, dispatcherName, user?.role || 'admin', dispatchItems);
      res.json({ success: true, invoice: Serializers.serializeInvoice(invoice) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Invoices & GST PDF ---
  static async getInvoices(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const invoices = await Invoice.find({ tenantId }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, invoices: invoices.map(i => Serializers.serializeInvoice(i)) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async cancelInvoice(req: Request, res: Response) {
    try {
      const user = (req as AuthenticatedRequest).user;
      const cancelledBy = user?.name || user?.username || 'Admin';
      const { reason } = req.body;
      const result = await SalesOrderService.cancelInvoice(req.params.id, reason, cancelledBy, user?.role || 'admin');
      res.json({
        success: true,
        invoice: Serializers.serializeInvoice(result.invoice),
        creditNote: result.creditNote
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
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

  static async getCreditNotePDF(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const invoice = await Invoice.findOne({ _id: req.params.id, tenantId }) || await Invoice.findById(req.params.id);
      if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
      if (!invoice.isCancelled) return res.status(400).json({ success: false, error: 'Credit note only available for cancelled invoices.' });

      const pdfBuffer = await PDFInvoiceGenerator.generateInvoicePDF(invoice, {
        isCreditNote: true,
        creditNoteNumber: invoice.creditNoteNumber,
        reason: invoice.cancellationReason
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="CreditNote_${invoice.creditNoteNumber?.replace(/\//g, '_') || 'CN'}.pdf"`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getEInvoiceJSON(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const invoice = await Invoice.findOne({ _id: req.params.id, tenantId }) || await Invoice.findById(req.params.id);
      if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

      const payload = await EInvoiceService.buildEInvoicePayload(invoice._id.toString());
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="einvoice-${invoice.invoiceNumber.replace(/\//g, '_')}.json"`);
      return res.json(payload);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async generateMockEInvoice(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const invoice = await Invoice.findOne({ _id: req.params.id, tenantId }) || await Invoice.findById(req.params.id);
      if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

      const user = (req as any).user;
      const updated = await EInvoiceService.generateMockIRN(invoice._id.toString(), {
        username: user?.username || 'system',
        role: user?.role || 'admin'
      });
      return res.json({ success: true, invoice: Serializers.serializeInvoice(updated) });
    } catch (err: any) {
      const status = err.message && err.message.includes('cancelled') ? 400 : 500;
      return res.status(status).json({ success: false, error: err.message });
    }
  }

  // --- Payments ---
  static async getPayments(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const payments = await Payment.find({ tenantId }).sort({ date: -1 }).lean();
      res.json({ success: true, payments: payments.map(p => Serializers.serializePayment(p)) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async recordPayment(req: Request, res: Response) {
    try {
      const user = (req as AuthenticatedRequest).user;
      const receivedBy = user?.name || user?.username || req.body.receivedBy || 'Senior Accountant';
      const result = await SalesOrderService.recordPayment({
        ...req.body,
        receivedBy,
        userRole: user?.role
      });
      res.status(201).json({ 
        success: true, 
        ...result,
        payment: result.payment ? Serializers.serializePayment(result.payment) : undefined,
        invoice: result.invoice ? Serializers.serializeInvoice(result.invoice) : undefined
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Reports (Section 4.6 & Auditor) ---
  static async getSalesRegister(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { from, to } = parseDateRange(req);
      const rows = await ReportService.getSalesRegister(from, to, tenantId);

      const columns: ReportColumnDef[] = [
        { header: 'Invoice No', key: 'invoiceNumber', width: 18 },
        { header: 'Date', key: 'date', width: 14, isDate: true },
        { header: 'Customer Code', key: 'customerCode', width: 14 },
        { header: 'Customer Name', key: 'customerName', width: 22 },
        { header: 'GSTIN', key: 'customerGstin', width: 18 },
        { header: 'Taxable (₹)', key: 'taxableValue', width: 15, isCurrency: true },
        { header: 'CGST (₹)', key: 'cgstTotal', width: 13, isCurrency: true },
        { header: 'SGST (₹)', key: 'sgstTotal', width: 13, isCurrency: true },
        { header: 'IGST (₹)', key: 'igstTotal', width: 13, isCurrency: true },
        { header: 'Grand Total (₹)', key: 'grandTotal', width: 16, isCurrency: true },
        { header: 'Balance Due (₹)', key: 'balanceDue', width: 15, isCurrency: true },
        { header: 'Status', key: 'paymentStatus', width: 14 }
      ];

      return ReportExporter.export(
        res,
        req.query.format as string,
        'sales_register',
        'Sales Register',
        columns,
        rows,
        { register: rows, dateRange: { from, to } }
      );
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getTallySalesVouchers(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { from, to } = parseDateRange(req);
      const query: any = { isCancelled: { $ne: true } };
      if (tenantId) query.tenantId = tenantId;
      if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = from;
        if (to) query.createdAt.$lte = to;
      }
      const invoices = await Invoice.find(query).sort({ createdAt: 1 });
      const xml = TallyExportUtil.generateSalesVouchersXml(invoices);
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', 'attachment; filename="tally_sales_vouchers.xml"');
      return res.status(200).send(xml);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getPurchaseRegister(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { from, to } = parseDateRange(req);
      const rows = await ReportService.getPurchaseRegister(from, to, tenantId);

      const columns: ReportColumnDef[] = [
        { header: 'Purchase No', key: 'purchaseNumber', width: 18 },
        { header: 'Date', key: 'date', width: 14, isDate: true },
        { header: 'Supplier Name', key: 'supplierName', width: 25 },
        { header: 'Items Count', key: 'itemsCount', width: 14, isNumeric: true },
        { header: 'Total Amount (₹)', key: 'totalAmount', width: 18, isCurrency: true },
        { header: 'Status', key: 'status', width: 14 }
      ];

      return ReportExporter.export(
        res,
        req.query.format as string,
        'purchase_register',
        'Purchase Register',
        columns,
        rows,
        { purchases: rows, dateRange: { from, to } }
      );
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getCustomerWiseSales(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { from, to } = parseDateRange(req);
      const rows = await ReportService.getCustomerWiseSales(from, to, tenantId);

      const columns: ReportColumnDef[] = [
        { header: 'Code', key: 'customerCode', width: 14 },
        { header: 'Customer Name', key: 'customerName', width: 24 },
        { header: 'State', key: 'state', width: 15 },
        { header: 'GSTIN', key: 'gstin', width: 18 },
        { header: 'Invoices', key: 'invoicesCount', width: 12, isNumeric: true },
        { header: 'Packets Sold', key: 'totalQuantity', width: 15, isNumeric: true },
        { header: 'Taxable (₹)', key: 'totalTaxable', width: 16, isCurrency: true },
        { header: 'GST Tax (₹)', key: 'totalTax', width: 15, isCurrency: true },
        { header: 'Total Sales (₹)', key: 'grandTotal', width: 18, isCurrency: true }
      ];

      return ReportExporter.export(
        res,
        req.query.format as string,
        'customer_wise_sales',
        'Customer-Wise Sales Analysis',
        columns,
        rows,
        { customers: rows, dateRange: { from, to } }
      );
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getProductWiseSales(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { from, to } = parseDateRange(req);
      const rows = await ReportService.getProductWiseSales(from, to, tenantId);

      const columns: ReportColumnDef[] = [
        { header: 'Product Code', key: 'productCode', width: 16 },
        { header: 'Product Name', key: 'productName', width: 24 },
        { header: 'HSN Code', key: 'hsnCode', width: 14 },
        { header: 'Packets Sold', key: 'totalPacketsSold', width: 15, isNumeric: true },
        { header: 'Avg Price (₹)', key: 'avgPricePerPacket', width: 14, isCurrency: true },
        { header: 'Taxable Value (₹)', key: 'totalTaxable', width: 16, isCurrency: true },
        { header: 'GST Tax (₹)', key: 'totalTax', width: 14, isCurrency: true },
        { header: 'Total Revenue (₹)', key: 'grandTotal', width: 18, isCurrency: true }
      ];

      return ReportExporter.export(
        res,
        req.query.format as string,
        'product_wise_sales',
        'Product-Wise Sales & Margin Report',
        columns,
        rows,
        { products: rows, dateRange: { from, to } }
      );
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getGSTSummary(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { from, to } = parseDateRange(req);
      const summary = await ReportService.getGSTSummary(from, to, tenantId);

      if (req.query.format && req.query.format !== 'json') {
        const columns: ReportColumnDef[] = [
          { header: 'HSN Code', key: 'hsnCode', width: 14 },
          { header: 'Description', key: 'description', width: 22 },
          { header: 'Total Qty', key: 'totalQuantity', width: 14, isNumeric: true },
          { header: 'Taxable (₹)', key: 'taxableValue', width: 16, isCurrency: true },
          { header: 'CGST (₹)', key: 'cgstAmount', width: 14, isCurrency: true },
          { header: 'SGST (₹)', key: 'sgstAmount', width: 14, isCurrency: true },
          { header: 'IGST (₹)', key: 'igstAmount', width: 14, isCurrency: true },
          { header: 'Total Tax (₹)', key: 'totalTax', width: 16, isCurrency: true }
        ];
        return ReportExporter.export(res, req.query.format as string, 'gstr1_hsn_summary', 'GSTR-1 HSN Outward Tax Summary', columns, summary.gstr1.hsnSummary);
      }

      res.json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getCollectionsReport(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { from, to } = parseDateRange(req);
      const rows = await ReportService.getCollectionsReport(from, to, tenantId);

      const columns: ReportColumnDef[] = [
        { header: 'Receipt No', key: 'paymentNumber', width: 16 },
        { header: 'Date', key: 'date', width: 14, isDate: true },
        { header: 'Customer Code', key: 'customerCode', width: 14 },
        { header: 'Customer Name', key: 'customerName', width: 22 },
        { header: 'Invoice No', key: 'invoiceNumber', width: 18 },
        { header: 'Payment Method', key: 'paymentMethod', width: 16 },
        { header: 'Reference', key: 'reference', width: 16 },
        { header: 'Amount (₹)', key: 'amount', width: 16, isCurrency: true }
      ];

      return ReportExporter.export(
        res,
        req.query.format as string,
        'collections_report',
        'Payments & Collections Register',
        columns,
        rows,
        { collections: rows, dateRange: { from, to } }
      );
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getProductionReport(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { from, to } = parseDateRange(req);
      const runs = await ReportService.getProductionReport(from, to, tenantId);

      const columns: ReportColumnDef[] = [
        { header: 'Run No', key: 'runNumber', width: 16 },
        { header: 'Date', key: 'date', width: 14, isDate: true },
        { header: 'Product Code', key: 'productCode', width: 14 },
        { header: 'Target Pkts', key: 'expectedOutput', width: 13, isNumeric: true },
        { header: 'Actual Pkts', key: 'actualOutput', width: 13, isNumeric: true },
        { header: 'Yield %', key: 'yieldPercent', width: 12, isNumeric: true },
        { header: 'Variance %', key: 'yieldVariancePercent', width: 13, isNumeric: true },
        { header: 'Flag', key: 'yieldVarianceFlagged', width: 12 },
        { header: 'Mat Cost (₹)', key: 'totalMaterialCost', width: 15, isCurrency: true },
        { header: 'Total Cost (₹)', key: 'totalProductionCost', width: 15, isCurrency: true },
        { header: 'Cost/Pkt (₹)', key: 'costPerPacket', width: 14, isCurrency: true },
        { header: 'Margin/Pkt (₹)', key: 'grossMarginPerPacket', width: 15, isCurrency: true },
        { header: 'Margin %', key: 'grossMarginPercent', width: 12, isNumeric: true }
      ];

      return ReportExporter.export(
        res,
        req.query.format as string,
        'production_variance_report',
        'Production Variance & Costing Report',
        columns,
        runs,
        { runs, dateRange: { from, to } }
      );
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getOutstanding(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const rows = await ReportService.getOutstandingReceivables(tenantId);

      const columns: ReportColumnDef[] = [
        { header: 'Code', key: 'code', width: 14 },
        { header: 'Customer Name', key: 'customerName', width: 22 },
        { header: 'State', key: 'state', width: 14 },
        { header: 'Credit Limit (₹)', key: 'creditLimit', width: 16, isCurrency: true },
        { header: 'Outstanding (₹)', key: 'totalOutstanding', width: 16, isCurrency: true },
        { header: '0-30 Days (₹)', key: 'current', width: 15, isCurrency: true },
        { header: '31-60 Days (₹)', key: 'days31to60', width: 15, isCurrency: true },
        { header: '61-90 Days (₹)', key: 'days61to90', width: 15, isCurrency: true },
        { header: 'Over 90 Days (₹)', key: 'over90days', width: 16, isCurrency: true }
      ];

      return ReportExporter.export(
        res,
        req.query.format as string,
        'receivables_aging',
        'Receivables Aging & Credit Limit Report',
        columns,
        rows,
        { outstanding: rows }
      );
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getStockLedgerRange(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { from, to } = parseDateRange(req);
      const itemId = req.query.itemId as string;
      const result = await ReportService.getStockLedgerRange(from, to, itemId, tenantId);

      if (req.query.format && req.query.format !== 'json') {
        const columns: ReportColumnDef[] = [
          { header: 'Date', key: 'date', width: 14, isDate: true },
          { header: 'Item Code', key: 'itemCode', width: 14 },
          { header: 'Item Name', key: 'itemName', width: 22 },
          { header: 'Movement Type', key: 'movementType', width: 18 },
          { header: 'Quantity', key: 'quantity', width: 14, isNumeric: true },
          { header: 'Unit', key: 'unit', width: 10 },
          { header: 'Unit Cost (₹)', key: 'unitCost', width: 14, isCurrency: true },
          { header: 'Running Bal', key: 'runningBalance', width: 15, isNumeric: true },
          { header: 'Source Doc', key: 'sourceDocId', width: 18 }
        ];
        return ReportExporter.export(res, req.query.format as string, 'stock_ledger_statement', 'Stock Ledger Statement', columns, result.movements);
      }

      res.json({ success: true, ...result });
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
        tenantId: process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT',
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
