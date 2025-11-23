const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

let db;
let retries = 5;

function connect() {
  return new Promise((resolve, reject) => {
    try {
      const dbPath = path.resolve(process.cwd(), config.DATABASE_URL);
      const dbDir = path.dirname(dbPath);

      // Ensure directory exists
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          if (retries > 0) {
            console.log(`Database connection failed, retrying... (${retries} attempts left)`);
            retries--;
            setTimeout(() => connect().then(resolve).catch(reject), 2000);
          } else {
            reject(new Error(`Failed to connect to database after multiple attempts: ${err.message}`));
          }
          return;
        }

        // Enable WAL mode for better concurrency
        db.run('PRAGMA journal_mode = WAL', (err) => {
          if (err) console.warn('Failed to set WAL mode:', err);

          db.run('PRAGMA synchronous = NORMAL', (err) => {
            if (err) console.warn('Failed to set synchronous mode:', err);

            db.run('PRAGMA cache_size = -1000000', (err) => { // -1000000 = ~1GB cache (negative for KB)
              if (err) console.warn('Failed to set cache size:', err);

              db.run('PRAGMA temp_store = memory', (err) => {
                if (err) console.warn('Failed to set temp store:', err);

                console.log('Database connected successfully');
                resolve(db);
              });
            });
          });
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Initialize connection
let dbPromise = connect();

// Helper function to get database instance
async function getDbConnection() {
  if (!db) {
    db = await dbPromise;
  }
  return db;
}

// CRUD Operations
const operations = {
  // Execute a query
  run: async (query, params = []) => {
    try {
      const db = await getDbConnection();
      return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
          if (err) {
            console.error('Query execution error:', err);
            reject(err);
          } else {
            resolve({
              lastID: this.lastID,
              changes: this.changes
            });
          }
        });
      });
    } catch (error) {
      console.error('Database operation error:', error);
      throw error;
    }
  },

  // Get single row
  get: async (query, params = []) => {
    try {
      const db = await getDbConnection();
      return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
          if (err) {
            console.error('Query execution error:', err);
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
    } catch (error) {
      console.error('Database operation error:', error);
      throw error;
    }
  },

  // Get all rows
  all: async (query, params = []) => {
    try {
      const db = await getDbConnection();
      return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) {
            console.error('Query execution error:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    } catch (error) {
      console.error('Database operation error:', error);
      throw error;
    }
  },

  // Execute multiple statements
  exec: async (sql) => {
    try {
      const db = await getDbConnection();
      return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
          if (err) {
            console.error('Exec error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Database operation error:', error);
      throw error;
    }
  },

  // Transaction wrapper
  transaction: async (fn) => {
    const db = await getDbConnection();
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            console.error('Transaction begin error:', err);
            reject(err);
            return;
          }

          Promise.resolve(fn(operations))
            .then((result) => {
              db.run('COMMIT', (err) => {
                if (err) {
                  console.error('Transaction commit error:', err);
                  reject(err);
                } else {
                  resolve(result);
                }
              });
            })
            .catch((error) => {
              console.error('Transaction execution error:', error);
              db.run('ROLLBACK', (rollbackErr) => {
                if (rollbackErr) {
                  console.error('Transaction rollback error:', rollbackErr);
                }
                reject(error);
              });
            });
        });
      });
    });
  },

  // Close connection
  close: async () => {
    if (db) {
      return new Promise((resolve) => {
        db.close((err) => {
          if (err) {
            console.error('Database close error:', err);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      });
    }
  }
};

module.exports = operations;
