/**
 * Enterprise Data Formatting Utilities for ZenLyft Manufacturing OS
 */

/**
 * Formats integer paise or decimal rupees into Indian currency format (e.g. ₹7,875.00)
 */
export function formatCurrencyPaise(paise: number, showDecimals = true): string {
  if (isNaN(paise) || paise === null || paise === undefined) return '₹0.00';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  }).format(rupees);
}

export function formatCurrencyRupees(rupees: number, showDecimals = true): string {
  if (isNaN(rupees) || rupees === null || rupees === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  }).format(rupees);
}

/**
 * Formats ISO date or Date object into human-readable Indian standard format (e.g. 24 Nov 2026)
 */
export function formatDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(d);
}

/**
 * Formats date and time (e.g. 24 Nov 2026, 03:45 PM)
 */
export function formatDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

/**
 * Copies text to user clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
