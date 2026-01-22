const mongoose = require('mongoose')

const classFeeStructureSchema = new mongoose.Schema({
  className: {
    type: String,
    required: [true, 'Class name is required'],
    index: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
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
  tuitionFee: {
    type: Number,
    default: 0,
    min: 0
  },
  examFee: {
    type: Number,
    default: 0,
    min: 0
  },
  activityFee: {
    type: Number,
    default: 0,
    min: 0
  },
  libraryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  sportsFee: {
    type: Number,
    default: 0,
    min: 0
  },
  labFee: {
    type: Number,
    default: 0,
    min: 0
  },
  computerFee: {
    type: Number,
    default: 0,
    min: 0
  },
  otherCharges: {
    type: Number,
    default: 0,
    min: 0
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

// Index for unique class fee structure per academic year
classFeeStructureSchema.index({ className: 1, academicYear: 1 }, { unique: true })

// Virtual for term-wise amounts
classFeeStructureSchema.virtual('termAmount').get(function() {
  return this.totalAnnualFee / this.totalTerms
})

module.exports = mongoose.model('ClassFeeStructure', classFeeStructureSchema)