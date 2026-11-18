import React, { useState, useEffect } from 'react';
import { UserRole, AppUser } from './types';
import { Navbar } from './components/Navbar';
import { BenchmarkModal } from './components/BenchmarkModal';
import { LandingPageView } from './pages/LandingPageView';
import { LoginView } from './pages/LoginView';
import { AdminControlCenterView } from './pages/AdminControlCenterView';
import { SalesmanView } from './pages/SalesmanView';
import { ProductionView } from './pages/ProductionView';
import { InventoryView } from './pages/InventoryView';
import { AuditorView } from './pages/AuditorView';
import { WhatsAppCenterView } from './pages/WhatsAppCenterView';
import { UserProfileView } from './pages/UserProfileView';
import { api } from './services/api';
import { Bell } from 'lucide-react';

export const App: React.FC = () => {
  // Current URL path-based routing state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

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

  // Router navigation helper
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
          } else if (data.type === 'INQUIRY_RECEIVED') {
            title = 'New Inbound Commercial Lead';
            desc = `${data.payload?.name} from ${data.payload?.company} submitted a ${data.payload?.inquiryType}.`;
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
      navigate('/admin');
    } else if (user.role === 'salesman' || user.role === 'sales_manager') {
      setCurrentRole('salesman');
      navigate('/app/sales-terminal');
    } else if (user.role === 'production') {
      setCurrentRole('production');
      navigate('/app/production');
    } else if (user.role === 'inventory') {
      setCurrentRole('accountant');
      navigate('/app/inventory');
    } else if (user.role === 'accountant') {
      setCurrentRole('accountant');
      navigate('/app/reports');
    } else if (user.role === 'auditor') {
      setCurrentRole('owner');
      navigate('/app/reports');
    } else {
      setCurrentRole('salesman');
      navigate('/app/sales-terminal');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zenlyft_token');
    localStorage.removeItem('zenlyft_user');
    setCurrentUser(null);
    navigate('/');
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

  // Determine which page/route to render
  const isPublicRoute = currentPath === '/' || 
                        currentPath === '/features' || 
                        currentPath === '/pricing' || 
                        currentPath === '/contact' || 
                        currentPath === '/register';

  // 1. Public Marketing Website
  if (isPublicRoute && !currentUser) {
    return (
      <>
        <LandingPageView
          currentPath={currentPath}
          onNavigate={navigate}
          onEnterApp={() => navigate('/login')}
          onOpenBenchmark={handleRunBenchmark}
        />
        <BenchmarkModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          result={benchmarkResult}
        />
      </>
    );
  }

  // 2. Login Portal
  if (currentPath === '/login' && !currentUser) {
    const params = new URLSearchParams(window.location.search);
    const initialMode = params.get('mode') === 'salesman' ? 'salesman' :
                        params.get('mode') === 'staff' ? 'staff' : 'admin';
    return (
      <LoginView 
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => navigate('/')}
        initialMode={initialMode}
      />
    );
  }

  // If unauthenticated and trying to access private /app or /admin route, redirect to login
  if (!currentUser) {
    return (
      <LoginView 
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => navigate('/')}
        initialMode="admin"
      />
    );
  }

  // 3. Authenticated Workplace Viewport
  const isProfileActive = currentPath === '/app/profile';

  return (
    <div className="min-h-screen flex flex-col bg-cream-200 text-charcoal-900 font-sans">
      <Navbar
        currentRole={currentRole}
        onSelectRole={(role) => {
          setCurrentRole(role);
          if (role === 'admin') navigate('/admin');
          else if (role === 'salesman') navigate('/app/sales-terminal');
          else if (role === 'production') navigate('/app/production');
          else if (role === 'accountant') navigate('/app/inventory');
          else if (role === 'owner') navigate('/app/reports');
          else if (role === 'whatsapp') navigate('/app/whatsapp');
        }}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline(!isOffline)}
        onRunBenchmark={handleRunBenchmark}
        onSeedData={handleSeedData}
        isProcessing={isProcessing}
        currentUser={currentUser}
        onLogout={handleLogout}
        onViewLandingPage={() => navigate('/')}
        onOpenProfile={() => navigate('/app/profile')}
        isProfileActive={isProfileActive}
      />

      {/* Real-time Toast Notification (Server-Sent Events) */}
      {liveToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-white text-charcoal-900 p-4 rounded-xl shadow-lg border border-forest-500/40 flex items-start space-x-3">
          <div className="w-8 h-8 rounded-lg bg-forest-100 border border-forest-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bell className="w-4 h-4 text-forest-700" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-forest-700">{liveToast.title}</h4>
            <p className="text-xs text-charcoal-500 mt-0.5 leading-snug">{liveToast.desc}</p>
          </div>
        </div>
      )}

      <main className="flex-1 pb-16">
        {/* Profile View */}
        {isProfileActive && (
          <UserProfileView 
            currentUser={currentUser} 
            onUserUpdated={(updated) => setCurrentUser(updated)} 
          />
        )}

        {/* Admin Control Centre (Authoritative Governance) */}
        {!isProfileActive && (currentRole === 'admin' || currentPath.startsWith('/admin')) && (
          <AdminControlCenterView />
        )}

        {/* Operational Roles */}
        {!isProfileActive && currentRole === 'salesman' && <SalesmanView isOffline={isOffline} />}
        {!isProfileActive && currentRole === 'production' && <ProductionView />}
        {!isProfileActive && currentRole === 'accountant' && <InventoryView />}
        {!isProfileActive && currentRole === 'owner' && <AuditorView />}
        {!isProfileActive && currentRole === 'whatsapp' && <WhatsAppCenterView />}
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
