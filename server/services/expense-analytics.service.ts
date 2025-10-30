import type { Expense } from '@shared/schema';

/**
 * Safely parse a value to a float, returning 0 if parsing fails
 */
function safeParseFloat(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface TaxSavingsSummary {
  totalTaxDeductible: number;
  estimatedTaxSavings: number;
  taxRate: number;
  breakdownByCategory: CategoryBreakdown[];
}

export interface TimeSeriesDataPoint {
  period: string; // e.g., "2024-01", "2024-Q1", "2024"
  total: number;
  count: number;
  taxDeductible: number;
}

export interface VendorAnalysis {
  vendor: string;
  total: number;
  count: number;
  average: number;
}

export interface PaymentMethodBreakdown {
  paymentMethod: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ExpenseAnalytics {
  categoryBreakdown: CategoryBreakdown[];
  taxSavings: TaxSavingsSummary;
  timeSeries: TimeSeriesDataPoint[];
  topVendors: VendorAnalysis[];
  paymentMethodBreakdown: PaymentMethodBreakdown[];
  totalExpenses: number;
  totalCount: number;
}

/**
 * Calculate category breakdown from expenses
 */
export function calculateCategoryBreakdown(expenses: Expense[]): CategoryBreakdown[] {
  const categoryMap = new Map<string, { total: number; count: number }>();
  let totalAmount = 0;

  expenses.forEach(expense => {
    const amount = safeParseFloat(expense.amount, 0);
    totalAmount += amount;

    const existing = categoryMap.get(expense.category) || { total: 0, count: 0 };
    categoryMap.set(expense.category, {
      total: existing.total + amount,
      count: existing.count + 1,
    });
  });

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Calculate tax savings summary
 */
export function calculateTaxSavings(
  expenses: Expense[],
  taxRate: number = 0
): TaxSavingsSummary {
  const taxDeductibleExpenses = expenses.filter(e => e.isTaxDeductible);
  const totalTaxDeductible = taxDeductibleExpenses.reduce(
    (sum, e) => sum + safeParseFloat(e.amount, 0),
    0
  );

  const estimatedTaxSavings = totalTaxDeductible * (taxRate / 100);

  // Breakdown by category for tax-deductible expenses
  const categoryMap = new Map<string, { total: number; count: number }>();
  taxDeductibleExpenses.forEach(expense => {
    const amount = safeParseFloat(expense.amount, 0);
    const existing = categoryMap.get(expense.category) || { total: 0, count: 0 };
    categoryMap.set(expense.category, {
      total: existing.total + amount,
      count: existing.count + 1,
    });
  });

  const breakdownByCategory = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: totalTaxDeductible > 0 ? (data.total / totalTaxDeductible) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalTaxDeductible,
    estimatedTaxSavings,
    taxRate,
    breakdownByCategory,
  };
}

/**
 * Get time series data aggregated by period
 */
export function getTimeSeriesData(
  expenses: Expense[],
  period: 'month' | 'quarter' | 'year' = 'month'
): TimeSeriesDataPoint[] {
  const periodMap = new Map<string, { total: number; count: number; taxDeductible: number }>();

  expenses.forEach(expense => {
    const date = new Date(expense.date);
    let periodKey: string;

    if (period === 'month') {
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (period === 'quarter') {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      periodKey = `${date.getFullYear()}-Q${quarter}`;
    } else {
      periodKey = String(date.getFullYear());
    }

    const amount = safeParseFloat(expense.amount, 0);
    const existing = periodMap.get(periodKey) || { total: 0, count: 0, taxDeductible: 0 };

    periodMap.set(periodKey, {
      total: existing.total + amount,
      count: existing.count + 1,
      taxDeductible: existing.taxDeductible + (expense.isTaxDeductible ? amount : 0),
    });
  });

  return Array.from(periodMap.entries())
    .map(([period, data]) => ({
      period,
      total: data.total,
      count: data.count,
      taxDeductible: data.taxDeductible,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Get top vendors by spend
 */
export function getTopVendors(expenses: Expense[], limit: number = 10): VendorAnalysis[] {
  const vendorMap = new Map<string, { total: number; count: number }>();

  expenses.forEach(expense => {
    if (!expense.vendor) return;

    const amount = safeParseFloat(expense.amount, 0);
    const existing = vendorMap.get(expense.vendor) || { total: 0, count: 0 };
    vendorMap.set(expense.vendor, {
      total: existing.total + amount,
      count: existing.count + 1,
    });
  });

  return Array.from(vendorMap.entries())
    .map(([vendor, data]) => ({
      vendor,
      total: data.total,
      count: data.count,
      average: data.count > 0 ? data.total / data.count : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/**
 * Get payment method breakdown
 */
export function getPaymentMethodBreakdown(expenses: Expense[]): PaymentMethodBreakdown[] {
  const methodMap = new Map<string, { total: number; count: number }>();
  let totalAmount = 0;

  expenses.forEach(expense => {
    const method = expense.paymentMethod || 'other';
    const amount = safeParseFloat(expense.amount, 0);
    totalAmount += amount;

    const existing = methodMap.get(method) || { total: 0, count: 0 };
    methodMap.set(method, {
      total: existing.total + amount,
      count: existing.count + 1,
    });
  });

  return Array.from(methodMap.entries())
    .map(([paymentMethod, data]) => ({
      paymentMethod,
      total: data.total,
      count: data.count,
      percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Filter expenses by date range
 */
export function filterExpensesByDateRange(
  expenses: Expense[],
  startDate?: Date,
  endDate?: Date
): Expense[] {
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    if (startDate && expenseDate < startDate) return false;
    if (endDate && expenseDate > endDate) return false;
    return true;
  });
}

/**
 * Calculate comprehensive expense analytics
 */
export function calculateExpenseAnalytics(
  expenses: Expense[],
  taxRate: number = 0,
  period: 'month' | 'quarter' | 'year' = 'month'
): ExpenseAnalytics {
  const totalExpenses = expenses.reduce((sum, e) => sum + safeParseFloat(e.amount, 0), 0);
  const totalCount = expenses.length;

  return {
    categoryBreakdown: calculateCategoryBreakdown(expenses),
    taxSavings: calculateTaxSavings(expenses, taxRate),
    timeSeries: getTimeSeriesData(expenses, period),
    topVendors: getTopVendors(expenses, 10),
    paymentMethodBreakdown: getPaymentMethodBreakdown(expenses),
    totalExpenses,
    totalCount,
  };
}

