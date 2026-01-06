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
  // Attendance array organized by academic year with session support
  attendance: [
    {
      academicYear: {
        type: String,
        required: true,
        enum: ['2023-2024', '2024-2025', '2025-2026', '2026-2027']
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
  // NEW: Marks array organized by academic year with subject support
  marks: [
    {
      academicYear: {
        type: String,
        required: true,
        enum: ['2023-2024', '2024-2025', '2025-2026', '2026-2027']
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

// ================= STATIC METHODS =================

// ================= ATTENDANCE STATIC METHODS =================

// Static method to check if attendance already exists
studentSchema.statics.checkAttendanceExists = async function(className, section, date, academicYear, session) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  // Parse the date to ensure consistent format
  const attendanceDate = new Date(date)
  attendanceDate.setHours(0, 0, 0, 0)

  // Find students in the specified class, section, and academic year
  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  }).select('_id firstName lastName rollNo attendance')

  let markedStudents = []
  let totalMarked = 0

  // Check each student for existing attendance
  students.forEach(student => {
    const academicYearRecord = student.attendance.find(
      record => record.academicYear === (academicYear || '2024-2025')
    )
    
    if (academicYearRecord) {
      const record = academicYearRecord.records.find(
        record => record.date.getTime() === attendanceDate.getTime()
      )
      
      if (record) {
        let isMarked = false
        
        if (session === 'fullday') {
          // For fullday, check if both sessions are marked (not null)
          isMarked = record.morning !== null && record.afternoon !== null
        } else {
          // For specific session, check if that session is marked (not null)
          isMarked = record[session] !== null
        }
        
        if (isMarked) {
          totalMarked++
          markedStudents.push({
            studentId: student._id,
            name: `${student.firstName} ${student.lastName}`,
            rollNo: student.rollNo,
            morning: record.morning,
            afternoon: record.afternoon,
            markedBy: record.markedBy,
            updatedAt: record.updatedAt
          })
        }
      }
    }
  })

  return {
    exists: totalMarked > 0,
    totalMarked,
    totalStudents: students.length,
    markedStudents
  }
}

// Static method to mark class attendance
studentSchema.statics.markClassAttendance = async function(data) {
  const { 
    date, 
    className, 
    section, 
    academicYear, 
    session, 
    studentAttendance, 
    markedBy 
  } = data
  
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  // Parse and normalize the date to UTC midnight
  const attendanceDate = new Date(date)
  const utcDate = new Date(Date.UTC(
    attendanceDate.getUTCFullYear(),
    attendanceDate.getUTCMonth(),
    attendanceDate.getUTCDate(),
    0, 0, 0, 0
  ))

  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  })

  if (students.length === 0) {
    throw new Error('No students found in the specified class and section')
  }

  const studentIds = studentAttendance.map(item => item.studentId)
  const validStudentIds = students.map(student => student._id.toString())
  
  const invalidIds = studentIds.filter(id => !validStudentIds.includes(id.toString()))
  if (invalidIds.length > 0) {
    throw new Error(`Invalid student IDs: ${invalidIds.join(', ')}`)
  }

  // Create a map for quick lookup
  const attendanceMap = {}
  studentAttendance.forEach(item => {
    attendanceMap[item.studentId] = item.status === 'present'
  })

  const results = []
  let presentCount = 0
  let absentCount = 0

  for (const student of students) {
    const studentStatus = attendanceMap[student._id.toString()]
    const isPresent = studentStatus === true
    
    if (session === 'fullday') {
      // Mark both sessions for fullday
      await student.markFullDayAttendance(utcDate, isPresent, markedBy)
    } else {
      // Mark specific session
      await student.markAttendance(utcDate, session, isPresent, markedBy)
    }
    
    await student.save()
    
    // Update counts
    if (isPresent) presentCount++
    else absentCount++
    
    results.push({
      studentId: student._id,
      name: `${student.firstName} ${student.lastName}`,
      rollNo: student.rollNo,
      status: isPresent ? 'present' : 'absent',
      session: session
    })
  }

  return {
    date: utcDate,
    className,
    section,
    academicYear: academicYear || '2024-2025',
    session,
    markedCount: results.length,
    totalStudents: students.length,
    presentCount,
    absentCount,
    markedBy,
    results
  }
}

// Static method to get class attendance for a specific date
studentSchema.statics.getClassAttendance = async function(className, section, date, academicYear, session = null) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  // Parse the date
  const attendanceDate = new Date(date)
  attendanceDate.setHours(0, 0, 0, 0)

  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  }).select('firstName lastName rollNo admissionNo attendance')

  const attendanceRecords = []

  students.forEach(student => {
    const academicYearRecord = student.attendance.find(
      record => record.academicYear === (academicYear || '2024-2025')
    )
    
    let morningStatus = null
    let afternoonStatus = null
    let markedBy = null
    let updatedAt = null
    
    if (academicYearRecord) {
      const record = academicYearRecord.records.find(
        record => record.date.getTime() === attendanceDate.getTime()
      )
      
      if (record) {
        morningStatus = record.morning
        afternoonStatus = record.afternoon
        markedBy = record.markedBy
        updatedAt = record.updatedAt
      }
    }

    let status = 'not marked'
    if (session === 'morning') {
      status = morningStatus === true ? 'present' : 
               morningStatus === false ? 'absent' : 'not marked'
    } else if (session === 'afternoon') {
      status = afternoonStatus === true ? 'present' : 
               afternoonStatus === false ? 'absent' : 'not marked'
    } else if (session === 'fullday') {
      if (morningStatus === true && afternoonStatus === true) {
        status = 'present'
      } else if (morningStatus === false && afternoonStatus === false) {
        status = 'absent'
      } else if (morningStatus === true || afternoonStatus === true) {
        status = 'halfday'
      } else {
        status = 'not marked'
      }
    } else {
      // No session specified, return both
      status = {
        morning: morningStatus === true ? 'present' : 
                morningStatus === false ? 'absent' : 'not marked',
        afternoon: afternoonStatus === true ? 'present' : 
                   afternoonStatus === false ? 'absent' : 'not marked'
      }
    }

    attendanceRecords.push({
      studentId: student._id,
      name: `${student.firstName} ${student.lastName}`,
      rollNo: student.rollNo,
      admissionNo: student.admissionNo,
      status,
      markedBy,
      updatedAt
    })
  })

  return {
    date: attendanceDate,
    className,
    section,
    academicYear: academicYear || '2024-2025',
    session,
    totalStudents: students.length,
    attendanceRecords
  }
}

