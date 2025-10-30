import { z } from 'zod';

export const extractedFieldsSchema = z.object({
  customer_name: z.string().min(1).max(255).optional(),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().min(7).max(20).optional(),
  customer_zip_code: z.string().min(3).max(10).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(5000).optional(),
  budget_min: z.number().nonnegative().optional(),
  budget_max: z.number().nonnegative().optional(),
  urgency_level: z.enum(['low','medium','high','urgent']).optional(),
  needed_at: z.string().datetime().optional(),
});

export type ExtractedFields = z.infer<typeof extractedFieldsSchema>;

export async function extractLeadFieldsViaLLM(userMessage: string, opts?: { history?: Array<{ role: 'user'|'assistant'; content: string }>; categorySlug?: string; }): Promise<{ assistantMessage: string; extractedFields: ExtractedFields; confidence: number; }>{
  // Fallback stub extraction until LLM provider is configured
  const extracted: ExtractedFields = {};

  // Naive budget extraction
  const moneyMatch = userMessage.match(/\$?\s?(\d{2,6})(?:\s?-\s?\$?\s?(\d{2,6}))?/i);
  if (moneyMatch) {
    const min = Number(moneyMatch[1]);
    const max = moneyMatch[2] ? Number(moneyMatch[2]) : undefined;
    if (!Number.isNaN(min)) extracted.budget_min = min;
    if (max && !Number.isNaN(max)) extracted.budget_max = max;
  }

  // Naive urgency
  if (/urgent|asap|soon/i.test(userMessage)) extracted.urgency_level = 'urgent';

  // Naive date/time extraction
  const datePatterns = [
    // "on Nov 3", "Nov 3rd", "November 3"
    /(?:on\s+)?([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
    // "tomorrow", "next week", "this weekend"
    /\b(tomorrow|next\s+(?:week|month)|this\s+(?:week|weekend|month))\b/i,
    // "in 2 days", "in 3 weeks"
    /in\s+(\d+)\s+(day|week|month)s?/i,
  ];

  for (const pattern of datePatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      let date: Date | null = null;

      if (match[1] && match[2]) {
        // Month day format like "Nov 3"
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIndex = monthNames.findIndex(m => match[1].toLowerCase().startsWith(m));
        if (monthIndex >= 0) {
          const day = parseInt(match[2]);
          date = new Date();
          date.setMonth(monthIndex, day);
          // If the date is in the past, assume next year
          if (date < new Date()) {
            date.setFullYear(date.getFullYear() + 1);
          }
        }
      } else if (match[1] === 'tomorrow') {
        date = new Date();
        date.setDate(date.getDate() + 1);
      } else if (match[1] === 'next week') {
        date = new Date();
        date.setDate(date.getDate() + 7);
      } else if (match[1] === 'next month') {
        date = new Date();
        date.setMonth(date.getMonth() + 1);
      } else if (match[1] === 'this weekend') {
        date = new Date();
        const daysUntilWeekend = (6 - date.getDay()) % 7; // Saturday
        if (daysUntilWeekend === 0) daysUntilWeekend = 7; // Next Saturday if today is Saturday
        date.setDate(date.getDate() + daysUntilWeekend);
      } else if (match[1] && match[2]) {
        // "in X days/weeks/months"
        const amount = parseInt(match[1]);
        const unit = match[2];
        date = new Date();
        if (unit.startsWith('day')) {
          date.setDate(date.getDate() + amount);
        } else if (unit.startsWith('week')) {
          date.setDate(date.getDate() + amount * 7);
        } else if (unit.startsWith('month')) {
          date.setMonth(date.getMonth() + amount);
        }
      }

      if (date) {
        extracted.needed_at = date.toISOString();
        break; // Use first match found
      }
    }
  }

  // Simple description/title
  extracted.description = userMessage.slice(0, 1000);

  const validated = extractedFieldsSchema.parse(extracted);

  const reply = "Got it. Could you share your ZIP code and the best phone or email to reach you?";

  return { assistantMessage: reply, extractedFields: validated, confidence: 0.35 };
}
