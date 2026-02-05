import express from 'express'
import {
  markAttendance,
  overrideAttendance,
  getDayAttendance,
  checkAttendanceExists,
  getDayAttendanceSummary,
  getStudentAttendance,
  getClassSummary,
  updateAttendance,
  deleteAttendance,
  getMonthlyReport,
  getStudentsListByClass
} from '../controllers/attendanceController.js'

const router = express.Router()

// Mark attendance
router.post('/mark', markAttendance)
router.put('/override', overrideAttendance)

// Get attendance
router.get('/class/day', getDayAttendance)
router.get('/check', checkAttendanceExists)
router.get('/summary/day', getDayAttendanceSummary)
router.get('/student/:studentId', getStudentAttendance)
router.get('/summary/range', getClassSummary)
router.get('/students/list', getStudentsListByClass)

// Update and delete
router.put('/:studentId', updateAttendance)
router.delete('/:studentId', deleteAttendance)

// Reports
router.get('/report/monthly', getMonthlyReport)

export default router