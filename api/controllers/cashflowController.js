import prisma from '../lib/prisma.js'

/**
 * Map payment method string to enum
 */
const mapPaymentMethod = (method) => {
  const methodMap = {
    'Cash': 'CASH',
    'Bank Transfer': 'BANK_TRANSFER',
    'Cheque': 'CHEQUE',
    'Online': 'ONLINE',
    'Credit Card': 'CREDIT_CARD',
    'Other': 'OTHER'
  }
  return methodMap[method] || 'CASH'
}

/**
 * Map type string to enum
 */
const mapCashFlowType = (type) => {
  if (type === 'Income') return 'INCOME'
  if (type === 'Expense') return 'EXPENSE'
  return type
}

/**
 * Map type enum to display string
 */
const mapTypeToDisplay = (type) => {
  return type === 'INCOME' ? 'Income' : 'Expense'
}

/**
 * Build date range filter
 */
const buildDateRangeFilter = (startDate, endDate) => {
  const filter = {}
  if (startDate || endDate) {
    filter.date = {}
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      filter.date.gte = start
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filter.date.lte = end
    }
  }
  return filter
}

// ========== CASH FLOW OPERATIONS ==========

/**
 * @desc    Create a new cash flow record
 * @route   POST /api/cashflow
 */
export const createCashFlow = async (req, res) => {
  try {
    const {
      type,
      categoryId,
      itemId,
      amount,
      quantity = 1,
      person,
      description = '',
      date,
      paymentMethod = 'Cash',
      updatedBy
    } = req.body

    // Validate required fields
    if (!type || !categoryId || !itemId || !amount || !person || !date || !updatedBy) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (including updatedBy)'
      })
    }

    // Validate category exists and matches type
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      })
    }

    if (category.type !== mapCashFlowType(type)) {
      return res.status(400).json({
        success: false,
        message: `Category type (${mapTypeToDisplay(category.type)}) does not match cash flow type (${type})`
      })
    }

    // Validate item exists and belongs to category
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        categoryId
      }
    })

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found or does not belong to the specified category'
      })
    }

    // Create cash flow
    const cashFlow = await prisma.cashFlow.create({
      data: {
        type: mapCashFlowType(type),
        categoryId,
        itemId,
        amount: parseFloat(amount),
        quantity: parseInt(quantity),
        person,
        description,
        date: new Date(date),
        paymentMethod: mapPaymentMethod(paymentMethod),
        updatedBy
      },
      include: {
        category: true,
        item: true
      }
    })

    // Format response
    const formattedCashFlow = {
      ...cashFlow,
      type: mapTypeToDisplay(cashFlow.type),
      paymentMethod: cashFlow.paymentMethod.replace('_', ' ').replace(/\w\S*/g, txt => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      )
    }

    res.status(201).json({
      success: true,
      data: formattedCashFlow
    })
  } catch (error) {
    console.error('Create cash flow error:', error)
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create cash flow record'
    })
  }
}

/**
 * @desc    Get all cash flows with optional type filter
 * @route   GET /api/cashflow
 */
