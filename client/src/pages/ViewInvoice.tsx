import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Printer } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { InvoicePreview } from "@/components/InvoicePreview";
import type { Client } from "@shared/schema";

export default function ViewInvoice() {
  const { t } = useTranslation();
  const params = useParams();
  const invoiceId = params.id;
  const [, setLocation] = useLocation();

  // Fetch invoice
  const { data: invoice, isLoading } = useQuery({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: async () => {
      return await apiRequest("GET", `/api/invoices/${invoiceId}`);
    },
  });

  // Fetch line items
  const { data: lineItems = [] } = useQuery({
    queryKey: ["/api/invoices", invoiceId, "line-items"],
    queryFn: async () => {
      return await apiRequest("GET", `/api/invoices/${invoiceId}/line-items`);
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/auth/me");
    },
  });

  const client = clients.find((c) => c.id === invoice?.clientId);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("invoice.notFound")}</p>
          <Button onClick={() => setLocation("/invoices")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => setLocation("/invoices")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => setLocation(`/invoices/edit/${invoiceId}`)} variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <InvoicePreview
            invoice={invoice}
            lineItems={lineItems}
            client={client}
            companyName={user?.companyName}
            companyAddress={user?.address}
            companyPhone={user?.phone}
            companyTaxId={user?.taxOfficeId}
            swiftCode={user?.swiftCode}
            iban={user?.iban}
            accountHolderName={user?.accountHolderName}
            bankAddress={user?.bankAddress}
            userName={user?.name}
            userPhone={user?.phone}
            userEmail={user?.email}
          />
        </CardContent>
      </Card>
    </div>
  );
}

