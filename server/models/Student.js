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
    enum: ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030', '2030-2031']
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
  studentType: {
    type: String,
    enum: ['Day Scholar', 'Hosteller'],
    default: 'Day Scholar',
    required: [true, 'Student type is required']
  },
  isUsingSchoolTransport: {
    type: Boolean,
    default: false,
  },
  // Fee discount fields
  schoolFeeDiscount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    validate: {
      validator: function(value) {
        return value >= 0 && value <= 100
      },
      message: 'School fee discount must be between 0 and 100 percent'
    }
  },
  transportFeeDiscount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    validate: {
      validator: function(value) {
        return value >= 0 && value <= 100
      },
      message: 'Transport fee discount must be between 0 and 100 percent'
    }
  },
  hostelFeeDiscount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    validate: {
      validator: function(value) {
        return value >= 0 && value <= 100
      },
      message: 'Hostel fee discount must be between 0 and 100 percent'
    }
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
  // Attendance array organized by academic year with session support
  attendance: [
    {
      academicYear: {
        type: String,
        required: true,
        enum: ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030', '2030-2031']
      },
      records: [
        {
          date: {
            type: Date,
            required: true
          },
          morning: {
            type: Boolean,
            default: null
          },
          afternoon: {
            type: Boolean,
            default: null
          },
          markedBy: {
            type: String,
          },
          updatedAt: {
            type: Date,
            default: Date.now
          }
        }
      ]
    }
  ],
  // Marks array organized by academic year with subject support
  marks: [
    {
      academicYear: {
        type: String,
        required: true,
        enum: ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030', '2030-2031']      
      },
      records: [
        {
          examType: {
            type: String,
            required: true,
            enum: ['formative-1', 'formative-2', 'formative-3', 'summative-1', 'summative-2', 'custom']
          },
          customExamName: {
            type: String,
            trim: true
          },
          subject: {
            type: String,
            required: true,
            enum: ['mathematics', 'science', 'english', 'hindi', 'social-studies', 'computer-science', 'physics', 'chemistry', 'biology']
          },
          marks: {
            type: Number,
            required: true,
            min: 0,
            max: 100
          },
          totalMarks: {
            type: Number,
            required: true,
            min: 0,
            max: 500
          },
          percentage: {
            type: Number,
            min: 0,
            max: 100
          },
          grade: {
            type: String,
            enum: ['A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'F', 'N/A'],
            default: 'N/A'
          },
          result: {
            type: String,
            enum: ['Pass', 'Fail', 'N/A'],
            default: 'N/A'
          },
          passingPercentage: {
            type: Number,
            default: 35,
            min: 0,
            max: 100
          },
          uploadedBy: {
            type: String,
          },
          uploadedAt: {
            type: Date,
            default: Date.now
          },
          updatedAt: {
            type: Date,
            default: Date.now
          }
        }
      ]
    }
  ],
  // Simplified fee details organized by academic year
  feeDetails: [
    {
      academicYear: {
        type: String,
        required: true,
        enum: ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030', '2030-2031']
      },
      schoolFee: {
        type: Number,
        required: [true, 'School fee is required'],
        min: 0,
        default: 0
      },
      transportFee: {
        type: Number,
        min: 0,
        default: 0
      },
      hostelFee: {
        type: Number,
        min: 0,
        default: 0
      },
      totalFee: {
        type: Number,
        min: 0,
        default: 0
      },
      terms: {
        type: Number,
        min: 1,
        max: 4,
        default: 3
      },
      schoolFeePaid: {
        type: Number,
        min: 0,
        default: 0
      },
      transportFeePaid: {
        type: Number,
        min: 0,
        default: 0
      },
      hostelFeePaid: {
        type: Number,
        min: 0,
        default: 0
      },
      totalPaid: {
        type: Number,
        min: 0,
        default: 0
      },
      totalDue: {
        type: Number,
        min: 0,
        default: 0
      },
      // Discounts applied for this academic year
      schoolFeeDiscountApplied: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      transportFeeDiscountApplied: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      hostelFeeDiscountApplied: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  // Payment history tracking individual fee components
  paymentHistory: [
    {
      paymentId: {
        type: String,
        required: [true, 'Payment ID is required'],
        trim: true
      },
      academicYear: {
        type: String,
        required: true,
        enum: ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030', '2030-2031']
      },
      date: {
        type: Date,
        required: [true, 'Payment date is required'],
        default: Date.now
      },
      // Individual fee component payments
      schoolFeePaid: {
        type: Number,
        min: 0,
        default: 0
      },
      transportFeePaid: {
        type: Number,
        min: 0,
        default: 0
      },
      hostelFeePaid: {
        type: Number,
        min: 0,
        default: 0
      },
      totalAmount: {
        type: Number,
        required: [true, 'Total payment amount is required'],
        min: 0
      },
      receiptNo: {
        type: String,
        required: [true, 'Receipt number is required'],
        trim: true
      },
      paymentMode: {
        type: String,
        required: [true, 'Payment mode is required'],
        enum: ['Cash', 'Cheque', 'Bank Transfer', 'Online Payment', 'Card', 'Other']
      },
      description: {
        type: String,
        trim: true
      },
      chequeNo: {
        type: String,
        trim: true
      },
      bankName: {
        type: String,
        trim: true
      },
      transactionId: {
        type: String,
        trim: true
      },
      receivedBy: {
        type: String,
        required: [true, 'Received by is required'],
        trim: true
      },
      status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
        default: 'Completed'
      },
      notes: {
        type: String,
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  feeCalculationDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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

// Indexes for attendance queries
studentSchema.index({ class: 1, section: 1, academicYear: 1 })
studentSchema.index({ 'attendance.academicYear': 1 })
studentSchema.index({ 'attendance.records.date': 1 })
studentSchema.index({ 'marks.academicYear': 1 })
studentSchema.index({ 'marks.records.examType': 1, 'marks.records.subject': 1 })
// Indexes for fee and payment queries
studentSchema.index({ 'feeDetails.academicYear': 1 })
studentSchema.index({ 'paymentHistory.academicYear': 1 })
studentSchema.index({ 'paymentHistory.date': 1 })
studentSchema.index({ 'paymentHistory.receiptNo': 1 })

// Compound indexes
studentSchema.index({ 
  'attendance.records.date': 1,
  'attendance.academicYear': 1
}, { 
  unique: false,
  sparse: true 
})

studentSchema.index({
  'marks.records.examType': 1,
  'marks.records.subject': 1,
  'marks.academicYear': 1
}, {
  unique: false,
  sparse: true
})

studentSchema.pre('save', function() {
  this.updatedAt = Date.now()
  return Promise.resolve()
})

// Virtual for display class name
studentSchema.virtual('displayClass').get(function() {
  return mapNumberToClassName(this.class)
})

// ================= ATTENDANCE METHODS =================

// Method to add or update attendance with session
studentSchema.methods.markAttendance = function(date, session, status, markedBy) {
  const attendanceDate = new Date(date)
  attendanceDate.setHours(0, 0, 0, 0)
  
  // Find or create attendance record for current academic year
  let academicYearRecord = this.attendance.find(
    record => record.academicYear === this.academicYear
  )
  
  if (!academicYearRecord) {
    academicYearRecord = {
      academicYear: this.academicYear,
      records: []
    }
    this.attendance.push(academicYearRecord)
  }
  
  // Find existing record for this date
  const existingRecord = academicYearRecord.records.find(
    record => record.date.getTime() === attendanceDate.getTime()
  )
  
  if (existingRecord) {
    // Update existing record with session
    existingRecord[session] = status
    existingRecord.markedBy = markedBy
    existingRecord.updatedAt = new Date()
  } else {
    // Create new record
    const newRecord = {
      date: attendanceDate,
      markedBy,
      updatedAt: new Date()
    }
    newRecord[session] = status
    
    // Initialize other session as null
    const otherSession = session === 'morning' ? 'afternoon' : 'morning'
    newRecord[otherSession] = null
    
    academicYearRecord.records.push(newRecord)
  }
  
  // Sort records by date
  academicYearRecord.records.sort((a, b) => a.date - b.date)
  
  return this.save()
}

// Method to mark fullday attendance
studentSchema.methods.markFullDayAttendance = function(date, status, markedBy) {
  const attendanceDate = new Date(date)
  attendanceDate.setHours(0, 0, 0, 0)
  
  // Find or create attendance record for current academic year
  let academicYearRecord = this.attendance.find(
    record => record.academicYear === this.academicYear
  )
  
  if (!academicYearRecord) {
    academicYearRecord = {
      academicYear: this.academicYear,
      records: []
    }
    this.attendance.push(academicYearRecord)
  }
  
  // Find existing record for this date
  const existingRecord = academicYearRecord.records.find(
    record => record.date.getTime() === attendanceDate.getTime()
  )
  
  if (existingRecord) {
    // Update both sessions for fullday
    existingRecord.morning = status
    existingRecord.afternoon = status
    existingRecord.markedBy = markedBy
    existingRecord.updatedAt = new Date()
  } else {
    // Create new record with both sessions
    const newRecord = {
      date: attendanceDate,
      morning: status,
      afternoon: status,
      markedBy,
      updatedAt: new Date()
    }
    
    academicYearRecord.records.push(newRecord)
  }
  
  // Sort records by date
  academicYearRecord.records.sort((a, b) => a.date - b.date)
  
  return this.save()
}

// Method to get attendance within a date range
studentSchema.methods.getAttendance = function(startDate, endDate) {
  const academicYearRecord = this.attendance.find(
    record => record.academicYear === this.academicYear
  )
  
  if (!academicYearRecord) return []
  
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  
  return academicYearRecord.records
    .filter(record => record.date >= start && record.date <= end)
    .map(record => ({
      date: record.date,
      morning: record.morning,
      afternoon: record.afternoon,
      markedBy: record.markedBy,
      updatedAt: record.updatedAt
    }))
    .sort((a, b) => a.date - b.date)
}

// Method to get attendance summary within a date range
studentSchema.methods.getAttendanceSummary = function(startDate, endDate) {
  const attendanceRecords = this.getAttendance(startDate, endDate)
  
  let presentDays = 0
  let absentDays = 0
  let halfDays = 0
  
  attendanceRecords.forEach(record => {
    if (record.morning === true && record.afternoon === true) {
      presentDays++
    } else if (record.morning === false && record.afternoon === false) {
      absentDays++
    } else if (record.morning === true || record.afternoon === true) {
      halfDays++
    }
  })
  
  const totalDays = attendanceRecords.length
  const effectivePresentDays = presentDays + (halfDays * 0.5)
  const attendancePercentage = totalDays > 0 ? (effectivePresentDays / totalDays) * 100 : 0
  
  return {
    totalDays,
    presentDays,
    absentDays,
    halfDays,
    effectivePresentDays,
    attendancePercentage: attendancePercentage.toFixed(2)
  }
}

// ================= MARKS METHODS =================

// Helper function to calculate grade based on percentage
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C'
  if (percentage >= 40) return 'D'
  if (percentage >= 35) return 'E'
  return 'F'
}

// Helper function to determine pass/fail
const determineResult = (percentage, passingPercentage = 35) => {
  return percentage >= passingPercentage ? 'Pass' : 'Fail'
}

// Method to upload or update marks with pass/fail and grade calculation
studentSchema.methods.uploadMarks = function(examType, customExamName, subject, marks, totalMarks, uploadedBy, passingPercentage = 35) {
  // Validate marks don't exceed total marks
  if (marks > totalMarks) {
    throw new Error(`Marks (${marks}) cannot exceed total marks (${totalMarks})`)
  }
  
  // Calculate percentage - ensure it's a number, not string
  const percentage = totalMarks > 0 ? parseFloat(((marks / totalMarks) * 100).toFixed(2)) : 0
  
  // Calculate grade and result
  const grade = calculateGrade(percentage)
  const result = determineResult(percentage, passingPercentage)
  
  // Find or create marks record for current academic year
  let academicYearRecord = this.marks.find(
    record => record.academicYear === this.academicYear
  )
  
  if (!academicYearRecord) {
    academicYearRecord = {
      academicYear: this.academicYear,
      records: []
    }
    this.marks.push(academicYearRecord)
  }
  
  // Find existing record for this exam and subject
  const existingRecord = academicYearRecord.records.find(
    record => record.examType === examType && record.subject === subject
  )
  
  if (existingRecord) {
    // Update existing record
    existingRecord.marks = marks
    existingRecord.totalMarks = totalMarks
    existingRecord.percentage = percentage
    existingRecord.grade = grade
    existingRecord.result = result
    existingRecord.passingPercentage = passingPercentage
    if (customExamName) existingRecord.customExamName = customExamName
    existingRecord.uploadedBy = uploadedBy
    existingRecord.updatedAt = new Date()
  } else {
    // Create new record
    const newRecord = {
      examType,
      subject,
      marks,
      totalMarks,
      percentage,
      grade,
      result,
      passingPercentage,
      uploadedBy,
      uploadedAt: new Date(),
      updatedAt: new Date()
    }
    
    if (customExamName) {
      newRecord.customExamName = customExamName
    }
    
    academicYearRecord.records.push(newRecord)
  }
  
  // Sort records by exam type
  academicYearRecord.records.sort((a, b) => a.examType.localeCompare(b.examType))
  
  // Return a promise that saves the document
  return this.save()
}

// Method to get marks for a specific exam and subject
studentSchema.methods.getMarksForExam = function(examType, subject) {
  const academicYearRecord = this.marks.find(
    record => record.academicYear === this.academicYear
  )
  
  if (!academicYearRecord) return null
  
  const record = academicYearRecord.records.find(
    record => record.examType === examType && record.subject === subject
  )
  
  if (!record) return null
  
  return {
    examType: record.examType,
    customExamName: record.customExamName,
    subject: record.subject,
    marks: record.marks,
    totalMarks: record.totalMarks,
    percentage: record.percentage,
    grade: record.grade,
    result: record.result,
    passingPercentage: record.passingPercentage,
    uploadedBy: record.uploadedBy,
    uploadedAt: record.uploadedAt,
    updatedAt: record.updatedAt
  }
}

// Method to get all marks for a subject
studentSchema.methods.getSubjectMarks = function(subject) {
  const academicYearRecord = this.marks.find(
    record => record.academicYear === this.academicYear
  )
  
  if (!academicYearRecord) return []
  
  return academicYearRecord.records
    .filter(record => record.subject === subject)
    .map(record => ({
      examType: record.examType,
      customExamName: record.customExamName,
      marks: record.marks,
      totalMarks: record.totalMarks,
      percentage: record.percentage,
      grade: record.grade,
      result: record.result,
      passingPercentage: record.passingPercentage,
      uploadedBy: record.uploadedBy,
      uploadedAt: record.uploadedAt
    }))
    .sort((a, b) => a.examType.localeCompare(b.examType))
}

// Method to get all marks
studentSchema.methods.getAllMarks = function() {
  const academicYearRecord = this.marks.find(
    record => record.academicYear === this.academicYear
  )
  
  if (!academicYearRecord) return []
  
  return academicYearRecord.records
    .map(record => ({
      examType: record.examType,
      customExamName: record.customExamName,
      subject: record.subject,
      marks: record.marks,
      totalMarks: record.totalMarks,
      percentage: record.percentage,
      grade: record.grade,
      result: record.result,
      passingPercentage: record.passingPercentage,
      uploadedBy: record.uploadedBy,
      uploadedAt: record.uploadedAt,
      updatedAt: record.updatedAt
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject))
}

// Method to get subject-wise performance summary
studentSchema.methods.getSubjectPerformance = function() {
  const academicYearRecord = this.marks.find(
    record => record.academicYear === this.academicYear
  )
  
  if (!academicYearRecord) return []
  
  // Group by subject
  const subjectMap = {}
  
  academicYearRecord.records.forEach(record => {
    if (!subjectMap[record.subject]) {
      subjectMap[record.subject] = {
        subject: record.subject,
        totalExams: 0,
        totalMarks: 0,
        totalPossibleMarks: 0,
        averagePercentage: 0,
        grades: [],
        results: [],
        passCount: 0,
        failCount: 0
      }
    }
    
    subjectMap[record.subject].totalExams++
    subjectMap[record.subject].totalMarks += record.marks
    subjectMap[record.subject].totalPossibleMarks += record.totalMarks
    subjectMap[record.subject].grades.push(record.grade)
    subjectMap[record.subject].results.push(record.result)
    
    if (record.result === 'Pass') {
      subjectMap[record.subject].passCount++
    } else if (record.result === 'Fail') {
      subjectMap[record.subject].failCount++
    }
  })
  
  // Calculate averages and percentages
  const subjectPerformance = Object.values(subjectMap).map(subject => {
    const averagePercentage = (subject.totalMarks / subject.totalPossibleMarks) * 100
    const passPercentage = (subject.passCount / subject.totalExams) * 100
    
    // Determine overall subject status
    let overallStatus = 'Pass'
    if (subject.failCount > 0) {
      overallStatus = subject.passCount > subject.failCount ? 'Borderline' : 'Fail'
    }
    
    return {
      ...subject,
      averagePercentage: averagePercentage.toFixed(2),
      passPercentage: passPercentage.toFixed(2),
      overallStatus,
      overallGrade: calculateGrade(averagePercentage)
    }
  })
  
  return subjectPerformance.sort((a, b) => a.subject.localeCompare(b.subject))
}

// ================= FEE METHODS =================

// Method to set or update fee details for an academic year with discounts
studentSchema.methods.setFeeDetails = function(academicYear, schoolFee, transportFee, hostelFee, discounts = {}) {
  // Validate based on student type and transport usage
  if (this.studentType === 'Day Scholar' && hostelFee > 0) {
    throw new Error('Day scholar cannot have hostel fee')
  }
  
  if (!this.isUsingSchoolTransport && transportFee > 0) {
    throw new Error('Student is not using school transport')
  }
  
  // Apply student-level discounts if not provided
  const schoolFeeDiscount = discounts.schoolFeeDiscount !== undefined ? discounts.schoolFeeDiscount : this.schoolFeeDiscount
  const transportFeeDiscount = discounts.transportFeeDiscount !== undefined ? discounts.transportFeeDiscount : this.transportFeeDiscount
  const hostelFeeDiscount = discounts.hostelFeeDiscount !== undefined ? discounts.hostelFeeDiscount : this.hostelFeeDiscount
  
  // Find or create fee record for academic year
  let feeRecord = this.feeDetails.find(
    record => record.academicYear === academicYear
  )
  
  if (!feeRecord) {
    feeRecord = {
      academicYear,
      schoolFee: schoolFee || 0,
      transportFee: this.isUsingSchoolTransport ? (transportFee || 0) : 0,
      hostelFee: this.studentType === 'Hosteller' ? (hostelFee || 0) : 0,
      schoolFeePaid: 0,
      transportFeePaid: 0,
      hostelFeePaid: 0,
      terms: 3,
      totalPaid: 0,
      totalDue: 0,
      schoolFeeDiscountApplied: schoolFeeDiscount,
      transportFeeDiscountApplied: transportFeeDiscount,
      hostelFeeDiscountApplied: hostelFeeDiscount
    }
    this.feeDetails.push(feeRecord)
  } else {
    feeRecord.schoolFee = schoolFee || 0
    feeRecord.transportFee = this.isUsingSchoolTransport ? (transportFee || 0) : 0
    feeRecord.hostelFee = this.studentType === 'Hosteller' ? (hostelFee || 0) : 0
    feeRecord.schoolFeeDiscountApplied = schoolFeeDiscount
    feeRecord.transportFeeDiscountApplied = transportFeeDiscount
    feeRecord.hostelFeeDiscountApplied = hostelFeeDiscount
    feeRecord.updatedAt = new Date()
  }
  
  // Calculate totals (fees should already have discounts applied from controller)
  feeRecord.totalFee = feeRecord.schoolFee + feeRecord.transportFee + feeRecord.hostelFee
  
  // Calculate due amount (totalFee - totalPaid)
  feeRecord.totalDue = Math.max(0, feeRecord.totalFee - feeRecord.totalPaid)
  
  return this.save()
}

// Method to update student-level discount percentages
studentSchema.methods.updateDiscounts = function(schoolFeeDiscount, transportFeeDiscount, hostelFeeDiscount) {
  this.schoolFeeDiscount = schoolFeeDiscount || 0
  this.transportFeeDiscount = transportFeeDiscount || 0
  this.hostelFeeDiscount = hostelFeeDiscount || 0
  
  return this.save()
}

// Method to get fee details for an academic year
studentSchema.methods.getFeeDetails = function(academicYear) {
  const feeRecord = this.feeDetails.find(
    record => record.academicYear === academicYear
  )
  
  if (!feeRecord) return null
  
  return {
    academicYear: feeRecord.academicYear,
    schoolFee: feeRecord.schoolFee,
    transportFee: feeRecord.transportFee,
    hostelFee: feeRecord.hostelFee,
    totalFee: feeRecord.totalFee,
    schoolFeePaid: feeRecord.schoolFeePaid,
    transportFeePaid: feeRecord.transportFeePaid,
    hostelFeePaid: feeRecord.hostelFeePaid,
    totalPaid: feeRecord.totalPaid,
    totalDue: feeRecord.totalDue,
    schoolFeeDiscountApplied: feeRecord.schoolFeeDiscountApplied,
    transportFeeDiscountApplied: feeRecord.transportFeeDiscountApplied,
    hostelFeeDiscountApplied: feeRecord.hostelFeeDiscountApplied,
    schoolFeeDue: Math.max(0, feeRecord.schoolFee - feeRecord.schoolFeePaid),
    transportFeeDue: Math.max(0, feeRecord.transportFee - feeRecord.transportFeePaid),
    hostelFeeDue: Math.max(0, feeRecord.hostelFee - feeRecord.hostelFeePaid),
    createdAt: feeRecord.createdAt,
    updatedAt: feeRecord.updatedAt
  }
}

// ================= PAYMENT METHODS =================

// Helper function to generate payment ID
const generatePaymentId = () => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `PAY-${timestamp}-${random}`.toUpperCase()
}

// Helper function to generate receipt number
const generateReceiptNo = () => {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `RCPT-${year}${month}${day}-${random}`
}

// Method to record a payment with individual fee components
studentSchema.methods.recordPayment = function(
  academicYear, 
  paymentData,
  receivedBy, 
  options = {}
) {
  const {
    schoolFeePaid = 0,
    transportFeePaid = 0,
    hostelFeePaid = 0,
    description = '',
    paymentMode = 'Cash',
    chequeNo = '',
    bankName = '',
    transactionId = '',
    notes = '',
    customReceiptNo = null,
    customPaymentId = null
  } = paymentData
  
  // Validate at least one fee component is being paid
  const totalAmount = schoolFeePaid + transportFeePaid + hostelFeePaid
  if (totalAmount <= 0) {
    throw new Error('Payment amount must be greater than zero')
  }
  
  // Get fee details for this academic year
  const feeRecord = this.feeDetails.find(
    record => record.academicYear === academicYear
  )
  
  if (!feeRecord) {
    throw new Error('Fee details not found for this academic year')
  }
  
  // Validate payment amounts don't exceed due amounts
  if (schoolFeePaid > (feeRecord.schoolFee - feeRecord.schoolFeePaid)) {
    throw new Error(`School fee payment exceeds due amount. Due: ${feeRecord.schoolFee - feeRecord.schoolFeePaid}, Trying to pay: ${schoolFeePaid}`)
  }
  
  if (transportFeePaid > (feeRecord.transportFee - feeRecord.transportFeePaid)) {
    throw new Error(`Transport fee payment exceeds due amount. Due: ${feeRecord.transportFee - feeRecord.transportFeePaid}, Trying to pay: ${transportFeePaid}`)
  }
  
  if (hostelFeePaid > (feeRecord.hostelFee - feeRecord.hostelFeePaid)) {
    throw new Error(`Hostel fee payment exceeds due amount. Due: ${feeRecord.hostelFee - feeRecord.hostelFeePaid}, Trying to pay: ${hostelFeePaid}`)
  }
  
  // Generate unique payment ID and receipt number
  const paymentId = customPaymentId || generatePaymentId()
  const receiptNo = customReceiptNo || generateReceiptNo()
  
  // Create payment record
  const paymentRecord = {
    paymentId,
    academicYear,
    date: new Date(),
    schoolFeePaid,
    transportFeePaid,
    hostelFeePaid,
    totalAmount,
    receiptNo,
    paymentMode,
    description,
    chequeNo,
    bankName,
    transactionId,
    receivedBy,
    status: 'Completed',
    notes,
    createdAt: new Date()
  }
  
  // Add to payment history
  this.paymentHistory.push(paymentRecord)
  
  // Update fee details with individual component payments
  feeRecord.schoolFeePaid += schoolFeePaid
  feeRecord.transportFeePaid += transportFeePaid
  feeRecord.hostelFeePaid += hostelFeePaid
  feeRecord.totalPaid += totalAmount
  feeRecord.totalDue = Math.max(0, feeRecord.totalFee - feeRecord.totalPaid)
  feeRecord.updatedAt = new Date()
  
  return this.save()
}

// Method to get payment by ID
studentSchema.methods.getPayment = function(paymentId) {
  const payment = this.paymentHistory.find(
    record => record.paymentId === paymentId
  )
  
  if (!payment) return null
  
  return {
    paymentId: payment.paymentId,
    academicYear: payment.academicYear,
    date: payment.date,
    schoolFeePaid: payment.schoolFeePaid,
    transportFeePaid: payment.transportFeePaid,
    hostelFeePaid: payment.hostelFeePaid,
    totalAmount: payment.totalAmount,
    receiptNo: payment.receiptNo,
    paymentMode: payment.paymentMode,
    description: payment.description,
    chequeNo: payment.chequeNo,
    bankName: payment.bankName,
    transactionId: payment.transactionId,
    receivedBy: payment.receivedBy,
    status: payment.status,
    notes: payment.notes,
    createdAt: payment.createdAt
  }
}

// Method to get all payments for an academic year
studentSchema.methods.getPaymentsByAcademicYear = function(academicYear) {
  return this.paymentHistory
    .filter(record => record.academicYear === academicYear)
    .map(payment => ({
      paymentId: payment.paymentId,
      date: payment.date,
      schoolFeePaid: payment.schoolFeePaid,
      transportFeePaid: payment.transportFeePaid,
      hostelFeePaid: payment.hostelFeePaid,
      totalAmount: payment.totalAmount,
      receiptNo: payment.receiptNo,
      paymentMode: payment.paymentMode,
      description: payment.description,
      status: payment.status,
      receivedBy: payment.receivedBy
    }))
    .sort((a, b) => b.date - a.date)
}

// Method to get payment summary for an academic year
studentSchema.methods.getPaymentSummary = function(academicYear) {
  const feeRecord = this.feeDetails.find(
    record => record.academicYear === academicYear
  )
  
  if (!feeRecord) {
    throw new Error('Fee details not found for this academic year')
  }
  
  const payments = this.paymentHistory.filter(
    record => record.academicYear === academicYear && record.status === 'Completed'
  )
  
  const totalPayments = payments.reduce((sum, payment) => sum + payment.totalAmount, 0)
  const paymentCount = payments.length
  
  // Calculate component-wise payment totals
  const totalSchoolFeePaid = payments.reduce((sum, payment) => sum + payment.schoolFeePaid, 0)
  const totalTransportFeePaid = payments.reduce((sum, payment) => sum + payment.transportFeePaid, 0)
  const totalHostelFeePaid = payments.reduce((sum, payment) => sum + payment.hostelFeePaid, 0)
  
  return {
    academicYear,
    feeSummary: {
      schoolFee: {
        total: feeRecord.schoolFee,
        paid: feeRecord.schoolFeePaid,
        due: Math.max(0, feeRecord.schoolFee - feeRecord.schoolFeePaid),
        discount: feeRecord.schoolFeeDiscountApplied
      },
      transportFee: {
        total: feeRecord.transportFee,
        paid: feeRecord.transportFeePaid,
        due: Math.max(0, feeRecord.transportFee - feeRecord.transportFeePaid),
        discount: feeRecord.transportFeeDiscountApplied
      },
      hostelFee: {
        total: feeRecord.hostelFee,
        paid: feeRecord.hostelFeePaid,
        due: Math.max(0, feeRecord.hostelFee - feeRecord.hostelFeePaid),
        discount: feeRecord.hostelFeeDiscountApplied
      },
      overall: {
        totalFee: feeRecord.totalFee,
        totalPaid: feeRecord.totalPaid,
        totalDue: feeRecord.totalDue
      }
    },
    paymentSummary: {
      totalPayments,
      paymentCount,
      componentBreakdown: {
        schoolFee: totalSchoolFeePaid,
        transportFee: totalTransportFeePaid,
        hostelFee: totalHostelFeePaid
      },
      lastPaymentDate: payments.length > 0 ? new Date(Math.max(...payments.map(p => p.date))) : null,
      paymentStatus: feeRecord.totalDue === 0 ? 'Paid' : feeRecord.totalDue === feeRecord.totalFee ? 'Unpaid' : 'Partial'
    },
    payments: payments.map(p => ({
      date: p.date,
      schoolFeePaid: p.schoolFeePaid,
      transportFeePaid: p.transportFeePaid,
      hostelFeePaid: p.hostelFeePaid,
      totalAmount: p.totalAmount,
      receiptNo: p.receiptNo,
      paymentMode: p.paymentMode,
      description: p.description
    }))
  }
}

// Method to get fee component-wise breakdown with discounts
studentSchema.methods.getFeeBreakdown = function(academicYear) {
  const feeRecord = this.feeDetails.find(
    record => record.academicYear === academicYear
  )
  
  if (!feeRecord) return null
  
  return {
    academicYear,
    schoolFee: {
      total: feeRecord.schoolFee,
      paid: feeRecord.schoolFeePaid,
      due: Math.max(0, feeRecord.schoolFee - feeRecord.schoolFeePaid),
      percentagePaid: feeRecord.schoolFee > 0 ? (feeRecord.schoolFeePaid / feeRecord.schoolFee * 100).toFixed(2) : 0,
      discount: feeRecord.schoolFeeDiscountApplied
    },
    transportFee: {
      total: feeRecord.transportFee,
      paid: feeRecord.transportFeePaid,
      due: Math.max(0, feeRecord.transportFee - feeRecord.transportFeePaid),
      percentagePaid: feeRecord.transportFee > 0 ? (feeRecord.transportFeePaid / feeRecord.transportFee * 100).toFixed(2) : 0,
      discount: feeRecord.transportFeeDiscountApplied
    },
    hostelFee: {
      total: feeRecord.hostelFee,
      paid: feeRecord.hostelFeePaid,
      due: Math.max(0, feeRecord.hostelFee - feeRecord.hostelFeePaid),
      percentagePaid: feeRecord.hostelFee > 0 ? (feeRecord.hostelFeePaid / feeRecord.hostelFee * 100).toFixed(2) : 0,
      discount: feeRecord.hostelFeeDiscountApplied
    },
    overall: {
      totalFee: feeRecord.totalFee,
      totalPaid: feeRecord.totalPaid,
      totalDue: feeRecord.totalDue,
      percentagePaid: feeRecord.totalFee > 0 ? (feeRecord.totalPaid / feeRecord.totalFee * 100).toFixed(2) : 0
    },
    studentDiscounts: {
      schoolFee: this.schoolFeeDiscount,
      transportFee: this.transportFeeDiscount,
      hostelFee: this.hostelFeeDiscount
    }
  }
}

// ================= STATIC METHODS =================

// Static method to get students for marks
studentSchema.statics.getStudentsForMarks = async function(className, section, academicYear) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  })
  .select('_id rollNo firstName lastName admissionNo')
  .sort({ rollNo: 1 })
  .lean()

  return students.map(student => ({
    id: student._id,
    rollNo: student.rollNo,
    name: `${student.firstName} ${student.lastName}`,
    admissionNo: student.admissionNo
  }))
}

// Static method to check if marks exist
studentSchema.statics.checkMarksExist = async function(className, section, examType, subject, academicYear) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  })

  if (students.length === 0) {
    return {
      exists: false,
      totalStudents: 0,
      totalMarked: 0,
      markedStudents: [],
      message: 'No students found in this class'
    }
  }

  let totalMarked = 0
  const markedStudents = []

  for (const student of students) {
    const marksRecord = student.getMarksForExam(examType, subject)
    if (marksRecord) {
      totalMarked++
      markedStudents.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        marks: marksRecord.marks,
        totalMarks: marksRecord.totalMarks,
        percentage: marksRecord.percentage,
        grade: marksRecord.grade,
        result: marksRecord.result
      })
    }
  }

  return {
    exists: totalMarked > 0,
    totalStudents: students.length,
    totalMarked,
    markedStudents,
    canOverride: totalMarked > 0
  }
}