export const getAllCashFlows = async (req, res) => {
  try {
    const { type, page = 1, limit = 50 } = req.query

    const where = {}
    if (type && type !== 'All') {
      where.type = mapCashFlowType(type)
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const [cashFlows, total] = await Promise.all([
      prisma.cashFlow.findMany({
        where,
        include: {
          category: true,
          item: true
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.cashFlow.count({ where })
    ])

    // Format response
    const formattedCashFlows = cashFlows.map(cf => ({
      ...cf,
      type: mapTypeToDisplay(cf.type),
      paymentMethod: cf.paymentMethod.replace('_', ' ').replace(/\w\S*/g, txt => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      )
    }))

    res.status(200).json({
      success: true,
      count: formattedCashFlows.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
        limit: limitNum
      },
      data: formattedCashFlows
    })
  } catch (error) {
    console.error('Get all cash flows error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get cash flows'
    })
  }
}

/**
 * @desc    Get cash flows by date range
 * @route   GET /api/cashflow/date-range
 */
export const getCashFlowsByDateRange = async (req, res) => {
  try {
    const { type, startDate, endDate, page = 1, limit = 50 } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      })
    }

    const where = buildDateRangeFilter(startDate, endDate)
    
    if (type && type !== 'All') {
      where.type = mapCashFlowType(type)
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const [cashFlows, total] = await Promise.all([
      prisma.cashFlow.findMany({
        where,
        include: {
          category: true,
          item: true
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.cashFlow.count({ where })
    ])

    // Format response
    const formattedCashFlows = cashFlows.map(cf => ({
      ...cf,
      type: mapTypeToDisplay(cf.type),
      paymentMethod: cf.paymentMethod.replace('_', ' ').replace(/\w\S*/g, txt => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      )
    }))

    // Calculate totals for the date range
    const totals = await prisma.cashFlow.aggregate({
      where,
      _sum: {
        amount: true
      },
      _avg: {
        amount: true
      },
      _count: true
    })

    res.status(200).json({
      success: true,
      count: formattedCashFlows.length,
      total,
      summary: {
        totalAmount: totals._sum.amount || 0,
        averageAmount: totals._avg.amount || 0,
        totalTransactions: totals._count
      },
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
        limit: limitNum
      },
      data: formattedCashFlows
    })
  } catch (error) {
    console.error('Get cash flows by date range error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get cash flows'
    })
  }
}

/**
 * @desc    Get total amount for date range
 * @route   GET /api/cashflow/total
 */
export const getTotal = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      })
    }

    const where = buildDateRangeFilter(startDate, endDate)
    
    if (type && type !== 'All') {
      where.type = mapCashFlowType(type)
    }

    const result = await prisma.cashFlow.aggregate({
      where,
      _sum: {
        amount: true
      },
      _avg: {
        amount: true
      },
      _count: true
    })

    res.status(200).json({
      success: true,
      data: {
        total: result._sum.amount || 0,
        count: result._count,
        avgAmount: result._avg.amount || 0
      }
    })
  } catch (error) {
    console.error('Get total error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get total'
    })
  }
}

/**
 * @desc    Get category breakdown
 * @route   GET /api/cashflow/breakdown/category
 */
export const getCategoryBreakdown = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query

    if (!type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'type, startDate and endDate are required'
      })
    }

    const where = buildDateRangeFilter(startDate, endDate)
    where.type = mapCashFlowType(type)

    const breakdown = await prisma.cashFlow.groupBy({
      by: ['categoryId'],
      where,
      _sum: {
        amount: true
      },
      _count: true
    })

    // Get category details
    const categoryIds = breakdown.map(b => b.categoryId)
    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds }
      },
      select: {
        id: true,
        name: true,
        type: true
      }
    })

    // Create category map
    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat
      return acc
    }, {})

    // Format response
    const formattedBreakdown = breakdown.map(b => ({
      categoryId: b.categoryId,
      categoryName: categoryMap[b.categoryId]?.name || 'Unknown',
      total: b._sum.amount || 0,
      count: b._count,
      type: mapTypeToDisplay(where.type)
    })).sort((a, b) => b.total - a.total)

    res.status(200).json({
      success: true,
      data: formattedBreakdown
    })
  } catch (error) {
    console.error('Get category breakdown error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get category breakdown'
    })
  }
}

/**
 * @desc    Get filtered cash flows (for reports)
 * @route   GET /api/cashflow/filtered
 */
