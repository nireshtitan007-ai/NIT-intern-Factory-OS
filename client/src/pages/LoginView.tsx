import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Users, 
  Sparkles,
  Smartphone,
  MapPin,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { AppUser } from '../types';
import { SalesmanMobileLoginView } from './SalesmanMobileLoginView';

interface LoginViewProps {
  onLoginSuccess: (user: AppUser, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  // Check if URL specifies salesman mode e.g. ?mode=salesman or ?mobile=true
  const [loginMode, setLoginMode] = useState<'salesman' | 'admin' | 'staff'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'salesman' || params.get('mobile') === 'true' || params.get('view') === 'salesman') {
      return 'salesman';
    }
    return 'salesman'; // Default to salesman mobile login as requested by user
  });

  const [username, setUsername] = useState('factory_admin');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If salesman mode is selected, render the dedicated smartphone mobile login
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
    { username: 'factory_admin', pass: 'Admin@123', label: 'Factory Admin Desk', role: 'admin', type: 'admin', dept: 'Executive' },
    { username: 'owner', pass: 'Admin@123', label: 'Factory Business Owner', role: 'owner', type: 'admin', dept: 'Board' },
    { username: 'supervisor', pass: 'Nash@123', label: 'Production Supervisor', role: 'production', type: 'staff', dept: 'Manufacturing' },
    { username: 'inventory_mgr', pass: 'Nash@123', label: 'Inventory Manager', role: 'inventory', type: 'staff', dept: 'Warehouse' },
    { username: 'purchase_mgr', pass: 'Nash@123', label: 'Purchase Manager', role: 'purchase', type: 'staff', dept: 'Procurement' },
    { username: 'accountant', pass: 'Nash@123', label: 'Senior Accountant', role: 'accountant', type: 'staff', dept: 'Finance' },
    { username: 'auditor', pass: 'Nash@123', label: 'Statutory Auditor', role: 'auditor', type: 'staff', dept: 'Audit' },
  ];

  const handleSelectDemo = (account: typeof demoAccounts[0]) => {
    setLoginMode(account.type as any);
    setUsername(account.username);
    setPassword(account.pass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (loginMode === 'admin') {
        res = await api.adminLogin({ username, password });
      } else {
        res = await api.login({ username, password });
      }

      if (!res.success) {
        throw new Error(res.error || 'Authentication failed');
      }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/30 text-white font-extrabold text-2xl mb-4 border border-indigo-400/40">
          Z
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          ZenLyft Manufacturing OS
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Commercial Multi-User Operating System • Centre for Digital Infrastructure
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        {/* Three Distinct Login Experiences Tab Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-950/60 rounded-xl border border-slate-700/60 mb-6 backdrop-blur-md text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLoginMode('salesman')}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-lg text-emerald-400 hover:text-white hover:bg-slate-800/50 transition font-bold"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Salesman Mobile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('admin');
              setUsername('factory_admin');
              setPassword('Admin@123');
              setError(null);
            }}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-lg transition-all ${
              loginMode === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Centre</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('staff');
              setUsername('supervisor');
              setPassword('Nash@123');
              setError(null);
            }}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-lg transition-all ${
              loginMode === 'staff'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Factory Staff</span>
          </button>
        </div>

        {/* Main Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-700/80">
          <div className="mb-6 pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                {loginMode === 'admin' ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>Admin Control Centre Login</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></span>
                    <span>Factory & Accounts Staff Login</span>
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {loginMode === 'admin' 
                  ? 'Authoritative platform management, user administration & executive control.'
                  : 'Role-based access: Production Supervisor, Inventory Manager, Accountant, Auditor.'}
              </p>
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              loginMode === 'admin'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
            }`}>
              {loginMode === 'admin' ? 'ADMIN LEVEL 1' : 'STAFF LEVEL 2'}
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Username / Employee ID
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={loginMode === 'admin' ? 'e.g. factory_admin' : 'e.g. supervisor, accountant'}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your confidential password"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-bold text-sm shadow-lg transition-all ${
                loginMode === 'admin'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              } disabled:opacity-50`}
            >
              {loading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <span>
                    {loginMode === 'admin' ? 'Enter Admin Control Centre' : 'Login to Staff Workspace'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>One-Click Role Selection</span>
              </span>
              <span className="text-[11px] text-slate-500">Live MongoDB Atlas</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {demoAccounts.map((acc) => {
                const isSelected = username === acc.username;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`text-left p-2 rounded-lg border text-xs transition ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold truncate">{acc.label}</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                      <span>{acc.username}</span>
                      <span className="font-mono text-[9px] text-indigo-300">{acc.role}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Salesman Direct Mobile Pill Banner */}
        <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-emerald-500/40 shadow-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Using a Mobile Phone in the Field?</h4>
              <p className="text-xs text-slate-400">Switch to the dedicated high-speed mobile terminal</p>
            </div>
          </div>
          <button
            onClick={() => setLoginMode('salesman')}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow-md transition"
          >
            Open Mobile Login
          </button>
        </div>
      </div>
    </div>
  );
};
