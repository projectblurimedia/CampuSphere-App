import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Calculate attendance statistics for a student
 */
export const calculateStudentStats = async (studentId, startDate, endDate) => {
  const attendance = await prisma.attendance.findMany({
    where: {
      studentId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      date: 'asc'
    }
  })

  // Group by date
  const attendanceByDate = {}
  attendance.forEach(record => {
    const dateKey = record.date.toISOString().split('T')[0]
    if (!attendanceByDate[dateKey]) {
      attendanceByDate[dateKey] = {
        morning: null,
        afternoon: null
      }
    }
    
    if (record.session === 'MORNING') {
      attendanceByDate[dateKey].morning = record.isPresent
    } else if (record.session === 'AFTERNOON') {
      attendanceByDate[dateKey].afternoon = record.isPresent
    }
  })

  let presentDays = 0
  let absentDays = 0
  let halfDays = 0

  Object.values(attendanceByDate).forEach(day => {
    const morningPresent = day.morning
    const afternoonPresent = day.afternoon

    if (morningPresent === true && afternoonPresent === true) {
      presentDays++
    } else if (morningPresent === false && afternoonPresent === false) {
      absentDays++
    } else if (morningPresent === true || afternoonPresent === true) {
      halfDays++
    }
  })

  const totalDays = Object.keys(attendanceByDate).length
  const effectivePresentDays = presentDays + (halfDays * 0.5)
  const attendancePercentage = totalDays > 0 
    ? (effectivePresentDays / totalDays) * 100 
    : 0

  return {
    totalDays,
    presentDays,
    absentDays,
    halfDays,
    effectivePresentDays,
    attendancePercentage: attendancePercentage.toFixed(2)
  }
}

/**
 * Generate attendance report for a class
 */
export const generateClassReport = async (classEnum, sectionEnum, startDate, endDate) => {
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

  const studentReports = []
  let classTotalPresentDays = 0
  let classTotalAbsentDays = 0
  let classTotalHalfDays = 0
  let classTotalDays = 0

  for (const student of students) {
    const stats = await calculateStudentStats(student.id, startDate, endDate)
    
    studentReports.push({
      studentId: student.id,
      rollNo: student.rollNo,
      name: `${student.firstName} ${student.lastName}`,
      ...stats
    })

    classTotalPresentDays += stats.presentDays
    classTotalAbsentDays += stats.absentDays
    classTotalHalfDays += stats.halfDays
    classTotalDays += stats.totalDays
  }

  const classEffectivePresentDays = classTotalPresentDays + (classTotalHalfDays * 0.5)
  const classAverageAttendance = classTotalDays > 0
    ? (classEffectivePresentDays / classTotalDays) * 100
    : 0

  return {
    totalStudents: students.length,
    classSummary: {
      totalDays: classTotalDays,
      totalPresentDays: classTotalPresentDays,
      totalAbsentDays: classTotalAbsentDays,
      totalHalfDays: classTotalHalfDays,
      totalEffectivePresentDays: classEffectivePresentDays,
      averageAttendance: classAverageAttendance.toFixed(2)
    },
    studentReports
  }
}

/**
 * Check if a date is a working day (you can customize this based on your school calendar)
 */
export const isWorkingDay = (date) => {
  const dayOfWeek = date.getDay()
  // Saturday = 6, Sunday = 0
  return dayOfWeek !== 0 && dayOfWeek !== 6
}

/**
 * Get school working days between two dates
 */
export const getWorkingDays = (startDate, endDate) => {
  const workingDays = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    if (isWorkingDay(current)) {
      workingDays.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  
  return workingDays
}