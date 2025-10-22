import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceTable } from "@/components/InvoiceTable";
import { EmptyState } from "@/components/EmptyState";
import { FileText } from "lucide-react";
import { useLocation } from "wouter";

export default function Invoices() {
  const [, setLocation] = useLocation();
  const [hasInvoices] = useState(true); // todo: remove mock functionality

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
    {
      id: "5",
      invoiceNumber: "INV-005",
      clientName: "Startup Labs",
      date: new Date(2025, 9, 22),
      dueDate: new Date(2025, 10, 22),
      total: 1750.0,
      status: "sent" as const,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage and track all your invoices</p>
        </div>
        <Button onClick={() => setLocation("/invoices/new")} data-testid="button-create-invoice">
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

      {hasInvoices ? (
        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
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
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              description="Get started by creating your first invoice. Track payments and manage your billing effortlessly."
              actionLabel="Create Invoice"
              onAction={() => setLocation("/invoices/new")}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
