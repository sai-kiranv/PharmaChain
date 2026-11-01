const db = require('../config/db');
const oracledb = db.oracledb;

/**
 * List consumer product verification logs with join to Drug, Batch, and Consumer
 */
async function getAllVerificationLogs(req, res) {
  try {
    const { search = '', result = '', batchId = '', consumerId = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const binds = {};

    if (search.trim()) {
      whereClause += ` AND (UPPER(d.DRUG_NAME) LIKE UPPER(:search) OR UPPER(c.NAME) LIKE UPPER(:search) OR UPPER(vl.RESULT) LIKE UPPER(:search) OR TO_CHAR(vl.LOG_ID) LIKE :search)`;
      binds.search = `%${search.trim()}%`;
    }

    if (result.trim()) {
      whereClause += ` AND UPPER(vl.RESULT) = UPPER(:result)`;
      binds.result = result.trim();
    }

    if (batchId) {
      whereClause += ` AND vl.BATCH_ID = :batchId`;
      binds.batchId = parseInt(batchId, 10);
    }

    if (consumerId) {
      whereClause += ` AND vl.CONSUMER_ID = :consumerId`;
      binds.consumerId = parseInt(consumerId, 10);
    }

    const countSql = `
      SELECT COUNT(*) AS TOTAL
      FROM VERIFICATION_LOG vl
      JOIN BATCH b ON vl.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN CONSUMER c ON vl.CONSUMER_ID = c.CONSUMER_ID
      ${whereClause}
    `;
    const countResult = await db.executeQuery(countSql, binds);
    const total = countResult.rows[0].TOTAL;

    const sql = `
      SELECT 
        vl.LOG_ID,
        vl.BATCH_ID,
        d.DRUG_NAME,
        d.GENERIC_NAME,
        vl.CONSUMER_ID,
        c.NAME AS CONSUMER_NAME,
        c.CONTACT AS CONSUMER_CONTACT,
        TO_CHAR(vl.SCAN_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS') AS SCAN_TIMESTAMP,
        vl.RESULT,
        TO_CHAR(b.EXP_DATE, 'YYYY-MM-DD') AS BATCH_EXP_DATE
      FROM VERIFICATION_LOG vl
      JOIN BATCH b ON vl.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN CONSUMER c ON vl.CONSUMER_ID = c.CONSUMER_ID
      ${whereClause}
      ORDER BY vl.LOG_ID DESC
      OFFSET :offset ROWS FETCH NEXT :limitNum ROWS ONLY
    `;
    const paginatedBinds = { ...binds, offset, limitNum };
    const queryResult = await db.executeQuery(sql, paginatedBinds);

    return res.json({
      success: true,
      data: queryResult.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('[VerificationLog getAll Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Get verification log by ID
 */
async function getVerificationLogById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `
      SELECT 
        vl.LOG_ID,
        vl.BATCH_ID,
        d.DRUG_NAME,
        vl.CONSUMER_ID,
        c.NAME AS CONSUMER_NAME,
        TO_CHAR(vl.SCAN_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS') AS SCAN_TIMESTAMP,
        vl.RESULT
      FROM VERIFICATION_LOG vl
      JOIN BATCH b ON vl.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN CONSUMER c ON vl.CONSUMER_ID = c.CONSUMER_ID
      WHERE vl.LOG_ID = :id
    `;
    const result = await db.executeQuery(sql, { id });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Verification log with ID ${id} not found` });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('[VerificationLog getById Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Create verification log
 */
async function createVerificationLog(req, res) {
  try {
    const { batch_id, consumer_id, scan_timestamp, result } = req.body;

    if (!batch_id || !consumer_id) {
      return res.status(400).json({ success: false, error: 'batch_id and consumer_id are required' });
    }

    const scanTimeSql = scan_timestamp
      ? "TO_DATE(:scan_timestamp, 'YYYY-MM-DD HH24:MI:SS')"
      : "SYSDATE";

    const sql = `
      INSERT INTO VERIFICATION_LOG (BATCH_ID, CONSUMER_ID, SCAN_TIMESTAMP, RESULT)
      VALUES (:batch_id, :consumer_id, ${scanTimeSql}, :result)
      RETURNING LOG_ID INTO :id
    `;
    const binds = {
      batch_id: parseInt(batch_id, 10),
      consumer_id: parseInt(consumer_id, 10),
      result: result ? result.trim().toUpperCase() : 'GENUINE',
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    if (scan_timestamp) {
      binds.scan_timestamp = scan_timestamp;
    }

    const queryResult = await db.executeQuery(sql, binds, { autoCommit: true });
    const insertedId = queryResult.outBinds.id[0];

    return res.status(201).json({
      success: true,
      message: 'Product scan verification logged successfully',
      logId: insertedId
    });
  } catch (err) {
    console.error('[VerificationLog create Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Update verification log
 */
async function updateVerificationLog(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { batch_id, consumer_id, result } = req.body;

    const sql = `
      UPDATE VERIFICATION_LOG
      SET BATCH_ID = :batch_id,
          CONSUMER_ID = :consumer_id,
          RESULT = :result
      WHERE LOG_ID = :id
    `;
    const binds = {
      id,
      batch_id: parseInt(batch_id, 10),
      consumer_id: parseInt(consumer_id, 10),
      result: result ? result.trim().toUpperCase() : null
    };

    const queryResult = await db.executeQuery(sql, binds, { autoCommit: true });
    if (queryResult.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Verification log with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Verification log updated successfully'
    });
  } catch (err) {
    console.error('[VerificationLog update Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Delete verification log
 */
async function deleteVerificationLog(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `DELETE FROM VERIFICATION_LOG WHERE LOG_ID = :id`;
    const result = await db.executeQuery(sql, { id }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Verification log with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Verification log deleted successfully'
    });
  } catch (err) {
    console.error('[VerificationLog delete Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

module.exports = {
  getAllVerificationLogs,
  getVerificationLogById,
  createVerificationLog,
  updateVerificationLog,
  deleteVerificationLog
};
