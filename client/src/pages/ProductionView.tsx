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
  Languages,
  Scale,
  Sparkles,
  Edit2,
  X,
  Check
} from 'lucide-react';
import { useT } from '../i18n/useT';
import { useToast } from '../components/Toast';

export const ProductionView: React.FC = () => {
  const toast = useToast();
  const { lang, toggleLang, t } = useT();
  const [runs, setRuns] = useState<ProductionRun[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [productionPlan, setProductionPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Batch scaler state (default 1 batch = 200 packets standard)
  const [batchCount, setBatchCount] = useState<number>(1);

  // Form inputs for batch run
  const [flourQty, setFlourQty] = useState<number>(40);
  const [flourUnit, setFlourUnit] = useState<'kg' | 'g'>('kg');

  const [oilQty, setOilQty] = useState<number>(10.5);
  const [oilUnit, setOilUnit] = useState<'L' | 'ml'>('L');

  const [spiceQty, setSpiceQty] = useState<number>(1.2);
  const [spiceUnit, setSpiceUnit] = useState<'kg' | 'g'>('kg');

  const [goodOutput, setGoodOutput] = useState<number>(188);
  const [damagedPouches, setDamagedPouches] = useState<number>(6);
  const [cartonsUsed, setCartonsUsed] = useState<number>(9);
  const [laborCost, setLaborCost] = useState<number>(1200);
  const [overheadCost, setOverheadCost] = useState<number>(600);

  // Overhead Edit Modal State
  const [editingRunOverheads, setEditingRunOverheads] = useState<ProductionRun | null>(null);
  const [modalLaborCost, setModalLaborCost] = useState<number>(1200);
  const [modalOverheadCost, setModalOverheadCost] = useState<number>(600);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, mRes, planRes] = await Promise.all([
        api.getProductionRuns(),
        api.getProducts(),
        api.getRawMaterials(),
        api.getProductionPlan().catch(() => ({ success: false, plan: null }))
      ]);
      if (rRes.success) setRuns(rRes.runs);
      if (pRes.success) setProducts(pRes.products);
      if (mRes.success) setMaterials(mRes.materials);
      if (planRes.success) setProductionPlan(planRes.plan);
    } catch (e) {
      // Production load handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update quantities when batchCount changes
  const handleScaleBatches = (batches: number) => {
    setBatchCount(batches);
    setFlourQty(batches * 40);
    setOilQty(batches * 10.5);
    setSpiceQty(Number((batches * 1.2).toFixed(2)));
    setGoodOutput(batches * 188);
    setDamagedPouches(batches * 6);
    setCartonsUsed(Math.ceil(batches * 9.4));
    setLaborCost(batches * 1200);
    setOverheadCost(batches * 600);
  };

  // Unit conversion helpers for input
  const getFlourInKg = () => flourUnit === 'g' ? flourQty / 1000 : flourQty;
  const getOilInL = () => oilUnit === 'ml' ? oilQty / 1000 : oilQty;
  const getSpiceInKg = () => spiceUnit === 'g' ? spiceQty / 1000 : spiceQty;

  // Live Variances
  const standardFlourKg = 40 * batchCount;
  const standardOilL = 10 * batchCount; // recipe standard is 10 L
  const standardSpiceKg = 1.2 * batchCount;
  const standardExpectedOutput = 200 * batchCount;

  const flourVariancePct = Number((((getFlourInKg() - standardFlourKg) / standardFlourKg) * 100).toFixed(1));
  const oilVariancePct = Number((((getOilInL() - standardOilL) / standardOilL) * 100).toFixed(1));
  const spiceVariancePct = Number((((getSpiceInKg() - standardSpiceKg) / standardSpiceKg) * 100).toFixed(1));
  const yieldVariancePct = Number((((goodOutput - standardExpectedOutput) / standardExpectedOutput) * 100).toFixed(1));

  const isFlourFlagged = Math.abs(flourVariancePct) > 3;
  const isOilFlagged = Math.abs(oilVariancePct) > 3;
  const isSpiceFlagged = Math.abs(spiceVariancePct) > 3;
  const isYieldFlagged = Math.abs(yieldVariancePct) > 3;

  const handleExecuteRun = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.code === 'MUR-200G');
    if (!product) return;

    setLoading(true);
    try {
      const res = await api.executeProductionRun({
        productId: product._id,
        productCode: product.code,
        batches: batchCount,
        batchExpectedOutput: standardExpectedOutput,
        materialIssues: [
          { materialCode: 'FLOUR', actualQtyIssued: flourQty, unit: flourUnit },
          { materialCode: 'COOKING-OIL', actualQtyIssued: oilQty, unit: oilUnit },
          { materialCode: 'SPICE-MIX', actualQtyIssued: spiceQty, unit: spiceUnit }
        ],
        actualFlour: getFlourInKg(),
        actualOil: getOilInL(),
        actualSpice: getSpiceInKg(),
        goodOutputPackets: goodOutput,
        actualOutputPackets: goodOutput,
        damagedPouches,
        cartonsUsed,
        directLaborCost: laborCost,
        directOverheadCost: overheadCost,
        supervisorName: 'Supervisor R. Kumar'
      });

      if (res.success) {
        toast.success(t('production.runSuccess'), `${t('production.actualOutput')}: ${res.run.actualOutputPackets} ${t('production.pkts')}. ${t('production.costPerPacket')}: ₹${res.run.costPerPacket.toFixed(2)}`);
        setNotification(`${t('production.runSuccess')} ${t('production.actualOutput')}: ${res.run.actualOutputPackets} ${t('production.pkts')}. ${t('production.costPerPacket')}: ₹${res.run.costPerPacket.toFixed(2)}`);
        loadData();
      } else {
        toast.error('Production Run Failed', res.error || t('production.runFailed'));
      }
    } catch (e: any) {
      toast.error('Production Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOverheads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRunOverheads) return;
    setLoading(true);
    try {
      const res = await api.updateRunOverheads(editingRunOverheads._id, modalLaborCost, modalOverheadCost);
      if (res.success) {
        toast.success('Overheads Updated', `Overheads updated for Run ${editingRunOverheads.runNumber}. Cost per packet: ₹${res.run.costPerPacket.toFixed(2)}`);
        setNotification(`Overheads updated for Run ${editingRunOverheads.runNumber}. Cost per packet: ₹${res.run.costPerPacket.toFixed(2)}`);
        setEditingRunOverheads(null);
        loadData();
      } else {
        toast.error('Update Failed', res.error || 'Failed to update overheads');
      }
    } catch (err: any) {
      toast.error('Update Error', err.message);
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

      {/* Production Planning Widget */}
      {productionPlan && productionPlan.suggestions && (
        <div className="bg-gradient-to-r from-forest-800 to-forest-900 text-cream-50 p-5 rounded-2xl shadow-md border border-forest-700 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="font-bold text-sm text-white">Automated Production Planning Suggestion</h3>
            </div>
            <span className="text-xs text-forest-200 font-medium">
              Based on {productionPlan.activeOrderCount} pending/active sales orders
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {productionPlan.suggestions.map((sug: any) => (
              <div key={sug.productCode} className="bg-forest-900/80 p-3 rounded-xl border border-forest-600/60 space-y-1.5">
                <div className="font-bold text-cream-50">{sug.productName}</div>
                <div className="flex justify-between text-forest-200">
                  <span>Demanded:</span>
                  <span className="font-bold text-white">{sug.demandedQty} pkts</span>
                </div>
                <div className="flex justify-between text-forest-200">
                  <span>Current Stock:</span>
                  <span className="font-bold text-white">{sug.currentStock} pkts</span>
                </div>
                <div className="flex justify-between border-t border-forest-700/60 pt-1 text-amber-200 font-semibold">
                  <span>Net Shortage:</span>
                  <span className="font-bold text-amber-300">{sug.netShortage} pkts</span>
                </div>
                <div className="flex justify-between text-forest-200">
                  <span>Recommended:</span>
                  <span className="font-bold text-emerald-300">{sug.recommendedBatches} batch ({sug.plannedProductionQty} pkts)</span>
                </div>
                {sug.recommendedBatches > 0 && (
                  <button
                    onClick={() => handleScaleBatches(sug.recommendedBatches)}
                    className="w-full mt-2 bg-amber-400 hover:bg-amber-300 text-charcoal-900 py-1 rounded-lg font-bold text-[11px] transition"
                  >
                    Apply {sug.recommendedBatches} Batch Plan
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Production Logger Form & Standard Recipe (BOM) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Run Input Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-subtle-divider pb-3 gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center space-x-2">
              <Factory className="w-4 h-4 text-forest-700" />
              <span>{t('production.logTitle')}</span>
            </h2>

            {/* Batch Scaler Preset Buttons */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-semibold text-charcoal-500 mr-1 flex items-center space-x-1">
                <Scale className="w-3.5 h-3.5" />
                <span>Batch Multiplier:</span>
              </span>
              {[0.5, 1, 2, 3].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleScaleBatches(b)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${batchCount === b
                      ? 'bg-forest-700 text-white shadow-sm'
                      : 'bg-cream-100 hover:bg-cream-200 text-charcoal-700 border border-subtle-border'
                    }`}
                >
                  {b}x ({b * 200} pkts)
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleExecuteRun} className="space-y-4">
            {/* Raw Materials Issued with Multi-Unit Selectors & Live Variances */}
            <div className="bg-cream-50 p-4 rounded-xl border border-subtle-border space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-charcoal-700 uppercase">{t('production.rawMaterialsIssued')}</h3>
                <span className="text-[11px] text-charcoal-500">Benchmark preset for 1 batch = 40 kg flour, 10.5 L oil</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Flour */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-charcoal-700">{t('production.flourStd')}</label>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isFlourFlagged ? 'bg-red-100 text-red-700' : 'bg-forest-100 text-forest-700'
                      }`}>
                      {flourVariancePct > 0 ? `+${flourVariancePct}%` : `${flourVariancePct}%`}
                      {isFlourFlagged ? ' ⚠️' : ' ✓'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="0.1"
                      value={flourQty}
                      onChange={e => setFlourQty(Number(e.target.value))}
                      className="w-full bg-white border border-subtle-border rounded-lg px-3 py-2 text-xs font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                    />
                    <select
                      value={flourUnit}
                      onChange={e => setFlourUnit(e.target.value as any)}
                      className="bg-cream-100 border border-subtle-border rounded-lg px-2 py-2 text-xs font-semibold text-charcoal-700"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>

                {/* Oil */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-charcoal-700">{t('production.oilStd')}</label>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isOilFlagged ? 'bg-red-100 text-red-700' : 'bg-forest-100 text-forest-700'
                      }`}>
                      {oilVariancePct > 0 ? `+${oilVariancePct}%` : `${oilVariancePct}%`}
                      {isOilFlagged ? ' ⚠️ (Benchmark +5%)' : ' ✓'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="0.1"
                      value={oilQty}
                      onChange={e => setOilQty(Number(e.target.value))}
                      className="w-full bg-white border border-subtle-border rounded-lg px-3 py-2 text-xs font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                    />
                    <select
                      value={oilUnit}
                      onChange={e => setOilUnit(e.target.value as any)}
                      className="bg-cream-100 border border-subtle-border rounded-lg px-2 py-2 text-xs font-semibold text-charcoal-700"
                    >
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>
                </div>

                {/* Spices */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-charcoal-700">{t('production.spiceStd')}</label>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isSpiceFlagged ? 'bg-red-100 text-red-700' : 'bg-forest-100 text-forest-700'
                      }`}>
                      {spiceVariancePct > 0 ? `+${spiceVariancePct}%` : `${spiceVariancePct}%`}
                      {isSpiceFlagged ? ' ⚠️' : ' ✓'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="0.1"
                      value={spiceQty}
                      onChange={e => setSpiceQty(Number(e.target.value))}
                      className="w-full bg-white border border-subtle-border rounded-lg px-3 py-2 text-xs font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                    />
                    <select
                      value={spiceUnit}
                      onChange={e => setSpiceUnit(e.target.value as any)}
                      className="bg-cream-100 border border-subtle-border rounded-lg px-2 py-2 text-xs font-semibold text-charcoal-700"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Finished Output & Packaging with Live Yield Variance Badge */}
            <div className="bg-cream-50 p-4 rounded-xl border border-subtle-border space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-charcoal-700 uppercase">{t('production.finishedOutput')}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isYieldFlagged ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-forest-100 text-forest-700'
                  }`}>
                  Yield Variance: {yieldVariancePct > 0 ? `+${yieldVariancePct}%` : `${yieldVariancePct}%`}
                  {isYieldFlagged ? ' ⚠️ FLAGGED (Yield < 97%)' : ' ✓ Within ±3%'}
                </span>
              </div>

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

            {/* Direct Costs */}
            <div className="bg-cream-50 p-4 rounded-xl border border-subtle-border space-y-3">
              <h3 className="text-xs font-bold text-charcoal-700 uppercase">{t('production.directCosts')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">{t('production.directLabour')}</label>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={e => setLaborCost(Number(e.target.value))}
                    className="w-full bg-white border border-subtle-border rounded-lg px-3 py-2 text-xs font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
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
              <span>{t('production.standardRecipe')} ({batchCount}x Batch)</span>
            </h3>
            <p className="text-xs text-charcoal-500">Standard batch output: {standardExpectedOutput} packets</p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-subtle-divider">
                <span className="text-charcoal-500">{t('production.flour')}:</span>
                <span className="font-bold text-charcoal-900">{40 * batchCount} kg @ WAC ₹43.125/kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-subtle-divider">
                <span className="text-charcoal-500">{t('production.cookingOil')}:</span>
                <span className="font-bold text-charcoal-900">{10 * batchCount} L @ ₹130-140/L</span>
              </div>
              <div className="flex justify-between py-1 border-b border-subtle-divider">
                <span className="text-charcoal-500">{t('production.spiceMix')}:</span>
                <span className="font-bold text-charcoal-900">{Number((1.2 * batchCount).toFixed(2))} kg @ ₹250/kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-subtle-divider">
                <span className="text-charcoal-500">{t('production.pouch200g')}</span>
                <span className="font-bold text-charcoal-900">{200 * batchCount} pcs @ ₹1.50</span>
              </div>
              <div className="flex justify-between py-1 border-b border-subtle-divider">
                <span className="text-charcoal-500">{t('production.carton20pkts')}</span>
                <span className="font-bold text-charcoal-900">{10 * batchCount} pcs @ ₹41</span>
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
                  <th className="p-3 text-center">Actions</th>
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
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${run.yieldVarianceFlagged ? 'bg-red-100 text-red-800' : 'bg-forest-100 text-forest-700'
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
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setEditingRunOverheads(run);
                          setModalLaborCost(run.directLaborCost || 1200);
                          setModalOverheadCost(run.directOverheadCost || 600);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-cream-100 hover:bg-cream-200 text-charcoal-700 rounded-lg text-xs font-semibold border border-subtle-border transition"
                        title="Update post-run labor and overhead costs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Overheads</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overhead Edit Modal */}
      {editingRunOverheads && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-subtle-border space-y-4">
            <div className="flex justify-between items-center border-b border-subtle-divider pb-2">
              <h3 className="text-sm font-bold text-charcoal-900">Post-Run Overheads for {editingRunOverheads.runNumber}</h3>
              <button onClick={() => setEditingRunOverheads(null)} className="text-charcoal-400 hover:text-charcoal-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-charcoal-500">
              Update direct labor or power/fuel expenses. Finished goods cost per packet will be atomically recalculated.
            </p>

            <form onSubmit={handleSaveOverheads} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Direct Labor Cost (₹)</label>
                <input
                  type="number"
                  value={modalLaborCost}
                  onChange={e => setModalLaborCost(Number(e.target.value))}
                  className="w-full bg-cream-50 border border-subtle-border rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Power / Gas Overheads (₹)</label>
                <input
                  type="number"
                  value={modalOverheadCost}
                  onChange={e => setModalOverheadCost(Number(e.target.value))}
                  className="w-full bg-cream-50 border border-subtle-border rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="bg-cream-50 p-3 rounded-xl text-xs space-y-1 border border-subtle-border">
                <div className="flex justify-between text-charcoal-500">
                  <span>Materials Cost:</span>
                  <span className="font-semibold text-charcoal-800">₹{editingRunOverheads.totalMaterialCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-charcoal-500">
                  <span>New Total Production Cost:</span>
                  <span className="font-bold text-charcoal-900">
                    ₹{(editingRunOverheads.totalMaterialCost + modalLaborCost + modalOverheadCost).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-forest-700 font-bold border-t border-subtle-divider pt-1">
                  <span>New Cost Per Packet:</span>
                  <span>
                    ₹{((editingRunOverheads.totalMaterialCost + modalLaborCost + modalOverheadCost) / editingRunOverheads.actualOutputPackets).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-subtle-divider">
                <button
                  type="button"
                  onClick={() => setEditingRunOverheads(null)}
                  className="px-3 py-1.5 border border-subtle-border rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold"
                >
                  Save Overheads
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
