import crypto from 'crypto';
import { Invoice, IInvoice, Settings, Customer, AuditLog } from '../models';

export interface EInvoicePayload {
  Version: string;
  _mock: boolean;
  TranDtls: {
    TaxSch: string;
    SupTyp: string;
    RegRev: string;
    EcmGstin: string | null;
    IgstOnIntra: string;
  };
  DocDtls: {
    Typ: string;
    No: string;
    Dt: string;
  };
  SellerDtls: {
    Gstin: string;
    LglNm: string;
    TrdNm: string;
    Addr1: string;
    Loc: string;
    Pin: number;
    Stcd: string;
  };
  BuyerDtls: {
    Gstin: string;
    LglNm: string;
    Pos: string;
    Addr1: string;
    Loc: string;
    Pin: number;
    Stcd: string;
  };
  ItemList: Array<{
    ItemNo: string;
    PrdDesc: string;
    IsServc: string;
    HsnCd: string;
    Qty: number;
    Unit: string;
    UnitPrice: number;
    TotAmt: number;
    Discount: number;
    PreTaxVal: number;
    AssAmt: number;
    GstRt: number;
    CgstAmt: number;
    SgstAmt: number;
    IgstAmt: number;
    TotItemVal: number;
  }>;
  ValDtls: {
    AssVal: number;
    CgstVal: number;
    SgstVal: number;
    IgstVal: number;
    CesVal: number;
    StCesVal: number;
    Discount: number;
    OthChrg: number;
    RndOffAmt: number;
    TotInvVal: number;
  };
}

export class EInvoiceService {
  /**
   * Builds an offline mock NIC e-Invoice Schema v1.1 compliant JSON payload.
   */
  static async buildEInvoicePayload(invoiceId: string): Promise<EInvoicePayload> {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const tenantId = invoice.tenantId || process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT';
    const settings = await Settings.getSettings(tenantId);
    const customer = await Customer.findById(invoice.customerId);

    const d = new Date(invoice.createdAt || Date.now());
    const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    const ItemList = invoice.items.map((item, idx) => {
      const unitPrice = Number((item.unitPricePaise ? item.unitPricePaise / 100 : item.unitPrice).toFixed(2));
      const taxableAmount = Number((item.taxableAmountPaise ? item.taxableAmountPaise / 100 : item.taxableAmount).toFixed(2));
      const cgstAmount = Number((item.cgstAmountPaise ? item.cgstAmountPaise / 100 : item.cgstAmount).toFixed(2));
      const sgstAmount = Number((item.sgstAmountPaise ? item.sgstAmountPaise / 100 : item.sgstAmount).toFixed(2));
      const igstAmount = Number((item.igstAmountPaise ? item.igstAmountPaise / 100 : item.igstAmount).toFixed(2));
      const totalAmount = Number((item.totalAmountPaise ? item.totalAmountPaise / 100 : item.totalAmount).toFixed(2));
      const gstRate = item.igstRate || (item.cgstRate + item.sgstRate);

      return {
        ItemNo: (idx + 1).toString(),
        PrdDesc: item.productName,
        IsServc: 'N',
        HsnCd: item.hsnCode || '19059040',
        Qty: item.quantity,
        Unit: 'BOX',
        UnitPrice: unitPrice,
        TotAmt: taxableAmount,
        Discount: 0,
        PreTaxVal: taxableAmount,
        AssAmt: taxableAmount,
        GstRt: gstRate,
        CgstAmt: cgstAmount,
        SgstAmt: sgstAmount,
        IgstAmt: igstAmount,
        TotItemVal: totalAmount
      };
    });

    const assVal = Number((invoice.taxableValuePaise ? invoice.taxableValuePaise / 100 : invoice.taxableValue).toFixed(2));
    const cgstVal = Number((invoice.cgstTotalPaise ? invoice.cgstTotalPaise / 100 : invoice.cgstTotal).toFixed(2));
    const sgstVal = Number((invoice.sgstTotalPaise ? invoice.sgstTotalPaise / 100 : invoice.sgstTotal).toFixed(2));
    const igstVal = Number((invoice.igstTotalPaise ? invoice.igstTotalPaise / 100 : invoice.igstTotal).toFixed(2));
    const totInvVal = Number((invoice.grandTotalPaise ? invoice.grandTotalPaise / 100 : invoice.grandTotal).toFixed(2));

    const itemSum = Number(ItemList.reduce((sum, item) => sum + item.TotItemVal, 0).toFixed(2));
    const rndOffAmt = Number((totInvVal - (assVal + cgstVal + sgstVal + igstVal)).toFixed(2));

    // Strict validation: TotInvVal must equal sum of item values plus round-off
    if (Math.abs(totInvVal - (itemSum + rndOffAmt)) > 0.05) {
      throw new Error(`ValDtls.TotInvVal arithmetic mismatch: TotInvVal (${totInvVal}) !== itemSum (${itemSum}) + rndOffAmt (${rndOffAmt})`);
    }

    return {
      Version: '1.1',
      _mock: true,
      TranDtls: {
        TaxSch: 'GST',
        SupTyp: 'B2B',
        RegRev: 'N',
        EcmGstin: null,
        IgstOnIntra: 'N'
      },
      DocDtls: {
        Typ: 'INV',
        No: invoice.invoiceNumber,
        Dt: formattedDate
      },
      SellerDtls: {
        Gstin: settings.gstin,
        LglNm: settings.legalName,
        TrdNm: settings.tradeName || settings.legalName,
        Addr1: settings.address,
        Loc: 'Tiruchirappalli',
        Pin: 620015,
        Stcd: settings.stateCode
      },
      BuyerDtls: {
        Gstin: customer?.gstin || invoice.customerGstin || 'URP',
        LglNm: customer?.name || invoice.customerName,
        Pos: invoice.customerStateCode,
        Addr1: customer?.address || 'Commercial Hub',
        Loc: customer?.city || 'Tiruchirappalli',
        Pin: 620001,
        Stcd: invoice.customerStateCode
      },
      ItemList,
      ValDtls: {
        AssVal: assVal,
        CgstVal: cgstVal,
        SgstVal: sgstVal,
        IgstVal: igstVal,
        CesVal: 0,
        StCesVal: 0,
        Discount: 0,
        OthChrg: 0,
        RndOffAmt: rndOffAmt,
        TotInvVal: totInvVal
      }
    };
  }

