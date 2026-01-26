const mongoose = require('mongoose')

const hostelFeeStructureSchema = new mongoose.Schema({
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true,
    index: true
  },
  className: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    index: true
  },
  totalAnnualFee: {
    type: Number,
    required: [true, 'Total annual fee is required'],
    min: 0
  },
  totalTerms: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
    default: 3
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: String,
    required: true
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

// Index for unique hostel fee structure per academic year and class
hostelFeeStructureSchema.index({ 
  academicYear: 1, 
  className: 1 
}, { unique: true })

// Virtual for term-wise amounts
hostelFeeStructureSchema.virtual('termAmount').get(function() {
  return this.totalAnnualFee / this.totalTerms
})

module.exports = mongoose.model('HostelFeeStructure', hostelFeeStructureSchema)