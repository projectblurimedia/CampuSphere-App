const mongoose = require('mongoose')

const subjectSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // School Information
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  
  // Academic Information
  department: {
    type: String,
    enum: ['Science', 'Commerce', 'Arts', 'General', 'Vocational', 'Languages', 'Physical Education', 'Computer Science', null],
    default: null
  },
  gradeLevel: {
    type: String,
    enum: ['Primary', 'Middle', 'Secondary', 'Senior Secondary', 'All'],
    default: 'All'
  },
  isElective: {
    type: Boolean,
    default: false
  },
  electiveGroup: {
    type: String,
    enum: ['Science', 'Commerce', 'Arts', 'Languages', 'Other', null]
  },
  
  // Teaching Information
  credits: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  weeklyPeriods: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  duration: {
    type: String,
    enum: ['Full Year', 'Semester', 'Term'],
    default: 'Full Year'
  },
  
  // Assessment
  assessmentPattern: {
    theory: {
      maxMarks: { type: Number, default: 70 },
      passMarks: { type: Number, default: 23 }
    },
    practical: {
      maxMarks: { type: Number, default: 30 },
      passMarks: { type: Number, default: 10 }
    },
    internal: {
      maxMarks: { type: Number, default: 0 },
      passMarks: { type: Number, default: 0 }
    }
  },
  
  // Resources
  textbooks: [{
    title: String,
    author: String,
    publisher: String,
    edition: String
  }],
  referenceBooks: [{
    title: String,
    author: String,
    publisher: String
  }],
  
  // Syllabus
  syllabus: [{
    unit: String,
    topics: [String],
    weightage: Number
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  
  // Meta Information
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
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

// Virtual for total marks
subjectSchema.virtual('totalMarks').get(function() {
  const { theory, practical, internal } = this.assessmentPattern
  return theory.maxMarks + practical.maxMarks + internal.maxMarks
})

// Virtual for pass marks
subjectSchema.virtual('totalPassMarks').get(function() {
  const { theory, practical, internal } = this.assessmentPattern
  return theory.passMarks + practical.passMarks + internal.passMarks
})

// Indexes
subjectSchema.index({ school: 1, code: 1 }, { unique: true })
subjectSchema.index({ school: 1, name: 1 })
subjectSchema.index({ school: 1, department: 1 })
subjectSchema.index({ school: 1, gradeLevel: 1 })
subjectSchema.index({ school: 1, status: 1 })

// Pre-save middleware to generate code if not provided
subjectSchema.pre('save', async function(next) {
  if (!this.code) {
    const Subject = mongoose.model('Subject')
    const schoolCode = this.school.toString().slice(-3).toUpperCase()
    const nameCode = this.name.substring(0, 3).toUpperCase()
    const count = await Subject.countDocuments({ school: this.school })
    this.code = `${schoolCode}${nameCode}${(count + 1).toString().padStart(3, '0')}`
  }
  next()
})

// Method to get subject teachers
subjectSchema.methods.getSubjectTeachers = async function() {
  const Staff = require('./Staff')
  
  try {
    const teachers = await Staff.find({
      school: this.school,
      subjects: this._id,
      status: 'active'
    }).select('firstName lastName employeeId email phone designation')
    
    return teachers
  } catch (error) {
    throw error
  }
}

// Method to get classes offering this subject
subjectSchema.methods.getOfferingClasses = async function() {
  const Class = require('./Class')
  
  try {
    const classes = await Class.find({
      school: this.school,
      'subjects.subject': this._id,
      status: 'active'
    }).select('className section gradeLevel classTeacher')
    
    return classes
  } catch (error) {
    throw error
  }
}

const Subject = mongoose.model('Subject', subjectSchema)
module.exports = Subject