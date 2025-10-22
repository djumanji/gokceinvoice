import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  address: text("address"),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientId: varchar("client_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  orderNumber: text("order_number"),
  projectNumber: text("project_number"),
  forProject: text("for_project"),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const lineItems = pgTable("line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true }).extend({
  date: z.string().transform((str) => new Date(str)),
  subtotal: z.union([z.string(), z.number()]).transform(val => String(val)),
  tax: z.union([z.string(), z.number()]).transform(val => String(val)),
  taxRate: z.union([z.string(), z.number()]).transform(val => String(val)),
  total: z.union([z.string(), z.number()]).transform(val => String(val)),
});
export const insertLineItemSchema = createInsertSchema(lineItems).omit({ id: true }).extend({
  quantity: z.union([z.string(), z.number()]).transform(val => String(val)),
  price: z.union([z.string(), z.number()]).transform(val => String(val)),
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type LineItem = typeof lineItems.$inferSelect;
