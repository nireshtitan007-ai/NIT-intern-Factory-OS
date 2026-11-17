export class CSVExportUtil {
  static arrayToCSV(rows: Array<Record<string, any>>): string {
    if (!rows || rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escape = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvLines = [
      headers.map(escape).join(','),
      ...rows.map(row => headers.map(header => escape(row[header])).join(','))
    ];

    return csvLines.join('\r\n');
  }
}

