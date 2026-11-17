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
  Plus, 
  Send 
} from 'lucide-react';

interface SalesmanViewProps {
  isOffline: boolean;
}

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

  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0]._id);
    }
  }, [customers]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedProductCode || quantity <= 0) {
      setNotification({ type: 'error', msg: 'Please select a customer and enter valid quantity' });
      return;
    }

    const customer = customers.find(c => c._id === selectedCustomerId);
    const product = products.find(p => p.code === selectedProductCode);
    if (!customer || !product) return;

    setIsSubmitting(true);
    setNotification(null);

    const clientUuid = 'offline_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
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
      createdAt: new Date().toISOString()
    };

    if (isOffline) {
      // Save directly to Dexie.js IndexedDB
      await queueOfflineOrder(orderData);
      const pending = await getPendingOfflineOrders();
      setPendingOfflineOrders(pending);
      setNotification({
        type: 'warning',
        msg: `Offline Mode: Order for ${quantity} pkts queued in local IndexedDB. It will sync automatically when online.`
      });
      setIsSubmitting(false);
    } else {
      // Direct API Submission
      try {
        const res = await api.createOrder({
          customerId: customer._id,
          salesmanName: 'Salesman A (Tamil Nadu)',
          items: [{ productCode: product.code, quantity, unitPrice: product.sellingPrice }],
          offlineSyncId: clientUuid
        });

        if (res.success) {
          setNotification({
            type: 'success',
            msg: `Order ${res.order.orderNumber} placed successfully! Status: ${res.order.status}`
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
        offlineSyncId: p.clientUuid
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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Mobile Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Field Order Taking (Mobile View)</span>
          <h1 className="text-xl sm:text-2xl font-black mt-1">Retailer & Distributor Ordering</h1>
          <p className="text-xs text-indigo-200 mt-1">
            Zero-friction mobile orders with offline IndexedDB fallback. No phone call or WhatsApp step needed.
          </p>
        </div>

        {pendingOfflineOrders.length > 0 && (
          <button
            onClick={handleSyncPendingOrders}
            disabled={isOffline || isSubmitting}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>Sync ({pendingOfflineOrders.length}) Pending Orders</span>
          </button>
        )}
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
          notification.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          {notification.type === 'warning' && <CloudOff className="w-4 h-4 flex-shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Quick Order Booking Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center space-x-2">
          <ShoppingBag className="w-4 h-4 text-indigo-600" />
          <span>New Customer Order</span>
        </h2>

        <form onSubmit={handlePlaceOrder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Customer</label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {customers.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.type} - {c.state})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product</label>
              <select
                value={selectedProductCode}
                onChange={e => setSelectedProductCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {products.map(p => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.packSize}) — ₹{p.sellingPrice} / pkt
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity Controls with Quick Increments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Order Quantity (Packets)</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity(150)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                150 pkts
              </button>
              <button
                type="button"
                onClick={() => setQuantity(120)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                120 pkts
              </button>
            </div>
          </div>

          {/* Total & Submit Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Estimated Taxable Total</span>
              <span className="text-lg font-black text-slate-900">
                ₹{((products.find(p => p.code === selectedProductCode)?.sellingPrice || 50) * quantity).toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md transition"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Placing Order...' : isOffline ? 'Queue Offline' : 'Submit Order'}</span>
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
            <span className="text-[11px] text-amber-700 font-medium">Stored in Local IndexedDB</span>
          </div>

          <div className="space-y-2">
            {pendingOfflineOrders.map((o, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{o.customerName}</span>
                  <span className="text-slate-500 ml-2">
                    {o.items.map(i => `${i.quantity} pkts of ${i.productName}`).join(', ')}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  PENDING SYNC
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order History */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Recent Field Orders</span>
        </h2>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No orders recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map(o => (
              <div key={o._id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{o.customerName}</span>
                    <span className="text-[11px] text-slate-400">({o.orderNumber})</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {o.items.map(i => `${i.quantity} pkts`).join(', ')} • Total: ₹{o.totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    o.status === 'DISPATCHED' ? 'bg-emerald-100 text-emerald-800' :
                    o.status === 'INVOICED' ? 'bg-indigo-100 text-indigo-800' :
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
