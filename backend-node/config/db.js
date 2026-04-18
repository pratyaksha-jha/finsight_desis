const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Force load the root .env just in case

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD, // Pulls the exact raw string from .env
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'finsight',
  port: process.env.PGPORT || 5432,
});

// Test the connection immediately on boot
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Node.js Database Connection Error:', err.message);
  } else {
    console.log('✅ Node.js connected to PostgreSQL successfully!');
  }
});

module.exports = pool;