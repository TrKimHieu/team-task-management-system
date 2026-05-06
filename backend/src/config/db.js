const { Pool } = require("pg");
const fs = require('fs');
const path = require('path');
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
  const candidateDirs = [
    path.join(__dirname, '../../migrations'),
    path.join(__dirname, '../../../database/migrations'),
  ];
  const migrationsDir = candidateDirs.find((dir) => fs.existsSync(dir));
  if (!migrationsDir) {
    throw new Error('Migration directory not found');
  }

  const migrationFiles = [
    '001_add_completed_column.sql',
    '002_add_features.sql',
    '004_create_task_activities.sql',
  ];

  for (const fileName of migrationFiles) {
    try {
      const sql = fs.readFileSync(path.join(migrationsDir, fileName), 'utf8');
      await pool.query(sql);
      console.log(`Migration "${fileName}" completed`);
    } catch (err) {
      console.error(`Migration "${fileName}" failed:`, err.message);
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
