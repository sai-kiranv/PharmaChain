const express = require('express');
const router = express.Router();
const consumerController = require('../controllers/consumerController');

router.get('/', consumerController.getAllConsumers);
router.get('/:id', consumerController.getConsumerById);
router.post('/', consumerController.createConsumer);
router.put('/:id', consumerController.updateConsumer);
router.delete('/:id', consumerController.deleteConsumer);

module.exports = router;
