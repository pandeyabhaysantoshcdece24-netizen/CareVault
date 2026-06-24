const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // This allows Node to accept Supabase's dynamically generated cloud certificate
    rejectUnauthorized: false
  }
});

// A quick helper log to verify connection errors in your Railway dashboard
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
});

module.exports = pool;
