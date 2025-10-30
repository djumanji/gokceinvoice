import { db } from '../server/db';
import { generateInviteCode } from '../server/utils/invite-code';

async function createInviteCode() {
  try {
    const code = generateInviteCode();
    const result = await db.query(
      'INSERT INTO invite_codes (code, created_by) VALUES ($1, 1) RETURNING *',
      [code]
    );
    console.log('Generated invite code:', result.rows[0].code);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createInviteCode();
