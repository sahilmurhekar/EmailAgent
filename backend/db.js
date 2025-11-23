const { Pool } = require("pg");
require("dotenv").config();

// Parse DATABASE_URL to handle IPv6 issues
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('✗ DATABASE_URL is not set in .env file');
  process.exit(1);
}

// Create PostgreSQL connection pool with explicit configuration
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20
});

// Test connection
pool.on('connect', (client) => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err, client) => {
  console.error('✗ Unexpected database error:', err);
});

// Verify connection on startup
const verifyConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✓ Database connection verified at:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('✗ Failed to connect to database:', err.message);
    throw err;
  }
};

// Initialize tables
const initializeTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create emails table with visible column
    await client.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        sender TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        category TEXT DEFAULT 'Uncategorized',
        visible BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Emails table ready');

    // Create prompts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Prompts table ready');

    // Create drafts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS drafts (
        id SERIAL PRIMARY KEY,
        email_id INTEGER REFERENCES emails(id),
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        type TEXT DEFAULT 'reply',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Drafts table ready');

    // Create tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        email_id INTEGER NOT NULL REFERENCES emails(id),
        task TEXT NOT NULL,
        deadline TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Tasks table ready');

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Error initializing tables:', err);
    throw err;
  } finally {
    client.release();
  }
};
const resetDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`DROP TABLE IF EXISTS drafts CASCADE`);
    await client.query(`DROP TABLE IF EXISTS tasks CASCADE`);
    await client.query(`DROP TABLE IF EXISTS emails CASCADE`);
    await client.query(`DROP TABLE IF EXISTS prompts CASCADE`);

    await client.query('COMMIT');
    console.log('✓ Database reset (all tables dropped)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Error resetting database:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  initializeTables,
  verifyConnection,
  resetDatabase,
  query: (text, params) => pool.query(text, params)
};
