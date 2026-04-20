import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function checkNames() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    const [users] = await connection.execute(
      'SELECT id, fullName FROM users WHERE fullName IS NOT NULL ORDER BY id'
    );
    
    console.log('Users in database:');
    users.forEach(u => {
      console.log(`  ID: ${u.id}, Name: "${u.fullName}"`);
    });
    
  } finally {
    await connection.end();
  }
}

checkNames();
