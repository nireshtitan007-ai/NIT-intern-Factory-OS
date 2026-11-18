import React, { useState } from 'react';
import { 
  Building2, 
  Smartphone, 
  Factory, 
  Boxes, 
  FileSpreadsheet, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  ChevronDown, 
  Layers, 
  Database, 
  Cpu, 
  TrendingUp, 
  Check, 
  Sparkles,
  Lock,
  MessageSquare,
  HelpCircle
} from 'lucide-react';

interface LandingPageViewProps {
  onEnterApp: () => void;
  onOpenBenchmark: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onEnterApp, onOpenBenchmark }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How does ZenLyft handle weak or absent internet connectivity in rural stores?",
      a: "ZenLyft's Salesman Mobile terminal runs as an offline-first Progressive Web Application (PWA) with local IndexedDB storage. Salesmen can capture orders, view customer price tiers, and store transactions without network connectivity. As soon as a connection is detected, orders synchronize idempotently with unique client UUIDs, guaranteeing zero duplicates."
    },
    {
      q: "Does this software require accounting tools like Tally for daily manufacturing operations?",
      a: "No. ZenLyft is a self-contained operational nervous system. It calculates Weighted Average Costs (WAC), maintains an immutable double-entry stock ledger, and generates statutory GST tax invoices (CGST/SGST/IGST) with continuous financial-year numbering. Complete monthly registers can be exported to Excel/CSV for external accountants."
    },
    {
      q: "How does the recipe (BOM) engine catch ingredient shrinkage and wastage?",
      a: "Every product links to a standard Bill of Materials. When a batch is logged, the system compares actual material draw (e.g. 10.5 L cooking oil) and actual output (188 packets) against standard BOM expectations (10.0 L oil, 200 packets). If consumption or yield variance exceeds the 3% tolerance threshold, an automated critical alert is flagged in the audit log."
    },
    {
      q: "Can the factory owner prevent salesmen from seeing confidential margins or admin settings?",
      a: "Yes. ZenLyft enforces strict, deny-by-default Role-Based Access Control (RBAC) at the backend API layer. Salesmen logging in via mobile cannot access administrator routes or costing endpoints even by altering frontend URLs. Separate portals exist for Salesmen, Production Supervisors, Accountants, Auditors, and Factory Admins."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/30">
              Z
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">ZenLyft</span>
              <span className="text-[10px] text-indigo-400 font-mono block -mt-1 font-semibold">MANUFACTURING OS</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-400">
            <a href="#problem-solution" className="hover:text-white transition">The Challenge</a>
            <a href="#capabilities" className="hover:text-white transition">Capabilities</a>
            <a href="#how-it-works" className="hover:text-white transition">Architecture</a>
            <a href="#pricing" className="hover:text-white transition">Commercial Plans</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenBenchmark}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
            >
              <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Section 5 Benchmark</span>
            </button>
            <button
              onClick={onEnterApp}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5"
            >
              <span>Launch Application</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(79,70,229,0.15),rgba(255,255,255,0))]"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Centre for Digital Infrastructure • NIT Tiruchirappalli</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            The Manufacturing Operating System for Food Producers.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Link field salesman orders directly with shop-floor recipe execution, authoritative double-entry inventory ledgers, GST tax invoices, and monthly auditor reports.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center space-x-2 transition"
            >
              <span>Enter Enterprise Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenBenchmark}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold rounded-xl text-sm border border-slate-800 flex items-center justify-center space-x-2 transition"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Verify Benchmark (100% Match)</span>
            </button>
          </div>

          {/* 3. Product Interface Live Preview Card */}
          <div className="mt-14 max-w-4xl mx-auto bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl p-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                <span className="ml-2 text-xs font-mono text-slate-500">zenlyft.live/control-centre</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                BENCHMARK ENGINE LIVE
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[11px] font-medium text-slate-500 block">Flour Balance</span>
                <span className="text-xl font-black text-white mt-1 block">120 kg</span>
                <span className="text-[10px] text-emerald-400">100 + 60 − 40 kg</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[11px] font-medium text-slate-500 block">Oil Balance</span>
                <span className="text-xl font-black text-white mt-1 block">19.5 L</span>
                <span className="text-[10px] text-emerald-400">30 − 10.5 L</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[11px] font-medium text-slate-500 block">Yield Variance</span>
                <span className="text-xl font-black text-rose-400 mt-1 block">-6.0%</span>
                <span className="text-[10px] text-rose-400 font-bold">188 vs 200 pkts (Flagged)</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[11px] font-medium text-slate-500 block">Retailer A Invoice</span>
                <span className="text-xl font-black text-amber-400 mt-1 block">₹7,875.00</span>
                <span className="text-[10px] text-slate-400">₹7,500 + CGST/SGST</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">Closed-Loop Finished Goods Nexus</p>
                  <p className="text-slate-400">50 Opening + 188 Produced − 150 Dispatched = 88 Packets Closing Balance</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-300">₹31.14 / pkt</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Problem & Solution Comparison */}
      <section id="problem-solution" className="py-20 border-b border-slate-900 bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">The Transformation</h2>
            <p className="text-3xl font-black text-white tracking-tight mt-2">
              From Disconnected Chaos to Authoritative Ledger
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-rose-500/20 relative">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4 inline-block">
                Traditional Status Quo
              </span>
              <h3 className="text-xl font-bold text-white mb-4">Fragmented Paper & WhatsApp</h3>
              <ul className="space-y-3.5 text-xs text-slate-400">
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Salesmen phone or WhatsApp orders; admin manually re-keys into billing software.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Unnoticed ingredient shrinkage: oil and flour loss goes unflagged until month-end.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Physical stock in the shed never matches the spreadsheet books.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Owner has no idea of the exact cost per packet after energy and labor overheads.</span>
                </li>
              </ul>
            </div>

            {/* The ZenLyft Way */}
            <div className="p-8 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 relative">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 inline-block">
                The ZenLyft Platform
              </span>
              <h3 className="text-xl font-bold text-white mb-4">Single-Entry Unified Loop</h3>
              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex items-start space-x-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Every transaction entered once at source: salesman enters order on mobile (offline-ready).</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Automated recipe BOM execution flags variances beyond the 3% tolerance in real-time.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Authoritative double-entry stock ledger reconciles purchases, batches, and dispatches.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Instant GST tax invoices (CGST/SGST/IGST) with auditor-ready GSTR-1 and stock exports.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Key Product Capabilities */}
      <section id="capabilities" className="py-20 border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Enterprise Modules</h2>
            <p className="text-3xl font-black text-white tracking-tight mt-2">
              Built Specifically for Food Manufacturers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Field Sales Mobile App</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                IndexedDB offline queue allows salesmen to book 50+ retail visits with zero 4G connection. Idempotent synchronization prevents duplicate orders upon reconnecting.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold mb-4">
                <Factory className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Recipe BOM Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dynamic conversion of finished goods targets into ingredient draw. Tracks oil absorption, flour ratios, and pouch wastage with automated tolerance alerting.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-4">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Immutable Stock Ledger</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Double-entry inventory movements tied to source documents (PO, Batch, Invoice). Zero mathematical drift with Weighted Average Costing (WAC) recalculation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">GST Invoicing Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatic place-of-supply tax splitting (Intra-state CGST+SGST vs. Inter-state IGST). Continuous financial-year invoice numbering with downloadable PDF formats.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Unit Costing & Overheads</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Apportions raw material WAC, packaging, direct kitchen labor, and power/gas overheads to output batches, calculating accurate profit margins per packet.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">WhatsApp Automation Hub</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integrated OpenWA & Meta Cloud API automation pushes order confirmations, PDF tax invoices, and payment receipts directly to customer WhatsApp chats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Plans */}
      <section id="pricing" className="py-20 border-b border-slate-900 bg-slate-950/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Commercial Licensing</h2>
            <p className="text-3xl font-black text-white tracking-tight mt-2">
              Predictable, Transparent SaaS Pricing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Starter Factory</h3>
                <p className="text-xs text-slate-400 mt-1">For small bakeries & single-line snack units.</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-black text-white">₹1,999</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    <span>1 Admin + 3 Field Salesmen</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Standard BOM Recipe Engine</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    <span>GST Invoices with PDF Export</span>
                  </li>
                </ul>
              </div>
              <button onClick={onEnterApp} className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition">
                Start with Starter
              </button>
            </div>

            {/* Growth */}
            <div className="p-6 rounded-2xl bg-indigo-950/30 border-2 border-indigo-500 shadow-xl flex flex-col justify-between relative">
              <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white uppercase tracking-wider">
                POPULAR
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Growth Plant</h3>
                <p className="text-xs text-indigo-200 mt-1">For scaling snack brands with 5-15 salesmen.</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-black text-white">₹4,999</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>1 Admin + 10 Salesmen + 2 Floor</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Offline PWA with IndexedDB Sync</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dynamic Variance Alerts (&gt;3%)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Order & Invoice Automation</span>
                  </li>
                </ul>
              </div>
              <button onClick={onEnterApp} className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/30 transition">
                Choose Growth
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Enterprise Multi-Plant</h3>
                <p className="text-xs text-slate-400 mt-1">For multi-factory food corporations.</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-black text-white">₹9,999</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Unlimited Users & Branches</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tally XML/Excel Two-Way Sync</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dedicated Statutory Auditor View</span>
                  </li>
                </ul>
              </div>
              <button onClick={onEnterApp} className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition">
                Contact Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section id="faq" className="py-20 border-b border-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Questions & Answers</h2>
            <p className="text-3xl font-black text-white tracking-tight mt-2">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-indigo-300 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Enterprise Footer */}
      <footer className="py-12 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              Z
            </div>
            <span className="font-bold text-slate-300">ZenLyft Manufacturing Business OS</span>
            <span>•</span>
            <span>Centre for Digital Infrastructure, NIT Tiruchirappalli</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <a href="https://github.com/nireshtitan007-ai/NIT-intern-Factory-OS.git" target="_blank" rel="noreferrer" className="hover:text-white transition">
              GitHub Repository
            </a>
            <span>•</span>
            <button onClick={onOpenBenchmark} className="hover:text-white transition">
              Section 5 Benchmark
            </button>
            <span>•</span>
            <button onClick={onEnterApp} className="hover:text-indigo-400 font-bold transition">
              Enterprise Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
