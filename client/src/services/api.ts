const API_BASE = '/api';

export const api = {
  // Benchmark
  seedBenchmark: () => fetch(`${API_BASE}/benchmark/seed`, { method: 'POST' }).then(r => r.json()),
  runBenchmark: () => fetch(`${API_BASE}/benchmark/run`, { method: 'POST' }).then(r => r.json()),

  // Masters
  getCustomers: () => fetch(`${API_BASE}/customers`).then(r => r.json()),
  getProducts: () => fetch(`${API_BASE}/products`).then(r => r.json()),
  getRawMaterials: () => fetch(`${API_BASE}/raw-materials`).then(r => r.json()),
  getBOMs: () => fetch(`${API_BASE}/boms`).then(r => r.json()),

  // Inventory
  getStockSummary: () => fetch(`${API_BASE}/inventory/stock-summary`).then(r => r.json()),
  getStockLedger: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetch(`${API_BASE}/inventory/ledger${qs}`).then(r => r.json());
  },

  // Purchasing
  getPurchases: () => fetch(`${API_BASE}/purchases`).then(r => r.json()),
  recordPurchase: (data: any) => 
    fetch(`${API_BASE}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // Production
  getProductionRuns: () => fetch(`${API_BASE}/production/runs`).then(r => r.json()),
  executeProductionRun: (data: any) => 
    fetch(`${API_BASE}/production/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  updateRunOverheads: (runId: string, laborCost: number, overheadCost: number) => 
    fetch(`${API_BASE}/production/runs/${runId}/costs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ laborCost, overheadCost })
    }).then(r => r.json()),

  // Orders
  getOrders: () => fetch(`${API_BASE}/orders`).then(r => r.json()),
  createOrder: (data: any) => 
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  syncOfflineBatch: (orders: any[]) => 
    fetch(`${API_BASE}/orders/sync-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders })
    }).then(r => r.json()),
  approveOrder: (orderId: string, approverName: string = 'Admin') => 
    fetch(`${API_BASE}/orders/${orderId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approverName })
    }).then(r => r.json()),
  dispatchOrder: (invoiceId: string, dispatcherName: string = 'Admin') => 
    fetch(`${API_BASE}/orders/${invoiceId}/dispatch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dispatcherName })
    }).then(r => r.json()),

  // Invoices & PDF
  getInvoices: () => fetch(`${API_BASE}/invoices`).then(r => r.json()),
  getInvoicePDFUrl: (invoiceId: string) => `${API_BASE}/invoices/${invoiceId}/pdf`,

  // Payments
  getPayments: () => fetch(`${API_BASE}/payments`).then(r => r.json()),
  recordPayment: (data: any) => 
    fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // Reports
  getSalesRegister: () => fetch(`${API_BASE}/reports/sales-register`).then(r => r.json()),
  getGSTSummary: () => fetch(`${API_BASE}/reports/gst-summary`).then(r => r.json()),
  getProductionReport: () => fetch(`${API_BASE}/reports/production-report`).then(r => r.json()),
  getOutstanding: () => fetch(`${API_BASE}/reports/outstanding`).then(r => r.json()),

  // CSV Exports
  exportSalesRegisterCSV: () => `${API_BASE}/reports/sales-register?format=csv`,
  exportStockSummaryCSV: () => `${API_BASE}/inventory/stock-summary?format=csv`,
  exportProductionCSV: () => `${API_BASE}/reports/production-report?format=csv`,

  // Owner Overview
  getOwnerOverview: () => fetch(`${API_BASE}/owner/overview`).then(r => r.json()),
  getAuditLogs: () => fetch(`${API_BASE}/audit-logs`).then(r => r.json())
};

