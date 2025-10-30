import { storage } from '../storage';
import { calculateInvoiceTotals, prepareLineItems } from './invoice-calculation.service';
import { insertInvoiceSchema, insertLineItemSchema } from '@shared/schema';

/**
 * Recurring Invoice Service
 * Handles generation of invoices from recurring templates
 */

/**
 * Calculate next generation date based on frequency
 */
function calculateNextGenerationDate(
  currentDate: Date,
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
): Date {
  const next = new Date(currentDate);
  
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
}

/**
 * Generate an invoice from a recurring invoice template
 */
export async function generateInvoiceFromRecurring(
  recurringInvoiceId: string,
  userId: string
): Promise<any> {
  // Get recurring invoice template
  const recurringInvoice = await storage.getRecurringInvoice(recurringInvoiceId, userId);
  if (!recurringInvoice) {
    throw new Error('Recurring invoice not found');
  }

  if (!recurringInvoice.isActive) {
    throw new Error('Recurring invoice is not active');
  }

  // Check if end date has passed
  if (recurringInvoice.endDate) {
    const endDate = new Date(recurringInvoice.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (endDate < today) {
      throw new Error('Recurring invoice has ended');
    }
  }

  // Get recurring invoice items
  const recurringItems = await storage.getRecurringInvoiceItems(recurringInvoiceId);

  // Prepare line items for invoice
  const lineItems = recurringItems.map(item => ({
    description: item.description,
    quantity: item.quantity,
    price: item.price,
    amount: item.amount,
  }));

  // Calculate totals
  const calculations = calculateInvoiceTotals(lineItems, recurringInvoice.taxRate.toString());

  // Generate invoice number
  const invoiceNumber = await storage.getNextInvoiceNumber(recurringInvoice.userId);

  // Create invoice data
  const invoiceData = insertInvoiceSchema.parse({
    userId: recurringInvoice.userId,
    clientId: recurringInvoice.clientId,
    bankAccountId: recurringInvoice.bankAccountId || undefined,
    invoiceNumber,
    date: new Date(),
    status: 'draft',
    subtotal: calculations.subtotal,
    tax: calculations.tax,
    taxRate: recurringInvoice.taxRate.toString(),
    total: calculations.total,
    notes: recurringInvoice.notes || undefined,
    recurringInvoiceId: recurringInvoice.id,
  });

  // Prepare line items for storage
  const preparedLineItems = prepareLineItems(lineItems);

  // Create invoice with line items
  const invoice = await storage.createInvoiceWithLineItems(invoiceData, preparedLineItems);

  // Update next generation date based on the current next generation date
  const currentNextDate = new Date(recurringInvoice.nextGenerationDate);
  const nextGenerationDate = calculateNextGenerationDate(
    currentNextDate,
    recurringInvoice.frequency as 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  );

  await storage.updateRecurringInvoice(recurringInvoiceId, recurringInvoice.userId, {
    nextGenerationDate: nextGenerationDate.toISOString().split('T')[0],
  });

  return invoice;
}

/**
 * Process all recurring invoices due for generation
 * This should be called daily by a cron job
 */
export async function processRecurringInvoices(): Promise<{
  processed: number;
  generated: number;
  errors: number;
  errorMessages: string[];
}> {
  const results = {
    processed: 0,
    generated: 0,
    errors: 0,
    errorMessages: [] as string[],
  };

  try {
    console.log('[Recurring Invoice Service] Starting recurring invoice processing...');

    // Get all recurring invoices due for generation
    const recurringInvoicesDue = await storage.getRecurringInvoicesDueForGeneration();

    results.processed = recurringInvoicesDue.length;
    console.log(`[Recurring Invoice Service] Found ${recurringInvoicesDue.length} recurring invoices due for generation`);

    // Process each recurring invoice
    for (const recurringInvoice of recurringInvoicesDue) {
      try {
        await generateInvoiceFromRecurring(recurringInvoice.id, recurringInvoice.userId);
        results.generated++;
        console.log(`[Recurring Invoice Service] Successfully generated invoice from template ${recurringInvoice.templateName}`);
      } catch (error) {
        results.errors++;
        const errorMessage = `Failed to generate invoice from template ${recurringInvoice.templateName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errorMessages.push(errorMessage);
        console.error(`[Recurring Invoice Service] ${errorMessage}`);
      }
    }

    console.log(`[Recurring Invoice Service] Processing complete. Processed: ${results.processed}, Generated: ${results.generated}, Errors: ${results.errors}`);
  } catch (error) {
    const errorMessage = `Failed to process recurring invoices: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`[Recurring Invoice Service] ${errorMessage}`);
    results.errorMessages.push(errorMessage);
  }

  return results;
}
