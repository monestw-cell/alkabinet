import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function checkAllUsers() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    const [users] = await connection.execute(
      'SELECT id, fullName FROM users ORDER BY id'
    );
    
    console.log('All users in database:');
    users.forEach(u => {
      console.log(`  ID: ${u.id}, Name: ${u.fullName === null ? 'NULL' : `"${u.fullName}"`}`);
    });
    
  } finally {
    await connection.end();
  }
}

checkAllUsers();
