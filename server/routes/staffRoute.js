const express = require('express')
const router = express.Router()
const staffController = require('../controllers/staffController')
const authMiddleware = require('../middleware/authMiddleware')
const uploadMiddleware = require('../middleware/uploadMiddleware')

// Protect all routes
router.use(authMiddleware.protect)

// Staff routes
router.route('/')
  .get(authMiddleware.restrictTo('admin', 'principal', 'staff'), staffController.getAllStaff)
  .post(authMiddleware.restrictTo('admin', 'principal'), staffController.createStaff)

router.route('/:id')
  .get(staffController.getStaffById)
  .put(authMiddleware.restrictTo('admin', 'principal'), staffController.updateStaff)
  .delete(authMiddleware.restrictTo('admin', 'principal'), staffController.deleteStaff)

// Staff photo upload
router.post('/:id/photo',
  authMiddleware.restrictTo('admin', 'principal'),
  uploadMiddleware.upload.single('photo'),
  staffController.uploadStaffPhoto
)

// Specialized staff routes
router.get('/teaching', 
  authMiddleware.restrictTo('admin', 'principal', 'staff', 'teacher'),
  staffController.getTeachingStaff
)

router.get('/designation/:designation',
  authMiddleware.restrictTo('admin', 'principal', 'staff'),
  staffController.getStaffByDesignation
)

// Staff documents routes
router.post('/:id/documents',
  authMiddleware.restrictTo('admin', 'principal'),
  uploadMiddleware.upload.array('documents', 5),
  (req, res) => {
    // Document upload implementation
    res.json({ message: 'Documents upload endpoint' })
  }
)

module.exports = router