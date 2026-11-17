import React, { useState, useEffect } from 'react';
import { StockSummaryItem, StockMovement, RawMaterial } from '../types';
import { api } from '../services/api';
import { 
  Boxes, 
  Download, 
  PlusCircle, 
  History, 
  RefreshCw, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight 
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const [summary, setSummary] = useState<StockSummaryItem[]>([]);
  const [ledger, setLedger] = useState<StockMovement[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Purchase form state
  const [purchaseMaterialCode, setPurchaseMaterialCode] = useState<string>('FLOUR');
  const [purchaseQty, setPurchaseQty] = useState<number>(60);
  const [purchaseRate, setPurchaseRate] = useState<number>(45);
  const [supplierName, setSupplierName] = useState<string>('Premier Milling Corp');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, lRes, mRes] = await Promise.all([
        api.getStockSummary(),
        api.getStockLedger(),
        api.getRawMaterials()
      ]);
      if (sRes.success) setSummary(sRes.summary);
      if (lRes.success) setLedger(lRes.movements);
      if (mRes.success) setMaterials(mRes.materials);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseMaterialCode || purchaseQty <= 0 || purchaseRate <= 0) return;

    setLoading(true);
    try {
      const res = await api.recordPurchase({
        supplierName,
        items: [{ materialCode: purchaseMaterialCode, quantity: purchaseQty, rate: purchaseRate }],
        notes: 'Recorded via Inventory Desk'
      });
      if (res.success) {
        setNotification(`Purchase ${res.purchase.purchaseNumber} recorded! Stock credited to ledger.`);
        loadData();
      } else {
        alert(res.error || 'Failed to record purchase');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Double-Entry Stock Ledger</span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Inventory Balances & Traceable Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative stock derived from immutable movements. Opening + Receipts − Issues/Sales = Closing Balance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={api.exportStockSummaryCSV()}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Stock CSV</span>
          </a>

          <button
            onClick={loadData}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">Dismiss</button>
        </div>
      )}

      {/* Grid: Purchase Entry & Stock Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Purchase Goods Receipt Form (Benchmark Step 1) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>Record Material Purchase</span>
            </h2>
            <span className="text-[11px] text-slate-400">Section 5 Step 1: Purchase 60 kg Flour @ ₹45</span>
          </div>

          <form onSubmit={handleRecordPurchase} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Supplier Name</label>
              <input
                type="text"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Raw Material</label>
              <select
                value={purchaseMaterialCode}
                onChange={e => setPurchaseMaterialCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
              >
                {materials.map(m => (
                  <option key={m.code} value={m.code}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity</label>
                <input
                  type="number"
                  value={purchaseQty}
                  onChange={e => setPurchaseQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rate (₹/unit)</label>
                <input
                  type="number"
                  value={purchaseRate}
                  onChange={e => setPurchaseRate(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Purchase Total:</span>
              <span className="text-slate-900 text-sm">₹{(purchaseQty * purchaseRate).toLocaleString('en-IN')}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold shadow transition"
            >
              Post Purchase Receipt & Recalculate WAC
            </button>
          </form>
        </div>

        {/* Right: Stock Balances Summary Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <Boxes className="w-4 h-4 text-indigo-600" />
            <span>Always-Current Inventory Summary</span>
          </h2>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase">
                <tr>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Opening</th>
                  <th className="p-3 text-right">Receipts</th>
                  <th className="p-3 text-right">Issues/Sales</th>
                  <th className="p-3 text-right">Closing Stock</th>
                  <th className="p-3 text-right">Rate (₹)</th>
                  <th className="p-3 text-right">Valuation (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">{item.name}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.category === 'FINISHED_GOOD' ? 'bg-indigo-100 text-indigo-800' :
                        item.category === 'PACKAGING' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-600">{item.openingStock} {item.unit}</td>
                    <td className="p-3 text-right font-medium text-emerald-700">+{item.receipts}</td>
                    <td className="p-3 text-right font-medium text-red-600">-{item.issuesOrSales}</td>
                    <td className="p-3 text-right font-black text-slate-900">{item.closingStock} {item.unit}</td>
                    <td className="p-3 text-right text-slate-600">₹{item.rate.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">₹{item.stockValue.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full Movement Ledger */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
          <History className="w-4 h-4 text-indigo-600" />
          <span>Authoritative Stock Movement Ledger (Audit Trail)</span>
        </h2>

        {ledger.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No ledger movements recorded yet.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Item</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Source Ref</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Running Balance</th>
                  <th className="p-3">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {ledger.map(m => (
                  <tr key={m._id} className="hover:bg-slate-50/80">
                    <td className="p-3 text-slate-500 font-sans">{new Date(m.createdAt).toLocaleTimeString('en-IN')}</td>
                    <td className="p-3 font-sans font-bold text-slate-900">{m.itemName}</td>
                    <td className="p-3 font-sans">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        m.quantity > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {m.movementType}
                      </span>
                    </td>
                    <td className="p-3 text-indigo-600 font-sans font-semibold">{m.sourceDocId || m.sourceDocType}</td>
                    <td className={`p-3 text-right font-black ${m.quantity > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`} {m.unit}
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900">{m.runningBalance} {m.unit}</td>
                    <td className="p-3 text-slate-500 font-sans">{m.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
