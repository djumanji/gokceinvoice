import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceTable } from "@/components/InvoiceTable";
import { EmptyState } from "@/components/EmptyState";
import { FileText } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Invoice, Client } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface InvoiceWithClient extends Invoice {
  clientName: string;
}

export default function Invoices() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
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

  const handleDelete = async (id: string) => {
    if (confirm(t("invoices.deleteConfirmation"))) {
      try {
        await apiRequest("DELETE", `/api/invoices/${id}`);
        queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      } catch (error) {
        console.error("Failed to delete invoice:", error);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("invoices.title")}</h1>
          <p className="text-muted-foreground">{t("invoices.subtitle")}</p>
        </div>
        <Button onClick={() => setLocation("/invoices/new")} data-testid="button-create-invoice">
          <Plus className="w-4 h-4" />
          {t("invoices.createInvoice")}
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">{t("invoices.loadingInvoices")}</div>
          </CardContent>
        </Card>
      ) : invoicesWithClients.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title={t("invoices.noInvoicesYet")}
              description={t("invoices.noInvoicesDescription")}
              actionLabel={t("invoices.createInvoice")}
              onAction={() => setLocation("/invoices/new")}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("invoices.allInvoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceTable
              invoices={invoicesWithClients.map(inv => ({
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
