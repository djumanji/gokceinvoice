import { Badge } from "@/components/ui/badge";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

interface StatusBadgeProps {
  status: InvoiceStatus;
}

const statusConfig = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-muted-border",
  },
  sent: {
    label: "Sent",
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
  paid: {
    label: "Paid",
    className: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  },
  overdue: {
    label: "Overdue",
    className: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={config.className}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
