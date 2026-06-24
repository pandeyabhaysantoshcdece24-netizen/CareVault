const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('[DB] DATABASE_URL is not set. Database pool cannot connect.');
}

const pool = new Pool({
  connectionString,
  ssl: {
    // This allows Node to accept Supabase's dynamically generated cloud certificate
    rejectUnauthorized: false
  }
});

// A quick helper log to verify connection errors in your Railway dashboard
pool.on('connect', () => {
  console.log('[DB] PostgreSQL pool connected');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
});

module.exports = pool;
