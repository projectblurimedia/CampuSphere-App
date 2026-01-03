const express = require('express')
const router = express.Router()
const studentController = require('../controllers/studentController')
const bulkImportController = require('../controllers/bulkImportController')

router.get('/search', studentController.searchStudents)
router.get('/statistics', studentController.getStudentStatistics)
router.get('/classes-summary', studentController.getClassesSummary)
router.get('/class-details', studentController.getClassDetails)
router.get('/class-section-students', studentController.getStudentsByClassAndSection)
router.get('/download-template', bulkImportController.downloadExcelTemplate)

router.get('/:id', studentController.getStudentById)

router.post('', studentController.createStudent)
router.put('/:id', studentController.updateStudent)
router.delete('/:id', studentController.deleteStudent)

router.put('/:id/promote', studentController.promoteStudent)
router.post('/batch-promote', studentController.batchPromoteStudents)

router.post('/bulk-import', bulkImportController.bulkImportStudents)
router.post('/test-import', bulkImportController.testImport)

module.exports = router