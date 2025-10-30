# 🔄 How pgvector Works with Embeddings

## ⚠️ Important Clarification

**pgvector does NOT convert text to embeddings.** It only stores and searches vectors.

You need a **separate embedding API** to convert text → vectors, then pgvector stores those vectors.

---

## 📊 The Complete Workflow

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐      ┌─────────────┐
│   Text      │  →   │  Embedding   │  →   │   pgvector   │  →   │   Search   │
│ "Hello..."  │      │    API       │      │  (PostgreSQL) │      │  Results    │
└─────────────┘      └──────────────┘      └──────────────┘      └─────────────┘
   User Message        OpenAI/Cohere        Store Vector          Similarity
```

### Step-by-Step Process:

1. **User sends message**: `"I need help with invoice management"`
2. **Your app calls embedding API** (OpenAI/Cohere/etc.)
3. **API returns vector**: `[0.123, -0.456, 0.789, ..., 0.234]` (1536 dimensions)
4. **Your app stores in pgvector**: Insert vector into PostgreSQL
5. **Search**: pgvector finds similar vectors using cosine similarity

---

## 🔧 Implementation Example

### 1. Text → Embedding (Your Code)

```typescript
// server/services/embeddings.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  // Returns: [0.123, -0.456, 0.789, ...] (1536 numbers)
  return response.data[0].embedding;
}
```

### 2. Store in pgvector (PostgreSQL)

```typescript
// server/services/vector-storage.ts
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { generateEmbedding } from './embeddings';

export async function storeChatbotMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
) {
  // Step 1: Convert text to embedding
  const embedding = await generateEmbedding(content);
  
  // Step 2: Store in pgvector
  await db.execute(sql`
    INSERT INTO chatbot_message_vectors (
      session_id,
      role,
      content,
      embedding  -- This is the vector array
    ) VALUES (
      ${sessionId}::uuid,
      ${role},
      ${content},
      ${sql.array(embedding)}::vector  -- pgvector stores this
    )
  `);
}
```

### 3. Search Similar Messages (pgvector)

```typescript
export async function findSimilarMessages(
  queryText: string,
  limit: number = 5
) {
  // Step 1: Convert query to embedding
  const queryEmbedding = await generateEmbedding(queryText);
  
  // Step 2: Search using pgvector cosine similarity
  const results = await db.execute(sql`
    SELECT 
      content,
      role,
      session_id,
      1 - (embedding <=> ${sql.array(queryEmbedding)}::vector) as similarity
    FROM chatbot_message_vectors
    WHERE role = 'user'
    ORDER BY embedding <=> ${sql.array(queryEmbedding)}::vector
    LIMIT ${limit}
  `);
  
  return results;
}
```

---

## 🎯 Embedding API Options

### Option 1: OpenAI (Recommended)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',  // $0.02 per 1M tokens
    input: text,
  });
  return response.data[0].embedding;  // 1536 dimensions
}
```

**Cost:** $0.02 per 1M tokens  
**Dimensions:** 1536  
**Speed:** Fast (API call ~100-300ms)

### Option 2: Cohere

```typescript
import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

async function getEmbedding(text: string): Promise<number[]> {
  const response = await cohere.embed({
    texts: [text],
    model: 'embed-english-v3.0',
  });
  return response.embeddings[0];  // 1024 dimensions
}
```

**Cost:** $0.10 per 1M tokens  
**Dimensions:** 1024  
**Speed:** Fast (API call ~100-300ms)

### Option 3: HuggingFace (Self-hosted)

```typescript
// Requires running your own model server
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('http://localhost:8080/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return response.json().embedding;
}
```

**Cost:** $0 (compute only - need GPU server ~$50-200/month)  
**Dimensions:** Varies (usually 384 or 768)  
**Speed:** Slower (self-hosted, depends on hardware)

### Option 4: Google (Gemini)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function getEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'embedding-001' });
  const result = await model.embedContent(text);
  return result.embedding.values;  // 768 dimensions
}
```

**Cost:** ~$0.15 per 1M tokens  
**Dimensions:** 768  
**Speed:** Fast (API call ~100-300ms)

---

## 📐 Vector Dimensions Explained

Each embedding API returns a different number of dimensions:

| Provider | Model | Dimensions | Quality | Cost |
|----------|-------|------------|---------|------|
| OpenAI | text-embedding-3-small | 1536 | High | $0.02/1M |
| OpenAI | text-embedding-3-large | 3072 | Very High | $0.13/1M |
| Cohere | embed-english-v3.0 | 1024 | High | $0.10/1M |
| Google | text-embedding-004 | 768 | Good | $0.15/1M |
| HuggingFace | sentence-transformers/all-MiniLM-L6-v2 | 384 | Good | Free |

**What are dimensions?**
- Each number represents a feature/meaning of the text
- More dimensions = more nuanced understanding
- pgvector stores these as arrays: `[0.123, -0.456, ...]`

---

## 🗄️ Database Schema Setup

### Enable pgvector Extension

```sql
-- Run this once in your Neon database
CREATE EXTENSION IF NOT EXISTS vector;
```

### Create Table with Vector Column

```sql
-- Add vector column to existing chatbot_messages table
ALTER TABLE chatbot_messages 
ADD COLUMN embedding vector(1536);  -- 1536 = OpenAI dimensions

