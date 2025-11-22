require('dotenv').config();

const requiredEnvVars = [
  'OPENAI_API_KEY',
  'PORT'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const config = {
  PORT: process.env.PORT || 3001,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || './data/database.db',
  LANCEDB_URI: process.env.LANCEDB_URI || './data/lancedb'
};

module.exports = config;
