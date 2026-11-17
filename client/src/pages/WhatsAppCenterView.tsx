import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  MessageSquare, 
  Send, 
  CheckCheck, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';

export const WhatsAppCenterView: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Send form state
  const [recipientName, setRecipientName] = useState('Retailer A');
  const [recipientPhone, setRecipientPhone] = useState('+91 98765 43210');
  const [templateType, setTemplateType] = useState<string>('INVOICE_DELIVERY');
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [nRes, sRes] = await Promise.all([
        api.getWhatsAppNotifications(),
        api.getWhatsAppStatus()
      ]);
      if (nRes.success) setNotifications(nRes.notifications);
      if (sRes.success) setStatus(sRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendSuccess(null);
    try {
      const res = await api.sendWhatsAppNotification({
        recipientPhone,
        recipientName,
        templateType,
        variables: {
          customerName: recipientName,
          invoiceNumber: 'INV/2024-25/001',
          taxableValue: '7500.00',
          cgstTotal: '187.50',
          sgstTotal: '187.50',
          igstTotal: '0.00',
          grandTotal: '7875.00',
          placeOfSupply: 'Tamil Nadu (33)',
          orderNumber: 'SO-2026-001',
          productName: 'Murukku 200 g',
          quantity: 150,
          totalAmount: 7500,
          amount: 4000,
          balanceDue: '3875.00',
          customerOutstanding: '3875.00',
          runNumber: 'PR-2026-001',
          actualOutput: 188,
          yieldPercent: 94,
          yieldVariancePercent: -6,
          damagedPouches: 6
        }
      });

      if (res.success) {
        setSendSuccess(`WhatsApp message sent to ${recipientName} (${recipientPhone})!`);
        loadAll();
      }
    } catch (err: any) {
      alert('Failed to send notification: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">OpenWA Communication Service</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">WhatsApp Automation & Notification Centre</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Automated WhatsApp invoice delivery, order confirmations, dispatch tracking, and production alerts powered by OpenWA.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-extrabold shadow transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Messages</span>
        </button>
      </div>

      {sendSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{sendSuccess}</span>
          </div>
          <button onClick={() => setSendSuccess(null)} className="text-emerald-700 hover:text-emerald-900">Dismiss</button>
        </div>
      )}

      {/* Grid: Send Simulator & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dispatch WhatsApp Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Send WhatsApp Notification</span>
            </h2>
            <span className="text-[11px] text-slate-400">Trigger standard business templates</span>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Message Template</label>
              <select
                value={templateType}
                onChange={e => setTemplateType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="INVOICE_DELIVERY">🧾 GST Tax Invoice (with PDF Link)</option>
                <option value="ORDER_CONFIRMATION">📦 Order Confirmation & Booking</option>
                <option value="DISPATCH_ALERT">🚚 Factory Dispatch & Transit Alert</option>
                <option value="PAYMENT_RECEIPT">💰 Payment Receipt & Outstanding Balance</option>
                <option value="PRODUCTION_VARIANCE_ALERT">⚠️ Production Yield & Wastage Alert</option>
                <option value="LOW_STOCK_ALERT">⚠️ Raw Material Low Stock Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Recipient Name</label>
              <input
                type="text"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number (WhatsApp)</label>
              <input
                type="text"
                value={recipientPhone}
                onChange={e => setRecipientPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
              />
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 space-y-1">
              <div className="flex items-center space-x-1 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>OpenWA Architectural Rule</span>
              </div>
              <p className="text-slate-600">
                ERP state is never mutated by unverified chat responses. Outbound messages use verified transactional templates.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-bold shadow-md transition"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Sending via OpenWA...' : 'Send WhatsApp Message'}</span>
            </button>
          </form>
        </div>

        {/* Right: Real-Time WhatsApp Feed & Previews */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Dispatched WhatsApp Message Feed ({notifications.length})</span>
            </h2>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              OpenWA Adapter Active
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No WhatsApp messages logged yet. Use the form on the left or approve an invoice/dispatch to trigger messages automatically.
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {notifications.map(n => (
                <div key={n._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-xs text-slate-900">{n.recipientName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">({n.recipientPhone})</span>
                    </div>

                    <div className="flex items-center space-x-1 text-emerald-600 text-[11px] font-bold">
                      <CheckCheck className="w-4 h-4" />
                      <span>{n.deliveryStatus || 'DELIVERED'}</span>
                    </div>
                  </div>

                  {/* WhatsApp Chat Bubble */}
                  <div className="bg-emerald-100/50 border border-emerald-200/80 rounded-2xl p-3 text-xs text-slate-800 font-sans whitespace-pre-line leading-relaxed shadow-sm">
                    {n.messageBody}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Template: <strong className="text-slate-600">{n.templateType}</strong></span>
                    <span>{new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