// Static method to get class attendance summary for a date
studentSchema.statics.getClassAttendanceSummary = async function(className, section, date, academicYear) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }

  // Parse the date
  const attendanceDate = new Date(date)
  attendanceDate.setHours(0, 0, 0, 0)

  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  }).select('attendance')

  let morningPresent = 0
  let morningAbsent = 0
  let morningNotMarked = 0
  
  let afternoonPresent = 0
  let afternoonAbsent = 0
  let afternoonNotMarked = 0
  
  let fullDayPresent = 0
  let fullDayAbsent = 0
  let fullDayHalfDay = 0
  let fullDayNotMarked = 0

  students.forEach(student => {
    const academicYearRecord = student.attendance.find(
      record => record.academicYear === (academicYear || '2024-2025')
    )
    
    let morningStatus = null
    let afternoonStatus = null
    
    if (academicYearRecord) {
      const record = academicYearRecord.records.find(
        record => record.date.getTime() === attendanceDate.getTime()
      )
      
      if (record) {
        morningStatus = record.morning
        afternoonStatus = record.afternoon
      }
    }

    // Morning session counts
    if (morningStatus === true) morningPresent++
    else if (morningStatus === false) morningAbsent++
    else morningNotMarked++

    // Afternoon session counts
    if (afternoonStatus === true) afternoonPresent++
    else if (afternoonStatus === false) afternoonAbsent++
    else afternoonNotMarked++

    // Full day counts
    if (morningStatus === true && afternoonStatus === true) {
      fullDayPresent++
    } else if (morningStatus === false && afternoonStatus === false) {
      fullDayAbsent++
    } else if (morningStatus === true || afternoonStatus === true) {
      fullDayHalfDay++
    } else {
      fullDayNotMarked++
    }
  })

  return {
    date: attendanceDate,
    className,
    section,
    academicYear: academicYear || '2024-2025',
    totalStudents: students.length,
    morning: {
      present: morningPresent,
      absent: morningAbsent,
      notMarked: morningNotMarked,
      percentage: students.length > 0 ? ((morningPresent / students.length) * 100).toFixed(2) : 0
    },
    afternoon: {
      present: afternoonPresent,
      absent: afternoonAbsent,
      notMarked: afternoonNotMarked,
      percentage: students.length > 0 ? ((afternoonPresent / students.length) * 100).toFixed(2) : 0
    },
    fullday: {
      present: fullDayPresent,
      absent: fullDayAbsent,
      halfDay: fullDayHalfDay,
      notMarked: fullDayNotMarked,
      percentage: students.length > 0 ? ((fullDayPresent / students.length) * 100).toFixed(2) : 0
    }
  }
}

