const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionTimeoutMillis: 5000,
  max: 10,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const runMigrations = async () => {
  const migrations = [
    { name: 'add_completed_column', sql: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;' }
  ];

  for (const migration of migrations) {
    try {
      await pool.query(migration.sql);
      console.log(`Migration "${migration.name}" completed`);
    } catch (err) {
      if (err.code !== '42701') {
        console.error(`Migration "${migration.name}" failed:`, err.message);
      }
    }
  }
};

const connectWithRetry = async (retries = 10, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      client.release();
      console.log('Database connected successfully');
      await runMigrations();
      return;
    } catch (err) {
      console.error(`Database connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error('Failed to connect to database after multiple retries');
      }
    }
  }
};

module.exports = { pool, connectWithRetry };