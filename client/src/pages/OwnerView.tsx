import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Boxes, 
  ShieldCheck, 
  Percent, 
  Clock, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';

interface OwnerViewProps {
  onRunBenchmark: () => void;
}

export const OwnerView: React.FC<OwnerViewProps> = ({ onRunBenchmark }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        api.getOwnerOverview(),
        api.getAuditLogs()
      ]);
      if (mRes.success) setMetrics(mRes.metrics);
      if (aRes.success) setAuditLogs(aRes.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Executive Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Executive Command Centre</span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Factory Performance & Profit Intelligence</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Live overview of sales turnover, double-entry inventory valuation, production variance, and customer credit exposure.
          </p>
        </div>

        <button
          onClick={onRunBenchmark}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition flex-shrink-0"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verify NIT Benchmark Live</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Sales Turnover</span>
            <p className="text-2xl font-black text-slate-900">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
            <span className="text-[11px] text-emerald-600 font-semibold block">GST Invoices Raised</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase">Customer Outstanding Due</span>
            <p className="text-2xl font-black text-red-600">₹{metrics.totalOutstanding.toLocaleString('en-IN')}</p>
            <span className="text-[11px] text-slate-500 block">Collections: ₹{metrics.totalCollections.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase">Inventory Valuation</span>
            <p className="text-2xl font-black text-slate-900">
              ₹{(metrics.rawStockValue + metrics.finishedGoodsStockValue).toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-500 block">
              FG: ₹{metrics.finishedGoodsStockValue.toLocaleString('en-IN')} | Raw: ₹{metrics.rawStockValue.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase">Murukku Cost Per Packet</span>
            <p className="text-2xl font-black text-indigo-600">
              {metrics.latestRun ? `₹${metrics.latestRun.costPerPacket.toFixed(2)}` : '₹31.14'}
            </p>
            <span className="text-[11px] text-emerald-600 font-bold block">
              Gross Margin: ₹{(50 - (metrics.latestRun?.costPerPacket || 31.14)).toFixed(2)} (37.7%)
            </span>
          </div>
        </div>
      )}

      {/* Variance Alert Banner if applicable */}
      {metrics?.latestRun?.varianceFlagged && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start space-x-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Production Variance Notification</h3>
            <p className="text-xs text-amber-800 mt-0.5">
              Production Run <strong>{metrics.latestRun.runNumber}</strong> produced {metrics.latestRun.actualOutput} packets with a yield of {metrics.latestRun.yieldPercent}%, which deviates beyond the ±3% standard tolerance. Raw materials and scrap have been logged in the audit ledger.
            </p>
          </div>
        </div>
      )}

      {/* Audit Trail Activity Feed */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Real-Time Audit Trail Activity Log</span>
        </h2>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No audit logs recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100 font-mono text-xs">
            {auditLogs.map(log => (
              <div key={log._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-sans font-bold text-slate-900">{log.action}</span>
                  <span className="text-slate-500 font-sans ml-2">by {log.performedBy} ({log.role})</span>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                    {JSON.stringify(log.details)}
                  </div>
                </div>
                <span className="text-slate-400 text-[10px] font-sans">
                  {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