// ================= MARKS STATIC METHODS =================

// Static method to get students for marks upload
studentSchema.statics.getStudentsForMarks = async function(className, section, academicYear) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }
  
  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  }).select('firstName lastName rollNo admissionNo marks')
    .sort({ rollNo: 1 })
  
  return students.map(student => ({
    id: student._id,
    name: `${student.firstName} ${student.lastName}`,
    rollNo: student.rollNo,
    admissionNumber: student.admissionNo,
    marks: student.marks
  }))
}

// Static method to check if marks already exist
studentSchema.statics.checkMarksExist = async function(className, section, examType, subject, academicYear) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }
  
  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  }).select('_id firstName lastName rollNo marks')
  
  let markedStudents = []
  let totalMarked = 0
  
  students.forEach(student => {
    const academicYearRecord = student.marks.find(
      record => record.academicYear === (academicYear || '2024-2025')
    )
    
    if (academicYearRecord) {
      const record = academicYearRecord.records.find(
        record => record.examType === examType && record.subject === subject
      )
      
      if (record) {
        totalMarked++
        markedStudents.push({
          studentId: student._id,
          name: `${student.firstName} ${student.lastName}`,
          rollNo: student.rollNo,
          marks: record.marks,
          totalMarks: record.totalMarks,
          percentage: record.percentage,
          grade: record.grade,
          result: record.result
        })
      }
    }
  })
  
  return {
    exists: totalMarked > 0,
    totalMarked,
    totalStudents: students.length,
    markedStudents
  }
}

