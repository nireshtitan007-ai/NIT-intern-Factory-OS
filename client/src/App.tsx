import React, { useState, useEffect } from 'react';
import { UserRole, AppUser } from './types';
import { Navbar } from './components/Navbar';
import { BenchmarkModal } from './components/BenchmarkModal';
import { LoginView } from './pages/LoginView';
import { AdminControlCenterView } from './pages/AdminControlCenterView';
import { AdminDeskView } from './pages/AdminDeskView';
import { SalesmanView } from './pages/SalesmanView';
import { ProductionView } from './pages/ProductionView';
import { InventoryView } from './pages/InventoryView';
import { AuditorView } from './pages/AuditorView';
import { WhatsAppCenterView } from './pages/WhatsAppCenterView';
import { api } from './services/api';
import { Bell, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem('zenlyft_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem('zenlyft_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role === 'admin' || u.role === 'owner') return 'admin';
        if (u.role === 'salesman' || u.role === 'sales_manager') return 'salesman';
        if (u.role === 'production') return 'production';
        if (u.role === 'inventory') return 'accountant';
        if (u.role === 'accountant') return 'accountant';
        if (u.role === 'auditor') return 'owner';
      }
    } catch {
      // fallback
    }
    return 'admin';
  });

  const [isOffline, setIsOffline] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [liveToast, setLiveToast] = useState<{ type: string; title: string; desc: string } | null>(null);

  // Real-time EventSource listener for live multi-user sync
  useEffect(() => {
    if (!currentUser) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/events');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'CONNECTED') return;

          let title = 'Live Business Event';
          let desc = `Received event: ${data.type}`;

          if (data.type === 'ORDER_CREATED') {
            title = 'New Sales Order Submitted';
            desc = `Order ${data.payload?.orderNumber} for ${data.payload?.customerName} placed by ${data.payload?.salesmanName}`;
          } else if (data.type === 'ORDER_APPROVED') {
            title = 'Sales Order Approved & Invoiced';
            desc = `Order ${data.payload?.order?.orderNumber} approved. Invoice: ${data.payload?.invoice?.invoiceNumber}`;
          } else if (data.type === 'ORDER_DISPATCHED') {
            title = 'Finished Goods Dispatched';
            desc = `Invoice ${data.payload?.invoice?.invoiceNumber} dispatched. Stock deducted from ledger.`;
          } else if (data.type === 'PAYMENT_RECORDED') {
            title = 'Payment Received';
            desc = `Payment of ₹${data.payload?.payment?.amount} received for ${data.payload?.invoice?.invoiceNumber}`;
          } else if (data.type === 'PRODUCTION_COMPLETED') {
            title = 'Production Run Completed';
            desc = `Run ${data.payload?.runNumber}: ${data.payload?.actualOutputPackets} packets produced with yield ${data.payload?.yieldPercent}%.`;
          }

          setLiveToast({ type: data.type, title, desc });
          setTimeout(() => setLiveToast(null), 6000);
        } catch (e) {
          // ignore non-json
        }
      };
    } catch (e) {
      console.warn('Realtime SSE connection failed:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [currentUser]);

  const handleLoginSuccess = (user: AppUser, token: string) => {
    setCurrentUser(user);
    if (user.role === 'admin' || user.role === 'owner') {
      setCurrentRole('admin');
    } else if (user.role === 'salesman' || user.role === 'sales_manager') {
      setCurrentRole('salesman');
    } else if (user.role === 'production') {
      setCurrentRole('production');
    } else if (user.role === 'inventory') {
      setCurrentRole('accountant');
    } else if (user.role === 'accountant') {
      setCurrentRole('accountant');
    } else if (user.role === 'auditor') {
      setCurrentRole('owner');
    } else {
      setCurrentRole('salesman');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zenlyft_token');
    localStorage.removeItem('zenlyft_user');
    setCurrentUser(null);
  };

  const handleRunBenchmark = async () => {
    setIsProcessing(true);
    try {
      const res = await api.runBenchmark();
      setBenchmarkResult(res);
      setIsModalOpen(true);
    } catch (e: any) {
      alert('Error running benchmark: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSeedData = async () => {
    setIsProcessing(true);
    try {
      await api.seedBenchmark();
      alert('Section 5 Benchmark Master Data seeded successfully.');
      window.location.reload();
    } catch (e: any) {
      alert('Error seeding data: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // If user is not authenticated, present the Two Distinct Login Experiences
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline(!isOffline)}
        onRunBenchmark={handleRunBenchmark}
        onSeedData={handleSeedData}
        isProcessing={isProcessing}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Real-time Toast Notification (Server-Sent Events) */}
      {liveToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-indigo-500/50 flex items-start space-x-3 animate-bounce">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-indigo-300">{liveToast.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-snug">{liveToast.desc}</p>
          </div>
        </div>
      )}

      <main className="flex-1 pb-16">
        {/* Admin Control Centre (Authoritative Control) */}
        {currentRole === 'admin' && <AdminControlCenterView />}

        {/* Operational Modules */}
        {currentRole === 'salesman' && <SalesmanView isOffline={isOffline} />}
        {currentRole === 'production' && <ProductionView />}
        {currentRole === 'accountant' && <InventoryView />}
        {currentRole === 'owner' && <AuditorView />}
        {currentRole === 'whatsapp' && <WhatsAppCenterView />}
      </main>

      {/* Benchmark Results Modal */}
      <BenchmarkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        result={benchmarkResult}
      />
    </div>
  );
};

export default App;
