import express from 'express'
import {
  // Cash flow operations
  createCashFlow,
  getAllCashFlows,
  getCashFlowsByDateRange,
  getTotal,
  getCategoryBreakdown,
  getFilteredCashFlows,
  getMonthlyCashFlowsByYear,
  getYearlyCashFlowsInRange,
  updateCashFlow,
  deleteCashFlow,
  
  // Dropdown operations
  getCategoriesForDropdown,
  getItemsForDropdown,
  
  // Category operations
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  
  // Item operations
  createItem,
  getItems,
  getItemsByType,
  updateItem,
  deleteItem
} from '../controllers/cashflowController.js'

const router = express.Router()

// ========== CASH FLOW ROUTES ==========
router.post('/', createCashFlow)
router.get('/', getAllCashFlows)
router.get('/date-range', getCashFlowsByDateRange)
router.get('/total', getTotal)
router.get('/breakdown/category', getCategoryBreakdown)
router.get('/filtered', getFilteredCashFlows)
router.get('/monthly', getMonthlyCashFlowsByYear)
router.get('/yearly', getYearlyCashFlowsInRange)
router.put('/:id', updateCashFlow)
router.delete('/:id', deleteCashFlow)

// ========== DROPDOWN ROUTES ==========
router.get('/dropdown/categories', getCategoriesForDropdown)
router.get('/dropdown/items', getItemsForDropdown)

// ========== CATEGORY ROUTES ==========
router.post('/categories', createCategory)
router.get('/categories', getCategories)
router.put('/categories/:id', updateCategory)
router.delete('/categories/:id', deleteCategory)

// ========== ITEM ROUTES ==========
router.post('/items', createItem)
router.get('/items/:categoryId', getItems)
router.get('/items/type/:type', getItemsByType)
router.put('/items/:id', updateItem)
router.delete('/items/:id', deleteItem)

export default router