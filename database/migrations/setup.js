const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  // Use the same env vars as the running Node backend (backend-node/config/db.js)
  user:     process.env.PGUSER     || 'postgres',
  host:     process.env.PGHOST     || 'localhost',
  database: process.env.PGDATABASE || 'finsight',
  password: process.env.PGPASSWORD || 'postgres',
  port:     parseInt(process.env.PGPORT || '5432'),
});

// pg does not support multiple statements in one query() call.
// Strip comments, split on semicolons, run each statement individually.
function splitStatements(sql) {
  // Remove single-line comments (-- ...)
  const noComments = sql.replace(/--[^\n]*/g, '');
  return noComments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

async function setup() {
  const client = await pool.connect();
  try {
    const migrations = [
      '001_users_guardians.sql',
      '002_stock_data.sql',
      '003_holdings.sql',
      '004_heena_features.sql',
    ];

    for (const file of migrations) {
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const statements = splitStatements(sql);
      for (const stmt of statements) {
        await client.query(stmt);
      }
      console.log(`✓ Applied ${file}`);
    }

    console.log('✓ All migrations applied successfully');
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