// Static method to upload class marks
studentSchema.statics.uploadClassMarks = async function({ examType, customExamName, subject, className, section, academicYear, totalMarks, passingPercentage, studentMarks, uploadedBy }) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  })

  if (students.length === 0) {
    throw new Error('No students found in this class')
  }

  const studentMap = {}
  students.forEach(student => {
    studentMap[student._id.toString()] = student
  })

  let markedCount = 0
  let passCount = 0
  let failCount = 0
  const marksResults = []

  for (const markData of studentMarks) {
    const student = studentMap[markData.studentId]
    
    if (!student) {
      console.warn(`Student not found: ${markData.studentId}`)
      continue
    }

    try {
      await student.uploadMarks(
        examType,
        customExamName,
        subject,
        parseFloat(markData.marks),
        parseFloat(totalMarks),
        uploadedBy,
        parseFloat(passingPercentage)
      )
      
      markedCount++
      
      const uploadedMarks = student.getMarksForExam(examType, subject)
      if (uploadedMarks) {
        if (uploadedMarks.result === 'Pass') passCount++
        else failCount++
      }

      marksResults.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        marks: markData.marks,
        result: uploadedMarks ? uploadedMarks.result : 'N/A'
      })
    } catch (error) {
      console.error(`Error uploading marks for ${student.firstName}:`, error)
    }
  }

  return {
    className: mapNumberToClassName(classNum),
    section: section.toUpperCase(),
    examType,
    subject,
    totalMarks: parseFloat(totalMarks),
    passingPercentage: parseFloat(passingPercentage),
    totalStudents: students.length,
    markedCount,
    passCount,
    failCount,
    passPercentage: markedCount > 0 ? ((passCount / markedCount) * 100).toFixed(2) : 0,
    marksResults,
    uploadedBy
  }
}

