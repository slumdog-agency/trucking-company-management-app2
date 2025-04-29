const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// PostgreSQL connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create migrations table if it doesn't exist
async function ensureMigrationsTable() {
  const client = await pool.connect();
  try {
    // Set search path and create schema
    await client.query('CREATE SCHEMA IF NOT EXISTS public');
    await client.query('SET search_path TO public');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
}

// Get list of applied migrations
async function getAppliedMigrations() {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id ASC');
  return result.rows.map(row => row.name);
}

// Split SQL content into statements while preserving dollar-quoted strings
function splitSqlStatements(sql) {
  const statements = [];
  let currentStatement = '';
  let inDollarQuote = false;
  let dollarTag = '';

  // Split the SQL into lines and trim whitespace
  const lines = sql.split('\n').map(line => line.trim());

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line || line.startsWith('--')) {
      continue;
    }

    currentStatement += ' ' + line;

    // Check for dollar quotes
    const dollarQuoteMatch = line.match(/\$[^$]*\$/g);
    if (dollarQuoteMatch) {
      for (const match of dollarQuoteMatch) {
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = match;
        } else if (match === dollarTag) {
          inDollarQuote = false;
          dollarTag = '';
        }
      }
    }

    // Only split on semicolon if we're not inside a dollar-quoted string
    if (!inDollarQuote && line.endsWith(';')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }

  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

// Apply a single migration
async function applyMigration(filename) {
  console.log(`Applying migration: ${filename}`);
  const filePath = path.join(__dirname, 'migrations', filename);
  const content = await fs.readFile(filePath, 'utf-8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Split the content into statements using the new function
    const statements = splitSqlStatements(content);
    
    // Execute each statement separately
    for (const statement of statements) {
      try {
        console.log('Executing:', statement);
        await client.query(statement);
      } catch (error) {
        // Log the error and throw it
        console.error('Error executing statement:', error);
        throw error;
      }
    }
    
    await client.query('INSERT INTO migrations (name) VALUES ($1)', [filename]);
    await client.query('COMMIT');
    console.log(`Successfully applied migration: ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error applying migration ${filename}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Main migration function
async function migrate() {
  try {
    await ensureMigrationsTable();
    
    const appliedMigrations = await getAppliedMigrations();
    console.log('Applied migrations:', appliedMigrations);
    
    // We only have one migration file now
    const migrationFile = '001_initial_schema.sql';
    
    if (!appliedMigrations.includes(migrationFile)) {
      await applyMigration(migrationFile);
      console.log('Initial schema migration completed successfully');
    } else {
      console.log('Schema is already up to date');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
migrate(); 