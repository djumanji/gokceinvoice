import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Plus, Trash2 } from "lucide-react";
import { InvoicePreview } from "./InvoicePreview";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Client } from "@shared/schema";

interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: string;
  unit?: string;
}

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  price: z.number().min(0, "Price must be positive"),
});

const invoiceFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  date: z.string(),
  orderNumber: z.string().optional(),
  projectNumber: z.string().optional(),
  forProject: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item required"),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface LineItem {
  description: string;
  quantity: number;
  price: number;
}


interface InvoiceFormProps {
  clients: Client[];
  onSubmit: (data: InvoiceFormData, status: string) => void;
  initialData?: Partial<InvoiceFormData>;
  isLoading?: boolean;
}

export function InvoiceForm({ clients, onSubmit, initialData, isLoading = false }: InvoiceFormProps) {
  // Fetch user data for invoice header/footer
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/auth/me");
    },
  });

  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.lineItems || [{ description: "", quantity: 1, price: 0 }]
  );
  const [taxRate, setTaxRate] = useState<number>(initialData?.taxRate || 0);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [newServiceData, setNewServiceData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    unit: "item",
  });
  const [pendingLineItemIndex, setPendingLineItemIndex] = useState<number | null>(null);

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/services", data),
    onSuccess: async (response) => {
      const newService = await response.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setShowServiceDialog(false);
      setNewServiceData({ name: "", description: "", category: "", price: "", unit: "item" });
      
      if (pendingLineItemIndex !== null) {
        const updated = [...lineItems];
        updated[pendingLineItemIndex] = {
          description: newService.name,
          quantity: 1,
          price: parseFloat(newService.price),
        };
        setLineItems(updated);
        setPendingLineItemIndex(null);
      }
    },
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: initialData?.clientId || "",
      date: initialData?.date || format(new Date(), "yyyy-MM-dd"),
      orderNumber: initialData?.orderNumber || "",
      projectNumber: initialData?.projectNumber || "",
      forProject: initialData?.forProject || "",
      taxRate: initialData?.taxRate || 0,
      notes: initialData?.notes || "",
      lineItems: lineItems,
    },
  });

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleServiceSelect = (index: number, value: string) => {
    if (value === "add-new") {
      setPendingLineItemIndex(index);
      setShowServiceDialog(true);
    } else {
      const service = services.find((s) => s.id === value);
      if (service) {
        const updated = [...lineItems];
        updated[index] = {
          description: service.name,
          quantity: 1,
          price: parseFloat(service.price),
        };
        setLineItems(updated);
      }
    }
  };

  const handleNewServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createServiceMutation.mutate({
      name: newServiceData.name,
      description: newServiceData.description || undefined,
      category: newServiceData.category || undefined,
      price: parseFloat(newServiceData.price),
      unit: newServiceData.unit,
    });
  };

  const handleSubmit = async (status: "draft" | "sent") => {
    // For "draft" status, allow saving without full validation
    // For "sent" status, require validation
    if (status === "sent") {
      const isValid = await form.trigger();
      if (!isValid) {
        return;
      }
    }
    
    const data = { ...form.getValues(), lineItems, taxRate };
    onSubmit(data, status);
  };

  const selectedClient = clients.find((c) => c.id === form.watch("clientId"));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-date" />
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
                    <FormControl>
                      <Input placeholder="e.g., Bracha Bridge" {...field} data-testid="input-for-project" />
                    </FormControl>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle>Line Items</CardTitle>
            <Button size="sm" onClick={addLineItem} data-testid="button-add-line-item">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-start" data-testid={`line-item-${index}`}>
                <div className="flex-1 space-y-2">
                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Select
                      value={services.find((s) => s.name === item.description && parseFloat(s.price) === item.price)?.id || ""}
                      onValueChange={(value) => handleServiceSelect(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - €{parseFloat(service.price).toFixed(2)}
                          </SelectItem>
                        ))}
                        <SelectItem value="add-new" className="text-primary font-medium">
                          <Plus className="w-4 h-4 mr-2 inline" /> Add New Service
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                        data-testid={`input-quantity-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => updateLineItem(index, "price", parseFloat(e.target.value) || 0)}
                        data-testid={`input-price-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total</Label>
                      <div className="flex items-center h-10 px-3 font-mono font-medium text-sm border rounded-md bg-muted">
                        €{(item.quantity * item.price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                {lineItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
                    data-testid={`button-remove-${index}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Add New Service Dialog */}
        <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleNewServiceSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Service Name *</Label>
                <Input
                  value={newServiceData.name}
                  onChange={(e) => setNewServiceData({ ...newServiceData, name: e.target.value })}
                  required
                  placeholder="e.g., Web Development"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newServiceData.description}
                  onChange={(e) => setNewServiceData({ ...newServiceData, description: e.target.value })}
                  placeholder="Service description"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={newServiceData.category}
                  onChange={(e) => setNewServiceData({ ...newServiceData, category: e.target.value })}
                  placeholder="e.g., Development, Consulting"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newServiceData.price}
                    onChange={(e) => setNewServiceData({ ...newServiceData, price: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select
                    value={newServiceData.unit}
                    onValueChange={(value) => setNewServiceData({ ...newServiceData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="item">Item</SelectItem>
                      <SelectItem value="hour">Hour</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowServiceDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createServiceMutation.isPending}
                >
                  {createServiceMutation.isPending ? "Adding..." : "Add Service"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => handleSubmit("draft")}
            variant="outline"
            data-testid="button-save-draft"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save as Draft"}
          </Button>
          <Button 
            onClick={() => handleSubmit("sent")} 
            data-testid="button-mark-sent"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Mark as Sent"}
          </Button>
        </div>
      </div>

      <div className="sticky top-4">
        <InvoicePreview
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
          // Company data
          companyName={user?.companyName}
          companyAddress={user?.address}
          companyPhone={user?.phone}
          companyTaxId={user?.taxOfficeId}
          // Bank details
          swiftCode={user?.swiftCode}
          iban={user?.iban}
          accountHolderName={user?.accountHolderName}
          bankAddress={user?.bankAddress}
          // Footer contact
          userName={user?.name}
          userPhone={user?.phone}
          userEmail={user?.email}
        />
      </div>
    </div>
  );
}
