const { Pool } = require('pg');

// HARDCODED CONNECTION POOLER TEST STRING
const connectionString = 'postgresql://postgres.irpzynndnsmaokampfhq:Kusum%409999@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

console.log('=== TESTING HARDCODED CONNECTION POOL ===');

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  console.error('🔴 GLOBAL DATABASE POOL ERROR:', err.message);
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('🔴 INITIAL DATABASE TEST QUERY FAILED:', err.message);
    console.error(err.stack);
  } else {
    console.log('🟢 DATABASE CONNECTED SUCCESSFULLY AT:', res.rows[0].now);
  }
});

module.exports = pool;

module.exports = pool;
