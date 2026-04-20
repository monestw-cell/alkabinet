import mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;

async function debugAuth() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('🔍 Checking database for مؤنس الطويل...\n');
    
    // Get the user
    const [users] = await connection.execute(
      'SELECT id, fullName, passwordHash FROM users WHERE fullName = ?',
      ['مؤنس الطويل']
    );
    
    if (users.length === 0) {
      console.log('❌ User not found in database');
      return;
    }
    
    const user = users[0];
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.fullName}`);
    console.log(`   PasswordHash exists: ${user.passwordHash ? 'YES' : 'NO'}`);
    console.log(`   PasswordHash length: ${user.passwordHash ? user.passwordHash.length : 0}`);
    console.log(`   PasswordHash type: ${typeof user.passwordHash}`);
    console.log(`   PasswordHash value: ${user.passwordHash ? user.passwordHash.substring(0, 50) + '...' : 'NULL'}\n`);
    
    if (!user.passwordHash) {
      console.log('❌ No password hash found!');
      return;
    }
    
    // Test bcrypt.compare
    console.log('🧪 Testing bcrypt.compare with password "0599"...\n');
    
    try {
      const isValid = await bcrypt.compare('0599', user.passwordHash);
      console.log(`Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isValid) {
        console.log('\n⚠️ Password mismatch! Trying to hash "0599" again...');
        const newHash = await bcrypt.hash('0599', 10);
        console.log(`New hash: ${newHash}`);
        console.log(`New hash length: ${newHash.length}`);
        
        // Try comparing new hash with itself
        const testCompare = await bcrypt.compare('0599', newHash);
        console.log(`Test compare result: ${testCompare ? '✅ VALID' : '❌ INVALID'}`);
      }
    } catch (err) {
      console.error('❌ Error during bcrypt.compare:', err.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

debugAuth();
