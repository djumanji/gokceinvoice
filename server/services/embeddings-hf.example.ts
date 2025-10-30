// Example: Using HuggingFace embeddings with pgvector
// This shows how to use HuggingFace MCP or direct API for embeddings

import { HfInference } from '@huggingface/inference';

// Initialize HuggingFace client
const hf = new HfInference(process.env.HF_TOKEN);

/**
 * Generate embeddings using HuggingFace models
 * This is a FREE alternative to OpenAI embeddings
 */
export async function generateHuggingFaceEmbedding(
  text: string,
  model: string = 'sentence-transformers/all-MiniLM-L6-v2'
): Promise<number[]> {
  try {
    const response = await hf.featureExtraction({
      model,
      inputs: text,
    });
    
    // Convert to array format for pgvector
    return Array.from(response as Float32Array);
  } catch (error) {
    console.error('HuggingFace embedding error:', error);
    throw error;
  }
}

/**
 * Batch generate embeddings (more efficient)
 */
export async function generateBatchEmbeddings(
  texts: string[],
  model: string = 'sentence-transformers/all-MiniLM-L6-v2'
): Promise<number[][]> {
  try {
    const response = await hf.featureExtraction({
      model,
      inputs: texts,
    });
    
    // Response is array of arrays
    return (response as Float32Array[]).map(arr => Array.from(arr));
  } catch (error) {
    console.error('HuggingFace batch embedding error:', error);
    throw error;
  }
}

/**
 * Available HuggingFace embedding models:
 * 
 * - sentence-transformers/all-MiniLM-L6-v2 (384 dims, fast, good)
 * - sentence-transformers/all-mpnet-base-v2 (768 dims, better quality)
 * - sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 (384 dims, multilingual)
 */

// Usage example:
// const embedding = await generateHuggingFaceEmbedding("I need help with invoices");
// Store in pgvector: INSERT INTO chatbot_message_vectors (embedding) VALUES ($1::vector(384));


