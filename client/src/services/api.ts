const API_BASE = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('zenlyft_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Authentication & RBAC
  login: (credentials: { username: string; password: string }) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(r => r.json()),

  adminLogin: (credentials: { username: string; password: string }) =>
    fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(r => r.json()),

  salesmanMobileLogin: (credentials: { username: string; password: string; routeTerritory?: string }) =>
    fetch(`${API_BASE}/auth/salesman-mobile-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(r => r.json()),

  getMe: () =>
    fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    }).then(r => r.json()),

  getAdminUsers: () =>
    fetch(`${API_BASE}/auth/users`, {
      headers: getAuthHeaders()
    }).then(r => r.json()),

  createAdminUser: (userData: any) =>
    fetch(`${API_BASE}/auth/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    }).then(r => r.json()),

  toggleUserStatus: (userId: string, active: boolean) =>
    fetch(`${API_BASE}/auth/users/${userId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ active })
    }).then(r => r.json()),

  resetUserPassword: (userId: string, newPassword: string) =>
    fetch(`${API_BASE}/auth/users/${userId}/reset-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword })
    }).then(r => r.json()),

  updateProfile: (data: { name?: string; phone?: string; department?: string }) =>
    fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // Public Inquiries & Pilot Requests
  submitInquiry: (data: any) =>
    fetch(`${API_BASE}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  getInquiries: () =>
    fetch(`${API_BASE}/inquiries`, {
      headers: getAuthHeaders()
    }).then(r => r.json()),

  // Admin Control Centre & Overview
  getAdminOverview: () =>
    fetch(`${API_BASE}/admin/overview`, {
      headers: getAuthHeaders()
    }).then(r => r.json()),

  // Benchmark
  seedBenchmark: () => fetch(`${API_BASE}/benchmark/seed`, { method: 'POST' }).then(r => r.json()),
  runBenchmark: () => fetch(`${API_BASE}/benchmark/run`, { method: 'POST' }).then(r => r.json()),

  // Masters
  getCustomers: (includeInactive?: boolean) => 
    fetch(`${API_BASE}/customers${includeInactive ? '?includeInactive=true' : ''}`, { headers: getAuthHeaders() }).then(r => r.json()),
  createCustomer: (data: any) => 
    fetch(`${API_BASE}/customers`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  updateCustomer: (id: string, data: any) => 
    fetch(`${API_BASE}/customers/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteCustomer: (id: string) => 
    fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(r => r.json()),

  getProducts: (includeInactive?: boolean) => 
    fetch(`${API_BASE}/products${includeInactive ? '?includeInactive=true' : ''}`, { headers: getAuthHeaders() }).then(r => r.json()),
  createProduct: (data: any) => 
    fetch(`${API_BASE}/products`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  updateProduct: (id: string, data: any) => 
    fetch(`${API_BASE}/products/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteProduct: (id: string) => 
    fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(r => r.json()),

  getRawMaterials: (includeInactive?: boolean) => 
    fetch(`${API_BASE}/raw-materials${includeInactive ? '?includeInactive=true' : ''}`, { headers: getAuthHeaders() }).then(r => r.json()),
  createRawMaterial: (data: any) => 
    fetch(`${API_BASE}/raw-materials`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  updateRawMaterial: (id: string, data: any) => 
    fetch(`${API_BASE}/raw-materials/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteRawMaterial: (id: string) => 
    fetch(`${API_BASE}/raw-materials/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(r => r.json()),

  getBOMs: (includeInactive?: boolean) => 
    fetch(`${API_BASE}/boms${includeInactive ? '?includeInactive=true' : ''}`, { headers: getAuthHeaders() }).then(r => r.json()),
  createBOM: (data: any) => 
    fetch(`${API_BASE}/boms`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  updateBOM: (id: string, data: any) => 
    fetch(`${API_BASE}/boms/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteBOM: (id: string) => 
    fetch(`${API_BASE}/boms/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(r => r.json()),

  getSuppliers: (includeInactive?: boolean) => 
    fetch(`${API_BASE}/suppliers${includeInactive ? '?includeInactive=true' : ''}`, { headers: getAuthHeaders() }).then(r => r.json()),
  createSupplier: (data: any) => 
    fetch(`${API_BASE}/suppliers`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  updateSupplier: (id: string, data: any) => 
    fetch(`${API_BASE}/suppliers/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteSupplier: (id: string) => 
    fetch(`${API_BASE}/suppliers/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(r => r.json()),

  // Inventory & Reorder Alerts
  getReorderAlerts: () => fetch(`${API_BASE}/inventory/reorder-alerts`, { headers: getAuthHeaders() }).then(r => r.json()),
  getStockSummary: () => fetch(`${API_BASE}/inventory/stock-summary`, { headers: getAuthHeaders() }).then(r => r.json()),
  reconcileInventory: () => fetch(`${API_BASE}/inventory/reconcile`, { method: 'POST', headers: getAuthHeaders() }).then(r => r.json()),
  getStockLedger: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetch(`${API_BASE}/inventory/ledger${qs}`, { headers: getAuthHeaders() }).then(r => r.json());
  },

  // Purchasing
  getPurchases: () => fetch(`${API_BASE}/purchases`, { headers: getAuthHeaders() }).then(r => r.json()),
  recordPurchase: (data: any) => 
    fetch(`${API_BASE}/purchases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // Production
  getProductionRuns: () => fetch(`${API_BASE}/production/runs`, { headers: getAuthHeaders() }).then(r => r.json()),
  getProductionPlan: () => fetch(`${API_BASE}/production/plan`, { headers: getAuthHeaders() }).then(r => r.json()),
  executeProductionRun: (data: any) => 
    fetch(`${API_BASE}/production/runs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),
  updateRunOverheads: (runId: string, laborCost: number, overheadCost: number) => 
    fetch(`${API_BASE}/production/runs/${runId}/costs`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ laborCost, overheadCost })
    }).then(r => r.json()),

  // Orders
  getOrders: () => fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() }).then(r => r.json()),
  getMySalesSummary: () => fetch(`${API_BASE}/orders/mine/summary`, { headers: getAuthHeaders() }).then(r => r.json()),
  createOrder: (data: any) => 
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),
  editOrder: (orderId: string, data: any) =>
    fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),
  syncOfflineBatch: (orders: any[]) => 
    fetch(`${API_BASE}/orders/sync-batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ orders })
    }).then(r => r.json()),
  approveOrder: (orderId: string, approverName: string = 'Admin') => 
    fetch(`${API_BASE}/orders/${orderId}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ approverName })
    }).then(r => r.json()),
  rejectOrder: (orderId: string, reason: string = 'Administrative review', rejectedBy: string = 'Admin') => 
    fetch(`${API_BASE}/orders/${orderId}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, rejectedBy })
    }).then(r => r.json()),
  dispatchOrder: (invoiceId: string, dispatcherName: string = 'Admin') => 
    fetch(`${API_BASE}/orders/${invoiceId}/dispatch`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ dispatcherName })
    }).then(r => r.json()),
  dispatchOrderWithItems: (invoiceId: string, items?: Array<{ productCode: string; quantity: number }>, dispatcherName: string = 'Admin') => 
    fetch(`${API_BASE}/invoices/${invoiceId}/dispatch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items, dispatcherName })
    }).then(r => r.json()),

  // Invoices & PDF
  getInvoices: () => fetch(`${API_BASE}/invoices`, { headers: getAuthHeaders() }).then(r => r.json()),
  cancelInvoice: (invoiceId: string, reason: string) =>
    fetch(`${API_BASE}/invoices/${invoiceId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    }).then(r => r.json()),
  getInvoicePDFUrl: (invoiceId: string) => `${API_BASE}/invoices/${invoiceId}/pdf`,
  getCreditNotePDFUrl: (invoiceId: string) => `${API_BASE}/invoices/${invoiceId}/credit-note/pdf`,
  getEInvoiceJsonUrl: (invoiceId: string) => `${API_BASE}/invoices/${invoiceId}/einvoice-json`,
  generateMockEInvoice: (invoiceId: string) =>
    fetch(`${API_BASE}/invoices/${invoiceId}/einvoice/generate-mock`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(r => r.json()),

  // Payments
  getPayments: () => fetch(`${API_BASE}/payments`, { headers: getAuthHeaders() }).then(r => r.json()),
  recordPayment: (data: any) => 
    fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // Reports (Section 4.6 & Auditor Portal)
  getPurchaseRegister: (from?: string, to?: string) => 
    fetch(`${API_BASE}/reports/purchase-register?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(r => r.json()),
  getSalesRegister: (from?: string, to?: string) => 
    fetch(`${API_BASE}/reports/sales-register?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(r => r.json()),
  getGSTSummary: (from?: string, to?: string) => 
    fetch(`${API_BASE}/reports/gst-summary?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(r => r.json()),
  getProductionReport: (from?: string, to?: string) => 
    fetch(`${API_BASE}/reports/production-report?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(r => r.json()),
  getOutstanding: () => 
    fetch(`${API_BASE}/reports/outstanding`, { headers: getAuthHeaders() }).then(r => r.json()),
  getCustomerSales: (from?: string, to?: string) => 
    fetch(`${API_BASE}/reports/customer-sales?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(r => r.json()),
  getProductSales: (from?: string, to?: string) => 
    fetch(`${API_BASE}/reports/product-sales?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(r => r.json()),
  getCollections: (from?: string, to?: string) => 
    fetch(`${API_BASE}/reports/collections?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(r => r.json()),
  getStockLedgerRange: (from?: string, to?: string, itemId?: string) => 
    fetch(`${API_BASE}/reports/stock-ledger-range?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}), ...(itemId ? { itemId } : {}) })}`, { headers: getAuthHeaders() }).then(r => r.json()),

  // Universal Authenticated Report Downloader (CSV, Excel, PDF)
  downloadReportFile: async (reportPath: string, filename: string, format: 'csv' | 'xlsx' | 'pdf', from?: string, to?: string) => {
    const params = new URLSearchParams({ format, ...(from ? { from } : {}), ...(to ? { to } : {}) });
    const res = await fetch(`${API_BASE}${reportPath}?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Download failed: ' + res.statusText);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  downloadTallyXml: async (from?: string, to?: string) => {
    const params = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) });
    const res = await fetch(`${API_BASE}/reports/tally-sales-vouchers?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Download failed: ' + res.statusText);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tally_sales_vouchers_${from || 'start'}_to_${to || 'end'}.xml`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Legacy CSV Exports
  exportSalesRegisterCSV: () => `${API_BASE}/reports/sales-register?format=csv`,
  exportStockSummaryCSV: () => `${API_BASE}/inventory/stock-summary?format=csv`,
  exportProductionCSV: () => `${API_BASE}/reports/production-report?format=csv`,

  // Owner Overview & Audit
  getOwnerOverview: () => fetch(`${API_BASE}/owner/overview`, { headers: getAuthHeaders() }).then(r => r.json()),
  getAuditLogs: () => fetch(`${API_BASE}/audit-logs`, { headers: getAuthHeaders() }).then(r => r.json()),

  // WhatsApp & OpenWA Automation
  getWhatsAppNotifications: () => fetch(`${API_BASE}/whatsapp/notifications`, { headers: getAuthHeaders() }).then(r => r.json()),
  sendWhatsAppNotification: (data: any) => 
    fetch(`${API_BASE}/whatsapp/send-test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),
  getWhatsAppStatus: () => fetch(`${API_BASE}/whatsapp/status`, { headers: getAuthHeaders() }).then(r => r.json())
};
