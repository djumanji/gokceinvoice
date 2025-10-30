import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TaxSavingsSummary } from "@/types/expense-analytics";
import { EXPENSE_CATEGORIES } from "@/components/ExpenseForm";
import { formatCurrency } from "@/lib/numberUtils";
import { TrendingUp } from "lucide-react";

interface TaxSavingsProps {
  data: TaxSavingsSummary;
}

const getCategoryLabel = (categoryValue: string): string => {
  const category = EXPENSE_CATEGORIES.find(c => c.value === categoryValue);
  return category ? category.label : categoryValue;
};

const chartConfig = {
  total: {
    label: "Tax Deductible Amount",
    color: "hsl(var(--chart-1))",
  },
};

export function TaxSavings({ data }: TaxSavingsProps) {
  const chartData = data.breakdownByCategory.map(item => ({
    ...item,
    name: getCategoryLabel(item.category),
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tax Deductible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalTaxDeductible)}</div>
            <p className="text-xs text-muted-foreground mt-1">Expenses eligible for deduction</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Tax Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {formatCurrency(data.estimatedTaxSavings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">At {data.taxRate}% tax rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Potential Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalTaxDeductible * 0.3)}</div>
            <p className="text-xs text-muted-foreground mt-1">At 30% tax rate (example)</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Deductible by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="hsl(var(--chart-1))" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Tax Deductible Amount</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartData.map((item) => (
                <TableRow key={item.category}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  <TableCell className="text-right">{item.count}</TableCell>
                  <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              {chartData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No tax-deductible expenses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

