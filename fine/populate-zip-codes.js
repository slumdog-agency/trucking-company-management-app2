import sqlite3 from 'sqlite3';
import fetch from 'node-fetch';

// Open database connection
const db = new sqlite3.Database('fine.db');

// Promisify database operations
db.runAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

db.getAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

async function insertZipCode(zipCode, city, state, county) {
  const sql = `
    INSERT OR REPLACE INTO zipCodes (zipCode, city, state, county)
    VALUES (?, ?, ?, ?)
  `;
  try {
    await db.runAsync(sql, [zipCode, city, state, county]);
    console.log(`✓ Added ZIP code: ${zipCode} - ${city}, ${state}`);
  } catch (err) {
    console.error(`✗ Error adding ZIP code ${zipCode}:`, err);
  }
}

async function lookupZipCode(zipCode) {
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    if (!response.ok) {
      throw new Error(`ZIP code lookup failed: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Extract the data
    const place = data.places[0];
    return {
      city: place['place name'],
      state: place['state abbreviation'],
      county: null
    };
  } catch (err) {
    console.error(`Error looking up ZIP code ${zipCode}:`, err);
    return null;
  }
}

// Function to look up a ZIP code and store it in the database
async function processZipCode(zipCode) {
  // Check if ZIP code already exists
  const exists = await db.getAsync('SELECT 1 FROM zipCodes WHERE zipCode = ?', [zipCode]);
  if (exists) {
    console.log(`ZIP code ${zipCode} already exists in database`);
    return;
  }

  const data = await lookupZipCode(zipCode);
  if (data) {
    await insertZipCode(zipCode, data.city, data.state, data.county);
  }
}

// Main function to process ZIP codes
async function main() {
  try {
    console.log('Starting ZIP code population process...\n');

    // Get all unique ZIP codes from routes
    const rows = await new Promise((resolve, reject) => {
      db.all('SELECT DISTINCT pickupZip as zip FROM routes UNION SELECT DISTINCT deliveryZip as zip FROM routes', 
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
    });

    // Process each ZIP code
    for (const row of rows) {
      await processZipCode(row.zip);
    }

    console.log('\nZIP code population process completed!');
  } catch (err) {
    console.error('\nError during ZIP code population:', err);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        process.exit(1);
      } else {
        console.log('\nDatabase connection closed.');
      }
    });
  }
}

// Run the main function
main(); 