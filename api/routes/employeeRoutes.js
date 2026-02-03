import express from 'express'
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  searchEmployees,
  getEmployeeStatistics,
  downloadEmployeeTemplate,
  bulkImportEmployees,
  testImport
} from '../controllers/employeeController.js'

const router = express.Router()

// Employee CRUD routes
router.get('/', getAllEmployees)
router.get('/search', searchEmployees)
router.get('/statistics', getEmployeeStatistics)
router.get('/:id', getEmployeeById)
router.post('/', createEmployee)
router.put('/:id', updateEmployee)
router.delete('/:id', deleteEmployee)

// Bulk import routes
router.get('/download-template', downloadEmployeeTemplate)
router.post('/bulk-import', bulkImportEmployees)
router.post('/test-import', testImport) 

export default router