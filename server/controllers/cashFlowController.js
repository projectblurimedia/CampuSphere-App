const CashFlow = require("../models/CashFlow")
const Category = require("../models/Category")
const Item = require("../models/Item")

// Create a new cash flow record
const createCashFlow = async (req, res) => {
  try {
    const cashFlow = new CashFlow(req.body)
    const savedCashFlow = await cashFlow.save()
    
    // Populate category and item details in response
    const populatedCashFlow = await CashFlow.findById(savedCashFlow._id)
      .populate('category')
      .populate('item')
    
    res.status(201).json(populatedCashFlow)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Get all cash flows
const getAllCashFlows = async (req, res) => {
  try {
    const { type } = req.query
    let filter = {}
    
    if (type && type !== "All") {
      filter.type = type
    }
    
    const cashFlows = await CashFlow.find(filter)
      .populate('category')
      .populate('item')
      .sort({ date: -1 })
    
    res.json(cashFlows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get cash flows by date range
const getCashFlowsByDateRange = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" })
    }
    
    const cashFlows = await CashFlow.getByDateRange(
      type, 
      new Date(startDate), 
      new Date(endDate)
    )
    
    res.json(cashFlows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get total amount
const getTotal = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" })
    }
    
    const result = await CashFlow.getTotal(
      type,
      new Date(startDate), 
      new Date(endDate)
    )
    
    res.json(result[0] || { total: 0, count: 0, avgAmount: 0 })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get category breakdown
const getCategoryBreakdown = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query
    
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ 
        message: "type, startDate and endDate are required" 
      })
    }
    
    const result = await CashFlow.getCategoryBreakdown(
      type,
      new Date(startDate), 
      new Date(endDate)
    )
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get filtered cash flows
const getFilteredCashFlows = async (req, res) => {
  try {
    const { type, categoryId, itemId, period, startDate, endDate } = req.query
    const filter = {}

    // Type filter
    if (type && type !== "All") {
      filter.type = type
    }

    // Category filter
    if (categoryId && categoryId !== "All") {
      filter.category = categoryId
    }

    // Item filter
    if (itemId && itemId !== "All") {
      filter.item = itemId
    }

    // Date filter
    if (period) {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'startDate and endDate are required' })
      }

      let start = new Date(startDate)
      let end = new Date(endDate)

      if (period === 'Month' || period === 'Year') {
        filter.date = { $gte: start, $lte: end }
      } else if (period === 'Date' || period === 'Custom Range') {
        end.setDate(end.getDate() + 1)
        filter.date = { $gte: start, $lt: end }
      } else {
        return res.status(400).json({ 
          message: 'Invalid period. Use "Date", "Month", "Year", or "Custom Range".' 
        })
      }
    } else {
      // Default to current month
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      filter.date = { $gte: startOfMonth, $lte: endOfMonth }
    }

    const cashFlows = await CashFlow.find(filter)
      .populate('category')
      .populate('item')
      .sort({ date: -1 })
    
    res.json(cashFlows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get monthly cash flows by year
const getMonthlyCashFlowsByYear = async (req, res) => {
  try {
    const { type, year } = req.query
    
    if (!year) return res.status(400).json({ message: "Year is required" })

    const selectedYear = parseInt(year)
    const now = new Date()
    const isCurrentYear = now.getFullYear() === selectedYear
    const lastMonth = isCurrentYear ? now.getMonth() + 1 : 12

    let monthlyData = []

    for (let month = 1; month <= lastMonth; month++) {
      const startDate = new Date(Date.UTC(selectedYear, month - 1, 1, 0, 0, 0, 0))
      const endDate = new Date(Date.UTC(selectedYear, month, 0, 23, 59, 59, 999))

      const match = {
        date: { $gte: startDate, $lte: endDate }
      }
      
      if (type && type !== "All") {
        match.type = type
      }

      const result = await CashFlow.aggregate([
        {
          $match: match
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
            count: { $sum: 1 }
          }
        }
      ])

      monthlyData.push({
        month,
        year: selectedYear,
        total: result.length > 0 ? result[0].total : 0,
        count: result.length > 0 ? result[0].count : 0
      })
    }

    res.json(monthlyData)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Update cash flow
const updateCashFlow = async (req, res) => {
  try {
    const { id } = req.params
    const updatedCashFlow = await CashFlow.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
    .populate('category')
    .populate('item')
    
    if (!updatedCashFlow) {
      return res.status(404).json({ message: "Cash flow record not found" })
    }
    
    res.json(updatedCashFlow)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// Delete cash flow
const deleteCashFlow = async (req, res) => {
  try {
    const { id } = req.params
    const deletedCashFlow = await CashFlow.findByIdAndDelete(id)
    
    if (!deletedCashFlow) {
      return res.status(404).json({ message: "Cash flow record not found" })
    }
    
    res.json({ message: "Cash flow record deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Category controllers
const createCategory = async (req, res) => {
  try {
    const category = new Category(req.body)
    const savedCategory = await category.save()
    res.status(201).json(savedCategory)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

const getCategories = async (req, res) => {
  try {
    const { type } = req.query
    let categories
    
    if (type && type !== "All") {
      categories = await Category.getByType(type)
    } else {
      categories = await Category.find().sort({ type: 1, name: 1 })
    }
    
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Item controllers
const createItem = async (req, res) => {
  try {
    const item = new Item(req.body)
    const savedItem = await item.save()
    res.status(201).json(savedItem)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

const getItems = async (req, res) => {
  try {
    const { categoryId } = req.params
    const items = await Item.getByCategory(categoryId)
    res.json(items)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get all items by type (for dropdowns)
const getItemsByType = async (req, res) => {
  try {
    const { type } = req.query
    
    if (!type) {
      return res.status(400).json({ message: "Type is required" })
    }
    
    const items = await Item.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      {
        $unwind: "$categoryDetails"
      },
      {
        $match: {
          "categoryDetails.type": type
        }
      },
      {
        $sort: { name: 1 }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          category: 1,
          "categoryDetails.name": 1
        }
      }
    ])
    
    res.json(items)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
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
}