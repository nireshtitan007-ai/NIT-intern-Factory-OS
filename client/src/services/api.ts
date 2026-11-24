const API_BASE = '/api';

const handleResponse = async (r: Response) => {
  if (r.status === 401) {
    if (typeof window !== 'undefined' && !r.url.includes('/auth/login') && !r.url.includes('/auth/admin-login') && !r.url.includes('/auth/salesman-mobile-login')) {
      window.dispatchEvent(new CustomEvent('auth:expired', { detail: 'Your session has expired. Please sign in again.' }));
    }
  }
  return r.json();
};

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
    }).then(handleResponse),

  adminLogin: (credentials: { username: string; password: string }) =>
    fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(handleResponse),

  salesmanMobileLogin: (credentials: { username: string; password: string; routeTerritory?: string }) =>
    fetch(`${API_BASE}/auth/salesman-mobile-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(handleResponse),

  getMe: () =>
    fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  getAdminUsers: () =>
    fetch(`${API_BASE}/auth/users`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createAdminUser: (userData: any) =>
    fetch(`${API_BASE}/auth/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    }).then(handleResponse),

  toggleUserStatus: (userId: string, active: boolean) =>
    fetch(`${API_BASE}/auth/users/${userId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ active })
    }).then(handleResponse),

  resetUserPassword: (userId: string, newPassword: string) =>
    fetch(`${API_BASE}/auth/users/${userId}/reset-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword })
    }).then(handleResponse),

  updateProfile: (data: { name?: string; phone?: string; department?: string }) =>
    fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  // Public Inquiries & Pilot Requests
  submitInquiry: (data: any) =>
    fetch(`${API_BASE}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),

  getInquiries: () =>
    fetch(`${API_BASE}/inquiries`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Admin Control Centre & Overview
  getAdminOverview: () =>
    fetch(`${API_BASE}/admin/overview`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Benchmark
  seedBenchmark: () => fetch(`${API_BASE}/benchmark/seed`, { method: 'POST', headers: getAuthHeaders() }).then(handleResponse),
  runBenchmark: () => fetch(`${API_BASE}/benchmark/run`, { method: 'POST', headers: getAuthHeaders() }).then(handleResponse),

  // Masters
  getCustomers: (includeInactive?: boolean) =>
    fetch(`${API_BASE}/customers${includeInactive ? '?includeInactive=true' : ''}`, { headers: getAuthHeaders() }).then(handleResponse),
  createCustomer: (data: any) =>
    fetch(`${API_BASE}/customers`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  updateCustomer: (id: string, data: any) =>
    fetch(`${API_BASE}/customers/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  deleteCustomer: (id: string) =>
    fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse),

  getProducts: (includeInactive?: boolean) =>
    fetch(`${API_BASE}/products${includeInactive ? '?includeInactive=true' : ''}`, { headers: getAuthHeaders() }).then(handleResponse),
  createProduct: (data: any) =>
    fetch(`${API_BASE}/products`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  updateProduct: (id: string, data: any) =>
    fetch(`${API_BASE}/products/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  deleteProduct: (id: string) =>
    fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse),

  getRawMaterials: (includeInactive?: boolean) =>
    fetch(`${API_BASE}/raw-materials${includeInactive ? '?includeInactive=true' : ''}`, { headers: getAuthHeaders() }).then(handleResponse),
  createRawMaterial: (data: any) =>
    fetch(`${API_BASE}/raw-materials`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  updateRawMaterial: (id: string, data: any) =>
    fetch(`${API_BASE}/raw-materials/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  deleteRawMaterial: (id: string) =>
    fetch(`${API_BASE}/raw-materials/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse),

  getBOMs: (includeInactive?: boolean) =>
    fetch(`${API_BASE}/boms${includeInactive ? '?includeInactive=true' : ''}`, { headers: getAuthHeaders() }).then(handleResponse),
  createBOM: (data: any) =>
    fetch(`${API_BASE}/boms`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  updateBOM: (id: string, data: any) =>
    fetch(`${API_BASE}/boms/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  deleteBOM: (id: string) =>
    fetch(`${API_BASE}/boms/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse),

  getSuppliers: (includeInactive?: boolean) =>
    fetch(`${API_BASE}/suppliers${includeInactive ? '?includeInactive=true' : ''}`, { headers: getAuthHeaders() }).then(handleResponse),
  createSupplier: (data: any) =>
    fetch(`${API_BASE}/suppliers`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  updateSupplier: (id: string, data: any) =>
    fetch(`${API_BASE}/suppliers/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  deleteSupplier: (id: string) =>
    fetch(`${API_BASE}/suppliers/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse),

  // Inventory & Reorder Alerts
  getReorderAlerts: () => fetch(`${API_BASE}/inventory/reorder-alerts`, { headers: getAuthHeaders() }).then(handleResponse),
  getStockSummary: () => fetch(`${API_BASE}/inventory/stock-summary`, { headers: getAuthHeaders() }).then(handleResponse),
  reconcileInventory: () => fetch(`${API_BASE}/inventory/reconcile`, { method: 'POST', headers: getAuthHeaders() }).then(handleResponse),
  getStockLedger: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetch(`${API_BASE}/inventory/ledger${qs}`, { headers: getAuthHeaders() }).then(handleResponse);
  },

  // Purchasing
  getPurchases: () => fetch(`${API_BASE}/purchases`, { headers: getAuthHeaders() }).then(handleResponse),
  recordPurchase: (data: any) =>
    fetch(`${API_BASE}/purchases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  // Production
  getProductionRuns: () => fetch(`${API_BASE}/production/runs`, { headers: getAuthHeaders() }).then(handleResponse),
  getProductionPlan: () => fetch(`${API_BASE}/production/plan`, { headers: getAuthHeaders() }).then(handleResponse),
  executeProductionRun: (data: any) =>
    fetch(`${API_BASE}/production/runs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),
  updateRunOverheads: (runId: string, laborCost: number, overheadCost: number) =>
    fetch(`${API_BASE}/production/runs/${runId}/costs`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ laborCost, overheadCost })
    }).then(handleResponse),

  // Orders
  getOrders: () => fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() }).then(handleResponse),
  getMySalesSummary: () => fetch(`${API_BASE}/orders/mine/summary`, { headers: getAuthHeaders() }).then(handleResponse),
  createOrder: (data: any) =>
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),
  editOrder: (orderId: string, data: any) =>
    fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),
  syncOfflineBatch: (orders: any[]) =>
    fetch(`${API_BASE}/orders/sync-batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ orders })
    }).then(handleResponse),
  approveOrder: (orderId: string, approverName: string = 'Admin') =>
    fetch(`${API_BASE}/orders/${orderId}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ approverName })
    }).then(handleResponse),
  rejectOrder: (orderId: string, reason: string = 'Administrative review', rejectedBy: string = 'Admin') =>
    fetch(`${API_BASE}/orders/${orderId}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, rejectedBy })
    }).then(handleResponse),
  dispatchOrder: (invoiceId: string, dispatcherName: string = 'Admin') =>
    fetch(`${API_BASE}/orders/${invoiceId}/dispatch`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ dispatcherName })
    }).then(handleResponse),
  dispatchOrderWithItems: (invoiceId: string, items?: Array<{ productCode: string; quantity: number }>, dispatcherName: string = 'Admin') =>
    fetch(`${API_BASE}/invoices/${invoiceId}/dispatch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items, dispatcherName })
    }).then(handleResponse),

  // Invoices & PDF
  getInvoices: () => fetch(`${API_BASE}/invoices`, { headers: getAuthHeaders() }).then(handleResponse),
  cancelInvoice: (invoiceId: string, reason: string) =>
    fetch(`${API_BASE}/invoices/${invoiceId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    }).then(handleResponse),
  getInvoicePDFUrl: (invoiceId: string) => `${API_BASE}/invoices/${invoiceId}/pdf`,
  getCreditNotePDFUrl: (invoiceId: string) => `${API_BASE}/invoices/${invoiceId}/credit-note/pdf`,
  getEInvoiceJsonUrl: (invoiceId: string) => `${API_BASE}/invoices/${invoiceId}/einvoice-json`,
  generateMockEInvoice: (invoiceId: string) =>
    fetch(`${API_BASE}/invoices/${invoiceId}/einvoice/generate-mock`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Payments
  getPayments: () => fetch(`${API_BASE}/payments`, { headers: getAuthHeaders() }).then(handleResponse),
  recordPayment: (data: any) =>
    fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  // Reports (Section 4.6 & Auditor Portal)
  getPurchaseRegister: (from?: string, to?: string) =>
    fetch(`${API_BASE}/reports/purchase-register?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(handleResponse),
  getSalesRegister: (from?: string, to?: string) =>
    fetch(`${API_BASE}/reports/sales-register?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(handleResponse),
  getGSTSummary: (from?: string, to?: string) =>
    fetch(`${API_BASE}/reports/gst-summary?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(handleResponse),
  getProductionReport: (from?: string, to?: string) =>
    fetch(`${API_BASE}/reports/production-report?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(handleResponse),
  getOutstanding: () =>
    fetch(`${API_BASE}/reports/outstanding`, { headers: getAuthHeaders() }).then(handleResponse),
  getCustomerSales: (from?: string, to?: string) =>
    fetch(`${API_BASE}/reports/customer-sales?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(handleResponse),
  getProductSales: (from?: string, to?: string) =>
    fetch(`${API_BASE}/reports/product-sales?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(handleResponse),
  getCollections: (from?: string, to?: string) =>
    fetch(`${API_BASE}/reports/collections?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, { headers: getAuthHeaders() }).then(handleResponse),
  getStockLedgerRange: (from?: string, to?: string, itemId?: string) =>
    fetch(`${API_BASE}/reports/stock-ledger-range?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}), ...(itemId ? { itemId } : {}) })}`, { headers: getAuthHeaders() }).then(handleResponse),

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
  getOwnerOverview: () => fetch(`${API_BASE}/owner/overview`, { headers: getAuthHeaders() }).then(handleResponse),
  getAuditLogs: () => fetch(`${API_BASE}/audit-logs`, { headers: getAuthHeaders() }).then(handleResponse),

  // Settings & Factory Configuration
  getSettings: () => fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() }).then(handleResponse),

  // WhatsApp & OpenWA Automation
  getWhatsAppNotifications: () => fetch(`${API_BASE}/whatsapp/notifications`, { headers: getAuthHeaders() }).then(handleResponse),
  sendWhatsAppNotification: (data: any) =>
    fetch(`${API_BASE}/whatsapp/send-test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),
  getWhatsAppStatus: () => fetch(`${API_BASE}/whatsapp/status`, { headers: getAuthHeaders() }).then(handleResponse)
};
