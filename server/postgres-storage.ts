import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import { users, clients, invoices, lineItems, services, expenses, bankAccounts, projects, recurringInvoices, recurringInvoiceItems, payments, inviteTokens, type User, type InsertUser, type Client, type InsertClient, type Invoice, type InsertInvoice, type LineItem, type InsertLineItem, type Service, type InsertService, type Expense, type InsertExpense, type BankAccount, type InsertBankAccount, type Project, type InsertProject, type RecurringInvoice, type InsertRecurringInvoice, type RecurringInvoiceItem, type InsertRecurringInvoiceItem, type Payment, type InsertPayment, type InviteToken, type InsertInviteToken } from '@shared/schema';
import { eq, desc, and, sql, lte, or, isNull, gte } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Initialize PostgreSQL connection
let connectionString: string | undefined;
let client: Sql | undefined;
let db: PostgresJsDatabase | undefined;

function initializeDb(): PostgresJsDatabase {
  if (!client || !db) {
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
  private db: PostgresJsDatabase;

  constructor() {
    this.db = initializeDb();
  }

  // Users
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
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
      'address', 'phone', 'taxOfficeId', 'isProspect', 'marketingOnly', 
      'isAdmin', 'availableInvites', 'invitedByUserId', 'createdAt', 'updatedAt'
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
      console.log('[PgStorage] Creating invoice with data:', JSON.stringify(invoiceData, null, 2));
      console.log('[PgStorage] Line items:', JSON.stringify(lineItems, null, 2));
      
      // Create invoice
      const invoiceResult = await tx.insert(invoices).values(invoiceData).returning();
      console.log('[PgStorage] Invoice insert result:', JSON.stringify(invoiceResult, null, 2));
      
      const invoice = invoiceResult[0];

      if (!invoice || !invoice.id) {
        throw new Error(`Failed to create invoice. Result: ${JSON.stringify(invoiceResult)}`);
      }

      console.log('[PgStorage] Created invoice with ID:', invoice.id);

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

        console.log('[PgStorage] Inserting line item:', JSON.stringify(lineItemData, null, 2));
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

  // Projects
  async getProjectsByClient(clientId: string, userId: string): Promise<Project[]> {
    // Verify client belongs to user first
    const client = await this.getClient(clientId, userId);
    if (!client) {
      return [];
    }
    
    const result = await this.db.select()
      .from(projects)
      .where(and(eq(projects.clientId, clientId), eq(projects.isActive, true)))
      .orderBy(projects.name);
    return result;
  }

  async getProject(id: string, userId: string): Promise<Project | undefined> {
    const result = await this.db.select()
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(eq(projects.id, id), eq(clients.userId, userId)));
    
    if (result.length === 0) {
      return undefined;
    }
    
    return result[0].projects;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await this.db.insert(projects)
      .values({
        ...insertProject,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return project;
  }

  async updateProject(id: string, userId: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    // Verify project belongs to user's client
    const project = await this.getProject(id, userId);
    if (!project) {
      return undefined;
    }

    const result = await this.db.update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    // Verify project belongs to user's client
    const project = await this.getProject(id, userId);
    if (!project) {
      return false;
    }

    const result = await this.db.delete(projects)
      .where(eq(projects.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Scheduler-specific methods (no user ID checks for background processing)
  async getClient(id: string): Promise<Client | undefined> {
    const result = await this.db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }

  async getScheduledInvoicesDue(): Promise<Invoice[]> {
    return await this.db.select()
      .from(invoices)
      .where(and(
        eq(invoices.status, 'scheduled'),
        lte(invoices.scheduledDate, new Date())
      ));
  }

  async getScheduledInvoicesCount(): Promise<number> {
    const result = await this.db.$count(
      invoices,
      and(
        eq(invoices.status, 'scheduled'),
        lte(invoices.scheduledDate, new Date())
      )
    );
    return result;
  }

  // Recurring Invoices
  async getRecurringInvoices(userId: string): Promise<RecurringInvoice[]> {
    return await this.db.select()
      .from(recurringInvoices)
      .where(eq(recurringInvoices.userId, userId))
      .orderBy(desc(recurringInvoices.createdAt));
  }

  async getRecurringInvoice(id: string, userId: string): Promise<RecurringInvoice | undefined> {
    const result = await this.db.select()
      .from(recurringInvoices)
      .where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId)));
    return result[0];
  }

  async createRecurringInvoice(data: InsertRecurringInvoice, items: InsertRecurringInvoiceItem[]): Promise<RecurringInvoice> {
    return await this.db.transaction(async (tx) => {
      // Create recurring invoice
      const recurringResult = await tx.insert(recurringInvoices).values(data).returning();
      const recurringInvoice = recurringResult[0];

      // Create recurring invoice items
      for (const item of items) {
        await tx.insert(recurringInvoiceItems).values({
          ...item,
          recurringInvoiceId: recurringInvoice.id,
        });
      }

      return recurringInvoice;
    });
  }

  async updateRecurringInvoice(id: string, userId: string, data: Partial<InsertRecurringInvoice>): Promise<RecurringInvoice | undefined> {
    const result = await this.db.update(recurringInvoices)
      .set(data)
      .where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteRecurringInvoice(id: string, userId: string): Promise<boolean> {
    // Delete items first due to foreign key (cascade should handle this, but being explicit)
    await this.db.delete(recurringInvoiceItems).where(eq(recurringInvoiceItems.recurringInvoiceId, id));

    const result = await this.db.delete(recurringInvoices)
      .where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getRecurringInvoiceItems(recurringInvoiceId: string): Promise<RecurringInvoiceItem[]> {
    return await this.db.select()
      .from(recurringInvoiceItems)
      .where(eq(recurringInvoiceItems.recurringInvoiceId, recurringInvoiceId))
      .orderBy(recurringInvoiceItems.position);
  }

  async getRecurringInvoiceItemsByIds(recurringInvoiceIds: string[]): Promise<RecurringInvoiceItem[]> {
    if (recurringInvoiceIds.length === 0) {
      return [];
    }
    
    return await this.db.select()
      .from(recurringInvoiceItems)
      .where(sql`${recurringInvoiceItems.recurringInvoiceId} = ANY(${recurringInvoiceIds})`)
      .orderBy(recurringInvoiceItems.recurringInvoiceId, recurringInvoiceItems.position);
  }

  async getRecurringInvoicesDueForGeneration(): Promise<RecurringInvoice[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.db.select()
      .from(recurringInvoices)
      .where(
        and(
          eq(recurringInvoices.isActive, true),
          lte(recurringInvoices.nextGenerationDate, today),
          // Check if endDate is null or in the future
          or(
            isNull(recurringInvoices.endDate),
            gte(recurringInvoices.endDate, today)
          )
        )
      );
  }

  // Payments
  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return await this.db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).orderBy(desc(payments.paymentDate));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await this.db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }

  async createPayment(data: InsertPayment): Promise<Payment> {
    const [payment] = await this.db.insert(payments).values(data).returning();

    // Update invoice amount_paid and status
    const invoice = await this.db.select().from(invoices).where(eq(invoices.id, data.invoiceId));
    if (invoice[0]) {
      const currentPaid = parseFloat(invoice[0].amountPaid || '0');
      const paymentAmount = parseFloat(data.amount);
      const newAmountPaid = currentPaid + paymentAmount;
      const total = parseFloat(invoice[0].total);

      // Determine new status
      let newStatus = invoice[0].status;
      let paidDate = invoice[0].paidDate;

      if (newAmountPaid >= total) {
        newStatus = 'paid';
        paidDate = new Date();
      } else if (newAmountPaid > 0) {
        newStatus = 'partial';
      }

      // Update invoice
      await this.db.update(invoices)
        .set({
          amountPaid: newAmountPaid.toString(),
          status: newStatus,
          paidDate: paidDate
        })
        .where(eq(invoices.id, data.invoiceId));
    }

    return payment;
  }

  async deletePayment(id: string): Promise<boolean> {
    // Get payment details before deleting
    const payment = await this.getPayment(id);
    if (!payment) return false;

    // Delete the payment
    await this.db.delete(payments).where(eq(payments.id, id));

    // Recalculate invoice amount_paid and status
    const remainingPayments = await this.getPaymentsByInvoice(payment.invoiceId);
    const invoice = await this.db.select().from(invoices).where(eq(invoices.id, payment.invoiceId));

    if (invoice[0]) {
      const totalPaid = remainingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const total = parseFloat(invoice[0].total);

      let newStatus = 'sent'; // Default to sent if no payments
      let paidDate = null;

      if (totalPaid >= total) {
        newStatus = 'paid';
        paidDate = new Date();
      } else if (totalPaid > 0) {
        newStatus = 'partial';
      }

      await this.db.update(invoices)
        .set({
          amountPaid: totalPaid.toString(),
          status: newStatus,
          paidDate: paidDate
        })
        .where(eq(invoices.id, payment.invoiceId));
    }

    return true;
  }

  // Invite Tokens
  async createInviteToken(data: InsertInviteToken): Promise<InviteToken> {
    const result = await this.db.insert(inviteTokens).values(data).returning();
    return result[0];
  }

  async getInviteTokenByToken(token: string): Promise<InviteToken | undefined> {
    const result = await this.db.select().from(inviteTokens).where(eq(inviteTokens.token, token));
    return result[0];
  }

  async getInviteTokenByCode(code: string): Promise<InviteToken | undefined> {
    const result = await this.db.select().from(inviteTokens).where(eq(inviteTokens.code, code));
    return result[0];
  }

  async getInviteTokensBySender(senderUserId: string): Promise<InviteToken[]> {
    const result = await this.db.select().from(inviteTokens)
      .where(eq(inviteTokens.senderUserId, senderUserId))
      .orderBy(desc(inviteTokens.createdAt));
    return result;
  }

  async markInviteTokenAsUsed(token: string): Promise<InviteToken | undefined> {
    const result = await this.db.update(inviteTokens)
      .set({ status: 'used', usedAt: new Date() })
      .where(eq(inviteTokens.token, token))
      .returning();
    return result[0];
  }

  async deleteInviteToken(token: string): Promise<boolean> {
    await this.db.delete(inviteTokens).where(eq(inviteTokens.token, token));
    return true;
  }
}

