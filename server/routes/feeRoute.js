const express = require('express')
const router = express.Router()
const feeController = require('../controllers/feeController')

// Student search for fee management
router.get('/students/search', feeController.searchStudentsForFee)

// Get detailed fee information for a specific student
router.get('/students/:id/fee-details', feeController.getStudentFeeDetails)

// Get payment history for a specific student
router.get('/students/:id/payment-history', feeController.getStudentPaymentHistory)

// Get total fee statistics (overall, class-wise, section-wise, monthly)
router.get('/statistics/total', feeController.getTotalFeeStatistics)

// Get class-wise fee payments (term-wise, academic year)
router.get('/class-wise-payments', feeController.getClassWiseFeePayments)

// Get fee collection report (daily, weekly, monthly, yearly)
router.get('/collection-report', feeController.getFeeCollectionReport)

// Get fee defaulters list
router.get('/defaulters', feeController.getFeeDefaulters)

module.exports = router