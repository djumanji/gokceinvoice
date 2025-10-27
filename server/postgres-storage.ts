import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, clients, invoices, lineItems, services, expenses, type User, type InsertUser, type Client, type InsertClient, type Invoice, type InsertInvoice, type LineItem, type InsertLineItem, type Service, type InsertService, type Expense, type InsertExpense } from '@shared/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

// Initialize PostgreSQL connection
let connectionString: string | undefined;
let client: any;
let db: any;

function initializeDb() {
  if (!client) {
    connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    
    try {
      client = postgres(connectionString);
      db = drizzle(client);
    } catch (error) {
      console.error('Failed to create PostgreSQL client:', error);
      throw error;
    }
  }
  return db;
}

export class PgStorage {
  private db: any;

  constructor() {
    this.db = initializeDb();
  }

  // Users
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  
  async getUserById(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async createUser(data: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(data).returning();
    return result[0];
  }
  
  async getUserByProvider(provider: string, providerId: string): Promise<User | undefined> {
    const result = await this.db.select().from(users)
      .where(eq(users.provider, provider))
      .where(eq(users.providerId, providerId));
    return result[0];
  }
  
  // Clients
  async getClients(userId: string): Promise<Client[]> {
    return await this.db.select().from(clients).where(eq(clients.userId, userId));
  }

  async getClient(id: string, userId: string): Promise<Client | undefined> {
    const result = await this.db.select().from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return result[0];
  }

  async createClient(data: InsertClient): Promise<Client> {
    const result = await this.db.insert(clients).values(data).returning();
    return result[0];
  }

  async updateClient(id: string, userId: string, data: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await this.db.update(clients)
      .set(data)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteClient(id: string, userId: string): Promise<boolean> {
    const result = await this.db.delete(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Invoices
  async getInvoices(userId: string): Promise<Invoice[]> {
    return await this.db.select().from(invoices).where(eq(invoices.userId, userId));
  }

  async getInvoice(id: string, userId: string): Promise<Invoice | undefined> {
    const result = await this.db.select().from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
    return result[0];
  }

  async getNextInvoiceNumber(userId: string): Promise<string> {
    // Use the atomic PostgreSQL function to prevent race conditions
    const result = await this.db.execute(
      sql`SELECT get_next_invoice_number(${userId}) as invoice_number`
    );
    return result[0].invoice_number;
  }

  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const result = await this.db.insert(invoices).values(data).returning();
    return result[0];
  }

  async updateInvoice(id: string, userId: string, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await this.db.update(invoices)
      .set(data)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteInvoice(id: string, userId: string): Promise<boolean> {
    // Delete line items first due to foreign key
    await this.db.delete(lineItems).where(eq(lineItems.invoiceId, id));
    const result = await this.db.delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Line Items
  async getLineItemsByInvoice(invoiceId: string): Promise<LineItem[]> {
    return await this.db.select().from(lineItems).where(eq(lineItems.invoiceId, invoiceId));
  }

  async createLineItem(data: InsertLineItem): Promise<LineItem> {
    const result = await this.db.insert(lineItems).values(data).returning();
    return result[0];
  }

  async updateLineItem(id: string, data: Partial<InsertLineItem>): Promise<LineItem | undefined> {
    const result = await this.db.update(lineItems)
      .set(data)
      .where(eq(lineItems.id, id))
      .returning();
    return result[0];
  }

  async deleteLineItem(id: string): Promise<boolean> {
    const result = await this.db.delete(lineItems).where(eq(lineItems.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteLineItemsByInvoice(invoiceId: string): Promise<void> {
    await this.db.delete(lineItems).where(eq(lineItems.invoiceId, invoiceId));
  }

  // Services
  async getServices(userId: string): Promise<Service[]> {
    return await this.db.select().from(services).where(eq(services.userId, userId));
  }

  async getService(id: string, userId: string): Promise<Service | undefined> {
    const result = await this.db.select().from(services)
      .where(and(eq(services.id, id), eq(services.userId, userId)));
    return result[0];
  }

  async createService(data: InsertService): Promise<Service> {
    const result = await this.db.insert(services).values(data).returning();
    return result[0];
  }

  async updateService(id: string, userId: string, data: Partial<InsertService>): Promise<Service | undefined> {
    const result = await this.db.update(services)
      .set(data)
      .where(and(eq(services.id, id), eq(services.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteService(id: string, userId: string): Promise<boolean> {
    const result = await this.db.delete(services)
      .where(and(eq(services.id, id), eq(services.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Expenses
  async getExpenses(userId: string): Promise<Expense[]> {
    return await this.db.select().from(expenses).where(eq(expenses.userId, userId));
  }

  async getExpense(id: string, userId: string): Promise<Expense | undefined> {
    const result = await this.db.select().from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
    return result[0];
  }

  async createExpense(data: InsertExpense): Promise<Expense> {
    const result = await this.db.insert(expenses).values(data).returning();
    return result[0];
  }

  async updateExpense(id: string, userId: string, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    const result = await this.db.update(expenses)
      .set(data)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteExpense(id: string, userId: string): Promise<boolean> {
    const result = await this.db.delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