// Static method to override class marks
studentSchema.statics.overrideClassMarks = async function({ examType, customExamName, subject, className, section, academicYear, totalMarks, passingPercentage, studentMarks, uploadedBy }) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  })

  // Remove existing marks for this exam and subject
  for (const student of students) {
    const academicYearRecord = student.marks.find(
      record => record.academicYear === (academicYear || student.academicYear)
    )
    
    if (academicYearRecord) {
      const recordIndex = academicYearRecord.records.findIndex(
        record => record.examType === examType && record.subject === subject
      )
      
      if (recordIndex !== -1) {
        academicYearRecord.records.splice(recordIndex, 1)
        await student.save()
      }
    }
  }

  // Call uploadClassMarks to upload new marks
  return await this.uploadClassMarks({
    examType,
    customExamName,
    subject,
    className,
    section,
    academicYear,
    totalMarks,
    passingPercentage,
    studentMarks,
    uploadedBy
  })
}

// Static method to get class marks summary
studentSchema.statics.getClassMarksSummary = async function(className, section, examType, subject, academicYear) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  }).sort('rollNo')

  const marksDetails = []
  let totalMarksSum = 0
  let totalPossibleMarks = 0
  let passCount = 0
  let failCount = 0
  let aPlusCount = 0, aCount = 0, bPlusCount = 0, bCount = 0, cCount = 0, dCount = 0, eCount = 0, fCount = 0

  for (const student of students) {
    const marksRecord = student.getMarksForExam(examType, subject)
    
    if (marksRecord) {
      totalMarksSum += marksRecord.marks
      totalPossibleMarks += marksRecord.totalMarks
      
      if (marksRecord.result === 'Pass') passCount++
      else failCount++
      
      // Count grades
      switch (marksRecord.grade) {
        case 'A+': aPlusCount++; break
        case 'A': aCount++; break
        case 'B+': bPlusCount++; break
        case 'B': bCount++; break
        case 'C': cCount++; break
        case 'D': dCount++; break
        case 'E': eCount++; break
        case 'F': fCount++; break
      }

      marksDetails.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        admissionNo: student.admissionNo,
        marks: marksRecord.marks,
        totalMarks: marksRecord.totalMarks,
        percentage: marksRecord.percentage,
        grade: marksRecord.grade,
        result: marksRecord.result
      })
    }
  }

  const averagePercentage = marksDetails.length > 0 ? 
    (totalMarksSum / totalPossibleMarks) * 100 : 0

  const gradeDistribution = {
    'A+': aPlusCount,
    'A': aCount,
    'B+': bPlusCount,
    'B': bCount,
    'C': cCount,
    'D': dCount,
    'E': eCount,
    'F': fCount
  }

  return {
    className: mapNumberToClassName(classNum),
    section: section.toUpperCase(),
    examType,
    subject,
    academicYear: academicYear || '2024-2025',
    totalStudents: students.length,
    markedStudents: marksDetails.length,
    summary: {
      averagePercentage: averagePercentage.toFixed(2),
      passCount,
      failCount,
      passPercentage: (passCount / (passCount + failCount) * 100).toFixed(2),
      gradeDistribution
    },
    marksDetails
  }
}

