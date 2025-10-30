import { useQuery } from "@tanstack/react-query";
import { FileText, DollarSign, Clock, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { InvoiceTable } from "@/components/InvoiceTable";
import { EmptyState } from "@/components/EmptyState";
import { useLocation } from "wouter";
import { useOnboardingGuard } from "@/hooks/use-onboarding";
import { useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { safeParseFloat } from "@/lib/numberUtils";
import { useTranslation } from "react-i18next";
import type { Invoice, Client } from "@shared/schema";

interface InvoiceWithClient extends Invoice {
  clientName: string;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { isOnboardingComplete, isLoading: onboardingLoading } = useOnboardingGuard();

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { data: invoices = [], isLoading: invoicesLoading, error: invoicesError } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    enabled: isOnboardingComplete && !onboardingLoading, // Only fetch when onboarding is complete
  });

  const { data: clients = [], error: clientsError } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: isOnboardingComplete && !onboardingLoading, // Only fetch when onboarding is complete
  });

  // Redirect to onboarding if not complete
  useEffect(() => {
    if (!onboardingLoading && !isOnboardingComplete) {
      setLocation("/onboarding");
    }
  }, [isOnboardingComplete, onboardingLoading, setLocation]);

  // Show loading or empty state while checking
  if (onboardingLoading || !isOnboardingComplete) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  const invoicesWithClients: InvoiceWithClient[] = invoices.map(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    return {
      ...invoice,
      clientName: client?.name || t("invoice.unknownClient"),
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
      .reduce((sum, i) => sum + safeParseFloat(i.total, 0), 0),
    pending: invoices
      .filter(i => i.status === "sent")
      .reduce((sum, i) => sum + safeParseFloat(i.total, 0), 0),
    overdue: invoices
      .filter(i => i.status === "overdue")
      .reduce((sum, i) => sum + safeParseFloat(i.total, 0), 0),
  };

  const handleDelete = async (id: string) => {
    if (confirm(t("dashboard.deleteConfirmation"))) {
      try {
        await apiRequest("DELETE", `/api/invoices/${id}`);
        queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      } catch (error) {
        console.error("Failed to delete invoice:", error);
      }
    }
  };

  if (invoicesError || clientsError) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <p className="text-destructive">
                {t("common.error")}: {(invoicesError || clientsError)?.message || "Failed to load data"}
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                {t("common.retry")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <Button onClick={() => setLocation("/invoices/new")} data-testid="button-create-invoice">
          <Plus className="w-4 h-4" />
          {t("dashboard.createInvoice")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("dashboard.totalInvoices")}
          value={stats.total}
          icon={FileText}
        />
        <StatCard
          title={t("dashboard.paid")}
          value={`€${stats.paidAmount.toFixed(2)}`}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title={t("dashboard.pending")}
          value={`€${stats.pending.toFixed(2)}`}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title={t("dashboard.overdue")}
          value={`€${stats.overdue.toFixed(2)}`}
          icon={Clock}
          color="danger"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentInvoices")}</CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
          ) : recentInvoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t("dashboard.noInvoicesYet")}
              description={t("dashboard.noInvoicesDesc")}
              actionLabel={t("dashboard.createInvoice")}
              onAction={() => setLocation("/invoices/new")}
            />
          ) : (
            <InvoiceTable
              invoices={recentInvoices.map(inv => ({
                ...inv,
                date: new Date(inv.date),
                dueDate: new Date(inv.date),
                total: safeParseFloat(inv.total, 0),
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
