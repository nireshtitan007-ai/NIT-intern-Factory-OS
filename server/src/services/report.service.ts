import { Invoice, Payment, Purchase, ProductionRun, Customer, Product, RawMaterial } from '../models';
import { StockLedgerService } from './stockLedger.service';

export class ReportService {
  /**
   * Sales Register with customer, invoice, taxable, tax breakdown, and status
   */
  static async getSalesRegister(startDate?: Date, endDate?: Date, tenantId?: string) {
    const query: any = {};
    if (tenantId) query.tenantId = tenantId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 }).lean();
    return invoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      date: inv.createdAt,
      customerName: inv.customerName,
      placeOfSupply: inv.placeOfSupply,
      isInterState: inv.isInterState,
      taxableValue: inv.taxableValue,
      cgstTotal: inv.cgstTotal,
      sgstTotal: inv.sgstTotal,
      igstTotal: inv.igstTotal,
      grandTotal: inv.grandTotal,
      paidAmount: inv.paidAmount,
      balanceDue: inv.balanceDue,
      paymentStatus: inv.paymentStatus,
      isDispatched: inv.isDispatched
    }));
  }

  /**
   * GST Summary of Outward Supplies (mapped to GSTR-1 & GSTR-3B)
   */
  static async getGSTSummary(startDate?: Date, endDate?: Date, tenantId?: string) {
    const query: any = {};
    if (tenantId) query.tenantId = tenantId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const invoices = await Invoice.find(query).lean();

    let intraStateTaxable = 0;
    let intraStateCGST = 0;
    let intraStateSGST = 0;
    let interStateTaxable = 0;
    let interStateIGST = 0;

    for (const inv of invoices) {
      if (inv.isInterState) {
        interStateTaxable += inv.taxableValue;
        interStateIGST += inv.igstTotal;
      } else {
        intraStateTaxable += inv.taxableValue;
        intraStateCGST += inv.cgstTotal;
        intraStateSGST += inv.sgstTotal;
      }
    }

    const totalTaxable = intraStateTaxable + interStateTaxable;
    const totalTax = intraStateCGST + intraStateSGST + interStateIGST;
    const totalOutwardValue = totalTaxable + totalTax;

    return {
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      b2bCount: invoices.length,
      intraState: {
        taxableValue: Math.round(intraStateTaxable * 100) / 100,
        cgst: Math.round(intraStateCGST * 100) / 100,
        sgst: Math.round(intraStateSGST * 100) / 100,
        totalTax: Math.round((intraStateCGST + intraStateSGST) * 100) / 100
      },
      interState: {
        taxableValue: Math.round(interStateTaxable * 100) / 100,
        igst: Math.round(interStateIGST * 100) / 100,
        totalTax: Math.round(interStateIGST * 100) / 100
      },
      grandTotals: {
        totalTaxable: Math.round(totalTaxable * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        totalOutwardValue: Math.round(totalOutwardValue * 100) / 100
      }
    };
  }

  /**
   * Purchase Register
   */
  static async getPurchaseRegister(startDate?: Date, endDate?: Date, tenantId?: string) {
    const query: any = {};
    if (tenantId) query.tenantId = tenantId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    return Purchase.find(query).sort({ date: -1 }).lean();
  }

  /**
   * Production Variance Report
   */
  static async getProductionReport(startDate?: Date, endDate?: Date, tenantId?: string) {
    const query: any = {};
    if (tenantId) query.tenantId = tenantId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    return ProductionRun.find(query).sort({ createdAt: -1 }).lean();
  }

  /**
   * Customer Outstanding & Receivables Aging
   */
  static async getOutstandingReceivables(tenantId?: string) {
    const custFilter = tenantId ? { tenantId } : {};
    const invFilter: any = { balanceDue: { $gt: 0 } };
    if (tenantId) invFilter.tenantId = tenantId;

    const customers = await Customer.find(custFilter).lean();
    const unpaidInvoices = await Invoice.find(invFilter).lean();

    const now = new Date();
    const customerMap: Record<string, {
      customerName: string;
      code: string;
      state: string;
      phone: string;
      creditLimit: number;
      totalOutstanding: number;
      aging: {
        current: number; // 0-30 days
        days31to60: number;
        days61to90: number;
        over90days: number;
      };
      invoices: any[];
    }> = {};

    for (const c of customers) {
      customerMap[c._id.toString()] = {
        customerName: c.name,
        code: c.code,
        state: c.state,
        phone: c.phone,
        creditLimit: c.creditLimit,
        totalOutstanding: 0,
        aging: { current: 0, days31to60: 0, days61to90: 0, over90days: 0 },
        invoices: []
      };
    }

    for (const inv of unpaidInvoices) {
      const cId = inv.customerId.toString();
      if (!customerMap[cId]) continue;

      const diffDays = Math.floor((now.getTime() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      customerMap[cId].totalOutstanding += inv.balanceDue;
      customerMap[cId].invoices.push({
        invoiceNumber: inv.invoiceNumber,
        grandTotal: inv.grandTotal,
        paidAmount: inv.paidAmount,
        balanceDue: inv.balanceDue,
        createdAt: inv.createdAt,
        daysOld: diffDays
      });

      if (diffDays <= 30) customerMap[cId].aging.current += inv.balanceDue;
      else if (diffDays <= 60) customerMap[cId].aging.days31to60 += inv.balanceDue;
      else if (diffDays <= 90) customerMap[cId].aging.days61to90 += inv.balanceDue;
      else customerMap[cId].aging.over90days += inv.balanceDue;
    }

    return Object.values(customerMap).filter(c => c.totalOutstanding > 0);
  }
}
