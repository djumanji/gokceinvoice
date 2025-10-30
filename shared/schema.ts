import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "scheduled", "sent", "viewed", "partial", "paid", "overdue", "cancelled", "refunded"]);
export const paymentMethodEnum = pgEnum("payment_method", ["bank_transfer", "credit_card", "paypal", "cash", "check", "other"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const recurrenceFrequencyEnum = pgEnum("recurrence_frequency", ["weekly", "biweekly", "monthly", "quarterly", "yearly"]);
export const currencyEnum = pgEnum("currency", ["USD", "EUR", "GBP", "AUD", "TRY"]);
export const companySizeEnum = pgEnum("company_size", ["solo", "2-10", "11-50", "51-200", "201-500", "500+"]);
export const industryEnum = pgEnum("industry", [
  "technology",
  "consulting",
  "marketing",
  "design",
  "finance",
  "healthcare",
  "education",
  "legal",
  "real-estate",
  "construction",
  "manufacturing",
  "retail",
  "hospitality",
  "transportation",
  "media",
  "nonprofit",
  "other"
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username"),
  password: text("password"), // Made optional for OAuth users
  provider: text("provider").default("local"), // "local", "google", "github"
  providerId: text("provider_id"), // Google/GitHub user ID
  isEmailVerified: boolean("is_email_verified").default(false),
  // Email verification fields
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  // Password reset fields
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  // Profile fields
  name: text("name"), // User's full name for profile/invoicing
  companyName: text("company_name"),
  companySize: text("company_size"), // Company size category
  industry: text("industry"), // Industry/business category
  companyLogo: text("company_logo"), // URL to company logo stored in S3
  address: text("address"),
  phone: text("phone"),
  taxOfficeId: text("tax_office_id"), // Tax Registration Number
  isProspect: boolean("is_prospect").default(false), // Flag to identify prospects (email-only users)
  marketingOnly: boolean("marketing_only").default(false), // Flag for users who signed up from marketing page but haven't set password yet
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountHolderName: text("account_holder_name").notNull(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number"),
  iban: text("iban"),
  swiftCode: text("swift_code"),
  bankAddress: text("bank_address"),
  bankBranch: text("bank_branch"),
  currency: text("currency").default("USD"), // Currency for this bank account
  isDefault: boolean("is_default").default(false), // Default bank account for invoicing
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

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: 'cascade' }).notNull(), // Cascade delete projects when client deleted
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // Cascade delete invoices when user deleted
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: 'restrict' }), // Prevent deleting client with invoices
  bankAccountId: varchar("bank_account_id").references(() => bankAccounts.id, { onDelete: 'set null' }), // Reference to selected bank account
  date: timestamp("date").notNull().defaultNow(),
  scheduledDate: timestamp("scheduled_date"),
  orderNumber: text("order_number"),
  projectNumber: text("project_number"),
  forProject: text("for_project"),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  recurringInvoiceId: varchar("recurring_invoice_id").references(() => recurringInvoices.id, { onDelete: 'set null' }),
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

export const recurringInvoices = pgTable("recurring_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: 'restrict' }).notNull(),
  bankAccountId: varchar("bank_account_id").references(() => bankAccounts.id, { onDelete: 'set null' }),
  templateName: varchar("template_name", { length: 255 }).notNull(),
  frequency: varchar("frequency", { length: 20 }).notNull(), // 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  nextGenerationDate: date("next_generation_date").notNull(),
  isActive: boolean("is_active").default(true),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const recurringInvoiceItems = pgTable("recurring_invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recurringInvoiceId: varchar("recurring_invoice_id").references(() => recurringInvoices.id, { onDelete: 'cascade' }).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  position: integer("position").notNull().default(0),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // Cascade delete expenses when user deleted
  description: text("description").notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull().defaultNow(),
  paymentMethod: text("payment_method").default("other"), // "cash", "card", "bank_transfer", "other"
  vendor: text("vendor"),
  isTaxDeductible: boolean("is_tax_deductible").default(true),
  receipt: text("receipt"), // URL or base64 receipt image
  tags: text("tags"), // Comma-separated tags
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true }).extend({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional(),
});

// Schema for creating prospects (email-only users)
export const insertProspectSchema = createInsertSchema(users).omit({ id: true }).pick({ email: true }).extend({
  password: z.undefined(), // Explicitly exclude password for prospects
  isProspect: z.literal(true), // Flag to identify prospects
});

// Schema for creating marketing users (email-only, will set password later)
export const insertMarketingUserSchema = createInsertSchema(users).omit({ id: true }).pick({ email: true }).extend({
  password: z.undefined(), // No password initially
  marketingOnly: z.literal(true), // Flag to identify marketing-only users
  isProspect: z.literal(true), // Also mark as prospect until they set password
});

export const updateUserProfileSchema = z.object({
  name: z.string().optional(),
  companyName: z.string().optional(),
  companySize: z.enum(["solo", "2-10", "11-50", "51-200", "201-500", "500+"]).optional(),
  industry: z.enum([
    "technology",
    "consulting",
    "marketing",
    "design",
    "finance",
    "healthcare",
    "education",
    "legal",
    "real-estate",
    "construction",
    "manufacturing",
    "retail",
    "hospitality",
    "transportation",
    "media",
    "nonprofit",
    "other"
  ]).optional(),
  companyLogo: z.union([z.string().url(), z.literal("")]).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  taxOfficeId: z.string().optional(),
});

export const bankAccountSchema = z.object({
  accountHolderName: z.string().min(1, "Account holder name is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
  bankAddress: z.string().optional(),
  bankBranch: z.string().optional(),
  currency: z.enum(["USD", "EUR", "GBP", "AUD", "TRY"]).default("USD"),
  isDefault: z.boolean().default(false),
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

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true }).extend({
  date: z.string().transform((str) => str),
  amount: z.union([z.string(), z.number()])
    .transform(val => String(val))
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num < 100000000;
    }, "Amount must be between 0 and 99,999,999.99")
    .refine(val => /^\d+(\.\d{0,2})?$/.test(val), "Amount must have max 2 decimal places"),
});

export const insertRecurringInvoiceSchema = createInsertSchema(recurringInvoices).omit({ id: true }).extend({
  startDate: z.string().transform((str) => str),
  endDate: z.string().transform((str) => str).optional().nullable(),
  nextGenerationDate: z.string().transform((str) => str),
  taxRate: z.union([z.string(), z.number()])
    .transform(val => String(val))
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, "Tax rate must be between 0 and 100"),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
});

export const insertRecurringInvoiceItemSchema = createInsertSchema(recurringInvoiceItems).omit({ id: true }).extend({
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

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export type InsertBankAccount = z.infer<typeof bankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertRecurringInvoice = z.infer<typeof insertRecurringInvoiceSchema>;
export type RecurringInvoice = typeof recurringInvoices.$inferSelect;

export type InsertRecurringInvoiceItem = z.infer<typeof insertRecurringInvoiceItemSchema>;
export type RecurringInvoiceItem = typeof recurringInvoiceItems.$inferSelect;
