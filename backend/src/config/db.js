const { Pool } = require('pg');

// Use Railway DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  process.exit(1);
}

console.log('🔵 Connecting to database with URL from env...');

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
