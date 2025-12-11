const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
  // Personal Information
  admissionNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', null]
  },

  // Contact Information
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true
  },
  phone: String,
  address: {
    permanent: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },
    temporary: {
      street: String,
      city: String,
      state: String,
      pincode: String
    }
  },

  // Parent/Guardian Information
  fatherName: {
    type: String,
    required: true,
    trim: true
  },
  fatherOccupation: String,
  fatherPhone: String,
  fatherEmail: String,
  
  motherName: {
    type: String,
    required: true,
    trim: true
  },
  motherOccupation: String,
  motherPhone: String,
  motherEmail: String,
  
  guardianName: String,
  guardianRelation: String,
  guardianPhone: String,
  guardianEmail: String,

  // Academic Information
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  currentClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  section: String,
  rollNo: Number,
  admissionDate: {
    type: Date,
    default: Date.now
  },
  academicYear: {
    type: String,
    required: true
  },

  // Medical Information
  medicalConditions: [String],
  allergies: [String],
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },

  // Documents
  documents: [{
    name: String,
    documentType: {
      type: String,
      enum: ['birth_certificate', 'transfer_certificate', 'aadhar', 'photos', 'medical', 'other']
    },
    fileUrl: String,
    publicId: String,
    uploadedAt: Date
  }],

  // Photo
  photo: {
    url: String,
    publicId: String
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'alumni', 'transferred'],
    default: 'active'
  },

  // Transportation
  usesTransport: {
    type: Boolean,
    default: false
  },
  transportRoute: String,
  transportStop: String,

  // Fees
  feeCategory: {
    type: String,
    enum: ['general', 'sc/st', 'obc', 'ews', 'other'],
    default: 'general'
  },
  feeDiscount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Authentication
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Virtuals
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim()
})

studentSchema.virtual('age').get(function() {
  const today = new Date()
  const birthDate = new Date(this.dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
})

// Indexes
studentSchema.index({ school: 1, admissionNo: 1 }, { unique: true })
studentSchema.index({ school: 1, currentClass: 1, rollNo: 1 })
studentSchema.index({ school: 1, status: 1 })
studentSchema.index({ 'userId': 1 })

// Pre-save middleware to generate admission number if not provided
studentSchema.pre('save', async function(next) {
  if (!this.admissionNo) {
    const Student = mongoose.model('Student')
    const year = new Date().getFullYear().toString().slice(-2)
    const count = await Student.countDocuments({ 
      school: this.school,
      admissionDate: { $gte: new Date(new Date().getFullYear(), 0, 1) }
    })
    this.admissionNo = `ADM${year}${(count + 1).toString().padStart(4, '0')}`
  }
  next()
})

// Post-save middleware to update school statistics
studentSchema.post('save', async function() {
  if (this.school) {
    const School = require('./School')
    const school = await School.findById(this.school)
    if (school) {
      await school.updateStatistics()
    }
  }
})

// Post-remove middleware to update school statistics
studentSchema.post('remove', async function() {
  if (this.school) {
    const School = require('./School')
    const school = await School.findById(this.school)
    if (school) {
      await school.updateStatistics()
    }
  }
})

const Student = mongoose.model('Student', studentSchema)
module.exports = Student