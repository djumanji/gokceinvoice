// scripts/backfill-embeddings.ts
// Backfill embeddings for existing chatbot messages

import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import { generateEmbedding } from '../server/services/embeddings-hf';

async function backfillEmbeddings() {
  console.log('🔄 Starting embedding backfill...');
  
  // Get messages without embeddings (in batches)
  const batchSize = 10;
  let offset = 0;
  let processed = 0;
  
  while (true) {
    const result = await db.execute(sql`
      SELECT id, content
      FROM chatbot_messages
      WHERE embedding IS NULL
      ORDER BY created_at DESC
      LIMIT ${batchSize}
      OFFSET ${offset}
    `);
    
    // @ts-ignore
    const rows = (result as any).rows || (result as any) || [];
    
    if (rows.length === 0) {
      console.log('✅ No more messages to process');
      break;
    }
    
    console.log(`📦 Processing batch ${offset / batchSize + 1} (${rows.length} messages)...`);
    
    // Process each message
    for (const row of rows) {
      try {
        console.log(`  → Embedding: ${row.content.substring(0, 50)}...`);
        
        // Generate embedding
        const embedding = await generateEmbedding(row.content);
        
        // Update database
        await db.execute(sql`
          UPDATE chatbot_messages
          SET embedding = ${sql.array(embedding)}::vector(384)
          WHERE id = ${row.id}::uuid
        `);
        
        processed++;
        
        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`  ❌ Error processing message ${row.id}:`, error);
        // Continue with next message
      }
    }
    
    offset += batchSize;
    
    // Progress update
    if (processed % 50 === 0) {
      console.log(`✅ Processed ${processed} messages so far...`);
    }
  }
  
  console.log(`🎉 Backfill complete! Processed ${processed} messages.`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  backfillEmbeddings()
    .then(() => {
      console.log('✅ Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { backfillEmbeddings };







