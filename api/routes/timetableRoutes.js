import express from 'express'
import {
  bulkImportTimetable,
  getClassesAndSections,
  getTimetableForClassSection
} from '../controllers/timetableController.js'

const router = express.Router()

router.post('/bulk-import', bulkImportTimetable)
router.get('/classes-sections', getClassesAndSections)
router.get('/', getTimetableForClassSection)

export default router