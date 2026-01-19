const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');

// Fee Records Routes
router.post('/', feeController.createFeeRecord);
router.get('/', feeController.getAllFees);
router.get('/:feeId', feeController.getFeeById);
router.put('/:feeId', feeController.updateFeeRecord);
router.delete('/:feeId', feeController.deleteFeeRecord);
router.post('/cancel/:feeId', feeController.cancelFeeRecord);

// Student Fee Routes
router.get('/student/:studentId', feeController.getStudentFees);
router.get('/student/:studentId/summary', feeController.getStudentFeeSummary);
router.post('/generate-term-fees/:studentId', feeController.generateTermFees);

// Payment Routes
router.post('/payment/:feeId', feeController.makePayment);
router.get('/receipt/:feeId', feeController.getFeeReceipt);

// Class Fee Routes
router.get('/outstanding/class/:className/:section', feeController.getClassOutstandingFees);

// Fee Configuration Routes
router.put('/config/student/:studentId', feeController.updateStudentFeeConfig);
router.post('/config/bulk-discount', feeController.applyBulkDiscount);

// Report Routes
router.get('/reports/collection', feeController.getFeeCollectionReport);
router.get('/search/student', feeController.searchFeesByStudent);

module.exports = router;