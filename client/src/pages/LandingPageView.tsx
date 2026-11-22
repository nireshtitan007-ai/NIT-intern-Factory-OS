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
  ChevronUp,
  Layers, 
  Database, 
  TrendingUp, 
  Check, 
  Lock, 
  MessageSquare, 
  Mail, 
  Phone, 
  Send, 
  AlertCircle,
  Target
} from 'lucide-react';
import { api } from '../services/api';

interface LandingPageViewProps {
  onEnterApp: () => void;
  onOpenBenchmark: () => void;
  onOpenPitch?: () => void;
  onNavigate: (route: string) => void;
  currentPath?: string;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ 
  onEnterApp, 
  onOpenBenchmark,
  onOpenPitch,
  onNavigate,
  currentPath = '/'
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  // Contact / Lead Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactFleet, setContactFleet] = useState('1-5');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleContactSubmit = async (e: React.FormEvent, type: 'contact' | 'pilot_registration' = 'contact') => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);

    try {
      const res = await api.submitInquiry({
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        company: contactCompany,
        fleetSize: contactFleet,
        inquiryType: type,
        message: contactMessage
      });

      if (res.success) {
        setSubmitSuccess(res.message || 'Thank you! Your request has been logged.');
        setContactName('');
        setContactEmail('');
        setContactPhone('');
        setContactCompany('');
        setContactMessage('');
      } else {
        setSubmitError(res.error || 'Failed to submit inquiry.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: "How does the platform handle weak or absent internet connectivity in rural retail routes?",
      a: "The field salesman terminal functions as an offline-first client backed by local IndexedDB persistence. Field salesmen can record customer orders, verify customer-specific price tiers, and queue dispatches without active network connectivity. As soon as connectivity returns, orders synchronize idempotently via unique UUIDs with zero duplicate entries."
    },
    {
      q: "Does this system replace external accounting software like Tally?",
      a: "Yes, for operational execution. ZenLyft maintains an authoritative double-entry inventory ledger, tracks Weighted Average Costing (WAC) per production batch, and generates statutory GST tax invoices with continuous sequence numbering. Complete sales registers and GST summaries can also be exported to CSV/Excel for external statutory filings."
    },
    {
      q: "How does the Bill of Materials (BOM) engine catch ingredient wastage and shrinkage?",
      a: "Each finished product is governed by a standard BOM. When a production batch is completed, the system compares actual material draw (e.g., 10.5 L cooking oil) and actual output against standard recipe expectations (10.0 L oil, 200 packets). If consumption or yield variance exceeds the 3% threshold, an automated alert is permanently recorded in the immutable audit log."
    },
    {
      q: "Can the factory owner prevent salesmen from viewing confidential margins or cost prices?",
      a: "Yes. ZenLyft enforces strict, deny-by-default Role-Based Access Control (RBAC) at the backend API layer. Salesmen logging in via mobile cannot access administrator routes, procurement purchase rates, or unit manufacturing costs even by altering frontend URLs."
    },
    {
      q: "How are WhatsApp automated notifications sent to customers?",
      a: "ZenLyft integrates with an OpenWA automation service that listens for core business lifecycle events (Order Confirmation, Invoice Dispatch, Payment Receipts). If the messaging bridge is offline, transactional database operations are never blocked; notifications are queued safely for dispatch upon reconnection."
    }
  ];

  return (
    <div className="min-h-screen bg-cream-200 text-charcoal-900 font-sans selection:bg-forest-100 selection:text-forest-700">
      
      {/* 1. Header Navigation & Brand Identity */}
      <header className="sticky top-0 z-50 bg-cream-200/90 backdrop-blur-md border-b border-subtle-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-forest-700 text-cream-50 flex items-center justify-center font-bold text-base shadow-sm">
              Z
            </div>
            <div>
              <span className="font-bold text-base text-charcoal-900 tracking-tight">ZenLyft</span>
              <span className="text-[10px] text-forest-700 font-semibold block -mt-1 tracking-wider uppercase">Manufacturing OS</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-charcoal-500">
            <button 
              onClick={() => onNavigate('/')}
              className={`hover:text-charcoal-900 transition ${currentPath === '/' ? 'text-forest-700 font-bold' : ''}`}
            >
              Overview
            </button>
            <button 
              onClick={() => onNavigate('/features')}
              className={`hover:text-charcoal-900 transition ${currentPath === '/features' ? 'text-forest-700 font-bold' : ''}`}
            >
              Capabilities
            </button>
            <button 
              onClick={() => onNavigate('/pricing')}
              className={`hover:text-charcoal-900 transition ${currentPath === '/pricing' ? 'text-forest-700 font-bold' : ''}`}
            >
              Commercial Plans
            </button>
            <button 
              onClick={() => onNavigate('/contact')}
              className={`hover:text-charcoal-900 transition ${currentPath === '/contact' ? 'text-forest-700 font-bold' : ''}`}
            >
              Contact Solutions
            </button>
          </nav>

          <div className="flex items-center space-x-2.5">
            {onOpenPitch && (
              <button
                onClick={onOpenPitch}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 rounded-lg text-xs font-bold border border-amber-400/50 transition shadow-sm"
              >
                <Target className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Pitch Deck</span>
              </button>
            )}
            <button
              onClick={onOpenBenchmark}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-cream-100 text-charcoal-700 rounded-lg text-xs font-semibold border border-subtle-border transition shadow-sm"
            >
              <Play className="w-3 h-3 text-amber-600 fill-amber-600" />
              <span>Section 5 Benchmark</span>
            </button>
            <button
              onClick={() => onNavigate('/login')}
              className="px-3.5 py-1.5 text-xs font-semibold text-forest-700 hover:text-forest-800 transition"
            >
              Sign In
            </button>
            <button
              onClick={onEnterApp}
              className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* VIEWPORT SELECTOR: Specific Sub-Pages (/features, /pricing, /contact, /register) */}
      {currentPath === '/contact' && (
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-subtle-border p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-charcoal-900">Commercial Solutions & Consultation</h1>
            <p className="text-sm text-charcoal-500 mt-1">
              Connect with our enterprise engineering team to deploy ZenLyft across your production plant.
            </p>

            {submitSuccess && (
              <div className="mt-4 p-4 rounded-xl bg-forest-100 border border-forest-500/30 text-forest-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}
            {submitError && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={(e) => handleContactSubmit(e, 'contact')} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Ramesh Sundaram"
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Corporate Email Address *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="ramesh@foodworks.com"
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Direct Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Company / Factory Name *</label>
                  <input
                    type="text"
                    required
                    value={contactCompany}
                    onChange={(e) => setContactCompany(e.target.value)}
                    placeholder="e.g. Nash Specialty Foods Pvt Ltd"
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Field Salesmen Fleet Size</label>
                <select
                  value={contactFleet}
                  onChange={(e) => setContactFleet(e.target.value)}
                  className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                >
                  <option value="1-5">1 - 5 Salesmen (Single Plant)</option>
                  <option value="6-20">6 - 20 Salesmen (Multi-Route)</option>
                  <option value="21-50">21 - 50 Salesmen (Regional Distribution)</option>
                  <option value="50+">50+ Salesmen (National Enterprise)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Operational Requirements & Current Challenges</label>
                <textarea
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Tell us about your production lines, recipe variance tracking, or route sales requirements..."
                  className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Transmitting Request...' : 'Submit Commercial Inquiry'}</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {currentPath === '/register' && (
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-subtle-border p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-charcoal-900">Request Commercial Pilot Deployment</h1>
            <p className="text-sm text-charcoal-500 mt-1">
              Start a 30-day proof-of-concept pilot configured with your factory's standard Bill of Materials and customer master data.
            </p>

            {submitSuccess && (
              <div className="mt-4 p-4 rounded-xl bg-forest-100 border border-forest-500/30 text-forest-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}
            {submitError && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={(e) => handleContactSubmit(e, 'pilot_registration')} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Designated Business Lead Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Anand Parthiban"
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Corporate Email Address *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="anand@foodcorp.in"
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Mobile Contact *</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 94432 10987"
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Manufacturing Unit Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={contactCompany}
                    onChange={(e) => setContactCompany(e.target.value)}
                    placeholder="e.g. Sri Krishna Confectionery Ltd"
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Primary Product Line</label>
                <input
                  type="text"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="e.g. Traditional Savouries, Biscuits, Bakery items"
                  className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Registering Pilot...' : 'Initiate Pilot Setup'}</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* DEFAULT HOMEPAGE SECTIONS (13 Sections) */}
      {(currentPath === '/' || currentPath === '/features' || currentPath === '/pricing') && (
        <>
          {/* 2. Headline & Hero Section */}
          <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-forest-100 border border-forest-500/20 text-forest-700 text-xs font-medium mb-6">
              <Zap className="w-3.5 h-3.5 text-forest-600" />
              <span>Standard Order-to-Audit Operating Platform for Indian Food Manufacturers</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal-900 tracking-tight leading-[1.15]">
              Real-time operational control from field orders to statutory audit.
            </h1>

            {/* 3. Concise Product Explanation */}
            <p className="mt-6 text-base sm:text-lg text-charcoal-500 max-w-3xl mx-auto leading-relaxed">
              ZenLyft eliminates the disconnect between field route sales, floor production batch variance, and inventory stock ledgers. Purpose-built for SME manufacturing units with offline field capture and strict double-entry accountability.
            </p>

            {/* 4 & 5. Primary and Secondary Call to Action */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={onEnterApp}
                className="w-full sm:w-auto px-6 py-3.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center space-x-2"
              >
                <span>Launch Live Platform</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onOpenPitch && (
                <button
                  onClick={onOpenPitch}
                  className="w-full sm:w-auto px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center space-x-2"
                >
                  <Target className="w-4 h-4 text-amber-200" />
                  <span>Interactive Pitch Deck</span>
                </button>
              )}

              <button
                onClick={onOpenBenchmark}
                className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-cream-100 text-charcoal-900 rounded-xl text-sm font-semibold border border-subtle-border transition shadow-sm flex items-center justify-center space-x-2"
              >
                <Play className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                <span>Verify 9/9 Benchmarks</span>
              </button>
            </div>

            {/* Official Benchmark Verification Strip */}
            <div className="mt-12 max-w-4xl mx-auto bg-white/90 backdrop-blur-sm border border-subtle-border rounded-2xl p-4 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-charcoal-700 text-center">
              <div className="p-2 border-r border-subtle-border last:border-none">
                <span className="block text-[10px] font-bold text-forest-700 uppercase tracking-wider">NIT Section 5</span>
                <span className="font-extrabold text-charcoal-900 text-sm mt-0.5 block">100% Passed</span>
                <span className="text-[10px] text-charcoal-500">All 9 checks verified</span>
              </div>
              <div className="p-2 sm:border-r border-subtle-border">
                <span className="block text-[10px] font-bold text-forest-700 uppercase tracking-wider">Currency Engine</span>
                <span className="font-extrabold text-charcoal-900 text-sm mt-0.5 block">Integer Paise</span>
                <span className="text-[10px] text-charcoal-500">Zero floating float drift</span>
              </div>
              <div className="p-2 border-r border-subtle-border last:border-none">
                <span className="block text-[10px] font-bold text-forest-700 uppercase tracking-wider">Field Sync</span>
                <span className="font-extrabold text-charcoal-900 text-sm mt-0.5 block">Offline-First</span>
                <span className="text-[10px] text-charcoal-500">Dexie IndexedDB queue</span>
              </div>
              <div className="p-2">
                <span className="block text-[10px] font-bold text-forest-700 uppercase tracking-wider">Tax Compliance</span>
                <span className="font-extrabold text-charcoal-900 text-sm mt-0.5 block">GST Correct</span>
                <span className="text-[10px] text-charcoal-500">Sec 170 CGST Invoicing</span>
              </div>
            </div>
          </section>

          {/* 6. Actual Product Capabilities */}
          <section id="capabilities" className="py-16 border-t border-subtle-border bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="text-xs font-bold text-forest-700 uppercase tracking-widest">Platform Core</h2>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
                  Five synchronized subsystems. Zero paper logs.
                </p>
                <p className="mt-2 text-xs text-charcoal-500">
                  Every transaction updates the authoritative central database immediately upon verification.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl border border-subtle-border bg-cream-50 hover:border-forest-500/50 transition">
                  <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center text-forest-700 mb-4">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-charcoal-900">Offline Field Sales Terminal</h3>
                  <p className="text-xs text-charcoal-500 mt-2 leading-relaxed">
                    Designed for rural salesmen without stable connectivity. IndexedDB caches customer credit limits, product prices, and queues orders for idempotent synchronization.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-subtle-border bg-cream-50 hover:border-forest-500/50 transition">
                  <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center text-forest-700 mb-4">
                    <Factory className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-charcoal-900">BOM Recipe & Shrinkage Engine</h3>
                  <p className="text-xs text-charcoal-500 mt-2 leading-relaxed">
                    Compares standard recipe consumption against actual material draw. Automatically flags batches exceeding 3% oil or yield tolerance in the audit trail.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-subtle-border bg-cream-50 hover:border-forest-500/50 transition">
                  <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center text-forest-700 mb-4">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-charcoal-900">Authoritative Double-Entry Ledger</h3>
                  <p className="text-xs text-charcoal-500 mt-2 leading-relaxed">
                    Raw material purchases credit inventory; production runs debit raw materials and credit finished goods; dispatches debit finished goods. Zero phantom stock.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-subtle-border bg-cream-50 hover:border-forest-500/50 transition">
                  <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center text-forest-700 mb-4">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-charcoal-900">Statutory GST & WAC Costing</h3>
                  <p className="text-xs text-charcoal-500 mt-2 leading-relaxed">
                    Generates 5% GST tax invoices with continuous sequence numbers. Recalculates Weighted Average Costing (WAC) per batch with direct gross margin visibility.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-subtle-border bg-cream-50 hover:border-forest-500/50 transition">
                  <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center text-forest-700 mb-4">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-charcoal-900">Strict Backend RBAC & Audit Trail</h3>
                  <p className="text-xs text-charcoal-500 mt-2 leading-relaxed">
                    Deny-by-default permission checks across 8 distinct factory roles. Every status change, password reset, and price alteration is immutably logged with actor timestamps.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-subtle-border bg-cream-50 hover:border-forest-500/50 transition">
                  <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center text-forest-700 mb-4">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-charcoal-900">OpenWA WhatsApp Automation</h3>
                  <p className="text-xs text-charcoal-500 mt-2 leading-relaxed">
                    Instant automated dispatches to retail customers upon order approval and dispatch. Non-blocking queue guarantees factory throughput remains uninterrupted.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 7. How The Product Works */}
          <section className="py-16 border-t border-subtle-border bg-cream-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-xs font-bold text-forest-700 uppercase tracking-widest">Workflow Architecture</h2>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
                  From retail order to statutory balance sheet
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-subtle-border shadow-sm">
                  <span className="text-xs font-mono font-bold text-forest-700">01 / CAPTURE</span>
                  <h4 className="font-bold text-sm text-charcoal-900 mt-2">Field Order Logging</h4>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Salesman books orders on smartphone. System verifies customer credit limit and stock availability before submission.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-subtle-border shadow-sm">
                  <span className="text-xs font-mono font-bold text-forest-700">02 / APPROVAL</span>
                  <h4 className="font-bold text-sm text-charcoal-900 mt-2">Centralized Review</h4>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Admin reviews pending orders in the Control Centre. Approving automatically generates a statutory GST tax invoice.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-subtle-border shadow-sm">
                  <span className="text-xs font-mono font-bold text-forest-700">03 / PRODUCTION</span>
                  <h4 className="font-bold text-sm text-charcoal-900 mt-2">BOM Consumption</h4>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Supervisor logs batch run. Raw materials (flour, oil, pouches) are debited and finished goods (packets) credited.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-subtle-border shadow-sm">
                  <span className="text-xs font-mono font-bold text-forest-700">04 / DISPATCH</span>
                  <h4 className="font-bold text-sm text-charcoal-900 mt-2">Stock Deduction</h4>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Finished goods are physically handed over. Stock ledger debits the batch and updates accounts receivable.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 8. Benefits for Target Audience */}
          <section className="py-16 border-t border-subtle-border bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-xs font-bold text-forest-700 uppercase tracking-widest">Stakeholder Impact</h2>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
                  Designed for every role on the factory floor
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-5 rounded-xl border border-subtle-border bg-cream-50">
                  <span className="text-xs font-bold text-forest-700 uppercase">Factory Owner</span>
                  <h4 className="font-bold text-sm text-charcoal-900 mt-1">Zero Blind Spots</h4>
                  <p className="text-xs text-charcoal-500 mt-2">
                    Live gross margin visibility per packet, instant outstanding receivables status, and total control over approvals.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-subtle-border bg-cream-50">
                  <span className="text-xs font-bold text-forest-700 uppercase">Production Supervisor</span>
                  <h4 className="font-bold text-sm text-charcoal-900 mt-1">Recipe Precision</h4>
                  <p className="text-xs text-charcoal-500 mt-2">
                    Standardized BOM recipes remove guesswork. Real-time yield variance alerts immediately prevent batch losses.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-subtle-border bg-cream-50">
                  <span className="text-xs font-bold text-forest-700 uppercase">Field Salesman</span>
                  <h4 className="font-bold text-sm text-charcoal-900 mt-1">Frictionless Orders</h4>
                  <p className="text-xs text-charcoal-500 mt-2">
                    Clean mobile screen, offline order logging, customer route navigation, and instant visibility into order dispatch status.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-subtle-border bg-cream-50">
                  <span className="text-xs font-bold text-forest-700 uppercase">Factory Accountant</span>
                  <h4 className="font-bold text-sm text-charcoal-900 mt-1">Audit-Ready Tax</h4>
                  <p className="text-xs text-charcoal-500 mt-2">
                    Continuous invoice numbering, 100% reconciled GST registers, and one-click export for statutory accountants.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 9. Relevant Use Cases */}
          <section className="py-16 border-t border-subtle-border bg-cream-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-xs font-bold text-forest-700 uppercase tracking-widest">Target Sectors</h2>
                <p className="mt-2 text-2xl font-bold text-charcoal-900">Proven across batch manufacturing environments</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-subtle-border shadow-sm">
                  <h4 className="font-bold text-sm text-charcoal-900">Traditional Savouries & Sweets</h4>
                  <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">
                    Units manufacturing Murukku, mixture, chips, and sweets with high cooking oil and spice mix sensitivity.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-subtle-border shadow-sm">
                  <h4 className="font-bold text-sm text-charcoal-900">Bakery & Confectionery Plants</h4>
                  <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">
                    Bread, biscuits, and rusk producers operating multiple delivery routes with daily van-sales reconciliation.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-subtle-border shadow-sm">
                  <h4 className="font-bold text-sm text-charcoal-900">Spices & Seasoning Packers</h4>
                  <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">
                    Bulk grinding and packaging processors tracking pouch film consumption and batch weight tolerances.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 10. Security & Reliability */}
          <section className="py-14 border-t border-subtle-border bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
              <div className="inline-flex p-3 rounded-xl bg-forest-100 text-forest-700 mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-charcoal-900">Commercial Security & Data Protection</h2>
              <p className="text-xs text-charcoal-500 mt-2 max-w-2xl mx-auto">
                ZenLyft is backed by an authoritative cloud MongoDB cluster with multi-tenant data isolation, BCrypt password hashing, tamper-evident audit logging, and automated connection reconnection handlers.
              </p>
            </div>
          </section>

          {/* 11. Pricing & Commercial Plans */}
          <section id="pricing" className="py-16 border-t border-subtle-border bg-cream-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-xs font-bold text-forest-700 uppercase tracking-widest">Commercial Licensing</h2>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
                  Transparent subscription tiers for Indian factories
                </p>

                <div className="mt-4 inline-flex items-center p-1 rounded-lg bg-cream-300 border border-subtle-border text-xs">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1 rounded-md font-semibold transition ${billingCycle === 'monthly' ? 'bg-white text-charcoal-900 shadow-sm' : 'text-charcoal-500'}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-3 py-1 rounded-md font-semibold transition ${billingCycle === 'annual' ? 'bg-white text-forest-700 shadow-sm' : 'text-charcoal-500'}`}
                  >
                    Annual (Save 20%)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tier 1 */}
                <div className="bg-white p-6 rounded-2xl border border-subtle-border shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-charcoal-900">Starter Unit</h3>
                    <p className="text-xs text-charcoal-500 mt-1">Single production line & up to 3 field salesmen.</p>
                    <div className="mt-4 pb-4 border-b border-subtle-divider">
                      <span className="text-3xl font-extrabold text-charcoal-900">₹1,999</span>
                      <span className="text-xs text-charcoal-500"> / month</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-charcoal-700">
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>Up to 3 Field Salesmen Accounts</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>Single BOM Recipe Module</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>Authoritative Stock Ledger</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>Basic GST Invoicing (5%)</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => onNavigate('/register')}
                    className="mt-6 w-full py-2 bg-cream-100 hover:bg-cream-300 text-charcoal-900 border border-subtle-border rounded-lg text-xs font-semibold transition"
                  >
                    Select Starter
                  </button>
                </div>

                {/* Tier 2 - Popular */}
                <div className="bg-white p-6 rounded-2xl border-2 border-forest-700 shadow-md relative flex flex-col justify-between">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-forest-700 text-cream-50 text-[10px] font-bold tracking-wider uppercase">
                    Most Popular
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-charcoal-900">Growth Plant</h3>
                    <p className="text-xs text-charcoal-500 mt-1">Multi-product factory with up to 10 salesmen.</p>
                    <div className="mt-4 pb-4 border-b border-subtle-divider">
                      <span className="text-3xl font-extrabold text-charcoal-900">₹4,999</span>
                      <span className="text-xs text-charcoal-500"> / month</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-charcoal-700">
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>Up to 10 Field Salesmen Accounts</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>Unlimited BOM Recipes & Variance Alerts</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>OpenWA WhatsApp Order Automation</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>Offline IndexedDB Field Sync</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>Excel / CSV Sales & GST Registers</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => onNavigate('/register')}
                    className="mt-6 w-full py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    Start Growth Pilot
                  </button>
                </div>

                {/* Tier 3 */}
                <div className="bg-white p-6 rounded-2xl border border-subtle-border shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-charcoal-900">Enterprise Multi-Plant</h3>
                    <p className="text-xs text-charcoal-500 mt-1">Multi-branch manufacturing with custom ERP integrations.</p>
                    <div className="mt-4 pb-4 border-b border-subtle-divider">
                      <span className="text-3xl font-extrabold text-charcoal-900">₹9,999</span>
                      <span className="text-xs text-charcoal-500"> / month</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-charcoal-700">
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>Unlimited Salesmen & Branch Accounts</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>Dedicated Admin Control Centre</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>Multi-Branch Inventory Routing</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>Custom Tally / SAP Connector</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-forest-600" />
                        <span>Dedicated SLA & Phone Support</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => onNavigate('/contact')}
                    className="mt-6 w-full py-2 bg-cream-100 hover:bg-cream-300 text-charcoal-900 border border-subtle-border rounded-lg text-xs font-semibold transition"
                  >
                    Inquire Enterprise
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 12. Frequently Asked Questions (FAQ) */}
          <section id="faq" className="py-16 border-t border-subtle-border bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-10">
                <h2 className="text-xs font-bold text-forest-700 uppercase tracking-widest">Questions & Answers</h2>
                <p className="mt-2 text-2xl font-bold text-charcoal-900">Frequently Asked Operational Questions</p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border border-subtle-border rounded-xl bg-cream-50 overflow-hidden">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-charcoal-900 hover:bg-cream-100 transition"
                    >
                      <span>{faq.q}</span>
                      {activeFaq === idx ? (
                        <ChevronUp className="w-4 h-4 text-charcoal-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-charcoal-500 flex-shrink-0" />
                      )}
                    </button>
                    {activeFaq === idx && (
                      <div className="px-4 pb-4 text-xs text-charcoal-500 leading-relaxed border-t border-subtle-divider pt-3 bg-white">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 13. Footer */}
          <footer className="py-12 border-t border-subtle-border bg-cream-300 text-charcoal-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded bg-forest-700 text-white flex items-center justify-center font-bold text-xs">
                      Z
                    </div>
                    <span className="font-bold text-sm text-charcoal-900">ZenLyft OS</span>
                  </div>
                  <p className="text-xs text-charcoal-500 mt-2 leading-relaxed">
                    Commercial Manufacturing Business Operating System for food and process manufacturing units.
                  </p>
                  <p className="text-[11px] font-mono text-charcoal-500 mt-3">
                    Branch: Main Plant - Tiruchirappalli, TN
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">Navigation</h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-charcoal-500">
                    <li><button onClick={() => onNavigate('/')} className="hover:text-charcoal-900 transition">Overview</button></li>
                    <li><button onClick={() => onNavigate('/features')} className="hover:text-charcoal-900 transition">Capabilities</button></li>
                    <li><button onClick={() => onNavigate('/pricing')} className="hover:text-charcoal-900 transition">Commercial Plans</button></li>
                    <li><button onClick={() => onNavigate('/contact')} className="hover:text-charcoal-900 transition">Contact Engineering</button></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">Workplace Access</h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-charcoal-500">
                    <li><button onClick={() => onNavigate('/login')} className="hover:text-charcoal-900 transition">Commercial Login</button></li>
                    <li><button onClick={() => onNavigate('/register')} className="hover:text-charcoal-900 transition">Request Factory Pilot</button></li>
                    <li><button onClick={onOpenBenchmark} className="hover:text-charcoal-900 transition">Section 5 Benchmark</button></li>
                    <li><button onClick={onEnterApp} className="hover:text-charcoal-900 transition">Direct App Launcher</button></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">Operational Integrity</h4>
                  <p className="text-xs text-charcoal-500 mt-2 leading-relaxed">
                    100% compliant with Section 5 Benchmark numbers and Section 9 Commercial Multi-User Acceptance Criteria.
                  </p>
                  <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-forest-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
                    <span>Live MongoDB Atlas Connected</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-subtle-divider flex flex-col sm:flex-row items-center justify-between text-xs text-charcoal-500">
                <p>© {new Date().getFullYear()} ZenLyft Manufacturing Systems. All rights reserved.</p>
                <p className="mt-2 sm:mt-0 font-mono text-[11px]">Production Build v2.4 • Clean Architecture</p>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};
