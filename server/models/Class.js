const mongoose = require('mongoose')

const classSchema = new mongoose.Schema({
  // Basic Information
  className: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },

  // Academic Information
  academicYear: {
    type: String,
    required: true
  },
  gradeLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  stream: {
    type: String,
    enum: ['Science', 'Commerce', 'Arts', 'General', null],
    default: null
  },

  // Class Management
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  assistantTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    }
  }],

  // Classroom Information
  classroomNo: String,
  floor: Number,
  capacity: {
    type: Number,
    default: 40
  },
  facilities: [String],

  // Timetable
  timetable: {
    monday: [{
      period: Number,
      subject: mongoose.Schema.Types.ObjectId,
      teacher: mongoose.Schema.Types.ObjectId,
      startTime: String,
      endTime: String
    }],
    tuesday: [{
      period: Number,
      subject: mongoose.Schema.Types.ObjectId,
      teacher: mongoose.Schema.Types.ObjectId,
      startTime: String,
      endTime: String
    }],
    wednesday: [{
      period: Number,
      subject: mongoose.Schema.Types.ObjectId,
      teacher: mongoose.Schema.Types.ObjectId,
      startTime: String,
      endTime: String
    }],
    thursday: [{
      period: Number,
      subject: mongoose.Schema.Types.ObjectId,
      teacher: mongoose.Schema.Types.ObjectId,
      startTime: String,
      endTime: String
    }],
    friday: [{
      period: Number,
      subject: mongoose.Schema.Types.ObjectId,
      teacher: mongoose.Schema.Types.ObjectId,
      startTime: String,
      endTime: String
    }],
    saturday: [{
      period: Number,
      subject: mongoose.Schema.Types.ObjectId,
      teacher: mongoose.Schema.Types.ObjectId,
      startTime: String,
      endTime: String
    }]
  },

  // Statistics (will be calculated dynamically)
  totalStudents: {
    type: Number,
    default: 0
  },
  maleStudents: {
    type: Number,
    default: 0
  },
  femaleStudents: {
    type: Number,
    default: 0
  },

  // Fees
  feeStructure: [{
    feeType: {
      type: String,
      enum: ['tuition', 'development', 'exam', 'sports', 'library', 'transport', 'other']
    },
    amount: Number,
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'half-yearly', 'yearly', 'one-time']
    }
  }],

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated'],
    default: 'active'
  },

  // Meta Information
  description: String,
  notes: String,

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

// Virtual for full class name
classSchema.virtual('fullClassName').get(function() {
  if (this.displayName) {
    return `${this.displayName} (${this.section})`
  }
  return `${this.className} - ${this.section}`
})

// Virtual for stream display
classSchema.virtual('streamDisplay').get(function() {
  if (!this.stream) return ''
  return this.stream === 'General' ? '' : ` - ${this.stream}`
})

// Indexes
classSchema.index({ school: 1, className: 1, section: 1, academicYear: 1 }, { unique: true })
classSchema.index({ school: 1, gradeLevel: 1 })
classSchema.index({ school: 1, classTeacher: 1 })
classSchema.index({ school: 1, status: 1 })

// Pre-save middleware to generate display name
classSchema.pre('save', function(next) {
  if (!this.displayName) {
    const gradeNames = {
      1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
      6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X',
      11: 'XI', 12: 'XII'
    }
    this.displayName = `Class ${gradeNames[this.gradeLevel] || this.gradeLevel}`
  }
  next()
})

// Method to update class statistics
classSchema.methods.updateStatistics = async function() {
  const Student = require('./Student')
  
  try {
    const students = await Student.find({ 
      currentClass: this._id,
      status: 'active'
    })
    
    this.totalStudents = students.length
    this.maleStudents = students.filter(s => s.gender === 'Male').length
    this.femaleStudents = students.filter(s => s.gender === 'Female').length
    
    await this.save()
    return this
  } catch (error) {
    throw error
  }
}

// Post-save middleware to update statistics
classSchema.post('save', async function() {
  await this.updateStatistics()
  
  // Also update school statistics
  if (this.school) {
    const School = require('./School')
    const school = await School.findById(this.school)
    if (school) {
      await school.updateStatistics()
    }
  }
})

const Class = mongoose.model('Class', classSchema)
module.exports = Class