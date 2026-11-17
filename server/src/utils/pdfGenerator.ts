import PDFDocument from 'pdfkit';
import { IInvoice } from '../models';

export class PDFInvoiceGenerator {
  static generateInvoicePDF(invoice: IInvoice): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header: Factory / Company Details
      doc.fontSize(20).fillColor('#1e1b4b').text('NASH FOODS MANUFACTURING', { align: 'center', bold: true } as any);
      doc.fontSize(10).fillColor('#475569').text('Packaged South Indian Snacks & Sweets', { align: 'center' });
      doc.text('Industrial Estate, Tiruchirappalli, Tamil Nadu - 620015 | GSTIN: 33AAAAA0000A1Z5', { align: 'center' });
      doc.moveDown(0.5);

      // Title Bar
      doc.rect(40, doc.y, 515, 24).fill('#4f46e5');
      doc.fillColor('#ffffff').fontSize(12).text('TAX INVOICE (GST COMPLIANT)', 45, doc.y + 6, { align: 'center' });
      doc.moveDown(1.5);

      // Invoice & Customer Info Grid
      const currentY = doc.y;
      doc.fillColor('#0f172a').fontSize(10);
      
      // Left Column: Customer
      doc.text(`Billed To: ${invoice.customerName}`, 40, currentY, { bold: true } as any);
      doc.text(`Customer Code: ${invoice.customerCode}`);
      doc.text(`State: ${invoice.customerState} (${invoice.customerStateCode})`);
      if (invoice.customerGstin) doc.text(`GSTIN: ${invoice.customerGstin}`);
      doc.text(`Place of Supply: ${invoice.placeOfSupply}`);

      // Right Column: Invoice Details
      doc.text(`Invoice No: ${invoice.invoiceNumber}`, 340, currentY, { bold: true } as any);
      doc.text(`Invoice Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 340);
      doc.text(`Payment Status: ${invoice.paymentStatus}`, 340);
      doc.text(`Supply Type: ${invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}`, 340);
      doc.moveDown(2);

      // Line Items Table Header
      const tableTop = doc.y;
      doc.rect(40, tableTop, 515, 20).fill('#f1f5f9');
      doc.fillColor('#334155').fontSize(9).text('Item / Product', 45, tableTop + 5);
      doc.text('HSN', 210, tableTop + 5);
      doc.text('Qty', 270, tableTop + 5, { width: 40, align: 'right' });
      doc.text('Rate (₹)', 320, tableTop + 5, { width: 50, align: 'right' });
      doc.text('Taxable (₹)', 380, tableTop + 5, { width: 60, align: 'right' });
      doc.text('Total (₹)', 460, tableTop + 5, { width: 85, align: 'right' });

      let rowY = tableTop + 24;
      doc.fillColor('#0f172a');

      for (const item of invoice.items) {
        doc.text(item.productName, 45, rowY);
        doc.text(item.hsnCode, 210, rowY);
        doc.text(`${item.quantity}`, 270, rowY, { width: 40, align: 'right' });
        doc.text(item.unitPrice.toFixed(2), 320, rowY, { width: 50, align: 'right' });
        doc.text(item.taxableAmount.toFixed(2), 380, rowY, { width: 60, align: 'right' });
        doc.text(item.totalAmount.toFixed(2), 460, rowY, { width: 85, align: 'right' });
        rowY += 18;
      }

      doc.moveTo(40, rowY).lineTo(555, rowY).stroke('#cbd5e1');
      rowY += 10;

      // Summary Box
      const summaryX = 320;
      doc.fontSize(10);
      doc.text('Total Taxable Value:', summaryX, rowY);
      doc.text(`₹${invoice.taxableValue.toFixed(2)}`, 460, rowY, { width: 85, align: 'right' });
      rowY += 16;

      if (!invoice.isInterState) {
        doc.text('CGST (2.5%):', summaryX, rowY);
        doc.text(`₹${invoice.cgstTotal.toFixed(2)}`, 460, rowY, { width: 85, align: 'right' });
        rowY += 16;

        doc.text('SGST (2.5%):', summaryX, rowY);
        doc.text(`₹${invoice.sgstTotal.toFixed(2)}`, 460, rowY, { width: 85, align: 'right' });
        rowY += 16;
      } else {
        doc.text('IGST (5.0%):', summaryX, rowY);
        doc.text(`₹${invoice.igstTotal.toFixed(2)}`, 460, rowY, { width: 85, align: 'right' });
        rowY += 16;
      }

      doc.rect(315, rowY, 240, 24).fill('#e0e7ff');
      doc.fillColor('#1e1b4b').fontSize(11).text('Grand Total:', summaryX, rowY + 6, { bold: true } as any);
      doc.text(`₹${invoice.grandTotal.toFixed(2)}`, 460, rowY + 6, { width: 85, align: 'right', bold: true } as any);
      rowY += 32;

      doc.fillColor('#475569').fontSize(10);
      doc.text(`Paid to Date: ₹${invoice.paidAmount.toFixed(2)}`, summaryX, rowY);
      rowY += 16;
      doc.fillColor(invoice.balanceDue > 0 ? '#b91c1c' : '#15803d');
      doc.text(`Outstanding Balance Due: ₹${invoice.balanceDue.toFixed(2)}`, summaryX, rowY, { bold: true } as any);

      // Footer
      doc.moveDown(4);
      doc.fillColor('#94a3b8').fontSize(8).text(
        'This is a computer-generated GST tax invoice from ZenLyft Manufacturing OS. Center for Digital Infrastructure, NIT Tiruchirappalli Internship Benchmark.',
        40,
        760,
        { align: 'center', width: 515 }
      );

      doc.end();
    });
  }
}

