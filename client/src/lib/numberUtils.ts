/**
 * Safely parse a value to a float, returning a default value if parsing fails
 * @param value - The value to parse
 * @param defaultValue - The default value to return if parsing fails (default: 0)
 * @returns The parsed float or the default value
 */
export function safeParseFloat(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely parse a value to an integer, returning a default value if parsing fails
 * @param value - The value to parse
 * @param defaultValue - The default value to return if parsing fails (default: 0)
 * @returns The parsed integer or the default value
 */
export function safeParseInt(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Format a number as currency
 * @param value - The number to format
 * @param currency - The currency code (default: 'EUR')
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns The formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'EUR', locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
}
