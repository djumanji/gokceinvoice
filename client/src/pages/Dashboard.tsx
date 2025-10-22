import { useQuery } from "@tanstack/react-query";
import { FileText, DollarSign, Clock, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { InvoiceTable } from "@/components/InvoiceTable";
import { EmptyState } from "@/components/EmptyState";
import { useLocation } from "wouter";
import type { Invoice, Client } from "@shared/schema";

interface InvoiceWithClient extends Invoice {
  clientName: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const invoicesWithClients: InvoiceWithClient[] = invoices.map(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    return {
      ...invoice,
      clientName: client?.name || "Unknown Client",
    };
  });

  const recentInvoices = invoicesWithClients
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === "paid").length,
    paidAmount: invoices
      .filter(i => i.status === "paid")
      .reduce((sum, i) => sum + parseFloat(i.total), 0),
    pending: invoices
      .filter(i => i.status === "sent")
      .reduce((sum, i) => sum + parseFloat(i.total), 0),
    overdue: invoices
      .filter(i => i.status === "overdue")
      .reduce((sum, i) => sum + parseFloat(i.total), 0),
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      try {
        const response = await fetch(`/api/invoices/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          window.location.reload();
        }
      } catch (error) {
        console.error("Failed to delete invoice:", error);
      }
    }
  };

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
          value={stats.total}
          icon={FileText}
        />
        <StatCard
          title="Paid"
          value={`€${stats.paidAmount.toFixed(2)}`}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="Pending"
          value={`€${stats.pending.toFixed(2)}`}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Overdue"
          value={`€${stats.overdue.toFixed(2)}`}
          icon={DollarSign}
          color="danger"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : recentInvoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              description="Get started by creating your first invoice."
              actionLabel="Create Invoice"
              onAction={() => setLocation("/invoices/new")}
            />
          ) : (
            <InvoiceTable
              invoices={recentInvoices.map(inv => ({
                ...inv,
                date: new Date(inv.date),
                dueDate: new Date(inv.date),
                total: parseFloat(inv.total),
                status: inv.status as any,
              }))}
              onView={(id) => setLocation(`/invoices/${id}`)}
              onEdit={(id) => setLocation(`/invoices/edit/${id}`)}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
