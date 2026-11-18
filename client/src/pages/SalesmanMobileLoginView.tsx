import React, { useState } from 'react';
import { 
  Smartphone, 
  Lock, 
  User, 
  MapPin, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  ArrowRight, 
  AlertCircle, 
  Zap, 
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react';
import { api } from '../services/api';
import { AppUser } from '../types';

interface SalesmanMobileLoginViewProps {
  onLoginSuccess: (user: AppUser, token: string) => void;
  onSwitchToAdmin: () => void;
  onSwitchToStaff: () => void;
}

export const SalesmanMobileLoginView: React.FC<SalesmanMobileLoginViewProps> = ({
  onLoginSuccess,
  onSwitchToAdmin,
  onSwitchToStaff
}) => {
  const [username, setUsername] = useState('salesman_a');
  const [password, setPassword] = useState('Nash@123');
  const [territory, setTerritory] = useState('Tamil Nadu Field');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickSelect = (u: string, t: string) => {
    setUsername(u);
    setPassword('Nash@123');
    setTerritory(t);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.salesmanMobileLogin({
        username,
        password,
        routeTerritory: territory
      });

      if (!res.success) {
        throw new Error(res.error || 'Salesman login failed');
      }

      localStorage.setItem('zenlyft_token', res.token);
      localStorage.setItem('zenlyft_user', JSON.stringify(res.user));
      localStorage.setItem('zenlyft_mobile_mode', 'true');
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify salesman credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-6 font-sans">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-700/80 rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col text-white">
        {/* Simulated Phone Top Speaker & Camera Notch */}
        <div className="bg-slate-950 pt-3 pb-2 px-6 flex items-center justify-between border-b border-slate-800">
          <span className="text-[11px] font-mono font-semibold text-slate-400">9:41 AM</span>
          <div className="w-20 h-4 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950"></div>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="text-[10px] font-bold text-emerald-400">5G</span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <div className="w-4 h-2 border border-slate-400 rounded-sm p-0.5 flex items-center">
              <div className="w-full h-full bg-emerald-400"></div>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="p-6 pb-4 bg-gradient-to-b from-slate-900 to-indigo-950/60 border-b border-slate-800 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 text-slate-950 mb-3 font-black text-xl">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Salesman Mobile Terminal</h2>
          <p className="text-xs text-emerald-400 font-semibold mt-0.5">ZenLyft Field Order & Collection OS</p>
          <div className="mt-2 inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] text-emerald-300 font-medium">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>IndexedDB Offline Engine Armed</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Salesman ID / Mobile No.
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. salesman_a"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Field Password / Quick PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter PIN / Password"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Assigned Route / Territory
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <select
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="Tamil Nadu Field">Tamil Nadu (Madurai / Trichy Route)</option>
                  <option value="Karnataka Field">Karnataka (Bengaluru / Mysuru Route)</option>
                  <option value="Kerala Route">Kerala (Palakkad / Kochi Route)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Syncing Terminal...</span>
              ) : (
                <>
                  <span>Open Salesman Mobile Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Field Selection Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2 text-center">
              Quick 1-Tap Field Salesman Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('salesman_a', 'Tamil Nadu Field')}
                className={`p-2.5 rounded-xl border text-left text-xs transition ${
                  username === 'salesman_a'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold">Salesman A</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Tamil Nadu Route</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('salesman_b', 'Karnataka Field')}
                className={`p-2.5 rounded-xl border text-left text-xs transition ${
                  username === 'salesman_b'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold">Salesman B</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Karnataka Route</div>
              </button>
            </div>
          </div>

          {/* Switch to Other Portals */}
          <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="hover:text-amber-400 flex items-center space-x-1 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Login</span>
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={onSwitchToStaff}
              className="hover:text-indigo-400 flex items-center space-x-1 transition"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Factory Staff Login</span>
            </button>
          </div>
        </div>

        {/* Simulated Phone Bottom Bar */}
        <div className="py-2 flex items-center justify-center bg-slate-950 border-t border-slate-900">
          <div className="w-28 h-1 bg-slate-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
