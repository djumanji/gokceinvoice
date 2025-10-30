// server/services/vector-storage.ts
// Vector storage using pgvector with HuggingFace embeddings

import { db } from '../db';
import { sql } from 'drizzle-orm';
import { generateEmbedding } from './embeddings-hf';

/**
 * Store chatbot message with vector embedding
 * 
 * @param sessionRowId - Session UUID
 * @param role - Message role
 * @param content - Message content
 * @param embeddingModel - HuggingFace model to use (default: all-MiniLM-L6-v2 = 384 dims)
 */
export async function storeMessageWithEmbedding(
  sessionRowId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  embeddingModel: string = 'sentence-transformers/all-MiniLM-L6-v2'
): Promise<void> {
  // Generate embedding using HuggingFace
  const embedding = await generateEmbedding(content, embeddingModel);
  
  // Determine vector dimension based on model
  const dimension = embeddingModel.includes('mpnet') ? 768 : 384;
  
  // Store in database with embedding
  await db.execute(sql`
    INSERT INTO chatbot_messages (
      session_id,
      role,
      content,
      embedding
    ) VALUES (
      ${sessionRowId}::uuid,
      ${role},
      ${content},
      ${sql.array(embedding)}::vector(${dimension})
    )
  `);
}

/**
 * Find similar messages using vector similarity search
 * 
 * @param queryText - Search query
 * @param limit - Number of results (default: 5)
 * @param excludeSessionId - Optional session ID to exclude
 * @param minSimilarity - Minimum similarity score (0-1, default: 0.7)
 * @returns Array of similar messages with similarity scores
 */
export async function findSimilarMessages(
  queryText: string,
  limit: number = 5,
  excludeSessionId?: string,
  minSimilarity: number = 0.7
): Promise<Array<{
  id: string;
  session_id: string;
  role: string;
  content: string;
  similarity: number;
  created_at: string;
}>> {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(queryText);
  const dimension = queryEmbedding.length;
  
  // Build SQL query
  let query = sql`
    SELECT 
      id,
      session_id,
      role,
      content,
      1 - (embedding <=> ${sql.array(queryEmbedding)}::vector(${dimension})) as similarity,
      to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at
    FROM chatbot_messages
    WHERE embedding IS NOT NULL
      AND role = 'user'
  `;
  
  if (excludeSessionId) {
    query = sql`${query} AND session_id != ${excludeSessionId}::uuid`;
  }
  
  query = sql`
    ${query}
    AND (1 - (embedding <=> ${sql.array(queryEmbedding)}::vector(${dimension}))) >= ${minSimilarity}
    ORDER BY embedding <=> ${sql.array(queryEmbedding)}::vector(${dimension})
    LIMIT ${limit}
  `;
  
  const result = await db.execute(query);
  // @ts-ignore
  const rows = (result as any).rows || (result as any) || [];
  
  return rows.map((row: any) => ({
    id: row.id,
    session_id: row.session_id,
    role: row.role,
    content: row.content,
    similarity: parseFloat(row.similarity),
    created_at: row.created_at,
  }));
}

/**
 * Get conversation context using semantic search
 * Useful for providing context to LLM responses
 * 
 * @param currentMessage - Current user message
 * @param sessionId - Current session ID
 * @param maxContextMessages - Maximum context messages to retrieve
 */
export async function getConversationContext(
  currentMessage: string,
  sessionId: string,
  maxContextMessages: number = 5
): Promise<string[]> {
  const similarMessages = await findSimilarMessages(
    currentMessage,
    maxContextMessages,
    sessionId,
    0.6 // Lower threshold for context
  );
  
  return similarMessages.map(msg => msg.content);
}


