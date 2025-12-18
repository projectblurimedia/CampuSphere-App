const express = require('express')
const router = express.Router()
const {
  createSchool,
  getSchoolProfile,
  updateSchoolProfile,
  getBuses,
  addBus,
  updateBus,
  deleteBus
} = require('../controllers/schoolController')

// School Profile Routes
router.post('/', createSchool)
router.get('/', getSchoolProfile)
router.put('/', updateSchoolProfile)

// Bus Routes (sub-resource)
router.get('/buses', getBuses)
router.post('/buses', addBus)
router.put('/buses/:busId', updateBus)
router.delete('/buses/:busId', deleteBus)

module.exports = router