import prisma from '../lib/prisma.js'
import asyncHandler from 'express-async-handler'

// Map class strings to Prisma enum values
const mapClassToEnum = (className) => {
  if (!className && className !== 0) return null

  const classMap = {
    'PRE-NURSERY': 'PRE_NURSERY',
    'PRE_NURSERY': 'PRE_NURSERY',
    'NURSERY': 'NURSERY',
    'LKG': 'LKG',
    'UKG': 'UKG',
    '0': 'PRE_NURSERY',
    '0.25': 'NURSERY',
    '0.5': 'LKG',
    '0.75': 'UKG',
    '1': 'CLASS_1', 'FIRST': 'CLASS_1', 'ONE': 'CLASS_1',
    '2': 'CLASS_2', 'SECOND': 'CLASS_2', 'TWO': 'CLASS_2',
    '3': 'CLASS_3', 'THIRD': 'CLASS_3', 'THREE': 'CLASS_3',
    '4': 'CLASS_4', 'FOURTH': 'CLASS_4', 'FOUR': 'CLASS_4',
    '5': 'CLASS_5', 'FIFTH': 'CLASS_5', 'FIVE': 'CLASS_5',
    '6': 'CLASS_6', 'SIXTH': 'CLASS_6', 'SIX': 'CLASS_6',
    '7': 'CLASS_7', 'SEVENTH': 'CLASS_7', 'SEVEN': 'CLASS_7',
    '8': 'CLASS_8', 'EIGHTH': 'CLASS_8', 'EIGHT': 'CLASS_8',
    '9': 'CLASS_9', 'NINTH': 'CLASS_9', 'NINE': 'CLASS_9',
    '10': 'CLASS_10', 'TENTH': 'CLASS_10', 'TEN': 'CLASS_10',
    '11': 'CLASS_11', 'ELEVENTH': 'CLASS_11', 'ELEVEN': 'CLASS_11',
    '12': 'CLASS_12', 'TWELFTH': 'CLASS_12', 'TWELVE': 'CLASS_12',
    'I': 'CLASS_1', 'II': 'CLASS_2', 'III': 'CLASS_3', 'IV': 'CLASS_4', 'V': 'CLASS_5',
    'VI': 'CLASS_6', 'VII': 'CLASS_7', 'VIII': 'CLASS_8', 'IX': 'CLASS_9', 'X': 'CLASS_10',
    'XI': 'CLASS_11', 'XII': 'CLASS_12'
  }

  const classStr = className.toString().trim().toUpperCase()
  return classMap[classStr] || null
}

// Map section strings to Prisma enum values
const mapSectionToEnum = (section) => {
  const sectionStr = section?.toString().trim().toUpperCase()
  const validSections = ['A', 'B', 'C', 'D', 'E']
  
  if (validSections.includes(sectionStr)) {
    return sectionStr
  }
  return null
}

// Calculate attendance status for a day
const calculateDayStatus = (morning, afternoon) => {
  if (morning === true && afternoon === true) {
    return 'PRESENT'
  } else if (morning === false && afternoon === false) {
    return 'ABSENT'
  } else if (morning === true || afternoon === true) {
    return 'HALF_DAY'
  }
  return 'NOT_MARKED'
}

