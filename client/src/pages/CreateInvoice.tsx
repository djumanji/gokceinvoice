import { useQuery, useMutation } from "@tanstack/react-query";
import { InvoiceForm } from "@/components/InvoiceForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

export default function CreateInvoice() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const invoiceId = params.id;
  const isEditing = !!invoiceId;

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
      const { lineItems, clientId, date, orderNumber, projectNumber, forProject, notes } = data;
      
      // Calculate totals
      const subtotal = lineItems.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.price), 0
      );
      const tax = 0;
      const total = subtotal + tax;
      
      // Generate invoice number
      const invoiceNumber = `INV-${String(Math.floor(Math.random() * 100000)).padStart(6, "0")}`;
      
      const invoiceData = {
        invoiceNumber,
        clientId,
        date: new Date(date).toISOString(),
        orderNumber: orderNumber || null,
        projectNumber: projectNumber || null,
        forProject: forProject || null,
        status: data.status,
        notes: notes || null,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        lineItems: lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price.toString(),
          amount: (item.quantity * item.price).toString(),
        })),
      };

      return apiRequest("POST", "/api/invoices", invoiceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setLocation("/invoices");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { lineItems, clientId, date, orderNumber, projectNumber, forProject, notes } = data;
      
      const subtotal = lineItems.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.price), 0
      );
      const tax = 0;
      const total = subtotal + tax;
      
      const invoiceData = {
        clientId,
        date: new Date(date).toISOString(),
        orderNumber: orderNumber || null,
        projectNumber: projectNumber || null,
        forProject: forProject || null,
        status: data.status,
        notes: notes || null,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        lineItems: lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price.toString(),
          amount: (item.quantity * item.price).toString(),
        })),
      };

      return apiRequest("PATCH", `/api/invoices/${invoiceId}`, invoiceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setLocation("/invoices");
    },
  });

  const handleSubmit = (data: any, status: string) => {
    const submitData = { ...data, status };
    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (clientsLoading || (isEditing && invoiceLoading)) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const initialData = isEditing && invoice ? {
    clientId: (invoice as any).clientId,
    date: new Date((invoice as any).date).toISOString().split('T')[0],
    orderNumber: (invoice as any).orderNumber || "",
    projectNumber: (invoice as any).projectNumber || "",
    forProject: (invoice as any).forProject || "",
    notes: (invoice as any).notes || "",
    lineItems: Array.isArray(lineItems) && lineItems.length > 0 ? lineItems.map((item: any) => ({
      description: item.description,
      quantity: parseFloat(item.quantity),
      price: parseFloat(item.price),
    })) : [{ description: "", quantity: 1, price: 0 }],
  } : undefined;

  return (
    <div className="p-6 space-y-6">
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
            {isEditing ? "Edit Invoice" : "Create Invoice"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update invoice details" : "Fill in the details to create a new invoice"}
          </p>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">You need to add a client first before creating an invoice.</p>
          <Button onClick={() => setLocation("/clients")}>Go to Clients</Button>
        </div>
      ) : (
        <InvoiceForm
          clients={clients as any}
          onSubmit={handleSubmit}
          initialData={initialData}
        />
      )}
    </div>
  );
}
