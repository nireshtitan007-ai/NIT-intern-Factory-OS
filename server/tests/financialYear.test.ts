import { getFinancialYear, formatInvoiceNumber, formatCreditNoteNumber } from '../src/utils/financialYear';

describe('Indian Financial Year (April–March) Boundary Tests', () => {
  it('correctly calculates FY for dates in mid-year', () => {
    // Exact requirement from NIT Trichy problem statement
    expect(getFinancialYear('2026-11-22')).toBe('2026-27');
    expect(getFinancialYear('2026-08-15')).toBe('2026-27');
  });

  it('correctly calculates FY on exact boundary dates', () => {
    // Requirement from problem statement: 2027-03-31 → "2026-27"
    expect(getFinancialYear('2027-03-31')).toBe('2026-27');
    expect(getFinancialYear(new Date(2027, 2, 31, 23, 59, 59))).toBe('2026-27');

    // Requirement from problem statement: 2027-04-01 → "2027-28"
    expect(getFinancialYear('2027-04-01')).toBe('2027-28');
    expect(getFinancialYear(new Date(2027, 3, 1, 0, 0, 0))).toBe('2027-28');
  });

  it('correctly calculates FY for leap years and previous years', () => {
    // Leap year Feb 29, 2028 (FY 2027-28)
    expect(getFinancialYear(new Date(2028, 1, 29))).toBe('2027-28');
    // April 1, 2028 (FY 2028-29)
    expect(getFinancialYear(new Date(2028, 3, 1))).toBe('2028-29');
    // January 1, 2025 (FY 2024-25)
    expect(getFinancialYear(new Date(2025, 0, 1))).toBe('2024-25');
  });

  it('formats invoice and credit note numbers properly', () => {
    const fy = getFinancialYear('2026-11-22');
    expect(formatInvoiceNumber(fy, 1)).toBe('INV/2026-27/0001');
    expect(formatInvoiceNumber(fy, 42)).toBe('INV/2026-27/0042');
    expect(formatCreditNoteNumber(fy, 1)).toBe('CN/2026-27/0001');
  });
});