/**
 * @desc    Mark attendance for a class for specific session
 * @route   POST /api/attendance/mark
 * @access  Private
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const { date, className, section, studentAttendance, session, markedBy } = req.body

  // Validation - Removed markedById check since it's not in schema
  if (!date || !className || !section || !studentAttendance || !session || !markedBy) {
    return res.status(400).json({
      success: false,
      message: 'Date, class name, section, session, student attendance, and markedBy are required',
      missingFields: {
        date: !date,
        className: !className,
        section: !section,
        studentAttendance: !studentAttendance,
        session: !session,
        markedBy: !markedBy
      }
    })
  }

  if (!['morning', 'afternoon'].includes(session)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid session. Must be "morning" or "afternoon"'
    })
  }

  if (!Array.isArray(studentAttendance) || studentAttendance.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Student attendance data is required and must be an array'
    })
  }

  try {
    // Map class and section to enums
    const classEnum = mapClassToEnum(className)
    const sectionEnum = mapSectionToEnum(section)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      select: {
        id: true
      }
    })

    const studentIds = students.map(s => s.id)

    // Process attendance for each student
    const updates = []
    const creates = []

    for (const attendanceData of studentAttendance) {
      if (!studentIds.includes(attendanceData.studentId)) {
        continue // Skip students not in this class
      }

      // Check if record exists for this date
      const existingRecord = await prisma.attendance.findUnique({
        where: {
          studentId_date: {
            studentId: attendanceData.studentId,
            date: attendanceDate
          }
        }
      })

      if (existingRecord) {
        // Update existing record with current session
        updates.push(
          prisma.attendance.update({
            where: { id: existingRecord.id },
            data: {
              [session]: attendanceData.isPresent,
              updatedAt: new Date()
            }
          })
        )
      } else {
        // Create new record - only set markedBy in the create (not session specific)
        creates.push(
          prisma.attendance.create({
            data: {
              studentId: attendanceData.studentId,
              date: attendanceDate,
              morning: session === 'morning' ? attendanceData.isPresent : null,
              afternoon: session === 'afternoon' ? attendanceData.isPresent : null,
              markedBy: markedBy
            }
          })
        )
      }
    }

    // Execute all database operations
    await Promise.all([...updates, ...creates])

    // Get summary
    const summary = await calculateDaySummary(classEnum, sectionEnum, attendanceDate, session)

    res.status(201).json({
      success: true,
      data: {
        date: attendanceDate,
        className,
        section,
        session,
        summary,
        markedBy: markedBy
      },
      message: `Attendance marked successfully for ${className}-${section} (${session})`
    })
  } catch (error) {
    console.error('Error marking attendance:', error)
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    })
  }
})

/**
 * @desc    Override attendance for a class
 * @route   PUT /api/attendance/override
 * @access  Private
 */
export const overrideAttendance = asyncHandler(async (req, res) => {
  const { date, className, section, studentAttendance, session, markedBy } = req.body

  // Validation - Removed markedById
  if (!date || !className || !section || !studentAttendance || !session || !markedBy) {
    return res.status(400).json({
      success: false,
      message: 'Date, class name, section, session, student attendance, and markedBy are required'
    })
  }

  try {
    const classEnum = mapClassToEnum(className)
    const sectionEnum = mapSectionToEnum(section)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      select: {
        id: true
      }
    })

    const studentIds = students.map(s => s.id)

    // Process attendance for each student
    const updates = []

    for (const attendanceData of studentAttendance) {
      if (!studentIds.includes(attendanceData.studentId)) {
        continue // Skip students not in this class
      }

      // Check if record exists first
      const existingRecord = await prisma.attendance.findFirst({
        where: {
          studentId: attendanceData.studentId,
          date: attendanceDate
        }
      })

      if (existingRecord) {
        // Update existing record
        updates.push(
          prisma.attendance.update({
            where: { id: existingRecord.id },
            data: {
              [session]: attendanceData.isPresent,
              markedBy: markedBy,
              updatedAt: new Date()
            }
          })
        )
      } else {
        // Create new record if doesn't exist
        updates.push(
          prisma.attendance.create({
            data: {
              studentId: attendanceData.studentId,
              date: attendanceDate,
              morning: session === 'morning' ? attendanceData.isPresent : null,
              afternoon: session === 'afternoon' ? attendanceData.isPresent : null,
              markedBy: markedBy
            }
          })
        )
      }
    }

    // Execute all updates
    await Promise.all(updates)

    // Get summary
    const summary = await calculateDaySummary(classEnum, sectionEnum, attendanceDate, session)

    res.status(200).json({
      success: true,
      data: {
        date: attendanceDate,
        className,
        section,
        session,
        summary,
        markedBy: markedBy
      },
      message: `Attendance overridden successfully for ${className}-${section} (${session})`
    })
  } catch (error) {
    console.error('Error overriding attendance:', error)
    res.status(500).json({
      success: false,
      message: 'Error overriding attendance',
      error: error.message
    })
  }
})

