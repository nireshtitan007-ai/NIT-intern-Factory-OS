import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { UserRole, AppUser } from '../types';
import { offlineDb } from '../db/offlineDb';
import { api } from '../services/api';
import { useT } from '../i18n/useT';
import { ResetDemoModal } from './ResetDemoModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { 
  Building2, 
  Factory, 
  Boxes, 
  FileSpreadsheet, 
  Play, 
  RotateCcw,
  MessageSquare, 
  LogOut, 
  ShieldCheck, 
  Compass, 
  User, 
  TrendingUp,
  Search,
  Bell,
  Languages,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  X,
  FileText,
  PackageCheck
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
  isProcessing,
  currentUser,
  onLogout,
  onOpenProfile,
  isProfileActive = false
}) => {
  const isAdminOrOwner = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  const isSalesman = currentUser?.role === 'salesman' || currentUser?.role === 'sales_manager';
  const showEvalTools = currentUser?.role === 'admin' && import.meta.env.VITE_SHOW_EVAL_TOOLS === 'true';

  // Factory name from settings with fallback
  const [factoryName, setFactoryName] = useState<string>('ZenLyft Foods');

  // Tamil/English toggle
  const { lang, toggleLang } = useT();

  // Offline queue count from Dexie
  const queuedOrdersCount = useLiveQuery(
    async () => {
      try {
        return await offlineDb.offlineOrdersQueue.where('status').equals('QUEUED').count();
      } catch {
        return 0;
      }
    },
    [],
    0
  );

  // Modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Dropdown states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; desc: string; type: 'warning' | 'info' | 'alert'; time: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    invoices: Array<{ id: string; number: string; customer: string; amount: number }>;
    orders: Array<{ id: string; number: string; customer: string; status: string }>;
    customers: Array<{ id: string; name: string; code: string; phone: string }>;
  }>({ invoices: [], orders: [], customers: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch factory settings once
  useEffect(() => {
    let mounted = true;
    api.getSettings()
      .then(res => {
        if (mounted && res?.success && res?.settings?.tradeName) {
          setFactoryName(res.settings.tradeName);
        } else if (mounted && res?.settings?.legalName) {
          setFactoryName(res.settings.legalName);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchResults(true);
      } else if (e.key === 'Escape') {
        setShowSearchResults(false);
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load notifications
  useEffect(() => {
    if (!currentUser) return;
    let isCancelled = false;

    const loadNotifications = async () => {
      try {
        const notifs: Array<{ id: string; title: string; desc: string; type: 'warning' | 'info' | 'alert'; time: string }> = [];

        // 1. Production variance alerts (for admin, owner, production, auditor)
        if (currentUser.role === 'admin' || currentUser.role === 'owner' || currentUser.role === 'production' || currentUser.role === 'auditor') {
          const runRes = await api.getProductionRuns().catch(() => null);
          if (runRes?.runs) {
            const flaggedRuns = runRes.runs.filter((r: any) => r.yieldVarianceFlagged || r.flourVarianceFlagged || r.oilVarianceFlagged).slice(0, 3);
            flaggedRuns.forEach((r: any) => {
              notifs.push({
                id: `prod-${r._id || r.runNumber}`,
                title: `Production Variance: ${r.runNumber}`,
                desc: `Yield ${r.yieldPercent}%, Flour ${r.flourVariancePercent > 0 ? '+' : ''}${r.flourVariancePercent}%, Oil ${r.oilVariancePercent > 0 ? '+' : ''}${r.oilVariancePercent}%`,
                type: 'warning',
                time: new Date(r.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              });
            });
          }
        }

        // 2. Low stock alerts (for admin, owner, production, inventory, purchase)
        if (['admin', 'owner', 'production', 'inventory', 'purchase', 'accountant'].includes(currentUser.role)) {
          const alertRes = await api.getReorderAlerts().catch(() => null);
          if (alertRes?.alerts && alertRes.alerts.length > 0) {
            alertRes.alerts.slice(0, 3).forEach((a: any) => {
              notifs.push({
                id: `stock-${a.materialCode}`,
                title: `Low Stock Alert: ${a.name}`,
                desc: `Current: ${a.currentStock} ${a.unit} (Reorder level: ${a.reorderLevel} ${a.unit})`,
                type: 'alert',
                time: 'Immediate'
              });
            });
          }
        }

        // 3. Submitted orders awaiting approval (admin/owner)
        if (isAdminOrOwner) {
          const orderRes = await api.getOrders().catch(() => null);
          if (orderRes?.orders) {
            const pendingOrders = orderRes.orders.filter((o: any) => o.status === 'SUBMITTED').slice(0, 3);
            pendingOrders.forEach((o: any) => {
              notifs.push({
                id: `order-${o.orderNumber}`,
                title: `Pending Approval: ${o.orderNumber}`,
                desc: `Order by ${o.salesmanName} for ${o.customerName} (₹${((o.totalAmountPaise || 0) / 100).toLocaleString('en-IN')})`,
                type: 'info',
                time: new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              });
            });
          }
        }

        if (!isCancelled) {
          setNotifications(notifs);
          setUnreadCount(notifs.length);
        }
      } catch {
        // Soft fallback
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [currentUser]);

  // Execute Search
  const executeSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults({ invoices: [], orders: [], customers: [] });
      return;
    }

    setIsSearching(true);
    const q = query.toLowerCase().trim();

    try {
      const results: {
        invoices: Array<{ id: string; number: string; customer: string; amount: number }>;
        orders: Array<{ id: string; number: string; customer: string; status: string }>;
        customers: Array<{ id: string; name: string; code: string; phone: string }>;
      } = { invoices: [], orders: [], customers: [] };

      // Invoices & Orders (if role permitted)
      const canSeeFinances = ['admin', 'owner', 'accountant', 'auditor', 'salesman', 'sales_manager'].includes(currentUser?.role || '');
      
      const promises: Promise<any>[] = [];
      if (canSeeFinances) {
        promises.push(
          api.getInvoices().then(res => {
            if (res?.invoices) {
              results.invoices = res.invoices
                .filter((inv: any) => 
                  inv.invoiceNumber?.toLowerCase().includes(q) ||
                  inv.customerName?.toLowerCase().includes(q)
                )
                .slice(0, 5)
                .map((inv: any) => ({
                  id: inv._id,
                  number: inv.invoiceNumber,
                  customer: inv.customerName,
                  amount: (inv.grandTotalPaise || 0) / 100
                }));
            }
          }).catch(() => {})
        );

        promises.push(
          api.getOrders().then(res => {
            if (res?.orders) {
              results.orders = res.orders
                .filter((ord: any) => 
                  ord.orderNumber?.toLowerCase().includes(q) ||
                  ord.customerName?.toLowerCase().includes(q)
                )
                .slice(0, 5)
                .map((ord: any) => ({
                  id: ord._id,
                  number: ord.orderNumber,
                  customer: ord.customerName,
                  status: ord.status
                }));
            }
          }).catch(() => {})
        );
      }

      // Customers
      promises.push(
        api.getCustomers().then(res => {
          if (res?.customers) {
            results.customers = res.customers
              .filter((c: any) => 
                c.name?.toLowerCase().includes(q) ||
                c.code?.toLowerCase().includes(q) ||
                c.phone?.includes(q)
              )
              .slice(0, 5)
              .map((c: any) => ({
                id: c._id,
                name: c.name,
                code: c.code,
                phone: c.phone
              }));
          }
        }).catch(() => {})
      );

      await Promise.all(promises);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowSearchResults(true);
    executeSearch(val);
  };

  // Human page title subtitle mapping
  const getPageTitleSubtitle = (role: UserRole) => {
    if (isProfileActive) return 'My Account Profile';
    switch (role) {
      case 'admin': return 'Admin Control Centre';
      case 'owner': return 'Executive Overview';
      case 'salesman': return 'Customer Route Terminal';
      case 'production': return 'Production Floor';
      case 'accountant': return 'Inventory & Stock Ledger';
      case 'auditor': return 'Auditor Portal';
      case 'whatsapp': return 'Notification Center';
      default: return 'Manufacturing OS';
    }
  };

  const allRoles: Array<{ role: UserRole; label: string; icon: any; desc: string }> = [
    { role: 'admin', label: 'Admin Control Centre', icon: Building2, desc: 'Central Platform Oversight' },
    { role: 'owner', label: 'Owner Intelligence', icon: TrendingUp, desc: 'Executive Profit & Fleet Visibility' },
    { role: 'salesman', label: 'Field Terminal', icon: Compass, desc: 'Mobile Route Orders' },
    { role: 'production', label: 'Production Floor', icon: Factory, desc: 'BOM & Batch Runs' },
    { role: 'accountant', label: 'Central Inventory', icon: Boxes, desc: 'Authoritative Stock Ledger' },
    { role: 'auditor', label: 'Auditor Portal', icon: FileSpreadsheet, desc: 'GST, Sales, Traceability' },
    { role: 'whatsapp', label: 'Notification Center', icon: MessageSquare, desc: 'Automated Dispatch Hub' },
  ];

  const visibleRoles = isAdminOrOwner 
    ? allRoles 
    : isSalesman
    ? allRoles.filter(r => r.role === 'salesman')
    : allRoles.filter(r => r.role !== 'admin');

  // User initials
  const userInitials = (currentUser?.name || currentUser?.username || 'U')
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="bg-forest-700 text-cream-50 shadow-sm sticky top-0 z-40 border-b border-forest-800 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* 1. Left Side: Company Logo + Factory Name + Small Subtitle */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-forest-900 border border-forest-600 flex items-center justify-center font-black text-cream-50 shadow-sm">
                Z
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-cream-50 leading-tight">
                  {factoryName}
                </span>
                <span className="text-[10px] text-forest-200 font-semibold tracking-wide">
                  {getPageTitleSubtitle(currentRole)}
                </span>
              </div>
            </div>

            {/* 2. Centre (Desktop Only): Global Search with Ctrl+K */}
            <div className="hidden md:flex flex-1 max-w-md mx-4 relative" ref={searchContainerRef}>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-forest-300">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchResults(true)}
                  placeholder="Search invoices, orders, customers..."
                  className="w-full pl-9 pr-14 py-1.5 bg-forest-800/80 hover:bg-forest-800 focus:bg-forest-900 text-cream-50 placeholder-forest-300 rounded-xl text-xs border border-forest-600/70 focus:outline-none focus:ring-1 focus:ring-forest-400 transition"
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-semibold text-forest-200 bg-forest-900/80 border border-forest-600 rounded">
                    Ctrl K
                  </kbd>
                </div>
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-subtle-border shadow-xl text-charcoal-900 overflow-hidden z-50 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-charcoal-500">Searching records...</div>
                  ) : (searchResults.invoices.length === 0 && searchResults.orders.length === 0 && searchResults.customers.length === 0) ? (
                    <div className="p-4 text-center text-xs text-charcoal-500">No matching invoices, orders or customers found.</div>
                  ) : (
                    <div className="p-2 space-y-2 divide-y divide-subtle-divider text-xs">
                      {/* Invoices */}
                      {searchResults.invoices.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">Invoices</div>
                          {searchResults.invoices.map(inv => (
                            <button
                              key={inv.id}
                              onClick={() => {
                                onSelectRole('accountant');
                                setShowSearchResults(false);
                              }}
                              className="w-full text-left px-2 py-1.5 hover:bg-cream-100 rounded-lg flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-2">
                                <FileText className="w-3.5 h-3.5 text-forest-700" />
                                <span className="font-semibold text-charcoal-900">{inv.number}</span>
                                <span className="text-charcoal-500 text-[11px]">({inv.customer})</span>
                              </div>
                              <span className="font-bold text-forest-700">₹{inv.amount.toLocaleString('en-IN')}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Orders */}
                      {searchResults.orders.length > 0 && (
                        <div className="pt-2">
                          <div className="px-2 py-1 text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">Sales Orders</div>
                          {searchResults.orders.map(ord => (
                            <button
                              key={ord.id}
                              onClick={() => {
                                if (currentUser?.role === 'salesman' || currentUser?.role === 'sales_manager') {
                                  onSelectRole('salesman');
                                } else {
                                  onSelectRole('admin');
                                }
                                setShowSearchResults(false);
                              }}
                              className="w-full text-left px-2 py-1.5 hover:bg-cream-100 rounded-lg flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-2">
                                <PackageCheck className="w-3.5 h-3.5 text-amber-700" />
                                <span className="font-semibold text-charcoal-900">{ord.number}</span>
                                <span className="text-charcoal-500 text-[11px]">({ord.customer})</span>
                              </div>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cream-200 text-charcoal-700">{ord.status}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Customers */}
                      {searchResults.customers.length > 0 && (
                        <div className="pt-2">
                          <div className="px-2 py-1 text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">Customers</div>
                          {searchResults.customers.map(c => (
                            <button
                              key={c.id}
                              onClick={() => {
                                onSelectRole('admin');
                                setShowSearchResults(false);
                              }}
                              className="w-full text-left px-2 py-1.5 hover:bg-cream-100 rounded-lg flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-2">
                                <Compass className="w-3.5 h-3.5 text-forest-600" />
                                <span className="font-semibold text-charcoal-900">{c.name}</span>
                                <span className="text-charcoal-500 text-[11px]">[{c.code}]</span>
                              </div>
                              <span className="text-charcoal-500 text-[11px]">{c.phone}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Right Side: Sync Status Pill, Notifications Bell, Language Toggle, User Profile */}
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              
              {/* Sync Status Pill */}
              <button
                onClick={onToggleOffline}
                title={isOffline ? "Offline mode active. Click to trigger sync." : "Online. Click to toggle offline testing."}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition border ${
                  isOffline 
                    ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30' 
                    : 'bg-forest-800 text-forest-100 border-forest-600 hover:bg-forest-900'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="hidden sm:inline">
                  {isOffline ? 'Offline' : 'Online'}
                  {queuedOrdersCount > 0 ? ` · ${queuedOrdersCount} queued` : ''}
                </span>
                <span className="sm:hidden">
                  {queuedOrdersCount > 0 ? `${queuedOrdersCount}q` : isOffline ? 'Off' : 'On'}
                </span>
              </button>

              {/* Notifications Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen);
                    setUnreadCount(0);
                  }}
                  title="Notifications & Operational Alerts"
                  className="p-1.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-cream-50 border border-forest-600 relative transition"
                >
                  <Bell className="w-4 h-4 text-forest-200" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-forest-700">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Popover */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-subtle-border shadow-xl text-charcoal-900 overflow-hidden z-50">
                    <div className="p-3 bg-cream-50 border-b border-subtle-divider flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Bell className="w-3.5 h-3.5 text-forest-700" />
                        <h4 className="font-bold text-xs text-charcoal-900">Notifications & Alerts</h4>
                      </div>
                      <span className="text-[10px] text-charcoal-500">{notifications.length} recent</span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-subtle-divider text-xs">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-charcoal-500 text-xs">
                          <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1 opacity-70" />
                          No active alerts or pending approvals.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-3 hover:bg-cream-50 transition space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-charcoal-900 text-xs">{n.title}</span>
                              <span className="text-[10px] text-charcoal-400">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-charcoal-600 leading-snug">{n.desc}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Language Toggle (EN | தமிழ்) - Only visible when currentRole === 'production' */}
              {currentRole === 'production' && (
                <button
                  type="button"
                  onClick={toggleLang}
                  title="Toggle Language / மொழியை மாற்றவும்"
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-forest-800 hover:bg-forest-900 text-cream-50 border border-forest-600 text-xs font-bold transition"
                >
                  <Languages className="w-3.5 h-3.5 text-forest-200" />
                  <span>{lang === 'en' ? 'தமிழ்' : 'EN'}</span>
                </button>
              )}

              {/* User Profile Dropdown Button */}
              {currentUser && (
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-1 pl-1.5 pr-2.5 rounded-full bg-forest-800/80 hover:bg-forest-800 text-cream-50 border border-forest-600 transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-forest-900 border border-forest-500 flex items-center justify-center font-bold text-[11px] text-cream-50">
                      {userInitials}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-bold leading-none">{currentUser.name || currentUser.username}</span>
                      <span className="text-[9px] uppercase tracking-wider text-forest-200 mt-0.5">
                        {currentUser.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-forest-300 ml-0.5" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-subtle-border shadow-xl text-charcoal-900 overflow-hidden z-50">
                      {/* User Header */}
                      <div className="p-3.5 bg-cream-50 border-b border-subtle-divider">
                        <div className="font-bold text-xs text-charcoal-900">{currentUser.name || currentUser.username}</div>
                        <div className="text-[11px] text-charcoal-500 font-mono">@{currentUser.username}</div>
                        <div className="mt-2 flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-forest-100 text-forest-800">
                            {currentUser.role}
                          </span>
                          {currentUser.department && (
                            <span className="text-[10px] text-charcoal-500">{currentUser.department}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-1.5 text-xs space-y-0.5">
                        {onOpenProfile && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              onOpenProfile();
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-charcoal-700 hover:bg-cream-100 flex items-center space-x-2 transition"
                          >
                            <User className="w-4 h-4 text-forest-700" />
                            <span>My Account Profile</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            setIsChangePasswordOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-charcoal-700 hover:bg-cream-100 flex items-center space-x-2 transition"
                        >
                          <ShieldCheck className="w-4 h-4 text-forest-700" />
                          <span>Change Password</span>
                        </button>

                        {onLogout && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              onLogout();
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 flex items-center space-x-2 transition"
                          >
                            <LogOut className="w-4 h-4 text-red-500" />
                            <span>Log Out</span>
                          </button>
                        )}
                      </div>

                      {/* Evaluation Tools Section (Admin Only & VITE_SHOW_EVAL_TOOLS true) */}
                      {showEvalTools && (
                        <div className="p-2 border-t border-subtle-divider bg-cream-50/70 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 px-2 block">
                            Evaluation Tools
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              onRunBenchmark();
                            }}
                            disabled={isProcessing}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-charcoal-800 hover:bg-amber-100/60 flex items-center space-x-2 transition"
                          >
                            <Play className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
                            <span>Run NIT Benchmark</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              setIsResetModalOpen(true);
                            }}
                            disabled={isProcessing}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-charcoal-800 hover:bg-red-100/60 flex items-center space-x-2 transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                            <span>Reset Demo Data</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Module Sub-Navigation Bar */}
          <div className="flex space-x-1 py-1.5 overflow-x-auto border-t border-forest-600/70 scrollbar-none">
            {visibleRoles.map((item) => {
              const Icon = item.icon;
              const isActive = !isProfileActive && currentRole === item.role;
              return (
                <button
                  key={item.role}
                  onClick={() => onSelectRole(item.role)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-cream-200 text-forest-700 shadow-sm font-bold'
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

      {/* Reset Demo Data Modal with Typed Confirmation */}
      <ResetDemoModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={async () => {
          await onSeedData();
        }}
        isProcessing={isProcessing}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};
