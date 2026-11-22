import React, { useState, useEffect } from 'react';
import { Customer, Product, SalesOrder } from '../types';
import { api } from '../services/api';
import { 
  queueOfflineOrder, 
  getPendingOfflineOrders, 
  markOfflineOrderSynced, 
  cacheMasterDataOffline, 
  offlineDb, 
  OfflineOrderRecord 
} from '../db/offlineDb';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  CloudOff, 
  RefreshCw, 
  Send,
  Compass,
  CreditCard,
  PackageCheck,
  Search,
  Plus,
  Minus,
  TrendingUp,
  BarChart2,
  Users,
  Check
} from 'lucide-react';

interface SalesmanViewProps {
  isOffline: boolean;
}

interface SalesSummary {
  salesmanName: string;
  salesmanRole: string;
  totalOrders: number;
  totalSalesPaise: number;
  totalSales: number;
  statusCounts: Record<string, number>;
  customerTotals: Array<{
    customerId: string;
    customerCode: string;
    customerName: string;
    orderCount: number;
    totalAmountPaise: number;
    totalAmount: number;
  }>;
  recentOrders: any[];
}

// Request salesman GPS location with a strict 5-second timeout (never blocks order flow)
const getSalesmanLocation = (): Promise<{ lat: number; lng: number; accuracyMeters?: number; capturedAt: string } | undefined> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return resolve(undefined);
    }
    let resolved = false;
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(undefined);
      }
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          resolve({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            accuracyMeters: Math.round(pos.coords.accuracy),
            capturedAt: new Date(pos.timestamp).toISOString()
          });
        }
      },
      () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          resolve(undefined);
        }
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  });
};

