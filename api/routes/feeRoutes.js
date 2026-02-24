import express from 'express'
import {
  // Student fee operations
  getStudentFeeDetails,
  getStudentPaymentHistory,
  processPayment,
  generateReceipt,
  getPaymentReceipt,
  
  // Statistics and reports
  getFeeStatistics,
  getClassWisePayments,
  getFeeCollectionReport,
  getFeeDefaulters,
  
  // Search
  searchStudentsForFee,

  getAllPaymentHistory,
  getClassWiseFeePending,
  promoteStudent,
  demoteStudent,
  inactivateStudent,
  getStudentProgressionHistory,
} from '../controllers/feeController.js'

const router = express.Router()

// ========== STUDENT FEE OPERATIONS ==========
router.post('/promote/:studentId', promoteStudent)
router.post('/demote/:studentId', demoteStudent)
router.post('/inactivate/:studentId', inactivateStudent)
router.get('/progression-history/:studentId', getStudentProgressionHistory)

router.get('/students/search', searchStudentsForFee)
router.get('/students/:studentId/fee-details', getStudentFeeDetails)
router.get('/students/:studentId/payment-history', getStudentPaymentHistory)
router.post('/students/:studentId/process-payment', processPayment)
router.get('/students/:studentId/receipt/:paymentId', generateReceipt)
router.get('/receipt/:paymentId', getPaymentReceipt)

// ========== STATISTICS AND REPORTS ==========
router.get('/statistics', getFeeStatistics)
router.get('/class-wise-payments', getClassWisePayments)
router.get('/collection-report', getFeeCollectionReport)
router.get('/defaulters', getFeeDefaulters)

// ========== PAYMENT HISTORY (NEW) ==========
router.get('/payment-history', getAllPaymentHistory)
router.get('/class-wise-pending', getClassWiseFeePending)

export default router