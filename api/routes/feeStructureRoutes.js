import express from 'express'
import {
  // Class Fee Structure
  createClassFeeStructure,
  getClassFeeStructures,
  getClassFeeStructureById,
  updateClassFeeStructure,
  deleteClassFeeStructure,
  toggleClassFeeStatus,
  getClassFeeStructureByClass,
  
  // Bus Fee Structure
  createBusFeeStructure,
  getBusFeeStructures,
  getBusFeeStructureById,
  updateBusFeeStructure,
  deleteBusFeeStructure,
  toggleBusFeeStatus,
  getBusFeeStructureByVillage,
  
  // Hostel Fee Structure
  createHostelFeeStructure,
  getHostelFeeStructures,
  getHostelFeeStructureById,
  updateHostelFeeStructure,
  deleteHostelFeeStructure,
  toggleHostelFeeStatus,
  getHostelFeeStructureByClass,
  
  // Bulk Operations
  bulkCreateClassFeeStructures,
  bulkCreateBusFeeStructures,
  bulkCreateHostelFeeStructures
} from '../controllers/feeStructureController.js'

const router = express.Router()

// ============ CLASS FEE STRUCTURE ROUTES ============
router.post('/class', createClassFeeStructure)
router.post('/class/bulk', bulkCreateClassFeeStructures)
router.get('/class', getClassFeeStructures)
router.get('/class/:id', getClassFeeStructureById)
router.put('/class/:id', updateClassFeeStructure)
router.delete('/class/:id', deleteClassFeeStructure)
router.patch('/class/:id/toggle-status', toggleClassFeeStatus)
router.get('/class/class/:className', getClassFeeStructureByClass)

// ============ BUS FEE STRUCTURE ROUTES ============
router.post('/bus', createBusFeeStructure)
router.post('/bus/bulk', bulkCreateBusFeeStructures)
router.get('/bus', getBusFeeStructures)
router.get('/bus/:id', getBusFeeStructureById)
router.put('/bus/:id', updateBusFeeStructure)
router.delete('/bus/:id', deleteBusFeeStructure)
router.patch('/bus/:id/toggle-status', toggleBusFeeStatus)
router.get('/bus/village/:villageName', getBusFeeStructureByVillage)

// ============ HOSTEL FEE STRUCTURE ROUTES ============
router.post('/hostel', createHostelFeeStructure)
router.post('/hostel/bulk', bulkCreateHostelFeeStructures)
router.get('/hostel', getHostelFeeStructures)
router.get('/hostel/:id', getHostelFeeStructureById)
router.put('/hostel/:id', updateHostelFeeStructure)
router.delete('/hostel/:id', deleteHostelFeeStructure)
router.patch('/hostel/:id/toggle-status', toggleHostelFeeStatus)
router.get('/hostel/class/:className', getHostelFeeStructureByClass)

export default router