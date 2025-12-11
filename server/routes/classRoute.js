const express = require('express')
const router = express.Router()
const classController = require('../controllers/classController')
const authMiddleware = require('../middleware/authMiddleware')

// Protect all routes
router.use(authMiddleware.protect)

// Class routes
router.route('/')
  .get(authMiddleware.restrictTo('admin', 'principal', 'staff'), classController.getAllClasses)
  .post(authMiddleware.restrictTo('admin', 'principal'), classController.createClass)

router.route('/:id')
  .get(authMiddleware.restrictTo('admin', 'principal', 'staff'), classController.getClassById)
  .put(authMiddleware.restrictTo('admin', 'principal'), classController.updateClass)
  .delete(authMiddleware.restrictTo('admin', 'principal'), classController.deleteClass)

// Class-specific routes
router.get('/:id/students',
  authMiddleware.restrictTo('admin', 'principal', 'staff'),
  classController.getClassStudents
)

router.route('/:id/timetable')
  .get(authMiddleware.restrictTo('admin', 'principal', 'staff', 'teacher', 'student'), classController.getClassTimetable)
  .put(authMiddleware.restrictTo('admin', 'principal'), classController.updateClassTimetable)

router.get('/:id/statistics',
  authMiddleware.restrictTo('admin', 'principal', 'staff'),
  classController.getClassStatistics
)

// Class teacher routes
router.put('/:id/teacher',
  authMiddleware.restrictTo('admin', 'principal'),
  (req, res) => {
    // Assign/update class teacher
    res.json({ message: 'Assign class teacher endpoint' })
  }
)

// Class subjects routes
router.route('/:id/subjects')
  .get((req, res) => {
    // Get class subjects
    res.json({ message: 'Get class subjects endpoint' })
  })
  .put(authMiddleware.restrictTo('admin', 'principal'), (req, res) => {
    // Update class subjects
    res.json({ message: 'Update class subjects endpoint' })
  })

module.exports = router