import mysql from 'mysql2/promise';
import { createHash } from 'crypto';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Get user
const [users] = await connection.execute(
  'SELECT id, fullName, passwordHash FROM users WHERE fullName = ?',
  ['مؤنس وائل الطويل']
);

if (users.length === 0) {
  console.log('❌ User not found');
  process.exit(1);
}

const user = users[0];
console.log('✅ User found:', user.fullName);
console.log('Password hash stored:', user.passwordHash ? 'Yes' : 'No');
console.log('Hash length:', user.passwordHash?.length);
console.log('Hash type:', typeof user.passwordHash);
console.log('Hash preview:', user.passwordHash?.substring(0, 20) + '...');

await connection.end();
