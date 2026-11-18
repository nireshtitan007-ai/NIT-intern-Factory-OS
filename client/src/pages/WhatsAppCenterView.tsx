import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  MessageSquare, 
  Send, 
  CheckCheck, 
  RefreshCw, 
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
          cgst: '187.50',
          sgst: '187.50',
          grandTotal: '7875.00',
          outstandingBalance: '3875.00',
          orderNumber: 'SO-2024-001',
          productName: 'Murukku 200 g',
          quantity: 150,
          totalAmount: 7500,
          yieldPercent: '94',
          oilVariance: '+5.0',
          materialName: 'Cooking Oil',
          currentStock: '19.5',
          reorderLevel: '20'
        }
      });

      if (res.success) {
        setSendSuccess(`WhatsApp message queued for ${recipientName} (${recipientPhone})!`);
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
      <div className="bg-forest-700 text-cream-50 rounded-2xl p-6 shadow-sm border border-forest-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-forest-200">OpenWA Communication Service</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 text-white">WhatsApp Automation & Notification Hub</h1>
          <p className="text-xs text-forest-100 mt-1 max-w-xl">
            Automated WhatsApp invoice delivery, order confirmations, dispatch tracking, and production alerts.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="flex items-center space-x-2 bg-cream-50 hover:bg-white text-forest-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Messages</span>
        </button>
      </div>

      {sendSuccess && (
        <div className="p-4 bg-forest-100 border border-forest-500/30 text-forest-700 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-forest-600" />
            <span>{sendSuccess}</span>
          </div>
          <button onClick={() => setSendSuccess(null)} className="text-forest-700 hover:underline font-bold">Dismiss</button>
        </div>
      )}

      {/* Grid: Send Simulator & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dispatch WhatsApp Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <div className="border-b border-subtle-divider pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-forest-700" />
              <span>Send WhatsApp Notification</span>
            </h2>
            <span className="text-[11px] text-charcoal-500">Trigger standard business templates</span>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Message Template</label>
              <select
                value={templateType}
                onChange={e => setTemplateType(e.target.value)}
                className="w-full bg-cream-50 border border-subtle-border rounded-xl px-3 py-2 text-xs text-charcoal-900 font-medium focus:outline-none focus:ring-1 focus:ring-forest-700"
              >
                <option value="INVOICE_DELIVERY">GST Tax Invoice (with PDF Link)</option>
                <option value="ORDER_CONFIRMATION">Order Confirmation & Booking</option>
                <option value="DISPATCH_ALERT">Factory Dispatch & Transit Alert</option>
                <option value="PAYMENT_RECEIPT">Payment Receipt & Outstanding Balance</option>
                <option value="PRODUCTION_VARIANCE_ALERT">Production Yield & Wastage Alert</option>
                <option value="LOW_STOCK_ALERT">Raw Material Low Stock Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Recipient Name</label>
              <input
                type="text"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                className="w-full bg-cream-50 border border-subtle-border rounded-xl px-3 py-2 text-xs text-charcoal-900 font-medium focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Recipient WhatsApp Mobile</label>
              <input
                type="text"
                value={recipientPhone}
                onChange={e => setRecipientPhone(e.target.value)}
                className="w-full bg-cream-50 border border-subtle-border rounded-xl px-3 py-2 text-xs text-charcoal-900 font-medium focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full flex items-center justify-center space-x-2 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Transmitting...' : 'Dispatch WhatsApp Alert'}</span>
            </button>
          </form>
        </div>

        {/* Right: Message Logs Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-subtle-border space-y-4">
          <div className="flex items-center justify-between border-b border-subtle-divider pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center space-x-2">
              <CheckCheck className="w-4 h-4 text-forest-700" />
              <span>Automated Notification Log</span>
            </h2>
            <span className="text-[11px] text-charcoal-500">{notifications.length} transmissions logged</span>
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-charcoal-500 py-8 text-center">No WhatsApp messages dispatched yet.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {notifications.map((n, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-subtle-border bg-cream-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-charcoal-900">{n.recipientName} ({n.recipientPhone})</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-forest-100 text-forest-700 uppercase">
                      {n.status}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-700 whitespace-pre-line font-mono bg-white p-3 rounded-lg border border-subtle-border">
                    {n.messageBody}
                  </p>
                  <div className="text-[10px] text-charcoal-500 flex justify-between">
                    <span>Template: {n.templateType}</span>
                    <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
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
