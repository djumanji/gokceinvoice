// scripts/benchmark-huggingface-models.ts
// Benchmark different HuggingFace models to find the best one

import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_TOKEN);

interface BenchmarkResult {
  model: string;
  dimensions: number;
  avgLatencyMs: number;
  qualityScore: number;
  throughput: number; // embeddings per second
}

/**
 * Test embedding models
 */
async function benchmarkEmbeddingModels(): Promise<BenchmarkResult[]> {
  const models = [
    'sentence-transformers/all-MiniLM-L6-v2',
    'sentence-transformers/all-mpnet-base-v2',
    'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
    'intfloat/e5-small-v2',
  ];
  
  // Test texts similar to your chatbot use case
  const testTexts = [
    'I need help with invoice management',
    'How do I create an invoice?',
    'Invoice templates and billing questions',
    'Can you help me with my billing?',
    'I want to generate invoices',
  ];
  
  const results: BenchmarkResult[] = [];
  
  for (const model of models) {
    console.log(`\n🧪 Testing ${model}...`);
    
    try {
      // Test 1: Latency (single request)
      const startTime = Date.now();
      const embedding = await hf.featureExtraction({
        model,
        inputs: testTexts[0],
      });
      const latencyMs = Date.now() - startTime;
      
      // Test 2: Batch processing
      const batchStartTime = Date.now();
      const batchEmbeddings = await hf.featureExtraction({
        model,
        inputs: testTexts,
      });
      const batchTimeMs = Date.now() - batchStartTime;
      const avgLatencyMs = batchTimeMs / testTexts.length;
      
      // Test 3: Quality (semantic similarity)
      const embeddings = batchEmbeddings as Float32Array[];
      const qualityScore = calculateSimilarityQuality(embeddings);
      
      // Get dimensions
      const dimensions = (embedding as Float32Array).length;
      
      // Calculate throughput
      const throughput = (testTexts.length / batchTimeMs) * 1000;
      
      results.push({
        model,
        dimensions,
        avgLatencyMs: Math.round(avgLatencyMs),
        qualityScore: Math.round(qualityScore * 100) / 100,
        throughput: Math.round(throughput * 100) / 100,
      });
      
      console.log(`  ✅ Dimensions: ${dimensions}`);
      console.log(`  ✅ Avg Latency: ${avgLatencyMs}ms`);
      console.log(`  ✅ Quality Score: ${qualityScore.toFixed(2)}`);
      console.log(`  ✅ Throughput: ${throughput.toFixed(2)} embeddings/sec`);
    } catch (error) {
      console.error(`  ❌ Error testing ${model}:`, error);
    }
  }
  
  return results.sort((a, b) => {
    // Sort by quality score (higher is better)
    return b.qualityScore - a.qualityScore;
  });
}

/**
 * Calculate similarity quality score
 * Higher score = better at distinguishing similar vs dissimilar texts
 */
function calculateSimilarityQuality(embeddings: Float32Array[]): number {
  // Texts 0 and 1 are similar (both about invoices)
  // Texts 0 and 3 are similar (both about help)
  // Texts 0 and 4 are somewhat similar (both about invoices)
  
  const similarities = [
    cosineSimilarity(embeddings[0], embeddings[1]), // Should be HIGH (both about invoices)
    cosineSimilarity(embeddings[0], embeddings[2]), // Should be MEDIUM (related topics)
    cosineSimilarity(embeddings[0], embeddings[3]), // Should be HIGH (both about help)
    cosineSimilarity(embeddings[0], embeddings[4]), // Should be HIGH (both about invoices)
  ];
  
  // Quality score: average of similarities
  // Higher = better semantic understanding
  return similarities.reduce((a, b) => a + b, 0) / similarities.length;
}

/**
 * Calculate cosine similarity between two embeddings
 */
function cosineSimilarity(emb1: Float32Array, emb2: Float32Array): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < emb1.length; i++) {
    dotProduct += emb1[i] * emb2[i];
    norm1 += emb1[i] * emb1[i];
    norm2 += emb2[i] * emb2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Test text generation models
 */
async function benchmarkTextGenerationModels(): Promise<Array<{
  model: string;
  avgLatencyMs: number;
  qualityScore: number;
  tokensPerSecond: number;
}>> {
  const models = [
    'mistralai/Mistral-7B-Instruct-v0.2',
    'meta-llama/Llama-2-7b-chat-hf',
    'google/flan-t5-base',
  ];
  
  const testPrompt = 'Extract customer name and email from: "Hi, I am John Doe, email is john@example.com"';
  
  const results = [];
  
  for (const model of models) {
    console.log(`\n🧪 Testing ${model}...`);
    
    try {
      const startTime = Date.now();
      const response = await hf.textGeneration({
        model,
        inputs: testPrompt,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.3,
        },
      });
      const latencyMs = Date.now() - startTime;
      
      // Simple quality check: does it extract the info?
      const qualityScore = response.generated_text.includes('John') && 
                          response.generated_text.includes('john@example.com') 
                        ? 1.0 : 0.5;
      
      const tokensPerSecond = (response.generated_text.length / latencyMs) * 1000;
      
      results.push({
        model,
        avgLatencyMs: latencyMs,
        qualityScore,
        tokensPerSecond: Math.round(tokensPerSecond * 100) / 100,
      });
      
      console.log(`  ✅ Latency: ${latencyMs}ms`);
      console.log(`  ✅ Quality: ${qualityScore}`);
      console.log(`  ✅ Throughput: ${tokensPerSecond.toFixed(2)} tokens/sec`);
      console.log(`  ✅ Response: ${response.generated_text.substring(0, 100)}...`);
    } catch (error) {
      console.error(`  ❌ Error testing ${model}:`, error);
    }
  }
  
  return results.sort((a, b) => b.qualityScore - a.qualityScore);
}

/**
 * Main benchmark function
 */
async function runBenchmarks() {
  console.log('🚀 Starting HuggingFace Model Benchmark\n');
  console.log('=' .repeat(60));
  
  if (!process.env.HF_TOKEN) {
    console.error('❌ HF_TOKEN environment variable not set');
    console.error('   Set it: export HF_TOKEN="your_token"');
    process.exit(1);
  }
  
  console.log('\n📊 Benchmarking Embedding Models...');
  console.log('=' .repeat(60));
  
  const embeddingResults = await benchmarkEmbeddingModels();
  
  console.log('\n📈 Embedding Model Results:');
  console.table(embeddingResults);
  
  console.log('\n📊 Benchmarking Text Generation Models...');
  console.log('=' .repeat(60));
  
  const textGenResults = await benchmarkTextGenerationModels();
  
  console.log('\n📈 Text Generation Model Results:');
  console.table(textGenResults);
  
  console.log('\n🎯 Recommendations:');
  console.log('=' .repeat(60));
  
  const bestEmbedding = embeddingResults[0];
  console.log(`\n✅ Best Embedding Model: ${bestEmbedding.model}`);
  console.log(`   - Quality Score: ${bestEmbedding.qualityScore}`);
  console.log(`   - Avg Latency: ${bestEmbedding.avgLatencyMs}ms`);
  console.log(`   - Dimensions: ${bestEmbedding.dimensions}`);
  
  const bestTextGen = textGenResults[0];
  console.log(`\n✅ Best Text Generation Model: ${bestTextGen.model}`);
  console.log(`   - Quality Score: ${bestTextGen.qualityScore}`);
  console.log(`   - Avg Latency: ${bestTextGen.avgLatencyMs}ms`);
  
  console.log('\n✅ Benchmark complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmarks()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    });
}

export { benchmarkEmbeddingModels, benchmarkTextGenerationModels };




