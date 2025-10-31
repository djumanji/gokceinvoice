import { randomBytes } from 'crypto';
import { db } from '../db';
import { sql } from 'drizzle-orm';

export type ChatbotSession = {
  id: string;
  session_id: string;
  phase: string;
  category_id: string | null;
  created_at: string;
};

function generateSessionId(): string {
  // 32 bytes -> 43 char base64url
  return randomBytes(24).toString('base64url');
}

export async function createChatbotSession(params: { categoryId?: string | null }): Promise<ChatbotSession> {
  const sessionId = generateSessionId();
  const categoryId = params.categoryId ?? null;
  const result = await db.execute(sql<ChatbotSession>`
    INSERT INTO chatbot_sessions (session_id, category_id, phase)
    VALUES (${sessionId}, ${categoryId}, 'description')
    RETURNING id, session_id, phase, category_id, to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at
  `);
  // drizzle execute returns { rows }
  // @ts-ignore
  const row = (result as any).rows?.[0] || (result as any)[0];
  return row as ChatbotSession;
}

export async function findCategoryIdBySlug(slug: string): Promise<string | null> {
  const result = await db.execute(sql<{ id: string }>`
    SELECT id FROM categories WHERE slug = ${slug} LIMIT 1
  `);
  // @ts-ignore
  const row = (result as any).rows?.[0] || (result as any)[0];
  return row?.id ?? null;
}

export async function getChatbotSessionByPublicId(publicSessionId: string): Promise<ChatbotSession | null> {
  const result = await db.execute(sql<ChatbotSession>`
    SELECT id, session_id, phase, category_id, to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at
    FROM chatbot_sessions
    WHERE session_id = ${publicSessionId}
    LIMIT 1
  `);
  // @ts-ignore
  const row = (result as any).rows?.[0] || (result as any)[0];
  return row ?? null;
}

export async function insertChatbotMessage(params: { sessionRowId: string; role: 'user'|'assistant'|'system'; content: string; extractedFields?: Record<string, unknown> | null; tokensUsed?: number | null; }): Promise<void> {
  const extractedFieldsJson = params.extractedFields ? JSON.stringify(params.extractedFields) : null;
  await db.execute(sql`
    INSERT INTO chatbot_messages (session_id, role, content, tokens_used, extracted_fields)
    VALUES (${params.sessionRowId}::uuid, ${params.role}, ${params.content}, ${params.tokensUsed ?? null}, ${extractedFieldsJson}::jsonb)
  `);
}

export async function incrementSessionCounters(sessionRowId: string, delta: { user?: number; assistant?: number }): Promise<void> {
  const userDelta = delta.user ?? 0;
  const assistantDelta = delta.assistant ?? 0;
  await db.execute(sql`
    UPDATE chatbot_sessions
    SET user_message_count = user_message_count + ${userDelta},
        assistant_message_count = assistant_message_count + ${assistantDelta}
    WHERE id = ${sessionRowId}::uuid
  `);
}

export type ChatbotMessage = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  extracted_fields: Record<string, unknown> | null;
  created_at: string;
};

export async function getChatbotMessages(sessionRowId: string): Promise<ChatbotMessage[]> {
  const result = await db.execute(sql<ChatbotMessage>`
    SELECT 
      id,
      session_id,
      role,
      content,
      extracted_fields,
      to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at
    FROM chatbot_messages
    WHERE session_id = ${sessionRowId}::uuid
    ORDER BY created_at ASC
  `);
  // @ts-ignore
  return (result as any).rows || result || [];
}
