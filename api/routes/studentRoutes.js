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
  getStudentsByClassAndSection,
  getClassesAndSections,
  quickSearchStudents,
  getTodayBirthdays,
  getAttendanceStatsByClassSection,
  getMarksStatsByClassSection,
} from '../controllers/studentController.js'

const router = express.Router()

router.get('/birthdays', getTodayBirthdays)
router.get('/attendance-stats', getAttendanceStatsByClassSection)
router.get('/marks-stats', getMarksStatsByClassSection)
router.get('/classes-sections', getClassesAndSections)
router.get('/search', searchStudents)
router.get('/quick-search', quickSearchStudents)
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