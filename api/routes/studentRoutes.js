import express from 'express'
import {
  createStudent,
  updateStudent,
  getAllStudents,
  getStudentById,
  deleteStudent,
  searchStudents,
  getStudentStatistics,
  getClassesSummary,
  getClassDetails,
  getStudentsByClassAndSection
} from '../controllers/studentController.js'

const router = express.Router()

router.get('/search', searchStudents)
router.get('/statistics', getStudentStatistics)
router.get('/classes-summary', getClassesSummary)
router.get('/class-details', getClassDetails)
router.get('/class-section-students', getStudentsByClassAndSection)

router.get('', getAllStudents)
router.get('/:id', getStudentById)

router.post('', createStudent)
router.put('/:id', updateStudent)
router.delete('/:id', deleteStudent)

export default router