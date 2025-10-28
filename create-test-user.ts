import { hashPassword } from './server/auth';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5433/invoicedb'
});

async function createTestUser() {
  const email = 'test@test.com';
  const password = 'password123';
  const username = 'testuser';
  
  const hashedPassword = await hashPassword(password);
  
  const query = `
    INSERT INTO users (email, password, username, provider, is_email_verified)
    VALUES ($1, $2, $3, 'local', true)
    ON CONFLICT (email)
    DO UPDATE SET password = $2
    RETURNING id, email, username;
  `;
  
  const result = await pool.query(query, [email, hashedPassword, username]);
  console.log('Test user created/updated:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User data:', result.rows[0]);
  
  await pool.end();
}

createTestUser().catch(console.error);
