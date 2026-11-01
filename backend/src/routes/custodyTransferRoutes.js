const express = require('express');
const router = express.Router();
const custodyTransferController = require('../controllers/custodyTransferController');

router.get('/', custodyTransferController.getAllCustodyTransfers);
router.get('/:id', custodyTransferController.getCustodyTransferById);
router.post('/', custodyTransferController.createCustodyTransfer);
router.put('/:id', custodyTransferController.updateCustodyTransfer);
router.delete('/:id', custodyTransferController.deleteCustodyTransfer);

module.exports = router;
