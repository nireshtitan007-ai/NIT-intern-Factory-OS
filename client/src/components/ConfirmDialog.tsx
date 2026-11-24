import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  requiresInput?: boolean;
  inputPlaceholder?: string;
  defaultValue?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<string | boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmDialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: '', message: '' });
  const [inputValue, setInputValue] = useState('');
  const resolverRef = useRef<((val: string | boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<string | boolean> => {
    setOptions(opts);
    setInputValue(opts.defaultValue || '');
    setIsOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      if (options.requiresInput) {
        resolverRef.current(inputValue.trim() || options.defaultValue || 'Confirmed');
      } else {
        resolverRef.current(true);
      }
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      if (options.requiresInput) {
        resolverRef.current('');
      } else {
        resolverRef.current(false);
      }
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-subtle-border shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-subtle-divider pb-3">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${options.danger ? 'bg-red-100 text-red-600' : 'bg-forest-100 text-forest-700'}`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-charcoal-900">{options.title}</h3>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-cream-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-charcoal-600 leading-relaxed">
              {options.message}
            </p>

            {options.requiresInput && (
              <div>
                <input
                  type="text"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={options.inputPlaceholder || 'Enter input...'}
                  className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-xl text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700 font-medium"
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-charcoal-700 hover:bg-cream-100 border border-subtle-border transition"
              >
                {options.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition flex items-center space-x-1.5 shadow-sm ${
                  options.danger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-forest-700 hover:bg-forest-800'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{options.confirmLabel || 'Confirm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextType => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context;
};
