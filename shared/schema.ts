import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "viewed", "partial", "paid", "overdue", "cancelled", "refunded"]);
export const paymentMethodEnum = pgEnum("payment_method", ["bank_transfer", "credit_card", "paypal", "cash", "check", "other"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const recurrenceFrequencyEnum = pgEnum("recurrence_frequency", ["weekly", "biweekly", "monthly", "quarterly", "yearly"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username"),
  password: text("password"), // Made optional for OAuth users
  provider: text("provider").default("local"), // "local", "google", "github"
  providerId: text("provider_id"), // Google/GitHub user ID
  isEmailVerified: boolean("is_email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // Cascade delete clients when user deleted
  // Contact Information
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  website: text("website"),
  // Legacy address field (for backward compatibility)
  address: text("address"),
  // Business Details
  taxId: text("tax_id"),
  paymentTerms: integer("payment_terms").default(30),
  currency: text("currency").default("EUR"),
  // Metadata
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // Cascade delete invoices when user deleted
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: 'restrict' }), // Prevent deleting client with invoices
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
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }), // Cascade delete line items when invoice deleted
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // Cascade delete services when user deleted
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").default("item"), // "item", "hour", "day", etc
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true }).extend({
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true }).extend({
  date: z.string().transform((str) => new Date(str)),
  subtotal: z.union([z.string(), z.number()])
    .transform(val => String(val))
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num < 100000000;
    }, "Subtotal must be between 0 and 99,999,999.99")
    .refine(val => /^\d+(\.\d{0,2})?$/.test(val), "Subtotal must have max 2 decimal places"),
  tax: z.union([z.string(), z.number()])
    .transform(val => String(val))
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num < 100000000;
    }, "Tax must be between 0 and 99,999,999.99")
    .refine(val => /^\d+(\.\d{0,2})?$/.test(val), "Tax must have max 2 decimal places"),
  taxRate: z.union([z.string(), z.number()])
    .transform(val => String(val))
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, "Tax rate must be between 0 and 100"),
  total: z.union([z.string(), z.number()])
    .transform(val => String(val))
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num < 100000000;
    }, "Total must be between 0 and 99,999,999.99")
    .refine(val => /^\d+(\.\d{0,2})?$/.test(val), "Total must have max 2 decimal places"),
});
export const insertLineItemSchema = createInsertSchema(lineItems).omit({ id: true }).extend({
  quantity: z.union([z.string(), z.number()])
    .transform(val => String(val))
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num < 100000000;
    }, "Quantity must be positive and less than 100,000,000")
    .refine(val => /^\d+(\.\d{0,2})?$/.test(val), "Quantity must have max 2 decimal places"),
  price: z.union([z.string(), z.number()])
    .transform(val => String(val))
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num < 100000000;
    }, "Price must be between 0 and 99,999,999.99")
    .refine(val => /^\d+(\.\d{0,2})?$/.test(val), "Price must have max 2 decimal places"),
  amount: z.union([z.string(), z.number()])
    .transform(val => String(val))
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num < 100000000;
    }, "Amount must be between 0 and 99,999,999.99")
    .refine(val => /^\d+(\.\d{0,2})?$/.test(val), "Amount must have max 2 decimal places"),
});
export const insertServiceSchema = createInsertSchema(services).omit({ id: true }).extend({
  price: z.union([z.string(), z.number()])
    .transform(val => String(val))
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num < 100000000;
    }, "Price must be between 0 and 99,999,999.99")
    .refine(val => /^\d+(\.\d{0,2})?$/.test(val), "Price must have max 2 decimal places"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type LineItem = typeof lineItems.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