-- Or create new table for vectors
CREATE TABLE chatbot_message_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  embedding vector(1536),  -- pgvector column
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast similarity search
CREATE INDEX ON chatbot_message_vectors 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- Adjust based on data size
```

---

## 🔍 How Similarity Search Works

pgvector uses **cosine similarity** to find similar vectors:

```sql
-- Find most similar messages
SELECT 
  content,
  1 - (embedding <=> '[0.123, -0.456, ...]'::vector) as similarity
FROM chatbot_message_vectors
ORDER BY embedding <=> '[0.123, -0.456, ...]'::vector
LIMIT 5;
```

**Operators:**
- `<=>` = Cosine distance (0 = identical, 2 = opposite)
- `<->` = Euclidean distance
- `<#>` = Negative inner product

**Similarity Score:**
- `1 - distance` = similarity (0 to 1)
- 1.0 = identical
- 0.8+ = very similar
- 0.5-0.8 = somewhat similar
- <0.5 = not similar

---

## 💡 Complete Workflow Example

### Storing a Chatbot Message

```typescript
// 1. User sends message
const userMessage = "I need help creating an invoice";

// 2. Generate embedding (call OpenAI API)
const embedding = await generateEmbedding(userMessage);
// Returns: [0.123, -0.456, 0.789, ..., 0.234] (1536 numbers)

// 3. Store in database with pgvector
await db.execute(sql`
  INSERT INTO chatbot_message_vectors (
    session_id,
    role,
    content,
    embedding
  ) VALUES (
    ${sessionId}::uuid,
    'user',
    ${userMessage},
    ${sql.array(embedding)}::vector(1536)
  )
`);

// 4. Also store original text for reference
await insertChatbotMessage({
  sessionRowId: sessionId,
  role: 'user',
  content: userMessage,
});
```

### Searching for Similar Messages

```typescript
// 1. User asks: "How do I make an invoice?"
const query = "How do I make an invoice?";

// 2. Generate embedding for query
const queryEmbedding = await generateEmbedding(query);

// 3. Find similar messages using pgvector
const similarMessages = await db.execute(sql`
  SELECT 
    content,
    role,
    session_id,
    1 - (embedding <=> ${sql.array(queryEmbedding)}::vector) as similarity
  FROM chatbot_message_vectors
  WHERE role = 'user'
    AND session_id != ${sessionId}::uuid  -- Exclude current session
  ORDER BY embedding <=> ${sql.array(queryEmbedding)}::vector
  LIMIT 5
`);

// 4. Use similar messages as context for LLM
const context = similarMessages
  .map(m => m.content)
  .join('\n');

// 5. Send to LLM with context
const llmResponse = await callLLM(`
  Previous similar conversations:
  ${context}
  
  Current question: ${query}
`);
```

---

## ⚡ Performance Considerations

### Batch Embeddings

**Bad:** One API call per message
```typescript
for (const message of messages) {
  const embedding = await generateEmbedding(message);  // Slow!
}
```

**Good:** Batch multiple messages
```typescript
const embeddings = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: messages,  // Array of texts
});
// Returns embeddings for all messages at once
```

### Cache Embeddings

```typescript
// Don't re-embed the same text
const cache = new Map<string, number[]>();

async function getEmbeddingCached(text: string): Promise<number[]> {
  if (cache.has(text)) {
    return cache.get(text)!;
  }
  
  const embedding = await generateEmbedding(text);
  cache.set(text, embedding);
  return embedding;
}
```

### Index Optimization

```sql
-- For < 1M vectors
CREATE INDEX ON chatbot_message_vectors 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- For > 1M vectors
CREATE INDEX ON chatbot_message_vectors 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 1000);
```

---

## 🔗 Summary

1. **pgvector** = Storage & Search (PostgreSQL extension)
2. **Embedding API** = Text → Vector conversion (OpenAI/Cohere/etc.)
3. **Your Code** = Orchestrates both

**Workflow:**
```
Text → Embedding API → Vector Array → pgvector Storage → Similarity Search
```

**Cost:**
- Embeddings: $0.02-0.20/month (OpenAI API)
- Storage: Included in Neon PostgreSQL ($0-69/month)
- **Total: $0.02-69/month** (no separate vector DB needed!)

---

## 🚀 Next Steps

1. ✅ Choose embedding provider (OpenAI recommended)
2. ✅ Enable pgvector extension in Neon
3. ✅ Create vector column in chatbot_messages table
4. ✅ Implement embedding generation function
5. ✅ Store embeddings when messages are created
6. ✅ Implement similarity search

Would you like me to implement this complete solution?





