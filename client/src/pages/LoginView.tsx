import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Building2, 
  Users, 
  Compass,
  Play,
  Target
} from 'lucide-react';
import { api } from '../services/api';
import { AppUser } from '../types';
import { SalesmanMobileLoginView } from './SalesmanMobileLoginView';

interface LoginViewProps {
  onLoginSuccess: (user: AppUser, token: string) => void;
  initialMode?: 'salesman' | 'admin' | 'staff';
  onOpenBenchmark?: () => void;
  onOpenPitch?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ 
  onLoginSuccess, 
  initialMode = 'admin',
  onOpenBenchmark,
  onOpenPitch
}) => {
  const [loginMode, setLoginMode] = useState<'salesman' | 'admin' | 'staff'>(initialMode);
  const [username, setUsername] = useState('factory_admin');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If salesman mode is selected, render the dedicated Salesman Mobile Login
  if (loginMode === 'salesman') {
    return (
      <SalesmanMobileLoginView
        onLoginSuccess={onLoginSuccess}
        onSwitchToAdmin={() => {
          setLoginMode('admin');
          setUsername('factory_admin');
          setPassword('Admin@123');
          setError(null);
        }}
        onSwitchToStaff={() => {
          setLoginMode('staff');
          setUsername('supervisor');
          setPassword('Nash@123');
          setError(null);
        }}
      />
    );
  }

  const demoAccounts = [
    { username: 'factory_admin', pass: 'Admin@123', label: 'Factory Admin Desk', role: 'admin', type: 'admin', dept: 'Executive Oversight' },
    { username: 'owner', pass: 'Admin@123', label: 'Business Owner', role: 'owner', type: 'admin', dept: 'Board & Profitability' },
    { username: 'supervisor', pass: 'Nash@123', label: 'Production Supervisor', role: 'production', type: 'staff', dept: 'Floor & BOM' },
    { username: 'inventory_mgr', pass: 'Nash@123', label: 'Inventory Manager', role: 'inventory', type: 'staff', dept: 'Central Warehouse' },
    { username: 'accountant', pass: 'Nash@123', label: 'Senior Accountant', role: 'accountant', type: 'staff', dept: 'Invoicing & Receipts' },
    { username: 'auditor', pass: 'Nash@123', label: 'Statutory Auditor', role: 'auditor', type: 'staff', dept: 'Read-Only Ledger' },
  ];

  const handleSelectDemo = (account: typeof demoAccounts[0]) => {
    setLoginMode(account.type as any);
    setUsername(account.username);
    setPassword(account.pass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = loginMode === 'admin' ? api.adminLogin : api.login;
      const res = await endpoint({ username, password });

      if (!res.success) {
        throw new Error(res.error || 'Authentication failed');
      }

      localStorage.setItem('zenlyft_auth_token', res.token);
      localStorage.setItem('zenlyft_token', res.token);
      localStorage.setItem('zenlyft_user', JSON.stringify(res.user));
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-200 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Clean Top Header Bar */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-forest-700 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
            Z
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-charcoal-900 leading-tight">ZenLyft OS</h1>
            <span className="text-[10px] text-forest-700 font-bold block uppercase tracking-wider">Manufacturing Platform</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenPitch && (
            <button
              onClick={onOpenPitch}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 rounded-lg text-xs font-bold border border-amber-400/50 transition shadow-sm"
            >
              <Target className="w-3.5 h-3.5 text-amber-700" />
              <span>Pitch Deck</span>
            </button>
          )}

          {onOpenBenchmark && (
            <button
              onClick={onOpenBenchmark}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-cream-100 text-charcoal-700 rounded-lg text-xs font-bold border border-subtle-border transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5 text-forest-700 fill-forest-700" />
              <span className="hidden sm:inline">Section 5 Benchmark</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-2xl border border-subtle-border shadow-sm p-6 sm:p-8">
          
          {/* Distinct Login Experience Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-cream-100 rounded-xl mb-6 border border-subtle-border">
            <button
              type="button"
              onClick={() => {
                setLoginMode('salesman');
              }}
              className="py-2 text-[11px] font-semibold rounded-lg transition text-charcoal-500 hover:text-charcoal-900 flex items-center justify-center space-x-1"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Salesman</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('admin');
                setUsername('factory_admin');
                setPassword('Admin@123');
                setError(null);
              }}
              className={`py-2 text-[11px] font-bold rounded-lg transition flex items-center justify-center space-x-1 ${
                loginMode === 'admin'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Desk</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('staff');
                setUsername('supervisor');
                setPassword('Nash@123');
                setError(null);
              }}
              className={`py-2 text-[11px] font-bold rounded-lg transition flex items-center justify-center space-x-1 ${
                loginMode === 'staff'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Login</span>
            </button>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-charcoal-900 tracking-tight">
              {loginMode === 'admin' ? 'Admin Control Centre' : 'Factory Operations Portal'}
            </h2>
            <p className="text-xs text-charcoal-500 mt-1">
              {loginMode === 'admin'
                ? 'Primary business controller, approvals, GST & user administration'
                : 'Dedicated access for floor supervisors, inventory & accounting'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Username / Identifier
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. factory_admin"
                  className="w-full pl-9 pr-3 py-2.5 bg-cream-50 border border-subtle-border rounded-xl text-charcoal-900 text-xs placeholder-charcoal-500 focus:outline-none focus:ring-1 focus:ring-forest-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Secure Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-cream-50 border border-subtle-border rounded-xl text-charcoal-900 text-xs placeholder-charcoal-500 focus:outline-none focus:ring-1 focus:ring-forest-700 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workplace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-subtle-divider">
            <span className="text-[11px] font-semibold text-charcoal-500 block mb-2 text-center">
              1-Click Verified Role Credentials
            </span>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts
                .filter(a => a.type === loginMode)
                .map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`p-2 rounded-lg border text-left transition ${
                      username === acc.username 
                        ? 'border-forest-700 bg-forest-100 text-forest-700 font-bold' 
                        : 'border-subtle-border bg-cream-50 text-charcoal-700 hover:bg-cream-100'
                    }`}
                  >
                    <div className="text-xs font-semibold">{acc.label}</div>
                    <div className="text-[10px] text-charcoal-500">{acc.dept}</div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center py-2 text-[11px] text-charcoal-500">
        ZenLyft Manufacturing OS • Live MongoDB Atlas
      </footer>
    </div>
  );
};
