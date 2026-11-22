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
  PackageCheck
} from 'lucide-react';

interface SalesmanViewProps {
  isOffline: boolean;
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [pendingOfflineOrders, setPendingOfflineOrders] = useState<OfflineOrderRecord[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedProductCode, setSelectedProductCode] = useState<string>('MUR-200G');
  const [quantity, setQuantity] = useState<number>(150);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'error'; msg: string } | null>(null);

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

  useEffect(() => {
    loadData();
  }, [isOffline]);

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
        setPendingOfflineOrders([]);
        setNotification({
          type: 'success',
          msg: `Successfully synchronized ${res.count} offline orders with the factory server!`
        });
        loadData();
      }
    } catch (e: any) {
      setNotification({ type: 'error', msg: 'Sync failed: ' + e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCustomer = customers.find(c => c._id === selectedCustomerId);
  const activeProduct = products.find(p => p.code === selectedProductCode);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Route & Status Banner */}
      <div className="bg-forest-700 text-cream-50 rounded-2xl p-5 shadow-sm border border-forest-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-forest-200 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Tamil Nadu Field Route • Trichy Central</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight text-white">Field Order Terminal</h1>
          <p className="text-xs text-forest-100 mt-1 max-w-xl">
            Offline IndexedDB persistence armed. Capture retail orders and synchronize idempotently with factory servers.
          </p>
        </div>

        {pendingOfflineOrders.length > 0 && (
          <button
            onClick={handleSyncPendingOrders}
            disabled={isOffline || isSubmitting}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-charcoal-900 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>Sync ({pendingOfflineOrders.length}) Pending Orders</span>
          </button>
        )}
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

      {/* Quick Order Booking Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border">
        <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-4 flex items-center space-x-2">
          <ShoppingBag className="w-4 h-4 text-forest-700" />
          <span>New Customer Order Entry</span>
        </h2>

        <form onSubmit={handlePlaceOrder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Picker */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Select Customer</label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full bg-cream-50 border border-subtle-border rounded-xl px-3 py-2.5 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700 font-medium"
              >
                {customers.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.type} - {c.state})
                  </option>
                ))}
              </select>

              {activeCustomer && (
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-charcoal-500 px-1">
                  <span>Credit Limit: ₹{(activeCustomer.creditLimit || 0).toLocaleString('en-IN')}</span>
                  <span className={activeCustomer.outstandingBalance > (activeCustomer.creditLimit || 0) * 0.8 ? 'text-amber-700 font-semibold' : ''}>
                    Outstanding: ₹{(activeCustomer.outstandingBalance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* Product Picker */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Select Product</label>
              <select
                value={selectedProductCode}
                onChange={e => setSelectedProductCode(e.target.value)}
                className="w-full bg-cream-50 border border-subtle-border rounded-xl px-3 py-2.5 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700 font-medium"
              >
                {products.map(p => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.packSize}) — ₹{p.sellingPrice} / pkt
                  </option>
                ))}
              </select>

              {activeProduct && (
                <div className="mt-1.5 text-[11px] text-charcoal-500 px-1">
                  Tax Rate: {activeProduct.gstRate}% GST • Unit MRP: ₹{activeProduct.sellingPrice}
                </div>
              )}
            </div>
          </div>

          {/* Quantity Controls with Quick Increments */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Order Quantity (Packets)</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full bg-cream-50 border border-subtle-border rounded-xl px-4 py-2 text-sm font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
              <button
                type="button"
                onClick={() => setQuantity(150)}
                className="px-3 py-2 bg-cream-100 hover:bg-cream-300 text-charcoal-700 text-xs font-semibold rounded-xl border border-subtle-border transition"
              >
                150 pkts
              </button>
              <button
                type="button"
                onClick={() => setQuantity(120)}
                className="px-3 py-2 bg-cream-100 hover:bg-cream-300 text-charcoal-700 text-xs font-semibold rounded-xl border border-subtle-border transition"
              >
                120 pkts
              </button>
            </div>
          </div>

          {/* Total & Submit Button */}
          <div className="pt-3 flex items-center justify-between border-t border-subtle-divider">
            <div>
              <span className="text-xs text-charcoal-500 font-medium block">Order Taxable Value</span>
              <span className="text-lg font-bold text-charcoal-900">
                ₹{((products.find(p => p.code === selectedProductCode)?.sellingPrice || 50) * quantity).toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Recording...' : isOffline ? 'Queue in Local Storage' : 'Submit Order'}</span>
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
            <span className="text-[11px] text-amber-700 font-medium">Stored Locally</span>
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

      {/* Order History */}
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
  );
};
