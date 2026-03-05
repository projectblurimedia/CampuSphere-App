import prisma from '../lib/prisma.js'

// ==================== HELPER FUNCTIONS ====================

const formatValue = (value, prefix = '') => {
  if (value === null || value === undefined) return '-'
  return prefix + value.toString()
}

const calculatePercentage = (part, total) => {
  if (!total || total === 0) return '-'
  return ((part / total) * 100).toFixed(1) + '%'
}

const getAcademicYear = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  // Academic year starts in June (month 5)
  if (month >= 5) {
    return `${year}-${year + 1}`
  } else {
    return `${year - 1}-${year}`
  }
}

// ==================== MAIN AGGREGATE STATS ====================

/**
 * @desc    Get all statistics in one response
 * @route   GET /api/stats
 * @access  Public/Private
 */
export const getAllStats = async (req, res) => {
  try {
    const academicYear = getAcademicYear()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Run all queries in parallel for efficiency
    const [
      school,
      totalStudents,
      activeStudents,
      totalTeachers,
      totalStaff,
      studentGenderBreakdown,
      staffGenderBreakdown,
      todayAttendance,
      averageAttendance,
      academicStats,
      transportStats,
      classSections,
      feeStats
    ] = await Promise.all([
      // School info
      prisma.school.findFirst(),
      
      // Student counts
      prisma.student.count(),
      prisma.student.count({ where: { isActive: true } }),
      
      // Teacher count (designation: Teacher)
      prisma.employee.count({ 
        where: { 
          designation: 'Teacher',
          isActive: true 
        } 
      }),
      
      // Total staff count
      prisma.employee.count({ where: { isActive: true } }),
      
      // Student gender breakdown
      prisma.student.groupBy({
        by: ['gender'],
        _count: true,
        where: { isActive: true }
      }),
      
      // Staff gender breakdown
      prisma.employee.groupBy({
        by: ['gender'],
        _count: true,
        where: { isActive: true }
      }),
      
      // Today's attendance
      prisma.attendance.count({
        where: {
          date: today,
          morning: true
        }
      }),
      
      // Average attendance (last 30 days)
      prisma.$queryRaw`
        SELECT AVG(daily_count) as avg_attendance
        FROM (
          SELECT date, COUNT(*) as daily_count
          FROM "Attendance"
          WHERE date >= NOW() - INTERVAL '30 days'
          AND morning = true
          GROUP BY date
       ) as daily
      `,
      
      // Academic stats
      prisma.marks.groupBy({
        by: ['overallResult'],
        _count: true,
        where: {
          examType: 'FINAL',
          student: {
            isActive: true
          }
        }
      }),
      
      // Transport stats
      (async () => {
        const buses = await prisma.bus.findMany()
        const studentsUsingTransport = await prisma.student.count({
          where: {
            isActive: true,
            isUsingSchoolTransport: true
          }
        })
        return { buses, studentsUsingTransport }
      })(),
      
      // Class sections count
      prisma.student.groupBy({
        by: ['class', 'section'],
        where: { isActive: true }
      }),
      
      // Fee stats
      (async () => {
        const [totalDue, totalCollected, defaulters] = await Promise.all([
          prisma.feeDetails.aggregate({
            where: { student: { isActive: true } },
            _sum: { totalDue: true }
          }),
          prisma.paymentHistory.aggregate({
            _sum: { totalAmount: true }
          }),
          prisma.feeDetails.count({
            where: {
              student: { isActive: true },
              totalDue: { gt: 0 }
            }
          })
        ])
        return { totalDue, totalCollected, defaulters }
      })()
    ])

    // Process student gender breakdown
    const boysCount = studentGenderBreakdown.find(g => g.gender === 'MALE')?._count || 0
    const girlsCount = studentGenderBreakdown.find(g => g.gender === 'FEMALE')?._count || 0
    const otherGenderCount = studentGenderBreakdown.find(g => g.gender === 'NOT_SPECIFIED')?._count || 0

    // Process staff gender breakdown
    const staffMale = staffGenderBreakdown.find(g => g.gender === 'MALE')?._count || 0
    const staffFemale = staffGenderBreakdown.find(g => g.gender === 'FEMALE')?._count || 0

    // Process academic stats
    const passedStudents = academicStats.find(r => r.overallResult === 'PASS')?._count || 0
    const failedStudents = academicStats.find(r => r.overallResult === 'FAIL')?._count || 0
    const totalStudentsWithMarks = passedStudents + failedStudents

    // Process transport stats
    const { buses, studentsUsingTransport } = transportStats
    const activeBuses = buses.filter(b => b.status !== 'maintenance').length || 0
    const underMaintenance = buses.length - activeBuses

    // Process fee stats
    const totalDueAmount = feeStats.totalDue._sum?.totalDue || 0
    const totalCollectedAmount = feeStats.totalCollected._sum?.totalAmount || 0

    // Calculate attendance
    const avgAttendance = averageAttendance[0]?.avg_attendance 
      ? Math.round(averageAttendance[0].avg_attendance) 
      : 0

    const response = {
      success: true,
      data: {
        // Basic Information
        basicInfo: {
          schoolName: school?.name || '-',
          establishedYear: school?.establishedYear || '-',
          affiliation: school?.affiliation || '-',
          board: school?.board || '-',
          principal: school?.principal || '-',
          email: school?.email || '-',
          phone: school?.phone || '-',
          address: school?.address || '-',
        },
        
        // School Overview Stats
        overview: {
          totalStudents: formatValue(totalStudents),
          activeStudents: formatValue(activeStudents),
          totalTeachers: formatValue(totalTeachers),
          totalStaff: formatValue(totalStaff),
          totalClassSections: formatValue(classSections.length),
          academicYear,
        },
        
        // Student Gender Breakdown
        studentGender: {
          boys: formatValue(boysCount),
          girls: formatValue(girlsCount),
          others: formatValue(otherGenderCount),
          boysPercentage: calculatePercentage(boysCount, totalStudents),
          girlsPercentage: calculatePercentage(girlsCount, totalStudents),
        },
        
        // Staff Breakdown
        staffBreakdown: {
          male: formatValue(staffMale),
          female: formatValue(staffFemale),
          teachers: formatValue(totalTeachers),
          otherStaff: formatValue(totalStaff - totalTeachers),
          malePercentage: calculatePercentage(staffMale, totalStaff),
          femalePercentage: calculatePercentage(staffFemale, totalStaff),
        },
        
        // Academic Performance
        academic: {
          overallPassPercentage: calculatePercentage(passedStudents, totalStudentsWithMarks),
          totalStudentsAppeared: formatValue(totalStudentsWithMarks),
          passedStudents: formatValue(passedStudents),
          failedStudents: formatValue(failedStudents),
          boysPassPercentage: '-', // Would need more detailed query
          girlsPassPercentage: '-', // Would need more detailed query
        },
        
        // Attendance Statistics
        attendance: {
          today: formatValue(todayAttendance),
          averageDaily: formatValue(avgAttendance),
          todayPercentage: calculatePercentage(todayAttendance, activeStudents),
          averagePercentage: avgAttendance ? 
            calculatePercentage(avgAttendance, activeStudents) : '-',
          boysAttendance: '-', // Would need detailed query
          girlsAttendance: '-', // Would need detailed query
        },
        
        // Transportation
        transport: {
          totalBuses: formatValue(buses.length),
          activeBuses: formatValue(activeBuses),
          underMaintenance: formatValue(underMaintenance),
          studentsUsingTransport: formatValue(studentsUsingTransport),
          busRoutes: formatValue(buses.reduce((acc, b) => acc + (b.routes?.length || 0), 0)),
        },
        
        // Fee Statistics
        fees: {
          totalDue: formatValue(totalDueAmount, '₹ '),
          totalCollected: formatValue(totalCollectedAmount, '₹ '),
          defaultersCount: formatValue(feeStats.defaulters),
          collectionEfficiency: calculatePercentage(totalCollectedAmount, totalDueAmount + totalCollectedAmount),
        },
        
        // Will be populated by separate endpoint if needed
        classWisePerformance: []
      }
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Get all stats error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch statistics',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// ==================== INDIVIDUAL STAT ENDPOINTS ====================

/**
 * @desc    Get school basic stats
 * @route   GET /api/stats/school
 */
export const getSchoolStats = async (req, res) => {
  try {
    const school = await prisma.school.findFirst()
    
    const stats = {
      name: school?.name || '-',
      establishedYear: school?.establishedYear || '-',
      affiliation: school?.affiliation || '-',
      board: school?.board || '-',
      principal: school?.principal || '-',
      vicePrincipal: school?.vicePrincipal || '-',
      email: school?.email || '-',
      phone: school?.phone || '-',
      address: school?.address || '-',
      website: school?.website || '-',
      schoolHours: school?.schoolHours || '-',
      workingDays: school?.workingDays || '-',
      totalStudents: await prisma.student.count(),
      activeStudents: await prisma.student.count({ where: { isActive: true } }),
      totalStaff: await prisma.employee.count(),
      activeStaff: await prisma.employee.count({ where: { isActive: true } }),
    }

    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    console.error('Get school stats error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get student statistics with gender breakdown
 * @route   GET /api/stats/students
 */
export const getStudentStats = async (req, res) => {
  try {
    const totalStudents = await prisma.student.count()
    const activeStudents = await prisma.student.count({ where: { isActive: true } })
    
    const genderBreakdown = await prisma.student.groupBy({
      by: ['gender'],
      _count: true,
      where: { isActive: true }
    })

    const classBreakdown = await prisma.student.groupBy({
      by: ['class'],
      _count: true,
      where: { isActive: true },
      orderBy: { class: 'asc' }
    })

    const studentTypeBreakdown = await prisma.student.groupBy({
      by: ['studentType'],
      _count: true,
      where: { isActive: true }
    })

    const boys = genderBreakdown.find(g => g.gender === 'MALE')?._count || 0
    const girls = genderBreakdown.find(g => g.gender === 'FEMALE')?._count || 0
    const others = genderBreakdown.find(g => g.gender === 'NOT_SPECIFIED')?._count || 0

    const dayScholars = studentTypeBreakdown.find(t => t.studentType === 'DAY_SCHOLAR')?._count || 0
    const hostellers = studentTypeBreakdown.find(t => t.studentType === 'HOSTELLER')?._count || 0

    const stats = {
      total: formatValue(totalStudents),
      active: formatValue(activeStudents),
      inactive: formatValue(totalStudents - activeStudents),
      gender: {
        boys: formatValue(boys),
        girls: formatValue(girls),
        others: formatValue(others),
        boysPercentage: calculatePercentage(boys, activeStudents),
        girlsPercentage: calculatePercentage(girls, activeStudents),
      },
      type: {
        dayScholars: formatValue(dayScholars),
        hostellers: formatValue(hostellers),
        dayScholarPercentage: calculatePercentage(dayScholars, activeStudents),
        hostellerPercentage: calculatePercentage(hostellers, activeStudents),
      },
      classWise: classBreakdown.map(c => ({
        class: c.class,
        count: formatValue(c._count),
        percentage: calculatePercentage(c._count, activeStudents)
      }))
    }

    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    console.error('Get student stats error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get staff statistics
 * @route   GET /api/stats/staff
 */
export const getStaffStats = async (req, res) => {
  try {
    const totalStaff = await prisma.employee.count()
    const activeStaff = await prisma.employee.count({ where: { isActive: true } })
    
    const genderBreakdown = await prisma.employee.groupBy({
      by: ['gender'],
      _count: true,
      where: { isActive: true }
    })

    const designationBreakdown = await prisma.employee.groupBy({
      by: ['designation'],
      _count: true,
      where: { isActive: true },
      orderBy: { designation: 'asc' }
    })

    const male = genderBreakdown.find(g => g.gender === 'MALE')?._count || 0
    const female = genderBreakdown.find(g => g.gender === 'FEMALE')?._count || 0

    const stats = {
      total: formatValue(totalStaff),
      active: formatValue(activeStaff),
      inactive: formatValue(totalStaff - activeStaff),
      gender: {
        male: formatValue(male),
        female: formatValue(female),
        malePercentage: calculatePercentage(male, activeStaff),
        femalePercentage: calculatePercentage(female, activeStaff),
      },
      byDesignation: designationBreakdown.map(d => ({
        designation: d.designation,
        count: formatValue(d._count),
        percentage: calculatePercentage(d._count, activeStaff)
      }))
    }

    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    console.error('Get staff stats error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get academic performance statistics
 * @route   GET /api/stats/academic
 */
export const getAcademicStats = async (req, res) => {
  try {
    const { examType = 'FINAL' } = req.query

    // Get overall results
    const resultBreakdown = await prisma.marks.groupBy({
      by: ['overallResult'],
      _count: true,
      where: {
        examType: examType,
        student: { isActive: true }
      }
    })

    // Get class-wise results
    const classWiseResults = await prisma.marks.findMany({
      where: {
        examType: examType,
        student: { isActive: true }
      },
      select: {
        overallResult: true,
        percentage: true,
        student: {
          select: {
            class: true,
            section: true
          }
        }
      }
    })

    // Process class-wise data
    const classWise = {}
    classWiseResults.forEach(result => {
      const className = result.student.class
      if (!classWise[className]) {
        classWise[className] = {
          total: 0,
          passed: 0,
          failed: 0,
          totalPercentage: 0
        }
      }
      classWise[className].total++
      if (result.overallResult === 'PASS') {
        classWise[className].passed++
      } else if (result.overallResult === 'FAIL') {
        classWise[className].failed++
      }
      if (result.percentage) {
        classWise[className].totalPercentage += result.percentage
      }
    })

    const passed = resultBreakdown.find(r => r.overallResult === 'PASS')?._count || 0
    const failed = resultBreakdown.find(r => r.overallResult === 'FAIL')?._count || 0
    const total = passed + failed

    const stats = {
      examType,
      overall: {
        totalStudents: formatValue(total),
        passed: formatValue(passed),
        failed: formatValue(failed),
        passPercentage: calculatePercentage(passed, total),
        failPercentage: calculatePercentage(failed, total),
      },
      classWise: Object.entries(classWise).map(([className, data]) => ({
        class: className,
        totalStudents: formatValue(data.total),
        passed: formatValue(data.passed),
        failed: formatValue(data.failed),
        passPercentage: calculatePercentage(data.passed, data.total),
        averagePercentage: data.total > 0 
          ? (data.totalPercentage / data.total).toFixed(1) + '%' 
          : '-'
      }))
    }

    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    console.error('Get academic stats error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get attendance statistics
 * @route   GET /api/stats/attendance
 */
export const getAttendanceStats = async (req, res) => {
  try {
    const { days = 30 } = req.query
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))

    // Get today's attendance
    const todayAttendance = await prisma.attendance.count({
      where: {
        date: today,
        morning: true
      }
    })

    // Get attendance trend
    const attendanceTrend = await prisma.$queryRaw`
      SELECT 
        date,
        COUNT(*) as present_count,
        (SELECT COUNT(*) FROM "Student" WHERE "isActive" = true) as total_students
      FROM "Attendance"
      WHERE date >= ${startDate}
        AND morning = true
      GROUP BY date
      ORDER BY date ASC
    `

    // Get class-wise attendance for today
    const classWiseAttendance = await prisma.$queryRaw`
      SELECT 
        s.class,
        COUNT(DISTINCT a."studentId") as present_count,
        COUNT(DISTINCT s.id) as total_students
      FROM "Student" s
      LEFT JOIN "Attendance" a ON s.id = a."studentId" 
        AND a.date = ${today}
        AND a.morning = true
      WHERE s."isActive" = true
      GROUP BY s.class
      ORDER BY s.class
    `

    const totalStudents = await prisma.student.count({ where: { isActive: true } })

    const stats = {
      today: {
        present: formatValue(todayAttendance),
        total: formatValue(totalStudents),
        percentage: calculatePercentage(todayAttendance, totalStudents)
      },
      trend: attendanceTrend.map(day => ({
        date: day.date.toISOString().split('T')[0],
        present: day.present_count,
        total: day.total_students,
        percentage: ((day.present_count / day.total_students) * 100).toFixed(1) + '%'
      })),
      classWise: classWiseAttendance.map(c => ({
        class: c.class,
        present: formatValue(c.present_count),
        total: formatValue(c.total_students),
        percentage: calculatePercentage(c.present_count, c.total_students)
      }))
    }

    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    console.error('Get attendance stats error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get transportation statistics
 * @route   GET /api/stats/transport
 */
export const getTransportStats = async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      include: {
        school: true
      }
    })

    const studentsUsingTransport = await prisma.student.count({
      where: {
        isActive: true,
        isUsingSchoolTransport: true
      }
    })

    // Get village-wise transport usage
    const villageWise = await prisma.student.groupBy({
      by: ['village'],
      _count: true,
      where: {
        isActive: true,
        isUsingSchoolTransport: true,
        village: { not: null }
      }
    })

    const activeBuses = buses.filter(b => b.status !== 'maintenance').length || 0
    const underMaintenance = buses.length - activeBuses

    const stats = {
      overview: {
        totalBuses: formatValue(buses.length),
        activeBuses: formatValue(activeBuses),
        underMaintenance: formatValue(underMaintenance),
        studentsUsingTransport: formatValue(studentsUsingTransport),
      },
      buses: buses.map(bus => ({
        id: bus.id,
        name: bus.name,
        busNumber: bus.busNumber,
        driverName: bus.driverName,
        driverPhone: bus.driverPhone,
        routes: bus.routes || [],
        status: bus.status || 'active'
      })),
      villageWise: villageWise.map(v => ({
        village: v.village || 'Not Specified',
        students: formatValue(v._count)
      }))
    }

    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    console.error('Get transport stats error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get class-wise statistics
 * @route   GET /api/stats/class-wise
 */
export const getClassWiseStats = async (req, res) => {
  try {
    const { class: className } = req.query
    const where = className ? { class: className } : {}

    // Get all active classes with their sections
    const classSections = await prisma.student.groupBy({
      by: ['class', 'section'],
      where: { isActive: true },
      orderBy: [
        { class: 'asc' },
        { section: 'asc' }
      ]
    })

    // For each class-section, get detailed stats
    const classWiseStats = await Promise.all(
      classSections.map(async ({ class: cls, section }) => {
        const students = await prisma.student.findMany({
          where: {
            class: cls,
            section: section,
            isActive: true
          },
          select: {
            id: true,
            gender: true,
            studentType: true
          }
        })

        // Get today's attendance for this class-section
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const presentToday = await prisma.attendance.count({
          where: {
            date: today,
            morning: true,
            student: {
              class: cls,
              section: section,
              isActive: true
            }
          }
        })

        // Get academic performance
        const marks = await prisma.marks.findMany({
          where: {
            examType: 'FINAL',
            student: {
              class: cls,
              section: section,
              isActive: true
            }
          },
          select: {
            overallResult: true,
            percentage: true
          }
        })

        const totalStudents = students.length
        const boys = students.filter(s => s.gender === 'MALE').length
        const girls = students.filter(s => s.gender === 'FEMALE').length
        const passed = marks.filter(m => m.overallResult === 'PASS').length

        return {
          class: cls,
          section: section,
          totalStudents: formatValue(totalStudents),
          boys: formatValue(boys),
          girls: formatValue(girls),
          presentToday: formatValue(presentToday),
          attendancePercentage: calculatePercentage(presentToday, totalStudents),
          passPercentage: calculatePercentage(passed, marks.length),
          hasData: totalStudents > 0
        }
      })
    )

    res.status(200).json({
      success: true,
      data: classWiseStats.filter(c => c.hasData)
    })
  } catch (error) {
    console.error('Get class-wise stats error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get gender breakdown statistics
 * @route   GET /api/stats/gender-breakdown
 */
export const getGenderBreakdown = async (req, res) => {
  try {
    // Students gender breakdown
    const studentGender = await prisma.student.groupBy({
      by: ['gender'],
      _count: true,
      where: { isActive: true }
    })

    // Staff gender breakdown
    const staffGender = await prisma.employee.groupBy({
      by: ['gender'],
      _count: true,
      where: { isActive: true }
    })

    // Class-wise gender breakdown
    const classGender = await prisma.$queryRaw`
      SELECT 
        class,
        COUNT(CASE WHEN gender = 'MALE' THEN 1 END) as boys,
        COUNT(CASE WHEN gender = 'FEMALE' THEN 1 END) as girls,
        COUNT(*) as total
      FROM "Student"
      WHERE "isActive" = true
      GROUP BY class
      ORDER BY class
    `

    const totalStudents = studentGender.reduce((acc, g) => acc + g._count, 0)
    const totalStaff = staffGender.reduce((acc, g) => acc + g._count, 0)

    const stats = {
      students: {
        total: formatValue(totalStudents),
        male: formatValue(studentGender.find(g => g.gender === 'MALE')?._count || 0),
        female: formatValue(studentGender.find(g => g.gender === 'FEMALE')?._count || 0),
        other: formatValue(studentGender.find(g => g.gender === 'NOT_SPECIFIED')?._count || 0),
        malePercentage: calculatePercentage(
          studentGender.find(g => g.gender === 'MALE')?._count || 0, 
          totalStudents
        ),
        femalePercentage: calculatePercentage(
          studentGender.find(g => g.gender === 'FEMALE')?._count || 0, 
          totalStudents
        )
      },
      staff: {
        total: formatValue(totalStaff),
        male: formatValue(staffGender.find(g => g.gender === 'MALE')?._count || 0),
        female: formatValue(staffGender.find(g => g.gender === 'FEMALE')?._count || 0),
        malePercentage: calculatePercentage(
          staffGender.find(g => g.gender === 'MALE')?._count || 0, 
          totalStaff
        ),
        femalePercentage: calculatePercentage(
          staffGender.find(g => g.gender === 'FEMALE')?._count || 0, 
          totalStaff
        )
      },
      classWise: classGender.map(c => ({
        class: c.class,
        boys: formatValue(c.boys),
        girls: formatValue(c.girls),
        total: formatValue(c.total),
        boysPercentage: calculatePercentage(parseInt(c.boys), parseInt(c.total)),
        girlsPercentage: calculatePercentage(parseInt(c.girls), parseInt(c.total))
      }))
    }

    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    console.error('Get gender breakdown error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get fee statistics
 * @route   GET /api/stats/fees
 */
export const getFeeStats = async (req, res) => {
  try {
    const [totalDue, totalCollected, defaulters, termWise, classWise] = await Promise.all([
      // Total due amount
      prisma.feeDetails.aggregate({
        where: { student: { isActive: true } },
        _sum: { totalDue: true }
      }),
      
      // Total collected amount
      prisma.paymentHistory.aggregate({
        _sum: { totalAmount: true }
      }),
      
      // Defaulters count
      prisma.feeDetails.count({
        where: {
          student: { isActive: true },
          totalDue: { gt: 0 }
        }
      }),
      
      // Term-wise collection
      prisma.paymentHistory.groupBy({
        by: ['termNumber'],
        _sum: { totalAmount: true },
        where: { termNumber: { not: null } }
      }),
      
      // Class-wise fee status
      prisma.$queryRaw`
        SELECT 
          s.class,
          COUNT(DISTINCT s.id) as total_students,
          COUNT(DISTINCT CASE WHEN fd."totalDue" > 0 THEN s.id END) as defaulters,
          SUM(fd."totalDue") as total_due,
          SUM(fd."totalPaid") as total_paid
        FROM "Student" s
        LEFT JOIN "FeeDetails" fd ON s.id = fd."studentId"
        WHERE s."isActive" = true
        GROUP BY s.class
        ORDER BY s.class
      `
    ])

    const totalDueAmount = totalDue._sum?.totalDue || 0
    const totalCollectedAmount = totalCollected._sum?.totalAmount || 0

    const stats = {
      overview: {
        totalDue: formatValue(totalDueAmount, ' ₹'),
        totalCollected: formatValue(totalCollectedAmount, ' ₹'),
        defaulters: formatValue(defaulters),
        collectionEfficiency: calculatePercentage(totalCollectedAmount, totalDueAmount + totalCollectedAmount)
      },
      termWise: termWise.map(t => ({
        term: t.termNumber,
        collected: formatValue(t._sum.totalAmount, ' ₹')
      })),
      classWise: classWise.map(c => ({
        class: c.class,
        totalStudents: formatValue(c.total_students),
        defaulters: formatValue(c.defaulters || 0),
        totalDue: formatValue(c.total_due || 0, ' ₹'),
        totalPaid: formatValue(c.total_paid || 0, ' ₹'),
        defaulterPercentage: calculatePercentage(c.defaulters || 0, c.total_students)
      }))
    }

    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    console.error('Get fee stats error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get dashboard stats for StatsGrid component
 * @route   GET /api/stats/dashboard
 * @access  Public/Private
 */
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    
    // Run queries in parallel for efficiency
    const [
      totalStudents,
      totalStaff,
      monthlyIncome,
      monthlyExpenses,
      dailyAttendanceStats,
      totalActiveStudents
    ] = await Promise.all([
      // Total active students
      prisma.student.count({ where: { isActive: true } }),
      
      // Total active staff (all employees)
      prisma.employee.count({ where: { isActive: true } }),
      
      // Monthly income (INCOME type)
      prisma.cashFlow.aggregate({
        where: {
          type: 'INCOME',
          date: {
            gte: startOfMonth,
            lt: startOfNextMonth
          }
        },
        _sum: { amount: true }
      }),
      
      // Monthly expenses (EXPENSE type)
      prisma.cashFlow.aggregate({
        where: {
          type: 'EXPENSE',
          date: {
            gte: startOfMonth,
            lt: startOfNextMonth
          }
        },
        _sum: { amount: true }
      }),
      
      // Get all attendance records grouped by date
      prisma.attendance.groupBy({
        by: ['date'],
        where: {
          date: {
            // For current month (you can adjust this period as needed)
            gte: startOfMonth,
            lt: startOfNextMonth
          }
        },
        _count: {
          _all: true
        }
      }),
      
      // Total active students for reference
      prisma.student.count({ where: { isActive: true } })
    ])

    // Calculate monthly revenue (income - expenses)
    const incomeAmount = monthlyIncome._sum?.amount || 0
    const expenseAmount = monthlyExpenses._sum?.amount || 0
    const monthlyRevenueAmount = incomeAmount - expenseAmount

    // Format monthly revenue
    const formattedRevenue = monthlyRevenueAmount >= 100000 
      ? `₹${(monthlyRevenueAmount / 100000).toFixed(2)}L`
      : monthlyRevenueAmount >= 1000 
        ? `₹${(monthlyRevenueAmount / 1000).toFixed(1)}K`
        : `₹${monthlyRevenueAmount}`

    // Calculate average attendance percentage across all days
    let averageAttendance = 0
    let totalDaysWithAttendance = 0
    let totalAttendancePercentage = 0

    if (dailyAttendanceStats.length > 0) {
      // For each day, fetch the detailed attendance records to calculate daily percentage
      const attendancePromises = dailyAttendanceStats.map(async (day) => {
        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            date: day.date
          },
          select: {
            morning: true,
            afternoon: true
          }
        })

        let presentSessions = 0
        let totalMarkedSessions = 0

        attendanceRecords.forEach(record => {
          // Count morning session if marked
          if (record.morning !== null) {
            totalMarkedSessions++
            if (record.morning === true) presentSessions++
          }
          
          // Count afternoon session if marked
          if (record.afternoon !== null) {
            totalMarkedSessions++
            if (record.afternoon === true) presentSessions++
          }
        })

        // Calculate daily percentage
        const dailyPercentage = totalMarkedSessions > 0 
          ? (presentSessions / totalMarkedSessions) * 100 
          : 0

        return {
          date: day.date,
          percentage: dailyPercentage,
          presentSessions,
          totalMarkedSessions
        }
      })

      const dailyResults = await Promise.all(attendancePromises)
      
      // Sum up all daily percentages
      totalAttendancePercentage = dailyResults.reduce((sum, day) => sum + day.percentage, 0)
      totalDaysWithAttendance = dailyResults.length
      
      // Calculate average
      averageAttendance = totalDaysWithAttendance > 0 
        ? (totalAttendancePercentage / totalDaysWithAttendance).toFixed(1)
        : 0

      // Log for debugging (remove in production)
      console.log('Daily attendance breakdown:', dailyResults.map(d => ({
        date: d.date.toISOString().split('T')[0],
        percentage: d.percentage.toFixed(1) + '%',
        sessions: `${d.presentSessions}/${d.totalMarkedSessions}`
      })))
    }

    const dashboardStats = [
      {
        title: 'Total Students',
        value: totalStudents.toLocaleString(),
        icon: 'users',
        iconFamily: 'FontAwesome6',
        color: '#3b82f6',
        gradient: ['#3b82f6', '#1d4ed8'],
      },
      {
        title: 'Total Staff',
        value: totalStaff.toString(),
        icon: 'chalkboard-teacher',
        iconFamily: 'FontAwesome5',
        color: '#8b5cf6',
        gradient: ['#8b5cf6', '#7c3aed'],
      },
      {
        title: 'Monthly Revenue',
        value: formattedRevenue,
        subtitle: `Income: ₹${incomeAmount.toLocaleString()}`,
        subtitle2: `Expenses: ₹${expenseAmount.toLocaleString()}`,
        icon: 'attach-money',
        iconFamily: 'MaterialIcons',
        color: monthlyRevenueAmount >= 0 ? '#10b981' : '#ef4444',
        gradient: monthlyRevenueAmount >= 0 
          ? ['#10b981', '#059669']
          : ['#ef4444', '#dc2626'],
      },
      {
        title: 'Attendance',
        value: `${averageAttendance}%`,
        subtitle: totalDaysWithAttendance > 0
          ? `Average across ${totalDaysWithAttendance} days this month`
          : 'No attendance data this month',
        icon: 'clipboard-check',
        iconFamily: 'FontAwesome6',
        color: '#f97316',
        gradient: ['#f97316', '#ea580c'],
      },
    ]

    res.status(200).json({
      success: true,
      data: dashboardStats
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard statistics',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}