// Static method to get class subject performance
studentSchema.statics.getClassSubjectPerformance = async function(className, section, academicYear) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  })

  // Collect all subjects from all students
  const allSubjects = new Set()
  const subjectPerformanceMap = {}

  for (const student of students) {
    const performance = student.getSubjectPerformance()
    performance.forEach(subject => {
      allSubjects.add(subject.subject)
      
      if (!subjectPerformanceMap[subject.subject]) {
        subjectPerformanceMap[subject.subject] = {
          subject: subject.subject,
          students: 0,
          totalAveragePercentage: 0,
          passCount: 0,
          failCount: 0,
          aPlusCount: 0,
          aCount: 0,
          bPlusCount: 0,
          bCount: 0,
          cCount: 0,
          dCount: 0,
          eCount: 0,
          fCount: 0
        }
      }
      
      const subj = subjectPerformanceMap[subject.subject]
      subj.students++
      subj.totalAveragePercentage += parseFloat(subject.averagePercentage)
      subj.passCount += subject.passCount
      subj.failCount += subject.failCount
      
      // Add grade counts
      subj.aPlusCount += subject.grades.filter(g => g === 'A+').length
      subj.aCount += subject.grades.filter(g => g === 'A').length
      subj.bPlusCount += subject.grades.filter(g => g === 'B+').length
      subj.bCount += subject.grades.filter(g => g === 'B').length
      subj.cCount += subject.grades.filter(g => g === 'C').length
      subj.dCount += subject.grades.filter(g => g === 'D').length
      subj.eCount += subject.grades.filter(g => g === 'E').length
      subj.fCount += subject.grades.filter(g => g === 'F').length
    })
  }

  // Calculate averages
  const subjectPerformance = Array.from(allSubjects).map(subjectName => {
    const subj = subjectPerformanceMap[subjectName]
    const avgPercentage = subj.students > 0 ? (subj.totalAveragePercentage / subj.students) : 0
    const passPercentage = (subj.passCount + subj.failCount) > 0 ? 
      (subj.passCount / (subj.passCount + subj.failCount) * 100) : 0
      
    // Determine overall subject difficulty
    let difficulty = 'Average'
    if (avgPercentage >= 80) difficulty = 'Easy'
    else if (avgPercentage >= 60) difficulty = 'Average'
    else if (avgPercentage >= 40) difficulty = 'Challenging'
    else difficulty = 'Difficult'

    return {
      subject: subjectName,
      totalStudents: subj.students,
      averagePercentage: avgPercentage.toFixed(2),
      passPercentage: passPercentage.toFixed(2),
      passCount: subj.passCount,
      failCount: subj.failCount,
      gradeDistribution: {
        'A+': subj.aPlusCount,
        'A': subj.aCount,
        'B+': subj.bPlusCount,
        'B': subj.bCount,
        'C': subj.cCount,
        'D': subj.dCount,
        'E': subj.eCount,
        'F': subj.fCount
      },
      difficulty,
      status: passPercentage >= 70 ? 'Good' : 
              passPercentage >= 50 ? 'Average' : 'Needs Attention'
    }
  })

  return {
    className: mapNumberToClassName(classNum),
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025',
    totalStudents: students.length,
    subjectPerformance: subjectPerformance.sort((a, b) => b.averagePercentage - a.averagePercentage)
  }
}

