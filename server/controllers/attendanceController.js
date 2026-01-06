const Student = require('../models/Student')
const asyncHandler = require('express-async-handler')

const markAttendance = asyncHandler(async (req, res) => {
  const { date, academicYear, className, section, session, studentAttendance } = req.body

  if (!date || !className || !section || !session || !studentAttendance) {
    return res.status(400).json({
      success: false,
      message: 'Date, class name, section, session, and student attendance are required'
    })
  }

  const validSessions = ['morning', 'afternoon', 'fullday']
  if (!validSessions.includes(session)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid session. Must be morning, afternoon, or fullday'
    })
  }

  if (!Array.isArray(studentAttendance) || studentAttendance.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Student attendance data is required and must be an array'
    })
  }

  try {
    const attendanceDate = new Date(date)
    const utcDate = new Date(Date.UTC(
      attendanceDate.getFullYear(),
      attendanceDate.getMonth(),
      attendanceDate.getDate(),
      0, 0, 0, 0
    ))

    const existingAttendance = await Student.checkAttendanceExists(
      className,
      section,
      utcDate,
      academicYear,
      session
    )

    if (existingAttendance.exists) {
      return res.status(400).json({
        success: false,
        message: `Attendance already marked for ${session} session`,
        data: existingAttendance,
        canOverride: true 
      })
    }

    const result = await Student.markClassAttendance({
      date: utcDate,
      className,
      section,
      academicYear,
      session,
      studentAttendance,
      markedBy: req.user?.id || 'System'
    })

    res.status(201).json({
      success: true,
      data: result,
      message: `Attendance marked successfully for ${className}-${section}`
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

const overrideAttendance = asyncHandler(async (req, res) => {
  const { date, academicYear, className, section, session, studentAttendance } = req.body

  if (!date || !className || !section || !session || !studentAttendance) {
    return res.status(400).json({
      success: false,
      message: 'Date, class name, section, session, and student attendance are required'
    })
  }

  try {
    const classNum = mapClassToNumber(className)
    if (classNum === null) {
      return res.status(400).json({
        success: false,
        message: `Invalid class: "${className}"`
      })
    }

    const students = await Student.find({
      class: classNum,
      section: section.toUpperCase(),
      academicYear: academicYear || '2024-2025'
    })

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    for (const student of students) {
      const academicYearRecord = student.attendance.find(
        record => record.academicYear === (academicYear || '2024-2025')
      )
      
      if (academicYearRecord) {
        const recordIndex = academicYearRecord.records.findIndex(
          record => record.date.getTime() === attendanceDate.getTime()
        )
        
        if (recordIndex !== -1) {
          if (session === 'fullday') {
            academicYearRecord.records.splice(recordIndex, 1)
          } else {
            academicYearRecord.records[recordIndex][session] = null
            
            if (academicYearRecord.records[recordIndex].morning === null && 
                academicYearRecord.records[recordIndex].afternoon === null) {
              academicYearRecord.records.splice(recordIndex, 1)
            }
          }
        }
      }
      
      await student.save()
    }

    const result = await Student.markClassAttendance({
      date,
      className,
      section,
      academicYear,
      session,
      studentAttendance,
      markedBy: req.user?.id || 'System'
    })

    res.status(200).json({
      success: true,
      data: result,
      message: `Attendance overridden successfully for ${className}-${section}`
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

const getDayAttendance = asyncHandler(async (req, res) => {
  const { date, className, section, academicYear, session } = req.query

  if (!date || !className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Date, class name, and section are required'
    })
  }

  try {
    const attendance = await Student.getClassAttendance(
      className,
      section,
      date,
      academicYear,
      session
    )

    res.status(200).json({
      success: true,
      data: attendance
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

const checkAttendanceExists = asyncHandler(async (req, res) => {
  const { date, className, section, academicYear, session } = req.query

  if (!date || !className || !section || !session) {
    return res.status(400).json({
      success: false,
      message: 'Date, class name, section, and session are required'
    })
  }

  const validSessions = ['morning', 'afternoon', 'fullday']
  if (!validSessions.includes(session)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid session. Must be morning, afternoon, or fullday'
    })
  }

  try {
    const result = await Student.checkAttendanceExists(
      className,
      section,
      date,
      academicYear,
      session
    )

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

const getDayAttendanceSummary = asyncHandler(async (req, res) => {
  const { date, className, section, academicYear } = req.query

  if (!date || !className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Date, class name, and section are required'
    })
  }

  try {
    const summary = await Student.getClassAttendanceSummary(
      className,
      section,
      date,
      academicYear
    )

    res.status(200).json({
      success: true,
      data: summary
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

const getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { startDate, endDate } = req.query

  const student = await Student.findById(studentId)
    .select('firstName lastName rollNo admissionNo class section academicYear')
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    })
  }

  const currentDate = new Date()
  const defaultStartDate = startDate || new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const defaultEndDate = endDate || new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const attendanceRecords = student.getAttendance(defaultStartDate, defaultEndDate)
  const summary = student.getAttendanceSummary(defaultStartDate, defaultEndDate)

  res.status(200).json({
    success: true,
    data: {
      student: {
        _id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        admissionNo: student.admissionNo,
        class: student.class,
        section: student.section,
        academicYear: student.academicYear
      },
      period: {
        startDate: defaultStartDate,
        endDate: defaultEndDate
      },
      summary,
      dailyAttendance: attendanceRecords
    }
  })
})

const getClassSummary = asyncHandler(async (req, res) => {
  const { className, section, startDate, endDate, academicYear } = req.query

  if (!className || !section || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Class name, section, start date, and end date are required'
    })
  }

  try {
    const classNum = mapClassToNumber(className)
    if (classNum === null) {
      return res.status(400).json({
        success: false,
        message: `Invalid class: "${className}"`
      })
    }

    const students = await Student.find({
      class: classNum,
      section: section.toUpperCase(),
      academicYear: academicYear || '2024-2025'
    }).select('firstName lastName rollNo attendance')

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    let totalPresentDays = 0
    let totalAbsentDays = 0
    let totalHalfDays = 0
    let totalPossibleDays = 0

    const studentSummaries = students.map(student => {
      const summary = student.getAttendanceSummary(startDate, endDate)
      
      totalPresentDays += summary.presentDays
      totalAbsentDays += summary.absentDays
      totalHalfDays += summary.halfDays
      totalPossibleDays += summary.totalDays

      return {
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        ...summary
      }
    })

    const totalEffectivePresentDays = totalPresentDays + (totalHalfDays * 0.5)
    const averageAttendance = totalPossibleDays > 0 ? 
      (totalEffectivePresentDays / totalPossibleDays) * 100 : 0

    res.status(200).json({
      success: true,
      data: {
        className,
        section,
        academicYear: academicYear || '2024-2025',
        period: {
          startDate: start,
          endDate: end
        },
        classSummary: {
          totalStudents: students.length,
          totalPossibleDays,
          totalPresentDays,
          totalAbsentDays,
          totalHalfDays,
          totalEffectivePresentDays,
          averageAttendance: averageAttendance.toFixed(2)
        },
        studentSummaries
      }
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

const updateAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { date, morning, afternoon } = req.body

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date is required'
    })
  }

  const student = await Student.findById(studentId)

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    })
  }

  if (morning !== undefined) {
    await student.markAttendance(date, 'morning', morning, req.user?.id || 'System')
  }

  if (afternoon !== undefined) {
    await student.markAttendance(date, 'afternoon', afternoon, req.user?.id || 'System')
  }

  const updatedStudent = await Student.findById(studentId)
    .select('firstName lastName rollNo attendance')

  res.status(200).json({
    success: true,
    data: {
      student: {
        _id: updatedStudent._id,
        name: `${updatedStudent.firstName} ${updatedStudent.lastName}`,
        rollNo: updatedStudent.rollNo
      },
      date,
      morning,
      afternoon
    },
    message: 'Attendance updated successfully'
  })
})

const deleteAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { date, session } = req.body

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date is required'
    })
  }

  const student = await Student.findById(studentId)

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    })
  }

  const attendanceDate = new Date(date)
  attendanceDate.setHours(0, 0, 0, 0)

  const academicYearRecord = student.attendance.find(
    record => record.academicYear === student.academicYear
  )

  if (academicYearRecord) {
    const recordIndex = academicYearRecord.records.findIndex(
      record => record.date.getTime() === attendanceDate.getTime()
    )
    
    if (recordIndex !== -1) {
      if (session) {
        academicYearRecord.records[recordIndex][session] = null
        
        if (academicYearRecord.records[recordIndex].morning === null && 
            academicYearRecord.records[recordIndex].afternoon === null) {
          academicYearRecord.records.splice(recordIndex, 1)
        }
      } else {
        academicYearRecord.records.splice(recordIndex, 1)
      }
      
      await student.save()
    }
  }

  res.status(200).json({
    success: true,
    message: 'Attendance record deleted successfully'
  })
})

