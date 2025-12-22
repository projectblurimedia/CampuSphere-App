const express = require('express')
const router = express.Router()
const {
    getAllEvents,
    getTodayEvents,
    getUpcomingEvents,
    getPastEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    uploadEventImages,
    removeEventImage
} = require('../controllers/eventController')

const upload = require('../middleware/uploadMiddleware')

router.get('/', getAllEvents)
router.get('/today', getTodayEvents)
router.get('/upcoming', getUpcomingEvents)
router.get('/past', getPastEvents)
router.get('/:id', getEventById)

router.post('/', upload.array('images', 10), createEvent)
router.put('/:id', upload.array('images', 10), updateEvent)
router.delete('/:id', deleteEvent)

router.post('/:id/images', upload.array('images', 10), uploadEventImages)
router.delete('/:id/images/:imageId', removeEventImage)

module.exports = router