// Static method to check attendance exists
studentSchema.statics.checkAttendanceExists = async function(className, section, date, academicYear, session) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  const attendanceDate = new Date(date)
  attendanceDate.setHours(0, 0, 0, 0)

  // Find students in the class
  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  })

  if (students.length === 0) {
    return {
      exists: false,
      totalStudents: 0,
      totalMarked: 0,
      message: 'No students found in this class'
    }
  }

  // Check each student's attendance
  let totalMarked = 0
  const markedStudents = []

  for (const student of students) {
    const academicYearRecord = student.attendance.find(
      record => record.academicYear === (academicYear || student.academicYear)
    )
    
    if (academicYearRecord) {
      const attendanceRecord = academicYearRecord.records.find(
        record => record.date.getTime() === attendanceDate.getTime()
      )
      
      if (attendanceRecord) {
        if (session === 'fullday') {
          if (attendanceRecord.morning !== null && attendanceRecord.afternoon !== null) {
            totalMarked++
            markedStudents.push({
              studentId: student._id,
              name: `${student.firstName} ${student.lastName}`,
              rollNo: student.rollNo,
              morning: attendanceRecord.morning,
              afternoon: attendanceRecord.afternoon
            })
          }
        } else if (attendanceRecord[session] !== null) {
          totalMarked++
          markedStudents.push({
            studentId: student._id,
            name: `${student.firstName} ${student.lastName}`,
            rollNo: student.rollNo,
            status: attendanceRecord[session]
          })
        }
      }
    }
  }

  return {
    exists: totalMarked > 0,
    totalStudents: students.length,
    totalMarked,
    markedStudents,
    canOverride: totalMarked > 0
  }
}

