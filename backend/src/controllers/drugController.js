const db = require('../config/db');
const oracledb = db.oracledb;

/**
 * List drugs joined with Manufacturer details, with search and pagination
 */
async function getAllDrugs(req, res) {
  try {
    const { search = '', orgId = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const binds = {};

    if (search.trim()) {
      whereClause += ` AND (UPPER(d.DRUG_NAME) LIKE UPPER(:search) OR UPPER(d.GENERIC_NAME) LIKE UPPER(:search) OR UPPER(d.STORAGE_REQUIREMENT) LIKE UPPER(:search))`;
      binds.search = `%${search.trim()}%`;
    }

    if (orgId) {
      whereClause += ` AND d.CREATED_BY_ORG_ID = :orgId`;
      binds.orgId = parseInt(orgId, 10);
    }

    const countSql = `
      SELECT COUNT(*) AS TOTAL 
      FROM DRUGS d 
      ${whereClause}
    `;
    const countResult = await db.executeQuery(countSql, binds);
    const total = countResult.rows[0].TOTAL;

    const sql = `
      SELECT 
        d.DRUG_ID, 
        d.DRUG_NAME, 
        d.GENERIC_NAME, 
        d.STORAGE_REQUIREMENT, 
        d.CREATED_BY_ORG_ID,
        o.NAME AS MANUFACTURER_NAME,
        o.ORG_TYPE AS MANUFACTURER_TYPE
      FROM DRUGS d
      LEFT JOIN ORGANIZATION o ON d.CREATED_BY_ORG_ID = o.ORG_ID
      ${whereClause}
      ORDER BY d.DRUG_ID ASC
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
    console.error('[Drugs getAll Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Get drug by ID with batch history
 */
async function getDrugById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `
      SELECT 
        d.DRUG_ID, 
        d.DRUG_NAME, 
        d.GENERIC_NAME, 
        d.STORAGE_REQUIREMENT, 
        d.CREATED_BY_ORG_ID,
        o.NAME AS MANUFACTURER_NAME
      FROM DRUGS d
      LEFT JOIN ORGANIZATION o ON d.CREATED_BY_ORG_ID = o.ORG_ID
      WHERE d.DRUG_ID = :id
    `;
    const result = await db.executeQuery(sql, { id });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Drug with ID ${id} not found` });
    }

    // Associated batches
    const batchSql = `
      SELECT 
        BATCH_ID, 
        TO_CHAR(MFG_DATE, 'YYYY-MM-DD') AS MFG_DATE, 
        TO_CHAR(EXP_DATE, 'YYYY-MM-DD') AS EXP_DATE, 
        QUANTITY,
        CASE WHEN EXP_DATE <= SYSDATE THEN 'EXPIRED' ELSE 'ACTIVE' END AS STATUS
      FROM BATCH
      WHERE DRUG_ID = :id
      ORDER BY BATCH_ID DESC
    `;
    const batchResult = await db.executeQuery(batchSql, { id });

    return res.json({
      success: true,
      data: {
        ...result.rows[0],
        batches: batchResult.rows
      }
    });
  } catch (err) {
    console.error('[Drug getById Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Create drug
 */
async function createDrug(req, res) {
  try {
    const { drug_name, generic_name, storage_requirement, created_by_org_id } = req.body;
    if (!drug_name || !drug_name.trim()) {
      return res.status(400).json({ success: false, error: 'Drug name is required' });
    }

    const sql = `
      INSERT INTO DRUGS (DRUG_NAME, GENERIC_NAME, STORAGE_REQUIREMENT, CREATED_BY_ORG_ID)
      VALUES (:drug_name, :generic_name, :storage_requirement, :created_by_org_id)
      RETURNING DRUG_ID INTO :id
    `;
    const binds = {
      drug_name: drug_name.trim(),
      generic_name: generic_name ? generic_name.trim() : null,
      storage_requirement: storage_requirement ? storage_requirement.trim() : null,
      created_by_org_id: created_by_org_id ? parseInt(created_by_org_id, 10) : null,
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const result = await db.executeQuery(sql, binds, { autoCommit: true });
    const insertedId = result.outBinds.id[0];

    return res.status(201).json({
      success: true,
      message: 'Drug registered successfully',
      drugId: insertedId
    });
  } catch (err) {
    console.error('[Drug create Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Update drug
 */
async function updateDrug(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { drug_name, generic_name, storage_requirement, created_by_org_id } = req.body;

    if (!drug_name || !drug_name.trim()) {
      return res.status(400).json({ success: false, error: 'Drug name is required' });
    }

    const sql = `
      UPDATE DRUGS
      SET DRUG_NAME = :drug_name,
          GENERIC_NAME = :generic_name,
          STORAGE_REQUIREMENT = :storage_requirement,
          CREATED_BY_ORG_ID = :created_by_org_id
      WHERE DRUG_ID = :id
    `;
    const binds = {
      id,
      drug_name: drug_name.trim(),
      generic_name: generic_name ? generic_name.trim() : null,
      storage_requirement: storage_requirement ? storage_requirement.trim() : null,
      created_by_org_id: created_by_org_id ? parseInt(created_by_org_id, 10) : null
    };

    const result = await db.executeQuery(sql, binds, { autoCommit: true });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Drug with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Drug updated successfully'
    });
  } catch (err) {
    console.error('[Drug update Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Delete drug
 */
async function deleteDrug(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `DELETE FROM DRUGS WHERE DRUG_ID = :id`;
    const result = await db.executeQuery(sql, { id }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Drug with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Drug deleted successfully'
    });
  } catch (err) {
    console.error('[Drug delete Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

module.exports = {
  getAllDrugs,
  getDrugById,
  createDrug,
  updateDrug,
  deleteDrug
};
