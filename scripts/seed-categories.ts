// Script to seed service categories for lead capture chatbot
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

const categories = [
  {
    slug: 'plumbing',
    display_name: 'Plumbing',
    description: 'Plumbing repairs, installations, and maintenance'
  },
  {
    slug: 'electrical',
    display_name: 'Electrical',
    description: 'Electrical repairs, wiring, and installations'
  },
  {
    slug: 'hvac',
    display_name: 'HVAC',
    description: 'Heating, ventilation, and air conditioning services'
  },
  {
    slug: 'carpentry',
    display_name: 'Carpentry',
    description: 'Woodworking, framing, and custom carpentry'
  },
  {
    slug: 'painting',
    display_name: 'Painting',
    description: 'Interior and exterior painting services'
  },
  {
    slug: 'landscaping',
    display_name: 'Landscaping',
    description: 'Lawn care, garden design, and outdoor maintenance'
  },
  {
    slug: 'roofing',
    display_name: 'Roofing',
    description: 'Roof repair, replacement, and maintenance'
  },
  {
    slug: 'flooring',
    display_name: 'Flooring',
    description: 'Floor installation, refinishing, and repair'
  },
  {
    slug: 'cleaning',
    display_name: 'Cleaning',
    description: 'Home and office cleaning services'
  },
  {
    slug: 'moving',
    display_name: 'Moving',
    description: 'Residential and commercial moving services'
  },
  {
    slug: 'handyman',
    display_name: 'Handyman',
    description: 'General home repairs and maintenance'
  },
  {
    slug: 'pest-control',
    display_name: 'Pest Control',
    description: 'Pest extermination and prevention services'
  }
];

async function seedCategories() {
  console.log('🌱 Seeding service categories...');

  for (const category of categories) {
    try {
      await db.execute(sql`
        INSERT INTO categories (slug, display_name, description)
        VALUES (${category.slug}, ${category.display_name}, ${category.description})
        ON CONFLICT (slug) DO UPDATE
        SET display_name = ${category.display_name},
            description = ${category.description}
      `);
      console.log(`✓ ${category.display_name}`);
    } catch (error) {
      console.error(`✗ Failed to seed ${category.display_name}:`, error);
    }
  }

  console.log('✅ Categories seeded successfully!');
  process.exit(0);
}

seedCategories().catch((error) => {
  console.error('❌ Failed to seed categories:', error);
  process.exit(1);
});
