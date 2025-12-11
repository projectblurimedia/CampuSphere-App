const mongoose = require('mongoose')

const staffSchema = new mongoose.Schema({
  // Personal Information
  employeeId: {
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
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  alternatePhone: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },

  // Employment Details
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  department: {
    type: String,
    enum: ['Teaching', 'Administration', 'Accounts', 'Library', 'Laboratory', 'Transport', 'Security', 'Housekeeping', 'Other']
  },
  designation: {
    type: String,
    required: true,
    enum: ['Principal', 'Vice Principal', 'Headmaster', 'Teacher', 'Accountant', 'Librarian', 'Lab Assistant', 'Driver', 'Security Guard', 'Peon', 'Other']
  },
  role: {
    type: String,
    enum: ['teaching', 'non-teaching', 'administrative'],
    default: 'teaching'
  },
  qualification: [{
    degree: String,
    specialization: String,
    university: String,
    year: Number
  }],
  experience: [{
    organization: String,
    position: String,
    from: Date,
    to: Date,
    description: String
  }],
  dateOfJoining: {
    type: Date,
    default: Date.now
  },
  employmentType: {
    type: String,
    enum: ['permanent', 'contract', 'temporary', 'visiting'],
    default: 'permanent'
  },

  // Teaching Specific
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  isClassTeacher: {
    type: Boolean,
    default: false
  },
  classTeacherOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },

  // Salary Information
  salaryDetails: {
    basicSalary: Number,
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    panNumber: String,
    pfNumber: String,
    esiNumber: String
  },

  // Documents
  documents: [{
    name: String,
    documentType: {
      type: String,
      enum: ['aadhar', 'pan', 'qualification', 'experience', 'photos', 'appointment_letter', 'other']
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
    enum: ['active', 'inactive', 'resigned', 'retired', 'suspended'],
    default: 'active'
  },
  lastWorkingDate: Date,
  reasonForLeaving: String,

  // Authentication
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Timings
  workTimings: {
    start: String,
    end: String,
    breakStart: String,
    breakEnd: String
  },

  // Leaves
  availableLeaves: {
    casual: { type: Number, default: 12 },
    sick: { type: Number, default: 12 },
    earned: { type: Number, default: 30 }
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
staffSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim()
})

staffSchema.virtual('age').get(function() {
  const today = new Date()
  const birthDate = new Date(this.dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
})

staffSchema.virtual('experienceYears').get(function() {
  if (!this.dateOfJoining) return 0
  
  const today = new Date()
  const joinDate = new Date(this.dateOfJoining)
  let years = today.getFullYear() - joinDate.getFullYear()
  const monthDiff = today.getMonth() - joinDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < joinDate.getDate())) {
    years--
  }
  
  return years
})

// Indexes
staffSchema.index({ school: 1, employeeId: 1 }, { unique: true })
staffSchema.index({ school: 1, department: 1 })
staffSchema.index({ school: 1, role: 1 })
staffSchema.index({ school: 1, status: 1 })
staffSchema.index({ userId: 1 })

// Pre-save middleware to generate employee ID if not provided
staffSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const Staff = mongoose.model('Staff')
    const schoolCode = this.school.toString().slice(-4)
    const year = new Date().getFullYear().toString().slice(-2)
    const count = await Staff.countDocuments({ 
      school: this.school,
      dateOfJoining: { $gte: new Date(new Date().getFullYear(), 0, 1) }
    })
    this.employeeId = `EMP${schoolCode}${year}${(count + 1).toString().padStart(4, '0')}`
  }
  next()
})

// Post-save middleware to update school statistics
staffSchema.post('save', async function() {
  if (this.school) {
    const School = require('./School')
    const school = await School.findById(this.school)
    if (school) {
      await school.updateStatistics()
    }
  }
})

// Post-remove middleware to update school statistics
staffSchema.post('remove', async function() {
  if (this.school) {
    const School = require('./School')
    const school = await School.findById(this.school)
    if (school) {
      await school.updateStatistics()
    }
  }
})

const Staff = mongoose.model('Staff', staffSchema)
module.exports = Staff