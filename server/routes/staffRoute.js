const express = require('express')
const router = express.Router()
const staffController = require('../controllers/staffController')

// Staff CRUD routes
router.get('/', staffController.getAllStaff)
router.get('/search', staffController.searchStaff)
router.get('/statistics', staffController.getStaffStatistics)
router.get('/:id', staffController.getStaffById)
router.post('/', staffController.createStaff)
router.put('/:id', staffController.updateStaff)
router.delete('/:id', staffController.deleteStaff)

// Bulk import routes
router.get('/download-template', staffController.downloadStaffTemplate)
router.post('/bulk-import', staffController.bulkImportStaff)
router.post('/test-import', staffController.testImport) // For debugging

module.exports = router