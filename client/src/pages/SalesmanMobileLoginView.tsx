import React, { useState } from 'react';
import {
  Lock,
  User,
  MapPin,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Building2,
  Users,
  Compass,
  Eye,
  EyeOff
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [territory, setTerritory] = useState('Tamil Nadu Field');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showEvalTools = import.meta.env.VITE_SHOW_EVAL_TOOLS === 'true';

  const handleQuickSelect = (u: string, t: string) => {
    setUsername(u);
    setPassword('ZenLyft@123');
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
    <div className="min-h-screen bg-cream-200 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-forest-700 text-white flex items-center justify-center font-bold text-sm">
            Z
          </div>
          <div>
            <h1 className="font-bold text-sm text-charcoal-900 leading-tight">ZenLyft Mobile</h1>
            <span className="text-[10px] text-forest-700 font-semibold block uppercase">Field Terminal</span>
          </div>
        </div>
      </header>

      {/* Main Responsive Login Card */}
      <main className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-2xl border border-subtle-border shadow-sm p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-forest-100 text-forest-700 font-bold mb-3">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-charcoal-900 tracking-tight">Salesman Field Sign In</h2>
            <p className="text-xs text-charcoal-500 mt-1">
              Offline-ready order capture & daily customer route management
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
                Salesman ID / Username
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
                  placeholder="Enter salesman username"
                  className="w-full pl-9 pr-3 py-2.5 bg-cream-50 border border-subtle-border rounded-xl text-charcoal-900 text-xs placeholder-charcoal-500 focus:outline-none focus:ring-1 focus:ring-forest-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Access Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-9 pr-10 py-2.5 bg-cream-50 border border-subtle-border rounded-xl text-charcoal-900 text-xs placeholder-charcoal-500 focus:outline-none focus:ring-1 focus:ring-forest-700 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-400 hover:text-charcoal-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Assigned Route Territory
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-500">
                  <MapPin className="h-4 w-4" />
                </div>
                <select
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-cream-50 border border-subtle-border rounded-xl text-charcoal-900 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700 font-medium"
                >
                  <option value="Tamil Nadu Field">Tamil Nadu Field Route (Trichy Central)</option>
                  <option value="Tiruchirappalli North">Tiruchirappalli North Wholesale</option>
                  <option value="Madurai East">Madurai East Retail Route</option>
                  <option value="Coimbatore Commercial">Coimbatore Commercial Zone</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating Route Terminal...' : 'Enter Field Terminal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Select for Evaluation / Field Testing */}
          {showEvalTools && (
            <details className="mt-6 pt-4 border-t border-subtle-divider text-xs text-charcoal-500">
              <summary className="cursor-pointer font-semibold text-charcoal-600 hover:text-charcoal-900 text-center select-none">
                Evaluation Access (Preconfigured Sales Accounts)
              </summary>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => handleQuickSelect('salesman_a', 'Tamil Nadu Field')}
                  className={`p-2.5 rounded-lg border text-left transition ${username === 'salesman_a'
                      ? 'border-forest-700 bg-forest-100 text-forest-700 font-bold'
                      : 'border-subtle-border bg-cream-50 text-charcoal-700 hover:bg-cream-100'
                    }`}
                >
                  <div className="text-xs font-semibold">Salesman A</div>
                  <div className="text-[10px] text-charcoal-500">Tamil Nadu Route</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSelect('salesman_b', 'Tiruchirappalli North')}
                  className={`p-2.5 rounded-lg border text-left transition ${username === 'salesman_b'
                      ? 'border-forest-700 bg-forest-100 text-forest-700 font-bold'
                      : 'border-subtle-border bg-cream-50 text-charcoal-700 hover:bg-cream-100'
                    }`}
                >
                  <div className="text-xs font-semibold">Salesman B</div>
                  <div className="text-[10px] text-charcoal-500">Trichy Wholesale</div>
                </button>
              </div>
            </details>
          )}
        </div>

        {/* Portal Switchers */}
        <div className="mt-4 flex items-center justify-center space-x-4 text-xs font-semibold text-charcoal-500">
          <button
            onClick={onSwitchToAdmin}
            className="hover:text-forest-700 transition flex items-center space-x-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
            <span>Admin Control Centre</span>
          </button>
          <span>•</span>
          <button
            onClick={onSwitchToStaff}
            className="hover:text-forest-700 transition flex items-center space-x-1"
          >
            <Users className="w-3.5 h-3.5 text-forest-600" />
            <span>Factory Staff Login</span>
          </button>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-md w-full mx-auto text-center py-2 text-[11px] text-charcoal-500">
        ZenLyft Manufacturing OS v1.0.0 • Field Terminal
      </footer>
    </div>
  );
};
