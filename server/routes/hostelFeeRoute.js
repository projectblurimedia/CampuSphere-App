const express = require('express')
const router = express.Router()
const hostelFeeController = require('../controllers/hostelFeeController')

// 1. Create or update hostel fee structure
router.post('/', hostelFeeController.createOrUpdateHostelFee)

// 2. Get hostel fee structure by academic year and class
router.get('/:academicYear/:className', hostelFeeController.getHostelFeeStructure)

// 3. Get all hostel fee structures
router.get('/', hostelFeeController.getAllHostelFeeStructures)

// 4. Update hostel fee structure by ID
router.put('/:id', hostelFeeController.updateHostelFeeStructure)

// 5. Delete hostel fee structure
router.delete('/:id', hostelFeeController.deleteHostelFeeStructure)

// 6. Toggle active status
router.put('/toggle-active/:id', hostelFeeController.toggleActiveStatus)

// 7. Get hostel fee summary
router.get('/summary', hostelFeeController.getHostelFeeSummary)

// 8. Bulk upload from Excel
router.post('/bulk-upload', hostelFeeController.bulkUploadHostelFees)

// 9. Download template
router.get('/download-template', hostelFeeController.downloadHostelFeesTemplate)

module.exports = router