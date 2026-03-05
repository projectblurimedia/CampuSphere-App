import express from 'express'
import {
  getSchoolStats,
  getStudentStats,
  getStaffStats,
  getAcademicStats,
  getAttendanceStats,
  getTransportStats,
  getClassWiseStats,
  getGenderBreakdown,
  getFeeStats,
  getAllStats
} from '../controllers/statsController.js'

const router = express.Router()

// Main stats endpoint (aggregates all stats)
router.get('/', getAllStats)

// Individual stat endpoints
router.get('/school', getSchoolStats)
router.get('/students', getStudentStats)
router.get('/staff', getStaffStats)
router.get('/academic', getAcademicStats)
router.get('/attendance', getAttendanceStats)
router.get('/transport', getTransportStats)
router.get('/class-wise', getClassWiseStats)
router.get('/gender-breakdown', getGenderBreakdown)
router.get('/fees', getFeeStats)

export default router