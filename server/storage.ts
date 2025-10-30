import { type User, type InsertUser, type Client, type InsertClient, type Invoice, type InsertInvoice, type LineItem, type InsertLineItem, type Service, type InsertService, type Expense, type InsertExpense, type BankAccount, type InsertBankAccount, type Project, type InsertProject, type InviteToken, type InsertInviteToken, type WaitlistEntry, type InsertWaitlist } from "@shared/schema";
import { randomUUID } from "crypto";
import { PgStorage } from './postgres-storage';

export interface IStorage {
  // Users
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByProvider(provider: string, providerId: string): Promise<User | undefined>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  verifyUserEmail(userId: string): Promise<void>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;

  // Clients
  getClients(userId: string): Promise<Client[]>;
  getClient(id: string, userId: string): Promise<Client | undefined>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, userId: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string, userId: string): Promise<boolean>;

  // Invoices
  getInvoices(userId: string): Promise<Invoice[]>;
  getInvoice(id: string, userId: string): Promise<Invoice | undefined>;
  getNextInvoiceNumber(userId: string): Promise<string>;
  getScheduledInvoicesDue(): Promise<Invoice[]>;
  getScheduledInvoicesCount(): Promise<number>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  createInvoiceWithLineItems(invoice: InsertInvoice, lineItems: any[]): Promise<Invoice>;
  updateInvoice(id: string, userId: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string, userId: string): Promise<boolean>;

  // Line Items
  getLineItemsByInvoice(invoiceId: string): Promise<LineItem[]>;
  createLineItem(lineItem: InsertLineItem): Promise<LineItem>;
  updateLineItem(id: string, lineItem: Partial<InsertLineItem>): Promise<LineItem | undefined>;
  deleteLineItem(id: string): Promise<boolean>;
  deleteLineItemsByInvoice(invoiceId: string): Promise<void>;

  // Services
  getServices(userId: string): Promise<Service[]>;
  getService(id: string, userId: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, userId: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string, userId: string): Promise<boolean>;

  // Expenses
  getExpenses(userId: string): Promise<Expense[]>;
  getExpense(id: string, userId: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, userId: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string, userId: string): Promise<boolean>;

  // Bank Accounts
  getBankAccounts(userId: string): Promise<BankAccount[]>;
  getBankAccount(id: string, userId: string): Promise<BankAccount | undefined>;
  createBankAccount(userId: string, bankAccount: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: string, userId: string, bankAccount: Partial<InsertBankAccount>): Promise<BankAccount | undefined>;
  deleteBankAccount(id: string, userId: string): Promise<boolean>;
  setDefaultBankAccount(id: string, userId: string): Promise<void>;

  // Projects
  getProjectsByClient(clientId: string, userId: string): Promise<Project[]>;
  getProject(id: string, userId: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, userId: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string, userId: string): Promise<boolean>;

  // Invite Tokens
  createInviteToken(senderId: string, recipientEmail?: string): Promise<InviteToken>;
  getInviteTokenByToken(token: string): Promise<InviteToken | undefined>;
  updateInviteTokenStatus(tokenId: string, status: 'used' | 'expired'): Promise<void>;
  getUserInviteTokens(userId: string): Promise<InviteToken[]>;
  decrementUserInvites(userId: string): Promise<void>;

  // Waitlist
  addToWaitlist(email: string, source?: string): Promise<WaitlistEntry>;
  getWaitlistCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clients: Map<string, Client>;
  private invoices: Map<string, Invoice>;
  private lineItems: Map<string, LineItem>;
  private services: Map<string, Service>;
  private expenses: Map<string, Expense>;
  private projects: Map<string, Project>;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.invoices = new Map();
    this.lineItems = new Map();
    this.services = new Map();
    this.expenses = new Map();
    this.projects = new Map();
  }
  
  // Users
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }
  
  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      email: insertUser.email,
      username: insertUser.username ?? null,
      password: insertUser.password ?? null,
      provider: insertUser.provider ?? "local",
      providerId: insertUser.providerId ?? null,
      isEmailVerified: insertUser.isEmailVerified ?? false,
      emailVerificationToken: insertUser.emailVerificationToken ?? null,
      emailVerificationExpires: insertUser.emailVerificationExpires ?? null,
      passwordResetToken: insertUser.passwordResetToken ?? null,
      passwordResetExpires: insertUser.passwordResetExpires ?? null,
      companyName: insertUser.companyName ?? null,
      companyLogo: insertUser.companyLogo ?? null,
      address: insertUser.address ?? null,
      phone: insertUser.phone ?? null,
      taxOfficeId: insertUser.taxOfficeId ?? null,
      preferredCurrency: insertUser.preferredCurrency ?? null,
      isProspect: insertUser.isProspect ?? false,
      marketingOnly: insertUser.marketingOnly ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }
  
  async getUserByProvider(provider: string, providerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      u => u.provider === provider && u.providerId === providerId
    );
  }
  
  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated: User = { ...existing, ...updateData, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.emailVerificationToken === token);
  }

  async verifyUserEmail(userId: string): Promise<void> {
    const existing = this.users.get(userId);
    if (existing) {
      const updated: User = {
        ...existing,
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      };
      this.users.set(userId, updated);
    }
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.passwordResetToken === token);
  }

  // Clients
  async getClients(userId: string): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(c => c.userId === userId);
  }

  async getClient(id: string, userId: string): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (client && client.userId === userId) {
      return client;
    }
    return undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = {
      id,
      userId: insertClient.userId ?? null,
      name: insertClient.name,
      email: insertClient.email,
      company: insertClient.company ?? null,
      phone: insertClient.phone ?? null,
      website: insertClient.website ?? null,
      address: insertClient.address ?? null,
      taxId: insertClient.taxId ?? null,
      paymentTerms: insertClient.paymentTerms ?? null,
      currency: insertClient.currency ?? null,
      notes: insertClient.notes ?? null,
      isActive: insertClient.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, userId: string, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const existing = this.clients.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    const updated: Client = { ...existing, ...updateData };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string, userId: string): Promise<boolean> {
    const existing = this.clients.get(id);
    if (!existing || existing.userId !== userId) return false;
    this.clients.delete(id);
    return true;
  }

  // Invoices
  async getInvoices(userId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(i => i.userId === userId);
  }

  async getInvoice(id: string, userId: string): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (invoice && invoice.userId === userId) {
      return invoice;
    }
    return undefined;
  }

  async getNextInvoiceNumber(userId: string): Promise<string> {
    const userInvoices = Array.from(this.invoices.values()).filter(i => i.userId === userId);
    const lastInvoice = userInvoices
      .map(inv => {
        const match = inv.invoiceNumber.match(/INV-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .sort((a, b) => b - a)[0] || 0;

    const nextNum = (lastInvoice + 1).toString().padStart(6, "0");
    return `INV-${nextNum}`;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const invoice: Invoice = {
      id,
      userId: insertInvoice.userId ?? null,
      invoiceNumber: insertInvoice.invoiceNumber,
      clientId: insertInvoice.clientId,
      date: insertInvoice.date ?? new Date(),
      orderNumber: insertInvoice.orderNumber ?? null,
      projectNumber: insertInvoice.projectNumber ?? null,
      forProject: insertInvoice.forProject ?? null,
      status: insertInvoice.status ?? "draft",
      notes: insertInvoice.notes ?? null,
      subtotal: insertInvoice.subtotal,
      tax: insertInvoice.tax ?? "0",
      taxRate: insertInvoice.taxRate ?? "0",
      total: insertInvoice.total,
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async createInvoiceWithLineItems(insertInvoice: InsertInvoice, lineItems: any[]): Promise<Invoice> {
    // For in-memory storage, we can't have real transactions, but we'll simulate atomic behavior
    let createdInvoiceId: string | null = null;
    try {
      const invoice = await this.createInvoice(insertInvoice);
      createdInvoiceId = invoice.id;
      
      // Create line items
      for (const item of lineItems) {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.price);
        const amount = qty * price;

        const lineItem: LineItem = {
          id: randomUUID(),
          invoiceId: invoice.id,
          description: item.description,
          quantity: qty.toString(),
          price: price.toFixed(2),
          amount: amount.toFixed(2),
        };
        this.lineItems.set(lineItem.id, lineItem);
      }
      
      return invoice;
    } catch (error) {
      // If anything fails, clean up the invoice
      if (createdInvoiceId) {
        this.invoices.delete(createdInvoiceId);
        // Also clean up any line items that were created
        const invoiceLineItems = Array.from(this.lineItems.values()).filter(li => li.invoiceId === createdInvoiceId);
        invoiceLineItems.forEach(li => this.lineItems.delete(li.id));
      }
      throw error;
    }
  }

  async updateInvoice(id: string, userId: string, updateData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existing = this.invoices.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    const updated: Invoice = { ...existing, ...updateData };
    this.invoices.set(id, updated);
    return updated;
  }

  async deleteInvoice(id: string, userId: string): Promise<boolean> {
    const existing = this.invoices.get(id);
    if (!existing || existing.userId !== userId) return false;
    await this.deleteLineItemsByInvoice(id);
    this.invoices.delete(id);
    return true;
  }

  // Line Items
  async getLineItemsByInvoice(invoiceId: string): Promise<LineItem[]> {
    return Array.from(this.lineItems.values()).filter(
      (item) => item.invoiceId === invoiceId
    );
  }

  async createLineItem(insertLineItem: InsertLineItem): Promise<LineItem> {
    const id = randomUUID();
    const lineItem: LineItem = { ...insertLineItem, id };
    this.lineItems.set(id, lineItem);
    return lineItem;
  }

  async updateLineItem(id: string, updateData: Partial<InsertLineItem>): Promise<LineItem | undefined> {
    const existing = this.lineItems.get(id);
    if (!existing) return undefined;
    const updated: LineItem = { ...existing, ...updateData };
    this.lineItems.set(id, updated);
    return updated;
  }

  async deleteLineItem(id: string): Promise<boolean> {
    return this.lineItems.delete(id);
  }

  async deleteLineItemsByInvoice(invoiceId: string): Promise<void> {
    const items = await this.getLineItemsByInvoice(invoiceId);
    for (const item of items) {
      this.lineItems.delete(item.id);
    }
  }

  // Services
  async getServices(userId: string): Promise<Service[]> {
    return Array.from(this.services.values()).filter(s => s.userId === userId);
  }

  async getService(id: string, userId: string): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (service && service.userId === userId) {
      return service;
    }
    return undefined;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = {
      id,
      userId: insertService.userId ?? null,
      name: insertService.name,
      description: insertService.description ?? null,
      category: insertService.category ?? null,
      price: insertService.price,
      unit: insertService.unit ?? "item",
      isActive: insertService.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: string, userId: string, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const existing = this.services.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    const updated: Service = { ...existing, ...updateData, updatedAt: new Date() };
    this.services.set(id, updated);
    return updated;
  }

  async deleteService(id: string, userId: string): Promise<boolean> {
    const existing = this.services.get(id);
    if (!existing || existing.userId !== userId) return false;
    this.services.delete(id);
    return true;
  }

  // Expenses
  async getExpenses(userId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(e => e.userId === userId);
  }

  async getExpense(id: string, userId: string): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (expense && expense.userId === userId) {
      return expense;
    }
    return undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = {
      id,
      userId: insertExpense.userId ?? null,
      description: insertExpense.description,
      category: insertExpense.category,
      amount: insertExpense.amount,
      date: insertExpense.date as any,
      paymentMethod: insertExpense.paymentMethod ?? "other",
      vendor: insertExpense.vendor ?? null,
      isTaxDeductible: insertExpense.isTaxDeductible ?? true,
      receipt: insertExpense.receipt ?? null,
      tags: insertExpense.tags ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: string, userId: string, updateData: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    const updated: Expense = { ...existing, ...updateData, updatedAt: new Date() };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: string, userId: string): Promise<boolean> {
    const existing = this.expenses.get(id);
    if (!existing || existing.userId !== userId) return false;
    this.expenses.delete(id);
    return true;
  }

  // Bank Accounts - stub implementations
  async getBankAccounts(userId: string): Promise<BankAccount[]> {
    return [];
  }

  async getBankAccount(id: string, userId: string): Promise<BankAccount | undefined> {
    return undefined;
  }

  async createBankAccount(userId: string, bankAccount: InsertBankAccount): Promise<BankAccount> {
    throw new Error("Not implemented in MemStorage");
  }

  async updateBankAccount(id: string, userId: string, bankAccount: Partial<InsertBankAccount>): Promise<BankAccount | undefined> {
    return undefined;
  }

  async deleteBankAccount(id: string, userId: string): Promise<boolean> {
    return false;
  }

  async setDefaultBankAccount(id: string, userId: string): Promise<void> {
    // Stub
  }

  // Projects
  async getProjectsByClient(clientId: string, userId: string): Promise<Project[]> {
    const client = this.clients.get(clientId);
    if (!client || client.userId !== userId) {
      return [];
    }
    return Array.from(this.projects.values()).filter(p => p.clientId === clientId && p.isActive);
  }

  async getProject(id: string, userId: string): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const client = this.clients.get(project.clientId);
    if (!client || client.userId !== userId) return undefined;
    
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      id,
      clientId: insertProject.clientId,
      name: insertProject.name,
      description: insertProject.description ?? null,
      isActive: insertProject.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, userId: string, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const existing = await this.getProject(id, userId);
    if (!existing) return undefined;
    
    const updated: Project = { ...existing, ...updateData, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    const existing = await this.getProject(id, userId);
    if (!existing) return false;
    this.projects.delete(id);
    return true;
  }

  // Scheduler-specific methods (no user ID checks for background processing)
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getScheduledInvoicesDue(): Promise<Invoice[]> {
    const now = new Date();
    return Array.from(this.invoices.values()).filter(invoice =>
      invoice.status === 'scheduled' &&
      invoice.scheduledDate &&
      new Date(invoice.scheduledDate) <= now
    );
  }

  async getScheduledInvoicesCount(): Promise<number> {
    return (await this.getScheduledInvoicesDue()).length;
  }

  // Invite Tokens - stub implementations
  async createInviteToken(senderId: string, recipientEmail?: string): Promise<InviteToken> {
    throw new Error("Not implemented in MemStorage");
  }

  async getInviteTokenByToken(token: string): Promise<InviteToken | undefined> {
    throw new Error("Not implemented in MemStorage");
  }

  async updateInviteTokenStatus(tokenId: string, status: 'used' | 'expired'): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  async getUserInviteTokens(userId: string): Promise<InviteToken[]> {
    throw new Error("Not implemented in MemStorage");
  }

  async decrementUserInvites(userId: string): Promise<void> {
    throw new Error("Not implemented in MemStorage");
  }

  // Waitlist - stub implementations
  async addToWaitlist(email: string, source?: string): Promise<WaitlistEntry> {
    throw new Error("Not implemented in MemStorage");
  }

  async getWaitlistCount(): Promise<number> {
    throw new Error("Not implemented in MemStorage");
  }
}

// Use PostgreSQL if DATABASE_URL is set, otherwise use in-memory storage
function createStorage() {
  if (process.env.DATABASE_URL) {
    try {
      const dbUrl = process.env.DATABASE_URL;
      console.log('Initializing PostgreSQL storage with URL:', dbUrl.replace(/:[^:@]+@/, ':****@'));
      
      // Validate DATABASE_URL format
      if (!dbUrl.includes('://')) {
        console.error('Invalid DATABASE_URL format. Missing protocol (postgresql:// or postgres://)');
        console.log('Falling back to in-memory storage');
        return new MemStorage();
      }
      
      return new PgStorage();
    } catch (error) {
      console.error('Failed to initialize PostgreSQL storage, falling back to in-memory storage');
      console.error('Error:', error instanceof Error ? error.message : String(error));
      return new MemStorage();
    }
  }
  console.log('DATABASE_URL not set, using in-memory storage');
  return new MemStorage();
}

export const storage = createStorage();
