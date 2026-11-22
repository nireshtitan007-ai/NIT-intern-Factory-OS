/**
 * Indian Financial Year & Statutory Document Sequencing Helper
 *
 * In India, the statutory Financial Year runs from April 1 to March 31.
 * - April 1, 2026 to March 31, 2027 => "2026-27"
 * - April 1, 2027 to March 31, 2028 => "2027-28"
 */

export function getFinancialYear(dateInput: Date | string | number = new Date()): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date input for financial year calculation: ${dateInput}`);
  }

  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed: Jan=0, Feb=1, Mar=2, Apr=3 ... Dec=11

  let startYear: number;
  let endYearNumber: number;

  if (month >= 3) {
    // April (3) to December (11)
    startYear = year;
    endYearNumber = (year + 1) % 100;
  } else {
    // January (0) to March (2)
    startYear = year - 1;
    endYearNumber = year % 100;
  }

  const endYearStr = String(endYearNumber).padStart(2, '0');
  return `${startYear}-${endYearStr}`;
}

/**
 * Formats a sequential invoice number per statutory convention:
 * Example: INV/2026-27/0001
 */
export function formatInvoiceNumber(fy: string, sequence: number, padDigits: number = 4): string {
  return `INV/${fy}/${String(sequence).padStart(padDigits, '0')}`;
}

/**
 * Formats a statutory credit note number:
 * Example: CN/2026-27/0001
 */
export function formatCreditNoteNumber(fy: string, sequence: number, padDigits: number = 4): string {
  return `CN/${fy}/${String(sequence).padStart(padDigits, '0')}`;
}
