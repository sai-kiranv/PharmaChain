const db = require('../config/db');
const oracledb = db.oracledb;

/**
 * List storage locations with organization name, search, city filter, and pagination
 */
async function getAllStorageLocations(req, res) {
  try {
    const { search = '', city = '', orgId = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const binds = {};

    if (search.trim()) {
      whereClause += ` AND (UPPER(sl.LOCATION_NAME) LIKE UPPER(:search) OR UPPER(sl.CITY) LIKE UPPER(:search) OR UPPER(sl.STATE) LIKE UPPER(:search) OR UPPER(o.NAME) LIKE UPPER(:search))`;
      binds.search = `%${search.trim()}%`;
    }

    if (city.trim()) {
      whereClause += ` AND UPPER(sl.CITY) = UPPER(:city)`;
      binds.city = city.trim();
    }

    if (orgId) {
      whereClause += ` AND sl.ORG_ID = :orgId`;
      binds.orgId = parseInt(orgId, 10);
    }

    const countSql = `
      SELECT COUNT(*) AS TOTAL
      FROM STORAGE_LOCATION sl
      JOIN ORGANIZATION o ON sl.ORG_ID = o.ORG_ID
      ${whereClause}
    `;
    const countResult = await db.executeQuery(countSql, binds);
    const total = countResult.rows[0].TOTAL;

    const sql = `
      SELECT 
        sl.LOCATION_ID,
        sl.ORG_ID,
        o.NAME AS ORGANIZATION_NAME,
        sl.LOCATION_NAME,
        sl.ADDRESS,
        sl.CITY,
        sl.STATE,
        sl.CAPACITY,
        NVL((SELECT SUM(bs.STORED_QUANTITY) FROM BATCH_STORAGE bs WHERE bs.LOCATION_ID = sl.LOCATION_ID), 0) AS UTILIZED_CAPACITY
      FROM STORAGE_LOCATION sl
      JOIN ORGANIZATION o ON sl.ORG_ID = o.ORG_ID
      ${whereClause}
      ORDER BY sl.LOCATION_ID ASC
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
    console.error('[StorageLocations getAll Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Get storage location by ID with current stored inventory
 */
async function getStorageLocationById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `
      SELECT 
        sl.LOCATION_ID,
        sl.ORG_ID,
        o.NAME AS ORGANIZATION_NAME,
        sl.LOCATION_NAME,
        sl.ADDRESS,
        sl.CITY,
        sl.STATE,
        sl.CAPACITY
      FROM STORAGE_LOCATION sl
      JOIN ORGANIZATION o ON sl.ORG_ID = o.ORG_ID
      WHERE sl.LOCATION_ID = :id
    `;
    const result = await db.executeQuery(sql, { id });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Storage Location with ID ${id} not found` });
    }

    // Stored batches in this warehouse
    const itemsSql = `
      SELECT 
        bs.BATCH_ID,
        d.DRUG_NAME,
        bs.STORED_QUANTITY,
        TO_CHAR(b.EXP_DATE, 'YYYY-MM-DD') AS EXP_DATE
      FROM BATCH_STORAGE bs
      JOIN BATCH b ON bs.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      WHERE bs.LOCATION_ID = :id
    `;
    const itemsResult = await db.executeQuery(itemsSql, { id });

    return res.json({
      success: true,
      data: {
        ...result.rows[0],
        inventory: itemsResult.rows
      }
    });
  } catch (err) {
    console.error('[StorageLocation getById Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Create storage location
 */
async function createStorageLocation(req, res) {
  try {
    const { org_id, location_name, address, city, state, capacity } = req.body;

    if (!org_id || !location_name || !location_name.trim()) {
      return res.status(400).json({ success: false, error: 'Organization ID and Location Name are required' });
    }

    const sql = `
      INSERT INTO STORAGE_LOCATION (ORG_ID, LOCATION_NAME, ADDRESS, CITY, STATE, CAPACITY)
      VALUES (:org_id, :location_name, :address, :city, :state, :capacity)
      RETURNING LOCATION_ID INTO :id
    `;
    const binds = {
      org_id: parseInt(org_id, 10),
      location_name: location_name.trim(),
      address: address ? address.trim() : null,
      city: city ? city.trim() : null,
      state: state ? state.trim() : null,
      capacity: capacity !== undefined && capacity !== '' ? parseInt(capacity, 10) : null,
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const result = await db.executeQuery(sql, binds, { autoCommit: true });
    const insertedId = result.outBinds.id[0];

    return res.status(201).json({
      success: true,
      message: 'Storage Location created successfully',
      locationId: insertedId
    });
  } catch (err) {
    console.error('[StorageLocation create Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Update storage location
 */
async function updateStorageLocation(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { org_id, location_name, address, city, state, capacity } = req.body;

    if (!org_id || !location_name || !location_name.trim()) {
      return res.status(400).json({ success: false, error: 'Organization ID and Location Name are required' });
    }

    const sql = `
      UPDATE STORAGE_LOCATION
      SET ORG_ID = :org_id,
          LOCATION_NAME = :location_name,
          ADDRESS = :address,
          CITY = :city,
          STATE = :state,
          CAPACITY = :capacity
      WHERE LOCATION_ID = :id
    `;
    const binds = {
      id,
      org_id: parseInt(org_id, 10),
      location_name: location_name.trim(),
      address: address ? address.trim() : null,
      city: city ? city.trim() : null,
      state: state ? state.trim() : null,
      capacity: capacity !== undefined && capacity !== '' ? parseInt(capacity, 10) : null
    };

    const result = await db.executeQuery(sql, binds, { autoCommit: true });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Storage Location with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Storage Location updated successfully'
    });
  } catch (err) {
    console.error('[StorageLocation update Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Delete storage location
 */
async function deleteStorageLocation(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const sql = `DELETE FROM STORAGE_LOCATION WHERE LOCATION_ID = :id`;
    const result = await db.executeQuery(sql, { id }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: `Storage Location with ID ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Storage Location deleted successfully'
    });
  } catch (err) {
    console.error('[StorageLocation delete Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

module.exports = {
  getAllStorageLocations,
  getStorageLocationById,
  createStorageLocation,
  updateStorageLocation,
  deleteStorageLocation
};
