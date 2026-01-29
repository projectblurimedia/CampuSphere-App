// routes/timetableRoutes.js
const express = require('express')
const router = express.Router()
const timetableController = require('../controllers/timetableController')

router.post('/bulk-import', timetableController.bulkImportTimetable)
router.get('/classes', timetableController.getUniqueClasses)
router.get('/sections', timetableController.getSectionsForClass)
router.get('/', timetableController.getTimetableForClassSection)

module.exports = router