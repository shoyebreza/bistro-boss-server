require('dotenv').config();
const { MongoClient } = require('mongodb');

// Test connection with detailed diagnostics
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zavbous.mongodb.net/?retryWrites=true&w=majority`;

console.log('\n=== MongoDB Connection Test ===\n');
console.log('Credentials loaded:');
console.log('  DB_USER:', process.env.DB_USER ? process.env.DB_USER.substring(0, 5) + '...' : 'NOT SET');
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
console.log('\nConnecting...\n');

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
});

(async () => {
  try {
    await client.connect();
    const adminDb = client.db('admin');
    const result = await adminDb.command({ ping: 1 });
    console.log('✓ Connection successful!');
    console.log('  Response:', result);
    process.exit(0);
  } catch (error) {
    console.error('✗ Connection failed!');
    console.error('  Error:', error.message);
    console.error('\nTroubleshooting steps:');
    console.error('  1. Check DB_USER and DB_PASSWORD in .env file');
    console.error('  2. Add your IP to MongoDB Atlas Network Access');
    console.error('  3. If password has special chars (@, !, #, etc.), URL-encode them');
    console.error('  4. Verify cluster name matches "cluster0.zavbous"');
    process.exit(1);
  } finally {
    await client.close();
  }
})();
