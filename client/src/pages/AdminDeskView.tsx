import React, { useState, useEffect } from 'react';
import { SalesOrder, Invoice, Customer, Product } from '../types';
import { api } from '../services/api';
import { 
  Building2, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Truck, 
  CreditCard, 
  Download, 
  RefreshCw 
} from 'lucide-react';

export const AdminDeskView: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Payment form state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(4000);
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [oRes, iRes, cRes, pRes] = await Promise.all([
        api.getOrders(),
        api.getInvoices(),
        api.getCustomers(),
        api.getProducts()
      ]);
      if (oRes.success) setOrders(oRes.orders);
      if (iRes.success) {
        setInvoices(iRes.invoices);
        const unpaid = iRes.invoices.find((i: Invoice) => i.balanceDue > 0);
        if (unpaid && !selectedInvoiceId) setSelectedInvoiceId(unpaid._id);
      }
      if (cRes.success) setCustomers(cRes.customers);
      if (pRes.success) setProducts(pRes.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleApprove = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await api.approveOrder(orderId, 'Factory Admin');
      if (res.success) {
        setNotification(`Order approved! GST Invoice ${res.invoice.invoiceNumber} raised successfully.`);
        loadAll();
      } else {
        alert(res.error || 'Failed to approve order');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (invoiceId: string) => {
    setLoading(true);
    try {
      const res = await api.dispatchOrder(invoiceId, 'Factory Admin');
      if (res.success) {
        setNotification(`Dispatch recorded for Invoice ${res.invoice.invoiceNumber}. Finished goods stock updated!`);
        loadAll();
      } else {
        alert(res.error || 'Failed to dispatch order');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || paymentAmount <= 0) return;

    setLoading(true);
    try {
      const res = await api.recordPayment({
        invoiceId: selectedInvoiceId,
        amount: paymentAmount,
        paymentMethod,
        reference: 'NEFT/TN/2024/098765',
        receivedBy: 'Factory Admin'
      });
      if (res.success) {
        setNotification(`Payment of ₹${paymentAmount} recorded! Remaining balance: ₹${res.invoice.balanceDue}`);
        loadAll();
      } else {
        alert(res.error || 'Failed to record payment');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const murukkuProduct = products.find(p => p.code === 'MUR-200G');

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Factory Desk & Billing Loop</span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Order Verification, GST Invoicing & Dispatch</h1>
          <p className="text-xs text-slate-500 mt-1">
            Current Finished Goods Stock: <strong className="text-indigo-600 font-bold">{murukkuProduct ? `${murukkuProduct.currentStock} pkts` : 'Loading...'}</strong>
          </p>
        </div>

        <button
          onClick={loadAll}
          className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Desk</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">Dismiss</button>
        </div>
      )}

      {/* Grid: Incoming Orders & Payment Recording */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Incoming Orders for Verification */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-indigo-600" />
            <span>Incoming Orders Pending Verification</span>
          </h2>

          {orders.filter(o => o.status === 'SUBMITTED').length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No pending orders awaiting approval.</p>
          ) : (
            <div className="space-y-3">
              {orders.filter(o => o.status === 'SUBMITTED').map(order => {
                const available = murukkuProduct ? murukkuProduct.currentStock : order.stockCheck.availableStock;
                const requested = order.items.reduce((acc, i) => acc + i.quantity, 0);
                const hasEnough = available >= requested;
                const shortage = hasEnough ? 0 : requested - available;

                return (
                  <div key={order._id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-slate-50/50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-slate-900">{order.customerName}</span>
                          <span className="text-xs text-slate-500 font-medium">({order.customerState})</span>
                        </div>
                        <span className="text-xs text-indigo-600 font-semibold">{order.orderNumber}</span>
                        <span className="text-xs text-slate-400 ml-2">by {order.salesmanName}</span>
                      </div>

                      {/* Stock Coverage Indicator */}
                      <div className="text-left sm:text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          hasEnough 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {hasEnough ? (
                            `Stock Sufficient: ${available} pkts available`
                          ) : (
                            `Shortage of ${shortage} pkts (${available} available)`
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 border-t border-slate-200 pt-2 flex items-center justify-between">
                      <div>
                        {order.items.map(i => `${i.quantity} pkts @ ₹${i.unitPrice}`).join(', ')}
                        <span className="font-bold text-slate-900 ml-2">Total: ₹{order.totalAmount.toLocaleString('en-IN')}</span>
                      </div>

                      <button
                        onClick={() => handleApprove(order._id)}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow transition"
                      >
                        Approve & Raise GST Invoice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Payment Collection Recording */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Record Payment Collection</span>
          </h2>

          <form onSubmit={handleRecordPayment} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Invoice</label>
              <select
                value={selectedInvoiceId}
                onChange={e => setSelectedInvoiceId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {invoices.filter(i => i.balanceDue > 0).map(inv => (
                  <option key={inv._id} value={inv._id}>
                    {inv.invoiceNumber} - {inv.customerName} (Due: ₹{inv.balanceDue})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Amount (₹)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setPaymentAmount(4000)}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  ₹4,000
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedInvoiceId}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold shadow transition mt-2"
            >
              Post Payment & Update Outstanding
            </button>
          </form>
        </div>
      </div>

      {/* Raised Invoices Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>GST Invoices Raised</span>
        </h2>

        {invoices.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No invoices generated yet.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase">
                <tr>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Place of Supply</th>
                  <th className="p-3">Taxable (₹)</th>
                  <th className="p-3">GST Breakdown</th>
                  <th className="p-3">Total (₹)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-extrabold text-indigo-600">{inv.invoiceNumber}</td>
                    <td className="p-3 font-medium text-slate-900">{inv.customerName}</td>
                    <td className="p-3 text-slate-500">{inv.placeOfSupply}</td>
                    <td className="p-3 font-semibold text-slate-900">₹{inv.taxableValue.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-slate-600 text-[11px]">
                      {inv.isInterState ? (
                        <span className="text-purple-700 font-semibold">IGST (5%): ₹{inv.igstTotal.toFixed(2)}</span>
                      ) : (
                        <span>CGST: ₹{inv.cgstTotal.toFixed(2)} + SGST: ₹{inv.sgstTotal.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="p-3 font-black text-slate-900">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          inv.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                          inv.paymentStatus === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {inv.paymentStatus} (Due: ₹{inv.balanceDue})
                        </span>
                        <div>
                          <span className={`text-[10px] font-bold ${inv.isDispatched ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {inv.isDispatched ? '✓ Dispatched' : 'Pending Dispatch'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center space-x-2">
                      {/* Download PDF button */}
                      <a
                        href={api.getInvoicePDFUrl(inv._id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>

                      {/* Dispatch button */}
                      {!inv.isDispatched && (
                        <button
                          onClick={() => handleDispatch(inv._id)}
                          disabled={loading}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

