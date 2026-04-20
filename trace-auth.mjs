import mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;

async function traceAuth() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('📝 Step 1: Check all users in database\n');
    
    const [allUsers] = await connection.execute(
      'SELECT id, fullName, passwordHash FROM users ORDER BY id'
    );
    
    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach(u => {
      console.log(`  - ID: ${u.id}, Name: ${u.fullName}, Hash: ${u.passwordHash ? u.passwordHash.substring(0, 30) + '...' : 'NULL'}`);
    });
    
    console.log('\n📝 Step 2: Simulate setPassword for مؤنس الطويل\n');
    
    const testPassword = '0599';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    console.log(`Hash created: ${hashedPassword}`);
    console.log(`Hash length: ${hashedPassword.length}`);
    
    // Simulate updating the password
    await connection.execute(
      'UPDATE users SET passwordHash = ? WHERE fullName = ?',
      [hashedPassword, 'مؤنس الطويل']
    );
    
    console.log('\n📝 Step 3: Retrieve the user and verify password\n');
    
    const [retrievedUsers] = await connection.execute(
      'SELECT id, fullName, passwordHash FROM users WHERE fullName = ?',
      ['مؤنس الطويل']
    );
    
    if (retrievedUsers.length === 0) {
      console.log('❌ User not found after update!');
      return;
    }
    
    const retrievedUser = retrievedUsers[0];
    console.log(`Retrieved user: ${retrievedUser.fullName}`);
    console.log(`Retrieved hash: ${retrievedUser.passwordHash.substring(0, 30)}...`);
    console.log(`Retrieved hash length: ${retrievedUser.passwordHash.length}`);
    console.log(`Hash matches original: ${retrievedUser.passwordHash === hashedPassword ? 'YES' : 'NO'}`);
    
    console.log('\n📝 Step 4: Test bcrypt.compare\n');
    
    const isValid = await bcrypt.compare(testPassword, retrievedUser.passwordHash);
    console.log(`bcrypt.compare('0599', hash): ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    console.log('\n📝 Step 5: Test bcrypt.compare again (second attempt)\n');
    
    const isValid2 = await bcrypt.compare(testPassword, retrievedUser.passwordHash);
    console.log(`bcrypt.compare('0599', hash) [2nd time]: ${isValid2 ? '✅ VALID' : '❌ INVALID'}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

traceAuth();
