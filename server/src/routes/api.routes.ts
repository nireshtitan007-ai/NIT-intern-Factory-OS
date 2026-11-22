import { Router } from 'express';
import { ApiController } from '../controllers/api.controller';
import { AuthController } from '../controllers/auth.controller';
import { 
  authenticate, 
  requireAdmin, 
  requireRoles, 
  requirePermission, 
  requireNonProduction 
} from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { 
  loginSchema, 
  salesmanMobileLoginSchema, 
  createUserSchema, 
  resetPasswordSchema, 
  updateProfileSchema, 
  changePasswordSchema 
} from '../schemas/auth.schema';
import { 
  createOrderSchema, 
  syncOfflineBatchSchema, 
  approveOrderSchema, 
  rejectOrderSchema, 
  dispatchOrderSchema 
} from '../schemas/order.schema';
import { recordPurchaseSchema } from '../schemas/purchase.schema';
import { executeProductionRunSchema, updateOverheadsSchema } from '../schemas/production.schema';
import { recordPaymentSchema } from '../schemas/payment.schema';
import { submitInquirySchema, updateInquiryStatusSchema } from '../schemas/inquiry.schema';
import { RealtimeService } from '../services/realtime.service';

const router = Router();

// --- Authentication & Multi-User Identity ---
router.post('/auth/login', validateBody(loginSchema), AuthController.login);
router.post('/auth/admin-login', validateBody(loginSchema), AuthController.adminLogin);
router.post('/auth/salesman-mobile-login', validateBody(salesmanMobileLoginSchema), AuthController.salesmanMobileLogin);
router.get('/auth/me', authenticate, AuthController.me);
router.put('/auth/profile', authenticate, validateBody(updateProfileSchema), AuthController.updateProfile);
router.put('/auth/change-password', authenticate, validateBody(changePasswordSchema), AuthController.changePassword);
router.get('/auth/users', authenticate, requireAdmin, AuthController.listUsers);
router.post('/auth/users', authenticate, requireAdmin, validateBody(createUserSchema), AuthController.createUser);
router.put('/auth/users/:id/status', authenticate, requireAdmin, AuthController.toggleUserStatus);
router.put('/auth/users/:id/reset-password', authenticate, requireAdmin, validateBody(resetPasswordSchema), AuthController.resetPassword);

// --- Realtime Server-Sent Events (SSE) (Requires Authentication) ---
router.get('/realtime/events', authenticate, (req, res) => RealtimeService.subscribe(res));

// --- Benchmark & System Initialization (Protected by Admin + Non-Production Flag) ---
router.post('/benchmark/seed', authenticate, requireAdmin, requireNonProduction, ApiController.seedBenchmark);
router.post('/benchmark/run', authenticate, requireAdmin, requireNonProduction, ApiController.runBenchmark);

// --- Legacy / Internal Users Listing ---
router.get('/users', authenticate, requireRoles('admin', 'owner', 'auditor'), ApiController.getUsers);

// --- Master Data (Shared across operational modules) ---
router.get('/customers', authenticate, requirePermission('customers:read'), ApiController.getCustomers);
router.get('/products', authenticate, requirePermission('products:read'), ApiController.getProducts);
router.get('/raw-materials', authenticate, requirePermission('raw_materials:read'), ApiController.getRawMaterials);
router.get('/boms', authenticate, requirePermission('boms:read'), ApiController.getBOMs);

// --- Authoritative Central Inventory ---
router.get('/inventory/stock-summary', authenticate, requirePermission('inventory:read'), ApiController.getStockSummary);
router.get('/inventory/ledger', authenticate, requirePermission('inventory:read'), ApiController.getStockLedger);

// --- Procurement & Purchases ---
router.get('/purchases', authenticate, requirePermission('purchases:read'), ApiController.getPurchases);
router.post('/purchases', authenticate, requirePermission('purchases:create'), validateBody(recordPurchaseSchema), ApiController.recordPurchase);

// --- Production & Manufacturing ---
router.get('/production/runs', authenticate, requirePermission('production:read'), ApiController.getProductionRuns);
router.post('/production/runs', authenticate, requirePermission('production:create'), validateBody(executeProductionRunSchema), ApiController.executeProductionRun);
router.put('/production/runs/:id/costs', authenticate, requirePermission('production:costs'), validateBody(updateOverheadsSchema), ApiController.updateRunOverheads);

// --- Sales Orders & Offline Sync ---
router.get('/orders', authenticate, requirePermission('orders:read'), ApiController.getSalesOrders);
router.post('/orders', authenticate, requirePermission('orders:create'), validateBody(createOrderSchema), ApiController.createSalesOrder);
router.post('/orders/sync-batch', authenticate, requirePermission('orders:create'), validateBody(syncOfflineBatchSchema), ApiController.syncOfflineOrders);
router.put('/orders/:id/approve', authenticate, requirePermission('orders:approve'), validateBody(approveOrderSchema), ApiController.approveOrder);
router.put('/orders/:id/reject', authenticate, requirePermission('orders:approve'), validateBody(rejectOrderSchema), ApiController.rejectOrder);
router.put('/orders/:id/dispatch', authenticate, requirePermission('orders:dispatch'), validateBody(dispatchOrderSchema), ApiController.dispatchOrder);

// --- Invoicing & GST Tax Engine ---
router.get('/invoices', authenticate, requirePermission('invoices:read'), ApiController.getInvoices);
router.get('/invoices/:id/pdf', authenticate, requirePermission('invoices:pdf'), ApiController.getInvoicePDF);

// --- Collections & Payments ---
router.get('/payments', authenticate, requirePermission('payments:read'), ApiController.getPayments);
router.post('/payments', authenticate, requirePermission('payments:create'), validateBody(recordPaymentSchema), ApiController.recordPayment);

// --- Regulatory, Financial & Production Reports ---
router.get('/reports/sales-register', authenticate, requirePermission('reports:read'), ApiController.getSalesRegister);
router.get('/reports/gst-summary', authenticate, requirePermission('reports:read'), ApiController.getGSTSummary);
router.get('/reports/production-report', authenticate, requirePermission('reports:read'), ApiController.getProductionReport);
router.get('/reports/outstanding', authenticate, requirePermission('reports:read'), ApiController.getOutstanding);

// --- Admin Control Centre, Owner Dashboard & Immutable Audit Trail ---
router.get('/admin/overview', authenticate, requireAdmin, ApiController.getAdminOverview);
router.get('/owner/overview', authenticate, requireRoles('owner', 'admin', 'auditor'), ApiController.getOwnerOverview);
router.get('/audit-logs', authenticate, requireRoles('admin', 'owner', 'auditor'), ApiController.getAuditLogs);

// --- WhatsApp & OpenWA Automation ---
router.get('/whatsapp/notifications', authenticate, requireRoles('admin', 'owner'), ApiController.getWhatsAppNotifications);
router.post('/whatsapp/send-test', authenticate, requireRoles('admin', 'owner'), ApiController.sendTestWhatsApp);
router.get('/whatsapp/status', authenticate, requireRoles('admin', 'owner'), ApiController.getWhatsAppStatus);

// --- Public Inquiries & Enterprise Onboarding ---
router.post('/inquiries', validateBody(submitInquirySchema), ApiController.submitInquiry);
router.get('/inquiries', authenticate, requireAdmin, ApiController.getInquiries);
router.put('/inquiries/:id', authenticate, requireAdmin, validateBody(updateInquiryStatusSchema), ApiController.updateInquiryStatus);

export default router;
