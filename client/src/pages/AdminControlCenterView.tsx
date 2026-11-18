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
  X,
  Mail,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { AppUser } from '../types';

export const AdminControlCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'permissions' | 'approvals' | 'monitoring' | 'inquiries'>('overview');
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [inquiriesList, setInquiriesList] = useState<any[]>([]);
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
      const [overviewRes, usersRes, inqRes] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getInquiries().catch(() => ({ success: false, inquiries: [] }))
      ]);

      if (overviewRes.success) {
        setAdminData(overviewRes);
      }
      if (usersRes.success) {
        setUsersList(usersRes.users);
      }
      if (inqRes.success) {
        setInquiriesList(inqRes.inquiries || []);
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
        setActionMessage({ type: 'success', text: `User @${formData.username} created successfully!` });
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
        setActionMessage({ 
          type: 'success', 
          text: `Order approved! GST Invoice ${res.invoice?.invoiceNumber} generated & stock allocated.` 
        });
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
      <div className="bg-forest-700 text-cream-50 border border-forest-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-forest-900 border border-forest-600 flex items-center justify-center text-forest-200 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Admin Control Centre</span>
                <span className="text-xs bg-forest-900 text-cream-50 font-semibold px-2 py-0.5 rounded-full border border-forest-600">
                  AUTHORITATIVE
                </span>
              </h1>
              <p className="text-xs text-forest-200 mt-0.5">
                Centralized Business Oversight • Multi-User Governance • Double-Entry Stock & Financial Ledger
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-forest-800 hover:bg-forest-900 text-forest-100 text-xs font-semibold rounded-lg border border-forest-600 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live State</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-cream-50 hover:bg-white text-forest-700 text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4 text-forest-700" />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold border ${
          actionMessage.type === 'success' 
            ? 'bg-forest-100 text-forest-700 border-forest-500/30' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs underline ml-4">Dismiss</button>
        </div>
      )}

      {/* Control Centre Sub-Navigation */}
      <div className="flex border-b border-subtle-border bg-white rounded-t-xl px-4 pt-2 shadow-sm space-x-4 overflow-x-auto">
        {[
          { id: 'overview', label: 'Company Overview & Health', icon: Activity },
          { id: 'users', label: 'User Management', icon: Users, badge: usersList.length },
          { id: 'permissions', label: 'Role & Permission Matrix', icon: ShieldAlert },
          { id: 'approvals', label: 'Approval Centre', icon: CheckCircle, badge: pendingOrders.length },
          { id: 'monitoring', label: 'System Monitoring & Audit', icon: Database },
          { id: 'inquiries', label: 'Public Inquiries & Leads', icon: Mail, badge: inquiriesList.filter(i => i.status === 'new').length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-forest-700 text-forest-700 font-bold'
                  : 'border-transparent text-charcoal-500 hover:text-charcoal-900 hover:border-subtle-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  tab.id === 'approvals' || tab.id === 'inquiries'
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-forest-100 text-forest-700'
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
            <div className="bg-white p-5 rounded-xl border border-subtle-border shadow-sm">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block">Total Revenue</span>
              <p className="text-2xl font-bold text-charcoal-900 mt-1">₹{Number(overview.totalRevenue || 0).toLocaleString('en-IN')}</p>
              <span className="text-[11px] text-forest-600 font-semibold mt-1 block">GST Invoiced Sales</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-subtle-border shadow-sm">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block">Customer Receivables</span>
              <p className="text-2xl font-bold text-amber-700 mt-1">₹{Number(overview.totalReceivables || 0).toLocaleString('en-IN')}</p>
              <span className="text-[11px] text-charcoal-500 mt-1 block">Pending Collections</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-subtle-border shadow-sm">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block">Finished Goods Value</span>
              <p className="text-2xl font-bold text-charcoal-900 mt-1">₹{Number(overview.finishedGoodsStockValue || 0).toLocaleString('en-IN')}</p>
              <span className="text-[11px] text-charcoal-500 mt-1 block">At WAC Cost (₹31.14/pkt)</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-subtle-border shadow-sm">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block">Raw Materials Value</span>
              <p className="text-2xl font-bold text-charcoal-900 mt-1">₹{Number(overview.rawMaterialStockValue || 0).toLocaleString('en-IN')}</p>
              <span className="text-[11px] text-charcoal-500 mt-1 block">Flour, Oil & Packaging</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-subtle-border shadow-sm">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block">Active Users</span>
              <p className="text-2xl font-bold text-forest-700 mt-1">{overview.activeUsersCount || usersList.length}</p>
              <span className="text-[11px] text-forest-600 font-semibold mt-1 block">Multi-Role Sessions</span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-subtle-border shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-charcoal-900 flex items-center space-x-2">
                <Truck className="w-4 h-4 text-forest-700" />
                <span>Sales & Fulfilment Velocity</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-subtle-divider">
                  <span className="text-charcoal-500">Total Sales Orders:</span>
                  <span className="font-bold text-charcoal-900">{overview.totalOrdersCount || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-subtle-divider">
                  <span className="text-charcoal-500">Orders Awaiting Approval:</span>
                  <span className="font-bold text-amber-700">{pendingOrders.length}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-charcoal-500">Invoices Generated:</span>
                  <span className="font-bold text-charcoal-900">{overview.totalInvoicesCount || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-subtle-border shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-charcoal-900 flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-forest-700" />
                <span>Manufacturing & Yield Compliance</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-subtle-divider">
                  <span className="text-charcoal-500">Production Batches Logged:</span>
                  <span className="font-bold text-charcoal-900">{overview.totalProductionRuns || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-subtle-divider">
                  <span className="text-charcoal-500">Standard Yield Benchmark:</span>
                  <span className="font-bold text-charcoal-900">200 pkts (40 kg batch)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-charcoal-500">Tolerance Deviation Limit:</span>
                  <span className="font-bold text-red-600">±3.0% (Automated Alert)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-subtle-border shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-charcoal-900 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-forest-700" />
                <span>OpenWA & WhatsApp Status</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-subtle-divider">
                  <span className="text-charcoal-500">Automation Adapter:</span>
                  <span className="font-semibold text-charcoal-900">OpenWA REST Hook</span>
                </div>
                <div className="flex justify-between py-1 border-b border-subtle-divider">
                  <span className="text-charcoal-500">Notification Dispatch Queue:</span>
                  <span className="font-bold text-forest-700">Online & Active</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-charcoal-500">Database Decoupling:</span>
                  <span className="font-bold text-forest-700">Non-blocking resilient</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-subtle-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-subtle-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cream-50">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">Employee Accounts & Provisioning</h2>
              <p className="text-xs text-charcoal-500">Individual credentials for every factory operator</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Employee Account</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 text-charcoal-500 uppercase font-semibold border-b border-subtle-border">
                <tr>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Role & Permissions</th>
                  <th className="py-3 px-4">Department & Branch</th>
                  <th className="py-3 px-4">Logins</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle-divider">
                {usersList.map((user) => (
                  <tr key={user._id || (user as any).id} className="hover:bg-cream-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-charcoal-900">{user.name}</div>
                      <div className="text-[11px] font-mono text-charcoal-500">@{user.username}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        user.role === 'admin' || user.role === 'owner' ? 'bg-amber-100 text-amber-800' :
                        user.role === 'salesman' ? 'bg-forest-100 text-forest-700' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                      <div className="text-[10px] text-charcoal-500 mt-0.5">
                        {user.permissions?.length || 0} permissions assigned
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-charcoal-900 font-medium">{user.department || 'General'}</div>
                      <div className="text-[10px] text-charcoal-500">{user.branch}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-charcoal-900">{user.loginCount || 0} sessions</div>
                      <div className="text-[10px] text-charcoal-500">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user.active ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-forest-100 text-forest-700">
                          <Check className="w-3 h-3 text-forest-600" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                          <X className="w-3 h-3 text-red-600" />
                          <span>Deactivated</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setShowPasswordModal(user)}
                        title="Reset User Password"
                        className="px-2.5 py-1 bg-cream-100 hover:bg-cream-300 text-charcoal-700 border border-subtle-border rounded text-xs font-semibold transition"
                      >
                        Reset Key
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(user)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
                          user.active 
                            ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' 
                            : 'bg-forest-100 hover:bg-forest-200 text-forest-700 border-forest-500/30'
                        }`}
                      >
                        {user.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Role & Permission Matrix */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-xl border border-subtle-border shadow-sm p-6 space-y-4">
          <div className="border-b border-subtle-border pb-3">
            <h2 className="text-sm font-bold text-charcoal-900">Enterprise Role-Based Access Control (RBAC) Matrix</h2>
            <p className="text-xs text-charcoal-500">Deny-by-default permission checks strictly enforced by Express API middleware</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-subtle-border">
              <thead className="bg-cream-100 text-charcoal-500 uppercase font-semibold border-b border-subtle-border">
                <tr>
                  <th className="py-2.5 px-3">System Capability</th>
                  <th className="py-2.5 px-3 text-center">Salesman</th>
                  <th className="py-2.5 px-3 text-center">Production</th>
                  <th className="py-2.5 px-3 text-center">Inventory</th>
                  <th className="py-2.5 px-3 text-center">Accountant</th>
                  <th className="py-2.5 px-3 text-center">Auditor</th>
                  <th className="py-2.5 px-3 text-center bg-forest-100 text-forest-800">Admin / Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle-divider">
                {[
                  { perm: 'Create Field Sales Orders', s: true, p: false, i: false, a: true, au: false, ad: true },
                  { perm: 'Offline IndexedDB Order Sync', s: true, p: false, i: false, a: false, au: false, ad: true },
                  { perm: 'Approve Sales Orders & Raise Invoices', s: false, p: false, i: false, a: true, au: false, ad: true },
                  { perm: 'Physical Dispatch & Stock Deductions', s: false, p: false, i: true, a: true, au: false, ad: true },
                  { perm: 'Log Production Batches & BOM Draw', s: false, p: true, i: false, a: false, au: false, ad: true },
                  { perm: 'Record Raw Material Purchases & WAC', s: false, p: false, i: true, a: true, au: false, ad: true },
                  { perm: 'Record Customer Payments', s: true, p: false, i: false, a: true, au: false, ad: true },
                  { perm: 'View Confidential Costing & Margins', s: false, p: false, i: false, a: true, au: true, ad: true },
                  { perm: 'User Provisioning & Password Resets', s: false, p: false, i: false, a: false, au: false, ad: true },
                  { perm: 'System Settings & OpenWA Webhooks', s: false, p: false, i: false, a: false, au: false, ad: true },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-cream-50 transition">
                    <td className="py-2.5 px-3 font-semibold text-charcoal-900">{row.perm}</td>
                    <td className="py-2.5 px-3 text-center">{row.s ? <Check className="w-4 h-4 text-forest-600 inline" /> : <X className="w-4 h-4 text-gray-300 inline" />}</td>
                    <td className="py-2.5 px-3 text-center">{row.p ? <Check className="w-4 h-4 text-forest-600 inline" /> : <X className="w-4 h-4 text-gray-300 inline" />}</td>
                    <td className="py-2.5 px-3 text-center">{row.i ? <Check className="w-4 h-4 text-forest-600 inline" /> : <X className="w-4 h-4 text-gray-300 inline" />}</td>
                    <td className="py-2.5 px-3 text-center">{row.a ? <Check className="w-4 h-4 text-forest-600 inline" /> : <X className="w-4 h-4 text-gray-300 inline" />}</td>
                    <td className="py-2.5 px-3 text-center">{row.au ? <Check className="w-4 h-4 text-forest-600 inline" /> : <X className="w-4 h-4 text-gray-300 inline" />}</td>
                    <td className="py-2.5 px-3 text-center bg-forest-50/50 font-bold">{row.ad ? <Check className="w-4 h-4 text-forest-700 inline" /> : <X className="w-4 h-4 text-gray-300 inline" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 4: Approval Centre */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-xl border border-subtle-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-subtle-border bg-cream-50">
            <h2 className="text-sm font-bold text-charcoal-900">Pending Sales Order Approvals</h2>
            <p className="text-xs text-charcoal-500">Every commercial order requires Admin review before stock allocation and invoicing</p>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="p-12 text-center text-charcoal-500">
              <CheckCircle className="w-10 h-10 text-forest-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-charcoal-900">Zero Pending Approvals</p>
              <p className="text-xs text-charcoal-500 mt-1">All sales orders have been reviewed and processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-charcoal-500 uppercase font-semibold border-b border-subtle-border">
                  <tr>
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Customer & Route</th>
                    <th className="py-3 px-4">Ordered Items</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Stock Availability Check</th>
                    <th className="py-3 px-4 text-right">Administrative Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-divider">
                  {pendingOrders.map((o: any) => (
                    <tr key={o._id} className="hover:bg-cream-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-charcoal-900">
                        {o.orderNumber}
                        <div className="text-[10px] text-charcoal-500 font-normal">{new Date(o.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-charcoal-900">{o.customerName}</div>
                        <div className="text-[10px] text-charcoal-500">Logged by: {o.salesmanName}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-charcoal-900">
                        {o.items?.map((i: any) => `${i.quantity} pkts of ${i.productCode}`).join(', ')}
                      </td>
                      <td className="py-3 px-4 font-bold text-charcoal-900">
                        ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        {o.stockCheck?.isSufficient ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-forest-100 text-forest-700">
                            <Check className="w-3 h-3 text-forest-600" />
                            <span>Available ({o.stockCheck.availableStock} in stock)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Shortage: {o.stockCheck?.shortageQuantity} pkts</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleRejectOrder(o._id)}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-semibold transition"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveOrder(o._id)}
                          className="px-3.5 py-1 bg-forest-700 hover:bg-forest-800 text-white rounded text-xs font-semibold transition shadow-sm"
                        >
                          Approve & Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subtab 5: Monitoring & Audit Trail */}
      {activeTab === 'monitoring' && (
        <div className="bg-white rounded-xl border border-subtle-border shadow-sm p-6 space-y-4">
          <div className="border-b border-subtle-border pb-3">
            <h2 className="text-sm font-bold text-charcoal-900">System Telemetry & Live Platform Health</h2>
            <p className="text-xs text-charcoal-500">Database cluster, memory allocation, and immutable audit logs</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-cream-50 p-4 rounded-xl border border-subtle-border">
              <span className="text-[11px] font-bold text-charcoal-500 uppercase block">Cloud Database Status</span>
              <span className="text-base font-bold text-forest-700 block mt-1">CONNECTED</span>
              <span className="text-[11px] font-mono text-charcoal-500 mt-1 block">niresh.uhlva1x.mongodb.net</span>
            </div>

            <div className="bg-cream-50 p-4 rounded-xl border border-subtle-border">
              <span className="text-[11px] font-bold text-charcoal-500 uppercase block">Total Audit Trail Events</span>
              <span className="text-base font-bold text-charcoal-900 block mt-1">{monitoring.auditLogsCount || 0} events</span>
              <span className="text-[11px] text-charcoal-500 mt-1 block">Tamper-evident logs</span>
            </div>

            <div className="bg-cream-50 p-4 rounded-xl border border-subtle-border">
              <span className="text-[11px] font-bold text-charcoal-500 uppercase block">System Uptime</span>
              <span className="text-base font-bold text-charcoal-900 block mt-1">{Math.floor(monitoring.uptimeSeconds / 60) || 0} minutes</span>
              <span className="text-[11px] text-forest-600 font-semibold mt-1 block">Zero crash restarts</span>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 6: Public Inquiries & Leads */}
      {activeTab === 'inquiries' && (
        <div className="bg-white rounded-xl border border-subtle-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-subtle-border bg-cream-50">
            <h2 className="text-sm font-bold text-charcoal-900">Inbound Commercial Inquiries & Pilot Requests</h2>
            <p className="text-xs text-charcoal-500">Submissions captured directly from the public landing page (/contact and /register)</p>
          </div>

          {inquiriesList.length === 0 ? (
            <div className="p-12 text-center text-charcoal-500">
              <Mail className="w-10 h-10 text-charcoal-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-charcoal-900">No Inquiries Logged Yet</p>
              <p className="text-xs text-charcoal-500 mt-1">Visitors submitting contact or pilot forms will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 text-charcoal-500 uppercase font-semibold border-b border-subtle-border">
                  <tr>
                    <th className="py-3 px-4">Contact Lead</th>
                    <th className="py-3 px-4">Company & Fleet</th>
                    <th className="py-3 px-4">Inquiry Category</th>
                    <th className="py-3 px-4">Message / Requirements</th>
                    <th className="py-3 px-4">Date Logged</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-divider">
                  {inquiriesList.map((inq: any) => (
                    <tr key={inq._id} className="hover:bg-cream-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-charcoal-900">{inq.name}</div>
                        <div className="text-[11px] text-charcoal-500">{inq.email} • {inq.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-charcoal-900">{inq.company}</div>
                        <div className="text-[10px] text-charcoal-500">Fleet: {inq.fleetSize || '1-5'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inq.inquiryType === 'pilot_registration' ? 'bg-forest-100 text-forest-700' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {inq.inquiryType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-charcoal-700 max-w-xs truncate">
                        {inq.message || 'Standard inquiry'}
                      </td>
                      <td className="py-3 px-4 text-charcoal-500 text-[11px]">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                          {inq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-subtle-border">
            <h3 className="font-bold text-charcoal-900 text-base">Provision New User Account</h3>
            <p className="text-xs text-charcoal-500 mt-1">Add individual credential and department permissions</p>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Anand Parthiban"
                  className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                    placeholder="salesman_c"
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Assigned Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs"
                  >
                    <option value="salesman">Salesman (Field)</option>
                    <option value="production">Production Supervisor</option>
                    <option value="inventory">Inventory Manager</option>
                    <option value="purchase">Purchase Manager</option>
                    <option value="accountant">Senior Accountant</option>
                    <option value="auditor">Auditor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-subtle-divider flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-subtle-border rounded-lg text-xs font-semibold text-charcoal-700 hover:bg-cream-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-subtle-border">
            <h3 className="font-bold text-charcoal-900 text-base">Reset User Password</h3>
            <p className="text-xs text-charcoal-500 mt-1">For user @{showPasswordModal.username} ({showPasswordModal.name})</p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">New Secure Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-subtle-divider flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(null)}
                  className="px-3 py-1.5 border border-subtle-border rounded-lg text-xs font-semibold text-charcoal-700 hover:bg-cream-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold shadow-sm"
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
