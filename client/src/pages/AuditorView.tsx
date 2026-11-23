import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FileSpreadsheet, 
  Download, 
  RefreshCw,
  Calendar,
  Filter,
  FileText,
  FileCode
} from 'lucide-react';

export const AuditorView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases' | 'gst' | 'customers' | 'products' | 'collections' | 'outstanding' | 'production' | 'stock'>('sales');
  
  // Date range defaults: 1st of current month to today
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState<string>(firstDay);
  const [toDate, setToDate] = useState<string>(today);

  const [salesRegister, setSalesRegister] = useState<any[]>([]);
  const [purchaseRegister, setPurchaseRegister] = useState<any[]>([]);
  const [gstSummary, setGstSummary] = useState<any>(null);
  const [customerSales, setCustomerSales] = useState<any[]>([]);
  const [productSales, setProductSales] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [outstanding, setOutstanding] = useState<any[]>([]);
  const [productionRuns, setProductionRuns] = useState<any[]>([]);
  const [stockLedger, setStockLedger] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const fromISO = fromDate ? new Date(`${fromDate}T00:00:00.000Z`).toISOString() : undefined;
      const toISO = toDate ? new Date(`${toDate}T23:59:59.999Z`).toISOString() : undefined;

      const [sRes, purRes, gRes, oRes, pRes, csRes, psRes, colRes, stkRes] = await Promise.all([
        api.getSalesRegister(fromISO, toISO),
        api.getPurchaseRegister(fromISO, toISO).catch(() => ({ success: false, purchases: [] })),
        api.getGSTSummary(fromISO, toISO),
        api.getOutstanding(),
        api.getProductionReport(fromISO, toISO),
        api.getCustomerSales(fromISO, toISO),
        api.getProductSales(fromISO, toISO),
        api.getCollections(fromISO, toISO),
        api.getStockLedgerRange(fromISO, toISO)
      ]);

      if (sRes.success) setSalesRegister(sRes.register);
      if (purRes.success) setPurchaseRegister(purRes.purchases);
      if (gRes.success) setGstSummary(gRes.summary);
      if (oRes.success) setOutstanding(oRes.outstanding);
      if (pRes.success) setProductionRuns(pRes.runs);
      if (csRes.success) setCustomerSales(csRes.customers);
      if (psRes.success) setProductSales(psRes.products);
      if (colRes.success) setCollections(colRes.collections);
      if (stkRes.success) setStockLedger(stkRes.ledger);
    } catch (e) {
      console.error('Failed to load auditor reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    setExporting(true);
    try {
      const fromISO = fromDate ? new Date(`${fromDate}T00:00:00.000Z`).toISOString() : undefined;
      const toISO = toDate ? new Date(`${toDate}T23:59:59.999Z`).toISOString() : undefined;

      let endpoint = '/reports/sales-register';
      let filename = `Sales_Register_${fromDate}_to_${toDate}`;

      if (activeTab === 'purchases') {
        endpoint = '/reports/purchase-register';
        filename = `Purchase_Register_${fromDate}_to_${toDate}`;
      } else if (activeTab === 'gst') {
        endpoint = '/reports/gst-summary';
        filename = `GST_Summary_${fromDate}_to_${toDate}`;
      } else if (activeTab === 'customers') {
        endpoint = '/reports/customer-wise-sales';
        filename = `Customer_Wise_Sales_${fromDate}_to_${toDate}`;
      } else if (activeTab === 'products') {
        endpoint = '/reports/product-wise-sales';
        filename = `Product_Wise_Sales_${fromDate}_to_${toDate}`;
      } else if (activeTab === 'collections') {
        endpoint = '/reports/collections';
        filename = `Collections_Register_${fromDate}_to_${toDate}`;
      } else if (activeTab === 'outstanding') {
        endpoint = '/reports/outstanding';
        filename = `Outstanding_Aging_${toDate}`;
      } else if (activeTab === 'production') {
        endpoint = '/reports/production-report';
        filename = `Production_Variance_${fromDate}_to_${toDate}`;
      } else if (activeTab === 'stock') {
        endpoint = '/reports/stock-ledger-range';
        filename = `Stock_Ledger_${fromDate}_to_${toDate}`;
      }

      await api.downloadReportFile(endpoint, filename, format, fromISO, toISO);
    } catch (err: any) {
      alert('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const handleTallyExport = async () => {
    try {
      setExporting(true);
      const fromISO = fromDate ? new Date(`${fromDate}T00:00:00.000Z`).toISOString() : undefined;
      const toISO = toDate ? new Date(`${toDate}T23:59:59.999Z`).toISOString() : undefined;
      await api.downloadTallyXml(fromISO, toISO);
    } catch (err: any) {
      alert('Tally export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">External Auditor & Statutory Filing Desk</span>
          <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 mt-1">Audit Registers, GSTR-1 Summaries & Statutory Compliance</h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Section 170 GST compliant ledger reports with date range filtering, Excel (.xlsx) formatting with totals, and PDF export.
          </p>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-cream-100 px-3 py-1.5 rounded-xl border border-subtle-border text-xs">
            <Calendar className="w-3.5 h-3.5 text-forest-700" />
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent border-none text-charcoal-800 text-xs focus:outline-none"
            />
            <span className="text-charcoal-400">to</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent border-none text-charcoal-800 text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-forest-700 hover:bg-forest-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Apply</span>
          </button>
        </div>
      </div>

      {/* Tab Selectors & Export Dropdown */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-subtle-border pb-3">
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {[
            { id: 'sales', label: 'Sales Register' },
            { id: 'purchases', label: 'Purchase Register' },
            { id: 'gst', label: 'GSTR-1 & 3B Summary' },
            { id: 'customers', label: 'Customer-Wise' },
            { id: 'products', label: 'Product-Wise' },
            { id: 'collections', label: 'Collections' },
            { id: 'outstanding', label: 'Receivables & Aging' },
            { id: 'production', label: 'Production Variance' },
            { id: 'stock', label: 'Stock Ledger' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'bg-white text-charcoal-600 hover:bg-cream-100 border border-subtle-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Multi-Format Export Buttons */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-charcoal-400 font-medium">Export:</span>
          <button
            onClick={() => handleExport('xlsx')}
            disabled={exporting}
            className="inline-flex items-center space-x-1 bg-white hover:bg-cream-100 text-forest-800 border border-subtle-border px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
            title="Export full Excel workbook with formatted currency and summary totals row"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-forest-700" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="inline-flex items-center space-x-1 bg-white hover:bg-cream-100 text-charcoal-700 border border-subtle-border px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
            title="Export standard CSV for auditor import"
          >
            <Download className="w-3.5 h-3.5 text-charcoal-500" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="inline-flex items-center space-x-1 bg-white hover:bg-cream-100 text-red-700 border border-subtle-border px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
            title="Export printable PDF audit schedule"
          >
            <FileText className="w-3.5 h-3.5 text-red-600" />
            <span>PDF</span>
          </button>
          {activeTab === 'sales' && (
            <button
              onClick={handleTallyExport}
              disabled={exporting}
              className="inline-flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
              title="Export sales vouchers XML for Tally ERP 9 / Tally Prime import"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-700" />
              <span>Tally XML</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Sales Register */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">Sales Register ({salesRegister.length} records)</h2>
            <span className="text-xs text-charcoal-400">Values in ₹ (Rupees)</span>
          </div>

          {salesRegister.length === 0 ? (
            <p className="text-xs text-charcoal-500 py-6 text-center">No sales registered in selected period.</p>
          ) : (
            <div className="overflow-x-auto border border-subtle-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-charcoal-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">GSTIN</th>
                    <th className="p-3">Place of Supply</th>
                    <th className="p-3 text-right">Taxable (₹)</th>
                    <th className="p-3 text-right">CGST (₹)</th>
                    <th className="p-3 text-right">SGST (₹)</th>
                    <th className="p-3 text-right">IGST (₹)</th>
                    <th className="p-3 text-right font-bold">Total (₹)</th>
                    <th className="p-3 text-right">Paid (₹)</th>
                    <th className="p-3 text-right">Balance Due (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-divider">
                  {salesRegister.map((s, idx) => (
                    <tr key={idx} className="hover:bg-cream-50">
                      <td className="p-3 font-mono font-bold text-forest-700">{s.invoiceNumber}</td>
                      <td className="p-3 text-charcoal-500">{new Date(s.invoiceDate).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 font-medium text-charcoal-900">{s.customerName}</td>
                      <td className="p-3 font-mono text-charcoal-500 text-[11px]">{s.customerGstin || 'Unregistered'}</td>
                      <td className="p-3 text-charcoal-500">{s.placeOfSupply}</td>
                      <td className="p-3 text-right font-semibold text-charcoal-900">₹{s.taxableValue.toFixed(2)}</td>
                      <td className="p-3 text-right text-charcoal-500">₹{s.cgstTotal.toFixed(2)}</td>
                      <td className="p-3 text-right text-charcoal-500">₹{s.sgstTotal.toFixed(2)}</td>
                      <td className="p-3 text-right text-forest-700 font-medium">₹{s.igstTotal.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-charcoal-900">₹{s.grandTotal.toFixed(2)}</td>
                      <td className="p-3 text-right text-forest-700 font-bold">₹{s.paidAmount.toFixed(2)}</td>
                      <td className="p-3 text-right text-red-600 font-bold">₹{s.balanceDue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Purchase Register */}
      {activeTab === 'purchases' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">Purchase Register ({purchaseRegister.length} records)</h2>
            <span className="text-xs text-charcoal-400">Values in ₹ (Rupees)</span>
          </div>

          {purchaseRegister.length === 0 ? (
            <p className="text-xs text-charcoal-500 py-6 text-center">No purchases recorded for the selected date range.</p>
          ) : (
            <div className="overflow-x-auto border border-subtle-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-charcoal-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Purchase No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3 text-right">Items Count</th>
                    <th className="p-3 text-right">Total Amount (₹)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-divider">
                  {purchaseRegister.map(p => (
                    <tr key={p.purchaseNumber} className="hover:bg-cream-50 font-mono text-[11px]">
                      <td className="p-3 font-bold text-forest-700 font-sans">{p.purchaseNumber}</td>
                      <td className="p-3 text-charcoal-500 font-sans">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="p-3 text-charcoal-900 font-sans font-medium">{p.supplierName}</td>
                      <td className="p-3 text-right font-sans">{p.itemsCount}</td>
                      <td className="p-3 text-right font-bold text-charcoal-900 font-sans">₹{Number(p.totalAmount).toLocaleString('en-IN')}</td>
                      <td className="p-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-forest-100 text-forest-700">
                          {p.status || 'COMPLETED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GST Outward Summary (GSTR-1 & 3B Format) */}
      {activeTab === 'gst' && gstSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">Intra-State Supplies (Tamil Nadu)</span>
              <p className="text-2xl font-bold text-charcoal-900">₹{gstSummary.intraState.taxableValue.toLocaleString('en-IN')}</p>
              <div className="text-xs text-charcoal-500 pt-2 border-t border-subtle-divider flex justify-between">
                <span>CGST (2.5%): <strong>₹{gstSummary.intraState.cgst.toFixed(2)}</strong></span>
                <span>SGST (2.5%): <strong>₹{gstSummary.intraState.sgst.toFixed(2)}</strong></span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">Inter-State Supplies (IGST)</span>
              <p className="text-2xl font-bold text-forest-700">₹{gstSummary.interState.taxableValue.toLocaleString('en-IN')}</p>
              <div className="text-xs text-charcoal-500 pt-2 border-t border-subtle-divider">
                <span>IGST Total (5.0%): <strong>₹{gstSummary.interState.igst.toFixed(2)}</strong></span>
              </div>
            </div>

            <div className="bg-forest-700 text-cream-50 rounded-2xl p-6 shadow-sm border border-forest-800 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-forest-200">Net Outward Turnover (Post Credit Notes)</span>
              <p className="text-2xl font-bold text-white">₹{gstSummary.grandTotals.netOutwardValue.toLocaleString('en-IN')}</p>
              <div className="text-xs text-forest-200 pt-2 border-t border-forest-600 flex justify-between">
                <span>Net Taxable: ₹{gstSummary.grandTotals.netTaxable.toFixed(2)}</span>
                <span>Net Tax: ₹{gstSummary.grandTotals.netTax.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* GSTR-1 Table 4: B2B Invoices */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">GSTR-1 Table 4: B2B Invoices</h3>
            <div className="overflow-x-auto border border-subtle-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-charcoal-500 font-semibold uppercase">
                  <tr>
                    <th className="p-2.5">Invoice No</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Customer GSTIN</th>
                    <th className="p-2.5">Customer Name</th>
                    <th className="p-2.5">Place of Supply</th>
                    <th className="p-2.5 text-right">Taxable (₹)</th>
                    <th className="p-2.5 text-right">CGST (₹)</th>
                    <th className="p-2.5 text-right">SGST (₹)</th>
                    <th className="p-2.5 text-right">IGST (₹)</th>
                    <th className="p-2.5 text-right">Invoice Value (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-divider">
                  {gstSummary.gstr1.b2b.map((inv: any, idx: number) => (
                    <tr key={idx} className="hover:bg-cream-50">
                      <td className="p-2.5 font-mono font-bold text-forest-700">{inv.invoiceNumber}</td>
                      <td className="p-2.5">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-2.5 font-mono text-[11px]">{inv.customerGstin}</td>
                      <td className="p-2.5">{inv.customerName}</td>
                      <td className="p-2.5">{inv.placeOfSupply}</td>
                      <td className="p-2.5 text-right font-semibold">₹{inv.taxableValue.toFixed(2)}</td>
                      <td className="p-2.5 text-right">₹{inv.cgst.toFixed(2)}</td>
                      <td className="p-2.5 text-right">₹{inv.sgst.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-medium text-forest-700">₹{inv.igst.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold">₹{inv.totalValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GSTR-1 Table 12: HSN Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">GSTR-1 Table 12: HSN Summary of Outward Supplies</h3>
            <div className="overflow-x-auto border border-subtle-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-charcoal-500 font-semibold uppercase">
                  <tr>
                    <th className="p-2.5">HSN Code</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">UQC</th>
                    <th className="p-2.5 text-right">Total Qty</th>
                    <th className="p-2.5 text-right">Taxable Value (₹)</th>
                    <th className="p-2.5 text-right">CGST (₹)</th>
                    <th className="p-2.5 text-right">SGST (₹)</th>
                    <th className="p-2.5 text-right">IGST (₹)</th>
                    <th className="p-2.5 text-right">Total Tax (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-divider">
                  {gstSummary.gstr1.hsnSummary.map((hsn: any, idx: number) => (
                    <tr key={idx} className="hover:bg-cream-50">
                      <td className="p-2.5 font-mono font-bold text-forest-700">{hsn.hsnCode}</td>
                      <td className="p-2.5">{hsn.description}</td>
                      <td className="p-2.5 text-right">{hsn.uqc}</td>
                      <td className="p-2.5 text-right font-semibold">{hsn.totalQuantity}</td>
                      <td className="p-2.5 text-right font-semibold">₹{hsn.taxableValue.toFixed(2)}</td>
                      <td className="p-2.5 text-right">₹{hsn.cgst.toFixed(2)}</td>
                      <td className="p-2.5 text-right">₹{hsn.sgst.toFixed(2)}</td>
                      <td className="p-2.5 text-right">₹{hsn.igst.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold text-forest-700">₹{hsn.totalTax.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Customer-Wise Sales */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">Customer-Wise Sales Analysis</h2>
          {customerSales.length === 0 ? (
            <p className="text-xs text-charcoal-500 py-6 text-center">No customer sales data available.</p>
          ) : (
            <div className="overflow-x-auto border border-subtle-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-charcoal-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">State</th>
                    <th className="p-3">GSTIN</th>
                    <th className="p-3 text-right">Total Invoices</th>
                    <th className="p-3 text-right">Taxable (₹)</th>
                    <th className="p-3 text-right">Total Tax (₹)</th>
                    <th className="p-3 text-right font-bold">Total Sales (₹)</th>
                    <th className="p-3 text-right">Paid (₹)</th>
                    <th className="p-3 text-right">Balance Due (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-divider">
                  {customerSales.map((c, idx) => (
                    <tr key={idx} className="hover:bg-cream-50">
                      <td className="p-3 font-bold text-charcoal-900">{c.customerName}</td>
                      <td className="p-3 text-charcoal-500">{c.state}</td>
                      <td className="p-3 font-mono text-[11px] text-charcoal-500">{c.gstin || 'Unregistered'}</td>
                      <td className="p-3 text-right">{c.invoiceCount}</td>
                      <td className="p-3 text-right font-semibold">₹{c.totalTaxable.toFixed(2)}</td>
                      <td className="p-3 text-right">₹{c.totalTax.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-charcoal-900">₹{c.totalSales.toFixed(2)}</td>
                      <td className="p-3 text-right text-forest-700 font-semibold">₹{c.totalPaid.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-red-600">₹{c.balanceDue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Product-Wise Sales */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">Product-Wise Sales & Volume</h2>
          {productSales.length === 0 ? (
            <p className="text-xs text-charcoal-500 py-6 text-center">No product sales recorded in selected period.</p>
          ) : (
            <div className="overflow-x-auto border border-subtle-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-charcoal-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">SKU Code</th>
                    <th className="p-3">HSN Code</th>
                    <th className="p-3 text-right">Total Quantity Sold</th>
                    <th className="p-3 text-right">Average Price (₹)</th>
                    <th className="p-3 text-right font-bold">Total Sales (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-divider">
                  {productSales.map((p, idx) => (
                    <tr key={idx} className="hover:bg-cream-50">
                      <td className="p-3 font-bold text-charcoal-900">{p.productName}</td>
                      <td className="p-3 font-mono text-forest-700">{p.productCode}</td>
                      <td className="p-3 font-mono text-charcoal-500">{p.hsnCode}</td>
                      <td className="p-3 text-right font-semibold">{p.totalQuantity} pkts</td>
                      <td className="p-3 text-right">₹{p.averagePrice.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-charcoal-900">₹{p.totalRevenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Collections Register */}
      {activeTab === 'collections' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">Collections & Payment Receipts</h2>
          {collections.length === 0 ? (
            <p className="text-xs text-charcoal-500 py-6 text-center">No payments collected in selected period.</p>
          ) : (
            <div className="overflow-x-auto border border-subtle-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-charcoal-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Payment Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Invoice Ref</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3">Reference / UTR</th>
                    <th className="p-3 text-right font-bold">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-divider">
                  {collections.map((col, idx) => (
                    <tr key={idx} className="hover:bg-cream-50">
                      <td className="p-3 font-mono font-bold text-forest-700">{col.paymentNumber}</td>
                      <td className="p-3 text-charcoal-500">{new Date(col.paymentDate).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 font-bold text-charcoal-900">{col.customerName}</td>
                      <td className="p-3 font-mono text-charcoal-600">{col.invoiceNumber || 'On Account'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cream-200 text-charcoal-800">
                          {col.paymentMode}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-charcoal-500">{col.reference || '—'}</td>
                      <td className="p-3 text-right font-bold text-forest-700">₹{col.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Outstanding Receivables & Aging */}
      {activeTab === 'outstanding' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">Customer Outstanding & 30/60/90-Day Aging</h2>
          {outstanding.length === 0 ? (
            <p className="text-xs text-charcoal-500 py-6 text-center">Zero outstanding balances. All customer accounts settled.</p>
          ) : (
            <div className="overflow-x-auto border border-subtle-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-charcoal-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">State</th>
                    <th className="p-3 text-right">Credit Limit (₹)</th>
                    <th className="p-3 text-right">0-30 Days (Current)</th>
                    <th className="p-3 text-right">31-60 Days</th>
                    <th className="p-3 text-right">61-90 Days</th>
                    <th className="p-3 text-right">&gt; 90 Days</th>
                    <th className="p-3 text-right font-bold">Total Due (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-divider">
                  {outstanding.map((c, idx) => (
                    <tr key={idx} className="hover:bg-cream-50">
                      <td className="p-3 font-bold text-charcoal-900">{c.customerName}</td>
                      <td className="p-3 text-charcoal-500">{c.state}</td>
                      <td className="p-3 text-right text-charcoal-500">₹{c.creditLimit.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-semibold text-forest-700">₹{c.aging.current.toFixed(2)}</td>
                      <td className="p-3 text-right text-amber-700">₹{c.aging.days31to60.toFixed(2)}</td>
                      <td className="p-3 text-right text-orange-700">₹{c.aging.days61to90.toFixed(2)}</td>
                      <td className="p-3 text-right text-red-600">₹{c.aging.over90days.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-red-700">₹{c.totalOutstanding.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: Production Variance Report */}
      {activeTab === 'production' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">Planned vs Actual Production Consumption & Yield</h2>
          {productionRuns.length === 0 ? (
            <p className="text-xs text-charcoal-500 py-6 text-center">No production runs recorded.</p>
          ) : (
            <div className="overflow-x-auto border border-subtle-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-charcoal-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Run No</th>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-right">Standard Yield</th>
                    <th className="p-3 text-right">Actual Output</th>
                    <th className="p-3 text-right">Yield Variance</th>
                    <th className="p-3 text-right">Damaged Pouches</th>
                    <th className="p-3 text-right">Total Cost (₹)</th>
                    <th className="p-3 text-right">Cost/Packet (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-divider">
                  {productionRuns.map(r => (
                    <tr key={r._id} className="hover:bg-cream-50">
                      <td className="p-3 font-mono font-bold text-forest-700">{r.runNumber}</td>
                      <td className="p-3 font-medium text-charcoal-900">{r.productName}</td>
                      <td className="p-3 text-right text-charcoal-500">{r.batchExpectedOutput} pkts</td>
                      <td className="p-3 text-right font-bold text-charcoal-900">{r.actualOutputPackets} pkts</td>
                      <td className="p-3 text-right font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          r.yieldVarianceFlagged ? 'bg-red-100 text-red-800' : 'bg-forest-100 text-forest-700'
                        }`}>
                          {r.yieldVariancePercent}%
                        </span>
                      </td>
                      <td className="p-3 text-right text-amber-700 font-bold">{r.damagedPouches} pcs</td>
                      <td className="p-3 text-right font-semibold text-charcoal-900">₹{r.totalProductionCost.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-forest-700">₹{r.costPerPacket.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: Stock Ledger Range */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">Authoritative Stock Ledger Audit Trail</h2>
          {stockLedger.length === 0 ? (
            <p className="text-xs text-charcoal-500 py-6 text-center">No stock movements recorded in selected period.</p>
          ) : (
            <div className="overflow-x-auto border border-subtle-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-charcoal-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Movement Type</th>
                    <th className="p-3 text-right">In Quantity</th>
                    <th className="p-3 text-right">Out Quantity</th>
                    <th className="p-3 text-right">Balance Qty</th>
                    <th className="p-3 text-right">Unit Rate (₹)</th>
                    <th className="p-3">Reference Doc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-divider">
                  {stockLedger.map((m, idx) => (
                    <tr key={idx} className="hover:bg-cream-50">
                      <td className="p-3 text-charcoal-500">{new Date(m.timestamp).toLocaleString('en-IN')}</td>
                      <td className="p-3 font-bold text-charcoal-900">{m.itemName}</td>
                      <td className="p-3 text-charcoal-500">{m.itemType}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cream-200 text-charcoal-800">
                          {m.movementType}
                        </span>
                      </td>
                      <td className="p-3 text-right text-forest-700 font-semibold">{m.quantityIn ? `${m.quantityIn} ${m.unit}` : '—'}</td>
                      <td className="p-3 text-right text-red-600 font-semibold">{m.quantityOut ? `${m.quantityOut} ${m.unit}` : '—'}</td>
                      <td className="p-3 text-right font-bold text-charcoal-900">{m.balanceQuantity} {m.unit}</td>
                      <td className="p-3 text-right">₹{m.unitRate.toFixed(2)}</td>
                      <td className="p-3 font-mono text-charcoal-500">{m.referenceDocument || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
