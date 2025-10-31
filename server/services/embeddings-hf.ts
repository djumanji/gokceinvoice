// server/services/embeddings-hf.ts
// HuggingFace Embeddings Service - FREE alternative to OpenAI

import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_TOKEN);

/**
 * Generate embeddings using HuggingFace models
 * This is FREE (no API costs) compared to OpenAI's $0.02/1M tokens
 * 
 * @param text - Text to embed
 * @param model - HuggingFace model name (default: all-MiniLM-L6-v2)
 * @returns Vector array (384 dimensions for default model)
 */
export async function generateEmbedding(
  text: string,
  model: string = 'sentence-transformers/all-MiniLM-L6-v2'
): Promise<number[]> {
  try {
    const response = await hf.featureExtraction({
      model,
      inputs: text,
    });
    
    // Convert Float32Array to regular array for pgvector
    return Array.from(response as Float32Array);
  } catch (error) {
    console.error('HuggingFace embedding error:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch generate embeddings (more efficient)
 * 
 * @param texts - Array of texts to embed
 * @param model - HuggingFace model name
 * @returns Array of vector arrays
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
    
    // Response is array of Float32Arrays
    return (response as Float32Array[]).map(arr => Array.from(arr));
  } catch (error) {
    console.error('HuggingFace batch embedding error:', error);
    throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Available HuggingFace embedding models:
 * 
 * - sentence-transformers/all-MiniLM-L6-v2 (384 dims, fast, good quality)
 * - sentence-transformers/all-mpnet-base-v2 (768 dims, better quality, slower)
 * - sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 (384 dims, multilingual)
 * 
 * Cost: FREE (no API costs)
 */






