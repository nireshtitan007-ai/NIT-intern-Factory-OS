/**
 * ZenLyft Money & Currency Utility
 * 
 * Commercial Indian B2B SaaS Standard:
 * 1 Indian Rupee (INR) = 100 paise.
 * All monetary amounts in database, ledgers, and calculation engines MUST be
 * stored as non-negative integers representing paise to eliminate floating-point drift.
 * 
 * Statutory Indian GST Rule (Section 170 of CGST Act):
 * Tax amounts are rounded to the nearest integer paise (round half-up).
 * Grand total must strictly equal taxable value + calculated CGST + SGST (or IGST).
 */

export interface GSTBreakdownPaise {
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  grandTotalPaise: number;
  gstRatePercent: number;
  isInterState: boolean;
}

/**
 * Converts a decimal Rupee amount (e.g. 7500.50) into integer paise (750050).
 */
export function rupeesToPaise(rupees: number | string): number {
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer paise (e.g. 750050) into decimal Rupees (7500.50).
 */
export function paiseToRupees(paise: number): number {
  if (isNaN(paise)) return 0;
  return Math.round(paise) / 100;
}

/**
 * Formats integer paise into a standard Indian currency display string.
 * e.g. 787500 -> "₹7,875.00"
 */
export function formatPaise(paise: number): string {
  const rupees = paiseToRupees(paise);
  return '₹' + rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Calculates Indian GST breakdown strictly in integer paise.
 * 
 * Invariants guaranteed:
 * 1. cgstPaise + sgstPaise === totalTaxPaise (for intra-state)
 * 2. igstPaise === totalTaxPaise (for inter-state)
 * 3. taxablePaise + totalTaxPaise === grandTotalPaise (always)
 */
export function calculateGSTPaise(
  taxablePaise: number,
  gstRatePercent: number,
  isInterState: boolean
): GSTBreakdownPaise {
  const safeTaxable = Math.max(0, Math.round(taxablePaise));
  
  if (isInterState) {
    // Inter-State: 100% of tax goes to IGST
    const igstPaise = Math.round((safeTaxable * gstRatePercent) / 100);
    const totalTaxPaise = igstPaise;
    const grandTotalPaise = safeTaxable + totalTaxPaise;

    return {
      taxablePaise: safeTaxable,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise,
      totalTaxPaise,
      grandTotalPaise,
      gstRatePercent,
      isInterState: true
    };
  } else {
    // Intra-State: Split equally between CGST and SGST
    // halfRate = gstRatePercent / 2
    const cgstPaise = Math.round((safeTaxable * (gstRatePercent / 2)) / 100);
    const sgstPaise = Math.round((safeTaxable * (gstRatePercent / 2)) / 100);
    const totalTaxPaise = cgstPaise + sgstPaise;
    const grandTotalPaise = safeTaxable + totalTaxPaise;

    return {
      taxablePaise: safeTaxable,
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
      totalTaxPaise,
      grandTotalPaise,
      gstRatePercent,
      isInterState: false
    };
  }
}

/**
 * Invariant Validator: Verifies that payment does not exceed invoice balance due.
 */
export function validatePaymentPaise(balanceDuePaise: number, paymentAmountPaise: number): {
  isValid: boolean;
  newBalanceDuePaise: number;
  error?: string;
} {
  if (paymentAmountPaise <= 0) {
    return {
      isValid: false,
      newBalanceDuePaise: balanceDuePaise,
      error: 'Payment amount must be greater than zero.'
    };
  }

  if (paymentAmountPaise > balanceDuePaise) {
    return {
      isValid: false,
      newBalanceDuePaise: balanceDuePaise,
      error: `Payment amount (${formatPaise(paymentAmountPaise)}) cannot exceed balance due (${formatPaise(balanceDuePaise)}).`
    };
  }

  return {
    isValid: true,
    newBalanceDuePaise: balanceDuePaise - paymentAmountPaise
  };
}
