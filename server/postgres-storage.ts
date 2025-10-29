import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, clients, invoices, lineItems, services, expenses, bankAccounts, type User, type InsertUser, type Client, type InsertClient, type Invoice, type InsertInvoice, type LineItem, type InsertLineItem, type Service, type InsertService, type Expense, type InsertExpense, type BankAccount, type InsertBankAccount } from '@shared/schema';
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
    
    // Additional validation - reject invalid hostnames like "helium"
    if (connectionString.includes('helium') || connectionString.length < 10) {
      console.error('Invalid or incomplete DATABASE_URL:', connectionString);
      throw new Error('Invalid DATABASE_URL');
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
    // Explicitly build insert object excluding companyLogo to avoid errors if column doesn't exist yet
    // This ensures companyLogo is never included in the INSERT statement
    const allowedFields = [
      'email', 'username', 'password', 'provider', 'providerId',
      'isEmailVerified', 'emailVerificationToken', 'emailVerificationExpires',
      'passwordResetToken', 'passwordResetExpires', 'name', 'companyName',
      'address', 'phone', 'taxOfficeId', 'createdAt', 'updatedAt'
    ];
    
    const insertData: any = {};
    for (const field of allowedFields) {
      if (field in data && (data as any)[field] !== undefined) {
        insertData[field] = (data as any)[field];
      }
    }
    
    const result = await this.db.insert(users).values(insertData).returning();
    return result[0];
  }
  
  async getUserByProvider(provider: string, providerId: string): Promise<User | undefined> {
    const result = await this.db.select().from(users)
      .where(eq(users.provider, provider))
      .where(eq(users.providerId, providerId));
    return result[0];
  }
  
  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    // Explicitly exclude companyLogo from updates if column doesn't exist yet
    const {
      companyLogo,
      ...updateData
    } = data as any;
    
    // Double-check that companyLogo is removed
    delete (updateData as any).companyLogo;
    
    const result = await this.db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const result = await this.db.select().from(users)
      .where(eq(users.emailVerificationToken, token));
    return result[0];
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await this.db.update(users)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      })
      .where(eq(users.id, userId));
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const result = await this.db.select().from(users)
      .where(eq(users.passwordResetToken, token));
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

  async createInvoiceWithLineItems(invoiceData: InsertInvoice, lineItems: any[]): Promise<Invoice> {
    return await this.db.transaction(async (tx) => {
      // Create invoice
      const invoiceResult = await tx.insert(invoices).values(invoiceData).returning();
      const invoice = invoiceResult[0];

      // Create line items
      for (const item of lineItems) {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.price);
        const amount = qty * price;

        const lineItemData = {
          invoiceId: invoice.id,
          description: item.description,
          quantity: qty.toString(),
          price: price.toFixed(2),
          amount: amount.toFixed(2),
        };

        await tx.insert(lineItems).values(lineItemData);
      }

      return invoice;
    });
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

  // Bank Accounts
  async getBankAccounts(userId: string): Promise<BankAccount[]> {
    return await this.db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
  }

  async getBankAccount(id: string, userId: string): Promise<BankAccount | undefined> {
    const result = await this.db.select().from(bankAccounts)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)));
    return result[0];
  }

  async createBankAccount(userId: string, data: InsertBankAccount): Promise<BankAccount> {
    const result = await this.db.insert(bankAccounts).values({ ...data, userId }).returning();
    return result[0];
  }

  async updateBankAccount(id: string, userId: string, data: Partial<InsertBankAccount>): Promise<BankAccount | undefined> {
    const result = await this.db.update(bankAccounts)
      .set(data)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteBankAccount(id: string, userId: string): Promise<boolean> {
    const result = await this.db.delete(bankAccounts)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async setDefaultBankAccount(id: string, userId: string): Promise<void> {
    // First unset all default flags for this user
    await this.db.update(bankAccounts)
      .set({ isDefault: false })
      .where(eq(bankAccounts.userId, userId));

    // Then set this account as default
    await this.db.update(bankAccounts)
      .set({ isDefault: true })
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)));
  }
}

