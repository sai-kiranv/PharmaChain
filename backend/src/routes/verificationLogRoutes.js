const express = require('express');
const router = express.Router();
const verificationLogController = require('../controllers/verificationLogController');

router.get('/', verificationLogController.getAllVerificationLogs);
router.get('/:id', verificationLogController.getVerificationLogById);
router.post('/', verificationLogController.createVerificationLog);
router.put('/:id', verificationLogController.updateVerificationLog);
router.delete('/:id', verificationLogController.deleteVerificationLog);

module.exports = router;
