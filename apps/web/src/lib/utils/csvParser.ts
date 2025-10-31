export interface ParsedCSV {
  headers: string[];
  data: string[][];
}

/**
 * Parse CSV text into structured data
 * Handles basic CSV parsing with quoted fields and escaped quotes
 */
export function parseCSV(text: string): ParsedCSV {
  const lines = text.split('\n').filter(line => line.trim() !== '');

  if (lines.length === 0) {
    return { headers: [], data: [] };
  }

  const headers = parseCSVLine(lines[0]);
  const data = lines.slice(1).map(line => parseCSVLine(line));

  return { headers, data };
}

/**
 * Parse a single CSV line, handling quoted fields and escaped quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quotes
        current += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
      continue;
    }

    // Regular character
    current += char;
    i++;
  }

  // Add the last field
  result.push(current.trim());

  return result;
}

/**
 * Validate CSV data structure for RKA import
 */
export function validateRKAData(data: string[][], headers: string[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required headers
  const requiredHeaders = [
    'programKode', 'programNama',
    'kegiatanKode', 'kegiatanNama',
    'subkegiatanKode', 'subkegiatanNama',
    'akunKode', 'akunUraian',
    'paguTahun'
  ];

  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    errors.push(`Header yang diperlukan tidak ada: ${missingHeaders.join(', ')}`);
  }

  // Validate each row
  data.forEach((row, index) => {
    const rowData: Record<string, string> = {};
    headers.forEach((header, i) => {
      rowData[header] = row[i] || '';
    });

    // Check required fields
    requiredHeaders.forEach(field => {
      if (!rowData[field] || rowData[field] === '') {
        errors.push(`Baris ${index + 2}: Field '${field}' kosong`);
      }
    });

    // Validate account code format
    if (rowData.akunKode) {
      const kodePattern = /^\d+\.\d+\.\d+\.\d+\.\d+$/;
      if (!kodePattern.test(rowData.akunKode)) {
        errors.push(`Baris ${index + 2}: Format kode akun tidak valid. Format yang benar: X.XX.XX.XX.XXX (contoh: 5.1.01.01.001)`);
      }
    }

    // Validate pagu tahun
    if (rowData.paguTahun) {
      const pagu = parseFloat(rowData.paguTahun);
      if (isNaN(pagu) || pagu < 0) {
        errors.push(`Baris ${index + 2}: Pagu tahun harus angka positif`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format data for CSV export
 */
export function formatDataForCSV(data: any[], headers: string[]): string {
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: any[], headers: string[], filename: string): void {
  const csvContent = formatDataForCSV(data, headers);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}