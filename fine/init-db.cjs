const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

// Open database connection
const db = new sqlite3.Database('fine.db');

const runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const allAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

// sqlite3's run() only executes the first statement, so split the file and run each one.
// Migrations here contain no triggers or semicolons inside string literals.
function splitStatements(sql) {
  return sql
    .split(';')
    .map(stmt => stmt
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim())
    .filter(Boolean);
}

async function runMigrations() {
  try {
    await runAsync(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    const applied = new Set((await allAsync('SELECT name FROM schema_migrations')).map(r => r.name));

    const migrationsDir = path.join(process.cwd(), 'fine', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`- Already applied: ${file}`);
        continue;
      }

      console.log(`\nApplying migration: ${file}`);
      const statements = splitStatements(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));

      await runAsync('BEGIN');
      try {
        for (const stmt of statements) {
          try {
            await runAsync(stmt);
          } catch (err) {
            // Databases created before migration tracking already contain these objects.
            if (/already exists|duplicate column name/.test(err.message)) {
              console.log(`  ℹ Skipped (already present): ${err.message}`);
              continue;
            }
            throw err;
          }
        }
        await runAsync('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
        await runAsync('COMMIT');
        console.log(`✓ Applied: ${file}`);
      } catch (err) {
        await runAsync('ROLLBACK');
        console.error(`✗ Error in migration ${file}:`, err);
        throw err;
      }
    }

    console.log('\nMigration process completed successfully!');
  } catch (err) {
    console.error('Migration process failed:', err);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

runMigrations();
