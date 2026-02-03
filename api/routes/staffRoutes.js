import express from 'express'
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  searchStaff,
  getStaffStatistics,
  downloadStaffTemplate,
  bulkImportStaff,
  testImport
} from '../controllers/staffController.js'

const router = express.Router()

// Staff CRUD routes
router.get('/', getAllStaff)
router.get('/search', searchStaff)
router.get('/statistics', getStaffStatistics)
router.get('/:id', getStaffById)
router.post('/', createStaff)
router.put('/:id', updateStaff)
router.delete('/:id', deleteStaff)

// Bulk import routes
router.get('/download-template', downloadStaffTemplate)
router.post('/bulk-import', bulkImportStaff)
router.post('/test-import', testImport) 

export default router