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
import type { Client } from "@shared/schema";

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
}

export function InvoiceForm({ clients, onSubmit, initialData }: InvoiceFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.lineItems || [{ description: "", quantity: 1, price: 0 }]
  );
  const [taxRate, setTaxRate] = useState<number>(initialData?.taxRate || 0);

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

  const handleSubmit = (status: "draft" | "sent") => {
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
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                    data-testid={`input-description-${index}`}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                      data-testid={`input-quantity-${index}`}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateLineItem(index, "price", parseFloat(e.target.value) || 0)}
                      data-testid={`input-price-${index}`}
                    />
                    <div className="flex items-center justify-end font-mono font-medium text-sm">
                      €{(item.quantity * item.price).toFixed(2)}
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

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => handleSubmit("draft")}
            variant="outline"
            data-testid="button-save-draft"
          >
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit("sent")} data-testid="button-mark-sent">
            Mark as Sent
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
        />
      </div>
    </div>
  );
}
