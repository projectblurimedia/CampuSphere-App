const mongoose = require('mongoose')

const schoolSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true
  },
  motto: {
    type: String,
    trim: true
  },
  establishedYear: {
    type: Number,
    required: [true, 'Establishment year is required']
  },
  affiliation: {
    type: String,
    trim: true
  },
  board: {
    type: String,
    trim: true
  },

  // Administration
  principal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  vicePrincipal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },

  // Contact Information
  address: {
    street: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India'
    },
    pincode: String,
    fullAddress: String
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },

  // Statistics (will be calculated dynamically)
  totalStudents: {
    type: Number,
    default: 0
  },
  totalTeachers: {
    type: Number,
    default: 0
  },
  totalStaff: {
    type: Number,
    default: 0
  },
  totalClassrooms: {
    type: Number,
    default: 0
  },

  // Timings
  schoolHours: {
    start: String,
    end: String,
    display: String
  },
  officeHours: {
    start: String,
    end: String,
    display: String
  },
  workingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  assemblyTime: String,

  // Facilities
  facilities: [{
    name: String,
    description: String,
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],

  // Mission & Vision
  mission: String,
  vision: String,

  // Additional Information
  campusArea: String,
  libraryBooks: Number,
  computerSystems: Number,

  // Images
  images: [{
    url: String,
    publicId: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Social Media
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    youtube: String
  },

  // Settings
  academicYear: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
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
  timestamps: true
})

// Virtual for formatted address
schoolSchema.virtual('formattedAddress').get(function() {
  if (this.address.fullAddress) {
    return this.address.fullAddress
  }
  
  const parts = []
  if (this.address.street) parts.push(this.address.street)
  if (this.address.city) parts.push(this.address.city)
  if (this.address.state) parts.push(this.address.state)
  if (this.address.pincode) parts.push(this.address.pincode)
  if (this.address.country) parts.push(this.address.country)
  
  return parts.join(', ')
})

// Method to update statistics
schoolSchema.methods.updateStatistics = async function() {
  const Student = require('./Student')
  const Staff = require('./Staff')
  const Class = require('./Class')
  
  try {
    const totalStudents = await Student.countDocuments({ school: this._id, status: 'active' })
    const totalTeachers = await Staff.countDocuments({ 
      school: this._id, 
      status: 'active',
      role: 'teacher'
    })
    const totalStaff = await Staff.countDocuments({ 
      school: this._id, 
      status: 'active'
    })
    const totalClassrooms = await Class.countDocuments({ school: this._id, status: 'active' })
    
    this.totalStudents = totalStudents
    this.totalTeachers = totalTeachers
    this.totalStaff = totalStaff
    this.totalClassrooms = totalClassrooms
    
    await this.save()
    return this
  } catch (error) {
    throw error
  }
}

// Static method to get school profile with statistics
schoolSchema.statics.getSchoolProfile = async function(schoolId) {
  const school = await this.findById(schoolId)
    .populate('principal', 'firstName lastName email phone designation')
    .populate('vicePrincipal', 'firstName lastName email phone designation')
    .lean()
  
  if (!school) {
    throw new Error('School not found')
  }
  
  school.formattedAddress = school.address.fullAddress || 
    `${school.address.street}, ${school.address.city}, ${school.address.state} - ${school.address.pincode}, ${school.address.country}`
  
  return school
}

const School = mongoose.model('School', schoolSchema)
module.exports = School