const express = require('express');
const router = express.Router();
const storageLocationController = require('../controllers/storageLocationController');

router.get('/', storageLocationController.getAllStorageLocations);
router.get('/:id', storageLocationController.getStorageLocationById);
router.post('/', storageLocationController.createStorageLocation);
router.put('/:id', storageLocationController.updateStorageLocation);
router.delete('/:id', storageLocationController.deleteStorageLocation);

module.exports = router;
