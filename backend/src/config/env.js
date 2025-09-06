const assert = require('assert');
require('dotenv').config();

const env = {
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Simple validation to fail fast in production
try {
  assert(env.MONGO_URI, 'MONGO_URI is required');
  assert(env.JWT_SECRET, 'JWT_SECRET is required');
  assert(env.COOKIE_SECRET, 'COOKIE_SECRET is required');
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err.message);
  process.exit(1);
}

module.exports = env;
