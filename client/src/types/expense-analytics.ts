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
  period: string;
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

