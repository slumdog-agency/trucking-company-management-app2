import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    
    // Group statements by type
    const tableStatements = [];
    const indexStatements = [];
    const triggerStatements = [];
    const otherStatements = [];
    
    for (const statement of statements) {
      const lowerStatement = statement.toLowerCase();
      if (lowerStatement.includes('create table')) {
        tableStatements.push(statement);
      } else if (lowerStatement.includes('create index')) {
        indexStatements.push(statement);
      } else if (lowerStatement.includes('create trigger')) {
        triggerStatements.push(statement);
      } else {
        otherStatements.push(statement);
      }
    }
    
    // Execute statements in order: tables, other statements, indexes, triggers
    const orderedStatements = [
      ...tableStatements,
      ...otherStatements,
      ...indexStatements,
      ...triggerStatements
    ];
    
    // Execute each statement separately
    for (const statement of orderedStatements) {
      try {
        // Skip trigger creation if it already exists
        if (statement.toLowerCase().includes('create trigger')) {
          const triggerMatch = statement.match(/create trigger\s+(\w+)\s+on\s+(\w+)/i);
          if (triggerMatch) {
            const [, triggerName, tableName] = triggerMatch;
            const checkTrigger = await client.query(
              `SELECT 1 FROM pg_trigger WHERE tgname = $1 AND tgrelid = (SELECT oid FROM pg_class WHERE relname = $2)`,
              [triggerName, tableName]
            );
            if (checkTrigger.rows.length > 0) {
              console.log(`Trigger ${triggerName} already exists on table ${tableName}, skipping...`);
              continue;
            }
          }
        }
        
        console.log('Executing:', statement);
        await client.query(statement);
      } catch (error) {
        // If it's a trigger already exists error, skip it
        if (error.code === '42710' && error.message.includes('trigger')) {
          console.log('Trigger already exists, skipping...');
          continue;
        }
        
        // If transaction is aborted, rollback and start a new transaction
        if (error.code === '25P02') {
          console.log('Transaction aborted, rolling back and starting new transaction...');
          await client.query('ROLLBACK');
          await client.query('BEGIN');
          continue;
        }
        
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
    
    // Define all migration files in order
    const migrationFiles = [
      '001_initial_schema.sql',
      '002_create_routes_and_divisions.sql',
      '003_create_users_and_permissions.sql',
      '004_update_schema.sql',
      '005_weekly_routes_dashboard.sql',
      '007_update_dispatcher_id.sql',
      '008_create_route_tables.sql'
    ];
    
    for (const migrationFile of migrationFiles) {
      if (!appliedMigrations.includes(migrationFile)) {
        await applyMigration(migrationFile);
        console.log(`Successfully applied migration: ${migrationFile}`);
      } else {
        console.log(`Migration already applied: ${migrationFile}`);
      }
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
migrate(); 