export const SalesmanView: React.FC<SalesmanViewProps> = ({ isOffline }) => {
  const [activeTab, setActiveTab] = useState<'order_entry' | 'my_sales'>('order_entry');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [pendingOfflineOrders, setPendingOfflineOrders] = useState<OfflineOrderRecord[]>([]);

  // Sync counters
  const [syncedCount, setSyncedCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);

  // Rapid order form state
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedProductCode, setSelectedProductCode] = useState<string>('MUR-200G');
  const [quantity, setQuantity] = useState<number>(150);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'error'; msg: string } | null>(null);

  // Sales summary state
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Load masters & orders
  const loadData = async () => {
    try {
      if (!isOffline) {
        const [cRes, pRes, oRes] = await Promise.all([
          api.getCustomers(),
          api.getProducts(),
          api.getOrders()
        ]);
        if (cRes.success) setCustomers(cRes.customers);
        if (pRes.success) setProducts(pRes.products);
        if (oRes.success) setOrders(oRes.orders);

        if (cRes.customers && pRes.products) {
          await cacheMasterDataOffline(cRes.customers, pRes.products);
        }
      } else {
        // Load from Dexie IndexedDB
        const cachedCust = await offlineDb.cachedCustomers.toArray();
        const cachedProd = await offlineDb.cachedProducts.toArray();
        setCustomers(cachedCust);
        setProducts(cachedProd);
      }

      const pending = await getPendingOfflineOrders();
      setPendingOfflineOrders(pending);

      if (!selectedCustomerId && customers.length > 0) {
        setSelectedCustomerId(customers[0]._id);
      }
    } catch (e) {
      console.error('Error loading salesman data', e);
    }
  };

  const loadSummary = async () => {
    if (isOffline) return;
    setLoadingSummary(true);
    try {
      const res = await api.getMySalesSummary();
      if (res.success) {
        setSummary(res.summary);
      }
    } catch (e) {
      console.warn('Failed to load my sales summary:', e);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadData();
    if (activeTab === 'my_sales') {
      loadSummary();
    }
  }, [isOffline, activeTab]);

  // Automatic sync when device network reconnects
  useEffect(() => {
    const handleOnline = () => {
      if (!isOffline) {
        handleSyncPendingOrders();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isOffline]);

  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0]._id);
    }
  }, [customers]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedProductCode || quantity <= 0) {
      setNotification({ type: 'error', msg: 'Please select a customer and enter a valid quantity' });
      return;
    }

    const customer = customers.find(c => c._id === selectedCustomerId);
    const product = products.find(p => p.code === selectedProductCode);
    if (!customer || !product) return;

    setIsSubmitting(true);
    setNotification(null);

    const clientUuid = 'offline_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    
    // Request GPS location (5s timeout fallback - never blocks order submission)
    const checkIn = await getSalesmanLocation();

    const orderData = {
      clientUuid,
      customerId: customer._id,
      customerName: customer.name,
      salesmanName: 'Salesman A (Tamil Nadu)',
      items: [{
        productCode: product.code,
        productName: product.name,
        quantity,
        unitPrice: product.sellingPrice
      }],
      totalAmount: quantity * product.sellingPrice,
      offlineSyncId: clientUuid,
      checkIn,
      createdAt: new Date().toISOString()
    };

    if (isOffline) {
      // Save directly to Dexie.js IndexedDB
      await queueOfflineOrder(orderData);
      const pending = await getPendingOfflineOrders();
      setPendingOfflineOrders(pending);
      setNotification({
        type: 'warning',
        msg: `Offline Mode: Order for ${quantity} pkts stored in IndexedDB${checkIn ? ' with GPS check-in' : ''}. It will sync automatically when back online.`
      });
      setIsSubmitting(false);
    } else {
      // Direct API Submission
      try {
        const res = await api.createOrder({
          customerId: customer._id,
          salesmanName: 'Salesman A (Tamil Nadu)',
          items: [{ productCode: product.code, quantity, unitPrice: product.sellingPrice }],
          offlineSyncId: clientUuid,
          checkIn
        });

        if (res.success) {
          setNotification({
            type: 'success',
            msg: `Order ${res.order.orderNumber} placed successfully! Status: ${res.order.status}${checkIn ? ' (GPS Verified)' : ''}`
          });
          loadData();
        } else {
          setNotification({ type: 'error', msg: res.error || 'Failed to place order' });
        }
      } catch (err: any) {
        setNotification({ type: 'error', msg: err.message });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSyncPendingOrders = async () => {
    if (isOffline) {
      alert('Cannot sync while in offline mode. Please switch to online first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const pending = await getPendingOfflineOrders();
      if (pending.length === 0) return;

      const payload = pending.map(p => ({
        customerId: p.customerId,
        salesmanName: 'Salesman A (Tamil Nadu)',
        items: p.items,
        offlineSyncId: p.clientUuid,
        checkIn: p.checkIn
      }));

      const res = await api.syncOfflineBatch(payload);
      if (res.success) {
        for (const p of pending) {
          if (p.id) await markOfflineOrderSynced(p.id);
        }
        setSyncedCount(prev => prev + (res.count || pending.length));
        setPendingOfflineOrders([]);
        setNotification({
          type: 'success',
          msg: `Successfully synchronized ${res.count} offline orders with the factory server!`
        });
        loadData();
      } else {
        setFailedCount(prev => prev + pending.length);
        setNotification({ type: 'error', msg: 'Sync failed: ' + (res.error || 'Server error') });
      }
    } catch (e: any) {
      setFailedCount(prev => prev + 1);
      setNotification({ type: 'error', msg: 'Sync failed: ' + e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    !customerSearch ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.city?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const activeCustomer = customers.find(c => c._id === selectedCustomerId);
  const activeProduct = products.find(p => p.code === selectedProductCode);
  const activePrice = activeProduct?.sellingPrice || 50;
  const runningTotal = quantity * activePrice;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Route & Status Banner with Real-Time PWA Counters */}
      <div className="bg-forest-700 text-cream-50 rounded-2xl p-5 shadow-sm border border-forest-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-forest-200 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Tamil Nadu Field Route • Trichy Central</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight text-white">Field Order Terminal</h1>
          <p className="text-xs text-forest-100 mt-1 max-w-xl">
            Offline PWA indexed storage active. Service worker caches products & customers for rapid offline ordering.
          </p>

          {/* Sync status counters pill row */}
          <div className="flex items-center space-x-3 mt-3 text-[11px] font-bold">
            <span className="flex items-center space-x-1 bg-amber-500/20 text-amber-200 px-2.5 py-1 rounded-lg border border-amber-400/30">
              <CloudOff className="w-3 h-3 text-amber-300" />
              <span>Queued: {pendingOfflineOrders.length}</span>
            </span>
            <span className="flex items-center space-x-1 bg-emerald-500/20 text-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-400/30">
              <CheckCircle className="w-3 h-3 text-emerald-300" />
              <span>Synced: {syncedCount}</span>
            </span>
            {failedCount > 0 && (
              <span className="flex items-center space-x-1 bg-red-500/20 text-red-200 px-2.5 py-1 rounded-lg border border-red-400/30">
                <AlertCircle className="w-3 h-3 text-red-300" />
                <span>Failed: {failedCount}</span>
              </span>
            )}
          </div>
        </div>

        {pendingOfflineOrders.length > 0 && (
          <button
            onClick={handleSyncPendingOrders}
            disabled={isOffline || isSubmitting}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-charcoal-900 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>Sync ({pendingOfflineOrders.length}) Offline Orders</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-subtle-divider pb-2">
        <button
          onClick={() => setActiveTab('order_entry')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'order_entry'
              ? 'bg-forest-700 text-white shadow-sm'
              : 'bg-white text-charcoal-700 hover:bg-cream-100 border border-subtle-border'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>⚡ Rapid Order Entry</span>
        </button>

        <button
          onClick={() => setActiveTab('my_sales')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'my_sales'
              ? 'bg-forest-700 text-white shadow-sm'
              : 'bg-white text-charcoal-700 hover:bg-cream-100 border border-subtle-border'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>📊 My Sales Performance</span>
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-forest-100 text-forest-700 border border-forest-500/30' :
          notification.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0 text-forest-600" />}
          {notification.type === 'warning' && <CloudOff className="w-4 h-4 flex-shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* TAB 1: RAPID ORDER ENTRY */}
      {activeTab === 'order_entry' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-forest-700" />
                <span>Rapid Order Placement (&lt; 1 min)</span>
              </h2>
              <span className="text-[11px] font-semibold text-charcoal-500">
                {isOffline ? 'Offline Staged Mode' : 'Direct Server Link'}
              </span>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              {/* Customer Search & Select */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Customer / Retailer</label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-charcoal-400" />
                  <input
                    type="text"
                    placeholder="Search retailer by name, code or city..."
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    className="w-full bg-cream-50 border border-subtle-border rounded-xl pl-9 pr-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>

                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-cream-50 border border-subtle-border rounded-xl px-3 py-2.5 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700 font-medium"
                >
                  {filteredCustomers.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.type} - {c.city || c.state})
                    </option>
                  ))}
                </select>

                {activeCustomer && (
                  <div className="mt-2 p-2.5 bg-cream-50 rounded-xl border border-subtle-border flex items-center justify-between text-[11px] text-charcoal-700">
                    <div>
                      <span className="font-bold">{activeCustomer.name}</span>
                      <span className="text-charcoal-500 ml-2 font-mono">[{activeCustomer.code}]</span>
                    </div>
                    <div className="space-x-3">
                      <span>Limit: ₹{(activeCustomer.creditLimit || 0).toLocaleString('en-IN')}</span>
                      <span className={`font-semibold ${activeCustomer.outstandingBalance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                        Bal: ₹{(activeCustomer.outstandingBalance || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Selector */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Product SKU</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {products.map(p => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => setSelectedProductCode(p.code)}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                        selectedProductCode === p.code
                          ? 'border-forest-700 bg-forest-50/50 shadow-sm'
                          : 'border-subtle-border bg-cream-50 hover:bg-cream-100'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-charcoal-900">{p.name}</div>
                        <div className="text-[11px] text-charcoal-500 font-mono">{p.packSize} • {p.gstRate}% GST</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-forest-800">₹{p.sellingPrice}</div>
                        <div className="text-[10px] text-charcoal-500">per packet</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rapid Quantity Stepper */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Order Quantity (Packets)</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 10))}
                    className="p-2.5 bg-cream-100 hover:bg-cream-200 rounded-xl border border-subtle-border text-charcoal-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full text-center bg-cream-50 border border-subtle-border rounded-xl px-4 py-2 text-base font-extrabold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 10)}
                    className="p-2.5 bg-cream-100 hover:bg-cream-200 rounded-xl border border-subtle-border text-charcoal-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex items-center space-x-2 mt-2">
                  {[50, 100, 120, 150, 200].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuantity(amt)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                        quantity === amt
                          ? 'bg-forest-700 text-white border-forest-800'
                          : 'bg-cream-50 text-charcoal-700 hover:bg-cream-100 border-subtle-border'
                      }`}
                    >
                      {amt} pkts
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-Time Total & Quick Submit */}
              <div className="pt-4 flex items-center justify-between border-t border-subtle-divider">
                <div>
                  <span className="text-xs text-charcoal-500 font-medium block">Total Order Value</span>
                  <span className="text-2xl font-extrabold text-forest-800 tracking-tight">
                    ₹{runningTotal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-charcoal-500 block">
                    ({quantity} pkts × ₹{activePrice} / pkt)
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-white px-7 py-3 rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording...' : isOffline ? 'Queue Offline Order' : 'Submit Route Order'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Offline Pending Orders Staging Box */}
          {pendingOfflineOrders.length > 0 && (
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center space-x-2">
                  <CloudOff className="w-4 h-4 text-amber-600" />
                  <span>Offline Orders Queue ({pendingOfflineOrders.length})</span>
                </h3>
                <span className="text-[11px] text-amber-700 font-medium">Stored Locally in IndexedDB</span>
              </div>

              <div className="space-y-2">
                {pendingOfflineOrders.map((o, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-charcoal-900">{o.customerName}</span>
                      <span className="text-charcoal-500 ml-2">
                        {o.items.map(i => `${i.quantity} pkts of ${i.productName}`).join(', ')}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      AWAITING SYNC
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders List */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-4 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-forest-700" />
              <span>My Recent Route Orders</span>
            </h2>

            {orders.length === 0 ? (
              <p className="text-xs text-charcoal-500 py-4 text-center">No orders recorded on this route yet.</p>
            ) : (
              <div className="divide-y divide-subtle-divider">
                {orders.map(o => (
                  <div key={o._id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-charcoal-900">{o.customerName}</span>
                        <span className="text-[11px] font-mono text-charcoal-500">({o.orderNumber})</span>
                      </div>
                      <div className="text-xs text-charcoal-500 mt-0.5">
                        {o.items.map(i => `${i.quantity} pkts`).join(', ')} • Total: ₹{o.totalAmount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'DISPATCHED' ? 'bg-forest-100 text-forest-700' :
                        o.status === 'INVOICED' ? 'bg-emerald-100 text-emerald-800' :
                        o.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                        o.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {o.status}
                      </span>
                      {!o.stockCheck.isSufficient && o.status === 'SUBMITTED' && (
                        <span className="block text-[10px] text-red-600 font-bold mt-1">
                          Shortage: {o.stockCheck.shortageQuantity} pkts
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY SALES PERFORMANCE */}
      {activeTab === 'my_sales' && (
        <div className="space-y-6">
          {loadingSummary ? (
            <div className="p-8 text-center text-xs text-charcoal-500">Loading route performance summary...</div>
          ) : !summary ? (
            <div className="p-8 text-center text-xs text-charcoal-500">
              {isOffline ? 'Sales summary is available when connected online.' : 'No summary data available.'}
            </div>
          ) : (
            <>
              {/* Performance Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-subtle-border shadow-sm">
                  <div className="text-xs text-charcoal-500 font-medium">Total Orders Placed</div>
                  <div className="text-xl font-extrabold text-charcoal-900 mt-1">{summary.totalOrders}</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-subtle-border shadow-sm">
                  <div className="text-xs text-charcoal-500 font-medium">Total Route Revenue</div>
                  <div className="text-xl font-extrabold text-forest-800 mt-1">₹{summary.totalSales.toLocaleString('en-IN')}</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-subtle-border shadow-sm">
                  <div className="text-xs text-charcoal-500 font-medium">Invoiced / Dispatched</div>
                  <div className="text-xl font-extrabold text-emerald-700 mt-1">
                    {(summary.statusCounts.INVOICED || 0) + (summary.statusCounts.DISPATCHED || 0)}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-subtle-border shadow-sm">
                  <div className="text-xs text-charcoal-500 font-medium">Pending Review</div>
                  <div className="text-xl font-extrabold text-amber-700 mt-1">
                    {summary.statusCounts.SUBMITTED || 0}
                  </div>
                </div>
              </div>

              {/* Customer Sales Leaderboard */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border">
                <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-4 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-forest-700" />
                  <span>Customer Sales Breakdown</span>
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-subtle-border text-charcoal-500 font-semibold">
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Code</th>
                        <th className="pb-3 text-center">Orders</th>
                        <th className="pb-3 text-right">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle-divider">
                      {summary.customerTotals.map((c, i) => (
                        <tr key={i} className="hover:bg-cream-50">
                          <td className="py-2.5 font-bold text-charcoal-900">{c.customerName}</td>
                          <td className="py-2.5 font-mono text-charcoal-500">{c.customerCode}</td>
                          <td className="py-2.5 text-center font-semibold text-charcoal-700">{c.orderCount}</td>
                          <td className="py-2.5 text-right font-extrabold text-forest-800">₹{c.totalAmount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
