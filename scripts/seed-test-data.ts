// Script to seed test data for djumanji admin account
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function seedTestData() {
  console.log('🌱 Seeding test data for djumanji admin...');

  try {
    // Get djumanji user
    const userResult = await db.execute(sql`
      SELECT id FROM users WHERE username = 'djumanji' LIMIT 1
    `);
    // @ts-ignore
    const userId = ((userResult as any).rows?.[0] || (userResult as any)[0])?.id;

    if (!userId) {
      console.error('❌ User "djumanji" not found. Please create the user first.');
      process.exit(1);
    }

    console.log(`✓ Found user djumanji (${userId})`);

    // Get categories for leads
    const categoriesResult = await db.execute(sql`
      SELECT id, display_name FROM categories LIMIT 5
    `);
    // @ts-ignore
    const categories = (categoriesResult as any).rows || categoriesResult || [];

    // 1. Seed Clients
    console.log('\n📋 Creating test clients...');
    const clients = [
      { name: 'Acme Corporation', email: 'contact@acme.com', phone: '555-0101', address: '123 Business St, New York, NY 10001' },
      { name: 'Global Tech Inc', email: 'info@globaltech.com', phone: '555-0102', address: '456 Tech Ave, San Francisco, CA 94102' },
      { name: 'Smith & Associates', email: 'hello@smithassoc.com', phone: '555-0103', address: '789 Legal Blvd, Chicago, IL 60601' },
      { name: 'Retail Solutions LLC', email: 'sales@retailsol.com', phone: '555-0104', address: '321 Commerce Way, Austin, TX 78701' },
      { name: 'Design Studio Co', email: 'studio@designco.com', phone: '555-0105', address: '654 Creative Ln, Portland, OR 97201' },
    ];

    const clientIds: string[] = [];
    for (const client of clients) {
      const result = await db.execute(sql`
        INSERT INTO clients (user_id, name, email, phone, address, created_at, updated_at)
        VALUES (${userId}, ${client.name}, ${client.email}, ${client.phone}, ${client.address}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `);
      // @ts-ignore
      const clientId = ((result as any).rows?.[0] || (result as any)[0])?.id;
      clientIds.push(clientId);
      console.log(`  ✓ ${client.name}`);
    }

    // 2. Seed Services
    console.log('\n🛠️  Creating test services...');
    const services = [
      { name: 'Web Development', description: 'Full-stack web application development', rate: 150, unit: 'hour' },
      { name: 'UI/UX Design', description: 'User interface and experience design', rate: 125, unit: 'hour' },
      { name: 'Consulting', description: 'Business and technical consulting', rate: 200, unit: 'hour' },
      { name: 'Project Management', description: 'End-to-end project management', rate: 175, unit: 'hour' },
      { name: 'Content Writing', description: 'Technical and marketing content', rate: 100, unit: 'hour' },
    ];

    const serviceIds: string[] = [];
    for (const service of services) {
      const result = await db.execute(sql`
        INSERT INTO services (user_id, name, description, price, unit, created_at, updated_at)
        VALUES (${userId}, ${service.name}, ${service.description}, ${service.rate}, ${service.unit}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `);
      // @ts-ignore
      const serviceId = ((result as any).rows?.[0] || (result as any)[0])?.id;
      serviceIds.push(serviceId);
      console.log(`  ✓ ${service.name}`);
    }

    // 3. Seed Invoices
    console.log('\n📄 Creating test invoices...');
    const invoiceStatuses = ['draft', 'sent', 'paid', 'overdue'];

    for (let i = 0; i < 8; i++) {
      const clientId = clientIds[i % clientIds.length];
      const status = invoiceStatuses[i % invoiceStatuses.length];
      const amount = Math.floor(Math.random() * 5000) + 1000;
      const daysOffset = -30 + i * 10;

      // Calculate date in TypeScript
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() + daysOffset);

      const taxRate = 10; // 10% tax
      const taxAmount = Math.round(amount * (taxRate / 100) * 100) / 100;
      const totalAmount = amount + taxAmount;

      const invoiceNumber = `INV-TEST-${Date.now()}-${i}`;

      const invoiceResult = await db.execute(sql`
        INSERT INTO invoices (
          user_id, client_id, invoice_number, date,
          subtotal, tax, tax_rate, total, status, notes
        ) VALUES (
          ${userId}, ${clientId}, ${invoiceNumber},
          ${invoiceDate.toISOString()},
          ${amount}, ${taxAmount}, ${taxRate}, ${totalAmount}, ${status},
          ${`Test invoice ${i + 1}`}
        )
        RETURNING id
      `);
      // @ts-ignore
      const invoiceId = ((invoiceResult as any).rows?.[0] || (invoiceResult as any)[0])?.id;

      // Add line items
      const serviceId = serviceIds[i % serviceIds.length];
      const quantity = Math.floor(Math.random() * 20) + 5;
      const rate = services[i % services.length].rate;

      await db.execute(sql`
        INSERT INTO line_items (invoice_id, description, quantity, price, amount)
        VALUES (${invoiceId}, ${services[i % services.length].name}, ${quantity}, ${rate}, ${quantity * rate})
      `);

      console.log(`  ✓ Invoice ${i + 1} (${status}) - $${totalAmount.toFixed(2)}`);
    }

    // 4. Seed Leads
    console.log('\n🎯 Creating test leads...');
    const leadStatuses = ['CREATED', 'ACTIVE', 'CONTACTED', 'BIDDING_CLOSED', 'ARCHIVED'];
    const urgencies = ['low', 'medium', 'high', 'urgent'];

    for (let i = 0; i < 10; i++) {
      const category = categories[i % categories.length];
      const status = leadStatuses[i % leadStatuses.length];
      const urgency = urgencies[i % urgencies.length];
      const budgetMin = Math.floor(Math.random() * 3000) + 500;
      const budgetMax = budgetMin + Math.floor(Math.random() * 2000) + 500;

      // Calculate lead creation date
      const leadDate = new Date();
      leadDate.setDate(leadDate.getDate() - i);

      await db.execute(sql`
        INSERT INTO leads (
          category_id, title, description,
          customer_name, customer_email, customer_phone, customer_zip_code,
          budget_min, budget_max, urgency_level,
          lead_source, base_lead_cost, status, is_qualified,
          service_area_radius_km, created_at
        ) VALUES (
          ${category.id},
          ${`${category.display_name} Project ${i + 1}`},
          ${`Need professional ${category.display_name.toLowerCase()} services for ${['residential', 'commercial'][i % 2]} property.`},
          ${`Test Customer ${i + 1}`},
          ${`customer${i + 1}@example.com`},
          ${`555-010${i}`},
          ${`1000${i}`},
          ${budgetMin}, ${budgetMax}, ${urgency},
          'website', 25.00, ${status}, true,
          25, ${leadDate.toISOString()}
        )
      `);

      console.log(`  ✓ Lead ${i + 1}: ${category.display_name} (${status})`);
    }

    // 5. Seed Expenses
    console.log('\n💰 Creating test expenses...');
    const expenseCategories = ['Equipment', 'Software', 'Travel', 'Office Supplies', 'Marketing'];

    for (let i = 0; i < 12; i++) {
      const category = expenseCategories[i % expenseCategories.length];
      const amount = Math.floor(Math.random() * 500) + 50;
      const daysAgo = i * 3;

      // Calculate expense date
      const expenseDate = new Date();
      expenseDate.setDate(expenseDate.getDate() - daysAgo);

      await db.execute(sql`
        INSERT INTO expenses (
          user_id, category, amount, description, date,
          payment_method, is_tax_deductible
        ) VALUES (
          ${userId}, ${category}, ${amount},
          ${`${category} expense for business operations`},
          ${expenseDate.toISOString()},
          ${['credit_card', 'debit_card', 'cash'][i % 3]},
          ${i % 2 === 0}
        )
      `);

      console.log(`  ✓ Expense ${i + 1}: ${category} - $${amount}`);
    }

    // 6. Seed Projects
    console.log('\n🚀 Creating test projects...');

    for (let i = 0; i < 6; i++) {
      const clientId = clientIds[i % clientIds.length];
      const isActive = i % 2 === 0;

      await db.execute(sql`
        INSERT INTO projects (
          client_id, name, description, is_active
        ) VALUES (
          ${clientId},
          ${`Project ${i + 1} - ${clients[i % clients.length].name}`},
          'Comprehensive project including design, development, and deployment',
          ${isActive}
        )
      `);

      console.log(`  ✓ Project ${i + 1} (${isActive ? 'active' : 'inactive'})`);
    }

    console.log('\n✅ Test data seeded successfully!');
    console.log('\nSummary:');
    console.log(`  - ${clients.length} clients`);
    console.log(`  - ${services.length} services`);
    console.log(`  - 8 invoices`);
    console.log(`  - 10 leads`);
    console.log(`  - 12 expenses`);
    console.log(`  - 6 projects`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed test data:', error);
    process.exit(1);
  }
}

seedTestData();
