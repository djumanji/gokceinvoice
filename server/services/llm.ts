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
  // Try to use HuggingFace if configured, otherwise fallback to stub
  if (process.env.HF_TOKEN) {
    try {
      const { extractLeadFieldsViaHuggingFace } = await import('./llm-hf');
      console.log('[LLM] Using HuggingFace for extraction');
      return await extractLeadFieldsViaHuggingFace(userMessage, opts);
    } catch (error) {
      console.error('[LLM] HuggingFace error, falling back to stub:', error);
      // Fall through to stub implementation
    }
  } else {
    console.log('[LLM] HF_TOKEN not configured, using stub extraction');
  }

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
        let daysUntilWeekend = (6 - date.getDay()) % 7; // Saturday
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

  // Extract email if present
  const emailMatch = userMessage.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) extracted.customer_email = emailMatch[0];

  // Extract phone if present
  const phoneMatch = userMessage.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  if (phoneMatch) {
    extracted.customer_phone = phoneMatch[0].replace(/\s/g, '');
  }

  // Extract ZIP code if present
  const zipMatch = userMessage.match(/\b\d{5}(?:-\d{4})?\b/);
  if (zipMatch) extracted.customer_zip_code = zipMatch[0];

  // Extract name if conversation history suggests it
  if (opts?.history && opts.history.length > 0) {
    const namePatterns = [
      /(?:my name is|I'm|I am|call me|name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s+here|speaking)/i,
    ];
    for (const pattern of namePatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        extracted.customer_name = match[1].trim();
        break;
      }
    }
  }

  const validated = extractedFieldsSchema.parse(extracted);

  // Generate a more contextual reply based on what's missing
  const missingFields: string[] = [];
  if (!extracted.customer_zip_code) missingFields.push('ZIP code');
  if (!extracted.customer_email && !extracted.customer_phone) missingFields.push('phone or email');
  if (!extracted.customer_name && userMessage.length > 20) missingFields.push('name');

  let reply: string;
  if (missingFields.length > 0) {
    if (missingFields.length === 1) {
      reply = `Got it! Could you share your ${missingFields[0]}?`;
    } else {
      reply = `Got it! Could you share your ${missingFields.slice(0, -1).join(', ')} and ${missingFields[missingFields.length - 1]}?`;
    }
  } else {
    reply = "Perfect! I have all the information I need. Click 'Confirm & Submit' when you're ready!";
  }

  return { assistantMessage: reply, extractedFields: validated, confidence: 0.45 };
}
