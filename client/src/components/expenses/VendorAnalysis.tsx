import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { VendorAnalysis } from "@/types/expense-analytics";
import { formatCurrency } from "@/lib/numberUtils";

interface VendorAnalysisProps {
  data: VendorAnalysis[];
}

const chartConfig = {
  total: {
    label: "Total Spent",
    color: "hsl(var(--chart-1))",
  },
};

export function VendorAnalysis({ data }: VendorAnalysisProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Vendors by Spend</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart data={data.slice(0, 10)}>
              <XAxis dataKey="vendor" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="hsl(var(--chart-1))" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Average</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((vendor) => (
                <TableRow key={vendor.vendor}>
                  <TableCell className="font-medium">{vendor.vendor}</TableCell>
                  <TableCell className="text-right">{formatCurrency(vendor.total)}</TableCell>
                  <TableCell className="text-right">{vendor.count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(vendor.average)}</TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No vendor data available
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

