import { Router } from 'express';
import { ApiController } from '../controllers/api.controller';

const router = Router();

// Benchmark & System
router.post('/benchmark/seed', ApiController.seedBenchmark);
router.post('/benchmark/run', ApiController.runBenchmark);

// Users
router.get('/users', ApiController.getUsers);

// Masters
router.get('/customers', ApiController.getCustomers);
router.get('/products', ApiController.getProducts);
router.get('/raw-materials', ApiController.getRawMaterials);
router.get('/boms', ApiController.getBOMs);

// Inventory
router.get('/inventory/stock-summary', ApiController.getStockSummary);
router.get('/inventory/ledger', ApiController.getStockLedger);

// Purchasing
router.get('/purchases', ApiController.getPurchases);
router.post('/purchases', ApiController.recordPurchase);

// Production
router.get('/production/runs', ApiController.getProductionRuns);
router.post('/production/runs', ApiController.executeProductionRun);
router.put('/production/runs/:id/costs', ApiController.updateRunOverheads);

// Orders
router.get('/orders', ApiController.getSalesOrders);
router.post('/orders', ApiController.createSalesOrder);
router.post('/orders/sync-batch', ApiController.syncOfflineOrders);
router.put('/orders/:id/approve', ApiController.approveOrder);
router.put('/orders/:id/dispatch', ApiController.dispatchOrder);

// Invoices
router.get('/invoices', ApiController.getInvoices);
router.get('/invoices/:id/pdf', ApiController.getInvoicePDF);

// Payments
router.get('/payments', ApiController.getPayments);
router.post('/payments', ApiController.recordPayment);

// Reports
router.get('/reports/sales-register', ApiController.getSalesRegister);
router.get('/reports/gst-summary', ApiController.getGSTSummary);
router.get('/reports/production-report', ApiController.getProductionReport);
router.get('/reports/outstanding', ApiController.getOutstanding);

// Owner Dashboard & Audit
router.get('/owner/overview', ApiController.getOwnerOverview);
router.get('/audit-logs', ApiController.getAuditLogs);

export default router;