/**
 * @desc    Get day attendance for a class
 * @route   GET /api/attendance/class/day
 * @access  Private
 */
export const getDayAttendance = asyncHandler(async (req, res) => {
  const { date, className, section } = req.query

  if (!date || !className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Date, class name, and section are required'
    })
  }

  try {
    const classEnum = mapClassToEnum(className)
    const sectionEnum = mapSectionToEnum(section)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    // Get all students in the class first
    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      select: {
        id: true,
        rollNo: true,
        firstName: true,
        lastName: true
      },
      orderBy: {
        rollNo: 'asc'
      }
    })

    // Get attendance records for these students on this date
    const studentIds = students.map(s => s.id)
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        date: attendanceDate
      }
    })

    // Create a map of studentId -> attendance record for quick lookup
    const attendanceMap = {}
    attendanceRecords.forEach(record => {
      attendanceMap[record.studentId] = record
    })

    // Format the response
    const formattedAttendance = students.map(student => {
      const attendanceRecord = attendanceMap[student.id]
      
      return {
        studentId: student.id,
        rollNo: student.rollNo,
        name: `${student.firstName} ${student.lastName}`,
        morning: attendanceRecord?.morning ?? null,
        afternoon: attendanceRecord?.afternoon ?? null,
        dayStatus: calculateDayStatus(attendanceRecord?.morning, attendanceRecord?.afternoon),
        markedBy: attendanceRecord?.markedBy
      }
    })

    // Calculate summary for both sessions
    const morningSummary = {
      present: formattedAttendance.filter(s => s.morning === true).length,
      absent: formattedAttendance.filter(s => s.morning === false).length,
      notMarked: formattedAttendance.filter(s => s.morning === null).length
    }

    const afternoonSummary = {
      present: formattedAttendance.filter(s => s.afternoon === true).length,
      absent: formattedAttendance.filter(s => s.afternoon === false).length,
      notMarked: formattedAttendance.filter(s => s.afternoon === null).length
    }

    const overallSummary = {
      totalStudents: formattedAttendance.length,
      morning: morningSummary,
      afternoon: afternoonSummary
    }

    res.status(200).json({
      success: true,
      data: {
        date: attendanceDate,
        className,
        section,
        summary: overallSummary,
        attendance: formattedAttendance
      }
    })
  } catch (error) {
    console.error('Error fetching day attendance:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    })
  }
})

/**
 * @desc    Check if attendance exists for a class session
 * @route   GET /api/attendance/check
 * @access  Private
 */
export const checkAttendanceExists = asyncHandler(async (req, res) => {
  const { date, className, section, session } = req.query

  if (!date || !className || !section || !session) {
    return res.status(400).json({
      success: false,
      message: 'Date, class name, section, and session are required'
    })
  }

  if (!['morning', 'afternoon'].includes(session)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid session. Must be "morning" or "afternoon"'
    })
  }

  try {
    const classEnum = mapClassToEnum(className)
    const sectionEnum = mapSectionToEnum(section)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    // Check if attendance exists for this session
    const count = await prisma.attendance.count({
      where: {
        date: attendanceDate,
        NOT: {
          [session]: null
        },
        student: {
          class: classEnum,
          section: sectionEnum,
          isActive: true
        }
      }
    })

    const exists = count > 0

    res.status(200).json({
      success: true,
      data: {
        exists,
        date: attendanceDate,
        className,
        section,
        session,
        totalMarked: count,
        canOverride: exists
      }
    })
  } catch (error) {
    console.error('Error checking attendance:', error)
    res.status(500).json({
      success: false,
      message: 'Error checking attendance',
      error: error.message
    })
  }
})

/**
 * @desc    Get day attendance summary for a class
 * @route   GET /api/attendance/summary/day
 * @access  Private
 */
