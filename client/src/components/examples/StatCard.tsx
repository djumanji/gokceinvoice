import { StatCard } from "../StatCard";
import { FileText, DollarSign, Clock, CheckCircle2 } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <StatCard
        title="Total Invoices"
        value="24"
        icon={FileText}
        trend={{ value: "12%", isPositive: true }}
      />
      <StatCard
        title="Paid"
        value="$12,450"
        icon={CheckCircle2}
        color="success"
        trend={{ value: "8%", isPositive: true }}
      />
      <StatCard
        title="Pending"
        value="$3,200"
        icon={Clock}
        color="warning"
      />
      <StatCard
        title="Overdue"
        value="$850"
        icon={DollarSign}
        color="danger"
        trend={{ value: "2%", isPositive: false }}
      />
    </div>
  );
}
