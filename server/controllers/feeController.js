const mongoose = require('mongoose')
const Student = require('../models/Student')

// Helper function to add display class to student
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

const addDisplayClassToStudent = (studentDoc) => {
  if (!studentDoc) return studentDoc
  const obj = studentDoc.toObject ? studentDoc.toObject() : studentDoc
  obj.displayClass = mapNumberToClassName(obj.class)
  return obj
}

exports.searchStudentsForFee = async (req, res) => {
  try {
    const { 
      search, 
      page = 1,
      limit = 20
    } = req.query

    const query = {}

    // Search filter - only by name
    if (search) {
      const searchRegex = new RegExp(search, 'i')
      
      // We'll use aggregation to prioritize results
      const aggregationPipeline = [
        {
          $match: {
            $or: [
              { firstName: searchRegex },
              { lastName: searchRegex },
              {
                $expr: {
                  $regexMatch: {
                    input: { $concat: ["$firstName", " ", "$lastName"] },
                    regex: search,
                    options: "i"
                  }
                }
              }
            ]
          }
        },
        {
          $addFields: {
            // Add a score for sorting priority
            searchScore: {
              $cond: [
                { $regexMatch: { input: "$firstName", regex: `^${search}`, options: "i" } },
                3, // Highest priority: firstName starts with search
                {
                  $cond: [
                    { $regexMatch: { input: "$lastName", regex: `^${search}`, options: "i" } },
                    2, // Second priority: lastName starts with search
                    1 // Lowest priority: contains anywhere
                  ]
                }
              ]
            }
          }
        },
        { $sort: { searchScore: -1, firstName: 1, lastName: 1 } }, // Sort by priority score first
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            admissionNo: 1,
            rollNo: 1,
            class: 1,
            section: 1,
            academicYear: 1,
            studentType: 1,
            village: 1,
            parentPhone: 1,
            feeDetails: 1
          }
        }
      ]

      // Get total count for pagination
      const totalQuery = {
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ["$firstName", " ", "$lastName"] },
                regex: search,
                options: "i"
              }
            }
          }
        ]
      }

      const [students, total] = await Promise.all([
        Student.aggregate(aggregationPipeline),
        Student.countDocuments(totalQuery)
      ])

      const pageNum = parseInt(page)
      const limitNum = parseInt(limit)

      // Process students to add fee summary
      const processedStudents = students.map(student => {
        const currentAcademicYear = student.academicYear
        const feeRecord = student.feeDetails?.find(fd => fd.academicYear === currentAcademicYear)
        
        return {
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNo,
          rollNo: student.rollNo,
          class: student.class,
          displayClass: mapNumberToClassName(student.class),
          section: student.section,
          academicYear: currentAcademicYear,
          studentType: student.studentType,
          village: student.village,
          parentPhone: student.parentPhone,
          feeSummary: feeRecord ? {
            totalFee: feeRecord.totalFee,
            totalPaid: feeRecord.totalPaid,
            totalDue: feeRecord.totalDue,
            paymentStatus: feeRecord.totalDue === 0 ? 'Paid' : 
                         feeRecord.totalDue === feeRecord.totalFee ? 'Unpaid' : 'Partial'
          } : {
            totalFee: 0,
            totalPaid: 0,
            totalDue: 0,
            paymentStatus: 'Not Set'
          }
        }
      })

      return res.status(200).json({
        success: true,
        count: processedStudents.length,
        total,
        pagination: {
          current: pageNum,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        },
        data: processedStudents
      })
    } else {
      // If no search term provided, return all students with normal sorting
      const pageNum = parseInt(page)
      const limitNum = parseInt(limit)
      const skip = (pageNum - 1) * limitNum

      const students = await Student.find({})
        .select('_id firstName lastName admissionNo rollNo class section academicYear studentType village parentPhone feeDetails')
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean()

      const total = await Student.countDocuments({})

      const processedStudents = students.map(student => {
        const currentAcademicYear = student.academicYear
        const feeRecord = student.feeDetails?.find(fd => fd.academicYear === currentAcademicYear)
        
        return {
          _id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNo,
          rollNo: student.rollNo,
          class: student.class,
          displayClass: mapNumberToClassName(student.class),
          section: student.section,
          academicYear: currentAcademicYear,
          studentType: student.studentType,
          village: student.village,
          parentPhone: student.parentPhone,
          feeSummary: feeRecord ? {
            totalFee: feeRecord.totalFee,
            totalPaid: feeRecord.totalPaid,
            totalDue: feeRecord.totalDue,
            paymentStatus: feeRecord.totalDue === 0 ? 'Paid' : 
                         feeRecord.totalDue === feeRecord.totalFee ? 'Unpaid' : 'Partial'
          } : {
            totalFee: 0,
            totalPaid: 0,
            totalDue: 0,
            paymentStatus: 'Not Set'
          }
        }
      })

      return res.status(200).json({
        success: true,
        count: processedStudents.length,
        total,
        pagination: {
          current: pageNum,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        },
        data: processedStudents
      })
    }

  } catch (error) {
    console.error('Search students for fee error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search students',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

exports.getStudentFeeDetails = async (req, res) => {
  try {
    const { id } = req.params
    const { academicYear: queryAcademicYear } = req.query

    const student = await Student.findById(id)
      .select('-__v -createdAt -updatedAt -attendance -marks -profilePic')
      .lean()

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Determine which academic year to show
    const academicYear = queryAcademicYear || student.academicYear
    
    // Find fee details for the requested academic year
    const feeRecord = student.feeDetails?.find(fd => fd.academicYear === academicYear)
    
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: `Fee details not found for academic year ${academicYear}`
      })
    }

    // Get payment history for the academic year
    const paymentHistory = student.paymentHistory?.filter(
      payment => payment.academicYear === academicYear
    ) || []

    // Calculate payment statistics
    const paymentStats = {
      totalPayments: paymentHistory.length,
      totalAmountPaid: paymentHistory.reduce((sum, payment) => sum + payment.totalAmount, 0),
      firstPaymentDate: paymentHistory.length > 0 ? 
        new Date(Math.min(...paymentHistory.map(p => new Date(p.date)))) : null,
      lastPaymentDate: paymentHistory.length > 0 ? 
        new Date(Math.max(...paymentHistory.map(p => new Date(p.date)))) : null,
      paymentMethods: paymentHistory.reduce((acc, payment) => {
        acc[payment.paymentMode] = (acc[payment.paymentMode] || 0) + 1
        return acc
      }, {})
    }

    // Prepare detailed fee breakdown WITH TERMS
    const feeBreakdown = {
      academicYear,
      terms: feeRecord.terms || 3, 
      components: {
        schoolFee: {
          total: feeRecord.schoolFee,
          paid: feeRecord.schoolFeePaid,
          due: Math.max(0, feeRecord.schoolFee - feeRecord.schoolFeePaid),
          discount: feeRecord.schoolFeeDiscountApplied,
          percentagePaid: feeRecord.schoolFee > 0 ? 
            (feeRecord.schoolFeePaid / feeRecord.schoolFee * 100).toFixed(2) : 100,
          termAmount: feeRecord.schoolFee > 0 && feeRecord.terms > 0 ? 
            Math.round(feeRecord.schoolFee / feeRecord.terms) : 0 // Add term amount calculation
        },
        transportFee: {
          total: feeRecord.transportFee,
          paid: feeRecord.transportFeePaid,
          due: Math.max(0, feeRecord.transportFee - feeRecord.transportFeePaid),
          discount: feeRecord.transportFeeDiscountApplied,
          percentagePaid: feeRecord.transportFee > 0 ? 
            (feeRecord.transportFeePaid / feeRecord.transportFee * 100).toFixed(2) : 100,
          termAmount: feeRecord.transportFee > 0 && feeRecord.terms > 0 ? 
            Math.round(feeRecord.transportFee / feeRecord.terms) : 0 // Add term amount calculation
        },
        hostelFee: {
          total: feeRecord.hostelFee,
          paid: feeRecord.hostelFeePaid,
          due: Math.max(0, feeRecord.hostelFee - feeRecord.hostelFeePaid),
          discount: feeRecord.hostelFeeDiscountApplied,
          percentagePaid: feeRecord.hostelFee > 0 ? 
            (feeRecord.hostelFeePaid / feeRecord.hostelFee * 100).toFixed(2) : 100,
          termAmount: feeRecord.hostelFee > 0 && feeRecord.terms > 0 ? 
            Math.round(feeRecord.hostelFee / feeRecord.terms) : 0 // Add term amount calculation
        }
      },
      summary: {
        totalFee: feeRecord.totalFee,
        totalPaid: feeRecord.totalPaid,
        totalDue: feeRecord.totalDue,
        overallPercentagePaid: feeRecord.totalFee > 0 ? 
          (feeRecord.totalPaid / feeRecord.totalFee * 100).toFixed(2) : 100,
        paymentStatus: feeRecord.totalDue === 0 ? 'Paid' : 
                      feeRecord.totalDue === feeRecord.totalFee ? 'Unpaid' : 'Partial',
        totalTermAmount: feeRecord.totalFee > 0 && feeRecord.terms > 0 ? 
          Math.round(feeRecord.totalFee / feeRecord.terms) : 0 // Add total term amount
      }
    }

    // Format payment history for response
    const formattedPaymentHistory = paymentHistory.map(payment => ({
      paymentId: payment.paymentId,
      date: payment.date,
      receiptNo: payment.receiptNo,
      paymentMode: payment.paymentMode,
      breakdown: {
        schoolFeePaid: payment.schoolFeePaid,
        transportFeePaid: payment.transportFeePaid,
        hostelFeePaid: payment.hostelFeePaid
      },
      totalAmount: payment.totalAmount,
      description: payment.description,
      receivedBy: payment.receivedBy,
      status: payment.status,
      chequeNo: payment.chequeNo,
      bankName: payment.bankName,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt
    })).sort((a, b) => new Date(b.date) - new Date(a.date))

    // Get all academic years with fee details
    const allAcademicYears = student.feeDetails?.map(fd => fd.academicYear) || []

    // Calculate installment due dates based on terms
    const installmentDueDates = []
    if (feeRecord.terms > 0 && feeRecord.createdAt) {
      const startDate = new Date(feeRecord.createdAt)
      for (let i = 1; i <= feeRecord.terms; i++) {
        const dueDate = new Date(startDate)
        dueDate.setMonth(startDate.getMonth() + i)
        installmentDueDates.push({
          term: i,
          dueDate: dueDate.toISOString().split('T')[0],
          amount: Math.round(feeRecord.totalFee / feeRecord.terms)
        })
      }
    }

    // Get next due date (if any due exists)
    let nextDueDate = null
    let nextTermNumber = null
    if (feeRecord.totalDue > 0) {
      const today = new Date()
      // Find the next installment due date
      for (const installment of installmentDueDates) {
        const dueDate = new Date(installment.dueDate)
        if (dueDate > today) {
          nextDueDate = dueDate
          nextTermNumber = installment.term
          break
        }
      }
      
      // If no future installment found, use end of current month
      if (!nextDueDate) {
        nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      }
    }

    const response = {
      success: true,
      data: {
        studentInfo: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNo,
          rollNo: student.rollNo,
          class: student.class,
          displayClass: mapNumberToClassName(student.class),
          section: student.section,
          studentType: student.studentType,
          usesTransport: student.isUsingSchoolTransport,
          village: student.village,
          parentName: student.parentName,
          parentPhone: student.parentPhone
        },
        feeBreakdown,
        installmentDueDates, // Add installment due dates
        nextTermNumber, // Add next term number
        paymentStats,
        paymentHistory: formattedPaymentHistory,
        discounts: {
          schoolFee: student.schoolFeeDiscount,
          transportFee: student.transportFeeDiscount,
          hostelFee: student.hostelFeeDiscount
        },
        academicYears: allAcademicYears,
        currentAcademicYear: academicYear,
        nextDueDate,
        feeRecordCreatedAt: feeRecord.createdAt,
        feeRecordUpdatedAt: feeRecord.updatedAt,
        feeTerms: { // Add detailed fee terms section
          totalTerms: feeRecord.terms || 3,
          termDetails: Array.from({ length: feeRecord.terms || 3 }, (_, i) => {
            const termNumber = i + 1
            const termDueAmount = Math.round(feeRecord.totalFee / (feeRecord.terms || 3))
            const termPaidAmount = paymentHistory
              .filter(p => p.description && p.description.includes(`Term ${termNumber}`))
              .reduce((sum, p) => sum + p.totalAmount, 0)
            
            return {
              term: termNumber,
              dueAmount: termDueAmount,
              paidAmount: termPaidAmount,
              remainingAmount: Math.max(0, termDueAmount - termPaidAmount),
              status: termPaidAmount >= termDueAmount ? 'Paid' : 
                     termPaidAmount > 0 ? 'Partial' : 'Unpaid'
            }
          })
        }
      }
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('Get student fee details error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      })
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get student fee details',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// ==================== GET TOTAL STUDENT FEE STATISTICS ====================
exports.getTotalFeeStatistics = async (req, res) => {
  try {
    const { 
      academicYear,
      class: classFilter,
      section,
      startDate,
      endDate,
      groupBy = 'overall' // overall, class, section, month
    } = req.query

    const matchStage = {}
    
    // Academic year filter
    if (academicYear) {
      matchStage.academicYear = academicYear
    }

    // Class filter
    if (classFilter) {
      matchStage.class = parseInt(classFilter)
    }

    // Section filter
    if (section) {
      matchStage.section = section.toUpperCase()
    }

    // Date filter for payment history
    let dateFilter = {}
    if (startDate || endDate) {
      dateFilter.date = {}
      if (startDate) dateFilter.date.$gte = new Date(startDate)
      if (endDate) dateFilter.date.$lte = new Date(endDate)
    }

    // Main aggregation pipeline
    let pipeline = []

    // Stage 1: Match students based on filters
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage })
    }

    // Stage 2: Unwind fee details to work with them
    pipeline.push({ $unwind: '$feeDetails' })

    // Stage 3: Match fee details by academic year if specified
    if (academicYear) {
      pipeline.push({ 
        $match: { 
          'feeDetails.academicYear': academicYear 
        } 
      })
    }

    // Stage 4: Group based on requested grouping
    let groupStage = {}

    switch (groupBy) {
      case 'class':
        groupStage = {
          _id: {
            class: '$class',
            academicYear: '$feeDetails.academicYear'
          },
          className: { $first: '$class' },
          academicYear: { $first: '$feeDetails.academicYear' },
          totalStudents: { $sum: 1 },
          totalSchoolFee: { $sum: '$feeDetails.schoolFee' },
          totalTransportFee: { $sum: '$feeDetails.transportFee' },
          totalHostelFee: { $sum: '$feeDetails.hostelFee' },
          totalFee: { $sum: '$feeDetails.totalFee' },
          totalPaid: { $sum: '$feeDetails.totalPaid' },
          totalDue: { $sum: '$feeDetails.totalDue' }
        }
        break

      case 'section':
        groupStage = {
          _id: {
            class: '$class',
            section: '$section',
            academicYear: '$feeDetails.academicYear'
          },
          className: { $first: '$class' },
          section: { $first: '$section' },
          academicYear: { $first: '$feeDetails.academicYear' },
          totalStudents: { $sum: 1 },
          totalSchoolFee: { $sum: '$feeDetails.schoolFee' },
          totalTransportFee: { $sum: '$feeDetails.transportFee' },
          totalHostelFee: { $sum: '$feeDetails.hostelFee' },
          totalFee: { $sum: '$feeDetails.totalFee' },
          totalPaid: { $sum: '$feeDetails.totalPaid' },
          totalDue: { $sum: '$feeDetails.totalDue' }
        }
        break

      case 'month':
        // For monthly statistics, we need to look at payment history
        pipeline = []
        if (Object.keys(matchStage).length > 0) {
          pipeline.push({ $match: matchStage })
        }
        pipeline.push({ $unwind: '$paymentHistory' })
        
        if (academicYear) {
          pipeline.push({ 
            $match: { 
              'paymentHistory.academicYear': academicYear 
            } 
          })
        }
        
        if (Object.keys(dateFilter).length > 0) {
          pipeline.push({ $match: { 'paymentHistory': dateFilter } })
        }
        
        groupStage = {
          _id: {
            year: { $year: '$paymentHistory.date' },
            month: { $month: '$paymentHistory.date' }
          },
          year: { $first: { $year: '$paymentHistory.date' } },
          month: { $first: { $month: '$paymentHistory.date' } },
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$paymentHistory.totalAmount' },
          totalSchoolFeePaid: { $sum: '$paymentHistory.schoolFeePaid' },
          totalTransportFeePaid: { $sum: '$paymentHistory.transportFeePaid' },
          totalHostelFeePaid: { $sum: '$paymentHistory.hostelFeePaid' }
        }
        break

      default: // overall
        groupStage = {
          _id: null,
          totalStudents: { $sum: 1 },
          totalSchoolFee: { $sum: '$feeDetails.schoolFee' },
          totalTransportFee: { $sum: '$feeDetails.transportFee' },
          totalHostelFee: { $sum: '$feeDetails.hostelFee' },
          totalFee: { $sum: '$feeDetails.totalFee' },
          totalPaid: { $sum: '$feeDetails.totalPaid' },
          totalDue: { $sum: '$feeDetails.totalDue' }
        }
    }

    pipeline.push({ $group: groupStage })

    // Stage 5: Sort
    if (groupBy === 'class') {
      pipeline.push({ $sort: { '_id.class': 1, '_id.academicYear': 1 } })
    } else if (groupBy === 'section') {
      pipeline.push({ $sort: { '_id.class': 1, '_id.section': 1, '_id.academicYear': 1 } })
    } else if (groupBy === 'month') {
      pipeline.push({ $sort: { '_id.year': 1, '_id.month': 1 } })
    }

    // Stage 6: Project final results
    const projectStage = {}
    if (groupBy === 'class') {
      projectStage.$project = {
        _id: 0,
        class: '$_id.class',
        displayClass: { $function: { body: mapNumberToClassName.toString(), args: ['$_id.class'], lang: 'js' } },
        academicYear: '$_id.academicYear',
        totalStudents: 1,
        totalSchoolFee: 1,
        totalTransportFee: 1,
        totalHostelFee: 1,
        totalFee: 1,
        totalPaid: 1,
        totalDue: 1,
        collectionRate: {
          $cond: [
            { $eq: ['$totalFee', 0] },
            100,
            { $multiply: [{ $divide: ['$totalPaid', '$totalFee'] }, 100] }
          ]
        }
      }
    } else if (groupBy === 'section') {
      projectStage.$project = {
        _id: 0,
        class: '$_id.class',
        displayClass: { $function: { body: mapNumberToClassName.toString(), args: ['$_id.class'], lang: 'js' } },
        section: '$_id.section',
        academicYear: '$_id.academicYear',
        totalStudents: 1,
        totalSchoolFee: 1,
        totalTransportFee: 1,
        totalHostelFee: 1,
        totalFee: 1,
        totalPaid: 1,
        totalDue: 1,
        collectionRate: {
          $cond: [
            { $eq: ['$totalFee', 0] },
            100,
            { $multiply: [{ $divide: ['$totalPaid', '$totalFee'] }, 100] }
          ]
        }
      }
    } else if (groupBy === 'month') {
      projectStage.$project = {
        _id: 0,
        year: 1,
        month: 1,
        monthName: {
          $switch: {
            branches: [
              { case: { $eq: ['$month', 1] }, then: 'January' },
              { case: { $eq: ['$month', 2] }, then: 'February' },
              { case: { $eq: ['$month', 3] }, then: 'March' },
              { case: { $eq: ['$month', 4] }, then: 'April' },
              { case: { $eq: ['$month', 5] }, then: 'May' },
              { case: { $eq: ['$month', 6] }, then: 'June' },
              { case: { $eq: ['$month', 7] }, then: 'July' },
              { case: { $eq: ['$month', 8] }, then: 'August' },
              { case: { $eq: ['$month', 9] }, then: 'September' },
              { case: { $eq: ['$month', 10] }, then: 'October' },
              { case: { $eq: ['$month', 11] }, then: 'November' },
              { case: { $eq: ['$month', 12] }, then: 'December' }
            ],
            default: 'Unknown'
          }
        },
        totalPayments: 1,
        totalAmount: 1,
        totalSchoolFeePaid: 1,
        totalTransportFeePaid: 1,
        totalHostelFeePaid: 1,
        averagePayment: { $divide: ['$totalAmount', '$totalPayments'] }
      }
    } else {
      projectStage.$project = {
        _id: 0,
        totalStudents: 1,
        totalSchoolFee: 1,
        totalTransportFee: 1,
        totalHostelFee: 1,
        totalFee: 1,
        totalPaid: 1,
        totalDue: 1,
        collectionRate: {
          $cond: [
            { $eq: ['$totalFee', 0] },
            100,
            { $multiply: [{ $divide: ['$totalPaid', '$totalFee'] }, 100] }
          ]
        },
        averageFeePerStudent: { $divide: ['$totalFee', '$totalStudents'] },
        averagePaidPerStudent: { $divide: ['$totalPaid', '$totalStudents'] }
      }
    }

    pipeline.push(projectStage)

    // Execute aggregation
    const statistics = await Student.aggregate(pipeline)

    // For overall statistics, get additional details
    let additionalStats = {}
    if (groupBy === 'overall') {
      // Get payment method distribution
      const paymentMethodStats = await Student.aggregate([
        { $unwind: '$paymentHistory' },
        academicYear ? { $match: { 'paymentHistory.academicYear': academicYear } } : { $match: {} },
        { $group: {
          _id: '$paymentHistory.paymentMode',
          count: { $sum: 1 },
          totalAmount: { $sum: '$paymentHistory.totalAmount' }
        }},
        { $sort: { totalAmount: -1 } }
      ])

      // Get top paying students
      const topPayingStudents = await Student.aggregate([
        { $unwind: '$feeDetails' },
        academicYear ? { $match: { 'feeDetails.academicYear': academicYear } } : { $match: {} },
        { $project: {
          name: { $concat: ['$firstName', ' ', '$lastName'] },
          admissionNo: 1,
          class: 1,
          section: 1,
          totalPaid: '$feeDetails.totalPaid',
          totalFee: '$feeDetails.totalFee'
        }},
        { $sort: { totalPaid: -1 } },
        { $limit: 10 }
      ])

      // Get defaulters (high due)
      const defaulters = await Student.aggregate([
        { $unwind: '$feeDetails' },
        academicYear ? { $match: { 'feeDetails.academicYear': academicYear } } : { $match: {} },
        { $match: { 'feeDetails.totalDue': { $gt: 0 } } },
        { $project: {
          name: { $concat: ['$firstName', ' ', '$lastName'] },
          admissionNo: 1,
          class: 1,
          section: 1,
          totalDue: '$feeDetails.totalDue',
          totalFee: '$feeDetails.totalFee'
        }},
        { $sort: { totalDue: -1 } },
        { $limit: 10 }
      ])

      additionalStats = {
        paymentMethodDistribution: paymentMethodStats,
        topPayingStudents: topPayingStudents.map(s => ({
          ...s,
          displayClass: mapNumberToClassName(s.class)
        })),
        topDefaulters: defaulters.map(s => ({
          ...s,
          displayClass: mapNumberToClassName(s.class)
        }))
      }
    }

    res.status(200).json({
      success: true,
      data: {
        statistics: statistics[0] || {},
        ...additionalStats,
        filters: {
          academicYear,
          class: classFilter,
          section,
          groupBy,
          dateRange: startDate || endDate ? { startDate, endDate } : null
        }
      }
    })

  } catch (error) {
    console.error('Get total fee statistics error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get fee statistics',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// ==================== GET CLASS-WISE FEE PAYMENTS (TERM-WISE) ====================
exports.getClassWiseFeePayments = async (req, res) => {
  try {
    const { 
      academicYear,
      class: classFilter,
      term,
      month,
      startDate,
      endDate
    } = req.query

    // Base match stage
    const matchStage = {}

    if (academicYear) {
      matchStage.academicYear = academicYear
    }

    if (classFilter) {
      matchStage.class = parseInt(classFilter)
    }

    // For term-wise filtering
    let termFilter = {}
    if (term) {
      // Assuming terms: term1 (Apr-Jun), term2 (Jul-Sep), term3 (Oct-Dec), term4 (Jan-Mar)
      const currentYear = new Date().getFullYear()
      switch (term.toLowerCase()) {
        case 'term1':
          termFilter.date = {
            $gte: new Date(`${currentYear}-04-01`),
            $lte: new Date(`${currentYear}-06-30`)
          }
          break
        case 'term2':
          termFilter.date = {
            $gte: new Date(`${currentYear}-07-01`),
            $lte: new Date(`${currentYear}-09-30`)
          }
          break
        case 'term3':
          termFilter.date = {
            $gte: new Date(`${currentYear}-10-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
          break
        case 'term4':
          termFilter.date = {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-03-31`)
          }
          break
      }
    }

    // For month-wise filtering
    if (month) {
      const currentYear = new Date().getFullYear()
      const monthNum = parseInt(month)
      if (monthNum >= 1 && monthNum <= 12) {
        const start = new Date(currentYear, monthNum - 1, 1)
        const end = new Date(currentYear, monthNum, 0)
        termFilter.date = { $gte: start, $lte: end }
      }
    }

    // Custom date range
    if (startDate || endDate) {
      termFilter.date = {}
      if (startDate) termFilter.date.$gte = new Date(startDate)
      if (endDate) termFilter.date.$lte = new Date(endDate)
    }

    // Aggregation pipeline
    const pipeline = []

    // Match students
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage })
    }

    // Unwind payment history
    pipeline.push({ $unwind: '$paymentHistory' })

    // Apply payment filters
    const paymentMatch = { 'paymentHistory.status': 'Completed' }
    if (academicYear) {
      paymentMatch['paymentHistory.academicYear'] = academicYear
    }
    if (Object.keys(termFilter).length > 0) {
      if (termFilter.date) {
        paymentMatch['paymentHistory.date'] = termFilter.date
      }
    }
    pipeline.push({ $match: paymentMatch })

    // Group by class and section
    pipeline.push({
      $group: {
        _id: {
          class: '$class',
          section: '$section',
          academicYear: '$paymentHistory.academicYear'
        },
        className: { $first: '$class' },
        section: { $first: '$section' },
        academicYear: { $first: '$paymentHistory.academicYear' },
        totalStudents: { $addToSet: '$_id' },
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$paymentHistory.totalAmount' },
        totalSchoolFeePaid: { $sum: '$paymentHistory.schoolFeePaid' },
        totalTransportFeePaid: { $sum: '$paymentHistory.transportFeePaid' },
        totalHostelFeePaid: { $sum: '$paymentHistory.hostelFeePaid' },
        paymentMethods: {
          $push: {
            mode: '$paymentHistory.paymentMode',
            amount: '$paymentHistory.totalAmount'
          }
        }
      }
    })

    // Project final results
    pipeline.push({
      $project: {
        _id: 0,
        class: '$_id.class',
        displayClass: { $function: { body: mapNumberToClassName.toString(), args: ['$_id.class'], lang: 'js' } },
        section: '$_id.section',
        academicYear: '$_id.academicYear',
        totalStudents: { $size: '$totalStudents' },
        totalPayments: 1,
        totalAmount: 1,
        breakdown: {
          schoolFee: '$totalSchoolFeePaid',
          transportFee: '$totalTransportFeePaid',
          hostelFee: '$totalHostelFeePaid'
        },
        averagePaymentPerStudent: {
          $cond: [
            { $eq: [{ $size: '$totalStudents' }, 0] },
            0,
            { $divide: ['$totalAmount', { $size: '$totalStudents' }] }
          ]
        },
        paymentMethodSummary: {
          $reduce: {
            input: '$paymentMethods',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $let: {
                    vars: { method: '$$this.mode' },
                    in: {
                      $cond: [
                        { $eq: [{ $type: '$$value.$$method' }, 'missing'] },
                        { $arrayToObject: [[['$$method', { count: 1, amount: '$$this.amount' }]]] },
                        {
                          $arrayToObject: [[[
                            '$$method',
                            {
                              count: { $add: ['$$value.$$method.count', 1] },
                              amount: { $add: ['$$value.$$method.amount', '$$this.amount'] }
                            }
                          ]]]
                        }
                      ]
                    }
                  }
                }
              ]
            }
          }
        }
      }
    })

    // Sort results
    pipeline.push({ $sort: { class: 1, section: 1 } })

    // Execute aggregation
    const classWisePayments = await Student.aggregate(pipeline)

    // Calculate overall totals
    const overallTotals = {
      totalStudents: classWisePayments.reduce((sum, item) => sum + item.totalStudents, 0),
      totalPayments: classWisePayments.reduce((sum, item) => sum + item.totalPayments, 0),
      totalAmount: classWisePayments.reduce((sum, item) => sum + item.totalAmount, 0),
      totalSchoolFee: classWisePayments.reduce((sum, item) => sum + item.breakdown.schoolFee, 0),
      totalTransportFee: classWisePayments.reduce((sum, item) => sum + item.breakdown.transportFee, 0),
      totalHostelFee: classWisePayments.reduce((sum, item) => sum + item.breakdown.hostelFee, 0)
    }

    res.status(200).json({
      success: true,
      data: {
        classWisePayments,
        overallTotals,
        filters: {
          academicYear,
          class: classFilter,
          term,
          month,
          dateRange: startDate || endDate ? { startDate, endDate } : null
        },
        summary: {
          totalClasses: [...new Set(classWisePayments.map(item => item.class))].length,
          totalSections: [...new Set(classWisePayments.map(item => `${item.class}-${item.section}`))].length,
          averageCollectionPerClass: classWisePayments.length > 0 ? 
            overallTotals.totalAmount / classWisePayments.length : 0
        }
      }
    })

  } catch (error) {
    console.error('Get class-wise fee payments error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get class-wise fee payments',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// ==================== GET STUDENT PAYMENT DETAILED HISTORY ====================
exports.getStudentPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params
    const { 
      academicYear,
      startDate,
      endDate,
      paymentMode,
      status = 'Completed'
    } = req.query

    const student = await Student.findById(id)
      .select('_id firstName lastName admissionNo rollNo class section paymentHistory')
      .lean()

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Filter payment history
    let payments = student.paymentHistory || []

    if (academicYear) {
      payments = payments.filter(p => p.academicYear === academicYear)
    }

    if (paymentMode) {
      payments = payments.filter(p => p.paymentMode === paymentMode)
    }

    if (status) {
      payments = payments.filter(p => p.status === status)
    }

    if (startDate) {
      const start = new Date(startDate)
      payments = payments.filter(p => new Date(p.date) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      payments = payments.filter(p => new Date(p.date) <= end)
    }

    // Sort by date (newest first)
    payments.sort((a, b) => new Date(b.date) - new Date(a.date))

    // Calculate statistics
    const stats = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.totalAmount, 0),
      totalSchoolFeePaid: payments.reduce((sum, p) => sum + p.schoolFeePaid, 0),
      totalTransportFeePaid: payments.reduce((sum, p) => sum + p.transportFeePaid, 0),
      totalHostelFeePaid: payments.reduce((sum, p) => sum + p.hostelFeePaid, 0),
      byPaymentMode: payments.reduce((acc, p) => {
        acc[p.paymentMode] = (acc[p.paymentMode] || 0) + p.totalAmount
        return acc
      }, {}),
      byAcademicYear: payments.reduce((acc, p) => {
        if (!acc[p.academicYear]) {
          acc[p.academicYear] = { count: 0, amount: 0 }
        }
        acc[p.academicYear].count++
        acc[p.academicYear].amount += p.totalAmount
        return acc
      }, {})
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNo,
          rollNo: student.rollNo,
          class: student.class,
          displayClass: mapNumberToClassName(student.class),
          section: student.section
        },
        payments: payments.map(p => ({
          ...p,
          yearMonth: `${new Date(p.date).getFullYear()}-${String(new Date(p.date).getMonth() + 1).padStart(2, '0')}`
        })),
        statistics: stats,
        filters: {
          academicYear,
          paymentMode,
          status,
          dateRange: startDate || endDate ? { startDate, endDate } : null
        }
      }
    })

  } catch (error) {
    console.error('Get student payment history error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      })
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment history',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// ==================== GET FEE COLLECTION REPORT ====================
exports.getFeeCollectionReport = async (req, res) => {
  try {
    const {
      reportType = 'daily', // daily, weekly, monthly, yearly
      academicYear,
      class: classFilter,
      startDate,
      endDate
    } = req.query

    // Set default date range if not provided
    const now = new Date()
    let defaultStartDate, defaultEndDate

    switch (reportType) {
      case 'daily':
        defaultStartDate = new Date(now.setHours(0, 0, 0, 0))
        defaultEndDate = new Date(now.setHours(23, 59, 59, 999))
        break
      case 'weekly':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)
        defaultStartDate = weekStart
        defaultEndDate = new Date(now.setHours(23, 59, 59, 999))
        break
      case 'monthly':
        defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
        defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'yearly':
        defaultStartDate = new Date(now.getFullYear(), 0, 1)
        defaultEndDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        break
    }

    const start = startDate ? new Date(startDate) : defaultStartDate
    const end = endDate ? new Date(endDate) : defaultEndDate

    // Build aggregation pipeline
    const pipeline = []

    // Match payments within date range
    pipeline.push({ $unwind: '$paymentHistory' })
    pipeline.push({
      $match: {
        'paymentHistory.date': { $gte: start, $lte: end },
        'paymentHistory.status': 'Completed'
      }
    })

    if (academicYear) {
      pipeline.push({ $match: { 'paymentHistory.academicYear': academicYear } })
    }

    if (classFilter) {
      pipeline.push({ $match: { class: parseInt(classFilter) } })
    }

    // Group based on report type
    let groupStage = {}
    let projectStage = {}

    switch (reportType) {
      case 'daily':
        groupStage = {
          _id: {
            year: { $year: '$paymentHistory.date' },
            month: { $month: '$paymentHistory.date' },
            day: { $dayOfMonth: '$paymentHistory.date' }
          },
          date: { $first: '$paymentHistory.date' },
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$paymentHistory.totalAmount' },
          totalStudents: { $addToSet: '$_id' },
          paymentMethods: {
            $push: {
              mode: '$paymentHistory.paymentMode',
              amount: '$paymentHistory.totalAmount'
            }
          }
        }
        break

      case 'weekly':
        groupStage = {
          _id: {
            year: { $year: '$paymentHistory.date' },
            week: { $week: '$paymentHistory.date' }
          },
          year: { $first: { $year: '$paymentHistory.date' } },
          week: { $first: { $week: '$paymentHistory.date' } },
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$paymentHistory.totalAmount' },
          totalStudents: { $addToSet: '$_id' }
        }
        break

      case 'monthly':
        groupStage = {
          _id: {
            year: { $year: '$paymentHistory.date' },
            month: { $month: '$paymentHistory.date' }
          },
          year: { $first: { $year: '$paymentHistory.date' } },
          month: { $first: { $month: '$paymentHistory.date' } },
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$paymentHistory.totalAmount' },
          totalStudents: { $addToSet: '$_id' }
        }
        break

      case 'yearly':
        groupStage = {
          _id: { year: { $year: '$paymentHistory.date' } },
          year: { $first: { $year: '$paymentHistory.date' } },
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$paymentHistory.totalAmount' },
          totalStudents: { $addToSet: '$_id' }
        }
        break
    }

    pipeline.push({ $group: groupStage })

    // Add class-wise breakdown if requested
    if (classFilter) {
      pipeline.push({
        $lookup: {
          from: 'students',
          localField: 'totalStudents',
          foreignField: '_id',
          as: 'studentDetails'
        }
      })
      pipeline.push({
        $project: {
          _id: 0,
          period: '$_id',
          date: 1,
          totalPayments: 1,
          totalAmount: 1,
          totalStudents: { $size: '$totalStudents' },
          paymentMethods: 1,
          classBreakdown: {
            $reduce: {
              input: '$studentDetails',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $let: {
                      vars: { class: '$$this.class' },
                      in: {
                        $cond: [
                          { $eq: [{ $type: '$$value.$$class' }, 'missing'] },
                          { $arrayToObject: [[['$$class', { count: 1, amount: 0 }]]] },
                          {
                            $arrayToObject: [[[
                              '$$class',
                              {
                                count: { $add: ['$$value.$$class.count', 1] },
                                amount: '$$value.$$class.amount'
                              }
                            ]]]
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      })
    } else {
      projectStage.$project = {
        _id: 0,
        period: '$_id',
        date: 1,
        totalPayments: 1,
        totalAmount: 1,
        totalStudents: { $size: '$totalStudents' },
        averagePayment: { $divide: ['$totalAmount', '$totalPayments'] },
        paymentMethods: {
          $reduce: {
            input: '$paymentMethods',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $let: {
                    vars: { method: '$$this.mode' },
                    in: {
                      $cond: [
                        { $eq: [{ $type: '$$value.$$method' }, 'missing'] },
                        { $arrayToObject: [[['$$method', { count: 1, amount: '$$this.amount' }]]] },
                        {
                          $arrayToObject: [[[
                            '$$method',
                            {
                              count: { $add: ['$$value.$$method.count', 1] },
                              amount: { $add: ['$$value.$$method.amount', '$$this.amount'] }
                            }
                          ]]]
                        }
                      ]
                    }
                  }
                }
              ]
            }
          }
        }
      }
      pipeline.push(projectStage)
    }

    // Sort by period
    switch (reportType) {
      case 'daily':
        pipeline.push({ $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } })
        break
      case 'weekly':
        pipeline.push({ $sort: { '_id.year': -1, '_id.week': -1 } })
        break
      case 'monthly':
        pipeline.push({ $sort: { '_id.year': -1, '_id.month': -1 } })
        break
      case 'yearly':
        pipeline.push({ $sort: { '_id.year': -1 } })
        break
    }

    const reportData = await Student.aggregate(pipeline)

    // Calculate summary statistics
    const summary = {
      totalCollections: reportData.reduce((sum, item) => sum + item.totalAmount, 0),
      totalTransactions: reportData.reduce((sum, item) => sum + item.totalPayments, 0),
      averageTransactionValue: reportData.reduce((sum, item) => sum + item.totalAmount, 0) / 
                               reportData.reduce((sum, item) => sum + item.totalPayments, 1),
      periodCount: reportData.length
    }

    res.status(200).json({
      success: true,
      data: {
        reportType,
        dateRange: { start, end },
        reportData,
        summary,
        filters: {
          academicYear,
          class: classFilter
        }
      }
    })

  } catch (error) {
    console.error('Get fee collection report error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate fee collection report',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// ==================== GET FEE DEFAULTERS LIST ====================
exports.getFeeDefaulters = async (req, res) => {
  try {
    const {
      academicYear,
      class: classFilter,
      section,
      minDueAmount = 0,
      page = 1,
      limit = 50
    } = req.query

    const matchStage = {}

    if (academicYear) {
      matchStage.academicYear = academicYear
    }

    if (classFilter) {
      matchStage.class = parseInt(classFilter)
    }

    if (section) {
      matchStage.section = section.toUpperCase()
    }

    // Find students with due amount
    const query = {
      ...matchStage,
      'feeDetails': {
        $elemMatch: {
          academicYear: academicYear || { $exists: true },
          totalDue: { $gt: parseFloat(minDueAmount) }
        }
      }
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const students = await Student.find(query)
      .select('_id firstName lastName admissionNo rollNo class section academicYear studentType village parentPhone feeDetails')
      .sort({ 'feeDetails.totalDue': -1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    // Process defaulters with due details
    const defaulters = students.map(student => {
      const feeRecord = student.feeDetails.find(fd => 
        academicYear ? fd.academicYear === academicYear : true
      )
      
      return {
        _id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        class: student.class,
        displayClass: mapNumberToClassName(student.class),
        section: student.section,
        academicYear: feeRecord?.academicYear,
        studentType: student.studentType,
        village: student.village,
        parentPhone: student.parentPhone,
        dueDetails: feeRecord ? {
          totalFee: feeRecord.totalFee,
          totalPaid: feeRecord.totalPaid,
          totalDue: feeRecord.totalDue,
          schoolFeeDue: Math.max(0, feeRecord.schoolFee - feeRecord.schoolFeePaid),
          transportFeeDue: Math.max(0, feeRecord.transportFee - feeRecord.transportFeePaid),
          hostelFeeDue: Math.max(0, feeRecord.hostelFee - feeRecord.hostelFeePaid),
          percentagePaid: feeRecord.totalFee > 0 ? 
            (feeRecord.totalPaid / feeRecord.totalFee * 100).toFixed(2) : 0,
          lastPaymentDate: null // Could be enhanced to get from payment history
        } : null
      }
    }).filter(defaulter => defaulter.dueDetails) // Remove any without due details

    const total = await Student.countDocuments(query)

    // Calculate summary statistics
    const summary = {
      totalDefaulters: total,
      totalDueAmount: defaulters.reduce((sum, defaulter) => sum + defaulter.dueDetails.totalDue, 0),
      averageDueAmount: defaulters.length > 0 ? 
        defaulters.reduce((sum, defaulter) => sum + defaulter.dueDetails.totalDue, 0) / defaulters.length : 0,
      byClass: defaulters.reduce((acc, defaulter) => {
        const className = defaulter.displayClass
        if (!acc[className]) {
          acc[className] = { count: 0, totalDue: 0 }
        }
        acc[className].count++
        acc[className].totalDue += defaulter.dueDetails.totalDue
        return acc
      }, {}),
      byStudentType: defaulters.reduce((acc, defaulter) => {
        const type = defaulter.studentType
        if (!acc[type]) {
          acc[type] = { count: 0, totalDue: 0 }
        }
        acc[type].count++
        acc[type].totalDue += defaulter.dueDetails.totalDue
        return acc
      }, {})
    }

    res.status(200).json({
      success: true,
      count: defaulters.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      data: defaulters,
      summary,
      filters: {
        academicYear,
        class: classFilter,
        section,
        minDueAmount
      }
    })

  } catch (error) {
    console.error('Get fee defaulters error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get fee defaulters',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}