import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceTable } from "@/components/InvoiceTable";
import { EmptyState } from "@/components/EmptyState";
import { FileText } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Invoice, Client } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface InvoiceWithClient extends Invoice {
  clientName: string;
}

export default function Invoices() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: invoices = [], isLoading, error: invoicesError } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: clients = [], error: clientsError } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const invoicesWithClients: InvoiceWithClient[] = invoices.map(invoice => {
    const client = clients?.find(c => c.id === invoice.clientId);
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

  // PDF Download function
  const handleDownloadPDF = async (id: string) => {
    try {
      // Navigate to the invoice view page to capture the preview
      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) {
        toast({
          title: "Error",
          description: "Invoice not found",
          variant: "destructive",
        });
        return;
      }

      // Open the invoice in a new tab for PDF generation
      const newWindow = window.open(`/invoices/${id}`, '_blank');
      if (newWindow) {
        // Wait for the page to load, then trigger PDF download
        setTimeout(() => {
          newWindow.postMessage({ action: 'downloadPDF' }, window.location.origin);
        }, 2000);
      }
    } catch (error) {
      console.error('PDF download failed:', error);
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Copy shareable link function
  const handleCopyLink = async (id: string) => {
    try {
      const shareableUrl = `${window.location.origin}/invoices/view/${id}`;

      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareableUrl);
      } else {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = shareableUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      toast({
        title: "Link copied!",
        description: "Invoice link has been copied to clipboard.",
      });
    } catch (error) {
      console.error('Copy link failed:', error);
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
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
              onDownloadPDF={handleDownloadPDF}
              onCopyLink={handleCopyLink}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
