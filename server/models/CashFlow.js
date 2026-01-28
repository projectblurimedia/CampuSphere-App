// models/CashFlow.js
const mongoose = require("mongoose")

const cashFlowSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Income", "Expense"],
      required: true,
      index: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    person: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "Cheque", "Online", "Credit Card", "Other"],
      default: "Cash"
    }
  },
  { 
    timestamps: true 
  }
)

// Indexes for better query performance
cashFlowSchema.index({ type: 1, date: -1 })
cashFlowSchema.index({ category: 1, date: -1 })
cashFlowSchema.index({ item: 1, date: -1 })
cashFlowSchema.index({ person: 1, date: -1 })

// Get cash flows by type and date range
cashFlowSchema.statics.getByDateRange = function (type, startDate, endDate) {
  const filter = {
    date: {
      $gte: startDate,
      $lte: endDate,
    }
  }
  
  if (type && type !== "All") {
    filter.type = type
  }
  
  return this.find(filter)
    .populate('category')
    .populate('item')
    .sort({ date: -1 })
}

// Get cash flows by category
cashFlowSchema.statics.getByCategory = function (categoryId) {
  return this.find({ 
    category: categoryId
  })
  .populate('category')
  .populate('item')
  .sort({ date: -1 })
}

// Get cash flows by item
cashFlowSchema.statics.getByItem = function (itemId) {
  return this.find({ 
    item: itemId
  })
  .populate('category')
  .populate('item')
  .sort({ date: -1 })
}

// Get total amount for date range
cashFlowSchema.statics.getTotal = function (type, startDate, endDate) {
  const match = {
    date: {
      $gte: startDate,
      $lte: endDate,
    }
  }
  
  if (type && type !== "All") {
    match.type = type
  }
  
  return this.aggregate([
    {
      $match: match
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
        count: { $sum: 1 },
        avgAmount: { $avg: "$amount" }
      },
    },
  ])
}

// Get category breakdown
cashFlowSchema.statics.getCategoryBreakdown = function (type, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: {
          $gte: startDate,
          $lte: endDate,
        },
        type: type
      },
    },
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
      $group: {
        _id: {
          categoryId: "$category",
          categoryName: "$categoryDetails.name"
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ])
}

module.exports = mongoose.model("CashFlow", cashFlowSchema)