export function safeParseFloat(value: string | number | undefined | null, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(parsed) ? defaultValue : parsed;
}

