const express = require('express')
const router = express.Router()
const {
  getStudentsForMarks,
  checkMarksExist,
  uploadMarks,
  overrideMarks,
  getMarksSummary,
  getStudentMarks,
  getClassMarksReport,
  getClassSubjectPerformance,
  getStudentPerformance
} = require('../controllers/marksController')

// Get students for marks upload
router.get('/students', getStudentsForMarks)

// Check if marks exist
router.get('/check', checkMarksExist)

// Upload marks
router.post('/upload', uploadMarks)

// Override marks
router.put('/override', overrideMarks)

// Get marks summary
router.get('/summary', getMarksSummary)

// Get student marks
router.get('/student/:studentId', getStudentMarks)

// Get class marks report
router.get('/report', getClassMarksReport)

// Get class subject performance
router.get('/subject-performance', getClassSubjectPerformance)

// Get student performance
router.get('/student-performance/:studentId', getStudentPerformance)

module.exports = router