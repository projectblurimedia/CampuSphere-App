const express = require('express')
const router = express.Router()
const schoolController = require('../controllers/schoolController')
const authMiddleware = require('../middleware/authMiddleware')
const uploadMiddleware = require('../middleware/uploadMiddleware')

// Protect all routes
router.use(authMiddleware.protect)
router.use(authMiddleware.restrictTo('admin', 'principal', 'staff'))

// School profile routes
router.route('/profile')
  .get(schoolController.getSchoolProfile)
  .put(schoolController.updateSchoolProfile)

router.get('/statistics', schoolController.getSchoolStatistics)

// School images routes
router.route('/images')
  .get(schoolController.getSchoolImages)
  .post(
    uploadMiddleware.upload.array('images', 10),
    schoolController.uploadSchoolImages
  )

router.delete('/images/:imageId', schoolController.deleteSchoolImage)

// School-specific routes with ID
router.route('/:id/profile')
  .get(schoolController.getSchoolProfile)
  .put(schoolController.updateSchoolProfile)

router.get('/:id/statistics', schoolController.getSchoolStatistics)
router.get('/:id/images', schoolController.getSchoolImages)

router.post('/:id/images',
  uploadMiddleware.upload.array('images', 10),
  schoolController.uploadSchoolImages
)

router.delete('/:id/images/:imageId', schoolController.deleteSchoolImage)

module.exports = router