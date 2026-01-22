const mongoose = require('mongoose')

const busFeeStructureSchema = new mongoose.Schema({
  villageName: {
    type: String,
    required: [true, 'Village name is required'],
    trim: true,
    index: true
  },
  distance: {
    type: Number,
    required: [true, 'Distance is required'],
    min: 0
  },
  feeAmount: {
    type: Number,
    required: [true, 'Fee amount is required'],
    min: 0
  },
  vehicleType: {
    type: String,
    enum: ['bus', 'van', 'auto', 'other'],
    default: 'bus'
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    index: true
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

// Index for unique bus fee structure
busFeeStructureSchema.index({ 
  villageName: 1, 
  academicYear: 1 
}, { unique: true })

module.exports = mongoose.model('BusFeeStructure', busFeeStructureSchema)