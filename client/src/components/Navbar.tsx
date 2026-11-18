import React from 'react';
import { UserRole, AppUser } from '../types';
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
  MessageSquare,
  LogOut,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  onRunBenchmark: () => void;
  onSeedData: () => void;
  isProcessing: boolean;
  currentUser?: AppUser | null;
  onLogout?: () => void;
  onViewLandingPage?: () => void;
  realtimeAlertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  isOffline,
  onToggleOffline,
  onRunBenchmark,
  onSeedData,
  isProcessing,
  currentUser,
  onLogout,
  onViewLandingPage,
  realtimeAlertCount = 0
}) => {
  const isAdminOrOwner = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  const isSalesman = currentUser?.role === 'salesman' || currentUser?.role === 'sales_manager';

  const allRoles: Array<{ role: UserRole; label: string; icon: any; desc: string }> = [
    { role: 'admin', label: 'Admin Control Centre', icon: Building2, desc: 'Centralized Platform Oversight' },
    { role: 'salesman', label: 'Salesman Mobile', icon: Smartphone, desc: 'Field Orders (Offline Ready)' },
    { role: 'production', label: 'Production Floor', icon: Factory, desc: 'BOM, Batch Runs, Variance' },
    { role: 'accountant', label: 'Inventory & Ledger', icon: Boxes, desc: 'Authoritative Stock Balances' },
    { role: 'owner', label: 'Accounts & Audit', icon: FileSpreadsheet, desc: 'GST, Sales, Traceability' },
    { role: 'whatsapp', label: 'WhatsApp Hub', icon: MessageSquare, desc: 'OpenWA Automation Engine' },
  ];

  // RBAC: Salesmen only see Salesman Mobile; non-admins only see permitted modules
  const visibleRoles = isAdminOrOwner 
    ? allRoles 
    : isSalesman
    ? allRoles.filter(r => r.role === 'salesman')
    : allRoles.filter(r => r.role !== 'admin');

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shadow-md ${
              isSalesman ? 'bg-emerald-600' : 'bg-indigo-600'
            }`}>
              {isSalesman ? <Smartphone className="w-5 h-5" /> : 'Z'}
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                {isSalesman ? 'ZenLyft Mobile' : 'ZenLyft'}
              </span>
              <span className={`text-xs block font-medium ${
                isSalesman ? 'text-emerald-400' : 'text-indigo-400'
              }`}>
                {isSalesman ? 'Field Sales Terminal' : 'Manufacturing Business OS'}
              </span>
            </div>
          </div>

          {/* User Badge, Offline Simulator, Benchmark & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Authenticated User Status */}
            {currentUser && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-xs">
                {isAdminOrOwner ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : isSalesman ? (
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span className="font-semibold text-slate-200">{currentUser.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isAdminOrOwner 
                    ? 'bg-amber-500/20 text-amber-300' 
                    : isSalesman
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-indigo-500/20 text-indigo-300'
                }`}>
                  {currentUser.role}
                </span>
              </div>
            )}

            {/* Offline Simulator Switch */}
            <button
              onClick={onToggleOffline}
              title={isOffline ? "App running offline (IndexedDB queue active)" : "App is online"}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition ${
                isOffline 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isOffline ? 'Offline' : 'Online'}</span>
            </button>

            {/* Benchmark Runner Button (Visible to Admin & Evaluators) */}
            {isAdminOrOwner && (
              <>
                <button
                  onClick={onRunBenchmark}
                  disabled={isProcessing}
                  className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow transition"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span className="hidden sm:inline">{isProcessing ? 'Verifying...' : 'Benchmark 100%'}</span>
                </button>

                <button
                  onClick={onSeedData}
                  disabled={isProcessing}
                  title="Reset & seed benchmark master data"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Public Site Button */}
            {onViewLandingPage && (
              <button
                onClick={onViewLandingPage}
                title="View public product landing page"
                className="hidden sm:flex items-center space-x-1 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition text-xs font-semibold"
              >
                <span>Public Site</span>
              </button>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign out of current workspace"
                className="flex items-center space-x-1 p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Role Navigation Bar (Only if multiple roles permitted) */}
        {visibleRoles.length > 1 && (
          <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/80 pt-2">
            {visibleRoles.map(({ role, label, icon: Icon }) => {
              const isActive = currentRole === role;
              return (
                <button
                  key={role}
                  onClick={() => onSelectRole(role)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
