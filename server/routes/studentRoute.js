const express = require('express')
const router = express.Router()
const studentController = require('../controllers/studentController')

// POST /api/students - Create new student
router.post('/', studentController.createStudent)

// GET /api/students - Get all students
router.get('/', studentController.getAllStudents)

// GET /api/students/:id - Get student by ID
router.get('/:id', studentController.getStudentById)

// PUT /api/students/:id - Update student
router.put('/:id', studentController.updateStudent)

// DELETE /api/students/:id - Delete student
router.delete('/:id', studentController.deleteStudent)

// POST /api/students/:id/promote - Promote student
router.post('/:id/promote', studentController.promoteStudent)

// POST /api/students/batch-promote - Batch promote students
router.post('/batch-promote', studentController.batchPromoteStudents)

// GET /api/students/search - Search students
router.get('/search', studentController.searchStudents)

// GET /api/students/statistics - Get student statistics
router.get('/statistics', studentController.getStudentStatistics)

module.exports = router