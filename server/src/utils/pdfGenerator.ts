import PDFDocument from 'pdfkit';
import { IInvoice, Settings } from '../models';
import { numberToWordsINR } from './numberToWords';

export interface PDFGeneratorOptions {
  isCreditNote?: boolean;
  creditNoteNumber?: string;
  originalInvoiceNumber?: string;
  reason?: string;
}

export class PDFInvoiceGenerator {
  static async generateInvoicePDF(invoice: IInvoice, options?: PDFGeneratorOptions): Promise<Buffer> {
    const isCreditNote = !!options?.isCreditNote;
    const settings = await Settings.getSettings(invoice.tenantId || process.env.DEFAULT_TENANT_ID || 'DEFAULT_TENANT');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 36, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // 1. Header: Enterprise / Factory Legal Identity
      doc.fontSize(16).fillColor('#1e1b4b').text(settings.legalName.toUpperCase(), { align: 'center', bold: true } as any);
      if (settings.tradeName && settings.tradeName !== settings.legalName) {
        doc.fontSize(10).fillColor('#475569').text(`Trade Name: ${settings.tradeName}`, { align: 'center' });
      }
      doc.fontSize(9).fillColor('#475569').text(settings.address, { align: 'center' });
      doc.text(`GSTIN: ${settings.gstin} | State: ${settings.stateName} (Code: ${settings.stateCode})`, { align: 'center' });
      doc.moveDown(0.5);

      // 2. Title Bar
      const titleBgColor = isCreditNote ? '#991b1b' : '#1e3a8a';
      doc.rect(36, doc.y, 523, 22).fill(titleBgColor);
      doc.fillColor('#ffffff').fontSize(11).text(
        isCreditNote ? 'GST CREDIT NOTE (SECTION 34 CGST ACT)' : 'TAX INVOICE (GST COMPLIANT - SECTION 31 CGST ACT)',
        40,
        doc.y + 5,
        { align: 'center', bold: true } as any
      );
      doc.moveDown(1.2);

      // 3. Document & Customer Details Grid
      const currentY = doc.y;
      doc.fillColor('#0f172a').fontSize(9);

      // Left Column: Customer Details
      doc.text(`Billed To: ${invoice.customerName}`, 36, currentY, { bold: true } as any);
      doc.text(`Customer Code: ${invoice.customerCode}`);
      doc.text(`State: ${invoice.customerState} (${invoice.customerStateCode})`);
      if (invoice.customerGstin) doc.text(`GSTIN: ${invoice.customerGstin}`);
      doc.text(`Place of Supply: ${invoice.placeOfSupply || invoice.customerState}`);

      // Right Column: Invoice / Credit Note Details
      const rightColX = 330;
      if (isCreditNote) {
        doc.text(`Credit Note No: ${options?.creditNoteNumber || 'CN/PENDING'}`, rightColX, currentY, { bold: true } as any);
        doc.text(`Original Invoice No: ${options?.originalInvoiceNumber || invoice.invoiceNumber}`, rightColX);
        doc.text(`Reason: ${options?.reason || 'Sales Cancellation / Return'}`, rightColX);
      } else {
        doc.text(`Invoice No: ${invoice.invoiceNumber}`, rightColX, currentY, { bold: true } as any);
      }
      doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, rightColX);
      doc.text(`Supply Type: ${invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}`, rightColX);
      doc.text(`Payment Status: ${invoice.paymentStatus}`, rightColX);
      if (invoice.irn) {
        doc.fontSize(7.5).fillColor('#64748b').text(`IRN: ${invoice.irn} (mock)`, rightColX, undefined, { width: 230 });
        doc.fillColor('#0f172a').fontSize(9);
      }
      doc.moveDown(1.5);

      // 4. Line Items Table Header
      const tableTop = doc.y;
      doc.rect(36, tableTop, 523, 18).fill('#f1f5f9');
      doc.fillColor('#334155').fontSize(8);
      doc.text('Item / Product', 40, tableTop + 5);
      doc.text('HSN', 190, tableTop + 5);
      doc.text('Qty', 245, tableTop + 5, { width: 35, align: 'right' });
      doc.text('Rate (₹)', 285, tableTop + 5, { width: 50, align: 'right' });
      doc.text('Taxable (₹)', 340, tableTop + 5, { width: 55, align: 'right' });
      doc.text('Tax Rate', 400, tableTop + 5, { width: 45, align: 'right' });
      doc.text('Total (₹)', 480, tableTop + 5, { width: 70, align: 'right' });

