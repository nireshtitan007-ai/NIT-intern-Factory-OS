import { IInvoice } from '../models/Invoice';
import { paiseToRupees } from './money';

function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatTallyDate(d: Date | string): string {
  const date = new Date(d);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export class TallyExportUtil {
  /**
   * Generates standard Tally XML format for Sales Vouchers
   * Compatible with Tally ERP 9 and Tally Prime XML import
   */
  static generateSalesVouchersXml(invoices: IInvoice[], companyName: string = 'ZenLyft Foods Manufacturing Pvt Ltd'): string {
    let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
    xml += '<ENVELOPE>\n';
    xml += '  <HEADER>\n';
    xml += '    <TALLYREQUEST>Import Data</TALLYREQUEST>\n';
    xml += '  </HEADER>\n';
    xml += '  <BODY>\n';
    xml += '    <DATA>\n';
    xml += '      <TALLYMESSAGE xmlns:UDF="TallyUDF">\n';

    for (const inv of invoices) {
      const invDate = formatTallyDate(inv.createdAt || new Date());
      const invNo = escapeXml(inv.invoiceNumber);
      const partyName = escapeXml(inv.customerName);
      const grandTotal = (paiseToRupees(inv.grandTotalPaise)).toFixed(2);
      const taxable = (paiseToRupees(inv.taxableValuePaise)).toFixed(2);
      const cgst = (paiseToRupees(inv.cgstTotalPaise)).toFixed(2);
      const sgst = (paiseToRupees(inv.sgstTotalPaise)).toFixed(2);
      const igst = (paiseToRupees(inv.igstTotalPaise)).toFixed(2);

      xml += '        <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">\n';
      xml += `          <DATE>${invDate}</DATE>\n`;
      xml += `          <GUID>ZENLYFT-${escapeXml(inv._id.toString())}</GUID>\n`;
      xml += `          <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>\n`;
      xml += `          <VOUCHERNUMBER>${invNo}</VOUCHERNUMBER>\n`;
      xml += `          <REFERENCE>${invNo}</REFERENCE>\n`;
      xml += `          <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>\n`;
      xml += `          <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>\n`;
      xml += `          <ISINVOICE>Yes</ISINVOICE>\n`;
      xml += `          <NARRATION>ZenLyft Manufacturing OS Sales Invoice ${invNo} - Customer: ${partyName}</NARRATION>\n`;

      // 1. Party Ledger Entry (Debit -> Negative in Tally)
      xml += '          <ALLLEDGERENTRIES.LIST>\n';
      xml += `            <LEDGERNAME>${partyName}</LEDGERNAME>\n`;
      xml += '            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n';
      xml += `            <AMOUNT>-${grandTotal}</AMOUNT>\n`;
      xml += '          </ALLLEDGERENTRIES.LIST>\n';

      // 2. Sales Ledger Entry (Credit -> Positive in Tally)
      xml += '          <ALLLEDGERENTRIES.LIST>\n';
      xml += '            <LEDGERNAME>Sales Account</LEDGERNAME>\n';
      xml += '            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n';
      xml += `            <AMOUNT>${taxable}</AMOUNT>\n`;
      xml += '          </ALLLEDGERENTRIES.LIST>\n';

      // 3. Tax Ledgers (Credit -> Positive in Tally)
      if (inv.isInterState) {
        if (inv.igstTotalPaise > 0) {
          xml += '          <ALLLEDGERENTRIES.LIST>\n';
          xml += '            <LEDGERNAME>Output IGST</LEDGERNAME>\n';
          xml += '            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n';
          xml += `            <AMOUNT>${igst}</AMOUNT>\n`;
          xml += '          </ALLLEDGERENTRIES.LIST>\n';
        }
      } else {
        if (inv.cgstTotalPaise > 0) {
          xml += '          <ALLLEDGERENTRIES.LIST>\n';
          xml += '            <LEDGERNAME>Output CGST</LEDGERNAME>\n';
          xml += '            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n';
          xml += `            <AMOUNT>${cgst}</AMOUNT>\n`;
          xml += '          </ALLLEDGERENTRIES.LIST>\n';
        }
        if (inv.sgstTotalPaise > 0) {
          xml += '          <ALLLEDGERENTRIES.LIST>\n';
          xml += '            <LEDGERNAME>Output SGST</LEDGERNAME>\n';
          xml += '            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n';
          xml += `            <AMOUNT>${sgst}</AMOUNT>\n`;
          xml += '          </ALLLEDGERENTRIES.LIST>\n';
        }
      }

      xml += '        </VOUCHER>\n';
    }

    xml += '      </TALLYMESSAGE>\n';
    xml += '    </DATA>\n';
    xml += '  </BODY>\n';
    xml += '</ENVELOPE>\n';

    return xml;
  }
}