const getMonthlyReport = asyncHandler(async (req, res) => {
  const { className, section, year, month, academicYear } = req.query

  if (!className || !section || !year || !month) {
    return res.status(400).json({
      success: false,
      message: 'Class name, section, year, and month are required'
    })
  }

  try {
    const classNum = mapClassToNumber(className)
    if (classNum === null) {
      return res.status(400).json({
        success: false,
        message: `Invalid class: "${className}"`
      })
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const students = await Student.find({
      class: classNum,
      section: section.toUpperCase(),
      academicYear: academicYear || '2024-2025'
    }).select('firstName lastName rollNo admissionNo attendance')

    const studentReports = students.map(student => {
      const attendanceRecords = student.getAttendance(startDate, endDate)
      const summary = student.getAttendanceSummary(startDate, endDate)

      return {
        student: {
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          rollNo: student.rollNo,
          admissionNo: student.admissionNo
        },
        summary,
        dailyAttendance: attendanceRecords.map(record => ({
          date: record.date,
          morning: record.morning,
          afternoon: record.afternoon,
          dayStatus: record.morning === true && record.afternoon === true ? 'present' :
                    record.morning === false && record.afternoon === false ? 'absent' :
                    record.morning === true || record.afternoon === true ? 'halfday' : 'not marked'
        }))
      }
    })

    const classSummary = {
      totalStudents: students.length,
      bestStudent: null,
      worstStudent: null,
      averageAttendance: 0
    }

    let highestPercentage = 0
    let lowestPercentage = 100
    let totalPercentage = 0

    studentReports.forEach(report => {
      const percentage = parseFloat(report.summary.attendancePercentage)
      totalPercentage += percentage
      
      if (percentage > highestPercentage) {
        highestPercentage = percentage
        classSummary.bestStudent = {
          name: report.student.name,
          rollNo: report.student.rollNo,
          percentage: percentage.toFixed(2)
        }
      }
      
      if (percentage < lowestPercentage) {
        lowestPercentage = percentage
        classSummary.worstStudent = {
          name: report.student.name,
          rollNo: report.student.rollNo,
          percentage: percentage.toFixed(2)
        }
      }
    })

    classSummary.averageAttendance = (totalPercentage / students.length).toFixed(2)

    res.status(200).json({
      success: true,
      data: {
        className,
        section,
        month: parseInt(month),
        year: parseInt(year),
        academicYear: academicYear || '2024-2025',
        period: {
          startDate,
          endDate
        },
        classSummary,
        studentReports
      }
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

const getStudentsByClass = asyncHandler(async (req, res) => {
  const { className, section, academicYear } = req.query

  if (!className || !section || !academicYear) {
    return res.status(400).json({
      success: false,
      message: 'Class name, section, and academic year are required'
    })
  }

  try {
    const classNum = mapClassToNumber(className)
    if (classNum === null) {
      return res.status(400).json({
        success: false,
        message: `Invalid class: "${className}"`
      })
    }

    const students = await Student.find({
      class: classNum,
      section: section.toUpperCase(),
      academicYear: academicYear
    })
    .select('_id rollNo firstName lastName admissionNo')
    .sort({ rollNo: 1 })
    .lean()

    const formattedStudents = students.map(student => ({
      id: student._id,
      rollNo: student.rollNo,
      name: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo
    }))

    res.status(200).json({
      success: true,
      count: formattedStudents.length,
      data: formattedStudents,
      message: `Found ${formattedStudents.length} students`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    })
  }
})

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

module.exports = {
  markAttendance,
  overrideAttendance,
  getDayAttendance,
  checkAttendanceExists,
  getDayAttendanceSummary,
  getStudentAttendance,
  getClassSummary,
  updateAttendance,
  deleteAttendance,
  getMonthlyReport,
  getStudentsByClass,
}