export const getFilteredCashFlows = async (req, res) => {
  try {
    const {
      type,
      categoryId,
      itemId,
      period,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query

    const where = {}

    // Type filter
    if (type && type !== 'All') {
      where.type = mapCashFlowType(type)
    }

    // Category filter
    if (categoryId && categoryId !== 'All') {
      where.categoryId = categoryId
    }

    // Item filter
    if (itemId && itemId !== 'All') {
      where.itemId = itemId
    }

    // Date filter
    if (period) {
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate are required'
        })
      }

      const dateFilter = {}
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (period === 'Date' || period === 'Custom Range') {
        dateFilter.gte = start
        dateFilter.lte = new Date(end.setHours(23, 59, 59, 999))
      } else {
        // Month or Year
        dateFilter.gte = start
        dateFilter.lte = end
      }

      where.date = dateFilter
    } else {
      // Default to current month
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      where.date = {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const [cashFlows, total] = await Promise.all([
      prisma.cashFlow.findMany({
        where,
        include: {
          category: true,
          item: true
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.cashFlow.count({ where })
    ])

    // Format response
    const formattedCashFlows = cashFlows.map(cf => ({
      ...cf,
      type: mapTypeToDisplay(cf.type),
      paymentMethod: cf.paymentMethod.replace('_', ' ').replace(/\w\S*/g, txt => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      )
    }))

    // Calculate summary
    const summary = await prisma.cashFlow.aggregate({
      where,
      _sum: {
        amount: true
      },
      _count: true
    })

    res.status(200).json({
      success: true,
      count: formattedCashFlows.length,
      total,
      summary: {
        totalAmount: summary._sum.amount || 0,
        totalTransactions: summary._count
      },
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
        limit: limitNum
      },
      data: formattedCashFlows
    })
  } catch (error) {
    console.error('Get filtered cash flows error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get filtered cash flows'
    })
  }
}

/**
 * @desc    Get monthly cash flows by year
 * @route   GET /api/cashflow/monthly
 */
export const getMonthlyCashFlowsByYear = async (req, res) => {
  try {
    const { type, year } = req.query

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year is required'
      })
    }

    const selectedYear = parseInt(year)
    const now = new Date()
    const isCurrentYear = now.getFullYear() === selectedYear
    const lastMonth = isCurrentYear ? now.getMonth() + 1 : 12

    const monthlyData = []

    for (let month = 1; month <= lastMonth; month++) {
      const startDate = new Date(Date.UTC(selectedYear, month - 1, 1, 0, 0, 0))
      const endDate = new Date(Date.UTC(selectedYear, month, 0, 23, 59, 59, 999))

      const where = {
        date: {
          gte: startDate,
          lte: endDate
        }
      }

      if (type && type !== 'All') {
        where.type = mapCashFlowType(type)
      }

      if (type === 'All') {
        // For net calculation (Income - Expense)
        const [incomeResult, expenseResult] = await Promise.all([
          prisma.cashFlow.aggregate({
            where: { ...where, type: 'INCOME' },
            _sum: { amount: true },
            _count: true
          }),
          prisma.cashFlow.aggregate({
            where: { ...where, type: 'EXPENSE' },
            _sum: { amount: true },
            _count: true
          })
        ])

        const incomeTotal = incomeResult._sum.amount || 0
        const expenseTotal = expenseResult._sum.amount || 0
        const netTotal = incomeTotal - expenseTotal

        monthlyData.push({
          month,
          year: selectedYear,
          total: netTotal,
          count: (incomeResult._count || 0) + (expenseResult._count || 0),
          breakdown: {
            income: incomeTotal,
            expense: expenseTotal
          }
        })
      } else {
        const result = await prisma.cashFlow.aggregate({
          where,
          _sum: { amount: true },
          _count: true
        })

        monthlyData.push({
          month,
          year: selectedYear,
          total: result._sum.amount || 0,
          count: result._count || 0
        })
      }
    }

    res.status(200).json({
      success: true,
      data: monthlyData
    })
  } catch (error) {
    console.error('Get monthly cash flows error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get monthly cash flows'
    })
  }
}

/**
 * @desc    Get yearly cash flows in range
 * @route   GET /api/cashflow/yearly
 */