// Static method to mark class attendance
studentSchema.statics.markClassAttendance = async function({ date, className, section, academicYear, session, studentAttendance, markedBy }) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  const attendanceDate = new Date(date)
  attendanceDate.setHours(0, 0, 0, 0)

  // Find students in the class
  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  })

  if (students.length === 0) {
    throw new Error('No students found in this class')
  }

  // Create a map for quick student lookup
  const studentMap = {}
  students.forEach(student => {
    studentMap[student._id.toString()] = student
  })

  let markedCount = 0
  const attendanceResults = []

  // Mark attendance for each student
  for (const attendanceData of studentAttendance) {
    const student = studentMap[attendanceData.studentId]
    
    if (!student) {
      console.warn(`Student not found: ${attendanceData.studentId}`)
      continue
    }

    try {
      if (session === 'fullday') {
        await student.markFullDayAttendance(attendanceDate, attendanceData.status, markedBy)
      } else {
        await student.markAttendance(attendanceDate, session, attendanceData.status, markedBy)
      }
      
      markedCount++
      attendanceResults.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        status: attendanceData.status
      })
    } catch (error) {
      console.error(`Error marking attendance for ${student.firstName}:`, error)
    }
  }

  return {
    className: mapNumberToClassName(classNum),
    section: section.toUpperCase(),
    date: attendanceDate,
    session,
    totalStudents: students.length,
    markedCount,
    attendanceResults,
    markedBy
  }
}

// Static method to get class attendance
studentSchema.statics.getClassAttendance = async function(className, section, date, academicYear, session) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  const attendanceDate = new Date(date)
  attendanceDate.setHours(0, 0, 0, 0)

  // Find students in the class
  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  }).sort('rollNo')

  const attendanceData = []

  for (const student of students) {
    const academicYearRecord = student.attendance.find(
      record => record.academicYear === (academicYear || student.academicYear)
    )
    
    let attendanceStatus = null
    let markedBy = null
    
    if (academicYearRecord) {
      const attendanceRecord = academicYearRecord.records.find(
        record => record.date.getTime() === attendanceDate.getTime()
      )
      
      if (attendanceRecord) {
        if (session === 'fullday') {
          if (attendanceRecord.morning === true && attendanceRecord.afternoon === true) {
            attendanceStatus = 'present'
          } else if (attendanceRecord.morning === false && attendanceRecord.afternoon === false) {
            attendanceStatus = 'absent'
          } else if (attendanceRecord.morning === true || attendanceRecord.afternoon === true) {
            attendanceStatus = 'halfday'
          }
        } else {
          attendanceStatus = attendanceRecord[session]
        }
        markedBy = attendanceRecord.markedBy
      }
    }

    attendanceData.push({
      studentId: student._id,
      name: `${student.firstName} ${student.lastName}`,
      rollNo: student.rollNo,
      admissionNo: student.admissionNo,
      status: attendanceStatus,
      markedBy
    })
  }

  // Calculate summary
  const present = attendanceData.filter(a => a.status === true || a.status === 'present').length
  const absent = attendanceData.filter(a => a.status === false || a.status === 'absent').length
  const halfday = attendanceData.filter(a => a.status === 'halfday').length
  const notMarked = attendanceData.filter(a => a.status === null).length

  return {
    className: mapNumberToClassName(classNum),
    section: section.toUpperCase(),
    date: attendanceDate,
    session: session || 'all',
    academicYear: academicYear || '2024-2025',
    totalStudents: students.length,
    summary: {
      present,
      absent,
      halfday,
      notMarked
    },
    attendanceData
  }
}

