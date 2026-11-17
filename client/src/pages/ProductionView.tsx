import React, { useState, useEffect } from 'react';
import { ProductionRun, Product, RawMaterial } from '../types';
import { api } from '../services/api';
import { 
  Factory, 
  AlertTriangle, 
  CheckCircle, 
  Layers, 
  Percent, 
  DollarSign, 
  RefreshCw, 
  Play 
} from 'lucide-react';

export const ProductionView: React.FC = () => {
  const [runs, setRuns] = useState<ProductionRun[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form inputs for batch run
  const [flourQty, setFlourQty] = useState<number>(40);
  const [oilQty, setOilQty] = useState<number>(10.5);
  const [spiceQty, setSpiceQty] = useState<number>(1.2);
  const [goodOutput, setGoodOutput] = useState<number>(188);
  const [damagedPouches, setDamagedPouches] = useState<number>(6);
  const [cartonsUsed, setCartonsUsed] = useState<number>(9);
  const [laborCost, setLaborCost] = useState<number>(1200);
  const [overheadCost, setOverheadCost] = useState<number>(600);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, mRes] = await Promise.all([
        api.getProductionRuns(),
        api.getProducts(),
        api.getRawMaterials()
      ]);
      if (rRes.success) setRuns(rRes.runs);
      if (pRes.success) setProducts(pRes.products);
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

  const handleExecuteRun = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.code === 'MUR-200G');
    if (!product) return;

    setLoading(true);
    try {
      const res = await api.executeProductionRun({
        productId: product._id,
        batchExpectedOutput: 200,
        materialIssues: [
          { materialCode: 'FLOUR', actualQtyIssued: flourQty },
          { materialCode: 'COOKING-OIL', actualQtyIssued: oilQty },
          { materialCode: 'SPICE-MIX', actualQtyIssued: spiceQty }
        ],
        actualOutputPackets: goodOutput,
        damagedPouches,
        cartonsUsed,
        directLaborCost: laborCost,
        directOverheadCost: overheadCost,
        supervisorName: 'Floor Supervisor'
      });

      if (res.success) {
        setNotification(`Production Run ${res.run.runNumber} saved! Raw materials deducted and finished goods credited.`);
        loadData();
      } else {
        alert(res.error || 'Failed to execute production run');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const murukku = products.find(p => p.code === 'MUR-200G');

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Production Loop & BOM Engine</span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Recipe-Based Production & Planned vs Actual Variance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard Batch = 200 packets | Tolerance = ±3% | Automatic double-entry inventory movement
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">Dismiss</button>
        </div>
      )}

      {/* Grid: Production Logger Form & Standard Recipe (BOM) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Run Input Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <Factory className="w-4 h-4 text-indigo-600" />
              <span>Log Daily Production Run (Murukku 200 g)</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500">Benchmark Step 2 & 3 Preset</span>
          </div>

          <form onSubmit={handleExecuteRun} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase">1. Raw Materials Issued (Actual vs Standard)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Flour (Standard: 40 kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={flourQty}
                    onChange={e => setFlourQty(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Cooking Oil (Standard: 10 L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={oilQty}
                    onChange={e => setOilQty(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                  <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">+0.5 L over standard (+5%)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Spice Mix (Standard: 1.2 kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={spiceQty}
                    onChange={e => setSpiceQty(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase">2. Output & Packaging Consumed</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Good Output Packets (Std: 200)</label>
                  <input
                    type="number"
                    value={goodOutput}
                    onChange={e => setGoodOutput(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                  <span className="text-[10px] text-red-600 font-semibold mt-0.5 block">188 pkts = 94% yield (-6% variance)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Damaged Pouches (Scrap)</label>
                  <input
                    type="number"
                    value={damagedPouches}
                    onChange={e => setDamagedPouches(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Total pouches: {goodOutput + damagedPouches}</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Cartons Used (holds 20 pkts)</label>
                  <input
                    type="number"
                    value={cartonsUsed}
                    onChange={e => setCartonsUsed(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase">3. Production Overheads (Section 5 Step 8)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Direct Labour Cost (₹)</label>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={e => setLaborCost(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Power, Gas & Overheads (₹)</label>
                  <input
                    type="number"
                    value={overheadCost}
                    onChange={e => setOverheadCost(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-bold shadow-md transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Save Production Run & Recompute Balances</span>
            </button>
          </form>
        </div>

        {/* Right: Master Recipe & Live Cost Intelligence */}
        <div className="space-y-6">
          {/* Recipe Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Standard Recipe (BOM)</span>
            </h3>
            <p className="text-xs text-slate-500">1 Standard Batch = 200 packets</p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Flour:</span>
                <span className="font-bold text-slate-900">40 kg @ ₹42-45/kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Cooking Oil:</span>
                <span className="font-bold text-slate-900">10 L @ ₹140/L</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Spice Mix:</span>
                <span className="font-bold text-slate-900">1.2 kg @ ₹200/kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">200g Pouch:</span>
                <span className="font-bold text-slate-900">200 pcs @ ₹2.50</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Carton (20 pkts):</span>
                <span className="font-bold text-slate-900">10 pcs @ ₹15</span>
              </div>
            </div>
          </div>

          {/* Costing Card */}
          {runs.length > 0 && (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-lg space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Latest Run Cost Breakdown</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Materials:</span>
                  <span className="font-bold">₹{runs[0].totalMaterialCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Direct Labour:</span>
                  <span className="font-bold">₹{runs[0].directLaborCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Overheads (Power/Gas):</span>
                  <span className="font-bold">₹{runs[0].directOverheadCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2 font-bold text-sm">
                  <span>Total Batch Cost:</span>
                  <span className="text-indigo-300">₹{runs[0].totalProductionCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-indigo-900/60 p-3 rounded-xl border border-indigo-700/50 mt-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-indigo-200 block">Unit Cost Per Packet</span>
                  <span className="text-xl font-black text-white">₹{runs[0].costPerPacket.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-300 block">Gross Margin</span>
                  <span className="text-sm font-bold text-emerald-400">
                    ₹{(50 - runs[0].costPerPacket).toFixed(2)} ({Math.round(((50 - runs[0].costPerPacket) / 50) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Production Run History & Variance Flags Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
          <Percent className="w-4 h-4 text-indigo-600" />
          <span>Production Runs & Variance Ledger</span>
        </h2>

        {runs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No production runs logged yet.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase">
                <tr>
                  <th className="p-3">Run No</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Expected Output</th>
                  <th className="p-3">Actual Output</th>
                  <th className="p-3">Yield %</th>
                  <th className="p-3">Yield Variance</th>
                  <th className="p-3">Material Variances</th>
                  <th className="p-3">Cost/Packet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map(run => (
                  <tr key={run._id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-extrabold text-indigo-600">{run.runNumber}</td>
                    <td className="p-3 font-medium text-slate-900">{run.productName}</td>
                    <td className="p-3 text-slate-600">{run.batchExpectedOutput} pkts</td>
                    <td className="p-3 font-bold text-slate-900">{run.actualOutputPackets} pkts</td>
                    <td className="p-3 font-semibold text-slate-800">{run.yieldPercent}%</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        run.yieldVarianceFlagged ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {run.yieldVariancePercent}% {run.yieldVarianceFlagged ? '(FLAGGED)' : ''}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] space-y-0.5">
                      {run.materialsIssued.map((m, idx) => (
                        <div key={idx} className={m.varianceFlagged ? 'text-red-700 font-bold' : 'text-slate-600'}>
                          {m.materialName}: {m.actualQtyIssued} {m.unit} (
                          {m.variancePercent > 0 ? `+${m.variancePercent}%` : `${m.variancePercent}%`}
                          {m.varianceFlagged ? ' ⚠️' : ''})
                        </div>
                      ))}
                    </td>
                    <td className="p-3 font-black text-indigo-700">₹{run.costPerPacket.toFixed(2)}</td>
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