  /**
   * Generates a deterministic mock 64-char SHA-256 IRN and 15-digit Ack No for an invoice.
   */
  static async generateMockIRN(invoiceId: string, user?: { username?: string; role?: string }): Promise<IInvoice> {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    if (invoice.isCancelled) {
      throw new Error('Cannot generate IRN for cancelled invoice');
    }

    const tenantId = invoice.tenantId || process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT';
    const settings = await Settings.getSettings(tenantId);

    const d = new Date(invoice.createdAt || Date.now());
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const fy = month >= 4
      ? `${year}-${String((year + 1) % 100).padStart(2, '0')}`
      : `${year - 1}-${String(year % 100).padStart(2, '0')}`;

    const rawData = `${settings.gstin}|${fy}|INV|${invoice.invoiceNumber}`;
    const irn = crypto.createHash('sha256').update(rawData).digest('hex');

    // Deterministic 15-digit Ack Number derived from IRN hash
    const numericPart = BigInt('0x' + irn.substring(0, 12)).toString();
    const ackNo = `11${numericPart.padEnd(13, '0').substring(0, 13)}`;
    const ackDate = new Date();

    invoice.irn = irn;
    invoice.ackNo = ackNo;
    invoice.ackDate = ackDate;
    invoice.isMockEInvoice = true;
    await invoice.save();

    await AuditLog.create({
      tenantId: invoice.tenantId,
      action: 'EINVOICE_IRN_GENERATED',
      entityType: 'INVOICE',
      entityId: invoice._id.toString(),
      performedBy: user?.username || 'SYSTEM_MOCK_ENGINE',
      role: user?.role || 'admin',
      details: {
        irn,
        ackNo,
        ackDate,
        isMock: true,
        invoiceNumber: invoice.invoiceNumber
      }
    });

    return invoice;
  }
}
