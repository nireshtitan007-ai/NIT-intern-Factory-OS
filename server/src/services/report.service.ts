import { Invoice, Payment, Purchase, ProductionRun, Customer, Product, RawMaterial, CreditNote, StockMovement } from '../models';
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
      customerCode: inv.customerCode,
      customerName: inv.customerName,
      customerGstin: inv.customerGstin || 'URP',
      placeOfSupply: inv.placeOfSupply,
      isInterState: inv.isInterState ? 'Inter-State' : 'Intra-State',
      taxableValue: inv.taxableValue,
      cgstTotal: inv.cgstTotal,
      sgstTotal: inv.sgstTotal,
      igstTotal: inv.igstTotal,
      grandTotal: inv.grandTotal,
      paidAmount: inv.paidAmount,
      balanceDue: inv.balanceDue,
      paymentStatus: inv.isCancelled ? 'CANCELLED' : inv.paymentStatus,
      isDispatched: inv.isDispatched ? 'YES' : 'NO'
    }));
  }

  /**
   * Customer-wise Sales Summary
   */
  static async getCustomerWiseSales(startDate?: Date, endDate?: Date, tenantId?: string) {
    const query: any = { isCancelled: { $ne: true } };
    if (tenantId) query.tenantId = tenantId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const invoices = await Invoice.find(query).lean();
    const map: Record<string, any> = {};

    for (const inv of invoices) {
      const code = inv.customerCode;
      if (!map[code]) {
        map[code] = {
          customerCode: code,
          customerName: inv.customerName,
          state: inv.customerState,
          gstin: inv.customerGstin || 'URP',
          invoicesCount: 0,
          totalQuantity: 0,
          totalTaxable: 0,
          totalTax: 0,
          grandTotal: 0
        };
      }
      map[code].invoicesCount += 1;
      map[code].totalTaxable += inv.taxableValue;
      map[code].totalTax += (inv.cgstTotal + inv.sgstTotal + inv.igstTotal);
      map[code].grandTotal += inv.grandTotal;
      for (const item of inv.items || []) {
        map[code].totalQuantity += (item.quantity || 0);
      }
    }

    return Object.values(map).map((c: any) => ({
      ...c,
      totalTaxable: Math.round(c.totalTaxable * 100) / 100,
      totalTax: Math.round(c.totalTax * 100) / 100,
      grandTotal: Math.round(c.grandTotal * 100) / 100
    }));
  }

  /**
   * Product-wise Sales Summary
   */
  static async getProductWiseSales(startDate?: Date, endDate?: Date, tenantId?: string) {
    const query: any = { isCancelled: { $ne: true } };
    if (tenantId) query.tenantId = tenantId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const invoices = await Invoice.find(query).lean();
    const map: Record<string, any> = {};

    for (const inv of invoices) {
      for (const item of inv.items || []) {
        const code = item.productCode;
        if (!map[code]) {
          map[code] = {
            productCode: code,
            productName: item.productName,
            hsnCode: item.hsnCode,
            totalPacketsSold: 0,
            totalTaxable: 0,
            totalTax: 0,
            grandTotal: 0
          };
        }
        const tax = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);
        map[code].totalPacketsSold += item.quantity;
        map[code].totalTaxable += item.taxableAmount;
        map[code].totalTax += tax;
        map[code].grandTotal += item.totalAmount;
      }
    }

    return Object.values(map).map((p: any) => ({
      ...p,
      avgPricePerPacket: p.totalPacketsSold > 0 ? Math.round((p.totalTaxable / p.totalPacketsSold) * 100) / 100 : 0,
      totalTaxable: Math.round(p.totalTaxable * 100) / 100,
      totalTax: Math.round(p.totalTax * 100) / 100,
      grandTotal: Math.round(p.grandTotal * 100) / 100
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

    const activeInvoiceQuery: any = { ...query, isCancelled: { $ne: true } };
    const invoices = await Invoice.find(activeInvoiceQuery).lean();
    const creditNotes = await CreditNote.find(query).lean();

    let intraStateTaxable = 0;
    let intraStateCGST = 0;
    let intraStateSGST = 0;
    let interStateTaxable = 0;
    let interStateIGST = 0;

    const b2bInvoices: any[] = [];
    const b2cInvoices: any[] = [];
    const hsnMap: Record<string, any> = {};

    for (const inv of invoices) {
      if (inv.isInterState) {
        interStateTaxable += inv.taxableValue;
        interStateIGST += inv.igstTotal;
      } else {
        intraStateTaxable += inv.taxableValue;
        intraStateCGST += inv.cgstTotal;
        intraStateSGST += inv.sgstTotal;
      }

      if (inv.customerGstin && inv.customerGstin !== 'URP') {
        b2bInvoices.push(inv);
      } else {
        b2cInvoices.push(inv);
      }

      for (const item of inv.items || []) {
        const hsn = item.hsnCode || '19059040';
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsnCode: hsn,
            description: item.productName,
            totalQuantity: 0,
            taxableValue: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            totalTax: 0
          };
        }
        hsnMap[hsn].totalQuantity += item.quantity;
        hsnMap[hsn].taxableValue += item.taxableAmount;
        hsnMap[hsn].cgstAmount += (item.cgstAmount || 0);
        hsnMap[hsn].sgstAmount += (item.sgstAmount || 0);
        hsnMap[hsn].igstAmount += (item.igstAmount || 0);
        hsnMap[hsn].totalTax += ((item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0));
      }
    }

    // Deduct Credit Notes from Outward Liability
    let creditNotesTaxable = 0;
    let creditNotesTax = 0;
    for (const cn of creditNotes) {
      creditNotesTaxable += (cn.taxableValue || 0);
      creditNotesTax += ((cn.cgstTotal || 0) + (cn.sgstTotal || 0) + (cn.igstTotal || 0));
    }

    const netTaxable = Math.max(0, intraStateTaxable + interStateTaxable - creditNotesTaxable);
    const netTax = Math.max(0, intraStateCGST + intraStateSGST + interStateIGST - creditNotesTax);
    const totalOutwardValue = netTaxable + netTax;

    return {
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      b2bCount: b2bInvoices.length,
      b2cCount: b2cInvoices.length,
      creditNotesCount: creditNotes.length,
      gstr1: {
        b2b: b2bInvoices.map(inv => ({
          gstin: inv.customerGstin,
          customerName: inv.customerName,
          invoiceNumber: inv.invoiceNumber,
          date: inv.createdAt,
          taxableValue: inv.taxableValue,
          taxAmount: inv.cgstTotal + inv.sgstTotal + inv.igstTotal,
          grandTotal: inv.grandTotal
        })),
        b2cSummary: {
          count: b2cInvoices.length,
          taxableValue: b2cInvoices.reduce((acc, i) => acc + i.taxableValue, 0),
          taxAmount: b2cInvoices.reduce((acc, i) => acc + (i.cgstTotal + i.sgstTotal + i.igstTotal), 0)
        },
        hsnSummary: Object.values(hsnMap).map((h: any) => ({
          ...h,
          taxableValue: Math.round(h.taxableValue * 100) / 100,
          cgstAmount: Math.round(h.cgstAmount * 100) / 100,
          sgstAmount: Math.round(h.sgstAmount * 100) / 100,
          igstAmount: Math.round(h.igstAmount * 100) / 100,
          totalTax: Math.round(h.totalTax * 100) / 100
        })),
        creditNotes: creditNotes.map(cn => ({
          creditNoteNumber: cn.creditNoteNumber,
          invoiceNumber: cn.invoiceNumber,
          customerName: cn.customerName,
          taxableValue: cn.taxableValue,
          taxAmount: (cn.cgstTotal || 0) + (cn.sgstTotal || 0) + (cn.igstTotal || 0),
          grandTotal: cn.grandTotal
        }))
      },
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
      gstr3b: {
        outwardTaxableSupplies: Math.round(netTaxable * 100) / 100,
        integratedTax: Math.round(interStateIGST * 100) / 100,
        centralTax: Math.round(intraStateCGST * 100) / 100,
        stateTax: Math.round(intraStateSGST * 100) / 100,
        totalTaxLiability: Math.round(netTax * 100) / 100
      },
      grandTotals: {
        totalTaxable: Math.round(netTaxable * 100) / 100,
        totalTax: Math.round(netTax * 100) / 100,
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

    const purchases = await Purchase.find(query).sort({ date: -1 }).lean();
    return purchases.map(p => ({
      purchaseNumber: p.purchaseNumber,
      date: p.date,
      supplierName: p.supplierName,
      itemsCount: (p.items || []).length,
      totalAmount: p.totalAmount,
      status: p.status
    }));
  }

  /**
   * Payments & Collections Register
   */
  static async getCollectionsReport(startDate?: Date, endDate?: Date, tenantId?: string) {
    const query: any = {};
    if (tenantId) query.tenantId = tenantId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const payments = await Payment.find(query).sort({ date: -1 }).lean();
    return payments.map(p => ({
      paymentNumber: p.paymentNumber,
      date: p.date,
      customerCode: p.customerCode,
      customerName: p.customerName,
      invoiceNumber: p.invoiceNumber,
      paymentMethod: p.paymentMethod || 'Bank Transfer',
      reference: p.reference || '',
      amount: p.amount
    }));
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

    const runs = await ProductionRun.find(query).sort({ createdAt: -1 }).lean();
    return runs.map(run => {
      const margin = 50 - (run.costPerPacket || 0); // standard Murukku selling price ₹50
      const marginPercent = Math.round((margin / 50) * 10000) / 100;
      return {
        runNumber: run.runNumber,
        date: run.createdAt,
        productCode: run.productCode,
        productName: run.productName,
        expectedOutput: run.batchExpectedOutput,
        actualOutput: run.actualOutputPackets,
        damagedPouches: run.damagedPouches || 0,
        yieldPercent: run.yieldPercent,
        yieldVariancePercent: run.yieldVariancePercent,
        yieldVarianceFlagged: run.yieldVarianceFlagged ? 'FLAGGED' : 'NORMAL',
        totalMaterialCost: run.totalMaterialCost,
        totalProductionCost: run.totalProductionCost,
        costPerPacket: run.costPerPacket,
        grossMarginPerPacket: Math.round(margin * 100) / 100,
        grossMarginPercent: marginPercent,
        supervisorName: run.supervisorName
      };
    });
  }

  /**
   * Customer Outstanding & Receivables Aging (0-30, 31-60, 61-90, 90+)
   */
  static async getOutstandingReceivables(tenantId?: string) {
    const custFilter = tenantId ? { tenantId } : {};
    const invFilter: any = { balanceDue: { $gt: 0 }, isCancelled: { $ne: true } };
    if (tenantId) invFilter.tenantId = tenantId;

    const customers = await Customer.find(custFilter).lean();
    const unpaidInvoices = await Invoice.find(invFilter).lean();

    const now = new Date();
    const customerMap: Record<string, any> = {};

    for (const c of customers) {
      customerMap[c._id.toString()] = {
        customerName: c.name,
        code: c.code,
        state: c.state,
        phone: c.phone,
        creditLimit: c.creditLimit,
        totalOutstanding: 0,
        current: 0,     // 0-30 days
        days31to60: 0,  // 31-60 days
        days61to90: 0,  // 61-90 days
        over90days: 0   // > 90 days
      };
    }

    for (const inv of unpaidInvoices) {
      const cId = inv.customerId.toString();
      if (!customerMap[cId]) continue;

      const diffDays = Math.floor((now.getTime() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      customerMap[cId].totalOutstanding += inv.balanceDue;

      if (diffDays <= 30) customerMap[cId].current += inv.balanceDue;
      else if (diffDays <= 60) customerMap[cId].days31to60 += inv.balanceDue;
      else if (diffDays <= 90) customerMap[cId].days61to90 += inv.balanceDue;
      else customerMap[cId].over90days += inv.balanceDue;
    }

    return Object.values(customerMap).map((c: any) => ({
      ...c,
      totalOutstanding: Math.round(c.totalOutstanding * 100) / 100,
      current: Math.round(c.current * 100) / 100,
      days31to60: Math.round(c.days31to60 * 100) / 100,
      days61to90: Math.round(c.days61to90 * 100) / 100,
      over90days: Math.round(c.over90days * 100) / 100
    }));
  }

  /**
   * Stock Ledger per item for a specific Date Range with Opening & Closing Balances
   */
  static async getStockLedgerRange(startDate?: Date, endDate?: Date, itemId?: string, tenantId?: string) {
    const tid = tenantId || process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT';
    const query: any = { tenantId: tid };
    if (itemId) query.itemId = itemId;

    const allMovements = await StockMovement.find(query).sort({ createdAt: 1 }).lean();

    let openingBalance = 0;
    const inRangeMovements: any[] = [];
    let closingBalance = 0;

    for (const m of allMovements) {
      const mDate = new Date(m.createdAt);
      if (startDate && mDate < startDate) {
        openingBalance += m.quantity;
      } else if (endDate && mDate > endDate) {
        // After range
      } else {
        inRangeMovements.push({
          date: m.createdAt,
          itemCode: m.itemCode,
          itemName: m.itemName,
          movementType: m.movementType,
          quantity: m.quantity,
          unit: m.unit,
          unitCost: m.unitCost || 0,
          totalCost: m.totalCost || 0,
          runningBalance: m.runningBalance,
          sourceDocType: m.sourceDocType,
          sourceDocId: m.sourceDocId,
          batchNumber: m.batchNumber || ''
        });
      }
    }

    closingBalance = openingBalance + inRangeMovements.reduce((acc, m) => acc + m.quantity, 0);

    return {
      period: { startDate: startDate || null, endDate: endDate || null },
      openingBalance: Math.round(openingBalance * 1000) / 1000,
      closingBalance: Math.round(closingBalance * 1000) / 1000,
      movementsCount: inRangeMovements.length,
      movements: inRangeMovements
    };
  }
}
