// server/services/llm-hf.ts
// Enhanced LLM extraction using HuggingFace models

import { HfInference } from '@huggingface/inference';
import { z } from 'zod';
import { extractedFieldsSchema, type ExtractedFields } from './llm';

const hf = new HfInference(process.env.HF_TOKEN);

/**
 * Extract lead fields using HuggingFace LLM
 * Uses free models like Mistral or Llama for structured extraction
 * 
 * @param userMessage - User's message
 * @param opts - Options including conversation history
 */
export async function extractLeadFieldsViaHuggingFace(
  userMessage: string,
  opts?: { history?: Array<{ role: 'user' | 'assistant'; content: string }>; categorySlug?: string; categoryName?: string; }
): Promise<{ assistantMessage: string; extractedFields: ExtractedFields; confidence: number }> {
  try {
    // Build system prompt with category context
    const categoryContext = opts?.categoryName
      ? `The customer is looking for ${opts.categoryName} services.`
      : 'You are helping a customer find a service provider.';

    // Build conversation history as a text prompt
    let conversationText = `You are a friendly lead capture assistant. ${categoryContext} Ask relevant questions to get: name, email, phone, ZIP code.\n\n`;

    if (opts?.history && opts.history.length > 0) {
      for (const msg of opts.history) {
        conversationText += `${msg.role === 'user' ? 'Customer' : 'Assistant'}: ${msg.content}\n`;
      }
    }

    conversationText += `Customer: ${userMessage}\nAssistant:`;

    // Use text generation with a well-supported model
    const response = await hf.textGeneration({
      model: 'microsoft/Phi-3-mini-4k-instruct',
      inputs: conversationText,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7,
        return_full_text: false,
      },
    });

    const assistantMessage = response.generated_text.trim() ||
      "Could you tell me more about what you need?";

    // Extract any structured data from the user's message
    const extracted = extractStructuredData(userMessage);

    return {
      assistantMessage,
      extractedFields: extractedFieldsSchema.parse(extracted),
      confidence: 0.75,
    };
  } catch (error) {
    console.error('HuggingFace LLM extraction error:', error);
    // Fallback to stub extraction
    return fallbackExtraction(userMessage);
  }
}

/**
 * Generate chatbot response using HuggingFace
 */
export async function generateChatbotResponse(
  userMessage: string,
  context: string[] = []
): Promise<string> {
  try {
    const contextText = context.length > 0 
      ? `Previous similar conversations:\n${context.join('\n---\n')}\n\n`
      : '';
    
    const prompt = `${contextText}User: ${userMessage}\nAssistant:`;
    
    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: prompt,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
        return_full_text: false,
      },
    });
    
    return response.generated_text.trim();
  } catch (error) {
    console.error('HuggingFace response generation error:', error);
    return "I understand. Could you share your ZIP code and the best phone or email to reach you?";
  }
}

// Helper functions

/**
 * Extract structured data from user message (email, phone, ZIP, etc.)
 */
function extractStructuredData(userMessage: string): Partial<ExtractedFields> {
  const extracted: Partial<ExtractedFields> = {};

  // Extract email
  const emailMatch = userMessage.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) extracted.customer_email = emailMatch[0];

  // Extract phone
  const phoneMatch = userMessage.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  if (phoneMatch) {
    extracted.customer_phone = phoneMatch[0].replace(/\s/g, '');
  }

  // Extract ZIP
  const zipMatch = userMessage.match(/\b\d{5}(?:-\d{4})?\b/);
  if (zipMatch) extracted.customer_zip_code = zipMatch[0];

  // Extract name
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

  // Store description
  extracted.description = userMessage.slice(0, 1000);

  return extracted;
}

function buildExtractionPrompt(
  userMessage: string,
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  const historyText = history
    ? history.map(h => `${h.role}: ${h.content}`).join('\n')
    : '';

  return `Extract information from this customer message. Return JSON with: customer_name, customer_email, customer_phone, customer_zip_code, title, description, budget_min, budget_max, urgency_level, needed_at.

${historyText ? `Conversation history:\n${historyText}\n\n` : ''}
Customer message: "${userMessage}"

Return only valid JSON:`;
}

function parseExtractionResponse(text: string): Partial<ExtractedFields> {
  try {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch {
    return {};
  }
}

function generateAssistantReply(
  extracted: Partial<ExtractedFields>,
  userMessage: string
): string {
  const missingFields: string[] = [];
  
  if (!extracted.customer_zip_code) missingFields.push('ZIP code');
  if (!extracted.customer_email && !extracted.customer_phone) missingFields.push('phone or email');
  
  if (missingFields.length > 0) {
    return `Got it! Could you share your ${missingFields.join(' and ')}?`;
  }
  
  return "Perfect! I have all the information I need. Thank you!";
}

function fallbackExtraction(userMessage: string): { assistantMessage: string; extractedFields: ExtractedFields; confidence: number } {
  // Fallback to simple extraction
  const extracted: Partial<ExtractedFields> = {};
  
  // Basic pattern matching
  const emailMatch = userMessage.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) extracted.customer_email = emailMatch[0];
  
  const phoneMatch = userMessage.match(/[\d\s\-\(\)]{10,}/);
  if (phoneMatch) extracted.customer_phone = phoneMatch[0].replace(/\s/g, '');
  
  extracted.description = userMessage.slice(0, 1000);
  
  return {
    assistantMessage: "Got it. Could you share your ZIP code and the best phone or email to reach you?",
    extractedFields: extractedFieldsSchema.parse(extracted),
    confidence: 0.35,
  };
}







