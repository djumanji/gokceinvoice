import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from "recharts";
import type { TimeSeriesDataPoint } from "@/types/expense-analytics";
import { formatCurrency } from "@/lib/numberUtils";

interface ExpenseTrendsProps {
  data: TimeSeriesDataPoint[];
}

const chartConfig = {
  total: {
    label: "Total Expenses",
    color: "hsl(var(--chart-1))",
  },
  taxDeductible: {
    label: "Tax Deductible",
    color: "hsl(var(--chart-2))",
  },
};

export function ExpenseTrends({ data }: ExpenseTrendsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Expense Trends Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <AreaChart data={data}>
              <XAxis dataKey="period" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--chart-1))"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="taxDeductible"
                stroke="hsl(var(--chart-2))"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <LineChart data={data}>
              <XAxis dataKey="period" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="taxDeductible"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Monthly</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.reduce((sum, d) => sum + d.total, 0) / data.length)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Highest Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(Math.max(...data.map(d => d.total)))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.find(d => d.total === Math.max(...data.map(d => d.total)))?.period || 'N/A'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lowest Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(Math.min(...data.map(d => d.total)))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.find(d => d.total === Math.min(...data.map(d => d.total)))?.period || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

