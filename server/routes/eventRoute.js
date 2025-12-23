// routes/eventRoutes.js
const express = require('express')
const router = express.Router()
const {
    getAllEvents,
    getUpcomingEvents,
    getPastEvents,
    getTodaysEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    uploadEventImages,
    removeEventImage
} = require('../controllers/eventController')

const upload = require('../middleware/uploadMiddleware')

// Event retrieval routes
router.get('/', getAllEvents)
router.get('/upcoming', getUpcomingEvents)
router.get('/past', getPastEvents)
router.get('/today', getTodaysEvents)
router.get('/:id', getEventById)

// Event CRUD routes
router.post('/', upload.array('images', 10), createEvent)
router.put('/:id', upload.array('images', 10), updateEvent)
router.delete('/:id', deleteEvent)

// Image management routes
router.post('/:id/images', upload.array('images', 10), uploadEventImages)
router.delete('/:id/images/:imageId', removeEventImage)

module.exports = router