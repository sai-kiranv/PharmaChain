const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configure oracledb defaults
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = false;

const dbConfig = {
  user: process.env.DB_USER || 'SYSTEM',
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/XE',
  poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
  poolIncrement: parseInt(process.env.DB_POOL_INCREMENT || '2', 10),
  poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '60', 10),
  poolAlias: 'pharmachainPool'
};

let pool;

/**
 * Initialize Oracle Connection Pool
 */
async function initializePool() {
  try {
    if (!dbConfig.password) {
      throw new Error('Database password is not set in backend .env file (DB_PASSWORD)');
    }
    pool = await oracledb.createPool(dbConfig);
    console.log(`[Oracle Pool] Initialized successfully with connectString: ${dbConfig.connectString}`);
    return pool;
  } catch (err) {
    console.error('[Oracle Pool] Failed to initialize connection pool:', err.message);
    throw err;
  }
}

/**
 * Close Oracle Connection Pool
 */
async function closePool() {
  if (pool) {
    try {
      await pool.close(10);
      console.log('[Oracle Pool] Closed successfully');
    } catch (err) {
      console.error('[Oracle Pool] Error closing pool:', err.message);
    }
  }
}

/**
 * Execute query using pooled connection
 * @param {string} sql - Parameterized SQL query
 * @param {object|array} binds - Bind parameters
 * @param {object} options - Execution options (e.g., autoCommit)
 */
async function executeQuery(sql, binds = {}, options = {}) {
  let connection;
  try {
    connection = await oracledb.getConnection('pharmachainPool');
    const execOptions = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: options.autoCommit !== undefined ? options.autoCommit : false,
      ...options
    };

    const result = await connection.execute(sql, binds, execOptions);
    return result;
  } catch (err) {
    // Augment with friendly Oracle constraint messages where helpful
    if (err.message.includes('ORA-00001')) {
      err.friendlyMessage = 'A record with this unique identifier or license already exists.';
    } else if (err.message.includes('ORA-02291')) {
      err.friendlyMessage = 'Referenced parent record does not exist (Foreign key constraint violation).';
    } else if (err.message.includes('ORA-02292')) {
      err.friendlyMessage = 'Cannot delete or update this record because related child records depend on it.';
    } else if (err.message.includes('ORA-01400')) {
      err.friendlyMessage = 'Required field cannot be null.';
    } else if (err.message.includes('ORA-02290')) {
      err.friendlyMessage = 'Check constraint violation. Please verify date order or values.';
    }
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('[Oracle Connection] Error releasing connection:', closeErr.message);
      }
    }
  }
}

/**
 * Health check query: SELECT 1 AS DB_CONNECTED FROM dual
 */
async function checkHealth() {
  const result = await executeQuery('SELECT 1 AS DB_CONNECTED FROM dual');
  return result.rows && result.rows.length > 0 && result.rows[0].DB_CONNECTED === 1;
}

module.exports = {
  initializePool,
  closePool,
  executeQuery,
  checkHealth,
  oracledb
};