      let rowY = tableTop + 22;
      doc.fillColor('#0f172a').fontSize(8.5);

      for (const item of invoice.items) {
        const itemTaxRate = (item.cgstRate || 0) + (item.sgstRate || 0) + (item.igstRate || 0);
        doc.text(item.productName, 40, rowY, { width: 145 });
        doc.text(item.hsnCode || '19059040', 190, rowY);
        doc.text(`${item.quantity}`, 245, rowY, { width: 35, align: 'right' });
        doc.text(item.unitPrice.toFixed(2), 285, rowY, { width: 50, align: 'right' });
        doc.text(item.taxableAmount.toFixed(2), 340, rowY, { width: 55, align: 'right' });
        doc.text(`${itemTaxRate}%`, 400, rowY, { width: 45, align: 'right' });
        doc.text(item.totalAmount.toFixed(2), 480, rowY, { width: 70, align: 'right' });
        rowY += 16;
      }

      doc.moveTo(36, rowY).lineTo(559, rowY).stroke('#cbd5e1');
      rowY += 8;

      // 5. Tax Breakdown & Totals Box
      const summaryX = 330;
      doc.fontSize(9);
      doc.text('Taxable Value:', summaryX, rowY);
      doc.text(`₹${invoice.taxableValue.toFixed(2)}`, 480, rowY, { width: 70, align: 'right' });
      rowY += 14;

      if (!invoice.isInterState) {
        const halfRate = (invoice.items[0]?.cgstRate || 2.5).toFixed(1);
        doc.text(`CGST (${halfRate}%):`, summaryX, rowY);
        doc.text(`₹${invoice.cgstTotal.toFixed(2)}`, 480, rowY, { width: 70, align: 'right' });
        rowY += 14;

        doc.text(`SGST (${halfRate}%):`, summaryX, rowY);
        doc.text(`₹${invoice.sgstTotal.toFixed(2)}`, 480, rowY, { width: 70, align: 'right' });
        rowY += 14;
      } else {
        const fullRate = (invoice.items[0]?.igstRate || 5.0).toFixed(1);
        doc.text(`IGST (${fullRate}%):`, summaryX, rowY);
        doc.text(`₹${invoice.igstTotal.toFixed(2)}`, 480, rowY, { width: 70, align: 'right' });
        rowY += 14;
      }

      // Grand Total Highlight
      doc.rect(325, rowY, 234, 20).fill('#e0e7ff');
      doc.fillColor('#1e1b4b').fontSize(10).text(
        isCreditNote ? 'Credit Amount:' : 'Grand Total:',
        summaryX,
        rowY + 5,
        { bold: true } as any
      );
      doc.text(`₹${invoice.grandTotal.toFixed(2)}`, 480, rowY + 5, { width: 70, align: 'right', bold: true } as any);
      rowY += 28;

      // 6. Amount in Words
      const paiseVal = invoice.grandTotalPaise || Math.round(invoice.grandTotal * 100);
      const amountWords = numberToWordsINR(paiseVal);
      doc.fillColor('#1e293b').fontSize(8.5);
      doc.text(`Amount in Words: ${amountWords}`, 36, rowY, { bold: true, width: 515 } as any);
      rowY += 18;

      // 7. Statutory Bank Details & Terms Grid
      doc.moveTo(36, rowY).lineTo(559, rowY).stroke('#e2e8f0');
      rowY += 8;

      const bank = settings.bankDetails || {};
      doc.fontSize(8).fillColor('#334155');
      doc.text('Bank Payment Coordinates:', 36, rowY, { bold: true } as any);
      doc.text(`Bank: ${bank.bankName || 'State Bank of India'} | Account No: ${bank.accountNumber || '389201948201'}`, 36, rowY + 11);
      doc.text(`IFSC: ${bank.ifscCode || 'SBIN0001234'} | Branch: ${bank.branch || 'Industrial Branch'}`, 36, rowY + 22);

      doc.text('Terms & Conditions:', 320, rowY, { bold: true } as any);
      const termsLines = (settings.invoiceTerms || 'Payment due within 30 days.').split('\n');
      let termY = rowY + 11;
      for (const line of termsLines.slice(0, 3)) {
        doc.text(line, 320, termY, { width: 235 });
        termY += 10;
      }

      // 8. Footer Note
      doc.fillColor('#94a3b8').fontSize(7.5).text(
        'Certified that the particulars given above are true and correct. This is a computer-generated document under Section 31 of CGST Act.',
        36,
        780,
        { align: 'center', width: 523 }
      );

      doc.end();
    });
  }
}
