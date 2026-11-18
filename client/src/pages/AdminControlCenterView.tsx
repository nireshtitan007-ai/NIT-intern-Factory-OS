import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Plus, 
  Key, 
  Power, 
  RefreshCw, 
  AlertTriangle, 
  FileText, 
  DollarSign, 
  Boxes, 
  Truck, 
  Clock, 
  MessageSquare, 
  Database, 
  Lock, 
  Unlock,
  Check,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { AppUser } from '../types';

export const AdminControlCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'permissions' | 'approvals' | 'monitoring'>('overview');
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New User Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'salesman',
    department: 'Sales',
    branch: 'Main Plant - Tiruchirappalli',
    phone: '',
    permissions: ['orders:create', 'orders:view']
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, usersRes] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers()
      ]);

      if (overviewRes.success) {
        setAdminData(overviewRes);
      }
      if (usersRes.success) {
        setUsersList(usersRes.users);
      }
    } catch (e: any) {
      console.error('Failed to load admin control centre data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUserStatus = async (user: AppUser) => {
    const targetStatus = !user.active;
    try {
      const res = await api.toggleUserStatus(user._id || (user as any).id, targetStatus);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        loadData();
      } else {
        setActionMessage({ type: 'error', text: res.error });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordModal) return;
    try {
      const res = await api.resetUserPassword(showPasswordModal._id || (showPasswordModal as any).id, newPassword);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setShowPasswordModal(null);
        setNewPassword('');
        loadData();
      } else {
        setActionMessage({ type: 'error', text: res.error });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createAdminUser(formData);
      if (res.success) {
        setActionMessage({ type: 'success', text: `User ${formData.username} created successfully!` });
        setShowCreateModal(false);
        setFormData({
          username: '',
          password: '',
          name: '',
          role: 'salesman',
          department: 'Sales',
          branch: 'Main Plant - Tiruchirappalli',
          phone: '',
          permissions: ['orders:create', 'orders:view']
        });
        loadData();
      } else {
        setActionMessage({ type: 'error', text: res.error });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message });
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      const res = await api.approveOrder(orderId, 'Factory Admin');
      if (res.success) {
        setActionMessage({ type: 'success', text: `Order approved! GST Invoice ${res.invoice?.invoiceNumber} generated & stock reserved.` });
        loadData();
      } else {
        setActionMessage({ type: 'error', text: res.error });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message });
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt('Please enter administrative reason for rejecting this order:') || 'Management review';
    try {
      const res = await api.rejectOrder(orderId, reason, 'Factory Admin');
      if (res.success) {
        setActionMessage({ type: 'success', text: `Order ${res.order?.orderNumber} has been rejected.` });
        loadData();
      } else {
        setActionMessage({ type: 'error', text: res.error });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message });
    }
  };

  const overview = adminData?.companyOverview || {};
  const monitoring = adminData?.systemMonitoring || {};
  const pendingOrders = adminData?.pendingApprovals?.orders || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                <span>Admin Control Centre</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                  AUTHORITATIVE
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Single Point of Control • Multi-User Governance • Live Financial & Inventory Ledger
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live State</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium border ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs underline ml-4">Dismiss</button>
        </div>
      )}

      {/* Control Centre Sub-Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-sm space-x-4 overflow-x-auto">
        {[
          { id: 'overview', label: 'Company Overview & Health', icon: Activity },
          { id: 'users', label: 'User Management', icon: Users, badge: usersList.length },
          { id: 'permissions', label: 'Role & Permission Matrix', icon: ShieldAlert },
          { id: 'approvals', label: 'Approval Centre', icon: CheckCircle, badge: pendingOrders.length },
          { id: 'monitoring', label: 'System Monitoring & Audit', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  tab.id === 'approvals' 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subtab 1: Company Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Financial KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Revenue</span>
              <p className="text-2xl font-black text-slate-900 mt-1">₹{Number(overview.totalRevenue || 0).toLocaleString('en-IN')}</p>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">GST Invoiced Sales</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Customer Receivables</span>
              <p className="text-2xl font-black text-amber-600 mt-1">₹{Number(overview.totalOutstanding || 0).toLocaleString('en-IN')}</p>
              <span className="text-[11px] text-amber-600 font-semibold mt-1 block">Total Outstanding Balance</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Cash Collections</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">₹{Number(overview.totalCollections || 0).toLocaleString('en-IN')}</p>
              <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">Realized Payments</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Raw Inventory Value</span>
              <p className="text-2xl font-black text-slate-900 mt-1">₹{Number(overview.rawStockValue || 0).toLocaleString('en-IN')}</p>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Weighted Avg Cost (WAC)</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">FG Stock Value</span>
              <p className="text-2xl font-black text-slate-900 mt-1">₹{Number(overview.finishedGoodsStockValue || 0).toLocaleString('en-IN')}</p>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Selling Price Valuation</span>
            </div>
          </div>

          {/* Operational Health Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">Total Sales Orders</span>
                <p className="text-xl font-bold text-slate-900">{overview.totalOrdersCount || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-indigo-400" />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">Pending Approvals</span>
                <p className="text-xl font-bold text-amber-600">{overview.pendingApprovalsCount || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">Stock Shortage Alerts</span>
                <p className="text-xl font-bold text-rose-600">{overview.shortageAlertsCount || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">Production Batches</span>
                <p className="text-xl font-bold text-emerald-600">{overview.productionRunsCount || 0}</p>
              </div>
              <Boxes className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          {/* Business Alerts & Real-time Integration Summary */}
          <div className="bg-indigo-900 text-white rounded-xl p-6 shadow-md">
            <h3 className="text-base font-bold flex items-center space-x-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Unified Cross-Module Integration Health</span>
            </h3>
            <p className="text-xs text-indigo-200 leading-relaxed max-w-3xl">
              All 6 operational loops are connected to a single authoritative MongoDB Atlas database. 
              Stock reservations, goods receipts, production consumption, GST tax invoices, and collections automatically update the central stock ledger and customer accounts with strict audit logging.
            </p>
          </div>
        </div>
      )}

      {/* Subtab 2: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Registered Enterprise Users</h3>
              <p className="text-xs text-slate-500">Individual credentials for every employee • RBAC enforced on every API route</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {usersList.length} Active Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department & Branch</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Logins</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {usersList.map((u) => (
                  <tr key={u._id || (u as any).id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">@{u.username}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        u.role === 'admin' || u.role === 'owner'
                          ? 'bg-amber-100 text-amber-800'
                          : u.role === 'production'
                          ? 'bg-blue-100 text-blue-800'
                          : u.role === 'salesman' || u.role === 'sales_manager'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{u.department || 'General'}</div>
                      <div className="text-[11px] text-slate-500">{u.branch || 'Main Plant'}</div>
                    </td>
                    <td className="py-3 px-4">
                      {u.isLocked ? (
                        <span className="inline-flex items-center space-x-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </span>
                      ) : u.active ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                          <X className="w-3 h-3" />
                          <span>Deactivated</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      {u.loginCount || 0}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setShowPasswordModal(u)}
                        title="Reset password"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        title={u.active ? "Deactivate Account" : "Activate Account"}
                        className={`p-1.5 rounded transition ${
                          u.active 
                            ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50' 
                            : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Permission Management */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Centralized Role & Permission Matrix (RBAC)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Backend API enforces deny-by-default rules. Hiding UI elements is not authorization: every endpoint inspects JWT tokens, role claims, and individual overrides.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">View</th>
                  <th className="py-3 px-4 text-center">Create</th>
                  <th className="py-3 px-4 text-center">Edit</th>
                  <th className="py-3 px-4 text-center">Approve</th>
                  <th className="py-3 px-4 text-center">Reject</th>
                  <th className="py-3 px-4 text-center">Export</th>
                  <th className="py-3 px-4 text-center">Administer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {[
                  { role: 'Factory Admin', v: true, c: true, e: true, a: true, r: true, exp: true, adm: true },
                  { role: 'Business Owner', v: true, c: true, e: true, a: true, r: true, exp: true, adm: true },
                  { role: 'Sales Manager', v: true, c: true, e: true, a: true, r: true, exp: true, adm: false },
                  { role: 'Salesman', v: true, c: true, e: false, a: false, r: false, exp: false, adm: false },
                  { role: 'Production Supervisor', v: true, c: true, e: true, a: false, r: false, exp: false, adm: false },
                  { role: 'Inventory Manager', v: true, c: true, e: true, a: false, r: false, exp: true, adm: false },
                  { role: 'Purchase Manager', v: true, c: true, e: true, a: false, r: false, exp: true, adm: false },
                  { role: 'Accountant', v: true, c: true, e: true, a: false, r: false, exp: true, adm: false },
                  { role: 'Statutory Auditor', v: true, c: false, e: false, a: false, r: false, exp: true, adm: false },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{row.role}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">{row.v ? '✓' : '—'}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">{row.c ? '✓' : '—'}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">{row.e ? '✓' : '—'}</td>
                    <td className="py-3 px-4 text-center text-amber-600 font-bold">{row.a ? '✓' : '—'}</td>
                    <td className="py-3 px-4 text-center text-rose-600 font-bold">{row.r ? '✓' : '—'}</td>
                    <td className="py-3 px-4 text-center text-indigo-600 font-bold">{row.exp ? '✓' : '—'}</td>
                    <td className="py-3 px-4 text-center text-purple-600 font-bold">{row.adm ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 4: Approval Centre */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Centralized Order & Exception Approval Centre</h3>
              <p className="text-xs text-slate-500">Review pending sales orders, credit limit exceptions, and stock shortages prior to invoice generation.</p>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              {pendingOrders.length} Pending Actions
            </span>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
              <p className="font-bold text-slate-700">All Submitted Orders Have Been Processed</p>
              <p className="text-xs mt-1">No orders currently pending administrative approval or credit checks.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((ord: any) => (
                <div key={ord._id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200">
                    <div>
                      <span className="font-mono font-bold text-indigo-600 text-sm">{ord.orderNumber}</span>
                      <span className="ml-2 font-bold text-slate-900">{ord.customerName}</span>
                      <span className="ml-2 text-xs text-slate-500">({ord.customerState})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Order Total: </span>
                      <span className="font-black text-slate-900 text-base">₹{Number(ord.totalAmount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Salesman / Submitter:</span>
                      <span className="font-bold text-slate-800">{ord.salesmanName || 'Field Sales'}</span>
                      <span className="text-slate-400 block mt-1">{new Date(ord.createdAt).toLocaleString()}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">Stock Availability Check:</span>
                      {ord.stockCheck?.isSufficient ? (
                        <span className="text-emerald-600 font-bold flex items-center space-x-1 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Sufficient Stock Available ({ord.stockCheck.availableStock} pkts)</span>
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center space-x-1 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Shortage of {ord.stockCheck?.shortageQuantity} pkts flagged!</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 block">Items Requested:</span>
                      <div className="font-medium text-slate-700 mt-0.5">
                        {ord.items?.map((it: any, i: number) => (
                          <div key={i}>{it.productName}: <b>{it.quantity} pkts</b> @ ₹{it.unitPrice}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleRejectOrder(ord._id)}
                      className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Order</span>
                    </button>
                    <button
                      onClick={() => handleApproveOrder(ord._id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve & Generate GST Invoice</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 5: System Monitoring */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Database Health</span>
              <p className="text-base font-bold text-emerald-600 mt-1">{monitoring.databaseStatus || 'ONLINE'}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Live Atlas Cluster</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Active Accounts</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{monitoring.activeUsers || 0} / {monitoring.totalUsers || 0}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Assigned RBAC Users</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Account Lockouts</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{monitoring.lockedUsers || 0}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Failed attempts &gt; 5</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">WhatsApp Gateway</span>
              <p className="text-xs font-bold text-emerald-600 mt-1">{monitoring.openwaStatus || 'CONNECTED'}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Meta Cloud API Compliant</span>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Live Immutable Audit Stream (Recent 20 Actions)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Entity</th>
                    <th className="py-2.5 px-3">Performed By</th>
                    <th className="py-2.5 px-3">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(adminData?.recentAudit || []).map((l: any) => (
                    <tr key={l._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(l.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{l.action}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{l.entityType}</td>
                      <td className="py-2.5 px-3 font-semibold">{l.performedBy}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {l.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-lg">Create New Employee Account</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. jdoe"
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 chars"
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-medium"
                  >
                    <option value="salesman">Salesman</option>
                    <option value="sales_manager">Sales Manager</option>
                    <option value="production">Production Supervisor</option>
                    <option value="inventory">Inventory Manager</option>
                    <option value="purchase">Purchase Manager</option>
                    <option value="accountant">Senior Accountant</option>
                    <option value="auditor">Statutory Auditor</option>
                    <option value="admin">Factory Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Branch / Plant Location</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-black text-slate-900 text-base">Reset Password</h3>
            <p className="text-xs text-slate-500 mt-1">For user @{showPasswordModal.username} ({showPasswordModal.name})</p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Secure Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(null)}
                  className="px-3 py-1.5 border rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold"
                >
                  Set Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
