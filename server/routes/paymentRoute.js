const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')

// Get fee details for a student
router.get('/students/:id/fee-details', paymentController.getStudentFeeDetails)

// Process payment
router.post('/students/:id/payments', paymentController.processPayment)

// Generate receipt PDF
router.get('/students/:id/receipt', paymentController.generateReceiptPDF)

// Get receipt data
router.get('/students/:id/receipt-data', paymentController.getReceiptData)

// Get payment details
router.get('/students/:id/payments/:paymentId', paymentController.getPaymentDetails)

// Validate payment
router.post('/students/:id/validate-payment', paymentController.validatePayment)

// Get payment summary
router.get('/students/:id/payment-summary', paymentController.getPaymentSummary)

module.exports = router