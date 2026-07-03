
/**
 * Reusable MySQL connection (singleton) using mysql2/promise
 *
 * Node.js: 8+
 * Package: npm i mysql2
 *
 * Usage:
 *   const db = require('./db');
 *   const rows = await db.query('SELECT 1 + 1 AS two');
 *   // or get the pool directly: const pool = db.getPool();
 */

const mysql = require('mysql2/promise');

// Read config from environment variables (recommended for prod)
const
  DB_HOST = process.env.MYSQL_HOST || 'localhost',
  DB_PORT = 3306,
  DB_USER = process.env.MYSQL_USER || 'root',
  DB_PASSWORD = process.env.MYSQL_PASS || '12345678',
  DB_NAME = process.env.MYSQL_DB || 'df_statistical'
  // DB_CONN_LIMIT = '10',           // pool max
  // DB_CONN_MIN = '0',              // pool min (kept warm)
  // DB_CONN_IDLE_MS = '10000',      // how long a connection can be idle before release
  // DB_CONN_ACQUIRE_MS = '30000',   // wait time for a free connection before error
  // DB_CONN_EVICT_MS = '10000'     // interval for eviction checks
;

let pool; // singleton

function createPool() {
  return mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    decimalNumbers: false,
    timezone: 'Z',
    dateStrings: false,
    multipleStatements: false,
  });
}

function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

/**
 * Run a parameterized query with pooled connection.
 * @param {string} sql - SQL with placeholders (e.g., ?)
 * @param {Array|Object} [params] - Parameters for placeholders
 * @returns {Promise<Array>} rows
 */
async function query(sql, params, _retries) {
  const retries = (_retries === undefined) ? 1 : _retries;
  const p = getPool();
  try {
    const [rows] = await p.execute(sql, params);
    return rows;
  } catch (err) {
    if (retries > 0 && (err.code === 'ER_CLIENT_INTERACTION_TIMEOUT' || err.code === 'PROTOCOL_CONNECTION_LOST')) {
      return query(sql, params, retries - 1);
    }
    throw err;
  }
}

/**
 * Helper for transactions. Provides a callback that receives a dedicated connection.
 * The connection is committed/rolled back and released automatically.
 * @param {function} work - async function(conn) { ... }
 * @returns {Promise<any>}
 */
async function withTransaction(work, _retries) {
  const retries = (_retries === undefined) ? 1 : _retries;
  const p = getPool();
  let conn;
  try {
    conn = await p.getConnection();
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (e) { /* ignore */ }
    }
    if (retries > 0 && (err.code === 'ER_CLIENT_INTERACTION_TIMEOUT' || err.code === 'PROTOCOL_CONNECTION_LOST')) {
      return withTransaction(work, retries - 1);
    }
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  getPool,
  query,
  withTransaction,
};
