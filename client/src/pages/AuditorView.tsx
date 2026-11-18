import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FileSpreadsheet, 
  Download, 
  RefreshCw 
} from 'lucide-react';

export const AuditorView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'gst' | 'outstanding' | 'production'>('sales');
  const [salesRegister, setSalesRegister] = useState<any[]>([]);
  const [gstSummary, setGstSummary] = useState<any>(null);
  const [outstanding, setOutstanding] = useState<any[]>([]);
  const [productionRuns, setProductionRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, gRes, oRes, pRes] = await Promise.all([
        api.getSalesRegister(),
        api.getGSTSummary(),
        api.getOutstanding(),
        api.getProductionReport()
      ]);
      if (sRes.success) setSalesRegister(sRes.register);
      if (gRes.success) setGstSummary(gRes.summary);
      if (oRes.success) setOutstanding(oRes.outstanding);
      if (pRes.success) setProductionRuns(pRes.runs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">External Auditor & Statutory Filing Desk</span>
          <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 mt-1">Audit Registers, GSTR-1 Summaries & Receivables Aging</h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Replaces manual reconciliation with exportable tax registers and complete audit trails.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="flex items-center space-x-2 bg-cream-100 hover:bg-cream-300 text-charcoal-700 px-4 py-2 rounded-xl text-xs font-semibold border border-subtle-border transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* Tab Selectors & Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-border pb-3">
        <div className="flex space-x-2 overflow-x-auto">
          {[
            { id: 'sales', label: 'Sales Register' },
            { id: 'gst', label: 'GST Outward Summary (GSTR-1)' },
            { id: 'outstanding', label: 'Receivables & Aging' },
            { id: 'production', label: 'Production Variance Report' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'bg-white text-charcoal-500 hover:bg-cream-100 border border-subtle-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick CSV Export for Active Tab */}
        <div>
          {activeTab === 'sales' && (
            <a
              href={api.exportSalesRegisterCSV()}
              className="inline-flex items-center space-x-1.5 bg-forest-700 hover:bg-forest-800 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Sales CSV</span>
            </a>
          )}
          {activeTab === 'production' && (
            <a
              href={api.exportProductionCSV()}
              className="inline-flex items-center space-x-1.5 bg-forest-700 hover:bg-forest-800 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Production CSV</span>
            </a>
          )}
        </div>
      </div>

      {/* TAB 1: Sales Register */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">Monthly Sales Register</h2>
          {salesRegister.length === 0 ? (
            <p className="text-xs text-charcoal-500 py-6 text-center">No sales registered yet.</p>
          ) : (
            <div className="overflow-x-auto border border-subtle-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-charcoal-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Place of Supply</th>
                    <th className="p-3 text-right">Taxable (₹)</th>
                    <th className="p-3 text-right">CGST (₹)</th>
                    <th className="p-3 text-right">SGST (₹)</th>
                    <th className="p-3 text-right">IGST (₹)</th>
                    <th className="p-3 text-right">Grand Total (₹)</th>
                    <th className="p-3 text-right">Paid (₹)</th>
                    <th className="p-3 text-right">Balance Due (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-divider">
                  {salesRegister.map((s, idx) => (
                    <tr key={idx} className="hover:bg-cream-50">
                      <td className="p-3 font-mono font-bold text-forest-700">{s.invoiceNumber}</td>
                      <td className="p-3 font-medium text-charcoal-900">{s.customerName}</td>
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

      {/* TAB 2: GST Outward Summary (GSTR-1 Format) */}
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
              <span className="text-xs font-bold uppercase tracking-wider text-forest-200">Total Outward Turnover</span>
              <p className="text-2xl font-bold text-white">₹{gstSummary.grandTotals.totalOutwardValue.toLocaleString('en-IN')}</p>
              <div className="text-xs text-forest-200 pt-2 border-t border-forest-600 flex justify-between">
                <span>Taxable: ₹{gstSummary.grandTotals.totalTaxable.toFixed(2)}</span>
                <span>Total GST: ₹{gstSummary.grandTotals.totalTax.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-2">Auditor GSTR-1 Mapping Guide</h3>
            <p className="text-xs text-charcoal-500">
              Taxable values map to GSTR-1 Table 4 (B2B Supplies). Intra-state tax maps to CGST/SGST ledger heads; inter-state supplies (e.g. Karnataka) map to IGST head.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: Outstanding Receivables & Aging */}
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

      {/* TAB 4: Production Variance Report */}
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
    </div>
  );
};
