import express from 'express'
import {
  // Check functions
  checkExistingMarks,
  getStudentsWithoutMarks,
  getStudentsForMarks,
  
  // Get functions
  getMarksByStudent,
  getMarksByExam,
  getStudentMarks,
  getMarksSummary,
  
  // Upload functions
  uploadMarks,
  overrideMarks,
  
  // Delete functions
  deleteMarks,
  deleteMarksForClassSection,
  batchDeleteMarksForClassSection
} from '../controllers/marksController.js'

const router = express.Router()

// ================= CHECK MARKS =================
router.get('/check', checkExistingMarks)
router.get('/students/without-marks', getStudentsWithoutMarks)
router.get('/students', getStudentsForMarks)

// ================= GET MARKS =================
router.get('/student/:studentId', getMarksByStudent)
router.get('/exam', getMarksByExam)
router.get('/student-marks', getStudentMarks)
router.get('/summary', getMarksSummary)

// ================= UPLOAD MARKS =================
router.post('/upload', uploadMarks)
router.put('/override', overrideMarks)

// ================= DELETE MARKS =================
router.delete('/:studentId', deleteMarks)
router.delete('/class-section/all', deleteMarksForClassSection)
router.delete('/class-section/batch', batchDeleteMarksForClassSection)

export default router