export const getYearlyCashFlowsInRange = async (req, res) => {
  try {
    let { type, startYear, endYear } = req.query

    const currentYear = new Date().getFullYear()

    // If no range provided, default to last 3 years
    if (!startYear || !endYear) {
      startYear = currentYear - 2
      endYear = currentYear
    }

    startYear = parseInt(startYear)
    endYear = parseInt(endYear)

    if (startYear > endYear) {
      return res.status(400).json({
        success: false,
        message: 'startYear cannot be greater than endYear'
      })
    }

    const yearlyData = []

    for (let year = endYear; year >= startYear; year--) {
      const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
      const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))

      if (type === 'All') {
        // For net calculation (Income - Expense)
        const [incomeResult, expenseResult] = await Promise.all([
          prisma.cashFlow.aggregate({
            where: {
              date: { gte: startDate, lte: endDate },
              type: 'INCOME'
            },
            _sum: { amount: true },
            _count: true
          }),
          prisma.cashFlow.aggregate({
            where: {
              date: { gte: startDate, lte: endDate },
              type: 'EXPENSE'
            },
            _sum: { amount: true },
            _count: true
          })
        ])

        const incomeTotal = incomeResult._sum.amount || 0
        const expenseTotal = expenseResult._sum.amount || 0
        const netTotal = incomeTotal - expenseTotal

        yearlyData.push({
          year,
          startDate,
          endDate,
          total: netTotal,
          count: (incomeResult._count || 0) + (expenseResult._count || 0),
          breakdown: {
            income: incomeTotal,
            expense: expenseTotal
          }
        })
      } else {
        const where = {
          date: { gte: startDate, lte: endDate }
        }
        
        if (type && type !== 'All') {
          where.type = mapCashFlowType(type)
        }

        const result = await prisma.cashFlow.aggregate({
          where,
          _sum: { amount: true },
          _count: true
        })

        yearlyData.push({
          year,
          startDate,
          endDate,
          total: result._sum.amount || 0,
          count: result._count || 0
        })
      }
    }

    res.status(200).json({
      success: true,
      data: yearlyData
    })
  } catch (error) {
    console.error('Get yearly cash flows error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get yearly cash flows'
    })
  }
}

/**
 * @desc    Update cash flow
 * @route   PUT /api/cashflow/:id
 */
export const updateCashFlow = async (req, res) => {
  try {
    const { id } = req.params
    const {
      type,
      categoryId,
      itemId,
      amount,
      quantity,
      person,
      description,
      date,
      paymentMethod,
      updatedBy
    } = req.body

    // Check if cash flow exists
    const existingCashFlow = await prisma.cashFlow.findUnique({
      where: { id }
    })

    if (!existingCashFlow) {
      return res.status(404).json({
        success: false,
        message: 'Cash flow record not found'
      })
    }

    // Validate updatedBy is provided
    if (!updatedBy) {
      return res.status(400).json({
        success: false,
        message: 'updatedBy is required'
      })
    }

    // If category is being updated, validate it
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      })

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        })
      }

      if (type && category.type !== mapCashFlowType(type)) {
        return res.status(400).json({
          success: false,
          message: `Category type does not match cash flow type`
        })
      }
    }

    // If item is being updated, validate it belongs to category
    if (itemId) {
      const targetCategoryId = categoryId || existingCashFlow.categoryId
      
      const item = await prisma.item.findFirst({
        where: {
          id: itemId,
          categoryId: targetCategoryId
        }
      })

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found or does not belong to the specified category'
        })
      }
    }

    // Update cash flow
    const updatedCashFlow = await prisma.cashFlow.update({
      where: { id },
      data: {
        ...(type && { type: mapCashFlowType(type) }),
        ...(categoryId && { categoryId }),
        ...(itemId && { itemId }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(quantity && { quantity: parseInt(quantity) }),
        ...(person && { person }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(paymentMethod && { paymentMethod: mapPaymentMethod(paymentMethod) }),
        updatedBy
      },
      include: {
        category: true,
        item: true
      }
    })

    // Format response
    const formattedCashFlow = {
      ...updatedCashFlow,
      type: mapTypeToDisplay(updatedCashFlow.type),
      paymentMethod: updatedCashFlow.paymentMethod.replace('_', ' ').replace(/\w\S*/g, txt => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      )
    }

    res.status(200).json({
      success: true,
      data: formattedCashFlow
    })
  } catch (error) {
    console.error('Update cash flow error:', error)

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update cash flow record'
    })
  }
}

/**
 * @desc    Delete cash flow
 * @route   DELETE /api/cashflow/:id
 */
