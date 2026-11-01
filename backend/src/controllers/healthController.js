const db = require('../config/db');

/**
 * Health check endpoint - requirement 7:
 * Executes SELECT 1 AS DB_CONNECTED FROM dual
 */
async function getHealth(req, res) {
  try {
    const startTime = Date.now();
    const result = await db.executeQuery('SELECT 1 AS DB_CONNECTED FROM dual');
    const latencyMs = Date.now() - startTime;

    if (result.rows && result.rows.length > 0 && result.rows[0].DB_CONNECTED === 1) {
      return res.json({
        status: 'UP',
        db_connected: 1,
        message: 'Oracle Database is healthy and connected',
        latencyMs,
        timestamp: new Date().toISOString(),
        database: {
          service: process.env.DB_CONNECT_STRING || 'localhost:1521/XE',
          user: process.env.DB_USER || 'SYSTEM',
          poolMin: process.env.DB_POOL_MIN || 2,
          poolMax: process.env.DB_POOL_MAX || 10
        }
      });
    } else {
      return res.status(500).json({
        status: 'DOWN',
        db_connected: 0,
        message: 'Oracle Database returned unexpected response'
      });
    }
  } catch (err) {
    console.error('[Health Check Error]:', err);
    return res.status(503).json({
      status: 'DOWN',
      db_connected: 0,
      message: 'Failed to connect to Oracle Database',
      error: err.message
    });
  }
}

/**
 * Live Oracle Schema Inspection endpoint - requirement 6
 * Queries user_tables, user_tab_columns, user_constraints, user_cons_columns
 */
async function getSchemaTables(req, res) {
  try {
    const sql = `
      SELECT table_name 
      FROM user_tables 
      WHERE table_name IN (
        'CONSUMER', 'ORGANIZATION', 'DRUGS', 'BATCH', 
        'STORAGE_LOCATION', 'BATCH_STORAGE', 'CUSTODY_TRANSFER', 
        'COMPLIANCE_CHECK', 'VERIFICATION_LOG'
      )
      ORDER BY table_name
    `;
    const result = await db.executeQuery(sql);
    
    // Also fetch row count for each table
    const tablesWithCounts = await Promise.all(result.rows.map(async (row) => {
      const countSql = `SELECT COUNT(*) AS CNT FROM ${row.TABLE_NAME}`;
      const countResult = await db.executeQuery(countSql);
      return {
        table_name: row.TABLE_NAME,
        row_count: countResult.rows[0].CNT
      };
    }));

    return res.json({
      success: true,
      tables: tablesWithCounts
    });
  } catch (err) {
    console.error('[Schema Inspection Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getTableColumns(req, res) {
  try {
    const tableName = req.params.table.toUpperCase();

    // Query column definitions using bind variable
    const colSql = `
      SELECT column_name, data_type, data_length, data_precision, data_scale, nullable
      FROM user_tab_columns 
      WHERE table_name = UPPER(:tableName)
      ORDER BY column_id
    `;
    const colResult = await db.executeQuery(colSql, { tableName });

    // Query constraints (PK, FK, CHECK, UNIQUE)
    const constSql = `
      SELECT 
        c.constraint_name,
        c.constraint_type,
        c.search_condition,
        c.r_constraint_name,
        cc.column_name,
        cc.position,
        r_c.table_name AS referenced_table
      FROM user_constraints c
      JOIN user_cons_columns cc ON c.constraint_name = cc.constraint_name
      LEFT JOIN user_constraints r_c ON c.r_constraint_name = r_c.constraint_name
      WHERE c.table_name = UPPER(:tableName)
      ORDER BY c.constraint_type, cc.position
    `;
    const constResult = await db.executeQuery(constSql, { tableName });

    return res.json({
      success: true,
      tableName,
      columns: colResult.rows,
      constraints: constResult.rows
    });
  } catch (err) {
    console.error('[Table Schema Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getHealth,
  getSchemaTables,
  getTableColumns
};
