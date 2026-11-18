import { Router } from 'express';
import { ApiController } from '../controllers/api.controller';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { RealtimeService } from '../services/realtime.service';

const router = Router();

// --- Authentication & Multi-User Identity ---
router.post('/auth/login', AuthController.login);
router.post('/auth/admin-login', AuthController.adminLogin);
router.post('/auth/salesman-mobile-login', AuthController.salesmanMobileLogin);
router.get('/auth/me', authenticate, AuthController.me);
router.put('/auth/profile', authenticate, AuthController.updateProfile);
router.put('/auth/change-password', authenticate, AuthController.changePassword);
router.get('/auth/users', authenticate, requireAdmin, AuthController.listUsers);
router.post('/auth/users', authenticate, requireAdmin, AuthController.createUser);
router.put('/auth/users/:id/status', authenticate, requireAdmin, AuthController.toggleUserStatus);
router.put('/auth/users/:id/reset-password', authenticate, requireAdmin, AuthController.resetPassword);

// --- Realtime Server-Sent Events (SSE) ---
router.get('/realtime/events', (req, res) => RealtimeService.subscribe(res));

// --- Benchmark & System Initialization ---
router.post('/benchmark/seed', ApiController.seedBenchmark);
router.post('/benchmark/run', ApiController.runBenchmark);

// --- Legacy / Public Users List ---
router.get('/users', ApiController.getUsers);

// --- Master Data (Shared across all modules) ---
router.get('/customers', ApiController.getCustomers);
router.get('/products', ApiController.getProducts);
router.get('/raw-materials', ApiController.getRawMaterials);
router.get('/boms', ApiController.getBOMs);

// --- Authoritative Central Inventory ---
router.get('/inventory/stock-summary', ApiController.getStockSummary);
router.get('/inventory/ledger', ApiController.getStockLedger);

// --- Procurement & Purchases ---
router.get('/purchases', ApiController.getPurchases);
router.post('/purchases', ApiController.recordPurchase);

// --- Production & Manufacturing ---
router.get('/production/runs', ApiController.getProductionRuns);
router.post('/production/runs', ApiController.executeProductionRun);
router.put('/production/runs/:id/costs', ApiController.updateRunOverheads);

// --- Sales Orders & Offline Sync ---
router.get('/orders', ApiController.getSalesOrders);
router.post('/orders', ApiController.createSalesOrder);
router.post('/orders/sync-batch', ApiController.syncOfflineOrders);
router.put('/orders/:id/approve', ApiController.approveOrder);
router.put('/orders/:id/reject', ApiController.rejectOrder);
router.put('/orders/:id/dispatch', ApiController.dispatchOrder);

// --- Invoicing & GST Tax Engine ---
router.get('/invoices', ApiController.getInvoices);
router.get('/invoices/:id/pdf', ApiController.getInvoicePDF);

// --- Collections & Payments ---
router.get('/payments', ApiController.getPayments);
router.post('/payments', ApiController.recordPayment);

// --- Regulatory, Financial & Production Reports ---
router.get('/reports/sales-register', ApiController.getSalesRegister);
router.get('/reports/gst-summary', ApiController.getGSTSummary);
router.get('/reports/production-report', ApiController.getProductionReport);
router.get('/reports/outstanding', ApiController.getOutstanding);

// --- Admin Control Centre, Owner Dashboard & Immutable Audit Trail ---
router.get('/admin/overview', ApiController.getAdminOverview);
router.get('/owner/overview', ApiController.getOwnerOverview);
router.get('/audit-logs', ApiController.getAuditLogs);

// --- WhatsApp & OpenWA Automation ---
router.get('/whatsapp/notifications', ApiController.getWhatsAppNotifications);
router.post('/whatsapp/send-test', ApiController.sendTestWhatsApp);
router.get('/whatsapp/status', ApiController.getWhatsAppStatus);

// --- Public Inquiries & Enterprise Onboarding ---
router.post('/inquiries', ApiController.submitInquiry);
router.get('/inquiries', authenticate, requireAdmin, ApiController.getInquiries);
router.put('/inquiries/:id', authenticate, requireAdmin, ApiController.updateInquiryStatus);

export default router;