// Static method to get class attendance summary
studentSchema.statics.getClassAttendanceSummary = async function(className, section, date, academicYear) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  const attendanceDate = new Date(date)
  attendanceDate.setHours(0, 0, 0, 0)

  // Find students in the class
  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  })

  let morningPresent = 0
  let morningAbsent = 0
  let morningNotMarked = 0
  let afternoonPresent = 0
  let afternoonAbsent = 0
  let afternoonNotMarked = 0
  let fulldayPresent = 0
  let fulldayAbsent = 0
  let fulldayHalfday = 0
  let fulldayNotMarked = 0

  for (const student of students) {
    const academicYearRecord = student.attendance.find(
      record => record.academicYear === (academicYear || student.academicYear)
    )
    
    if (academicYearRecord) {
      const attendanceRecord = academicYearRecord.records.find(
        record => record.date.getTime() === attendanceDate.getTime()
      )
      
      if (attendanceRecord) {
        // Morning session
        if (attendanceRecord.morning === true) morningPresent++
        else if (attendanceRecord.morning === false) morningAbsent++
        else morningNotMarked++
        
        // Afternoon session
        if (attendanceRecord.afternoon === true) afternoonPresent++
        else if (attendanceRecord.afternoon === false) afternoonAbsent++
        else afternoonNotMarked++
        
        // Full day status
        if (attendanceRecord.morning === true && attendanceRecord.afternoon === true) {
          fulldayPresent++
        } else if (attendanceRecord.morning === false && attendanceRecord.afternoon === false) {
          fulldayAbsent++
        } else if (attendanceRecord.morning === true || attendanceRecord.afternoon === true) {
          fulldayHalfday++
        } else {
          fulldayNotMarked++
        }
      } else {
        morningNotMarked++
        afternoonNotMarked++
        fulldayNotMarked++
      }
    } else {
      morningNotMarked++
      afternoonNotMarked++
      fulldayNotMarked++
    }
  }

  return {
    className: mapNumberToClassName(classNum),
    section: section.toUpperCase(),
    date: attendanceDate,
    academicYear: academicYear || '2024-2025',
    totalStudents: students.length,
    morning: {
      present: morningPresent,
      absent: morningAbsent,
      notMarked: morningNotMarked,
      percentage: morningPresent + morningAbsent > 0 ? 
        (morningPresent / (morningPresent + morningAbsent) * 100).toFixed(2) : 0
    },
    afternoon: {
      present: afternoonPresent,
      absent: afternoonAbsent,
      notMarked: afternoonNotMarked,
      percentage: afternoonPresent + afternoonAbsent > 0 ? 
        (afternoonPresent / (afternoonPresent + afternoonAbsent) * 100).toFixed(2) : 0
    },
    fullday: {
      present: fulldayPresent,
      absent: fulldayAbsent,
      halfday: fulldayHalfday,
      notMarked: fulldayNotMarked,
      effectivePresent: fulldayPresent + (fulldayHalfday * 0.5),
      percentage: students.length > 0 ? 
        ((fulldayPresent + (fulldayHalfday * 0.5)) / students.length * 100).toFixed(2) : 0
    }
  }
}

// Static method to apply discounts to multiple students
studentSchema.statics.applyDiscounts = async function(data) {
  const { 
    className, 
    section, 
    academicYear, 
    schoolFeeDiscount = 0,
    transportFeeDiscount = 0,
    hostelFeeDiscount = 0
  } = data
  
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }
  
  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  })
  
  if (students.length === 0) {
    throw new Error('No students found in the specified class and section')
  }
  
  const results = []
  
  for (const student of students) {
    try {
      // Update student-level discounts
      student.schoolFeeDiscount = schoolFeeDiscount
      student.transportFeeDiscount = transportFeeDiscount
      student.hostelFeeDiscount = hostelFeeDiscount
      
      // Update fee details with new discounts
      const feeRecord = student.feeDetails.find(
        record => record.academicYear === academicYear
      )
      
      if (feeRecord) {
        feeRecord.schoolFeeDiscountApplied = schoolFeeDiscount
        feeRecord.transportFeeDiscountApplied = transportFeeDiscount
        feeRecord.hostelFeeDiscountApplied = hostelFeeDiscount
        feeRecord.updatedAt = new Date()
      }
      
      await student.save()
      
      results.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        studentType: student.studentType,
        isUsingTransport: student.isUsingSchoolTransport,
        schoolFeeDiscount,
        transportFeeDiscount,
        hostelFeeDiscount,
        status: 'updated'
      })
    } catch (error) {
      results.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        error: error.message,
        status: 'failed'
      })
    }
  }
  
  return {
    className,
    section,
    academicYear: academicYear || '2024-2025',
    discounts: {
      schoolFeeDiscount,
      transportFeeDiscount,
      hostelFeeDiscount
    },
    totalStudents: students.length,
    updatedCount: results.filter(r => r.status === 'updated').length,
    failedCount: results.filter(r => r.status === 'failed').length,
    results
  }
}

// Static method to set fee details for multiple students with discounts
studentSchema.statics.setClassFeeDetails = async function(data) {
  const { 
    className, 
    section, 
    academicYear, 
    schoolFee, 
    transportFee, 
    hostelFee,
    schoolFeeDiscount = 0,
    transportFeeDiscount = 0,
    hostelFeeDiscount = 0
  } = data
  
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }
  
  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  })
  
  if (students.length === 0) {
    throw new Error('No students found in the specified class and section')
  }
  
  const results = []
  
  for (const student of students) {
    try {
      // Update student-level discounts
      student.schoolFeeDiscount = schoolFeeDiscount
      student.transportFeeDiscount = transportFeeDiscount
      student.hostelFeeDiscount = hostelFeeDiscount
      
      // Set fee details for each student based on their type and transport usage
      const actualTransportFee = student.isUsingSchoolTransport ? transportFee : 0
      const actualHostelFee = student.studentType === 'Hosteller' ? hostelFee : 0
      
      await student.setFeeDetails(academicYear, schoolFee, actualTransportFee, actualHostelFee, {
        schoolFeeDiscount,
        transportFeeDiscount,
        hostelFeeDiscount
      })
      
      const feeRecord = student.feeDetails.find(
        record => record.academicYear === academicYear
      )
      
      results.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        studentType: student.studentType,
        isUsingTransport: student.isUsingSchoolTransport,
        schoolFee: feeRecord.schoolFee,
        transportFee: feeRecord.transportFee,
        hostelFee: feeRecord.hostelFee,
        totalFee: feeRecord.totalFee,
        schoolFeeDiscount: feeRecord.schoolFeeDiscountApplied,
        transportFeeDiscount: feeRecord.transportFeeDiscountApplied,
        hostelFeeDiscount: feeRecord.hostelFeeDiscountApplied,
        status: 'updated'
      })
    } catch (error) {
      results.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        studentType: student.studentType,
        isUsingTransport: student.isUsingSchoolTransport,
        error: error.message,
        status: 'failed'
      })
    }
  }
  
  return {
    className,
    section,
    academicYear: academicYear || '2024-2025',
    baseFees: {
      schoolFee,
      transportFee,
      hostelFee
    },
    discounts: {
      schoolFeeDiscount,
      transportFeeDiscount,
      hostelFeeDiscount
    },
    totalStudents: students.length,
    updatedCount: results.filter(r => r.status === 'updated').length,
    failedCount: results.filter(r => r.status === 'failed').length,
    results
  }
}

// ==================== PAYMENT PROCESSING METHODS ====================

