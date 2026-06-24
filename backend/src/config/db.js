const { Pool } = require('pg');

console.log('=== INITIALIZING DATABASE POOL ===');
// This will tell us if Railway is actually reading your environment variable
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Stop waiting forever if the database is unreachable
  connectionTimeoutMillis: 5000
});

// Force global connection errors to print immediately
pool.on('error', (err) => {
  console.error('🔴 GLOBAL DATABASE POOL ERROR:', err.message);
  console.error(err.stack);
});

// Test the connection immediately on startup
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
