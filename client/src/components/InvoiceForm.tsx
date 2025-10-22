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
import { StatusBadge } from "./StatusBadge";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be positive"),
});

const invoiceFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  date: z.string(),
  dueDate: z.string(),
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
  clients: Array<{ id: string; name: string }>;
  onSubmit: (data: InvoiceFormData, status: string) => void;
  initialData?: Partial<InvoiceFormData>;
}

export function InvoiceForm({ clients, onSubmit, initialData }: InvoiceFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.lineItems || [{ description: "", quantity: 1, price: 0 }]
  );
  const [previewStatus, setPreviewStatus] = useState<"draft" | "sent">("draft");

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: initialData?.clientId || "",
      date: initialData?.date || format(new Date(), "yyyy-MM-dd"),
      dueDate: initialData?.dueDate || format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      notes: initialData?.notes || "",
      lineItems: lineItems,
    },
  });

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateTotal = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotal();

  const handleSubmit = (status: "draft" | "sent") => {
    setPreviewStatus(status);
    const data = { ...form.getValues(), lineItems };
    onSubmit(data, status);
  };

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

              <div className="grid grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-due-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 0)}
                      data-testid={`input-quantity-${index}`}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateLineItem(index, "price", parseFloat(e.target.value) || 0)}
                      data-testid={`input-price-${index}`}
                    />
                    <div className="flex items-center justify-end font-mono font-medium">
                      ${(item.quantity * item.price).toFixed(2)}
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

      <div>
        <Card className="sticky top-4">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <CardTitle>Invoice Preview</CardTitle>
            <StatusBadge status={previewStatus} />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-mono font-semibold">INV-{String(Math.floor(Math.random() * 1000)).padStart(3, "0")}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Date</p>
                <p>{form.watch("date") && format(new Date(form.watch("date")), "MMM dd, yyyy")}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Bill To</p>
              <p className="font-semibold">
                {clients.find((c) => c.id === form.watch("clientId"))?.name || "Select a client"}
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                {lineItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.description || "Line item"}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-mono">${(item.quantity * item.price).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span className="font-mono">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="font-mono">${total.toFixed(2)}</span>
              </div>
            </div>

            {form.watch("notes") && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{form.watch("notes")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
