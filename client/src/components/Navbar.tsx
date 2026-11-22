import React from 'react';
import { UserRole, AppUser } from '../types';
import { 
  Building2, 
  Factory, 
  Boxes, 
  FileSpreadsheet, 
  Wifi, 
  WifiOff, 
  Play, 
  RotateCcw,
  MessageSquare, 
  LogOut, 
  ShieldCheck, 
  Compass, 
  User,
  Target
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  onRunBenchmark: () => void;
  onSeedData: () => void;
  onOpenPitch?: () => void;
  isProcessing: boolean;
  currentUser?: AppUser | null;
  onLogout?: () => void;
  onOpenProfile?: () => void;
  isProfileActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  isOffline,
  onToggleOffline,
  onRunBenchmark,
  onSeedData,
  onOpenPitch,
  isProcessing,
  currentUser,
  onLogout,
  onOpenProfile,
  isProfileActive = false
}) => {
  const isAdminOrOwner = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  const isSalesman = currentUser?.role === 'salesman' || currentUser?.role === 'sales_manager';

  const allRoles: Array<{ role: UserRole; label: string; icon: any; desc: string }> = [
    { role: 'admin', label: 'Admin Control Centre', icon: Building2, desc: 'Central Platform Oversight' },
    { role: 'salesman', label: 'Field Terminal', icon: Compass, desc: 'Mobile Route Orders' },
    { role: 'production', label: 'Production Floor', icon: Factory, desc: 'BOM & Batch Runs' },
    { role: 'accountant', label: 'Central Inventory', icon: Boxes, desc: 'Authoritative Stock Ledger' },
    { role: 'owner', label: 'Accounts & Audit', icon: FileSpreadsheet, desc: 'GST, Sales, Traceability' },
    { role: 'whatsapp', label: 'WhatsApp Automation', icon: MessageSquare, desc: 'OpenWA Notification Hub' },
  ];

  // RBAC: Salesmen only see Salesman Field Terminal; non-admins only see permitted modules
  const visibleRoles = isAdminOrOwner 
    ? allRoles 
    : isSalesman
    ? allRoles.filter(r => r.role === 'salesman')
    : allRoles.filter(r => r.role !== 'admin');

  return (
    <header className="bg-forest-700 text-cream-50 shadow-sm sticky top-0 z-50 border-b border-forest-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-forest-900 border border-forest-600 flex items-center justify-center font-bold text-cream-50 shadow-sm">
              Z
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-cream-50">
                ZenLyft OS
              </span>
              <span className="text-[10px] block font-medium text-forest-200 uppercase tracking-wider">
                Manufacturing Nervous System
              </span>
            </div>
          </div>

          {/* Operational Controls & Role Status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Pitch Deck Button */}
            {onOpenPitch && (
              <button
                onClick={onOpenPitch}
                title="Open Executive Pitch Deck & Walkthrough"
                className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40 hover:bg-amber-500/30 text-xs font-bold transition shadow-sm"
              >
                <Target className="w-3.5 h-3.5 text-amber-300" />
                <span>Pitch Deck</span>
              </button>
            )}

            {/* Authenticated User Status */}
            {currentUser && (
              <button
                onClick={onOpenProfile}
                title="View Account Profile"
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs transition ${
                  isProfileActive
                    ? 'bg-cream-50 text-forest-700 font-bold border-white'
                    : 'bg-forest-800/80 text-cream-50 border-forest-600 hover:bg-forest-800'
                }`}
              >
                {isAdminOrOwner ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <User className="w-3.5 h-3.5 text-forest-200" />
                )}
                <span className="font-semibold hidden sm:inline">{currentUser.name || currentUser.username}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-forest-900/60 text-forest-100">
                  {currentUser.role}
                </span>
              </button>
            )}

            {/* Offline Status Switch */}
            <button
              onClick={onToggleOffline}
              title={isOffline ? "App running offline (IndexedDB queue active)" : "App is online"}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                isOffline 
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40' 
                  : 'bg-forest-800 text-forest-100 border border-forest-600'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isOffline ? 'Offline' : 'Online'}</span>
            </button>

            {/* Benchmark Buttons (Visible to Admin) */}
            {isAdminOrOwner && (
              <>
                <button
                  onClick={onSeedData}
                  disabled={isProcessing}
                  title="Reset and seed Section 5 benchmark data"
                  className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-forest-800 hover:bg-forest-900 text-forest-100 border border-forest-600 transition disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3 text-forest-300" />
                  <span>Seed Data</span>
                </button>

                <button
                  onClick={onRunBenchmark}
                  disabled={isProcessing}
                  title="Run end-to-end benchmark scenario"
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition disabled:opacity-50"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Benchmark</span>
                </button>
              </>
            )}

            {/* Logout */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Log out of system"
                className="p-1.5 rounded-lg bg-forest-800 hover:bg-red-700 text-forest-200 hover:text-white transition border border-forest-600"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Module Sub-Navigation Bar */}
        <div className="flex space-x-1 py-1.5 overflow-x-auto border-t border-forest-600/70">
          {visibleRoles.map((item) => {
            const Icon = item.icon;
            const isActive = !isProfileActive && currentRole === item.role;
            return (
              <button
                key={item.role}
                onClick={() => onSelectRole(item.role)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-cream-200 text-forest-700 shadow-sm'
                    : 'text-forest-100 hover:bg-forest-600/80 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
