import express from 'express'
import {
  createSchool,
  getSchoolProfile,
  updateSchoolProfile,
  getBuses,
  addBus,
  updateBus,
  deleteBus,
  addSchoolImages,
  deleteSchoolImage,
  deleteSchoolImageByIndex  // Add this new controller function
} from '../controllers/schoolController.js'

const router = express.Router()

// School Profile Routes
router.post('/', createSchool)
router.get('/', getSchoolProfile)
router.put('/', updateSchoolProfile)

// School Images Routes
router.post('/images', addSchoolImages) // Multiple images upload
router.delete('/images/:imageId', deleteSchoolImage) // Delete by image ID/publicId
router.delete('/images/index/:index', deleteSchoolImageByIndex) // Delete by index (as fallback)

// Bus Routes
router.get('/buses', getBuses)
router.post('/buses', addBus)
router.put('/buses/:busId', updateBus)
router.delete('/buses/:busId', deleteBus)

export default router