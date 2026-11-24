import React, { useState } from 'react';
import { AlertTriangle, X, RotateCcw } from 'lucide-react';

interface ResetDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
}

export const ResetDemoModal: React.FC<ResetDemoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmationInput.trim() === 'RESET';

  const handleReset = async () => {
    if (!isConfirmed || isProcessing) return;
    await onConfirm();
    setConfirmationInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-subtle-border shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-subtle-divider pb-3">
          <div className="flex items-center space-x-2 text-amber-700">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-charcoal-900">Reset Demo Master Data</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-cream-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-charcoal-600 leading-relaxed">
          This operation will clear all operational documents (orders, invoices, payments, production runs) and reseed the baseline Section 5 benchmark master data.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
          To proceed, type <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">RESET</span> below to confirm.
        </div>

        <div>
          <input
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder="Type RESET to confirm"
            className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-xl text-xs font-mono text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-3 py-2 rounded-xl text-xs font-medium text-charcoal-700 hover:bg-cream-100 border border-subtle-border transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!isConfirmed || isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Resetting...' : 'Reset Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
