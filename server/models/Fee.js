const mongoose = require('mongoose')

const feeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required'],
    index: true // Index here
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    enum: ['2023-2024', '2024-2025', '2025-2026', '2026-2027'],
    index: true // Index here
  },
  term: {
    type: String,
    required: [true, 'Term is required'],
    enum: ['term-1', 'term-2', 'term-3', 'annual', 'custom']
  },
  termNumber: {
    type: Number,
    min: 1,
    max: 3
  },
  customTermName: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    index: true // Index here
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  lateFee: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
    index: true // Index here
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'cheque', 'online', 'card', 'upi', 'bank-transfer', 'other'],
    default: 'cash'
  },
  transactionId: {
    type: String,
    trim: true
  },
  chequeNumber: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  paymentDate: {
    type: Date,
    index: true // Index here
  },
  receiptNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  remarks: {
    type: String,
    trim: true
  },
  previousBalance: {
    type: Number,
    default: 0
  },
  carryForward: {
    type: Number,
    default: 0
  },
  // Fee breakdown
  breakdown: {
    tuitionFee: {
      type: Number,
      default: 0
    },
    transportFee: {
      type: Number,
      default: 0
    },
    otherFees: {
      type: Number,
      default: 0
    },
    previousDue: {
      type: Number,
      default: 0
    },
    lateFee: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: String,
    required: [true, 'Created by is required'],
    index: true // Index here
  },
  updatedBy: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// REMOVE these duplicate index definitions (they're already defined above):
// feeSchema.index({ studentId: 1, academicYear: 1 })
// feeSchema.index({ status: 1 })
// feeSchema.index({ dueDate: 1 })
// feeSchema.index({ receiptNumber: 1 }, { unique: true, sparse: true })
// feeSchema.index({ studentId: 1, term: 1, academicYear: 1 })
// feeSchema.index({ paymentDate: 1 })
// feeSchema.index({ createdBy: 1 })

// Keep ONLY compound indexes (not already defined individually):
feeSchema.index({ 
  academicYear: 1,
  status: 1,
  dueDate: 1 
})

feeSchema.index({
  studentId: 1,
  academicYear: 1,
  status: 1
})

// Add compound indexes for common queries
feeSchema.index({ studentId: 1, dueDate: 1 })
feeSchema.index({ academicYear: 1, paymentDate: 1 })
feeSchema.index({ status: 1, paymentDate: 1 })

// Virtual for outstanding amount
feeSchema.virtual('outstandingAmount').get(function() {
  return this.totalAmount - this.paidAmount
})

// Virtual for isOverdue
feeSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'paid'
})

// Method to make payment
feeSchema.methods.makePayment = function(paymentData) {
  const {
    paidAmount,
    paymentMode = 'cash',
    transactionId = '',
    chequeNumber = '',
    bankName = '',
    paymentDate = new Date(),
    remarks = '',
    updatedBy
  } = paymentData

  // Validate payment amount
  if (paidAmount <= 0) {
    throw new Error('Payment amount must be greater than 0')
  }

  if (paidAmount > this.totalAmount - this.paidAmount) {
    throw new Error(`Payment amount cannot exceed outstanding amount of ${this.totalAmount - this.paidAmount}`)
  }

  this.paidAmount += paidAmount
  
  // Update status
  if (this.paidAmount >= this.totalAmount) {
    this.status = 'paid'
  } else if (this.paidAmount > 0) {
    this.status = 'partial'
  }
  
  // Update payment details
  this.paymentMode = paymentMode
  this.transactionId = transactionId
  this.chequeNumber = chequeNumber
  this.bankName = bankName
  this.paymentDate = paymentDate ? new Date(paymentDate) : new Date()
  this.remarks = remarks
  this.updatedBy = updatedBy
  this.updatedAt = new Date()

  return this.save()
}

// Method to add late fee
feeSchema.methods.addLateFee = function(lateFeeAmount, remarks, updatedBy) {
  if (lateFeeAmount <= 0) {
    throw new Error('Late fee amount must be greater than 0')
  }

  this.lateFee += lateFeeAmount
  this.totalAmount += lateFeeAmount
  this.breakdown.lateFee += lateFeeAmount
  this.remarks = this.remarks ? `${this.remarks}; ${remarks}` : remarks
  this.updatedBy = updatedBy
  this.updatedAt = new Date()

  return this.save()
}

// Method to apply discount
feeSchema.methods.applyDiscount = function(discountAmount, discountReason, updatedBy) {
  if (discountAmount <= 0) {
    throw new Error('Discount amount must be greater than 0')
  }

  if (discountAmount > this.amount) {
    throw new Error('Discount cannot exceed original amount')
  }

  this.discountAmount += discountAmount
  this.totalAmount -= discountAmount
  this.breakdown.discount += discountAmount
  this.remarks = this.remarks ? `${this.remarks}; Discount applied: ${discountReason}` : `Discount applied: ${discountReason}`
  this.updatedBy = updatedBy
  this.updatedAt = new Date()

  return this.save()
}

