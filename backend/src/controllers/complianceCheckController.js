const db = require('../config/db');
const oracledb = db.oracledb;

/**
 * List compliance checks with joined transfer information
 */
async function getAllComplianceChecks(req, res) {
  try {
    const { search = '', result = '', transferId = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const binds = {};

    if (search.trim()) {
      whereClause += ` AND (UPPER(cc.CHECK_TYPE) LIKE UPPER(:search) OR UPPER(cc.RESULT) LIKE UPPER(:search) OR TO_CHAR(cc.CHECK_ID) LIKE :search)`;
      binds.search = `%${search.trim()}%`;
    }

    if (result.trim()) {
      whereClause += ` AND UPPER(cc.RESULT) = UPPER(:result)`;
      binds.result = result.trim();
    }

    if (transferId) {
      whereClause += ` AND cc.TRANSFER_ID = :transferId`;
      binds.transferId = parseInt(transferId, 10);
    }

    const countSql = `
      SELECT COUNT(*) AS TOTAL
      FROM COMPLIANCE_CHECK cc
      JOIN CUSTODY_TRANSFER ct ON cc.TRANSFER_ID = ct.TRANSFER_ID
      ${whereClause}
    `;
    const countResult = await db.executeQuery(countSql, binds);
    const total = countResult.rows[0].TOTAL;

    const sql = `
      SELECT 
        cc.CHECK_ID,
        cc.TRANSFER_ID,
        cc.CHECK_TYPE,
        cc.TEMPERATURE,
        cc.EXPIRY_CHECK,
        cc.LICENSE_VALID,
        cc.RESULT,
        ct.BATCH_ID,
        d.DRUG_NAME,
        f_org.NAME AS FROM_ORG_NAME,
        t_org.NAME AS TO_ORG_NAME
      FROM COMPLIANCE_CHECK cc
      JOIN CUSTODY_TRANSFER ct ON cc.TRANSFER_ID = ct.TRANSFER_ID
      JOIN BATCH b ON ct.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN ORGANIZATION f_org ON ct.FROM_ORG_ID = f_org.ORG_ID
      JOIN ORGANIZATION t_org ON ct.TO_ORG_ID = t_org.ORG_ID
      ${whereClause}
      ORDER BY cc.CHECK_ID DESC
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
    console.error('[ComplianceCheck getAll Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Get compliance check by ID
 */
async function getComplianceCheckById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `
      SELECT 
        cc.CHECK_ID,
        cc.TRANSFER_ID,
        cc.CHECK_TYPE,
        cc.TEMPERATURE,
        cc.EXPIRY_CHECK,
        cc.LICENSE_VALID,
        cc.RESULT,
        ct.BATCH_ID,
        d.DRUG_NAME
      FROM COMPLIANCE_CHECK cc
      JOIN CUSTODY_TRANSFER ct ON cc.TRANSFER_ID = ct.TRANSFER_ID
      JOIN BATCH b ON ct.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      WHERE cc.CHECK_ID = :id
    `;
    const result = await db.executeQuery(sql, { id });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Compliance check with ID ${id} not found` });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('[ComplianceCheck getById Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Create compliance check with constraint validation
 */
async function createComplianceCheck(req, res) {
  try {
    const { transfer_id, check_type, temperature, expiry_check, license_valid, result } = req.body;

    if (!transfer_id) {
      return res.status(400).json({ success: false, error: 'transfer_id is required' });
    }

    // Check constraint: license_valid IN ('YES', 'NO') or null
    let validLicense = license_valid ? license_valid.trim().toUpperCase() : null;
    if (validLicense && !['YES', 'NO'].includes(validLicense)) {
      return res.status(400).json({ success: false, error: "license_valid must be either 'YES', 'NO', or null" });
    }

    const sql = `
      INSERT INTO COMPLIANCE_CHECK (
        TRANSFER_ID, CHECK_TYPE, TEMPERATURE, EXPIRY_CHECK, LICENSE_VALID, RESULT
      )
      VALUES (
        :transfer_id, :check_type, :temperature, :expiry_check, :license_valid, :result
      )
      RETURNING CHECK_ID INTO :id
    `;
    const binds = {
      transfer_id: parseInt(transfer_id, 10),
      check_type: check_type ? check_type.trim() : null,
      temperature: temperature !== undefined && temperature !== '' ? parseFloat(temperature) : null,
      expiry_check: expiry_check ? expiry_check.trim() : null,
      license_valid: validLicense,
      result: result ? result.trim().toUpperCase() : 'PASS',
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const queryResult = await db.executeQuery(sql, binds, { autoCommit: true });
    const insertedId = queryResult.outBinds.id[0];

    return res.status(201).json({
      success: true,
      message: 'Compliance verification check recorded in database',
      checkId: insertedId
    });
  } catch (err) {
    console.error('[ComplianceCheck create Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Update compliance check
 */
async function updateComplianceCheck(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { transfer_id, check_type, temperature, expiry_check, license_valid, result } = req.body;

    let validLicense = license_valid ? license_valid.trim().toUpperCase() : null;
    if (validLicense && !['YES', 'NO'].includes(validLicense)) {
      return res.status(400).json({ success: false, error: "license_valid must be either 'YES', 'NO', or null" });
    }

    const sql = `
      UPDATE COMPLIANCE_CHECK
      SET TRANSFER_ID = :transfer_id,
          CHECK_TYPE = :check_type,
          TEMPERATURE = :temperature,
          EXPIRY_CHECK = :expiry_check,
          LICENSE_VALID = :license_valid,
          RESULT = :result
      WHERE CHECK_ID = :id
    `;
    const binds = {
      id,
      transfer_id: parseInt(transfer_id, 10),
      check_type: check_type ? check_type.trim() : null,
      temperature: temperature !== undefined && temperature !== '' ? parseFloat(temperature) : null,
      expiry_check: expiry_check ? expiry_check.trim() : null,
      license_valid: validLicense,
      result: result ? result.trim().toUpperCase() : null
    };

    const queryResult = await db.executeQuery(sql, binds, { autoCommit: true });
    if (queryResult.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Compliance check with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Compliance check updated successfully'
    });
  } catch (err) {
    console.error('[ComplianceCheck update Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Delete compliance check
 */
async function deleteComplianceCheck(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `DELETE FROM COMPLIANCE_CHECK WHERE CHECK_ID = :id`;
    const result = await db.executeQuery(sql, { id }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Compliance check with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Compliance check deleted successfully'
    });
  } catch (err) {
    console.error('[ComplianceCheck delete Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

module.exports = {
  getAllComplianceChecks,
  getComplianceCheckById,
  createComplianceCheck,
  updateComplianceCheck,
  deleteComplianceCheck
};
