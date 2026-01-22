const express = require('express')
const router = express.Router()
const feeController = require('../controllers/feeController')

// ================= FEE RECORDS ROUTES =================

// Create a new fee record
router.post('/', feeController.createFeeRecord)

// Generate all term fees for a student
router.post('/generate-all/:studentId', feeController.generateAllTermFees)

// Get all fees
router.get('/', feeController.getAllFees)

// Get fee by ID
router.get('/:feeId', feeController.getFeeById)

// Update fee record
router.put('/:feeId', feeController.updateFeeRecord)

// Cancel fee record
router.post('/:feeId/cancel', feeController.cancelFeeRecord)

// ================= PAYMENT ROUTES =================

// Make payment for fee
router.post('/:feeId/payment', feeController.makePayment)

// Get fee receipt
router.get('/:feeId/receipt', feeController.getFeeReceipt)

// ================= DISCOUNT ROUTES =================

// Apply discount to fee
router.post('/:feeId/discount', feeController.applyDiscount)

// Add late fee to fee
router.post('/:feeId/late-fee', feeController.addLateFee)

// Apply bulk discount to multiple students
router.post('/discount/bulk', feeController.applyBulkDiscount)

// ================= STUDENT FEE ROUTES =================

// Get student fee summary
router.get('/student/:studentId/summary', feeController.getStudentFeeSummary)

// ================= CLASS FEE ROUTES =================

// Get class outstanding fees
router.get('/class/:className/:section/outstanding', feeController.getClassOutstandingFees)

// ================= SEARCH & REPORTS ROUTES =================

// Search fees with filters
router.get('/search', feeController.searchFees)

// Get fee collection report
router.get('/reports/collection', feeController.getFeeCollectionReport)

// Get bus fee report
router.get('/reports/bus-fees', feeController.getBusFeeReport)

module.exports = router