/**
 * Invoice Calculation Service
 * Contains all business logic for invoice calculations
 * Extracted from routes.ts to be testable and reusable
 */

export interface LineItemInput {
  quantity: string | number;
  price: string | number;
  description: string;
}

export interface InvoiceCalculation {
  subtotal: string;
  tax: string;
  total: string;
}

/**
 * Calculate invoice totals from line items and tax rate
 * Server-side calculation ensures data integrity - never trust client
 * 
 * @param lineItems - Array of line items with quantity and price
 * @param taxRate - Tax rate as percentage (0-100)
 * @returns Calculated subtotal, tax, and total
 * @throws Error if line items contain invalid data
 */
export function calculateInvoiceTotals(
  lineItems: LineItemInput[],
  taxRate: string | number
): InvoiceCalculation {
  // Validate line items exist
  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
    throw new Error('At least one line item is required');
  }

  // Calculate subtotal from line items
  const subtotal = lineItems.reduce((sum: number, item: LineItemInput) => {
    const qty = parseFloat(String(item.quantity));
    const price = parseFloat(String(item.price));
    
    if (isNaN(qty) || isNaN(price) || qty <= 0 || price < 0) {
      throw new Error('Invalid quantity or price in line items');
    }
    
    return sum + (qty * price);
  }, 0);

  // Validate and parse tax rate
  const taxRateNum = parseFloat(String(taxRate)) || 0;
  if (taxRateNum < 0 || taxRateNum > 100) {
    throw new Error('Tax rate must be between 0 and 100');
  }

  // Calculate tax and total
  const tax = subtotal * (taxRateNum / 100);
  const total = subtotal + tax;

  return {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
  };
}

/**
 * Validate client-provided total matches server calculation
 * Allows small rounding differences (±0.02)
 * 
 * @param serverTotal - Server-calculated total
 * @param clientTotal - Client-provided total
 * @throws Error if totals don't match within tolerance
 */
export function validateTotalMatch(
  serverTotal: string,
  clientTotal: string | number
): void {
  const server = parseFloat(serverTotal);
  const client = parseFloat(String(clientTotal));
  
  if (Math.abs(server - client) > 0.02) {
    throw new Error(
      `Total mismatch - calculation error detected. Expected: ${serverTotal}, Received: ${client.toFixed(2)}`
    );
  }
}

/**
 * Prepare line items for database insertion
 * Calculates amounts and formats numbers
 * 
 * @param lineItems - Raw line item inputs
 * @returns Formatted line items ready for database
 */
export function prepareLineItems(lineItems: LineItemInput[]): Array<{
  description: string;
  quantity: string;
  price: string;
  amount: string;
}> {
  return lineItems.map(item => {
    const qty = parseFloat(String(item.quantity));
    const price = parseFloat(String(item.price));
    const amount = qty * price;

    return {
      description: item.description,
      quantity: qty.toString(),
      price: price.toFixed(2),
      amount: amount.toFixed(2),
    };
  });
}