// Static method to upload class marks with pass/fail calculation
studentSchema.statics.uploadClassMarks = async function(data) {
  const { 
    examType, 
    customExamName, 
    subject, 
    className, 
    section, 
    academicYear, 
    totalMarks, 
    studentMarks, 
    uploadedBy,
    passingPercentage = 35
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
  
  const studentIds = studentMarks.map(item => item.studentId)
  const validStudentIds = students.map(student => student._id.toString())
  
  const invalidIds = studentIds.filter(id => !validStudentIds.includes(id.toString()))
  if (invalidIds.length > 0) {
    throw new Error(`Invalid student IDs: ${invalidIds.join(', ')}`)
  }
  
  // Create a map for quick lookup
  const marksMap = {}
  studentMarks.forEach(item => {
    if (item.marks > totalMarks) {
      throw new Error(`Student ${item.studentId}: Marks (${item.marks}) cannot exceed total marks (${totalMarks})`)
    }
    marksMap[item.studentId] = item
  })
  
  const results = []
  let passCount = 0
  let failCount = 0
  
  for (const student of students) {
    const studentMarkData = marksMap[student._id.toString()]
    
    if (!studentMarkData) {
      continue
    }
    
    // Calculate percentage
    const percentage = totalMarks > 0 ? ((studentMarkData.marks / totalMarks) * 100).toFixed(2) : 0
    
    // Calculate grade and result
    const grade = calculateGrade(percentage)
    const result = determineResult(percentage, passingPercentage)
    
    // Update counts
    if (result === 'Pass') passCount++
    if (result === 'Fail') failCount++
    
    // Find or create academic year record
    let academicYearRecord = student.marks.find(
      record => record.academicYear === (academicYear || '2024-2025')
    )
    
    if (!academicYearRecord) {
      academicYearRecord = {
        academicYear: academicYear || '2024-2025',
        records: []
      }
      student.marks.push(academicYearRecord)
    }
    
    // Find existing record
    const existingRecord = academicYearRecord.records.find(
      record => record.examType === examType && record.subject === subject
    )
    
    if (existingRecord) {
      // Update existing record
      existingRecord.marks = studentMarkData.marks
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
        marks: studentMarkData.marks,
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
    
    // Save the student document
    await student.save()
    
    results.push({
      studentId: student._id,
      name: `${student.firstName} ${student.lastName}`,
      rollNo: student.rollNo,
      marks: studentMarkData.marks,
      totalMarks: totalMarks,
      percentage: percentage,
      grade: grade,
      result: result,
      passingPercentage: passingPercentage,
      status: 'uploaded',
      isUpdated: !!existingRecord
    })
  }
  
  // Calculate pass percentage
  const totalUploaded = results.length
  const passPercentage = totalUploaded > 0 ? ((passCount / totalUploaded) * 100).toFixed(2) : 0
  
  return {
    examType,
    customExamName: customExamName || null,
    subject,
    className,
    section,
    academicYear: academicYear || '2024-2025',
    totalMarks,
    passingPercentage,
    uploadedBy,
    markedCount: results.length,
    totalStudents: students.length,
    passCount,
    failCount,
    passPercentage,
    results
  }
}

// Static method to override existing marks with pass/fail calculation
studentSchema.statics.overrideClassMarks = async function(data) {
  const { 
    examType, 
    customExamName, 
    subject, 
    className, 
    section, 
    academicYear, 
    totalMarks, 
    studentMarks, 
    uploadedBy,
    passingPercentage = 35 
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
  
  // Create a map for quick lookup
  const marksMap = {}
  studentMarks.forEach(item => {
    // Validate marks don't exceed total marks
    if (item.marks > totalMarks) {
      throw new Error(`Student ${item.studentId}: Marks (${item.marks}) cannot exceed total marks (${totalMarks})`)
    }
    marksMap[item.studentId] = item
  })
  
  const results = []
  let passCount = 0
  let failCount = 0
  
  for (const student of students) {
    const studentMarkData = marksMap[student._id.toString()]
    
    // Calculate percentage if marks exist for this student
    let marks = 0
    let percentage = 0
    let grade = 'N/A'
    let result = 'N/A'
    
    if (studentMarkData) {
      marks = studentMarkData.marks
      percentage = totalMarks > 0 ? ((marks / totalMarks) * 100).toFixed(2) : 0
      grade = calculateGrade(percentage)
      result = determineResult(percentage, passingPercentage)
      
      // Update counts
      if (result === 'Pass') passCount++
      if (result === 'Fail') failCount++
    }
    
    let academicYearRecord = student.marks.find(
      record => record.academicYear === (academicYear || '2024-2025')
    )
    
    if (!academicYearRecord) {
      academicYearRecord = {
        academicYear: academicYear || '2024-2025',
        records: []
      }
      student.marks.push(academicYearRecord)
    }
    
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
        marks: marks,
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
    
    await student.save()
    
    results.push({
      studentId: student._id,
      name: `${student.firstName} ${student.lastName}`,
      rollNo: student.rollNo,
      marks: marks,
      totalMarks: totalMarks,
      percentage: percentage,
      grade: grade,
      result: result,
      passingPercentage: passingPercentage,
      status: 'uploaded',
      isUpdated: !!existingRecord
    })
  }
  
  // Calculate pass percentage
  const totalUploaded = results.filter(r => r.marks > 0).length
  const passPercentage = totalUploaded > 0 ? ((passCount / totalUploaded) * 100).toFixed(2) : 0
  
  return {
    examType,
    customExamName: customExamName || null,
    subject,
    className,
    section,
    academicYear: academicYear || '2024-2025',
    totalMarks,
    passingPercentage,
    uploadedBy,
    markedCount: results.filter(r => r.marks > 0).length,
    totalStudents: students.length,
    passCount,
    failCount,
    passPercentage,
    results
  }
}

// Static method to get marks summary for a class with pass/fail statistics
studentSchema.statics.getClassMarksSummary = async function(className, section, examType, subject, academicYear) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }
  
  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  }).select('firstName lastName rollNo marks')
  
  const marksDetails = []
  let marksArray = []
  let totalMarksValue = 0
  let passCount = 0
  let failCount = 0
  let gradeDistribution = {
    'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'F': 0, 'N/A': 0
  }
  
  students.forEach(student => {
    const academicYearRecord = student.marks.find(
      record => record.academicYear === (academicYear || '2024-2025')
    )
    
    let studentMarks = null
    let studentTotalMarks = 0
    let studentPercentage = 0
    let studentGrade = 'N/A'
    let studentResult = 'N/A'
    
    if (academicYearRecord) {
      const record = academicYearRecord.records.find(
        record => record.examType === examType && record.subject === subject
      )
      
      if (record) {
        studentMarks = record.marks
        studentTotalMarks = record.totalMarks
        studentPercentage = record.percentage
        studentGrade = record.grade
        studentResult = record.result
        marksArray.push(record.marks)
        totalMarksValue = record.totalMarks
        
        // Update counts
        if (studentResult === 'Pass') passCount++
        if (studentResult === 'Fail') failCount++
        
        // Update grade distribution
        if (gradeDistribution.hasOwnProperty(studentGrade)) {
          gradeDistribution[studentGrade]++
        }
      }
    }
    
    marksDetails.push({
      studentId: student._id,
      name: `${student.firstName} ${student.lastName}`,
      rollNo: student.rollNo,
      marks: studentMarks,
      totalMarks: studentTotalMarks,
      percentage: studentPercentage,
      grade: studentGrade,
      result: studentResult
    })
  })
  
  // Calculate statistics
  const markedStudents = marksArray.length
  const totalStudents = students.length
  
  let average = 0
  let highest = 0
  let lowest = 100
  
  if (marksArray.length > 0) {
    const sum = marksArray.reduce((a, b) => a + b, 0)
    average = (sum / marksArray.length).toFixed(2)
    highest = Math.max(...marksArray)
    lowest = Math.min(...marksArray)
  }
  
  // Calculate class pass percentage
  const classPassPercentage = markedStudents > 0 ? ((passCount / markedStudents) * 100).toFixed(2) : 0
  
  // Determine class overall performance
  let classPerformance = 'Good'
  if (classPassPercentage < 35) classPerformance = 'Poor'
  else if (classPassPercentage < 60) classPerformance = 'Average'
  else if (classPassPercentage < 80) classPerformance = 'Good'
  
  return {
    examType,
    subject,
    className,
    section,
    academicYear: academicYear || '2024-2025',
    summary: {
      totalStudents,
      markedStudents,
      notMarkedStudents: totalStudents - markedStudents,
      average,
      highest,
      lowest,
      passCount,
      failCount,
      passPercentage: classPassPercentage,
      totalMarks: totalMarksValue,
      classPerformance,
      gradeDistribution
    },
    marksDetails
  }
}

