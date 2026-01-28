const { 
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
  
  getCategoriesForDropdown,
  getItemsForDropdown,
  
  createCategory,
  getCategories,
  
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
router.get('/yearly', getYearlyCashFlowsInRange)
router.put('/:id', updateCashFlow)
router.delete('/:id', deleteCashFlow)

// Dropdown routes
router.get('/dropdown/categories', getCategoriesForDropdown)
router.get('/dropdown/items', getItemsForDropdown)

router.get('/dropdown/items/:categoryId', getItemsForDropdown)

// Category routes
router.post('/categories', createCategory)
router.get('/categories', getCategories)

// Item routes
router.post('/items', createItem)
router.get('/items/:categoryId', getItems)
router.get('/items/type/:type', getItemsByType)

module.exports = router