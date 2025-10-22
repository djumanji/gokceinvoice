import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "default" | "success" | "warning" | "danger";
}

export function StatCard({ title, value, icon: Icon, trend, color = "default" }: StatCardProps) {
  const colorClasses = {
    default: "text-foreground",
    success: "text-chart-1",
    warning: "text-chart-2",
    danger: "text-chart-5",
  };

  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className={`text-3xl font-bold ${colorClasses[color]}`} data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            {value}
          </p>
          {trend && (
            <span
              className={`text-sm font-medium ${trend.isPositive ? "text-chart-1" : "text-chart-5"}`}
              data-testid="text-trend"
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
