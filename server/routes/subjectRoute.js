const express = require('express')
const router = express.Router()
const subjectController = require('../controllers/subjectController')
const authMiddleware = require('../middleware/authMiddleware')

// Protect all routes
router.use(authMiddleware.protect)

// Subject routes
router.route('/')
  .get(authMiddleware.restrictTo('admin', 'principal', 'staff'), subjectController.getAllSubjects)
  .post(authMiddleware.restrictTo('admin', 'principal'), subjectController.createSubject)

router.route('/:id')
  .get(authMiddleware.restrictTo('admin', 'principal', 'staff'), subjectController.getSubjectById)
  .put(authMiddleware.restrictTo('admin', 'principal'), subjectController.updateSubject)
  .delete(authMiddleware.restrictTo('admin', 'principal'), subjectController.deleteSubject)

// Specialized subject routes
router.get('/grade-level/:gradeLevel',
  authMiddleware.restrictTo('admin', 'principal', 'staff'),
  subjectController.getSubjectsByGradeLevel
)

router.get('/elective',
  authMiddleware.restrictTo('admin', 'principal', 'staff'),
  subjectController.getElectiveSubjects
)

module.exports = router