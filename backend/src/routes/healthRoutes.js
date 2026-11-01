const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// GET /api/health - Requirement 7: SELECT 1 AS DB_CONNECTED FROM dual
router.get('/health', healthController.getHealth);

// GET /api/schema/tables - Requirement 6: Query user_tables
router.get('/schema/tables', healthController.getSchemaTables);

// GET /api/schema/table/:table - Requirement 6: Query user_tab_columns and constraints
router.get('/schema/table/:table', healthController.getTableColumns);

module.exports = router;
