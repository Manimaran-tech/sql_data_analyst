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
export function parseCSV(text: string): SaleRecord[] {
  if (!text || !text.trim()) return [];
  
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse headers
  const headers = lines[0].split(',').map(h => cleanValue(h).toLowerCase().replace(/[\s_-]+/g, ''));
  const records: SaleRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple robust split that respects double quotes
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

    if (cells.length < 4) continue;

    // Map columns dynamically based on closest name matching
    let order_id = `R-${1000 + i}`;
    let order_date = new Date().toISOString().split('T')[0];
    let product_name = 'Enterprise Service Pack';
    let category = 'Subscription';
    let quantity = 1;
    let unit_price = 100;
    let discount = 0;
    let region = 'Global';
    let customer_segment = 'Enterprise';

    headers.forEach((header, index) => {
      const val = cleanValue(cells[index] || '');
      if (!val) return;

      if (header.includes('orderid') || header.includes('id') || header.includes('invoice')) {
        order_id = val;
      } else if (header.includes('date')) {
        order_date = val;
      } else if (header.includes('product') || header.includes('item') || header.includes('name')) {
        product_name = val;
      } else if (header.includes('category') || header.includes('type')) {
        category = val;
      } else if (header.includes('quantity') || header.includes('qty')) {
        quantity = parseInt(val.replace(/[^0-9.-]/g, ''), 10) || 1;
      } else if (header.includes('price') || header.includes('rate')) {
        unit_price = parseFloat(val.replace(/[^0-9.-]/g, '')) || 100;
      } else if (header.includes('discount')) {
        discount = parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
        // Treat percentage fields like '15' as '0.15'
        if (discount > 1) {
          discount = discount / 100;
        }
      } else if (header.includes('region') || header.includes('location') || header.includes('country')) {
        region = val;
      } else if (header.includes('segment') || header.includes('group') || header.includes('cohort')) {
        customer_segment = val;
      }
    });

    const sales_amount = (quantity * unit_price) * (1 - discount);

    records.push({
      order_id,
      order_date,
      product_name,
      category,
      quantity,
      unit_price,
      discount,
      region,
      sales_amount: Number(sales_amount.toFixed(2)),
      customer_segment
    });
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
