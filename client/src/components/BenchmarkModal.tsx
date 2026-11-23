import React from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    allPassed: boolean;
    checks: Array<{
      metric: string;
      actual: string;
      expected: string;
      pass: boolean;
    }>;
  } | null;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({ isOpen, onClose, result }) => {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-subtle-border">
        <div className="p-5 border-b border-subtle-border flex items-center justify-between bg-cream-50 rounded-t-2xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Official Problem Statement Verification</span>
            <h3 className="text-base font-bold text-charcoal-900">Section 5 Benchmark Mathematical Verification</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-charcoal-500 hover:bg-cream-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className={`p-4 rounded-xl mb-6 flex items-center space-x-3 ${
            result.allPassed ? 'bg-forest-100 border border-forest-500/30 text-forest-700' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {result.allPassed ? (
              <CheckCircle2 className="w-6 h-6 text-forest-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            )}
            <div>
              <p className="font-bold text-sm">
                {result.allPassed 
                  ? 'All 9 Benchmark Criteria Passed with 100% Precision' 
                  : 'Benchmark Verification Identified Differences'}
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                Evaluated against the exact NIT Tiruchirappalli Section 5 master data and transaction sequence.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-subtle-border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 text-charcoal-500 font-semibold uppercase">
                <tr>
                  <th className="p-3">Audit Metric</th>
                  <th className="p-3">Expected Result</th>
                  <th className="p-3">Actual Result</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle-divider">
                {(result.checks || (result as any).checklist || []).map((check: any, idx: number) => (
                  <tr key={idx} className="hover:bg-cream-50">
                    <td className="p-3 font-semibold text-charcoal-900">{check.metric}</td>
                    <td className="p-3 text-charcoal-500">{check.expected}</td>
                    <td className="p-3 font-mono font-bold text-charcoal-900">{check.actual}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        check.pass ? 'bg-forest-100 text-forest-700' : 'bg-red-100 text-red-800'
                      }`}>
                        {check.pass ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-xl transition shadow-sm"
            >
              Close Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
