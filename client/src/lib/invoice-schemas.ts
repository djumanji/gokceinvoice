import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  price: z.number().min(0, "Price must be positive"),
});

export const invoiceFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  bankAccountId: z.string().optional(),
  date: z.string(),
  orderNumber: z.string().optional(),
  projectNumber: z.string().optional(),
  forProject: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item required"),
});

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

export interface LineItem {
  description: string;
  quantity: number;
  price: number;
}