export const deleteCashFlow = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.cashFlow.delete({
      where: { id }
    })

    res.status(200).json({
      success: true,
      message: 'Cash flow record deleted successfully'
    })
  } catch (error) {
    console.error('Delete cash flow error:', error)
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete cash flow record'
    })
  }
}

// ========== CATEGORY OPERATIONS ==========

/**
 * @desc    Create category
 * @route   POST /api/cashflow/categories
 */
export const createCategory = async (req, res) => {
  try {
    const { name, type } = req.body

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      })
    }

    const category = await prisma.category.create({
      data: {
        name,
        type: mapCashFlowType(type)
      }
    })

    res.status(201).json({
      success: true,
      data: {
        ...category,
        type: mapTypeToDisplay(category.type)
      }
    })
  } catch (error) {
    console.error('Create category error:', error)
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create category'
    })
  }
}

/**
 * @desc    Get categories
 * @route   GET /api/cashflow/categories
 */
export const getCategories = async (req, res) => {
  try {
    const { type } = req.query

    const where = {}
    if (type && type !== 'All') {
      where.type = mapCashFlowType(type)
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: {
            items: true,
            cashFlows: true
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    const formattedCategories = categories.map(cat => ({
      ...cat,
      type: mapTypeToDisplay(cat.type),
      itemCount: cat._count.items,
      transactionCount: cat._count.cashFlows
    }))

    res.status(200).json({
      success: true,
      data: formattedCategories
    })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get categories'
    })
  }
}

/**
 * @desc    Update category
 * @route   PUT /api/cashflow/categories/:id
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { name, type } = req.body

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      })
    }

    // Check if category has transactions when changing type
    if (type && mapCashFlowType(type) !== existingCategory.type) {
      const transactionCount = await prisma.cashFlow.count({
        where: { categoryId: id }
      })

      if (transactionCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change category type because it has existing transactions'
        })
      }
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type: mapCashFlowType(type) })
      }
    })

    res.status(200).json({
      success: true,
      data: {
        ...updatedCategory,
        type: mapTypeToDisplay(updatedCategory.type)
      }
    })
  } catch (error) {
    console.error('Update category error:', error)
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update category'
    })
  }
}

/**
 * @desc    Delete category
 * @route   DELETE /api/cashflow/categories/:id
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            items: true,
            cashFlows: true
          }
        }
      }
    })

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      })
    }

    // Check if category has items or transactions
    if (category._count.items > 0 || category._count.cashFlows > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing items or transactions'
      })
    }

    // Delete category
    await prisma.category.delete({
      where: { id }
    })

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Delete category error:', error)
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete category'
    })
  }
}

/**
 * @desc    Get categories for dropdown
 * @route   GET /api/cashflow/dropdown/categories
 */
export const getCategoriesForDropdown = async (req, res) => {
  try {
    const { type } = req.query

    const where = {}
    if (type && type !== 'All') {
      where.type = mapCashFlowType(type)
    }

    const categories = await prisma.category.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    // Format for dropdown
    const dropdownCategories = [
      { _id: null, name: 'All Categories', type: 'All' },
      ...categories.map(cat => ({
        _id: cat.id,
        name: cat.name,
        type: mapTypeToDisplay(cat.type)
      }))
    ]

    res.status(200).json({
      success: true,
      data: dropdownCategories
    })
  } catch (error) {
    console.error('Get categories for dropdown error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get categories'
    })
  }
}

// ========== ITEM OPERATIONS ==========

/**
 * @desc    Create item
 * @route   POST /api/cashflow/items
 */
export const createItem = async (req, res) => {
  try {
    const { name, categoryId } = req.body

    if (!name || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Name and categoryId are required'
      })
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      })
    }

    const item = await prisma.item.create({
      data: {
        name,
        categoryId
      },
      include: {
        category: true
      }
    })

    res.status(201).json({
      success: true,
      data: {
        ...item,
        category: {
          ...item.category,
          type: mapTypeToDisplay(item.category.type)
        }
      }
    })
  } catch (error) {
    console.error('Create item error:', error)
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create item'
    })
  }
}

