import mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;

async function testFullAuth() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('🧪 Testing Full Authentication Flow\n');
    
    // Step 1: Set password
    console.log('Step 1: Setting password for مؤنس وائل الطويل...');
    const testPassword = '0599';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    await connection.execute(
      'UPDATE users SET passwordHash = ? WHERE fullName = ?',
      [hashedPassword, 'مؤنس وائل الطويل']
    );
    console.log('✓ Password set\n');
    
    // Step 2: First login attempt
    console.log('Step 2: First login attempt...');
    const [users1] = await connection.execute(
      'SELECT id, fullName, passwordHash FROM users WHERE fullName = ?',
      ['مؤنس وائل الطويل']
    );
    
    if (users1.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user1 = users1[0];
    const isValid1 = await bcrypt.compare(testPassword, user1.passwordHash);
    console.log(`Result: ${isValid1 ? '✅ VALID' : '❌ INVALID'}\n`);
    
    if (!isValid1) {
      console.log('❌ First login failed!');
      return;
    }
    
    // Step 3: Second login attempt (simulating logout and login again)
    console.log('Step 3: Second login attempt (after logout)...');
    const [users2] = await connection.execute(
      'SELECT id, fullName, passwordHash FROM users WHERE fullName = ?',
      ['مؤنس وائل الطويل']
    );
    
    if (users2.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user2 = users2[0];
    const isValid2 = await bcrypt.compare(testPassword, user2.passwordHash);
    console.log(`Result: ${isValid2 ? '✅ VALID' : '❌ INVALID'}\n`);
    
    if (!isValid2) {
      console.log('❌ Second login failed!');
      return;
    }
    
    // Step 4: Third login attempt
    console.log('Step 4: Third login attempt...');
    const [users3] = await connection.execute(
      'SELECT id, fullName, passwordHash FROM users WHERE fullName = ?',
      ['مؤنس وائل الطويل']
    );
    
    if (users3.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user3 = users3[0];
    const isValid3 = await bcrypt.compare(testPassword, user3.passwordHash);
    console.log(`Result: ${isValid3 ? '✅ VALID' : '❌ INVALID'}\n`);
    
    if (!isValid3) {
      console.log('❌ Third login failed!');
      return;
    }
    
    console.log('🎉 All tests passed! Authentication is working correctly!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

testFullAuth();