// Static method to get class performance report by subject
studentSchema.statics.getClassSubjectPerformance = async function(className, section, academicYear) {
  const classNum = mapClassToNumber(className)
  if (classNum === null) {
    throw new Error(`Invalid class: "${className}"`)
  }
  
  const students = await this.find({
    class: classNum,
    section: section.toUpperCase(),
    academicYear: academicYear || '2024-2025'
  }).select('firstName lastName rollNo marks')
  
  // Initialize subject-wise tracking
  const subjectPerformance = {}
  
  students.forEach(student => {
    const academicYearRecord = student.marks.find(
      record => record.academicYear === (academicYear || '2024-2025')
    )
    
    if (academicYearRecord) {
      academicYearRecord.records.forEach(record => {
        const subject = record.subject
        
        if (!subjectPerformance[subject]) {
          subjectPerformance[subject] = {
            subject,
            totalStudents: 0,
            markedStudents: 0,
            totalMarks: 0,
            totalPossibleMarks: 0,
            passCount: 0,
            failCount: 0,
            grades: {}
          }
        }
        
        subjectPerformance[subject].totalStudents++
        subjectPerformance[subject].markedStudents++
        subjectPerformance[subject].totalMarks += record.marks
        subjectPerformance[subject].totalPossibleMarks += record.totalMarks
        
        if (record.result === 'Pass') {
          subjectPerformance[subject].passCount++
        } else if (record.result === 'Fail') {
          subjectPerformance[subject].failCount++
        }
        
        // Count grades
        if (!subjectPerformance[subject].grades[record.grade]) {
          subjectPerformance[subject].grades[record.grade] = 0
        }
        subjectPerformance[subject].grades[record.grade]++
      })
    }
  })
  
  // Calculate averages and percentages for each subject
  const performanceReport = Object.values(subjectPerformance).map(subject => {
    const averagePercentage = subject.markedStudents > 0 
      ? (subject.totalMarks / subject.totalPossibleMarks) * 100 
      : 0
    
    const passPercentage = subject.markedStudents > 0 
      ? (subject.passCount / subject.markedStudents) * 100 
      : 0
    
    // Determine subject difficulty based on pass percentage
    let difficulty = 'Medium'
    if (passPercentage < 30) difficulty = 'Difficult'
    else if (passPercentage > 80) difficulty = 'Easy'
    
    return {
      ...subject,
      averagePercentage: averagePercentage.toFixed(2),
      passPercentage: passPercentage.toFixed(2),
      overallGrade: calculateGrade(averagePercentage),
      difficulty
    }
  })
  
  return performanceReport.sort((a, b) => a.subject.localeCompare(b.subject))
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