const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

let db;
let retries = 5;

function connect() {
  try {
    const dbPath = path.resolve(process.cwd(), config.DATABASE_URL);
    const dbDir = path.dirname(dbPath);

    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath, {
      verbose: config.NODE_ENV === 'development' ? console.log : null
    });

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 1000000000'); // 1GB cache
    db.pragma('temp_store = memory');

    console.log('Database connected successfully');
    return db;
  } catch (error) {
    if (retries > 0) {
      console.log(`Database connection failed, retrying... (${retries} attempts left)`);
      retries--;
      setTimeout(connect, 2000);
    } else {
      throw new Error(`Failed to connect to database after multiple attempts: ${error.message}`);
    }
  }
}

// Initialize connection
connect();

// CRUD Operations
const operations = {
  // Execute a query
  run: (query, params = []) => {
    try {
      return db.prepare(query).run(params);
    } catch (error) {
      console.error('Query execution error:', error);
      throw error;
    }
  },

  // Get single row
  get: (query, params = []) => {
    try {
      return db.prepare(query).get(params);
    } catch (error) {
      console.error('Query execution error:', error);
      throw error;
    }
  },

  // Get all rows
  all: (query, params = []) => {
    try {
      return db.prepare(query).all(params);
    } catch (error) {
      console.error('Query execution error:', error);
      throw error;
    }
  },

  // Execute multiple statements
  exec: (sql) => {
    try {
      return db.exec(sql);
    } catch (error) {
      console.error('Exec error:', error);
      throw error;
    }
  },

  // Transaction wrapper
  transaction: (fn) => {
    try {
      return db.transaction(fn)();
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  },

  // Close connection
  close: () => {
    if (db) {
      db.close();
      console.log('Database connection closed');
    }
  }
};

module.exports = operations;
