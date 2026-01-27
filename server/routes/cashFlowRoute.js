const { 
  // Cash flow operations
  createCashFlow,
  getAllCashFlows,
  getCashFlowsByDateRange,
  getTotal,
  getCategoryBreakdown,
  getFilteredCashFlows,
  getMonthlyCashFlowsByYear,
  updateCashFlow,
  deleteCashFlow,
  
  // Category operations
  createCategory,
  getCategories,
  
  // Item operations
  createItem,
  getItems,
  getItemsByType
} = require('../controllers/cashFlowController')

const router = require('express').Router()

// Cash flow routes
router.post('/', createCashFlow)
router.get('/', getAllCashFlows)
router.get('/date-range', getCashFlowsByDateRange)
router.get('/total', getTotal)
router.get('/breakdown/category', getCategoryBreakdown)
router.get('/filtered', getFilteredCashFlows)
router.get('/monthly', getMonthlyCashFlowsByYear)
router.put('/:id', updateCashFlow)
router.delete('/:id', deleteCashFlow)

// Category routes
router.post('/categories', createCategory)
router.get('/categories', getCategories)

// Item routes
router.post('/items', createItem)
router.get('/items/:categoryId', getItems)
router.get('/items/type/:type', getItemsByType)

module.exports = router