export const getDayAttendanceSummary = asyncHandler(async (req, res) => {
  const { date, className, section, session } = req.query

  if (!date || !className || !section || !session) {
    return res.status(400).json({
      success: false,
      message: 'Date, class name, section, and session are required'
    })
  }

  try {
    const classEnum = mapClassToEnum(className)
    const sectionEnum = mapSectionToEnum(section)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    const summary = await calculateDaySummary(classEnum, sectionEnum, attendanceDate, session)

    res.status(200).json({
      success: true,
      data: {
        date: attendanceDate,
        className,
        section,
        session,
        summary
      }
    })
  } catch (error) {
    console.error('Error fetching day summary:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance summary',
      error: error.message
    })
  }
})

/**
 * @desc    Get attendance for a specific student
 * @route   GET /api/attendance/student/:studentId
 * @access  Private
 */
export const getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { startDate, endDate } = req.query

  try {
    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        rollNo: true,
        firstName: true,
        lastName: true,
        class: true,
        section: true,
        admissionNo: true,
        isActive: true
      }
    })

    if (!student || !student.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or inactive'
      })
    }

    // Set date range
    const currentDate = new Date()
    const defaultStartDate = startDate 
      ? new Date(startDate) 
      : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    
    const defaultEndDate = endDate 
      ? new Date(endDate) 
      : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    defaultStartDate.setHours(0, 0, 0, 0)
    defaultEndDate.setHours(23, 59, 59, 999)

    // Get attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId,
        date: {
          gte: defaultStartDate,
          lte: defaultEndDate
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Calculate summary
    let presentDays = 0
    let absentDays = 0
    let halfDays = 0
    let totalDays = attendanceRecords.length

    attendanceRecords.forEach(record => {
      const dayStatus = calculateDayStatus(record.morning, record.afternoon)
      
      if (dayStatus === 'PRESENT') presentDays++
      else if (dayStatus === 'ABSENT') absentDays++
      else if (dayStatus === 'HALF_DAY') halfDays++
    })

    const effectivePresentDays = presentDays + (halfDays * 0.5)
    const attendancePercentage = totalDays > 0 
      ? (effectivePresentDays / totalDays) * 100 
      : 0

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          rollNo: student.rollNo,
          admissionNo: student.admissionNo,
          class: student.class,
          section: student.section
        },
        period: {
          startDate: defaultStartDate,
          endDate: defaultEndDate
        },
        summary: {
          totalDays,
          presentDays,
          absentDays,
          halfDays,
          effectivePresentDays,
          attendancePercentage: attendancePercentage.toFixed(2)
        },
        dailyAttendance: attendanceRecords.map(record => ({
          date: record.date,
          morning: record.morning,
          afternoon: record.afternoon,
          dayStatus: calculateDayStatus(record.morning, record.afternoon),
          markedBy: record.markedBy
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching student attendance:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching student attendance',
      error: error.message
    })
  }
})

/**
 * @desc    Get class attendance summary for a date range
 * @route   GET /api/attendance/summary/range
 * @access  Private
 */
