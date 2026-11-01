const express = require('express');
const router = express.Router();
const batchStorageController = require('../controllers/batchStorageController');

router.get('/', batchStorageController.getAllBatchStorage);
router.get('/:batchId/:locationId', batchStorageController.getBatchStorageById);
router.post('/', batchStorageController.createBatchStorage);
router.put('/:batchId/:locationId', batchStorageController.updateBatchStorage);
router.delete('/:batchId/:locationId', batchStorageController.deleteBatchStorage);

module.exports = router;
