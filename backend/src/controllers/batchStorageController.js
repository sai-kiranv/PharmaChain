const db = require('../config/db');

/**
 * List batch storage inventory with joins to Batch, Drug, and Warehouse Location
 */
async function getAllBatchStorage(req, res) {
  try {
    const { batchId = '', locationId = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const binds = {};

    if (batchId) {
      whereClause += ` AND bs.BATCH_ID = :batchId`;
      binds.batchId = parseInt(batchId, 10);
    }

    if (locationId) {
      whereClause += ` AND bs.LOCATION_ID = :locationId`;
      binds.locationId = parseInt(locationId, 10);
    }

    const countSql = `
      SELECT COUNT(*) AS TOTAL
      FROM BATCH_STORAGE bs
      ${whereClause}
    `;
    const countResult = await db.executeQuery(countSql, binds);
    const total = countResult.rows[0].TOTAL;

    const sql = `
      SELECT 
        bs.BATCH_ID,
        bs.LOCATION_ID,
        bs.STORED_QUANTITY,
        d.DRUG_NAME,
        d.STORAGE_REQUIREMENT,
        sl.LOCATION_NAME,
        sl.CITY,
        sl.STATE,
        sl.CAPACITY AS LOCATION_CAPACITY,
        o.NAME AS LOCATION_OWNER
      FROM BATCH_STORAGE bs
      JOIN BATCH b ON bs.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN STORAGE_LOCATION sl ON bs.LOCATION_ID = sl.LOCATION_ID
      JOIN ORGANIZATION o ON sl.ORG_ID = o.ORG_ID
      ${whereClause}
      ORDER BY bs.BATCH_ID ASC, bs.LOCATION_ID ASC
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
    console.error('[BatchStorage getAll Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Get single batch storage entry by composite primary key
 */
async function getBatchStorageById(req, res) {
  try {
    const batchId = parseInt(req.params.batchId, 10);
    const locationId = parseInt(req.params.locationId, 10);

    const sql = `
      SELECT 
        bs.BATCH_ID,
        bs.LOCATION_ID,
        bs.STORED_QUANTITY,
        d.DRUG_NAME,
        sl.LOCATION_NAME
      FROM BATCH_STORAGE bs
      JOIN BATCH b ON bs.BATCH_ID = b.BATCH_ID
      JOIN DRUGS d ON b.DRUG_ID = d.DRUG_ID
      JOIN STORAGE_LOCATION sl ON bs.LOCATION_ID = sl.LOCATION_ID
      WHERE bs.BATCH_ID = :batchId AND bs.LOCATION_ID = :locationId
    `;
    const result = await db.executeQuery(sql, { batchId, locationId });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Batch storage allocation not found' });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('[BatchStorage getById Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Create batch storage entry
 */
async function createBatchStorage(req, res) {
  try {
    const { batch_id, location_id, stored_quantity } = req.body;

    if (!batch_id || !location_id || stored_quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'batch_id, location_id, and stored_quantity are required'
      });
    }

    if (Number(stored_quantity) < 0) {
      return res.status(400).json({ success: false, error: 'Stored quantity cannot be negative' });
    }

    const sql = `
      INSERT INTO BATCH_STORAGE (BATCH_ID, LOCATION_ID, STORED_QUANTITY)
      VALUES (:batch_id, :location_id, :stored_quantity)
    `;
    const binds = {
      batch_id: parseInt(batch_id, 10),
      location_id: parseInt(location_id, 10),
      stored_quantity: parseInt(stored_quantity, 10)
    };

    await db.executeQuery(sql, binds, { autoCommit: true });

    return res.status(201).json({
      success: true,
      message: 'Batch inventory assigned to warehouse successfully',
      allocation: { batch_id: binds.batch_id, location_id: binds.location_id, stored_quantity: binds.stored_quantity }
    });
  } catch (err) {
    console.error('[BatchStorage create Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Update stored quantity for composite primary key
 */
async function updateBatchStorage(req, res) {
  try {
    const batchId = parseInt(req.params.batchId, 10);
    const locationId = parseInt(req.params.locationId, 10);
    const { stored_quantity } = req.body;

    if (stored_quantity === undefined || Number(stored_quantity) < 0) {
      return res.status(400).json({ success: false, error: 'Valid stored_quantity is required' });
    }

    const sql = `
      UPDATE BATCH_STORAGE
      SET STORED_QUANTITY = :stored_quantity
      WHERE BATCH_ID = :batchId AND LOCATION_ID = :locationId
    `;
    const binds = {
      batchId,
      locationId,
      stored_quantity: parseInt(stored_quantity, 10)
    };

    const result = await db.executeQuery(sql, binds, { autoCommit: true });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: 'Batch storage allocation not found' });
    }

    return res.json({
      success: true,
      message: 'Stored quantity updated successfully'
    });
  } catch (err) {
    console.error('[BatchStorage update Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

/**
 * Delete batch storage allocation by composite primary key
 */
async function deleteBatchStorage(req, res) {
  try {
    const batchId = parseInt(req.params.batchId, 10);
    const locationId = parseInt(req.params.locationId, 10);

    const sql = `
      DELETE FROM BATCH_STORAGE
      WHERE BATCH_ID = :batchId AND LOCATION_ID = :locationId
    `;
    const result = await db.executeQuery(sql, { batchId, locationId }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: 'Batch storage allocation not found' });
    }

    return res.json({
      success: true,
      message: 'Batch storage allocation removed successfully'
    });
  } catch (err) {
    console.error('[BatchStorage delete Error]:', err);
    return res.status(500).json({ success: false, error: err.friendlyMessage || err.message });
  }
}

module.exports = {
  getAllBatchStorage,
  getBatchStorageById,
  createBatchStorage,
  updateBatchStorage,
  deleteBatchStorage
};
