import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const normalizeErrorMessage = (err: any): string => {
  if (!err) return 'An unexpected error occurred.';
  const str = typeof err === 'string' ? err : err.message || err.error || JSON.stringify(err);
  
  if (str.includes('INSUFFICIENT_STOCK')) {
    return 'Insufficient stock in warehouse to fulfill this dispatch or order.';
  }
  if (str.includes('INVALID_CREDENTIALS')) {
    return 'Invalid username or password. Please verify your credentials.';
  }
  if (str.includes('UNAUTHORIZED') || str.includes('FORBIDDEN') || str.includes('403')) {
    return 'You do not have permission to perform this administrative action.';
  }
  if (str.includes('ECONNREFUSED') || str.includes('Failed to fetch')) {
    return 'Unable to reach the server. Please check your network connection.';
  }
  return str;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const normalizedMessage = message ? normalizeErrorMessage(message) : undefined;
    setToasts(prev => [...prev, { id, type, title, message: normalizedMessage, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast('error', title, message), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast('warning', title, message), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast Render Viewport */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl border p-4 shadow-lg flex items-start space-x-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
                isSuccess
                  ? 'bg-white border-emerald-300 text-charcoal-900'
                  : isError
                  ? 'bg-white border-red-300 text-charcoal-900'
                  : isWarning
                  ? 'bg-white border-amber-300 text-charcoal-900'
                  : 'bg-white border-forest-300 text-charcoal-900'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isSuccess
                    ? 'bg-emerald-100 text-emerald-700'
                    : isError
                    ? 'bg-red-100 text-red-700'
                    : isWarning
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-forest-100 text-forest-700'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                {isError && <AlertCircle className="w-4 h-4" />}
                {isWarning && <AlertTriangle className="w-4 h-4" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <h4 className="font-bold text-xs text-charcoal-900 leading-tight">{toast.title}</h4>
                {toast.message && (
                  <p className="text-xs text-charcoal-600 mt-0.5 leading-snug break-words">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-charcoal-400 hover:text-charcoal-700 transition p-0.5 rounded-lg flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
