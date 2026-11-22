import { 
  rupeesToPaise, 
  paiseToRupees, 
  formatPaise, 
  toPaise,
  fromPaise,
  formatINR,
  mulQtyRate,
  percentOf,
  computeWAC,
  calculateGSTPaise, 
  validatePaymentPaise 
} from '../src/utils/money';

describe('Money & GST Integer Paise Utility', () => {
  describe('Basic Conversions', () => {
    it('converts decimal rupees to integer paise accurately', () => {
      expect(rupeesToPaise(50)).toBe(5000);
      expect(toPaise(50)).toBe(5000);
      expect(rupeesToPaise(7500)).toBe(750000);
      expect(rupeesToPaise(187.5)).toBe(18750);
      expect(rupeesToPaise(7875)).toBe(787500);
      expect(rupeesToPaise(31.14)).toBe(3114);
      expect(toPaise('4000.00')).toBe(400000);
    });

    it('converts integer paise back to decimal rupees', () => {
      expect(paiseToRupees(5000)).toBe(50);
      expect(fromPaise(5000)).toBe(50);
      expect(paiseToRupees(750000)).toBe(7500);
      expect(paiseToRupees(18750)).toBe(187.5);
      expect(paiseToRupees(787500)).toBe(7875);
      expect(paiseToRupees(3114)).toBe(31.14);
    });

    it('formats paise into Indian currency string format', () => {
      expect(formatPaise(787500)).toBe('₹7,875.00');
      expect(formatINR(787500)).toBe('₹7,875.00');
      expect(formatPaise(387500)).toBe('₹3,875.00');
      expect(formatPaise(5000)).toBe('₹50.00');
    });

    it('rounds odd amounts with documented half-up rounding', () => {
      // 10.5 L @ ₹140 = 10.5 * 14000 paise = 147,000 paise (₹1,470.00)
      expect(mulQtyRate(10.5, 14000)).toBe(147000);
      // Half-up rounding on fractional paise
      expect(percentOf(33333, 2.5)).toBe(833); // 833.325 -> 833
      expect(percentOf(33350, 2.5)).toBe(834); // 833.75 -> 834
      expect(percentOf(33380, 2.5)).toBe(835); // 834.50 -> 835
    });

    it('calculates Weighted Average Cost (100×42 + 60×45)/160 without loss of precision', () => {
      // Prior: 100 kg @ ₹42 = 420,000 paise
      // New: 60 kg @ ₹45 = 270,000 paise
      // Total: 160 kg = 690,000 paise
      // Rate: 690,000 / 160 = 4,312.5 paise/kg = ₹43.125/kg
      const wac = computeWAC(100, 420000, 60, 4500);
      expect(wac.totalQty).toBe(160);
      expect(wac.totalValuePaise).toBe(690000);
      expect(wac.ratePaisePerUnit).toBe(4312.5);
      expect(wac.rateRupeesPerUnit).toBe(43.125);

      // Issuing 40 kg from this stock
      const issueCostPaise = mulQtyRate(40, wac.ratePaisePerUnit);
      expect(issueCostPaise).toBe(172500); // exactly ₹1,725.00
      expect(fromPaise(issueCostPaise)).toBe(1725);
    });

    it('guarantees that sum of line-level tax strictly equals invoice-level tax', () => {
      // Two line items on 5% intra-state GST
      // Line 1: 50 pkts @ ₹50 = 250,000 paise taxable
      const line1 = calculateGSTPaise(250000, 5, false);
      expect(line1.cgstPaise).toBe(6250);
      expect(line1.sgstPaise).toBe(6250);

      // Line 2: 100 pkts @ ₹50 = 500,000 paise taxable
      const line2 = calculateGSTPaise(500000, 5, false);
      expect(line2.cgstPaise).toBe(12500);
      expect(line2.sgstPaise).toBe(12500);

      // Total invoice level: 750,000 paise taxable
      const invoiceGST = calculateGSTPaise(750000, 5, false);
      expect(line1.cgstPaise + line2.cgstPaise).toBe(invoiceGST.cgstPaise);
      expect(line1.sgstPaise + line2.sgstPaise).toBe(invoiceGST.sgstPaise);
      expect(line1.grandTotalPaise + line2.grandTotalPaise).toBe(invoiceGST.grandTotalPaise);
    });
  });

  describe('NIT Benchmark Section 5 Numerical Precision', () => {
    it('calculates Section 5.3 Retailer A GST Invoice exactly', () => {
      // 150 packets @ ₹50 = ₹7,500 = 750,000 paise. 5% GST (Intra-state)
      const gst = calculateGSTPaise(750000, 5, false);

      expect(gst.taxablePaise).toBe(750000);
      expect(gst.cgstPaise).toBe(18750); // ₹187.50
      expect(gst.sgstPaise).toBe(18750); // ₹187.50
      expect(gst.igstPaise).toBe(0);
      expect(gst.totalTaxPaise).toBe(37500); // ₹375.00
      expect(gst.grandTotalPaise).toBe(787500); // ₹7,875.00

      expect(paiseToRupees(gst.taxablePaise)).toBe(7500);
      expect(paiseToRupees(gst.cgstPaise)).toBe(187.5);
      expect(paiseToRupees(gst.sgstPaise)).toBe(187.5);
      expect(paiseToRupees(gst.grandTotalPaise)).toBe(7875);
    });

    it('calculates Inter-State (IGST) correctly', () => {
      // 100 packets @ ₹50 = ₹5,000 = 500,000 paise. 5% IGST
      const gst = calculateGSTPaise(500000, 5, true);

      expect(gst.taxablePaise).toBe(500000);
      expect(gst.cgstPaise).toBe(0);
      expect(gst.sgstPaise).toBe(0);
      expect(gst.igstPaise).toBe(25000); // ₹250.00
      expect(gst.totalTaxPaise).toBe(25000);
      expect(gst.grandTotalPaise).toBe(525000); // ₹5,250.00
    });
  });

  describe('Property-Style Mathematical Invariants', () => {
    it('invariant 1: grandTotalPaise ALWAYS strictly equals taxablePaise + totalTaxPaise for 500 random amounts', () => {
      for (let i = 0; i < 500; i++) {
        const randomTaxable = Math.floor(Math.random() * 10000000) + 1; // 1 paise to ₹1,00,000
        const randomRate = [5, 12, 18, 28][Math.floor(Math.random() * 4)];
        const isInterState = Math.random() > 0.5;

        const gst = calculateGSTPaise(randomTaxable, randomRate, isInterState);

        // Invariant: taxable + total tax = grand total
        expect(gst.grandTotalPaise).toBe(gst.taxablePaise + gst.totalTaxPaise);

        if (isInterState) {
          expect(gst.totalTaxPaise).toBe(gst.igstPaise);
          expect(gst.cgstPaise).toBe(0);
          expect(gst.sgstPaise).toBe(0);
        } else {
          expect(gst.totalTaxPaise).toBe(gst.cgstPaise + gst.sgstPaise);
          expect(gst.igstPaise).toBe(0);
        }
      }
    });

    it('invariant 2: payments cannot exceed invoice balance due', () => {
      const balanceDue = 787500; // ₹7,875.00

      // Valid payment: ₹4,000
      const payment1 = validatePaymentPaise(balanceDue, 400000);
      expect(payment1.isValid).toBe(true);
      expect(payment1.newBalanceDuePaise).toBe(387500); // ₹3,875.00

      // Full balance payment: ₹3,875
      const payment2 = validatePaymentPaise(payment1.newBalanceDuePaise, 387500);
      expect(payment2.isValid).toBe(true);
      expect(payment2.newBalanceDuePaise).toBe(0);

      // Overpayment: attempting to pay ₹100 when balance is ₹0
      const paymentOver = validatePaymentPaise(0, 10000);
      expect(paymentOver.isValid).toBe(false);
      expect(paymentOver.error).toContain('cannot exceed balance due');

      // Zero or negative payment
      const paymentZero = validatePaymentPaise(387500, 0);
      expect(paymentZero.isValid).toBe(false);
      expect(paymentZero.error).toContain('greater than zero');
    });
  });
});
