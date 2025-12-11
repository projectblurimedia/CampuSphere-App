const express = require('express')
const router = express.Router()
const studentController = require('../controllers/studentController')
const authMiddleware = require('../middleware/authMiddleware')
const uploadMiddleware = require('../middleware/uploadMiddleware')

// Protect all routes
router.use(authMiddleware.protect)

// Student routes
router.route('/')
  .get(authMiddleware.restrictTo('admin', 'principal', 'staff'), studentController.getAllStudents)
  .post(authMiddleware.restrictTo('admin', 'principal'), studentController.createStudent)

router.route('/:id')
  .get(studentController.getStudentById)
  .put(authMiddleware.restrictTo('admin', 'principal'), studentController.updateStudent)
  .delete(authMiddleware.restrictTo('admin', 'principal'), studentController.deleteStudent)

// Student photo upload
router.post('/:id/photo',
  authMiddleware.restrictTo('admin', 'principal'),
  uploadMiddleware.upload.single('photo'),
  studentController.uploadStudentPhoto
)

// Class-specific student routes
router.get('/class/:classId', 
  authMiddleware.restrictTo('admin', 'principal', 'staff'),
  studentController.getStudentsByClass
)

// Student search routes
router.get('/search/quick', 
  authMiddleware.restrictTo('admin', 'principal', 'staff'),
  (req, res) => {
    // Quick search implementation
    res.json({ message: 'Quick search endpoint' })
  }
)

module.exports = router