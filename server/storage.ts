import { type User, type InsertUser, type Client, type InsertClient, type Invoice, type InsertInvoice, type LineItem, type InsertLineItem, type Service, type InsertService } from "@shared/schema";
import { randomUUID } from "crypto";
import { PgStorage } from './postgres-storage';

export interface IStorage {
  // Users
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByProvider(provider: string, providerId: string): Promise<User | undefined>;

  // Clients
  getClients(userId: string): Promise<Client[]>;
  getClient(id: string, userId: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, userId: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string, userId: string): Promise<boolean>;

  // Invoices
  getInvoices(userId: string): Promise<Invoice[]>;
  getInvoice(id: string, userId: string): Promise<Invoice | undefined>;
  getNextInvoiceNumber(userId: string): Promise<string>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clients: Map<string, Client>;
  private invoices: Map<string, Invoice>;
  private lineItems: Map<string, LineItem>;
  private services: Map<string, Service>;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.invoices = new Map();
    this.lineItems = new Map();
    this.services = new Map();
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
}

// Use PostgreSQL if DATABASE_URL is set, otherwise use in-memory storage
function createStorage() {
  if (process.env.DATABASE_URL) {
    try {
      console.log('Initializing PostgreSQL storage with URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
      return new PgStorage();
    } catch (error) {
      console.error('Failed to initialize PostgreSQL storage, falling back to in-memory storage:', error);
      return new MemStorage();
    }
  }
  console.log('DATABASE_URL not set, using in-memory storage');
  return new MemStorage();
}

export const storage = createStorage();
