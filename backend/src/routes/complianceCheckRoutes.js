const express = require('express');
const router = express.Router();
const complianceCheckController = require('../controllers/complianceCheckController');

router.get('/', complianceCheckController.getAllComplianceChecks);
router.get('/:id', complianceCheckController.getComplianceCheckById);
router.post('/', complianceCheckController.createComplianceCheck);
router.put('/:id', complianceCheckController.updateComplianceCheck);
router.delete('/:id', complianceCheckController.deleteComplianceCheck);

module.exports = router;
