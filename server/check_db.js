import fs from 'fs';
import pool from './db.js';

async function checkDatabase() {
  try {
    const queries = fs.readFileSync('./check_db.sql', 'utf8').split(';');
    
    console.log('\n=== Database Structure and Content Check ===\n');
    
    for (let query of queries) {
      query = query.trim();
      if (!query) continue;
      
      try {
        console.log('\n' + query.split('\n')[0] + '\n'); // Print the comment/description
        const result = await pool.query(query);
        console.table(result.rows);
      } catch (err) {
        console.error(`Error executing query: ${query}\n`, err.message);
      }
    }
    
    await pool.end();
    
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkDatabase(); 