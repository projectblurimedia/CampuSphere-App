const express = require('express')
const router = express.Router()
const {
  createSchool,
  getSchoolProfile,
  updateSchoolProfile,
  getBuses,
  addBus,
  updateBus,
  deleteBus,
  addSchoolImage,
  deleteSchoolImage
} = require('../controllers/schoolController')

// School Profile Routes
router.post('/', createSchool)
router.get('/', getSchoolProfile)
router.put('/', updateSchoolProfile)

// School Images Routes
router.post('/images', addSchoolImage)
router.delete('/images/:index', deleteSchoolImage)

// Bus Routes
router.get('/buses', getBuses)
router.post('/buses', addBus)
router.put('/buses/:busId', updateBus)  
router.delete('/buses/:busId', deleteBus)  

module.exports = router