// Method to process a payment and update all related records
studentSchema.methods.processPayment = async function (
  paymentData,
  receivedBy,
) {
  const {
    academicYear,
    schoolFeePaid = 0,
    transportFeePaid = 0,
    hostelFeePaid = 0,
    description = "",
    paymentMode = "Cash",
    chequeNo = "",
    bankName = "",
    transactionId = "",
    notes = "",
    term,
    customReceiptNo = null,
    customPaymentId = null,
  } = paymentData

  // Calculate total amount
  const totalAmount = schoolFeePaid + transportFeePaid + hostelFeePaid

  if (totalAmount <= 0) {
    throw new Error("Payment amount must be greater than zero")
  }

  // Validate payment components don't exceed due amounts
  const feeRecord = this.feeDetails.find(
    (fd) => fd.academicYear === academicYear,
  )

  if (!feeRecord) {
    throw new Error(`Fee details not found for academic year ${academicYear}`)
  }

  // Validate individual component payments
  const schoolFeeDue = Math.max(
    0,
    feeRecord.schoolFee - feeRecord.schoolFeePaid,
  )
  const transportFeeDue = Math.max(
    0,
    feeRecord.transportFee - feeRecord.transportFeePaid,
  )
  const hostelFeeDue = Math.max(
    0,
    feeRecord.hostelFee - feeRecord.hostelFeePaid,
  )

  if (schoolFeePaid > schoolFeeDue) {
    throw new Error(
      `School fee payment (${schoolFeePaid}) exceeds due amount (${schoolFeeDue})`,
    )
  }

  if (transportFeePaid > transportFeeDue) {
    throw new Error(
      `Transport fee payment (${transportFeePaid}) exceeds due amount (${transportFeeDue})`,
    )
  }

  if (hostelFeePaid > hostelFeeDue) {
    throw new Error(
      `Hostel fee payment (${hostelFeePaid}) exceeds due amount (${hostelFeeDue})`,
    )
  }

  // Generate payment ID and receipt number
  const paymentId =
    customPaymentId ||
    `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  const receiptNo =
    customReceiptNo ||
    `RCPT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`

  // Create payment record
  const paymentRecord = {
    paymentId,
    academicYear,
    date: new Date(),
    schoolFeePaid,
    transportFeePaid,
    hostelFeePaid,
    totalAmount,
    receiptNo,
    paymentMode,
    description: term ? `${description} (Term ${term})` : description,
    chequeNo,
    bankName,
    transactionId,
    receivedBy,
    status: "Completed",
    notes,
    createdAt: new Date(),
  }

  // Add to payment history
  this.paymentHistory.push(paymentRecord)

  // Update fee details
  feeRecord.schoolFeePaid += schoolFeePaid
  feeRecord.transportFeePaid += transportFeePaid
  feeRecord.hostelFeePaid += hostelFeePaid
  feeRecord.totalPaid += totalAmount
  feeRecord.totalDue = Math.max(0, feeRecord.totalFee - feeRecord.totalPaid)
  feeRecord.updatedAt = new Date()

  // Save the student document
  await this.save()

  return {
    paymentId,
    receiptNo,
    paymentRecord,
    updatedFeeDetails: feeRecord,
    remainingDue: feeRecord.totalDue,
    schoolFeeDue: Math.max(0, feeRecord.schoolFee - feeRecord.schoolFeePaid),
    transportFeeDue: Math.max(
      0,
      feeRecord.transportFee - feeRecord.transportFeePaid,
    ),
    hostelFeeDue: Math.max(0, feeRecord.hostelFee - feeRecord.hostelFeePaid),
  }
}

// Method to generate fee receipt data
studentSchema.methods.generateReceiptData = function (paymentId) {
  const payment = this.paymentHistory.find((p) => p.paymentId === paymentId)

  if (!payment) {
    throw new Error(`Payment with ID ${paymentId} not found`)
  }

  const feeRecord = this.feeDetails.find(
    (fd) => fd.academicYear === payment.academicYear,
  )

  return {
    student: {
      id: this._id,
      name: `${this.firstName} ${this.lastName}`,
      admissionNo: this.admissionNo,
      rollNo: this.rollNo,
      class: this.class,
      displayClass: mapNumberToClassName(this.class),
      section: this.section,
      academicYear: this.academicYear,
      parentName: this.parentName,
      parentPhone: this.parentPhone,
    },
    payment: {
      paymentId: payment.paymentId,
      receiptNo: payment.receiptNo,
      date: payment.date,
      breakdown: {
        schoolFee: payment.schoolFeePaid,
        transportFee: payment.transportFeePaid,
        hostelFee: payment.hostelFeePaid,
      },
      totalAmount: payment.totalAmount,
      paymentMode: payment.paymentMode,
      description: payment.description,
      receivedBy: payment.receivedBy,
      chequeNo: payment.chequeNo,
      bankName: payment.bankName,
      transactionId: payment.transactionId,
      status: payment.status,
    },
    feeSummary: feeRecord
      ? {
          academicYear: feeRecord.academicYear,
          totalFee: feeRecord.totalFee,
          totalPaid: feeRecord.totalPaid,
          totalDue: feeRecord.totalDue,
          paymentStatus:
            feeRecord.totalDue === 0
              ? "Paid"
              : feeRecord.totalDue === feeRecord.totalFee
                ? "Unpaid"
                : "Partial",
          components: {
            schoolFee: {
              total: feeRecord.schoolFee,
              paid: feeRecord.schoolFeePaid,
              due: Math.max(0, feeRecord.schoolFee - feeRecord.schoolFeePaid),
            },
            transportFee: {
              total: feeRecord.transportFee,
              paid: feeRecord.transportFeePaid,
              due: Math.max(
                0,
                feeRecord.transportFee - feeRecord.transportFeePaid,
              ),
            },
            hostelFee: {
              total: feeRecord.hostelFee,
              paid: feeRecord.hostelFeePaid,
              due: Math.max(0, feeRecord.hostelFee - feeRecord.hostelFeePaid),
            },
          },
        }
      : null,
    schoolInfo: {
      name: "Your School Name", 
      address: "School Address",
      phone: "School Phone",
      email: "school@email.com",
      principal: "Principal Name",
    },
    generatedAt: new Date(),
    receiptId: `RECEIPT-${payment.receiptNo}`,
    isPartialPayment: feeRecord && feeRecord.totalDue > 0,
  }
}

// Helper functions
const mapClassToNumber = (classInput) => {
  if (!classInput && classInput !== 0) return 1

  const classStr = classInput.toString().trim().toUpperCase()

  const classMap = {
    'PRE NURSERY': 0,
    'NURSERY': 0.25,
    'LKG': 0.5,
    'UKG': 0.75,
    '1': 1, 'FIRST': 1, 'ONE': 1,
    '2': 2, 'SECOND': 2, 'TWO': 2,
    '3': 3, 'THIRD': 3, 'THREE': 3,
    '4': 4, 'FOURTH': 4, 'FOUR': 4,
    '5': 5, 'FIFTH': 5, 'FIVE': 5,
    '6': 6, 'SIXTH': 6, 'SIX': 6,
    '7': 7, 'SEVENTH': 7, 'SEVEN': 7,
    '8': 8, 'EIGHTH': 8, 'EIGHT': 8,
    '9': 9, 'NINTH': 9, 'NINE': 9,
    '10': 10, 'TENTH': 10, 'TEN': 10,
    '11': 11, 'ELEVENTH': 11, 'ELEVEN': 11,
    '12': 12, 'TWELFTH': 12, 'TWELVE': 12,
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
    'XI': 11, 'XII': 12
  }

  return classMap[classStr] !== undefined ? classMap[classStr] : parseFloat(classStr) || null
}

const mapNumberToClassName = (classNum) => {
  if (classNum === null || classNum === undefined) return null
  const num = Number(classNum)
  if (num === 0) return 'Pre Nursery'
  if (num === 0.25) return 'Nursery'
  if (num === 0.5) return 'LKG'
  if (num === 0.75) return 'UKG'
  if (num >= 1 && num <= 12) return `Class ${num}`
  return `Class ${num}`
}

module.exports = mongoose.model('Student', studentSchema)