const express = require('express')
const router = express.Router()
const classFeeController = require('../controllers/classFeeController')
const multer = require('multer')

// Configure multer for file upload
const storage = multer.memoryStorage()
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true)
    } else {
      cb(new Error('Only Excel files are allowed'))
    }
  }
})

// ================= CLASS FEE STRUCTURE ROUTES =================

// Create or update class fee structure
router.post('/', classFeeController.createOrUpdateClassFee)

// Get class fee structure by class and academic year
router.get('/:className/:academicYear', classFeeController.getClassFeeStructure)

// Get all class fee structures
router.get('/', classFeeController.getAllClassFeeStructures)

// Update class fee structure by ID
router.put('/:id', classFeeController.updateClassFeeStructure)

// Delete class fee structure
router.delete('/:id', classFeeController.deleteClassFeeStructure)

// Toggle active status
router.post('/:id/toggle-active', classFeeController.toggleActiveStatus)

// Get class fee summary
router.get('/summary/all', classFeeController.getClassFeeSummary)

// Bulk upload class fees from Excel
router.post('/bulk-upload', upload.single('file'), classFeeController.bulkUploadClassFees)

// Download class fees template
router.get('/download-template', classFeeController.downloadClassFeesTemplate)

module.exports = router