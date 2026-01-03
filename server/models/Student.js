const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required'],
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Not Specified'],
    default: 'Not Specified'
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    enum: ['2023-2024', '2024-2025', '2025-2026', '2026-2027'], 
  },
  class: {
    type: Number,
    required: [true, 'Class is required'],
    min: 0,
    max: 12,
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    uppercase: true,
    enum: ['A', 'B', 'C', 'D', 'E'], 
  },
  admissionNo: {
    type: String,
    required: [true, 'Admission number is required'],
    unique: true,
    trim: true,
  },
  rollNo: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  village: {
    type: String,
    trim: true,
  },
  parentName: {
    type: String,
    required: [true, 'Parent/Guardian name is required'],
    trim: true,
  },
  parentPhone: {
    type: String,
    required: [true, 'Primary parent phone is required'],
    match: [/^\d{10}$/, 'Phone number must be 10 digits'],
  },
  parentPhone2: {
    type: String,
    match: [/^\d{10}$/, 'Alternate phone must be 10 digits'],
  },
  parentEmail: {
    type: String,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email'],
  },
  profilePic: {
    type: {
      url: {
        type: String,
        required: [true, 'Profile picture URL is required']
      },
      publicId: {
        type: String,
        required: [true, 'Profile picture public ID is required']
      }
    },
  },
  originalClassName: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

studentSchema.index({ class: 1, section: 1, academicYear: 1 })

studentSchema.pre('save', function() {
  this.updatedAt = Date.now()
  return Promise.resolve()
})

module.exports = mongoose.model('Student', studentSchema)