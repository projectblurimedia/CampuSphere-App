const mongoose = require('mongoose')

const feeSchema = new mongoose.Schema({
  // Basic Information
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required'],
    index: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    index: true
  },
  
  // Term Information
  termType: {
    type: String,
    enum: ['term-1', 'term-2', 'term-3', 'term-4', 'annual', 'custom'],
    required: [true, 'Term type is required']
  },
  termNumber: {
    type: Number,
    min: 1,
    max: 4
  },
  customTermName: {
    type: String,
    trim: true
  },
  
  // Fee Amounts
  baseAmount: {
    type: Number,
    required: [true, 'Base amount is required'],
    min: 0
  },
  busAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  otherCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  previousBalance: {
    type: Number,
    default: 0
  },
  
  // Discounts
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', 'category', 'none'],
    default: 'none'
  },
  discountValue: {
    type: Number,
    default: 0,
    min: 0
  },
  discountReason: {
    type: String,
    trim: true
  },
  discountedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Late Fees
  lateFeeAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  lateFeeReason: {
    type: String,
    trim: true
  },
  
  // Final Calculations
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  outstandingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Dates
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    index: true
  },
  paymentDate: {
    type: Date,
    index: true
  },
  
  // Payment Information
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
  receiptNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  
  // Bus Information (if applicable)
  busRoute: {
    type: String,
    trim: true
  },
  villageName: {
    type: String,
    trim: true
  },
  busStop: {
    type: String,
    trim: true
  },
  hasTransport: {
    type: Boolean,
    default: false
  },
  
  // Class Information
  className: {
    type: String,
    required: true,
    index: true
  },
  
  // Remarks
  remarks: {
    type: String,
    trim: true
  },
  
  // Audit Trail
  createdBy: {
    type: String,
    required: true,
    index: true
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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
feeSchema.index({ studentId: 1, academicYear: 1, termType: 1 }, { unique: true })
feeSchema.index({ academicYear: 1, status: 1 })
feeSchema.index({ dueDate: 1, status: 1 })
feeSchema.index({ studentId: 1, status: 1 })
feeSchema.index({ className: 1, academicYear: 1 })
feeSchema.index({ 'busRoute': 1, 'villageName': 1 })

// Virtual for remaining amount
feeSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.totalAmount - this.paidAmount)
})

// Virtual for isOverdue
feeSchema.virtual('isOverdue').get(function() {
  const now = new Date()
  return this.dueDate < now && this.status !== 'paid' && this.status !== 'cancelled'
})

// Virtual for discount percentage
feeSchema.virtual('discountPercentage').get(function() {
  if (this.baseAmount === 0) return 0
  return ((this.discountedAmount / this.baseAmount) * 100).toFixed(2)
})

// Pre-save middleware to calculate amounts
feeSchema.pre('save', function(next) {
  // Calculate discounted amount
  let discountedBase = this.baseAmount
  
  if (this.discountType === 'percentage' && this.discountValue > 0) {
    this.discountedAmount = (this.baseAmount * this.discountValue) / 100
    discountedBase = this.baseAmount - this.discountedAmount
  } else if (this.discountType === 'fixed' && this.discountValue > 0) {
    this.discountedAmount = Math.min(this.discountValue, this.baseAmount)
    discountedBase = this.baseAmount - this.discountedAmount
  }
  
  // Calculate total amount
  this.totalAmount = discountedBase + 
                     (this.hasTransport ? this.busAmount : 0) + 
                     this.otherCharges + 
                     this.previousBalance + 
                     this.lateFeeAmount
  
  // Calculate outstanding amount
  this.outstandingAmount = Math.max(0, this.totalAmount - this.paidAmount)
  
  // Update status based on payments
  if (this.paidAmount >= this.totalAmount) {
    this.status = 'paid'
  } else if (this.paidAmount > 0) {
    this.status = 'partial'
  } else if (this.isOverdue) {
    this.status = 'overdue'
  }
  
  // Update timestamp
  this.updatedAt = new Date()
  
  next()
})

// Method to apply payment
feeSchema.methods.applyPayment = function(paymentData) {
  const {
    amount,
    paymentMode = 'cash',
    transactionId = '',
    chequeNumber = '',
    bankName = '',
    paymentDate = new Date(),
    remarks = '',
    updatedBy
  } = paymentData

  // Validate payment amount
  if (amount <= 0) {
    throw new Error('Payment amount must be greater than 0')
  }

  const remaining = this.totalAmount - this.paidAmount
  if (amount > remaining) {
    throw new Error(`Payment amount cannot exceed remaining amount of ${remaining}`)
  }

  // Update payment details
  this.paidAmount += amount
  this.paymentMode = paymentMode
  this.transactionId = transactionId
  this.chequeNumber = chequeNumber
  this.bankName = bankName
  this.paymentDate = new Date(paymentDate)
  this.updatedBy = updatedBy
  
  if (remarks) {
    this.remarks = this.remarks ? `${this.remarks} ${remarks}` : remarks
  }

  return this.save()
}

// Method to apply discount
feeSchema.methods.applyDiscount = function(discountData) {
  const {
    type,
    value,
    reason,
    updatedBy
  } = discountData

  if (value <= 0) {
    throw new Error('Discount value must be greater than 0')
  }

  if (type === 'percentage' && value > 100) {
    throw new Error('Discount percentage cannot exceed 100%')
  }

  if (type === 'fixed' && value > this.baseAmount) {
    throw new Error('Fixed discount cannot exceed base amount')
  }

  this.discountType = type
  this.discountValue = value
  this.discountReason = reason
  this.updatedBy = updatedBy

  return this.save()
}

// Method to add late fee
feeSchema.methods.addLateFee = function(lateFeeData) {
  const {
    amount,
    reason,
    updatedBy
  } = lateFeeData

  if (amount <= 0) {
    throw new Error('Late fee amount must be greater than 0')
  }

  this.lateFeeAmount += amount
  this.lateFeeReason = this.lateFeeReason ? 
    `${this.lateFeeReason} ${reason}` : reason
  this.updatedBy = updatedBy

  return this.save()
}

module.exports = mongoose.model('Fee', feeSchema)