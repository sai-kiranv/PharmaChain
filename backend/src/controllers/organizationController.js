const db = require('../config/db');
const oracledb = db.oracledb;

/**
 * List organizations with search, type filter, and pagination
 */
async function getAllOrganizations(req, res) {
  try {
    const { search = '', type = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const binds = {};

    if (search.trim()) {
      whereClause += ` AND (UPPER(NAME) LIKE UPPER(:search) OR UPPER(LICENSE_NO) LIKE UPPER(:search) OR CONTACT LIKE :search)`;
      binds.search = `%${search.trim()}%`;
    }

    if (type.trim()) {
      whereClause += ` AND UPPER(ORG_TYPE) = UPPER(:type)`;
      binds.type = type.trim();
    }

    // Total count
    const countSql = `SELECT COUNT(*) AS TOTAL FROM ORGANIZATION ${whereClause}`;
    const countResult = await db.executeQuery(countSql, binds);
    const total = countResult.rows[0].TOTAL;

    // Paginated list
    const sql = `
      SELECT ORG_ID, NAME, ORG_TYPE, LICENSE_NO, CONTACT
      FROM ORGANIZATION
      ${whereClause}
      ORDER BY ORG_ID ASC
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
    console.error('[Organization getAll Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Get organization by ID with associated warehouses and drugs
 */
async function getOrganizationById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `SELECT ORG_ID, NAME, ORG_TYPE, LICENSE_NO, CONTACT FROM ORGANIZATION WHERE ORG_ID = :id`;
    const result = await db.executeQuery(sql, { id });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Organization with ID ${id} not found` });
    }

    // Fetch storage locations
    const locSql = `
      SELECT LOCATION_ID, LOCATION_NAME, ADDRESS, CITY, STATE, CAPACITY 
      FROM STORAGE_LOCATION 
      WHERE ORG_ID = :id 
      ORDER BY LOCATION_ID ASC
    `;
    const locResult = await db.executeQuery(locSql, { id });

    // Fetch manufactured drugs
    const drugSql = `
      SELECT DRUG_ID, DRUG_NAME, GENERIC_NAME, STORAGE_REQUIREMENT 
      FROM DRUGS 
      WHERE CREATED_BY_ORG_ID = :id 
      ORDER BY DRUG_ID ASC
    `;
    const drugResult = await db.executeQuery(drugSql, { id });

    return res.json({
      success: true,
      data: {
        ...result.rows[0],
        locations: locResult.rows,
        drugs: drugResult.rows
      }
    });
  } catch (err) {
    console.error('[Organization getById Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Create a new organization
 */
async function createOrganization(req, res) {
  try {
    const { name, org_type, license_no, contact } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Organization name is required' });
    }
    if (!org_type || !org_type.trim()) {
      return res.status(400).json({ success: false, error: 'Organization type is required' });
    }

    const sql = `
      INSERT INTO ORGANIZATION (NAME, ORG_TYPE, LICENSE_NO, CONTACT)
      VALUES (:name, :org_type, :license_no, :contact)
      RETURNING ORG_ID INTO :id
    `;
    const binds = {
      name: name.trim(),
      org_type: org_type.trim(),
      license_no: license_no ? license_no.trim() : null,
      contact: contact ? contact.trim() : null,
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const result = await db.executeQuery(sql, binds, { autoCommit: true });
    const insertedId = result.outBinds.id[0];

    return res.status(201).json({
      success: true,
      message: 'Organization registered successfully',
      orgId: insertedId
    });
  } catch (err) {
    console.error('[Organization create Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Update organization
 */
async function updateOrganization(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, org_type, license_no, contact } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Organization name is required' });
    }
    if (!org_type || !org_type.trim()) {
      return res.status(400).json({ success: false, error: 'Organization type is required' });
    }

    const sql = `
      UPDATE ORGANIZATION
      SET NAME = :name, ORG_TYPE = :org_type, LICENSE_NO = :license_no, CONTACT = :contact
      WHERE ORG_ID = :id
    `;
    const binds = {
      id,
      name: name.trim(),
      org_type: org_type.trim(),
      license_no: license_no ? license_no.trim() : null,
      contact: contact ? contact.trim() : null
    };

    const result = await db.executeQuery(sql, binds, { autoCommit: true });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Organization with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Organization updated successfully'
    });
  } catch (err) {
    console.error('[Organization update Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Delete organization
 */
async function deleteOrganization(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `DELETE FROM ORGANIZATION WHERE ORG_ID = :id`;
    const result = await db.executeQuery(sql, { id }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Organization with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (err) {
    console.error('[Organization delete Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

module.exports = {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization
};
