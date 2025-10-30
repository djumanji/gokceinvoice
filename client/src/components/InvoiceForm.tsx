import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InvoicePreview } from "./InvoicePreview";
import { InvoiceSuccessBanner } from "./invoice/InvoiceSuccessBanner";
import { SendLinkModal } from "./invoice/SendLinkModal";
import { InvoiceStatusBadge } from "./invoice/InvoiceStatusBadge";
import { LineItemsSection } from "./invoice/LineItemsSection";
import { ServiceDialog } from "./invoice/ServiceDialog";
import { InvoiceTypeSelector, type InvoiceType } from "./invoice/InvoiceTypeSelector";
import { RecurringFields } from "./invoice/RecurringFields";
import { BulkClientSelector } from "./invoice/BulkClientSelector";
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
  const [isScheduled, setIsScheduled] = useState<boolean>(!!initialData?.scheduledDate);
  
  // Invoice type state (only for new invoices, not editing)
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("one-time");
  const [recurringFields, setRecurringFields] = useState({
    frequency: "monthly",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    templateName: "",
  });
  const [bulkClientIds, setBulkClientIds] = useState<string[]>([]);
  const [showCustomProjectModal, setShowCustomProjectModal] = useState(false);
  const [customProjectData, setCustomProjectData] = useState({ name: "", description: "" });
  const queryClient = useQueryClient();

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
  const { data: clientProjects = [], isLoading: isLoadingProjects } = useQuery<Array<{ id: string; name: string; description?: string | null; projectNumber?: string | null }>>({
    queryKey: [`/api/clients/${selectedClientId || 'none'}/projects`],
    queryFn: async () => {
      if (!selectedClientId) return [];
      return await apiRequest("GET", `/api/clients/${selectedClientId}/projects`);
    },
    enabled: !!selectedClientId,
  });

  // Mutation to create custom project
  const createCustomProjectMutation = useMutation({
    mutationFn: (data: { clientId: string; name: string; description?: string }) =>
      apiRequest("POST", "/api/projects", data),
    onSuccess: async (newProject) => {
      // Refetch projects to update dropdown
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/clients/${selectedClientId}/projects`] 
      });
      await queryClient.refetchQueries({ 
        queryKey: [`/api/clients/${selectedClientId}/projects`] 
      });
      
      // Update the form field with the new project name
      form.setValue("forProject", newProject.name);
      
      // Update project number if available
      if (newProject.projectNumber) {
        form.setValue("projectNumber", newProject.projectNumber);
      }
      
      // Close modal and reset form
      setShowCustomProjectModal(false);
      setCustomProjectData({ name: "", description: "" });
      
      toast({
        title: "Project Created",
        description: "Project has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  // Auto-populate project number when project is selected
  const selectedProjectName = form.watch("forProject");
  useEffect(() => {
    if (selectedProjectName && clientProjects.length > 0) {
      const selectedProject = clientProjects.find(p => p.name === selectedProjectName);
      if (selectedProject && selectedProject.projectNumber) {
        form.setValue("projectNumber", selectedProject.projectNumber);
      } else if (!selectedProject) {
        // Clear project number if project not found (e.g., custom project name)
        form.setValue("projectNumber", "");
      }
    } else if (!selectedProjectName) {
      // Clear project number if no project is selected
      form.setValue("projectNumber", "");
    }
  }, [selectedProjectName, clientProjects, form]);

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
    console.log('[InvoiceForm] handleSubmit called');
    console.log('[InvoiceForm] Line items:', lineItems);
    console.log('[InvoiceForm] Selected client:', form.watch("clientId"));
    
    // Check if line items exist
    if (!lineItems || lineItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one line item",
        variant: "destructive",
      });
      return;
    }

    // Check if client is selected
    if (!form.watch("clientId")) {
      toast({
        title: "Validation Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }
    
    // Trigger validation which will show inline errors automatically
    const formIsValid = await form.trigger();
    console.log('[InvoiceForm] Form validation result:', formIsValid);
    
    if (!formIsValid) {
      // Get form errors to debug
      const errors = form.formState.errors;
      console.log('[InvoiceForm] Form errors:', errors);
      
      // Validation errors will be shown inline via FormMessage components
      // Scroll to first error field
      const firstErrorField = document.querySelector('[data-invalid="true"], .text-destructive');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Try to find error message elements
        const errorMessages = document.querySelectorAll('.text-destructive');
        if (errorMessages.length > 0) {
          errorMessages[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    try {
      const data = getFormData();
      console.log('[InvoiceForm] Form data:', data);
      
      // Handle recurring invoices
      if (invoiceType === "recurring" && !invoiceId) {
        if (!recurringFields.templateName) {
          toast({
            title: "Validation Error",
            description: "Template name is required for recurring invoices",
            variant: "destructive",
          });
          return;
        }
        
        const recurringData = {
          ...data,
          templateName: recurringFields.templateName,
          frequency: recurringFields.frequency,
          startDate: recurringFields.startDate,
          endDate: recurringFields.endDate || null,
          items: data.lineItems.map((item: any, index: number) => ({
            ...item,
            position: index,
          })),
        };
        
        const result = await apiRequest("POST", "/api/recurring-invoices", recurringData);
        if (result) {
          setSavedInvoice(result);
          setIsSaved(true);
          setIsReadOnly(true);
          toast({
            title: "Recurring Invoice Created",
            description: "Recurring invoice template has been created",
          });
        }
        return;
      }
      
      // Handle bulk invoices (one-time or recurring)
      if (invoiceType === "bulk" && !invoiceId) {
        if (bulkClientIds.length === 0) {
          toast({
            title: "Validation Error",
            description: "Please select at least one client for bulk invoices",
            variant: "destructive",
          });
          return;
        }

        // Check if this is a bulk recurring invoice
        const isBulkRecurring = recurringFields.templateName || false;
        
        if (isBulkRecurring) {
          // Create bulk recurring invoices
          if (!recurringFields.templateName) {
            toast({
              title: "Validation Error",
              description: "Template name is required for recurring invoices",
              variant: "destructive",
            });
            return;
          }

          const recurringInvoices = bulkClientIds.map(clientId => ({
            clientId,
            bankAccountId: data.bankAccountId || null,
            templateName: `${recurringFields.templateName} - ${clients.find(c => c.id === clientId)?.name || 'Client'}`,
            frequency: recurringFields.frequency,
            startDate: recurringFields.startDate,
            endDate: recurringFields.endDate || null,
            taxRate: (data.taxRate || 0).toString(),
            notes: data.notes || null,
            items: data.lineItems.map((item: any, index: number) => ({
              ...item,
              position: index,
            })),
          }));

          const result = await apiRequest("POST", "/api/recurring-invoices/bulk", { recurringInvoices });
          if (result) {
            setSavedInvoice(result);
            setIsSaved(true);
            setIsReadOnly(true);
            toast({
              title: "Bulk Recurring Invoices Created",
              description: `Successfully created ${result.created} recurring invoice template${result.created !== 1 ? 's' : ''}`,
            });
          }
        } else {
          // Create bulk one-time invoices
          const invoices = bulkClientIds.map(clientId => ({
            ...data,
            clientId,
          }));
          
          const result = await apiRequest("POST", "/api/invoices/bulk", { invoices });
          if (result) {
            setSavedInvoice(result);
            setIsSaved(true);
            setIsReadOnly(true);
            toast({
              title: "Bulk Invoices Created",
              description: `Successfully created ${result.created} invoice${result.created !== 1 ? 's' : ''}`,
            });
          }
        }
        return;
      }
      
      // Handle regular one-time invoice
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
            {/* Invoice Type Selector (only for new invoices) */}
            {!invoiceId && (
              <InvoiceTypeSelector
                value={invoiceType}
                onChange={setInvoiceType}
              />
            )}
            
            <Form {...form}>
              {invoiceType === "bulk" && !invoiceId ? (
                <BulkClientSelector
                  clients={clients}
                  selectedClientIds={bulkClientIds}
                  onSelectionChange={setBulkClientIds}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isReadOnly || !canEdit}>
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
              )}

              {/* Recurring Fields (for recurring and bulk recurring invoices) */}
              {(invoiceType === "recurring" || invoiceType === "bulk") && !invoiceId && (
                <RecurringFields
                  frequency={recurringFields.frequency}
                  startDate={recurringFields.startDate}
                  endDate={recurringFields.endDate}
                  templateName={recurringFields.templateName}
                  onFrequencyChange={(freq) => setRecurringFields({ ...recurringFields, frequency: freq })}
                  onStartDateChange={(date) => setRecurringFields({ ...recurringFields, startDate: date })}
                  onEndDateChange={(date) => setRecurringFields({ ...recurringFields, endDate: date })}
                  onTemplateNameChange={(name) => setRecurringFields({ ...recurringFields, templateName: name })}
                />
              )}

              {bankAccounts.length > 0 && (
                <FormField
                  control={form.control}
                  name="bankAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isReadOnly || !canEdit}>
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

              {/* Schedule for Future Sending */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule-invoice"
                  checked={isScheduled}
                  onCheckedChange={(checked) => {
                    setIsScheduled(checked as boolean);
                    if (!checked) {
                      form.setValue("scheduledDate", undefined);
                    }
                  }}
                  disabled={isReadOnly || !canEdit}
                />
                <label
                  htmlFor="schedule-invoice"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Schedule for future sending
                </label>
              </div>

              {isScheduled && (
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Send Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          data-testid="input-scheduled-date"
                          disabled={isReadOnly || !canEdit}
                          min={new Date(Date.now() + 1000 * 60 * 60).toISOString().slice(0, 16)} // At least 1 hour from now
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                  render={({ field }) => {
                    // Get project number from selected project
                    const selectedProjectName = form.watch("forProject");
                    const selectedProject = clientProjects.find(p => p.name === selectedProjectName);
                    const projectNumberValue = selectedProject?.projectNumber || field.value || "";
                    
                    return (
                      <FormItem>
                        <FormLabel>Project #</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., PRJ-000001" 
                            value={projectNumberValue}
                            disabled={true}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                            data-testid="input-project-number" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <FormField
                control={form.control}
                name="forProject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>For (Project Name)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        if (value === "__custom__") {
                          // Open modal instead of setting value
                          setShowCustomProjectModal(true);
                        } else {
                          field.onChange(value);
                        }
                      }}
                      value={field.value || undefined} 
                      disabled={isReadOnly || !canEdit || !selectedClientId}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-for-project">
                          <SelectValue placeholder={selectedClientId ? "Select a project" : "Select a client first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingProjects ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Loading projects...
                          </div>
                        ) : (clientProjects || []).length > 0 ? (
                          clientProjects.map((project) => (
                            <SelectItem key={project.id} value={project.name}>
                              {project.name}
                            </SelectItem>
                          ))
                        ) : selectedClientId ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No projects found
                          </div>
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Select a client first
                          </div>
                        )}
                        {selectedClientId && !isLoadingProjects && (
                          <SelectItem value="__custom__" className="text-primary font-medium">
                            + Custom Project Name
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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

        {/* Custom Project Modal */}
        <Dialog open={showCustomProjectModal} onOpenChange={setShowCustomProjectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="custom-project-name">Project Name *</Label>
                <Input
                  id="custom-project-name"
                  value={customProjectData.name}
                  onChange={(e) => setCustomProjectData({ ...customProjectData, name: e.target.value })}
                  placeholder="e.g., Website Redesign"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-project-description">Description</Label>
                <Textarea
                  id="custom-project-description"
                  value={customProjectData.description}
                  onChange={(e) => setCustomProjectData({ ...customProjectData, description: e.target.value })}
                  placeholder="Project description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Project Number</Label>
                <div className="text-sm font-mono text-muted-foreground bg-muted p-2 rounded">
                  Will be auto-generated (e.g., PRJ-000001)
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomProjectModal(false);
                  setCustomProjectData({ name: "", description: "" });
                }}
                disabled={createCustomProjectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!customProjectData.name.trim()) {
                    toast({
                      title: "Validation Error",
                      description: "Project name is required",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (!selectedClientId) {
                    toast({
                      title: "Error",
                      description: "Please select a client first",
                      variant: "destructive",
                    });
                    return;
                  }
                  createCustomProjectMutation.mutate({
                    clientId: selectedClientId,
                    name: customProjectData.name.trim(),
                    description: customProjectData.description.trim() || undefined,
                  });
                }}
                disabled={createCustomProjectMutation.isPending}
              >
                {createCustomProjectMutation.isPending ? "Saving..." : "Save Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {!isSaved && canEdit ? (
          <Button
              type="button"
              onClick={(e) => {
                console.log('[InvoiceForm] Save button clicked');
                console.log('[InvoiceForm] isSaved:', isSaved);
                console.log('[InvoiceForm] canEdit:', canEdit);
                console.log('[InvoiceForm] isLoading:', isLoading);
                console.log('[InvoiceForm] isReadOnly:', isReadOnly);
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }}
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
          ) : (
            <div className="text-sm text-muted-foreground">
              Debug: isSaved={String(isSaved)}, canEdit={String(canEdit)}, isLoading={String(isLoading)}
            </div>
          )}
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
          scheduledDate={form.watch("scheduledDate")}
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
