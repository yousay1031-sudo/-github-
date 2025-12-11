const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Find the D1 database file
const wranglerDir = path.join(__dirname, '.wrangler');
const d1Dir = path.join(wranglerDir, 'state/v3/d1/miniflare-D1DatabaseObject');

// Get the first .sqlite file
const files = fs.readdirSync(d1Dir).filter(f => f.endsWith('.sqlite'));
if (files.length === 0) {
  console.error('No database file found');
  process.exit(1);
}

const dbPath = path.join(d1Dir, files[0]);
console.log('Database file:', dbPath);

// Open database
const db = new Database(dbPath);

// Read and execute migration SQL
const migrationSql = fs.readFileSync(path.join(__dirname, 'migrations/0001_initial_schema.sql'), 'utf8');
db.exec(migrationSql);
console.log('✓ Migration executed successfully');

// Read and execute seed SQL
const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
db.exec(seedSql);
console.log('✓ Seed data inserted successfully');

// Close database
db.close();
console.log('✓ Database initialization complete');