export const getClassSummary = asyncHandler(async (req, res) => {
  const { className, section, startDate, endDate } = req.query

  if (!className || !section || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Class name, section, start date, and end date are required'
    })
  }

  try {
    const classEnum = mapClassToEnum(className)
    const sectionEnum = mapSectionToEnum(section)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      select: {
        id: true,
        rollNo: true,
        firstName: true,
        lastName: true,
        attendance: {
          where: {
            date: {
              gte: start,
              lte: end
            }
          }
        }
      },
      orderBy: {
        rollNo: 'asc'
      }
    })

    // Calculate summary for each student
    const studentSummaries = []
    let classTotalPresentDays = 0
    let classTotalAbsentDays = 0
    let classTotalHalfDays = 0
    let classTotalDays = 0

    for (const student of students) {
      let presentDays = 0
      let absentDays = 0
      let halfDays = 0

      student.attendance.forEach(record => {
        const dayStatus = calculateDayStatus(record.morning, record.afternoon)

        if (dayStatus === 'PRESENT') presentDays++
        else if (dayStatus === 'ABSENT') absentDays++
        else if (dayStatus === 'HALF_DAY') halfDays++
      })

      const totalDays = student.attendance.length
      const effectivePresentDays = presentDays + (halfDays * 0.5)
      const attendancePercentage = totalDays > 0 
        ? (effectivePresentDays / totalDays) * 100 
        : 0

      studentSummaries.push({
        studentId: student.id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        summary: {
          totalDays,
          presentDays,
          absentDays,
          halfDays,
          effectivePresentDays,
          attendancePercentage: attendancePercentage.toFixed(2)
        }
      })

      // Update class totals
      classTotalPresentDays += presentDays
      classTotalAbsentDays += absentDays
      classTotalHalfDays += halfDays
      classTotalDays += totalDays
    }

    // Calculate class average
    const classEffectivePresentDays = classTotalPresentDays + (classTotalHalfDays * 0.5)
    const classAverageAttendance = classTotalDays > 0
      ? (classEffectivePresentDays / classTotalDays) * 100
      : 0

    res.status(200).json({
      success: true,
      data: {
        className,
        section,
        period: {
          startDate: start,
          endDate: end
        },
        classSummary: {
          totalStudents: students.length,
          totalDays: classTotalDays,
          totalPresentDays: classTotalPresentDays,
          totalAbsentDays: classTotalAbsentDays,
          totalHalfDays: classTotalHalfDays,
          totalEffectivePresentDays: classEffectivePresentDays,
          averageAttendance: classAverageAttendance.toFixed(2)
        },
        studentSummaries
      }
    })
  } catch (error) {
    console.error('Error fetching class summary:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching class summary',
      error: error.message
    })
  }
})

/**
 * @desc    Update attendance for a student
 * @route   PUT /api/attendance/:studentId
 * @access  Private
 */
export const updateAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { date, morning, afternoon, session, markedBy } = req.body

  // Removed markedById validation
  if (!date || !session || !markedBy) {
    return res.status(400).json({
      success: false,
      message: 'Date, session, and markedBy are required'
    })
  }

  if (!['morning', 'afternoon'].includes(session)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid session. Must be "morning" or "afternoon"'
    })
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!student || !student.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or inactive'
      })
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    // Determine which field to update
    const updateData = {
      markedBy: markedBy,
      updatedAt: new Date()
    }

    if (session === 'morning' && morning !== undefined) {
      updateData.morning = morning
    } else if (session === 'afternoon' && afternoon !== undefined) {
      updateData.afternoon = afternoon
    } else {
      return res.status(400).json({
        success: false,
        message: `Please provide ${session} attendance value`
      })
    }

    // Update or create attendance record
    const updatedAttendance = await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId,
          date: attendanceDate
        }
      },
      update: updateData,
      create: {
        studentId,
        date: attendanceDate,
        morning: session === 'morning' ? morning : null,
        afternoon: session === 'afternoon' ? afternoon : null,
        markedBy: markedBy
      }
    })

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          rollNo: student.rollNo
        },
        date: attendanceDate,
        session,
        morning: updatedAttendance.morning,
        afternoon: updatedAttendance.afternoon,
        dayStatus: calculateDayStatus(updatedAttendance.morning, updatedAttendance.afternoon),
        markedBy: updatedAttendance.markedBy
      },
      message: `Attendance updated successfully for ${session} session`
    })
  } catch (error) {
    console.error('Error updating attendance:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating attendance',
      error: error.message
    })
  }
})

/**
 * @desc    Delete attendance for a student
 * @route   DELETE /api/attendance/:studentId
 * @access  Private
 */
