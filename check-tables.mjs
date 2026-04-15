import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function checkTables() {
  const connection = await mysql.createConnection(DATABASE_URL);
  try {
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);
    console.log('Tables in database:');
    tables.forEach(t => console.log(`  - ${t.TABLE_NAME}`));
  } finally {
    await connection.end();
  }
}

checkTables();
