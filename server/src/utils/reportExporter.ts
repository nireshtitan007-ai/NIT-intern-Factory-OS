import { Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { CSVExportUtil } from './csvExport';

export interface ReportColumnDef {
  header: string;
  key: string;
  width?: number; // approx chars or points
  isCurrency?: boolean;
  isDate?: boolean;
  isNumeric?: boolean;
}

export class ReportExporter {
  /**
   * Universal export dispatcher supporting xlsx (ExcelJS), csv, and pdf (PDFKit).
   */
  static async export(
    res: Response,
    format: string | undefined,
    filename: string,
    title: string,
    columns: ReportColumnDef[],
    rows: any[],
    extraJsonProps: Record<string, any> = {}
  ) {
    const cleanFormat = (format || 'json').toLowerCase();

    if (cleanFormat === 'xlsx') {
      return this.sendExcel(res, filename, title, columns, rows);
    } else if (cleanFormat === 'csv') {
      return this.sendCSV(res, filename, columns, rows);
    } else if (cleanFormat === 'pdf') {
      return this.sendPDF(res, filename, title, columns, rows);
    } else {
      return res.json({ 
        success: true, 
        count: rows.length, 
        data: rows,
        ...extraJsonProps 
      });
    }
  }

  private static async sendExcel(
    res: Response,
    filename: string,
    title: string,
    columns: ReportColumnDef[],
    rows: any[]
  ) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ZenLyft Manufacturing OS';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(title.slice(0, 31));

    // Define worksheet columns
    sheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 18
    }));

    // Style Header Row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Dark blue
    };
    headerRow.alignment = { vertical: 'middle' };
    headerRow.height = 24;

    // Add Data Rows
    const totals: Record<string, number> = {};
    for (const r of rows) {
      const rowData: Record<string, any> = {};
      for (const col of columns) {
        let val = r[col.key];
        if (col.isDate && val) {
          val = new Date(val).toLocaleDateString('en-IN');
        } else if ((col.isCurrency || col.isNumeric) && typeof val === 'number') {
          totals[col.key] = (totals[col.key] || 0) + val;
        }
        rowData[col.key] = val !== undefined && val !== null ? val : '';
      }
      sheet.addRow(rowData);
    }

    // Add Totals Row
    const totalsRowData: Record<string, any> = {};
    let firstCol = true;
    for (const col of columns) {
      if (firstCol) {
        totalsRowData[col.key] = 'TOTAL';
        firstCol = false;
      } else if (col.isCurrency || col.isNumeric) {
        totalsRowData[col.key] = Math.round((totals[col.key] || 0) * 100) / 100;
      } else {
        totalsRowData[col.key] = '';
      }
    }
    const addedTotalsRow = sheet.addRow(totalsRowData);
    addedTotalsRow.font = { bold: true };
    addedTotalsRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }
    };

    // Format columns
    columns.forEach((col, idx) => {
      if (col.isCurrency) {
        sheet.getColumn(idx + 1).numFmt = '₹#,##0.00';
      } else if (col.isNumeric) {
        sheet.getColumn(idx + 1).numFmt = '#,##0.##';
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  }

  private static sendCSV(
    res: Response,
    filename: string,
    columns: ReportColumnDef[],
    rows: any[]
  ) {
    const formattedRows = rows.map(r => {
      const obj: Record<string, any> = {};
      for (const col of columns) {
        let val = r[col.key];
        if (col.isDate && val) {
          val = new Date(val).toLocaleDateString('en-IN');
        } else if (col.isCurrency && typeof val === 'number') {
          val = `₹${val.toFixed(2)}`;
        }
        obj[col.header] = val !== undefined && val !== null ? val : '';
      }
      return obj;
    });

    // Add Totals row in CSV
    const totalsRow: Record<string, any> = {};
    let first = true;
    for (const col of columns) {
      if (first) {
        totalsRow[col.header] = 'TOTAL';
        first = false;
      } else if (col.isCurrency || col.isNumeric) {
        const sum = rows.reduce((acc, row) => acc + (Number(row[col.key]) || 0), 0);
        totalsRow[col.header] = col.isCurrency ? `₹${sum.toFixed(2)}` : sum;
      } else {
        totalsRow[col.header] = '';
      }
    }
    formattedRows.push(totalsRow);

    const csv = CSVExportUtil.arrayToCSV(formattedRows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(csv);
  }

  private static sendPDF(
    res: Response,
    filename: string,
    title: string,
    columns: ReportColumnDef[],
    rows: any[]
  ) {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: columns.length > 6 ? 'landscape' : 'portrait' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}.pdf"`);
    doc.pipe(res);

    // Title & Header
    doc.fontSize(16).fillColor('#1e3a8a').text(title, { align: 'center', bold: true } as any);
    doc.fontSize(9).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleString('en-IN')} | ZenLyft Statutory Reports`, { align: 'center' });
    doc.moveDown(1);

    // Calculate Column Widths
    const totalWidth = doc.page.width - 60;
    const colWidth = Math.floor(totalWidth / columns.length);

    let y = doc.y;
    doc.rect(30, y, totalWidth, 18).fill('#f1f5f9');
    doc.fillColor('#1e293b').fontSize(8);

    columns.forEach((col, idx) => {
      doc.text(col.header, 35 + idx * colWidth, y + 5, { width: colWidth - 5, bold: true } as any);
    });
    y += 22;

    const totals: Record<string, number> = {};
    for (const row of rows.slice(0, 45)) { // fit single/first page
      if (y > doc.page.height - 60) break;
      doc.fillColor('#334155').fontSize(7.5);
      columns.forEach((col, idx) => {
        let val = row[col.key];
        if (col.isDate && val) {
          val = new Date(val).toLocaleDateString('en-IN');
        } else if (col.isCurrency && typeof val === 'number') {
          totals[col.key] = (totals[col.key] || 0) + val;
          val = `₹${val.toFixed(2)}`;
        } else if (col.isNumeric && typeof val === 'number') {
          totals[col.key] = (totals[col.key] || 0) + val;
        }
        doc.text(String(val !== undefined && val !== null ? val : ''), 35 + idx * colWidth, y, { width: colWidth - 5 });
      });
      y += 14;
    }

    // Totals line
    doc.moveTo(30, y).lineTo(30 + totalWidth, y).stroke('#cbd5e1');
    y += 4;
    doc.fillColor('#0f172a').fontSize(8);
    columns.forEach((col, idx) => {
      if (idx === 0) {
        doc.text('TOTAL', 35, y, { bold: true } as any);
      } else if (totals[col.key] !== undefined) {
        const tVal = col.isCurrency ? `₹${totals[col.key].toFixed(2)}` : String(totals[col.key]);
        doc.text(tVal, 35 + idx * colWidth, y, { bold: true, width: colWidth - 5 } as any);
      }
    });

    doc.end();
  }
}