// Static method to get outstanding fees for a student
feeSchema.statics.getStudentOutstandingFees = async function(studentId, academicYear) {
  const fees = await this.find({
    studentId,
    academicYear: academicYear || '2024-2025',
    status: { $in: ['pending', 'partial', 'overdue'] }
  }).sort({ dueDate: 1 })

  let totalOutstanding = 0
  let totalOverdue = 0
  let upcomingFees = []

  fees.forEach(fee => {
    const outstanding = fee.totalAmount - fee.paidAmount
    totalOutstanding += outstanding

    if (fee.dueDate < new Date()) {
      totalOverdue += outstanding
    } else {
      upcomingFees.push({
        feeId: fee._id,
        term: fee.term,
        dueDate: fee.dueDate,
        amount: fee.totalAmount,
        paid: fee.paidAmount,
        outstanding: outstanding,
        status: fee.status
      })
    }
  })

  return {
    studentId,
    academicYear: academicYear || '2024-2025',
    totalOutstanding,
    totalOverdue,
    upcomingFees,
    feeCount: fees.length
  }
}

// Static method to generate fee receipt
feeSchema.statics.generateFeeReceipt = async function(feeId) {
  const fee = await this.findById(feeId)
    .populate('studentId', 'firstName lastName admissionNo class section parentName')
  
  if (!fee) {
    throw new Error('Fee record not found')
  }

  const receipt = {
    receiptNumber: fee.receiptNumber,
    date: fee.paymentDate || new Date(),
    student: {
      name: `${fee.studentId.firstName} ${fee.studentId.lastName}`,
      admissionNo: fee.studentId.admissionNo,
      class: fee.studentId.class,
      section: fee.studentId.section,
      parent: fee.studentId.parentName
    },
    academicYear: fee.academicYear,
    term: fee.term,
    customTermName: fee.customTermName,
    breakdown: {
      tuitionFee: fee.breakdown.tuitionFee,
      transportFee: fee.breakdown.transportFee,
      otherFees: fee.breakdown.otherFees,
      previousDue: fee.breakdown.previousDue,
      lateFee: fee.breakdown.lateFee,
      discount: fee.breakdown.discount
    },
    amounts: {
      totalAmount: fee.totalAmount,
      paidAmount: fee.paidAmount,
      outstandingAmount: fee.totalAmount - fee.paidAmount,
      discountAmount: fee.discountAmount,
      lateFee: fee.lateFee
    },
    payment: {
      mode: fee.paymentMode,
      transactionId: fee.transactionId,
      chequeNumber: fee.chequeNumber,
      bankName: fee.bankName
    },
    dates: {
      dueDate: fee.dueDate,
      paymentDate: fee.paymentDate,
      createdAt: fee.createdAt
    },
    status: fee.status,
    remarks: fee.remarks
  }

  return receipt
}

// Static method to get fee collection report
feeSchema.statics.getFeeCollectionReport = async function(startDate, endDate, academicYear) {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  const fees = await this.find({
    paymentDate: { $gte: start, $lte: end },
    academicYear: academicYear || '2024-2025',
    status: { $in: ['paid', 'partial'] }
  })
  .populate('studentId', 'firstName lastName class section')
  .sort({ paymentDate: -1 })

  let totalCollection = 0
  let cashCollection = 0
  let onlineCollection = 0
  let chequeCollection = 0
  let otherCollection = 0
  const dailyCollections = {}

  fees.forEach(fee => {
    totalCollection += fee.paidAmount

    // Categorize by payment mode
    switch (fee.paymentMode) {
      case 'cash':
        cashCollection += fee.paidAmount
        break
      case 'online':
      case 'card':
      case 'upi':
      case 'bank-transfer':
        onlineCollection += fee.paidAmount
        break
      case 'cheque':
        chequeCollection += fee.paidAmount
        break
      default:
        otherCollection += fee.paidAmount
    }

    // Group by date
    const dateStr = fee.paymentDate.toISOString().split('T')[0]
    if (!dailyCollections[dateStr]) {
      dailyCollections[dateStr] = 0
    }
    dailyCollections[dateStr] += fee.paidAmount
  })

  // Convert daily collections to array
  const dailyCollectionArray = Object.entries(dailyCollections)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  return {
    period: { start, end },
    academicYear: academicYear || '2024-2025',
    summary: {
      totalFees: fees.length,
      totalCollection,
      cashCollection,
      onlineCollection,
      chequeCollection,
      otherCollection
    },
    dailyCollections: dailyCollectionArray,
    modeWisePercentage: {
      cash: totalCollection > 0 ? ((cashCollection / totalCollection) * 100).toFixed(2) : 0,
      online: totalCollection > 0 ? ((onlineCollection / totalCollection) * 100).toFixed(2) : 0,
      cheque: totalCollection > 0 ? ((chequeCollection / totalCollection) * 100).toFixed(2) : 0,
      other: totalCollection > 0 ? ((otherCollection / totalCollection) * 100).toFixed(2) : 0
    }
  }
}

module.exports = mongoose.model('Fee', feeSchema)