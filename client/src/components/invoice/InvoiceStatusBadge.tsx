import { Badge } from "@/components/ui/badge";

interface InvoiceStatusBadgeProps {
  status: "draft" | "scheduled" | "sent" | "paid" | "overdue" | "cancelled";
}

const statusConfig = {
  draft: { variant: "secondary" as const, label: "Draft" },
  scheduled: { variant: "outline" as const, label: "Scheduled" },
  sent: { variant: "default" as const, label: "Sent" },
  paid: { variant: "default" as const, label: "Paid" },
  overdue: { variant: "destructive" as const, label: "Overdue" },
  cancelled: { variant: "destructive" as const, label: "Cancelled" },
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
