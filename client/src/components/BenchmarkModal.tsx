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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">NIT Tiruchirappalli Acceptance Test</span>
            <h3 className="text-lg font-bold text-slate-900">Section 5 Benchmark Verification Result</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className={`p-4 rounded-lg mb-6 flex items-center space-x-3 ${
            result.allPassed ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {result.allPassed ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
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

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase">
                <tr>
                  <th className="p-3">Audit Metric</th>
                  <th className="p-3">Expected Result</th>
                  <th className="p-3">Actual Result</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.checks.map((check, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="p-3 font-medium text-slate-800">{check.metric}</td>
                    <td className="p-3 text-slate-600">{check.expected}</td>
                    <td className="p-3 font-semibold text-slate-900">{check.actual}</td>
                    <td className="p-3 text-center">
                      {check.pass ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          MATCH
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                          MISMATCH
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            Close Benchmark Report
          </button>
        </div>
      </div>
    </div>
  );
};

