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
  RefreshCw,
  MapPin,
  FileCode,
  Edit,
  XCircle,
  Share2,
  FileCheck,
  Check,
  X
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
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Edit Order Modal State
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [editItems, setEditItems] = useState<Array<{ productCode: string; productName?: string; quantity: number; unitPrice: number }>>([]);

  // Cancel Invoice Modal State
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Partial Dispatch Modal State
  const [dispatchingInvoice, setDispatchingInvoice] = useState<Invoice | null>(null);
  const [dispatchItems, setDispatchItems] = useState<Array<{ productCode: string; quantity: number }>>([]);

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

  // Open Edit Order Modal
  const openEditOrder = (order: SalesOrder) => {
    setEditingOrder(order);
    setEditItems(order.items.map(i => ({
      productCode: i.productCode,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice
    })));
  };

  // Save Edited Order
  const handleSaveOrderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setLoading(true);
    try {
      const res = await api.editOrder(editingOrder._id, { items: editItems });
      if (res.success) {
        setNotification(`Order ${editingOrder.orderNumber} updated successfully!`);
        setEditingOrder(null);
        loadAll();
      } else {
        alert(res.error || 'Failed to update order');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Partial Dispatch Modal
  const openDispatchModal = (invoice: Invoice) => {
    setDispatchingInvoice(invoice);
    setDispatchItems(invoice.items.map(i => ({
      productCode: i.productCode || i.productName,
      quantity: i.quantity
    })));
  };

  // Confirm Dispatch
  const handleConfirmDispatch = async () => {
    if (!dispatchingInvoice) return;
    setLoading(true);
    try {
      const res = await api.dispatchOrderWithItems(dispatchingInvoice._id, dispatchItems, 'Factory Admin');
      if (res.success) {
        setNotification(`Dispatch recorded for Invoice ${res.invoice.invoiceNumber}. Finished goods stock deducted!`);
        setDispatchingInvoice(null);
        loadAll();
      } else {
        alert(res.error || 'Failed to dispatch');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Cancel Invoice Modal
  const openCancelModal = (inv: Invoice) => {
    setCancellingInvoice(inv);
    setCancelReason('Order cancelled by customer before dispatch');
  };

  // Confirm Cancel Invoice
  const handleConfirmCancel = async () => {
    if (!cancellingInvoice || !cancelReason.trim()) return;
    setLoading(true);
    try {
      const res = await api.cancelInvoice(cancellingInvoice._id, cancelReason);
      if (res.success) {
        setNotification(`Invoice ${cancellingInvoice.invoiceNumber} cancelled. Credit Note ${res.creditNote?.creditNoteNumber || 'generated'} issued.`);
        setCancellingInvoice(null);
        loadAll();
      } else {
        alert(res.error || 'Failed to cancel invoice');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    if (!selectedInvoiceId || paymentAmount <= 0) return;

    const selectedInv = invoices.find(i => i._id === selectedInvoiceId);
    if (selectedInv && paymentAmount > selectedInv.balanceDue) {
      setPaymentError(`Payment amount (₹${paymentAmount.toLocaleString('en-IN')}) exceeds balance due (₹${selectedInv.balanceDue.toLocaleString('en-IN')}). Overpayments are prevented.`);
      return;
    }

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
        setPaymentError(res.error || 'Failed to record payment');
      }
    } catch (e: any) {
      setPaymentError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEInvoice = async (invoiceId: string) => {
    setLoading(true);
    try {
      const res = await api.generateMockEInvoice(invoiceId);
      if (res.success) {
        setNotification('Mock e-Invoice IRN successfully generated.');
        loadAll();
      } else {
        alert('Failed to generate mock e-Invoice: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error generating mock e-Invoice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const murukkuProduct = products.find(p => p.code === 'MUR-200G');
  const selectedInvoice = invoices.find(i => i._id === selectedInvoiceId);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Factory Desk & Billing Loop</span>
          <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 mt-1">Order Verification, GST Invoicing & Dispatch</h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Current Finished Goods Stock: <strong className="text-forest-700 font-bold">{murukkuProduct ? `${murukkuProduct.currentStock} pkts` : 'Loading...'}</strong>
          </p>
        </div>

        <button
          onClick={loadAll}
          className="flex items-center space-x-2 bg-cream-100 hover:bg-cream-200 text-charcoal-700 px-4 py-2 rounded-xl text-xs font-bold transition border border-subtle-border"
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
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-forest-700" />
              <span>Incoming Orders Pending Verification</span>
            </h2>
            <span className="text-xs text-charcoal-500 font-medium">
              {orders.filter(o => o.status === 'SUBMITTED').length} pending
            </span>
          </div>

          {orders.filter(o => o.status === 'SUBMITTED').length === 0 ? (
            <p className="text-xs text-charcoal-400 py-6 text-center">No pending orders awaiting approval.</p>
          ) : (
            <div className="space-y-3">
              {orders.filter(o => o.status === 'SUBMITTED').map(order => {
                const available = murukkuProduct ? murukkuProduct.currentStock : order.stockCheck.availableStock;
                const requested = order.items.reduce((acc, i) => acc + i.quantity, 0);
                const hasEnough = available >= requested;
                const shortage = hasEnough ? 0 : requested - available;

                return (
                  <div key={order._id} className="p-4 rounded-xl border border-subtle-border hover:border-forest-500/40 transition bg-cream-50/50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-charcoal-900">{order.customerName}</span>
                          <span className="text-xs text-charcoal-500 font-medium">({order.customerState})</span>
                        </div>
                        <span className="text-xs text-forest-700 font-semibold">{order.orderNumber}</span>
                        <span className="text-xs text-charcoal-400 ml-2">by {order.salesmanName}</span>
                        {order.checkIn?.lat && order.checkIn?.lng && (
                          <div className="text-[11px] text-charcoal-600 flex items-center space-x-1.5 mt-1">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span className="font-mono font-medium">{order.checkIn.lat.toFixed(4)}, {order.checkIn.lng.toFixed(4)}</span>
                            <a
                              href={`https://www.google.com/maps?q=${order.checkIn.lat},${order.checkIn.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-forest-700 hover:underline font-bold text-[10px]"
                            >
                              Open in Maps
                            </a>
                          </div>
                        )}
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

                    <div className="text-xs text-charcoal-600 border-t border-subtle-divider pt-2 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        {order.items.map(i => `${i.quantity} pkts @ ₹${i.unitPrice}`).join(', ')}
                        <span className="font-bold text-charcoal-900 ml-2">Total: ₹{order.totalAmount.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditOrder(order)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-charcoal-700 rounded-lg text-xs font-semibold border border-subtle-border transition"
                          title="Edit order items & prices before approval"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleApprove(order._id)}
                          disabled={loading}
                          className="bg-forest-700 hover:bg-forest-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow transition"
                        >
                          Approve & Raise GST Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Payment Collection Recording */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Record Payment Collection</span>
          </h2>

          {paymentError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{paymentError}</span>
            </div>
          )}

          <form onSubmit={handleRecordPayment} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase mb-1">Select Invoice</label>
              <select
                value={selectedInvoiceId}
                onChange={e => {
                  setSelectedInvoiceId(e.target.value);
                  setPaymentError(null);
                  const inv = invoices.find(i => i._id === e.target.value);
                  if (inv) setPaymentAmount(inv.balanceDue);
                }}
                className="w-full bg-cream-50 border border-subtle-border rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-forest-700"
              >
                {invoices.filter(i => i.balanceDue > 0).map(inv => (
                  <option key={inv._id} value={inv._id}>
                    {inv.invoiceNumber} - {inv.customerName} (Due: ₹{inv.balanceDue})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-charcoal-700 uppercase">Payment Amount (₹)</label>
                {selectedInvoice && (
                  <span className="text-[11px] text-charcoal-500 font-semibold">
                    Balance: ₹{selectedInvoice.balanceDue.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={e => {
                    setPaymentAmount(Number(e.target.value));
                    setPaymentError(null);
                  }}
                  className="w-full bg-cream-50 border border-subtle-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-forest-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (selectedInvoice) setPaymentAmount(selectedInvoice.balanceDue);
                    else setPaymentAmount(4000);
                  }}
                  className="px-2.5 py-2 bg-cream-100 hover:bg-cream-200 text-charcoal-700 text-xs font-semibold rounded-xl border border-subtle-border"
                >
                  Full Due
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-cream-50 border border-subtle-border rounded-xl px-3 py-2 text-xs font-medium outline-none"
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
              className="w-full bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold shadow transition mt-2"
            >
              Post Payment & Update Outstanding
            </button>
          </form>
        </div>
      </div>

      {/* Raised Invoices Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-forest-700" />
            <span>GST Tax Invoices & Dispatches</span>
          </h2>
          <span className="text-xs text-charcoal-500 font-medium">{invoices.length} total invoices</span>
        </div>

        {invoices.length === 0 ? (
          <p className="text-xs text-charcoal-400 py-6 text-center">No invoices generated yet.</p>
        ) : (
          <div className="overflow-x-auto border border-subtle-border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 text-charcoal-700 font-semibold uppercase">
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
              <tbody className="divide-y divide-subtle-divider">
                {invoices.map(inv => {
                  const shareText = `*Tax Invoice ${inv.invoiceNumber}*\nCustomer: ${inv.customerName}\nAmount: ₹${inv.grandTotal.toLocaleString('en-IN')}\nBalance Due: ₹${inv.balanceDue.toLocaleString('en-IN')}\nPay via UPI / NEFT to ZenLyft Manufacturing OS.`;
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

                  return (
                    <tr key={inv._id} className="hover:bg-cream-50/80">
                      <td className="p-3 font-extrabold text-forest-700">
                        <div>{inv.invoiceNumber}</div>
                        {inv.status === 'CANCELLED' && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 mt-1">
                            CANCELLED
                          </span>
                        )}
                        {inv.creditNoteNumber && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            CN: {inv.creditNoteNumber}
                          </div>
                        )}
                        {inv.irn && (
                          <div className="mt-1">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-50 text-purple-700 border border-purple-200" title={`Full IRN: ${inv.irn}`}>
                              IRN: {inv.irn.substring(0, 8)}...{inv.irn.substring(inv.irn.length - 4)} (mock)
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-medium text-charcoal-900">{inv.customerName}</td>
                      <td className="p-3 text-charcoal-500">{inv.placeOfSupply}</td>
                      <td className="p-3 font-semibold text-charcoal-900">₹{inv.taxableValue.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-charcoal-600 text-[11px]">
                        {inv.isInterState ? (
                          <span className="text-purple-700 font-semibold">IGST: ₹{inv.igstTotal.toFixed(2)}</span>
                        ) : (
                          <span>CGST: ₹{inv.cgstTotal.toFixed(2)} + SGST: ₹{inv.sgstTotal.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="p-3 font-black text-charcoal-900">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            inv.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700' :
                            inv.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                            inv.paymentStatus === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {inv.status === 'CANCELLED' ? 'CANCELLED' : `${inv.paymentStatus} (Due: ₹${inv.balanceDue})`}
                          </span>
                          <div>
                            <span className={`text-[10px] font-bold ${inv.isDispatched ? 'text-emerald-600' : 'text-charcoal-400'}`}>
                              {inv.isDispatched ? '✓ Dispatched' : 'Pending Dispatch'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                        {/* Download Tax Invoice PDF button */}
                        <a
                          href={api.getInvoicePDFUrl(inv._id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-cream-100 hover:bg-cream-200 text-charcoal-700 rounded-lg text-xs font-semibold border border-subtle-border transition"
                          title="Download Standard Tax Invoice PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>

                        {/* Credit Note PDF button (if cancelled) */}
                        {inv.creditNoteNumber && (
                          <a
                            href={api.getCreditNotePDFUrl(inv._id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-300 transition"
                            title="Download Credit Note PDF"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Credit Note</span>
                          </a>
                        )}

                        {/* WhatsApp Share Link */}
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 transition"
                          title="Share Invoice & Balance via WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Partial / Full Dispatch button */}
                        {!inv.isDispatched && inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => openDispatchModal(inv)}
                            disabled={loading}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold shadow transition"
                            title="Record dispatch with line quantities"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch</span>
                          </button>
                        )}

                        {/* Cancel Invoice button */}
                        {inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => openCancelModal(inv)}
                            disabled={loading}
                            className="inline-flex items-center space-x-1 px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-200 transition"
                            title="Cancel invoice and issue Credit Note"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-subtle-border space-y-4">
            <div className="flex justify-between items-center border-b border-subtle-divider pb-3">
              <h3 className="text-sm font-bold text-charcoal-900">Edit Order {editingOrder.orderNumber}</h3>
              <button onClick={() => setEditingOrder(null)} className="text-charcoal-400 hover:text-charcoal-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderEdit} className="space-y-4">
              <div className="space-y-3">
                {editItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-cream-50 rounded-xl border border-subtle-border space-y-2">
                    <div className="font-bold text-xs text-charcoal-900">{item.productName || item.productCode}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">Quantity (pkts)</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                          }}
                          className="w-full bg-white border border-subtle-border rounded-lg px-2.5 py-1.5 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">Unit Price (₹)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={item.unitPrice}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, unitPrice: val } : it));
                          }}
                          className="w-full bg-white border border-subtle-border rounded-lg px-2.5 py-1.5 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-subtle-divider">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-charcoal-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partial Dispatch Modal */}
      {dispatchingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-subtle-border space-y-4">
            <div className="flex justify-between items-center border-b border-subtle-divider pb-3">
              <h3 className="text-sm font-bold text-charcoal-900">Dispatch Invoice {dispatchingInvoice.invoiceNumber}</h3>
              <button onClick={() => setDispatchingInvoice(null)} className="text-charcoal-400 hover:text-charcoal-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-charcoal-500">
              Specify the actual quantities being dispatched. Uncheck or reduce quantity for partial dispatch.
            </p>

            <div className="space-y-3">
              {dispatchItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl border border-subtle-border">
                  <span className="font-bold text-xs text-charcoal-800">{item.productCode}</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setDispatchItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                      }}
                      className="w-24 bg-white border border-subtle-border rounded-lg px-2.5 py-1 text-xs font-bold text-right"
                    />
                    <span className="text-xs text-charcoal-500">pkts</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-subtle-divider">
              <button
                type="button"
                onClick={() => setDispatchingInvoice(null)}
                className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-charcoal-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={loading}
                className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Invoice Modal */}
      {cancellingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-subtle-border space-y-4">
            <div className="flex justify-between items-center border-b border-subtle-divider pb-3">
              <h3 className="text-sm font-bold text-charcoal-900">Cancel Tax Invoice {cancellingInvoice.invoiceNumber}</h3>
              <button onClick={() => setCancellingInvoice(null)} className="text-charcoal-400 hover:text-charcoal-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-charcoal-600">
              Under GST statutory guidelines, cancelling an invoice requires issuing a matching Credit Note and reversing customer receivables.
            </p>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">Cancellation Reason</label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                className="w-full bg-cream-50 border border-subtle-border rounded-xl p-2.5 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                placeholder="Reason for cancellation (required)..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-subtle-divider">
              <button
                type="button"
                onClick={() => setCancellingInvoice(null)}
                className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-charcoal-700 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={loading || !cancelReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                Issue Credit Note & Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
