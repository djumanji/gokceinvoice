import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { DateRangePicker, type DateRange } from "@/components/expenses/DateRangePicker";
import { CategoryBreakdown } from "@/components/expenses/CategoryBreakdown";
import { TaxSavings } from "@/components/expenses/TaxSavings";
import { ExpenseTrends } from "@/components/expenses/ExpenseTrends";
import { VendorAnalysis } from "@/components/expenses/VendorAnalysis";
import { PaymentMethodBreakdown } from "@/components/expenses/PaymentMethodBreakdown";
import { ExportReports } from "@/components/expenses/ExportReports";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import type { ExpenseAnalytics } from "@/types/expense-analytics";
import { startOfMonth, endOfMonth } from "date-fns";

export default function ExpenseReports() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    preset: "thisMonth",
  });
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [taxRate, setTaxRate] = useState<number>(20); // Default 20%

  // Build query params - use useMemo to prevent unnecessary re-renders
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (dateRange.startDate) {
      params.append("startDate", dateRange.startDate.toISOString());
    }
    if (dateRange.endDate) {
      params.append("endDate", dateRange.endDate.toISOString());
    }
    params.append("period", period);
    params.append("taxRate", taxRate.toString());
    return params;
  }, [dateRange.startDate, dateRange.endDate, period, taxRate]);

  const { data: analytics, isLoading } = useQuery<ExpenseAnalytics>({
    queryKey: [`/api/expenses/analytics?${queryParams.toString()}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/expenses/analytics?${queryParams.toString()}`);
      return response;
    },
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("expense.reports") || "Expense Reports"}
        description={t("expense.reportsDescription") || "Analytics and insights for your expenses"}
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium">Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "month" | "quarter" | "year")}
              className="px-3 py-2 border rounded-md"
            >
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="year">Yearly</option>
            </select>

            <label className="text-sm font-medium ml-4">Tax Rate (%):</label>
            <input
              type="number"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="px-3 py-2 border rounded-md w-24"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
      ) : analytics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{analytics.totalExpenses.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{analytics.totalCount} expenses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tax Deductible</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{analytics.taxSavings.totalTaxDeductible.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Potential savings</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Tax Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">€{analytics.taxSavings.estimatedTaxSavings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">At {taxRate}% tax rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <ExportReports analytics={analytics} dateRange={dateRange} />
          </div>

          {/* Report Tabs */}
          <Tabs defaultValue="category" className="space-y-4">
            <TabsList>
              <TabsTrigger value="category">Category Breakdown</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="tax">Tax Savings</TabsTrigger>
              <TabsTrigger value="vendor">Vendors</TabsTrigger>
              <TabsTrigger value="payment">Payment Methods</TabsTrigger>
            </TabsList>

            <TabsContent value="category">
              <CategoryBreakdown data={analytics.categoryBreakdown} totalExpenses={analytics.totalExpenses} />
            </TabsContent>

            <TabsContent value="trends">
              <ExpenseTrends data={analytics.timeSeries} />
            </TabsContent>

            <TabsContent value="tax">
              <TaxSavings data={analytics.taxSavings} />
            </TabsContent>

            <TabsContent value="vendor">
              <VendorAnalysis data={analytics.topVendors} />
            </TabsContent>

            <TabsContent value="payment">
              <PaymentMethodBreakdown data={analytics.paymentMethodBreakdown} />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No expense data available for the selected period.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

