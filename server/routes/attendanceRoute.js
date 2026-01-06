const express = require('express')
const {
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
  getStudentsByClass
} = require('../controllers/attendanceController')

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
router.get('/students', getStudentsByClass)

// Update and delete
router.put('/:studentId', updateAttendance)
router.delete('/:studentId', deleteAttendance)

// Reports
router.get('/report/monthly', getMonthlyReport)

module.exports = router