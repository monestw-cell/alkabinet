import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop() || 'alkabinet',
});

try {
  const tables = [
    'confessions', 'invitations', 'weekly_photos', 'photo_votes',
    'debts', 'embarrassing_moments', 'pes_results', 'ratings',
    'anonymous_tips', 'group_photos', 'charity_entries', 'notifications', 'users'
  ];
  
  for (const table of tables) {
    try {
      await connection.execute(`TRUNCATE TABLE ${table}`);
      console.log(`✓ تم حذف بيانات جدول ${table}`);
    } catch (e) {
      console.log(`⚠ تخطي جدول ${table}`);
    }
  }
  
  console.log('✓ تم إعادة تعيين قاعدة البيانات بنجاح');
} catch (error) {
  console.error('خطأ:', error.message);
} finally {
  await connection.end();
}
