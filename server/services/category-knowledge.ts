import fs from 'fs';
import path from 'path';

export type CategoryKnowledge = {
  qualificationQuestions?: string[];
  commonPainPoints?: string[];
  budgetHints?: Record<string, unknown>;
  // allow extra fields for flexibility
  [key: string]: unknown;
};

const DATA_DIR = path.join(__dirname, '..', 'data', 'category-knowledge');

let cache: Record<string, CategoryKnowledge> | null = null;
let initialized = false;

function loadAll(): Record<string, CategoryKnowledge> {
  const result: Record<string, CategoryKnowledge> = {};
  if (!fs.existsSync(DATA_DIR)) return result;
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const slug = path.basename(file, '.json');
    try {
      const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
      const json = JSON.parse(content) as CategoryKnowledge;
      result[slug] = json;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[category-knowledge] Failed to load ${file}:`, err);
    }
  }
  return result;
}

export function getCategoryKnowledge(slug: string): CategoryKnowledge | undefined {
  if (!initialized || cache == null) {
    cache = loadAll();
    initialized = true;
  }
  return cache[slug];
}

export function getAllCategoryKnowledge(): Record<string, CategoryKnowledge> {
  if (!initialized || cache == null) {
    cache = loadAll();
    initialized = true;
  }
  return cache;
}

// In dev, allow manual reload
export function reloadCategoryKnowledge(): void {
  cache = loadAll();
  initialized = true;
}
