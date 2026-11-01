const db = require('../config/db');
const oracledb = db.oracledb;

/**
 * List batches joined with DRUGS and ORGANIZATION
 * Includes status (Active, Expiring Soon, Expired), search, filtering, and pagination
 */
async function getAllBatches(req, res) {
  try {
    const { search = '', drugId = '', orgId = '', status = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const binds = {};

    if (search.trim()) {
      whereClause += ` AND (UPPER(d.DRUG_NAME) LIKE UPPER(:search) OR UPPER(o.NAME) LIKE UPPER(:search) OR TO_CHAR(b.BATCH_ID) LIKE :search)`;
      binds.search = `%${search.trim()}%`;
    }

    if (drugId) {
      whereClause += ` AND b.DRUG_ID = :drugId`;
      binds.drugId = parseInt(drugId, 10);
    }

    if (orgId) {
      whereClause += ` AND b.ORG_ID = :orgId`;
      binds.orgId = parseInt(orgId, 10);
    }

    if (status === 'EXPIRED') {
      whereClause += ` AND b.EXP_DATE <= SYSDATE`;
    } else if (status === 'EXPIRING_SOON') {
      whereClause += ` AND b.EXP_DATE > SYSDATE AND b.EXP_DATE <= SYSDATE + 90`;
    } else if (status === 'ACTIVE') {
      whereClause += ` AND b.EXP_DATE > SYSDATE`;
    }

    const countSql = `
      SELECT COUNT(*) AS TOTAL
      FROM BATCH b
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN ORGANIZATION o ON b.ORG_ID = o.ORG_ID
      ${whereClause}
    `;
    const countResult = await db.executeQuery(countSql, binds);
    const total = countResult.rows[0].TOTAL;

    const sql = `
      SELECT 
        b.BATCH_ID,
        b.DRUG_ID,
        d.DRUG_NAME,
        d.GENERIC_NAME,
        d.STORAGE_REQUIREMENT,
        b.ORG_ID,
        o.NAME AS MANUFACTURER_NAME,
        b.QUANTITY,
        TO_CHAR(b.MFG_DATE, 'YYYY-MM-DD') AS MFG_DATE,
        TO_CHAR(b.EXP_DATE, 'YYYY-MM-DD') AS EXP_DATE,
        CASE 
          WHEN b.EXP_DATE <= SYSDATE THEN 'EXPIRED'
          WHEN b.EXP_DATE <= SYSDATE + 90 THEN 'EXPIRING_SOON'
          ELSE 'ACTIVE'
        END AS STATUS,
        ROUND(b.EXP_DATE - SYSDATE) AS DAYS_REMAINING
      FROM BATCH b
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN ORGANIZATION o ON b.ORG_ID = o.ORG_ID
      ${whereClause}
      ORDER BY b.BATCH_ID DESC
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
    console.error('[Batches getAll Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Get batch by ID with complete custody journey and warehouse allocations
 */
async function getBatchById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `
      SELECT 
        b.BATCH_ID,
        b.DRUG_ID,
        d.DRUG_NAME,
        d.GENERIC_NAME,
        d.STORAGE_REQUIREMENT,
        b.ORG_ID,
        o.NAME AS MANUFACTURER_NAME,
        b.QUANTITY,
        TO_CHAR(b.MFG_DATE, 'YYYY-MM-DD') AS MFG_DATE,
        TO_CHAR(b.EXP_DATE, 'YYYY-MM-DD') AS EXP_DATE,
        CASE 
          WHEN b.EXP_DATE <= SYSDATE THEN 'EXPIRED'
          WHEN b.EXP_DATE <= SYSDATE + 90 THEN 'EXPIRING_SOON'
          ELSE 'ACTIVE'
        END AS STATUS,
        ROUND(b.EXP_DATE - SYSDATE) AS DAYS_REMAINING
      FROM BATCH b
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN ORGANIZATION o ON b.ORG_ID = o.ORG_ID
      WHERE b.BATCH_ID = :id
    `;
    const result = await db.executeQuery(sql, { id });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Batch with ID ${id} not found` });
    }

    // Warehouse allocations (BATCH_STORAGE)
    const storageSql = `
      SELECT 
        bs.LOCATION_ID,
        sl.LOCATION_NAME,
        sl.CITY,
        sl.STATE,
        bs.STORED_QUANTITY
      FROM BATCH_STORAGE bs
      JOIN STORAGE_LOCATION sl ON bs.LOCATION_ID = sl.LOCATION_ID
      WHERE bs.BATCH_ID = :id
    `;
    const storageResult = await db.executeQuery(storageSql, { id });

    // Custody transfers
    const transferSql = `
      SELECT 
        ct.TRANSFER_ID,
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
      JOIN ORGANIZATION f_org ON ct.FROM_ORG_ID = f_org.ORG_ID
      JOIN ORGANIZATION t_org ON ct.TO_ORG_ID = t_org.ORG_ID
      WHERE ct.BATCH_ID = :id
      ORDER BY ct.TRANSFER_ID ASC
    `;
    const transferResult = await db.executeQuery(transferSql, { id });

    // Verification logs
    const verifSql = `
      SELECT 
        vl.LOG_ID,
        vl.CONSUMER_ID,
        c.NAME AS CONSUMER_NAME,
        TO_CHAR(vl.SCAN_TIMESTAMP, 'YYYY-MM-DD HH24:MI') AS SCAN_TIME,
        vl.RESULT
      FROM VERIFICATION_LOG vl
      JOIN CONSUMER c ON vl.CONSUMER_ID = c.CONSUMER_ID
      WHERE vl.BATCH_ID = :id
      ORDER BY vl.LOG_ID DESC
    `;
    const verifResult = await db.executeQuery(verifSql, { id });

    return res.json({
      success: true,
      data: {
        ...result.rows[0],
        storageAllocations: storageResult.rows,
        transfers: transferResult.rows,
        verifications: verifResult.rows
      }
    });
  } catch (err) {
    console.error('[Batch getById Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Create batch with date validation
 */
async function createBatch(req, res) {
  try {
    const { drug_id, mfg_date, exp_date, org_id, quantity } = req.body;

    if (!drug_id || !mfg_date || !exp_date || !org_id || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: drug_id, mfg_date, exp_date, org_id, quantity'
      });
    }

    if (new Date(exp_date) <= new Date(mfg_date)) {
      return res.status(400).json({
        success: false,
        error: 'Expiration date must be strictly after the manufacturing date'
      });
    }

    if (Number(quantity) < 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity cannot be negative'
      });
    }

    const sql = `
      INSERT INTO BATCH (DRUG_ID, MFG_DATE, EXP_DATE, ORG_ID, QUANTITY)
      VALUES (
        :drug_id,
        TO_DATE(:mfg_date, 'YYYY-MM-DD'),
        TO_DATE(:exp_date, 'YYYY-MM-DD'),
        :org_id,
        :quantity
      )
      RETURNING BATCH_ID INTO :id
    `;
    const binds = {
      drug_id: parseInt(drug_id, 10),
      mfg_date: mfg_date,
      exp_date: exp_date,
      org_id: parseInt(org_id, 10),
      quantity: parseInt(quantity, 10),
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const result = await db.executeQuery(sql, binds, { autoCommit: true });
    const insertedId = result.outBinds.id[0];

    return res.status(201).json({
      success: true,
      message: 'Batch produced and recorded successfully',
      batchId: insertedId
    });
  } catch (err) {
    console.error('[Batch create Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Update batch
 */
async function updateBatch(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { drug_id, mfg_date, exp_date, org_id, quantity } = req.body;

    if (new Date(exp_date) <= new Date(mfg_date)) {
      return res.status(400).json({
        success: false,
        error: 'Expiration date must be strictly after the manufacturing date'
      });
    }

    const sql = `
      UPDATE BATCH
      SET DRUG_ID = :drug_id,
          MFG_DATE = TO_DATE(:mfg_date, 'YYYY-MM-DD'),
          EXP_DATE = TO_DATE(:exp_date, 'YYYY-MM-DD'),
          ORG_ID = :org_id,
          QUANTITY = :quantity
      WHERE BATCH_ID = :id
    `;
    const binds = {
      id,
      drug_id: parseInt(drug_id, 10),
      mfg_date: mfg_date,
      exp_date: exp_date,
      org_id: parseInt(org_id, 10),
      quantity: parseInt(quantity, 10)
    };

    const result = await db.executeQuery(sql, binds, { autoCommit: true });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Batch with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Batch updated successfully'
    });
  } catch (err) {
    console.error('[Batch update Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Delete batch
 */
async function deleteBatch(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `DELETE FROM BATCH WHERE BATCH_ID = :id`;
    const result = await db.executeQuery(sql, { id }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Batch with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Batch deleted successfully'
    });
  } catch (err) {
    console.error('[Batch delete Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

module.exports = {
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch
};