export const deleteAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { date, session } = req.body

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date is required'
    })
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!student || !student.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or inactive'
      })
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    if (session) {
      // Delete specific session attendance
      const existingRecord = await prisma.attendance.findUnique({
        where: {
          studentId_date: {
            studentId,
            date: attendanceDate
          }
        }
      })

      if (existingRecord) {
        // Clear the specific session
        await prisma.attendance.update({
          where: { id: existingRecord.id },
          data: {
            [session]: null,
            updatedAt: new Date()
          }
        })

        // If both sessions are null, delete the record
        if (existingRecord.morning === null && existingRecord.afternoon === null) {
          await prisma.attendance.delete({
            where: { id: existingRecord.id }
          })
        }
      }
    } else {
      // Delete entire attendance record
      await prisma.attendance.deleteMany({
        where: {
          studentId,
          date: attendanceDate
        }
      })
    }

    res.status(200).json({
      success: true,
      message: session ? `${session} attendance deleted successfully` : 'Attendance record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting attendance:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance',
      error: error.message
    })
  }
})

/**
 * @desc    Get monthly attendance report
 * @route   GET /api/attendance/report/monthly
 * @access  Private
 */
export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { className, section, year, month } = req.query

  if (!className || !section || !year || !month) {
    return res.status(400).json({
      success: false,
      message: 'Class name, section, year, and month are required'
    })
  }

  try {
    const classEnum = mapClassToEnum(className)
    const sectionEnum = mapSectionToEnum(section)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    // Get all students with their attendance for the month
    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      select: {
        id: true,
        rollNo: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        attendance: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: {
            date: 'asc'
          }
        }
      },
      orderBy: {
        rollNo: 'asc'
      }
    })

    // Generate monthly report for each student
    const studentReports = []
    let highestPercentage = 0
    let lowestPercentage = 100
    let totalPercentage = 0

    for (const student of students) {
      // Calculate monthly attendance
      let presentDays = 0
      let absentDays = 0
      let halfDays = 0

      student.attendance.forEach(record => {
        const dayStatus = calculateDayStatus(record.morning, record.afternoon)
        
        if (dayStatus === 'PRESENT') presentDays++
        else if (dayStatus === 'ABSENT') absentDays++
        else if (dayStatus === 'HALF_DAY') halfDays++
      })

      const totalDays = student.attendance.length
      const effectivePresentDays = presentDays + (halfDays * 0.5)
      const attendancePercentage = totalDays > 0 
        ? (effectivePresentDays / totalDays) * 100 
        : 0

      studentReports.push({
        student: {
          _id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          rollNo: student.rollNo,
          admissionNo: student.admissionNo
        },
        summary: {
          totalDays,
          presentDays,
          absentDays,
          halfDays,
          effectivePresentDays,
          attendancePercentage: attendancePercentage.toFixed(2)
        },
        dailyAttendance: student.attendance.map(record => ({
          date: record.date,
          morning: record.morning,
          afternoon: record.afternoon,
          dayStatus: calculateDayStatus(record.morning, record.afternoon),
          markedBy: record.markedBy
        }))
      })

      // Update best/worst student tracking
      if (attendancePercentage > highestPercentage) {
        highestPercentage = attendancePercentage
      }
      if (attendancePercentage < lowestPercentage) {
        lowestPercentage = attendancePercentage
      }
      totalPercentage += attendancePercentage
    }

    // Find best and worst students
    const bestStudent = studentReports.find(
      report => parseFloat(report.summary.attendancePercentage) === highestPercentage
    )
    const worstStudent = studentReports.find(
      report => parseFloat(report.summary.attendancePercentage) === lowestPercentage
    )

    const classSummary = {
      totalStudents: students.length,
      bestStudent: bestStudent ? {
        name: bestStudent.student.name,
        rollNo: bestStudent.student.rollNo,
        percentage: bestStudent.summary.attendancePercentage
      } : null,
      worstStudent: worstStudent ? {
        name: worstStudent.student.name,
        rollNo: worstStudent.student.rollNo,
        percentage: worstStudent.summary.attendancePercentage
      } : null,
      averageAttendance: (totalPercentage / students.length).toFixed(2)
    }

    res.status(200).json({
      success: true,
      data: {
        className,
        section,
        month: parseInt(month),
        year: parseInt(year),
        period: {
          startDate,
          endDate
        },
        classSummary,
        studentReports
      }
    })
  } catch (error) {
    console.error('Error generating monthly report:', error)
    res.status(500).json({
      success: false,
      message: 'Error generating monthly report',
      error: error.message
    })
  }
})

