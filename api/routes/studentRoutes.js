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
  getStudentPromotionHistory,
  bulkImportStudents,
  getStudentsForEndOfAcademicYear,
  endOfAcademicYear,
  promoteStudent,
  demoteStudent,
  inactiveStudent,
  getStudentProgressionHistory,
  searchInactiveStudents,
  getGraduatedBatchStudents,
} from '../controllers/studentController.js'

const router = express.Router()

router.post('/promote/:studentId', promoteStudent)
router.post('/demote/:studentId', demoteStudent)
router.post('/inactive/:studentId', inactiveStudent)
router.get('/progression-history/:studentId', getStudentProgressionHistory)

router.get('/graduated/batch/:academicYear', getGraduatedBatchStudents)

router.use('/bulk-import', bulkImportStudents)
router.get('/birthdays', getTodayBirthdays)
router.get('/attendance-stats', getAttendanceStatsByClassSection)
router.get('/marks-stats', getMarksStatsByClassSection)
router.get('/classes-sections', getClassesAndSections)
router.get('/search', searchStudents)
router.get('/search-inactive', searchInactiveStudents)
router.get('/quick-search', quickSearchStudents)
router.get('/statistics', getStudentStatistics)
router.get('/classes-summary', getClassesSummary)
router.get('/class-details', getClassDetails)
router.get('/class-section-students', getStudentsByClassAndSection)

router.post('/endOfAcademicYear', endOfAcademicYear)
router.get('/for-endOfAcademicYear', getStudentsForEndOfAcademicYear)
router.get('/:id/promotion-history', getStudentPromotionHistory)

router.get('', getAllStudents)
router.get('/:id', getStudentById)

router.post('', createStudent)
router.put('/:id', updateStudent)
router.delete('/:id', deleteStudent)

export default router