/**
 * @desc    Get items by category
 * @route   GET /api/cashflow/items/:categoryId
 */
export const getItems = async (req, res) => {
  try {
    const { categoryId } = req.params

    const items = await prisma.item.findMany({
      where: { categoryId },
      include: {
        category: true,
        _count: {
          select: {
            cashFlows: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    const formattedItems = items.map(item => ({
      ...item,
      category: {
        ...item.category,
        type: mapTypeToDisplay(item.category.type)
      },
      transactionCount: item._count.cashFlows
    }))

    res.status(200).json({
      success: true,
      data: formattedItems
    })
  } catch (error) {
    console.error('Get items error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get items'
    })
  }
}

/**
 * @desc    Update item
 * @route   PUT /api/cashflow/items/:id
 */
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params
    const { name, categoryId } = req.body

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
      include: {
        category: true
      }
    })

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      })
    }

    // If category is being changed, check if category exists
    if (categoryId && categoryId !== existingItem.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      })

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        })
      }

      // Check if types match
      if (category.type !== existingItem.category.type) {
        return res.status(400).json({
          success: false,
          message: 'Cannot move item to a category of different type'
        })
      }

      // Check if item has transactions
      const transactionCount = await prisma.cashFlow.count({
        where: { itemId: id }
      })

      if (transactionCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change category of item with existing transactions'
        })
      }
    }

    // Update item
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(categoryId && { categoryId })
      },
      include: {
        category: true
      }
    })

    res.status(200).json({
      success: true,
      data: {
        ...updatedItem,
        category: {
          ...updatedItem.category,
          type: mapTypeToDisplay(updatedItem.category.type)
        }
      }
    })
  } catch (error) {
    console.error('Update item error:', error)
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update item'
    })
  }
}

/**
 * @desc    Delete item
 * @route   DELETE /api/cashflow/items/:id
 */
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params

    // Check if item exists
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            cashFlows: true
          }
        }
      }
    })

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      })
    }

    // Check if item has transactions
    if (item._count.cashFlows > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item with existing transactions'
      })
    }

    // Delete item
    await prisma.item.delete({
      where: { id }
    })

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    })
  } catch (error) {
    console.error('Delete item error:', error)
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete item'
    })
  }
}

/**
 * @desc    Get items for dropdown
 * @route   GET /api/cashflow/dropdown/items
 */
export const getItemsForDropdown = async (req, res) => {
  try {
    const { categoryId } = req.query

    let items
    if (categoryId === 'All' || !categoryId) {
      items = await prisma.item.findMany({
        include: {
          category: true
        },
        orderBy: { name: 'asc' }
      })
    } else {
      items = await prisma.item.findMany({
        where: { categoryId },
        include: {
          category: true
        },
        orderBy: { name: 'asc' }
      })
    }

    // Format for dropdown
    const dropdownItems = [
      { _id: null, name: 'All Items' },
      ...items.map(item => ({
        _id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        categoryName: item.category.name,
        categoryType: mapTypeToDisplay(item.category.type)
      }))
    ]

    res.status(200).json({
      success: true,
      data: dropdownItems
    })
  } catch (error) {
    console.error('Get items for dropdown error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get items'
    })
  }
}

/**
 * @desc    Get items by type (for dropdowns)
 * @route   GET /api/cashflow/items/type/:type
 */
export const getItemsByType = async (req, res) => {
  try {
    const { type } = req.params

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Type is required'
      })
    }

    const items = await prisma.item.findMany({
      where: {
        category: {
          type: mapCashFlowType(type)
        }
      },
      include: {
        category: true
      },
      orderBy: { name: 'asc' }
    })

    const formattedItems = items.map(item => ({
      _id: item.id,
      name: item.name,
      category: {
        _id: item.category.id,
        name: item.category.name,
        type: mapTypeToDisplay(item.category.type)
      }
    }))

    res.status(200).json({
      success: true,
      data: formattedItems
    })
  } catch (error) {
    console.error('Get items by type error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get items'
    })
  }
}