const db = require('../config/db');
const oracledb = db.oracledb;

/**
 * List custody transfers with joins to Drug, From Org, To Org, search, status filter, and pagination
 */
async function getAllCustodyTransfers(req, res) {
  try {
    const { search = '', status = '', batchId = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const binds = {};

    if (search.trim()) {
      whereClause += ` AND (UPPER(d.DRUG_NAME) LIKE UPPER(:search) OR UPPER(f_org.NAME) LIKE UPPER(:search) OR UPPER(t_org.NAME) LIKE UPPER(:search) OR UPPER(ct.INITIATED_BY) LIKE UPPER(:search) OR TO_CHAR(ct.TRANSFER_ID) LIKE :search)`;
      binds.search = `%${search.trim()}%`;
    }

    if (status.trim()) {
      whereClause += ` AND UPPER(ct.STATUS) = UPPER(:status)`;
      binds.status = status.trim();
    }

    if (batchId) {
      whereClause += ` AND ct.BATCH_ID = :batchId`;
      binds.batchId = parseInt(batchId, 10);
    }

    const countSql = `
      SELECT COUNT(*) AS TOTAL
      FROM CUSTODY_TRANSFER ct
      JOIN BATCH b ON ct.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN ORGANIZATION f_org ON ct.FROM_ORG_ID = f_org.ORG_ID
      JOIN ORGANIZATION t_org ON ct.TO_ORG_ID = t_org.ORG_ID
      ${whereClause}
    `;
    const countResult = await db.executeQuery(countSql, binds);
    const total = countResult.rows[0].TOTAL;

    const sql = `
      SELECT 
        ct.TRANSFER_ID,
        ct.BATCH_ID,
        d.DRUG_NAME,
        ct.FROM_ORG_ID,
        f_org.NAME AS FROM_ORG_NAME,
        ct.TO_ORG_ID,
        t_org.NAME AS TO_ORG_NAME,
        ct.FROM_LOCATION,
        ct.TO_LOCATION,
        TO_CHAR(ct.TRANSFER_DATE, 'YYYY-MM-DD') AS TRANSFER_DATE,
        ct.STATUS,
        ct.INITIATED_BY
      FROM CUSTODY_TRANSFER ct
      JOIN BATCH b ON ct.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN ORGANIZATION f_org ON ct.FROM_ORG_ID = f_org.ORG_ID
      JOIN ORGANIZATION t_org ON ct.TO_ORG_ID = t_org.ORG_ID
      ${whereClause}
      ORDER BY ct.TRANSFER_ID DESC
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
    console.error('[CustodyTransfer getAll Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Get transfer by ID with associated compliance check
 */
async function getCustodyTransferById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `
      SELECT 
        ct.TRANSFER_ID,
        ct.BATCH_ID,
        d.DRUG_NAME,
        ct.FROM_ORG_ID,
        f_org.NAME AS FROM_ORG_NAME,
        ct.TO_ORG_ID,
        t_org.NAME AS TO_ORG_NAME,
        ct.FROM_LOCATION,
        ct.TO_LOCATION,
        TO_CHAR(ct.TRANSFER_DATE, 'YYYY-MM-DD') AS TRANSFER_DATE,
        ct.STATUS,
        ct.INITIATED_BY
      FROM CUSTODY_TRANSFER ct
      JOIN BATCH b ON ct.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN ORGANIZATION f_org ON ct.FROM_ORG_ID = f_org.ORG_ID
      JOIN ORGANIZATION t_org ON ct.TO_ORG_ID = t_org.ORG_ID
      WHERE ct.TRANSFER_ID = :id
    `;
    const result = await db.executeQuery(sql, { id });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Transfer with ID ${id} not found` });
    }

    // Associated compliance checks
    const checkSql = `
      SELECT 
        CHECK_ID, 
        CHECK_TYPE, 
        TEMPERATURE, 
        EXPIRY_CHECK, 
        LICENSE_VALID, 
        RESULT
      FROM COMPLIANCE_CHECK
      WHERE TRANSFER_ID = :id
      ORDER BY CHECK_ID ASC
    `;
    const checkResult = await db.executeQuery(checkSql, { id });

    return res.json({
      success: true,
      data: {
        ...result.rows[0],
        complianceChecks: checkResult.rows
      }
    });
  } catch (err) {
    console.error('[CustodyTransfer getById Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Create custody transfer
 */
async function createCustodyTransfer(req, res) {
  try {
    const { batch_id, from_org_id, to_org_id, from_location, to_location, transfer_date, status, initiated_by } = req.body;

    if (!batch_id || !from_org_id || !to_org_id) {
      return res.status(400).json({
        success: false,
        error: 'batch_id, from_org_id, and to_org_id are required'
      });
    }

    const tDate = transfer_date || new Date().toISOString().split('T')[0];

    const sql = `
      INSERT INTO CUSTODY_TRANSFER (
        BATCH_ID, FROM_ORG_ID, TO_ORG_ID, FROM_LOCATION, TO_LOCATION, TRANSFER_DATE, STATUS, INITIATED_BY
      )
      VALUES (
        :batch_id, :from_org_id, :to_org_id, :from_location, :to_location, TO_DATE(:transfer_date, 'YYYY-MM-DD'), :status, :initiated_by
      )
      RETURNING TRANSFER_ID INTO :id
    `;
    const binds = {
      batch_id: parseInt(batch_id, 10),
      from_org_id: parseInt(from_org_id, 10),
      to_org_id: parseInt(to_org_id, 10),
      from_location: from_location ? from_location.trim() : null,
      to_location: to_location ? to_location.trim() : null,
      transfer_date: tDate,
      status: status ? status.trim() : 'Initiated',
      initiated_by: initiated_by ? initiated_by.trim() : null,
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const result = await db.executeQuery(sql, binds, { autoCommit: true });
    const insertedId = result.outBinds.id[0];

    return res.status(201).json({
      success: true,
      message: 'Custody transfer initiated and recorded in database',
      transferId: insertedId
    });
  } catch (err) {
    console.error('[CustodyTransfer create Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Update custody transfer
 */
async function updateCustodyTransfer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { batch_id, from_org_id, to_org_id, from_location, to_location, transfer_date, status, initiated_by } = req.body;

    const sql = `
      UPDATE CUSTODY_TRANSFER
      SET BATCH_ID = :batch_id,
          FROM_ORG_ID = :from_org_id,
          TO_ORG_ID = :to_org_id,
          FROM_LOCATION = :from_location,
          TO_LOCATION = :to_location,
          TRANSFER_DATE = TO_DATE(:transfer_date, 'YYYY-MM-DD'),
          STATUS = :status,
          INITIATED_BY = :initiated_by
      WHERE TRANSFER_ID = :id
    `;
    const binds = {
      id,
      batch_id: parseInt(batch_id, 10),
      from_org_id: parseInt(from_org_id, 10),
      to_org_id: parseInt(to_org_id, 10),
      from_location: from_location ? from_location.trim() : null,
      to_location: to_location ? to_location.trim() : null,
      transfer_date: transfer_date,
      status: status ? status.trim() : null,
      initiated_by: initiated_by ? initiated_by.trim() : null
    };

    const result = await db.executeQuery(sql, binds, { autoCommit: true });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Transfer with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Custody transfer updated successfully'
    });
  } catch (err) {
    console.error('[CustodyTransfer update Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Delete custody transfer
 */
async function deleteCustodyTransfer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `DELETE FROM CUSTODY_TRANSFER WHERE TRANSFER_ID = :id`;
    const result = await db.executeQuery(sql, { id }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Transfer with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Custody transfer deleted successfully'
    });
  } catch (err) {
    console.error('[CustodyTransfer delete Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

module.exports = {
  getAllCustodyTransfers,
  getCustodyTransferById,
  createCustodyTransfer,
  updateCustodyTransfer,
  deleteCustodyTransfer
};
