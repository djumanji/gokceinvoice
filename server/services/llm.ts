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

  // Simple description/title
  extracted.description = userMessage.slice(0, 1000);

  const validated = extractedFieldsSchema.parse(extracted);

  const reply = "Got it. Could you share your ZIP code and the best phone or email to reach you?";

  return { assistantMessage: reply, extractedFields: validated, confidence: 0.35 };
}
