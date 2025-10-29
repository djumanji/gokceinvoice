import { useQuery, useMutation } from "@tanstack/react-query";
import { InvoiceForm } from "@/components/InvoiceForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Client } from "@shared/schema";
import { OnboardingProgressBanner } from "@/components/OnboardingProgressBanner";
import { useOnboardingGuard } from "@/hooks/use-onboarding";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function CreateInvoice() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const params = useParams();
  const invoiceId = params.id;
  const isEditing = !!invoiceId;
  const { isOnboardingComplete } = useOnboardingGuard();
  const { toast } = useToast();

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ["/api/invoices", invoiceId],
    enabled: isEditing,
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ["/api/invoices", invoiceId, "line-items"],
    enabled: isEditing,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { lineItems, clientId, bankAccountId, date, orderNumber, projectNumber, forProject, notes, taxRate } = data;

      // Calculate totals
      const subtotal = lineItems.reduce((sum: number, item: any) =>
        sum + (item.quantity * item.price), 0
      );
      const tax = subtotal * (taxRate || 0) / 100;
      const total = subtotal + tax;

      // Invoice number is generated server-side
      const invoiceData = {
        clientId,
        bankAccountId: bankAccountId || null,
        date: new Date(date).toISOString(),
        orderNumber: orderNumber || null,
        projectNumber: projectNumber || null,
        forProject: forProject || null,
        status: data.status,
        notes: notes || null,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        taxRate: (taxRate || 0).toString(),
        lineItems: lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price.toString(),
          amount: (item.quantity * item.price).toString(),
        })),
      };

      const res = await apiRequest("POST", "/api/invoices", invoiceData);
      return res;
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      // Don't show toast here - InvoiceForm will handle it
      // Don't redirect immediately - let the form handle the success state
    },
    onError: (error: any) => {
      console.error("Failed to create invoice:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("invoiceForm.invoiceCreateFailed"),
        variant: "destructive",
      });
      throw error;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { lineItems, clientId, bankAccountId, date, orderNumber, projectNumber, forProject, notes, taxRate } = data;

      const subtotal = lineItems.reduce((sum: number, item: any) =>
        sum + (item.quantity * item.price), 0
      );
      const tax = subtotal * (taxRate || 0) / 100;
      const total = subtotal + tax;

      const invoiceData = {
        clientId,
        bankAccountId: bankAccountId || null,
        date: new Date(date).toISOString(),
        orderNumber: orderNumber || null,
        projectNumber: projectNumber || null,
        forProject: forProject || null,
        status: data.status,
        notes: notes || null,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        taxRate: (taxRate || 0).toString(),
        lineItems: lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price.toString(),
          amount: (item.quantity * item.price).toString(),
        })),
      };

      const res = await apiRequest("PATCH", `/api/invoices/${invoiceId}`, invoiceData);
      return res;
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId] });
      // Don't show toast here - InvoiceForm will handle it
      // Don't redirect - let the form handle the success state
    },
    onError: (error: any) => {
      console.error("Failed to update invoice:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("invoiceForm.invoiceUpdateFailed"),
        variant: "destructive",
      });
      throw error;
    },
  });

  const handleSubmit = async (data: any, status: string) => {
    const submitData = { ...data, status };
    if (isEditing) {
      return await updateMutation.mutateAsync(submitData);
    } else {
      return await createMutation.mutateAsync(submitData);
    }
  };

  if (clientsLoading || (isEditing && invoiceLoading)) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  const initialData = isEditing && invoice ? {
    clientId: (invoice as any).clientId,
    bankAccountId: (invoice as any).bankAccountId || "",
    date: new Date((invoice as any).date).toISOString().split('T')[0],
    orderNumber: (invoice as any).orderNumber || "",
    projectNumber: (invoice as any).projectNumber || "",
    forProject: (invoice as any).forProject || "",
    taxRate: parseFloat((invoice as any).taxRate) || 0,
    notes: (invoice as any).notes || "",
    lineItems: Array.isArray(lineItems) && lineItems.length > 0 ? lineItems.map((item: any) => ({
      description: item.description,
      quantity: parseFloat(item.quantity),
      price: parseFloat(item.price),
    })) : [{ description: "", quantity: 1, price: 0 }],
  } : undefined;

  return (
    <div className="p-6 space-y-6">
      {!isOnboardingComplete && !isEditing && (
        <OnboardingProgressBanner currentStep="invoices" />
      )}
      
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/invoices")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? t("invoiceForm.editInvoice") : t("invoiceForm.createInvoice")}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? t("invoiceForm.editInvoiceDesc") : t("invoiceForm.createInvoiceDesc")}
          </p>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{t("invoiceForm.needClientFirst")}</p>
          <Button onClick={() => setLocation("/clients")}>{t("invoiceForm.goToClients")}</Button>
        </div>
      ) : (
        <InvoiceForm
          clients={clients as any}
          onSubmit={handleSubmit}
          initialData={initialData}
          isLoading={createMutation.isPending || updateMutation.isPending}
          invoiceId={invoiceId}
          invoiceStatus={(invoice as any)?.status}
        />
      )}
    </div>
  );
}
