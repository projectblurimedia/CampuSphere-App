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

// ================= ATTENDANCE INSTANCE METHODS =================

// Method to add or update attendance with session
const markAttendance = async function(date, session, status, markedBy) {
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
const markFullDayAttendance = async function(date, status, markedBy) {
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
const getAttendance = function(startDate, endDate) {
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
const getAttendanceSummary = function(startDate, endDate) {
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

// ================= ATTENDANCE STATIC METHODS =================

// Static method to check attendance exists
const checkAttendanceExists = async function(className, section, date, academicYear, session) {
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
const markClassAttendance = async function({ date, className, section, academicYear, session, studentAttendance, markedBy }) {
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
const getClassAttendance = async function(className, section, date, academicYear, session) {
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
const getClassAttendanceSummary = async function(className, section, date, academicYear) {
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

// Export attendance instance methods
const attendanceInstanceMethods = {
  markAttendance,
  markFullDayAttendance,
  getAttendance,
  getAttendanceSummary
}

// Export attendance static methods
const attendanceStaticMethods = {
  checkAttendanceExists,
  markClassAttendance,
  getClassAttendance,
  getClassAttendanceSummary
}

module.exports = {
  attendanceInstanceMethods,
  attendanceStaticMethods,
  mapClassToNumber,
  mapNumberToClassName
}