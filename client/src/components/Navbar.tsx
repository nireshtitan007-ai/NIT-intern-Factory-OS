import React from 'react';
import { UserRole } from '../types';
import { 
  Smartphone, 
  Building2, 
  Factory, 
  Boxes, 
  FileSpreadsheet, 
  TrendingUp, 
  Wifi, 
  WifiOff, 
  Play, 
  RotateCcw,
  MessageSquare
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  onRunBenchmark: () => void;
  onSeedData: () => void;
  isProcessing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  isOffline,
  onToggleOffline,
  onRunBenchmark,
  onSeedData,
  isProcessing
}) => {
  const roles: Array<{ role: UserRole; label: string; icon: any; desc: string }> = [
    { role: 'salesman', label: 'Salesman Mobile', icon: Smartphone, desc: 'Field Orders (Offline)' },
    { role: 'admin', label: 'Admin Desk', icon: Building2, desc: 'Verification, GST, Dispatch' },
    { role: 'production', label: 'Production Floor', icon: Factory, desc: 'BOM, Batch Runs, Variance' },
    { role: 'accountant', label: 'Inventory & Ledger', icon: Boxes, desc: 'Stock Ledger & Summary' },
    { role: 'owner', label: 'Accounts & Reports', icon: FileSpreadsheet, desc: 'GST, Sales, Receivables' },
    { role: 'whatsapp', label: 'WhatsApp Automation', icon: MessageSquare, desc: 'OpenWA Automation Centre' },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              Z
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">ZenLyft</span>
              <span className="text-xs text-indigo-400 block font-medium">Manufacturing OS</span>
            </div>
          </div>

          {/* Quick Actions: Offline Simulator, Seed & Benchmark */}
          <div className="flex items-center space-x-2">
            {/* Offline Simulator Switch */}
            <button
              onClick={onToggleOffline}
              title={isOffline ? "App is running offline (IndexedDB queue active)" : "App is online"}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                isOffline 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{isOffline ? 'Offline Mode' : 'Online'}</span>
            </button>

            {/* Benchmark Runner Button */}
            <button
              onClick={onRunBenchmark}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow transition"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isProcessing ? 'Running...' : 'Run Benchmark'}</span>
            </button>

            {/* Reset / Seed Button */}
            <button
              onClick={onSeedData}
              disabled={isProcessing}
              title="Reset & seed Section 5 master data"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Role Navigation Bar */}
        <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/80 pt-2">
          {roles.map(({ role, label, icon: Icon }) => {
            const isActive = currentRole === role;
            return (
              <button
                key={role}
                onClick={() => onSelectRole(role)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

