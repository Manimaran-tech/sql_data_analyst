import { SaleRecord } from './types';

/**
 * Trims quote symbols from parsed strings
 */
function cleanValue(val: string): string {
  if (!val) return '';
  let clean = val.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.slice(1, -1);
  }
  if (clean.startsWith("'") && clean.endsWith("'")) {
    clean = clean.slice(1, -1);
  }
  return clean.trim();
}

/**
 * Parses raw CSV content into typed SaleRecord structure
 * Features automatic numeric converts and safe fallbacks
 */
export function parseCSV(text: string): Record<string, any>[] {
  if (!text || !text.trim()) return [];
  
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell);
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell);
    return cells.map(cleanValue);
  };

  const headers = parseLine(lines[0]);
  const records: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = parseLine(line);
    const record: Record<string, any> = {};

    headers.forEach((header, index) => {
      if (!header) return;
      const rawVal = cells[index] || '';
      
      // Try to parse numeric values dynamically (ignore currency symbols and commas)
      const sanitizedNumStr = rawVal.replace(/[^0-9.-]/g, '');
      const numVal = Number(sanitizedNumStr);
      
      if (rawVal !== '' && !isNaN(numVal) && sanitizedNumStr !== '') {
        record[header] = numVal;
      } else {
        record[header] = rawVal;
      }
    });

    records.push(record);
  }

  return records;
}

/**
 * Computes central executive metric summaries
 */
export function calculateMetrics(records: SaleRecord[]) {
  const totalRevenue = records.reduce((sum, r) => sum + r.sales_amount, 0);
  const totalQty = records.reduce((sum, r) => sum + r.quantity, 0);
  const avgDiscount = records.length > 0
    ? records.reduce((sum, r) => sum + r.discount, 0) / records.length
    : 0;
  const transactionCount = records.length;
  const avgOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  return {
    totalRevenue,
    totalQty,
    avgDiscount,
    transactionCount,
    avgOrderValue
  };
}

/**
 * Aggregates group results by Dimension field
 */
export function aggregateByField(records: SaleRecord[], field: keyof SaleRecord): { label: string; value: number }[] {
  const groupings: { [key: string]: number } = {};

  records.forEach(r => {
    const key = String(r[field]);
    groupings[key] = (groupings[key] || 0) + r.sales_amount;
  });

  return Object.keys(groupings).map(key => ({
    label: key,
    value: Number(groupings[key].toFixed(2))
  })).sort((a, b) => b.value - a.value);
}

/**
 * Aggregates and groups chronological sales trends
 */
export function getTimelineTrend(records: SaleRecord[]): { label: string; value: number }[] {
  const groupings: { [key: string]: number } = {};

  records.forEach(r => {
    // Group either by YYYY-MM or exact date depending on volume
    const dateStr = r.order_date;
    let groupKey = dateStr;
    try {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          groupKey = `${monthNames[monthIndex]} ${parts[0]}`;
        }
      }
    } catch (e) {
      // safe fallback
    }
    groupings[groupKey] = (groupings[groupKey] || 0) + r.sales_amount;
  });

  // Unique chronological keys sorted
  const sortedKeys = Object.keys(groupings).sort((a, b) => {
    // simple comparison: handles standard YYYY-MM or fallback
    return a.localeCompare(b);
  });

  return sortedKeys.map(key => ({
    label: key,
    value: Number(groupings[key].toFixed(2))
  }));
}
