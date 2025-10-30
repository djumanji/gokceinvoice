import { storage } from '../storage';
import { sendInvoiceEmail } from './email-service';

/**
 * Invoice Scheduler Service
 * Handles automatic processing of scheduled invoices
 */

/**
 * Process all scheduled invoices that are due to be sent
 * This function should be called periodically (e.g., every hour) by a cron job
 */
export async function processScheduledInvoices(): Promise<{
  processed: number;
  sent: number;
  errors: number;
  errorMessages: string[];
}> {
  const results = {
    processed: 0,
    sent: 0,
    errors: 0,
    errorMessages: [] as string[],
  };

  try {
    console.log('[Invoice Scheduler] Starting scheduled invoice processing...');

    // Get all scheduled invoices that are due (scheduledDate <= now)
    const scheduledInvoices = await storage.getScheduledInvoicesDue();

    results.processed = scheduledInvoices.length;
    console.log(`[Invoice Scheduler] Found ${scheduledInvoices.length} scheduled invoices due for processing`);

    // Process each scheduled invoice
    for (const invoice of scheduledInvoices) {
      try {
        await processSingleScheduledInvoice(invoice);
        results.sent++;
        console.log(`[Invoice Scheduler] Successfully sent invoice ${invoice.invoiceNumber}`);
      } catch (error) {
        results.errors++;
        const errorMessage = `Failed to send invoice ${invoice.invoiceNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errorMessages.push(errorMessage);
        console.error(`[Invoice Scheduler] ${errorMessage}`);
      }
    }

    console.log(`[Invoice Scheduler] Processing complete. Processed: ${results.processed}, Sent: ${results.sent}, Errors: ${results.errors}`);
  } catch (error) {
    const errorMessage = `Failed to process scheduled invoices: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`[Invoice Scheduler] ${errorMessage}`);
    results.errorMessages.push(errorMessage);
  }

  return results;
}

/**
 * Process a single scheduled invoice
 * - Send email to client
 * - Update invoice status to "sent"
 */
async function processSingleScheduledInvoice(invoice: any): Promise<void> {
  // Get client information
  const client = await storage.getClient(invoice.clientId);
  if (!client) {
    throw new Error(`Client not found for invoice ${invoice.invoiceNumber}`);
  }

  // Get user information for email
  const user = await storage.getUserById(invoice.userId);
  if (!user) {
    throw new Error(`User not found for invoice ${invoice.invoiceNumber}`);
  }

  // Send email to client
  const viewUrl = `${process.env.APP_DOMAIN || 'http://localhost:3000'}/invoices/view/${invoice.id}`;

  await sendInvoiceEmail({
    clientEmail: client.email,
    clientName: client.name,
    invoiceNumber: invoice.invoiceNumber,
    total: parseFloat(invoice.total),
    viewUrl,
    companyName: user.companyName || undefined,
    userName: user.name || undefined,
  });

  // Update invoice status to "sent"
  await storage.updateInvoice(invoice.id, invoice.userId, {
    status: "sent"
  });
}

/**
 * Get count of scheduled invoices for monitoring
 */
export async function getScheduledInvoicesCount(): Promise<number> {
  try {
    const count = await storage.getScheduledInvoicesCount();
    return count;
  } catch (error) {
    console.error('Failed to get scheduled invoices count:', error);
    return 0;
  }
}
