/**
 * Invoice calculation service
 * Centralizes all invoice total calculations to prevent duplication
 */

export interface LineItem {
  quantity: string;
  price: string;
  description: string;
}

export interface InvoiceTotals {
  subtotal: string;
  tax: string;
  total: string;
}

/**
 * Calculates invoice totals from line items and tax rate
 */
export function calculateInvoiceTotals(
  lineItems: LineItem[],
  taxRate: string
): InvoiceTotals {
  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity);
    const price = parseFloat(item.price);
    if (isNaN(qty) || isNaN(price) || qty <= 0 || price < 0) {
      throw new Error("Invalid quantity or price in line items");
    }
    return sum + (qty * price);
  }, 0);

  const taxRateNum = parseFloat(taxRate) || 0;
  if (taxRateNum < 0 || taxRateNum > 100) {
    throw new Error("Tax rate must be between 0 and 100");
  }

  const tax = subtotal * (taxRateNum / 100);
  const total = subtotal + tax;

  return {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
  };
}

/**
 * Validates client-provided total against server-calculated total
 */
export function validateTotal(
  clientTotal: string,
  calculatedTotal: string,
  tolerance: number = 0.02
): boolean {
  const client = parseFloat(clientTotal);
  const calculated = parseFloat(calculatedTotal);
  return Math.abs(calculated - client) <= tolerance;
}

