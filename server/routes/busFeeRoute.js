const express = require('express')
const router = express.Router()
const busFeeController = require('../controllers/busFeeController')
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

// ================= BUS FEE STRUCTURE ROUTES =================

// Create or update bus fee structure
router.post('/', busFeeController.createOrUpdateBusFee)

// Get bus fee structure by village and academic year
router.get('/:villageName/:academicYear', busFeeController.getBusFeeStructure)

// Get all bus fee structures
router.get('/', busFeeController.getAllBusFeeStructures)

// Update bus fee structure by ID
router.put('/:id', busFeeController.updateBusFeeStructure)

// Delete bus fee structure
router.delete('/:id', busFeeController.deleteBusFeeStructure)

// Toggle active status
router.post('/:id/toggle-active', busFeeController.toggleActiveStatus)

// Get bus fee summary by village
router.get('/summary/village', busFeeController.getBusFeeSummaryByVillage)

// Search bus fees
router.get('/search', busFeeController.searchBusFees)

// Bulk upload bus fees from Excel
router.post('/bulk-upload', upload.single('file'), busFeeController.bulkUploadBusFees)

// Download bus fees template
router.get('/download-template', busFeeController.downloadBusFeesTemplate)

module.exports = router