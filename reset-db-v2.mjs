import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function resetDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    console.log('Fetching actual table names from database...');
    
    // Get all tables
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME NOT LIKE 'drizzle_%'
    `);
    
    if (tables.length === 0) {
      console.log('⚠ No tables found in database!');
      process.exit(0);
    }
    
    console.log(`Found ${tables.length} tables to clear:`);
    
    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS=0');
    
    // Truncate all tables
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      try {
        await connection.execute(`TRUNCATE TABLE \`${tableName}\``);
        console.log(`✓ Cleared ${tableName}`);
      } catch (err) {
        console.log(`⚠ Could not clear ${tableName}: ${err.message}`);
      }
    }
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS=1');
    
    console.log('✓ Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

resetDatabase();
