import express from 'express'
import {
  getAllEvents,
  getUpcomingEvents,
  getPastEvents,
  getTodaysEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  addEventImages,
  removeEventImage,
  searchEvents,
  getEventsByDateRange,
  getEventStatistics
} from '../controllers/eventController.js'

const router = express.Router()

// Event retrieval routes
router.get('/', getAllEvents)
router.get('/upcoming', getUpcomingEvents)
router.get('/past', getPastEvents)
router.get('/today', getTodaysEvents)
router.get('/search', searchEvents)
router.get('/date-range', getEventsByDateRange)
router.get('/statistics', getEventStatistics)
router.get('/:id', getEventById)

// Event CRUD routes
router.post('/', createEvent)
router.put('/:id', updateEvent)
router.delete('/:id', deleteEvent)

// Image management routes
router.post('/:id/images', addEventImages)
router.delete('/:id/images/:imageId', removeEventImage)

export default router