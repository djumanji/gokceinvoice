import { FileText, DollarSign, Clock, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { InvoiceTable } from "@/components/InvoiceTable";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  // todo: remove mock functionality
  const mockInvoices = [
    {
      id: "1",
      invoiceNumber: "INV-001",
      clientName: "Acme Corp",
      date: new Date(2025, 9, 1),
      dueDate: new Date(2025, 9, 31),
      total: 2500.0,
      status: "paid" as const,
    },
    {
      id: "2",
      invoiceNumber: "INV-002",
      clientName: "TechStart Inc",
      date: new Date(2025, 9, 15),
      dueDate: new Date(2025, 10, 15),
      total: 1200.5,
      status: "sent" as const,
    },
    {
      id: "3",
      invoiceNumber: "INV-003",
      clientName: "Design Studio",
      date: new Date(2025, 8, 20),
      dueDate: new Date(2025, 9, 5),
      total: 850.0,
      status: "overdue" as const,
    },
    {
      id: "4",
      invoiceNumber: "INV-004",
      clientName: "Global Solutions",
      date: new Date(2025, 9, 20),
      dueDate: new Date(2025, 10, 20),
      total: 3400.0,
      status: "draft" as const,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your invoices and payments</p>
        </div>
        <Button onClick={() => setLocation("/invoices/new")} data-testid="button-create-invoice">
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceTable
            invoices={mockInvoices}
            onView={(id) => console.log("View invoice:", id)}
            onEdit={(id) => setLocation(`/invoices/edit/${id}`)}
            onDelete={(id) => console.log("Delete invoice:", id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
