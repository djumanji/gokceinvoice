import { type Client, type InsertClient, type Invoice, type InsertInvoice, type LineItem, type InsertLineItem } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;

  // Line Items
  getLineItemsByInvoice(invoiceId: string): Promise<LineItem[]>;
  createLineItem(lineItem: InsertLineItem): Promise<LineItem>;
  updateLineItem(id: string, lineItem: Partial<InsertLineItem>): Promise<LineItem | undefined>;
  deleteLineItem(id: string): Promise<boolean>;
  deleteLineItemsByInvoice(invoiceId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private clients: Map<string, Client>;
  private invoices: Map<string, Invoice>;
  private lineItems: Map<string, LineItem>;

  constructor() {
    this.clients = new Map();
    this.invoices = new Map();
    this.lineItems = new Map();
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = {
      id,
      name: insertClient.name,
      email: insertClient.email,
      company: insertClient.company ?? null,
      phone: insertClient.phone ?? null,
      address: insertClient.address ?? null,
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const existing = this.clients.get(id);
    if (!existing) return undefined;
    const updated: Client = { ...existing, ...updateData };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const invoice: Invoice = {
      id,
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

  async updateInvoice(id: string, updateData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existing = this.invoices.get(id);
    if (!existing) return undefined;
    const updated: Invoice = { ...existing, ...updateData };
    this.invoices.set(id, updated);
    return updated;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    await this.deleteLineItemsByInvoice(id);
    return this.invoices.delete(id);
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
}

export const storage = new MemStorage();
