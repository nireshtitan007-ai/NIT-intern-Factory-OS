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

  // Admin Control Centre & Overview
  getAdminOverview: () =>
    fetch(`${API_BASE}/admin/overview`, {
      headers: getAuthHeaders()
    }).then(r => r.json()),

  // Benchmark
  seedBenchmark: () => fetch(`${API_BASE}/benchmark/seed`, { method: 'POST' }).then(r => r.json()),
  runBenchmark: () => fetch(`${API_BASE}/benchmark/run`, { method: 'POST' }).then(r => r.json()),

  // Masters
  getCustomers: () => fetch(`${API_BASE}/customers`, { headers: getAuthHeaders() }).then(r => r.json()),
  getProducts: () => fetch(`${API_BASE}/products`, { headers: getAuthHeaders() }).then(r => r.json()),
  getRawMaterials: () => fetch(`${API_BASE}/raw-materials`, { headers: getAuthHeaders() }).then(r => r.json()),
  getBOMs: () => fetch(`${API_BASE}/boms`, { headers: getAuthHeaders() }).then(r => r.json()),

  // Inventory
  getStockSummary: () => fetch(`${API_BASE}/inventory/stock-summary`, { headers: getAuthHeaders() }).then(r => r.json()),
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
  createOrder: (data: any) => 
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
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

  // Invoices & PDF
  getInvoices: () => fetch(`${API_BASE}/invoices`, { headers: getAuthHeaders() }).then(r => r.json()),
  getInvoicePDFUrl: (invoiceId: string) => `${API_BASE}/invoices/${invoiceId}/pdf`,

  // Payments
  getPayments: () => fetch(`${API_BASE}/payments`, { headers: getAuthHeaders() }).then(r => r.json()),
  recordPayment: (data: any) => 
    fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // Reports
  getSalesRegister: () => fetch(`${API_BASE}/reports/sales-register`, { headers: getAuthHeaders() }).then(r => r.json()),
  getGSTSummary: () => fetch(`${API_BASE}/reports/gst-summary`, { headers: getAuthHeaders() }).then(r => r.json()),
  getProductionReport: () => fetch(`${API_BASE}/reports/production-report`, { headers: getAuthHeaders() }).then(r => r.json()),
  getOutstanding: () => fetch(`${API_BASE}/reports/outstanding`, { headers: getAuthHeaders() }).then(r => r.json()),

  // CSV Exports
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
