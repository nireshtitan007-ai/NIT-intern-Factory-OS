import React, { useState } from 'react';
import { UserRole } from './types';
import { Navbar } from './components/Navbar';
import { BenchmarkModal } from './components/BenchmarkModal';
import { SalesmanView } from './pages/SalesmanView';
import { AdminDeskView } from './pages/AdminDeskView';
import { ProductionView } from './pages/ProductionView';
import { InventoryView } from './pages/InventoryView';
import { AuditorView } from './pages/AuditorView';
import { OwnerView } from './pages/OwnerView';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [isOffline, setIsOffline] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      />

      <main className="flex-1 pb-16">
        {currentRole === 'salesman' && <SalesmanView isOffline={isOffline} />}
        {currentRole === 'admin' && <AdminDeskView />}
        {currentRole === 'production' && <ProductionView />}
        {currentRole === 'accountant' && <InventoryView />}
        {currentRole === 'owner' && <AuditorView />}
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
