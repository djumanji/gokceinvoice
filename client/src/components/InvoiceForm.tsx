import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit } from "lucide-react";
import { InvoicePreview } from "./InvoicePreview";
import { InvoiceSuccessBanner } from "./invoice/InvoiceSuccessBanner";
import { SendLinkModal } from "./invoice/SendLinkModal";
import { InvoiceStatusBadge } from "./invoice/InvoiceStatusBadge";
import { LineItemsSection } from "./invoice/LineItemsSection";
import { ServiceDialog } from "./invoice/ServiceDialog";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useInvoiceForm } from "@/hooks/use-invoice-form";
import { useLineItems } from "@/hooks/use-line-items";
import { generateInvoicePDF } from "@/lib/pdf-utils";
import { invoiceFormSchema, type InvoiceFormData } from "@/lib/invoice-schemas";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "@shared/schema";

interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: string;
  unit?: string;
}

interface InvoiceFormProps {
  clients: Client[];
  onSubmit: (data: InvoiceFormData, status: string) => Promise<any>;
  initialData?: Partial<InvoiceFormData>;
  isLoading?: boolean;
  invoiceId?: string;
  invoiceStatus?: string;
}

export function InvoiceForm({ clients, onSubmit, initialData, isLoading = false, invoiceId, invoiceStatus }: InvoiceFormProps) {
  const { toast } = useToast();
  
  // Component state
  const [isSaved, setIsSaved] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<any>(null);
  const [taxRate, setTaxRate] = useState<number>(initialData?.taxRate || 0);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [pendingLineItemIndex, setPendingLineItemIndex] = useState<number | null>(null);

  // Permission checks
  const canEdit = !invoiceStatus || invoiceStatus === "draft" || invoiceStatus === "sent";
  const isPaid = invoiceStatus === "paid";
  const isCancelled = invoiceStatus === "cancelled";

  // Data fetching
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => await apiRequest("GET", "/api/auth/me"),
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["/api/bank-accounts"],
    queryFn: async () => await apiRequest("GET", "/api/bank-accounts"),
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Line items management
  const {
    lineItems,
    selectedServiceIds,
    addLineItem,
    removeLineItem,
    updateLineItem,
    setLineItemService,
  } = useLineItems({ initialItems: initialData?.lineItems });

  // Form management
  const { form, validateForm, getFormData } = useInvoiceForm({
    initialData,
    lineItems,
    taxRate,
  });

  // Fetch projects for selected client
  const selectedClientId = form.watch("clientId");
  const { data: clientProjects = [] } = useQuery<Array<{ id: string; name: string; description?: string | null }>>({
    queryKey: selectedClientId ? [`/api/clients/${selectedClientId}/projects`] : [""],
    enabled: !!selectedClientId,
  });

  // Handlers
  const handleServiceSelect = (index: number, value: string) => {
    if (value === "add-new") {
      setPendingLineItemIndex(index);
      setShowServiceDialog(true);
    } else {
      const service = services.find((s) => s.id === value);
      if (service) {
        setLineItemService(index, service.id, service.name, parseFloat(service.price));
      }
    }
  };

  const handleServiceCreated = (newService: { id: string; name: string; price: string }) => {
    if (pendingLineItemIndex !== null) {
      setLineItemService(pendingLineItemIndex, newService.id, newService.name, parseFloat(newService.price));
      setPendingLineItemIndex(null);
    }
  };

  const handleSubmit = async () => {
    const validation = await validateForm();
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.error || "Please fill in all required fields",
        variant: "destructive",
      });
        return;
    }

    try {
      const data = getFormData();
      const result = await onSubmit(data, "draft");
      if (result) {
        setSavedInvoice(result);
        setIsSaved(true);
        setIsReadOnly(true);
        toast({
          title: "Invoice Saved",
          description: "Invoice has been saved as draft",
        });
      }
    } catch (error: any) {
      console.error('Failed to save invoice:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadPDF = async () => {
    try {
      const invoiceNumber = savedInvoice?.invoiceNumber || '000001';
      await generateInvoicePDF(invoiceNumber);
      toast({
        title: "PDF Downloaded",
        description: `Invoice ${invoiceNumber} has been downloaded`,
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyShareableLink = () => {
    if (!savedInvoice) return;
    const selectedClient = clients.find((c) => c.id === form.watch("clientId"));
    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Client not found",
        variant: "destructive",
      });
      return;
    }
    setShowSendModal(true);
  };

  const viewInvoice = () => {
    if (savedInvoice?.id) {
      window.open(`/invoices/${savedInvoice.id}`, '_blank');
    }
  };

  const editInvoice = () => {
    setIsReadOnly(false);
    setIsSaved(false);
  };

  // Derived values
  const selectedClient = clients.find((c) => c.id === form.watch("clientId"));
  const selectedBankAccountId = form.watch("bankAccountId");
  const selectedBankAccount = bankAccounts.find((bank: any) => bank.id === selectedBankAccountId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        {/* Status Banner */}
        {!canEdit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <InvoiceStatusBadge status={invoiceStatus as any} />
              <span className="text-red-800 font-medium">
                {isPaid ? "This invoice has been paid and cannot be edited" : 
                 isCancelled ? "This invoice has been cancelled and cannot be edited" : 
                 "This invoice cannot be edited"}
              </span>
            </div>
          </div>
        )}

        {/* Invoice Details Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Invoice Details
              {invoiceStatus && <InvoiceStatusBadge status={invoiceStatus as any} />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly || !canEdit}>
                      <FormControl>
                        <SelectTrigger data-testid="select-client">
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {bankAccounts.length > 0 && (
                <FormField
                  control={form.control}
                  name="bankAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly || !canEdit}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bank account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bankAccounts.map((bank: any) => (
                            <SelectItem key={bank.id} value={bank.id}>
                              {bank.bankName} - {bank.currency} {bank.isDefault && "(Default)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-date" disabled={isReadOnly || !canEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order #</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 0025091" {...field} data-testid="input-order-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project #</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 0299505" {...field} data-testid="input-project-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="forProject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>For (Project Name)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""} 
                      disabled={isReadOnly || !canEdit || !selectedClientId}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-for-project">
                          <SelectValue placeholder={selectedClientId ? "Select a project" : "Select a client first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientProjects.length > 0 ? (
                          clientProjects.map((project) => (
                            <SelectItem key={project.id} value={project.name}>
                              {project.name}
                            </SelectItem>
                          ))
                        ) : selectedClientId ? (
                          <SelectItem value="" disabled>
                            No projects found
                          </SelectItem>
                        ) : (
                          <SelectItem value="" disabled>
                            Select a client first
                          </SelectItem>
                        )}
                        {selectedClientId && (
                          <SelectItem value="__custom__" className="text-primary font-medium">
                            + Custom Project Name
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {field.value === "__custom__" || (!clientProjects.find(p => p.name === field.value) && field.value) ? (
                      <FormControl>
                        <Input 
                          placeholder="e.g., Bracha Bridge" 
                          value={field.value === "__custom__" ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          onBlur={field.onBlur}
                          data-testid="input-for-project-custom"
                        />
                      </FormControl>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="100"
                        placeholder="0.00" 
                        {...field}
                        value={taxRate}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setTaxRate(value);
                          field.onChange(value);
                        }}
                        data-testid="input-tax-rate" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes..."
                        className="min-h-20"
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </CardContent>
        </Card>

        {/* Line Items Section */}
        <LineItemsSection
          lineItems={lineItems}
          services={services}
          selectedServiceIds={selectedServiceIds}
          onAddItem={addLineItem}
          onRemoveItem={removeLineItem}
          onUpdateItem={updateLineItem}
          onSelectService={handleServiceSelect}
        />

        {/* Service Dialog */}
        <ServiceDialog
          isOpen={showServiceDialog}
          onClose={() => setShowServiceDialog(false)}
          onServiceCreated={handleServiceCreated}
        />

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {!isSaved && canEdit ? (
          <Button
              onClick={handleSubmit}
              data-testid="button-save-invoice"
            disabled={isLoading}
          >
              {isLoading ? "Saving..." : "Save Invoice"}
          </Button>
          ) : isSaved && canEdit ? (
          <Button 
              onClick={editInvoice}
              variant="outline"
              data-testid="button-edit-invoice"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Invoice
          </Button>
          ) : !canEdit ? (
            <div className="text-sm text-muted-foreground">
              This invoice cannot be edited due to its status.
            </div>
          ) : null}
        </div>
      </div>

      {/* Preview Section */}
      <div className="sticky top-4">
        {isSaved && savedInvoice && (
          <InvoiceSuccessBanner
            invoiceNumber={savedInvoice.invoiceNumber}
            onCopyLink={copyShareableLink}
            onDownloadPDF={downloadPDF}
            onViewInvoice={viewInvoice}
          />
        )}
        
        <div className="invoice-preview-container">
        <InvoicePreview
            invoiceNumber={savedInvoice?.invoiceNumber}
          date={form.watch("date")}
          orderNumber={form.watch("orderNumber")}
          projectNumber={form.watch("projectNumber")}
          forProject={form.watch("forProject")}
          clientName={selectedClient?.name}
          clientCompany={selectedClient?.company || undefined}
          clientAddress={selectedClient?.address || undefined}
          clientPhone={selectedClient?.phone || undefined}
          lineItems={lineItems}
          taxRate={taxRate}
          notes={form.watch("notes")}
          companyName={user?.companyName}
          companyAddress={user?.address}
          companyPhone={user?.phone}
          companyTaxId={user?.taxOfficeId}
          swiftCode={selectedBankAccount?.swiftCode || user?.swiftCode}
          iban={selectedBankAccount?.iban || user?.iban}
          accountHolderName={selectedBankAccount?.accountHolderName || user?.accountHolderName}
          bankAddress={selectedBankAccount?.bankAddress || user?.bankAddress}
          userName={user?.name}
          userPhone={user?.phone}
          userEmail={user?.email}
        />
      </div>
      </div>

      {/* Send Link Modal */}
      {savedInvoice && selectedClient && (
        <SendLinkModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          clientEmail={selectedClient.email}
          clientName={selectedClient.name}
          invoiceNumber={savedInvoice.invoiceNumber}
          total={parseFloat(savedInvoice.total)}
          shareableUrl={`${window.location.origin}/invoices/view/${savedInvoice.id}`}
        />
      )}
    </div>
  );
}
