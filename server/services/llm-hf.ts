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
  opts?: { history?: Array<{ role: 'user' | 'assistant'; content: string }>; categorySlug?: string; }
): Promise<{ assistantMessage: string; extractedFields: ExtractedFields; confidence: number }> {
  try {
    // Build prompt for structured extraction
    const prompt = buildExtractionPrompt(userMessage, opts?.history);
    
    // Use HuggingFace text generation (free tier available)
    // You can use models like:
    // - mistralai/Mistral-7B-Instruct-v0.2
    // - meta-llama/Llama-2-7b-chat-hf
    // - google/flan-t5-base (smaller, faster)
    
    const response = await hf.chatCompletion({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that extracts lead information from customer messages.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more structured output
    });
    
    // Parse JSON response
    const extracted = parseExtractionResponse(response.choices[0]?.message?.content || '');
    
    // Generate assistant reply
    const assistantMessage = generateAssistantReply(extracted, userMessage);
    
    return {
      assistantMessage,
      extractedFields: extractedFieldsSchema.parse(extracted),
      confidence: 0.75, // Higher confidence than stub
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