/**
 * @desc    Get students list by class and section
 * @route   GET /api/attendance/students/list
 * @access  Private
 */
export const getStudentsListByClass = asyncHandler(async (req, res) => {
  const { className, section } = req.query

  if (!className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Class name and section are required'
    })
  }

  try {
    const classEnum = mapClassToEnum(className)
    const sectionEnum = mapSectionToEnum(section)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      select: {
        id: true,
        rollNo: true,
        firstName: true,
        lastName: true
      },
      orderBy: {
        rollNo: 'asc'
      }
    })

    const formattedStudents = students.map(student => ({
      id: student.id,
      rollNo: student.rollNo,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`
    }))

    res.status(200).json({
      success: true,
      count: formattedStudents.length,
      data: formattedStudents,
      message: `Found ${formattedStudents.length} students in ${className}-${section}`
    })
  } catch (error) {
    console.error('Error fetching students list:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching students list',
      error: error.message
    })
  }
})

/**
 * @desc    Get session status for a class on a specific date
 * @route   GET /api/attendance/session/status
 * @access  Private
 */
export const getSessionStatus = asyncHandler(async (req, res) => {
  const { date, className, section } = req.query

  if (!date || !className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Date, class name, and section are required'
    })
  }

  try {
    const classEnum = mapClassToEnum(className)
    const sectionEnum = mapSectionToEnum(section)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    // Get attendance for the day
    const attendance = await prisma.attendance.findMany({
      where: {
        date: attendanceDate,
        student: {
          class: classEnum,
          section: sectionEnum,
          isActive: true
        }
      },
      select: {
        morning: true,
        afternoon: true
      }
    })

    // Calculate session status
    const morningMarked = attendance.filter(a => a.morning !== null).length
    const afternoonMarked = attendance.filter(a => a.afternoon !== null).length
    const totalStudents = attendance.length

    const morningStatus = {
      marked: morningMarked,
      total: totalStudents,
      percentage: totalStudents > 0 ? ((morningMarked / totalStudents) * 100).toFixed(2) : 0,
      isComplete: morningMarked === totalStudents
    }

    const afternoonStatus = {
      marked: afternoonMarked,
      total: totalStudents,
      percentage: totalStudents > 0 ? ((afternoonMarked / totalStudents) * 100).toFixed(2) : 0,
      isComplete: afternoonMarked === totalStudents
    }

    res.status(200).json({
      success: true,
      data: {
        date: attendanceDate,
        className,
        section,
        morning: morningStatus,
        afternoon: afternoonStatus
      }
    })
  } catch (error) {
    console.error('Error fetching session status:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching session status',
      error: error.message
    })
  }
})

// Helper function to calculate day summary for specific session
const calculateDaySummary = async (classEnum, sectionEnum, date, session) => {
  const attendanceDate = new Date(date)
  attendanceDate.setHours(0, 0, 0, 0)

  // Get attendance for the day
  const attendance = await prisma.attendance.findMany({
    where: {
      date: attendanceDate,
      student: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      }
    },
    include: {
      student: {
        select: {
          id: true,
          rollNo: true
        }
      }
    }
  })

  // Calculate summary for specific session
  let presentCount = 0
  let absentCount = 0
  let notMarkedCount = 0

  attendance.forEach(record => {
    const sessionStatus = session === 'morning' ? record.morning : record.afternoon
    
    if (sessionStatus === true) presentCount++
    else if (sessionStatus === false) absentCount++
    else notMarkedCount++
  })

  const totalStudents = attendance.length
  const attendancePercentage = totalStudents > 0 
    ? (presentCount / totalStudents) * 100 
    : 0

  return {
    totalStudents,
    present: presentCount,
    absent: absentCount,
    notMarked: notMarkedCount,
    attendancePercentage: attendancePercentage.toFixed(2)
  }
}

// Export helper functions
export { mapClassToEnum, mapSectionToEnum, calculateDayStatus }