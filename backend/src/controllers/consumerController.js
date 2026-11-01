const db = require('../config/db');
const oracledb = db.oracledb;

/**
 * List consumers with search, sorting, and pagination
 */
async function getAllConsumers(req, res) {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const binds = {};

    if (search.trim()) {
      whereClause += ` AND (UPPER(NAME) LIKE UPPER(:search) OR CONTACT LIKE :search)`;
      binds.search = `%${search.trim()}%`;
    }

    // Total count query
    const countSql = `SELECT COUNT(*) AS TOTAL FROM CONSUMER ${whereClause}`;
    const countResult = await db.executeQuery(countSql, binds);
    const total = countResult.rows[0].TOTAL;

    // Paginated records
    const sql = `
      SELECT CONSUMER_ID, NAME, CONTACT
      FROM CONSUMER
      ${whereClause}
      ORDER BY CONSUMER_ID ASC
      OFFSET :offset ROWS FETCH NEXT :limitNum ROWS ONLY
    `;
    const paginatedBinds = { ...binds, offset, limitNum };
    const result = await db.executeQuery(sql, paginatedBinds);

    return res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('[Consumers getAll Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Get consumer by ID with related verification logs
 */
async function getConsumerById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `SELECT CONSUMER_ID, NAME, CONTACT FROM CONSUMER WHERE CONSUMER_ID = :id`;
    const result = await db.executeQuery(sql, { id });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Consumer with ID ${id} not found` });
    }

    // Fetch related verification logs
    const logSql = `
      SELECT vl.LOG_ID, vl.BATCH_ID, d.DRUG_NAME, TO_CHAR(vl.SCAN_TIMESTAMP, 'YYYY-MM-DD HH24:MI') AS SCAN_TIME, vl.RESULT
      FROM VERIFICATION_LOG vl
      JOIN BATCH b ON vl.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      WHERE vl.CONSUMER_ID = :id
      ORDER BY vl.LOG_ID DESC
    `;
    const logsResult = await db.executeQuery(logSql, { id });

    return res.json({
      success: true,
      data: {
        ...result.rows[0],
        verifications: logsResult.rows
      }
    });
  } catch (err) {
    console.error('[Consumer getById Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Create a new consumer
 */
async function createConsumer(req, res) {
  try {
    const { name, contact } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const sql = `
      INSERT INTO CONSUMER (NAME, CONTACT)
      VALUES (:name, :contact)
      RETURNING CONSUMER_ID INTO :id
    `;
    const binds = {
      name: name.trim(),
      contact: contact ? contact.trim() : null,
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const result = await db.executeQuery(sql, binds, { autoCommit: true });
    const insertedId = result.outBinds.id[0];

    return res.status(201).json({
      success: true,
      message: 'Consumer created successfully',
      consumerId: insertedId
    });
  } catch (err) {
    console.error('[Consumer create Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Update consumer
 */
async function updateConsumer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, contact } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const sql = `
      UPDATE CONSUMER
      SET NAME = :name, CONTACT = :contact
      WHERE CONSUMER_ID = :id
    `;
    const binds = {
      id,
      name: name.trim(),
      contact: contact ? contact.trim() : null
    };

    const result = await db.executeQuery(sql, binds, { autoCommit: true });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Consumer with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Consumer updated successfully'
    });
  } catch (err) {
    console.error('[Consumer update Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Delete consumer
 */
async function deleteConsumer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `DELETE FROM CONSUMER WHERE CONSUMER_ID = :id`;
    const result = await db.executeQuery(sql, { id }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Consumer with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Consumer deleted successfully'
    });
  } catch (err) {
    console.error('[Consumer delete Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

module.exports = {
  getAllConsumers,
  getConsumerById,
  createConsumer,
  updateConsumer,
  deleteConsumer
};
