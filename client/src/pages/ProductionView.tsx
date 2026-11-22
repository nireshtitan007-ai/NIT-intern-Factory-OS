import React, { useState, useEffect } from 'react';
import { ProductionRun, Product, RawMaterial } from '../types';
import { api } from '../services/api';
import { 
  Factory, 
  AlertTriangle, 
  CheckCircle, 
  Layers, 
  Percent, 
  RefreshCw, 
  Play,
  Languages
} from 'lucide-react';
import { useT } from '../i18n/useT';

export const ProductionView: React.FC = () => {
  const { lang, toggleLang, t } = useT();
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
        productCode: product.code,
        actualFlour: flourQty,
        actualOil: oilQty,
        actualSpice: spiceQty,
        goodOutputPackets: goodOutput,
        damagedPouches: damagedPouches,
        cartonsUsed: cartonsUsed,
        directLaborCost: laborCost,
        directOverheadCost: overheadCost,
        supervisorName: 'Supervisor R. Kumar'
      });

      if (res.success) {
        setNotification(`${t('production.runSuccess')} ${t('production.actualOutput')}: ${res.run.actualOutputPackets} ${t('production.pkts')}. ${t('production.costPerPacket')}: ₹${res.run.costPerPacket.toFixed(2)}`);
        loadData();
      } else {
        alert(res.error || t('production.runFailed'));
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">{t('production.subtitle')}</span>
          <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 mt-1">{t('production.title')}</h1>
          <p className="text-xs text-charcoal-500 mt-1">
            {t('production.desc')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Language Toggle for Floor Staff */}
          <button
            onClick={toggleLang}
            className="flex items-center space-x-1.5 bg-forest-50 hover:bg-forest-100 text-forest-800 px-3 py-2 rounded-xl text-xs font-bold border border-forest-200 transition"
            title="Toggle Language / மொழியை மாற்றவும்"
          >
            <Languages className="w-3.5 h-3.5 text-forest-700" />
            <span>{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
          </button>

          <button
            onClick={loadData}
            className="flex items-center space-x-2 bg-cream-100 hover:bg-cream-300 text-charcoal-700 px-4 py-2 rounded-xl text-xs font-semibold border border-subtle-border transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('production.refresh')}</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-forest-100 border border-forest-500/30 text-forest-700 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-forest-700 hover:underline font-bold">Dismiss</button>
        </div>
      )}

      {/* Grid: Production Logger Form & Standard Recipe (BOM) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Run Input Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <div className="flex items-center justify-between border-b border-subtle-divider pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center space-x-2">
              <Factory className="w-4 h-4 text-forest-700" />
              <span>{t('production.logTitle')}</span>
            </h2>
            <span className="text-xs font-semibold text-charcoal-500">{t('production.preset')}</span>
          </div>

          <form onSubmit={handleExecuteRun} className="space-y-4">
            <div className="bg-cream-50 p-4 rounded-xl border border-subtle-border space-y-3">
              {/* TODO verify Tamil wording: 1. வழங்கப்பட்ட மூலப்பொருட்கள் (வழங்கல் vs நிலையானது) */}
              <h3 className="text-xs font-bold text-charcoal-700 uppercase">{t('production.rawMaterialsIssued')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">{t('production.flourStd')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={flourQty}
                    onChange={e => setFlourQty(Number(e.target.value))}
                    className="w-full bg-white border border-subtle-border rounded-lg px-3 py-2 text-xs font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">{t('production.oilStd')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={oilQty}
                    onChange={e => setOilQty(Number(e.target.value))}
                    className="w-full bg-white border border-subtle-border rounded-lg px-3 py-2 text-xs font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">{t('production.spiceStd')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={spiceQty}
                    onChange={e => setSpiceQty(Number(e.target.value))}
                    className="w-full bg-white border border-subtle-border rounded-lg px-3 py-2 text-xs font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
              </div>
            </div>

            <div className="bg-cream-50 p-4 rounded-xl border border-subtle-border space-y-3">
              {/* TODO verify Tamil wording: 2. முடிவுற்ற உற்பத்தி & பேக்கிங் நுகர்வு */}
              <h3 className="text-xs font-bold text-charcoal-700 uppercase">{t('production.finishedOutput')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">{t('production.goodPacketsStd')}</label>
                  <input
                    type="number"
                    value={goodOutput}
                    onChange={e => setGoodOutput(Number(e.target.value))}
                    className="w-full bg-white border border-subtle-border rounded-lg px-3 py-2 text-xs font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
                  {/* TODO verify Tamil wording: சேதமடைந்த பவுச்சுகள் (வீணாக்கல்) */}
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">{t('production.damagedPouches')}</label>
                  <input
                    type="number"
                    value={damagedPouches}
                    onChange={e => setDamagedPouches(Number(e.target.value))}
                    className="w-full bg-white border border-subtle-border rounded-lg px-3 py-2 text-xs font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">{t('production.cartonsUsedStd')}</label>
                  <input
                    type="number"
                    value={cartonsUsed}
                    onChange={e => setCartonsUsed(Number(e.target.value))}
                    className="w-full bg-white border border-subtle-border rounded-lg px-3 py-2 text-xs font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
              </div>
            </div>

            <div className="bg-cream-50 p-4 rounded-xl border border-subtle-border space-y-3">
              <h3 className="text-xs font-bold text-charcoal-700 uppercase">{t('production.directCosts')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  {/* TODO verify Tamil wording: நேரடி கூலி செலவு */}
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">{t('production.directLabour')}</label>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={e => setLaborCost(Number(e.target.value))}
                    className="w-full bg-white border border-subtle-border rounded-lg px-3 py-2 text-xs font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
                  {/* TODO verify Tamil wording: மின்சாரம் / எரிவாயு பிற செலவுகள் */}
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">{t('production.powerGas')}</label>
                  <input
                    type="number"
                    value={overheadCost}
                    onChange={e => setOverheadCost(Number(e.target.value))}
                    className="w-full bg-white border border-subtle-border rounded-lg px-3 py-2 text-xs font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{t('production.saveButton')}</span>
            </button>
          </form>
        </div>

        {/* Right: Master Recipe & Live Cost Intelligence */}
        <div className="space-y-6">
          {/* Recipe Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-forest-700" />
              <span>{t('production.standardRecipe')}</span>
            </h3>
            <p className="text-xs text-charcoal-500">{t('production.standardBatch')}</p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-subtle-divider">
                <span className="text-charcoal-500">{t('production.flour')}:</span>
                <span className="font-bold text-charcoal-900">40 kg @ ₹42-45/kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-subtle-divider">
                <span className="text-charcoal-500">{t('production.cookingOil')}:</span>
                <span className="font-bold text-charcoal-900">10 L @ ₹140/L</span>
              </div>
              <div className="flex justify-between py-1 border-b border-subtle-divider">
                <span className="text-charcoal-500">{t('production.spiceMix')}:</span>
                <span className="font-bold text-charcoal-900">1.2 kg @ ₹200/kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-subtle-divider">
                <span className="text-charcoal-500">{t('production.pouch200g')}</span>
                <span className="font-bold text-charcoal-900">200 pcs @ ₹2.50</span>
              </div>
              <div className="flex justify-between py-1 border-b border-subtle-divider">
                <span className="text-charcoal-500">{t('production.carton20pkts')}</span>
                <span className="font-bold text-charcoal-900">10 pcs @ ₹15</span>
              </div>
            </div>
          </div>

          {/* Costing Card */}
          {runs.length > 0 && (
            <div className="bg-forest-700 text-cream-50 rounded-2xl p-6 shadow-sm border border-forest-800 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-forest-200">{t('production.latestRunCost')}</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-forest-200">{t('production.totalMaterials')}</span>
                  <span className="font-bold">₹{runs[0].totalMaterialCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-forest-200">{t('production.labour')}</span>
                  <span className="font-bold">₹{runs[0].directLaborCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-forest-200">{t('production.overheads')}</span>
                  <span className="font-bold">₹{runs[0].directOverheadCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-forest-600 pt-2 font-bold text-sm">
                  <span>{t('production.totalBatchCost')}</span>
                  <span className="text-white">₹{runs[0].totalProductionCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-forest-900 p-3 rounded-xl border border-forest-600 mt-3 flex items-center justify-between">
                <div>
                  {/* TODO verify Tamil wording: ஒரு பாக்கெட் செலவு */}
                  <span className="text-[11px] text-forest-200 block">{t('production.costPerPacket')}</span>
                  <span className="text-xl font-bold text-white">₹{runs[0].costPerPacket.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-forest-200 block">{t('production.grossMargin')}</span>
                  <span className="text-sm font-bold text-emerald-300">
                    ₹{(50 - runs[0].costPerPacket).toFixed(2)} ({Math.round(((50 - runs[0].costPerPacket) / 50) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Production Run History & Variance Flags Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center space-x-2">
          <Percent className="w-4 h-4 text-forest-700" />
          <span>{t('production.historyTitle')}</span>
        </h2>

        {runs.length === 0 ? (
          <p className="text-xs text-charcoal-500 py-6 text-center">{t('production.noRuns')}</p>
        ) : (
          <div className="overflow-x-auto border border-subtle-border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 text-charcoal-500 font-semibold uppercase">
                <tr>
                  <th className="p-3">{t('production.runNo')}</th>
                  <th className="p-3">{t('production.product')}</th>
                  <th className="p-3">{t('production.expectedOutput')}</th>
                  <th className="p-3">{t('production.actualOutput')}</th>
                  <th className="p-3">{t('production.yield')}</th>
                  <th className="p-3">{t('production.yieldVariance')}</th>
                  <th className="p-3">{t('production.materialVariances')}</th>
                  <th className="p-3">{t('production.costPerPacket')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle-divider">
                {runs.map(run => (
                  <tr key={run._id} className="hover:bg-cream-50">
                    <td className="p-3 font-mono font-bold text-forest-700">{run.runNumber}</td>
                    <td className="p-3 font-medium text-charcoal-900">{run.productName}</td>
                    <td className="p-3 text-charcoal-500">{run.batchExpectedOutput} {t('production.pkts')}</td>
                    <td className="p-3 font-bold text-charcoal-900">{run.actualOutputPackets} {t('production.pkts')}</td>
                    <td className="p-3 font-semibold text-charcoal-900">{run.yieldPercent}%</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        run.yieldVarianceFlagged ? 'bg-red-100 text-red-800' : 'bg-forest-100 text-forest-700'
                      }`}>
                        {run.yieldVariancePercent}% {run.yieldVarianceFlagged ? `(${t('production.flagged')})` : `(${t('production.withinTolerance')})`}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] space-y-0.5">
                      {run.materialsIssued.map((m, idx) => (
                        <div key={idx} className={m.varianceFlagged ? 'text-red-700 font-bold' : 'text-charcoal-500'}>
                          {m.materialName}: {m.actualQtyIssued} {m.unit} (
                          {m.variancePercent > 0 ? `+${m.variancePercent}%` : `${m.variancePercent}%`}
                          {m.varianceFlagged ? ` ⚠️ ${t('production.overTolerance')}` : ` ✓ ${t('production.withinTolerance')}`})
                        </div>
                      ))}
                    </td>
                    <td className="p-3 font-bold text-forest-700">₹{run.costPerPacket.toFixed(2)}</td>
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
