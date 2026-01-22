const mongoose = require('mongoose')
const Fee = require('../models/Fee')
const Student = require('../models/Student')
const ClassFeeStructure = require('../models/ClassFeeStructure')
const BusFeeStructure = require('../models/BusFeeStructure')

// Helper function to generate receipt number
const generateReceiptNumber = async () => {
  const prefix = 'FEE'
  const year = new Date().getFullYear().toString().slice(-2)
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  
  const lastReceipt = await Fee.findOne({
    receiptNumber: new RegExp(`^${prefix}${year}${month}`)
  }).sort({ receiptNumber: -1 })
  
  let sequence = 1
  if (lastReceipt && lastReceipt.receiptNumber) {
    const lastSeq = parseInt(lastReceipt.receiptNumber.slice(-6))
    sequence = lastSeq + 1
  }
  
  return `${prefix}${year}${month}${String(sequence).padStart(6, '0')}`
}

// Helper function to get current user ID
const getCurrentUserId = (req) => {
  return req.user ? req.user.id : req.userId || 'system'
}

// Helper function to get class fee structure
const getClassFeeStructure = async (className, academicYear) => {
  try {
    const feeStructure = await ClassFeeStructure.findOne({
      className,
      academicYear,
      isActive: true
    })
    
    if (!feeStructure) {
      // Create default fee structure if not exists
      const defaultFees = {
        '1': 10000,
        '2': 11000,
        '3': 12000,
        '4': 13000,
        '5': 14000,
        '6': 15000,
        '7': 16000,
        '8': 17000,
        '9': 18000,
        '10': 19000,
        '11': 20000,
        '12': 21000
      }
      
      const totalAnnualFee = defaultFees[className] || 10000
      
      // Return default structure
      return {
        className,
        academicYear,
        totalAnnualFee,
        totalTerms: 3,
        termAmount: totalAnnualFee / 3
      }
    }
    
    return feeStructure
  } catch (error) {
    console.error('Error getting class fee structure:', error)
    
    // Return default structure on error
    const defaultFees = {
      '1': 10000,
      '2': 11000,
      '3': 12000,
      '4': 13000,
      '5': 14000,
      '6': 15000,
      '7': 16000,
      '8': 17000,
      '9': 18000,
      '10': 19000,
      '11': 20000,
      '12': 21000
    }
    
    const totalAnnualFee = defaultFees[className] || 10000
    
    return {
      className,
      academicYear,
      totalAnnualFee,
      totalTerms: 3,
      termAmount: totalAnnualFee / 3
    }
  }
}

// Helper function to calculate bus fee
const calculateBusFee = async (villageName, busRoute, academicYear) => {
  try {
    if (!villageName || !busRoute) {
      return 0
    }
    
    // Find bus fee structure
    const busFee = await BusFeeStructure.findOne({
      villageName: { $regex: new RegExp(villageName, 'i') },
      busRoute: { $regex: new RegExp(busRoute, 'i') },
      academicYear,
      isActive: true
    })
    
    return busFee ? busFee.feeAmount : 0
  } catch (error) {
    console.error('Error calculating bus fee:', error)
    return 0
  }
}

// 1. Create a new fee record
exports.createFeeRecord = async (req, res) => {
  try {
    const {
      studentId,
      academicYear,
      termType,
      termNumber,
      customTermName,
      className,
      villageName,
      busRoute,
      busStop,
      hasTransport,
      otherCharges = 0,
      previousBalance = 0,
      discountType = 'none',
      discountValue = 0,
      discountReason = '',
      dueDate,
      remarks = ''
    } = req.body

    // Validate student
    const student = await Student.findById(studentId)
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Get class fee structure
    const classFeeStructure = await getClassFeeStructure(
      className || student.class, 
      academicYear || student.academicYear
    )

    // Calculate base amount based on term
    let baseAmount = 0
    const totalAnnualFee = classFeeStructure.totalAnnualFee
    const totalTerms = classFeeStructure.totalTerms
    
    if (termType === 'annual') {
      baseAmount = totalAnnualFee
    } else if (termNumber && termNumber <= totalTerms) {
      baseAmount = totalAnnualFee / totalTerms
    } else if (termType === 'custom') {
      baseAmount = totalAnnualFee // Custom term - use full amount
    } else {
      return res.status(400).json({
        success: false,
        message: `Invalid term number. Maximum ${totalTerms} terms allowed.`
      })
    }

    // Calculate bus fee if applicable
    let busAmount = 0
    if (hasTransport && villageName && busRoute) {
      busAmount = await calculateBusFee(villageName, busRoute, academicYear || student.academicYear)
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber()

    // Get current user ID
    const currentUserId = getCurrentUserId(req)

    // Create fee record
    const feeRecord = new Fee({
      studentId,
      academicYear: academicYear || student.academicYear || '2024-2025',
      termType,
      termNumber: (termType === 'annual' || termType === 'custom') ? null : termNumber,
      customTermName: termType === 'custom' ? customTermName : undefined,
      baseAmount,
      busAmount,
      otherCharges,
      previousBalance,
      discountType,
      discountValue,
      discountReason,
      dueDate: new Date(dueDate),
      hasTransport: !!hasTransport,
      busRoute: hasTransport ? busRoute : undefined,
      villageName: hasTransport ? villageName : undefined,
      busStop: hasTransport ? busStop : undefined,
      className: className || student.class,
      receiptNumber,
      remarks,
      createdBy: currentUserId,
      updatedBy: currentUserId
    })

    await feeRecord.save()

    res.status(201).json({
      success: true,
      message: 'Fee record created successfully',
      data: feeRecord
    })
  } catch (error) {
    console.error('Error creating fee record:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating fee record',
      error: error.message
    })
  }
}

// 2. Generate all term fees for a student
exports.generateAllTermFees = async (req, res) => {
  try {
    const { studentId } = req.params
    const { academicYear } = req.body

    // Validate student
    const student = await Student.findById(studentId)
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Get class fee structure
    const classFeeStructure = await getClassFeeStructure(
      student.class,
      academicYear || student.academicYear
    )

    const totalAnnualFee = classFeeStructure.totalAnnualFee
    const totalTerms = classFeeStructure.totalTerms
    const termAmount = totalAnnualFee / totalTerms

    // Check existing fees for this academic year
    const existingFees = await Fee.find({
      studentId,
      academicYear: academicYear || student.academicYear || '2024-2025',
      termType: { $in: ['term-1', 'term-2', 'term-3', 'term-4'] }
    })

    const existingTermNumbers = existingFees.map(fee => fee.termNumber)
    const feesToCreate = []

    // Get current user ID
    const currentUserId = getCurrentUserId(req)

    // Generate fees for each term
    for (let termNum = 1; termNum <= totalTerms; termNum++) {
      if (!existingTermNumbers.includes(termNum)) {
        // Calculate bus fee if applicable
        let busAmount = 0
        if (student.hasTransport && student.villageName && student.busRoute) {
          busAmount = await calculateBusFee(
            student.villageName, 
            student.busRoute, 
            academicYear || student.academicYear
          )
        }

        // Set due dates based on term number
        const dueDate = new Date()
        if (classFeeStructure[`term${termNum}DueDate`]) {
          dueDate = new Date(classFeeStructure[`term${termNum}DueDate`])
        } else {
          // Default due dates: Apr 10, Aug 10, Dec 10, Mar 10
          const month = termNum === 1 ? 3 : termNum === 2 ? 7 : termNum === 3 ? 11 : 2
          dueDate.setMonth(month)
          dueDate.setDate(10)
        }

        const feeRecord = new Fee({
          studentId,
          academicYear: academicYear || student.academicYear || '2024-2025',
          termType: `term-${termNum}`,
          termNumber: termNum,
          baseAmount: termAmount,
          busAmount,
          otherCharges: 0,
          hasTransport: student.hasTransport,
          busRoute: student.hasTransport ? student.busRoute : undefined,
          villageName: student.hasTransport ? student.villageName : undefined,
          busStop: student.hasTransport ? student.busStop : undefined,
          className: student.class,
          dueDate,
          receiptNumber: await generateReceiptNumber(),
          createdBy: currentUserId,
          updatedBy: currentUserId
        })

        feesToCreate.push(feeRecord)
      }
    }

    if (feesToCreate.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All term fees already generated',
        data: existingFees
      })
    }

    // Save all new fee records
    const createdFees = await Fee.insertMany(feesToCreate)

    res.status(201).json({
      success: true,
      message: `${feesToCreate.length} term fees generated successfully`,
      data: {
        generated: createdFees,
        existing: existingFees
      }
    })
  } catch (error) {
    console.error('Error generating term fees:', error)
    res.status(500).json({
      success: false,
      message: 'Error generating term fees',
      error: error.message
    })
  }
}

// 3. Apply discount to fee
exports.applyDiscount = async (req, res) => {
  try {
    const { feeId } = req.params
    const { discountType, discountValue, discountReason } = req.body

    const feeRecord = await Fee.findById(feeId)
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      })
    }

    if (feeRecord.status === 'paid' || feeRecord.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot apply discount to ${feeRecord.status} fee`
      })
    }

    const currentUserId = getCurrentUserId(req)

    await feeRecord.applyDiscount({
      type: discountType,
      value: discountValue,
      reason: discountReason,
      updatedBy: currentUserId
    })

    res.status(200).json({
      success: true,
      message: 'Discount applied successfully',
      data: feeRecord
    })
  } catch (error) {
    console.error('Error applying discount:', error)
    res.status(500).json({
      success: false,
      message: 'Error applying discount',
      error: error.message
    })
  }
}

// 4. Make payment for fee
exports.makePayment = async (req, res) => {
  try {
    const { feeId } = req.params
    const {
      amount,
      paymentMode = 'cash',
      transactionId = '',
      chequeNumber = '',
      bankName = '',
      paymentDate,
      remarks = ''
    } = req.body

    const feeRecord = await Fee.findById(feeId)
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      })
    }

    if (feeRecord.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Fee is already paid in full'
      })
    }

    if (feeRecord.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot make payment for cancelled fee'
      })
    }

    const currentUserId = getCurrentUserId(req)

    await feeRecord.applyPayment({
      amount,
      paymentMode,
      transactionId,
      chequeNumber,
      bankName,
      paymentDate,
      remarks,
      updatedBy: currentUserId
    })

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: feeRecord
    })
  } catch (error) {
    console.error('Error making payment:', error)
    res.status(500).json({
      success: false,
      message: 'Error recording payment',
      error: error.message
    })
  }
}

// 5. Get student fee summary
exports.getStudentFeeSummary = async (req, res) => {
  try {
    const { studentId } = req.params
    const { academicYear } = req.query

    const student = await Student.findById(studentId)
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Get all fees for the student
    const fees = await Fee.find({
      studentId,
      academicYear: academicYear || student.academicYear || '2024-2025'
    })
    .sort({ termNumber: 1, createdAt: -1 })

    // Calculate summary
    let summary = {
      totalBaseAmount: 0,
      totalBusAmount: 0,
      totalDiscount: 0,
      totalLateFee: 0,
      totalOtherCharges: 0,
      totalPreviousBalance: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      termWise: {}
    }

    fees.forEach(fee => {
      const termKey = fee.termType === 'custom' ? 'custom' : `term-${fee.termNumber}`
      
      if (!summary.termWise[termKey]) {
        summary.termWise[termKey] = {
          baseAmount: 0,
          busAmount: 0,
          discount: 0,
          lateFee: 0,
          otherCharges: 0,
          previousBalance: 0,
          totalAmount: 0,
          paidAmount: 0,
          outstandingAmount: 0,
          status: fee.status
        }
      }

      // Update term-wise totals
      summary.termWise[termKey].baseAmount += fee.baseAmount
      summary.termWise[termKey].busAmount += fee.hasTransport ? fee.busAmount : 0
      summary.termWise[termKey].discount += fee.discountedAmount
      summary.termWise[termKey].lateFee += fee.lateFeeAmount
      summary.termWise[termKey].otherCharges += fee.otherCharges
      summary.termWise[termKey].previousBalance += fee.previousBalance
      summary.termWise[termKey].totalAmount += fee.totalAmount
      summary.termWise[termKey].paidAmount += fee.paidAmount
      summary.termWise[termKey].outstandingAmount += fee.outstandingAmount

      // Update overall totals
      summary.totalBaseAmount += fee.baseAmount
      summary.totalBusAmount += fee.hasTransport ? fee.busAmount : 0
      summary.totalDiscount += fee.discountedAmount
      summary.totalLateFee += fee.lateFeeAmount
      summary.totalOtherCharges += fee.otherCharges
      summary.totalPreviousBalance += fee.previousBalance
      summary.totalAmount += fee.totalAmount
      summary.totalPaid += fee.paidAmount
      summary.totalOutstanding += fee.outstandingAmount
    })

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNo,
          class: student.class,
          section: student.section,
          academicYear: student.academicYear,
          hasTransport: student.hasTransport,
          villageName: student.villageName,
          busRoute: student.busRoute
        },
        summary: summary,
        fees: fees,
        count: fees.length
      }
    })
  } catch (error) {
    console.error('Error fetching student fee summary:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching student fee summary',
      error: error.message
    })
  }
}

// 6. Get class outstanding fees
exports.getClassOutstandingFees = async (req, res) => {
  try {
    const { className, section } = req.params
    const { academicYear } = req.query

    // Get all students in the class
    const students = await Student.find({
      class: className,
      section: section,
      academicYear: academicYear || '2024-2025'
    }).select('_id firstName lastName admissionNo rollNo hasTransport villageName busRoute')

    const studentIds = students.map(student => student._id)

    // Get outstanding fees
    const outstandingFees = await Fee.find({
      studentId: { $in: studentIds },
      academicYear: academicYear || '2024-2025',
      status: { $in: ['pending', 'partial', 'overdue'] }
    })
    .populate('studentId', 'firstName lastName admissionNo rollNo class section hasTransport villageName busRoute')
    .sort({ dueDate: 1 })

    // Group by student
    const studentFeeMap = {}
    let classTotalOutstanding = 0
    let classTotalOverdue = 0

    outstandingFees.forEach(fee => {
      const studentId = fee.studentId._id.toString()
      if (!studentFeeMap[studentId]) {
        studentFeeMap[studentId] = {
          student: fee.studentId,
          fees: [],
          totalOutstanding: 0,
          totalOverdue: 0,
          hasTransport: fee.studentId.hasTransport,
          villageName: fee.studentId.villageName,
          busRoute: fee.studentId.busRoute
        }
      }

      const outstanding = fee.outstandingAmount
      studentFeeMap[studentId].fees.push({
        feeId: fee._id,
        term: fee.termType === 'custom' ? fee.customTermName : `Term ${fee.termNumber}`,
        dueDate: fee.dueDate,
        totalAmount: fee.totalAmount,
        paidAmount: fee.paidAmount,
        outstandingAmount: outstanding,
        status: fee.status,
        isOverdue: fee.isOverdue
      })

      studentFeeMap[studentId].totalOutstanding += outstanding
      classTotalOutstanding += outstanding

      if (fee.isOverdue) {
        studentFeeMap[studentId].totalOverdue += outstanding
        classTotalOverdue += outstanding
      }
    })

    // Convert to array and sort by roll number
    const studentFees = Object.values(studentFeeMap).sort((a, b) => 
      (a.student.rollNo || 0) - (b.student.rollNo || 0)
    )

    res.status(200).json({
      success: true,
      data: {
        className,
        section,
        academicYear: academicYear || '2024-2025',
        totalStudents: students.length,
        studentsWithOutstanding: studentFees.length,
        classTotalOutstanding,
        classTotalOverdue,
        studentFees
      }
    })
  } catch (error) {
    console.error('Error fetching class outstanding fees:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching class outstanding fees',
      error: error.message
    })
  }
}

// 7. Get fee receipt
exports.getFeeReceipt = async (req, res) => {
  try {
    const { feeId } = req.params

    const fee = await Fee.findById(feeId)
      .populate('studentId', 'firstName lastName admissionNo class section parentName parentPhone')

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      })
    }

    const receipt = {
      receiptNumber: fee.receiptNumber,
      date: fee.paymentDate || new Date(),
      student: {
        name: `${fee.studentId.firstName} ${fee.studentId.lastName}`,
        admissionNo: fee.studentId.admissionNo,
        class: fee.studentId.class,
        section: fee.studentId.section,
        parent: fee.studentId.parentName,
        parentPhone: fee.studentId.parentPhone
      },
      feeDetails: {
        academicYear: fee.academicYear,
        term: fee.termType === 'custom' ? fee.customTermName : `Term ${fee.termNumber}`,
        hasTransport: fee.hasTransport,
        busDetails: fee.hasTransport ? {
          route: fee.busRoute,
          village: fee.villageName,
          stop: fee.busStop
        } : null
      },
      amountBreakdown: {
        baseAmount: fee.baseAmount,
        busAmount: fee.hasTransport ? fee.busAmount : 0,
        otherCharges: fee.otherCharges,
        previousBalance: fee.previousBalance,
        lateFee: fee.lateFeeAmount,
        discount: fee.discountedAmount,
        subtotal: fee.baseAmount + 
                 (fee.hasTransport ? fee.busAmount : 0) + 
                 fee.otherCharges + 
                 fee.previousBalance,
        totalAmount: fee.totalAmount
      },
      paymentDetails: {
        paidAmount: fee.paidAmount,
        outstandingAmount: fee.outstandingAmount,
        mode: fee.paymentMode,
        transactionId: fee.transactionId,
        chequeNumber: fee.chequeNumber,
        bankName: fee.bankName
      },
      dates: {
        issueDate: fee.issueDate,
        dueDate: fee.dueDate,
        paymentDate: fee.paymentDate
      },
      discount: fee.discountType !== 'none' ? {
        type: fee.discountType,
        value: fee.discountValue,
        reason: fee.discountReason,
        amount: fee.discountedAmount
      } : null,
      status: fee.status,
      remarks: fee.remarks
    }

    res.status(200).json({
      success: true,
      data: receipt
    })
  } catch (error) {
    console.error('Error generating fee receipt:', error)
    res.status(500).json({
      success: false,
      message: 'Error generating fee receipt',
      error: error.message
    })
  }
}

// 8. Get bus fee collection report
exports.getBusFeeReport = async (req, res) => {
  try {
    const { academicYear, villageName, busRoute } = req.query

    const query = {
      academicYear: academicYear || '2024-2025',
      hasTransport: true,
      status: { $in: ['paid', 'partial'] }
    }

    if (villageName) {
      query.villageName = { $regex: new RegExp(villageName, 'i') }
    }

    if (busRoute) {
      query.busRoute = { $regex: new RegExp(busRoute, 'i') }
    }

    const fees = await Fee.find(query)
      .populate('studentId', 'firstName lastName admissionNo class section')
      .sort({ villageName: 1, busRoute: 1 })

    // Group by village and route
    const report = {}
    let totalBusCollection = 0
    let totalStudents = 0

    fees.forEach(fee => {
      const village = fee.villageName || 'Unknown'
      const route = fee.busRoute || 'Unknown'
      
      if (!report[village]) {
        report[village] = {}
      }
      
      if (!report[village][route]) {
        report[village][route] = {
          students: [],
          totalBusAmount: 0,
          totalPaid: 0,
          totalOutstanding: 0
        }
      }

      report[village][route].students.push({
        studentId: fee.studentId._id,
        name: `${fee.studentId.firstName} ${fee.studentId.lastName}`,
        admissionNo: fee.studentId.admissionNo,
        class: fee.studentId.class,
        section: fee.studentId.section,
        busAmount: fee.busAmount,
        paidAmount: fee.paidAmount,
        outstandingAmount: fee.outstandingAmount,
        status: fee.status
      })

      report[village][route].totalBusAmount += fee.busAmount
      report[village][route].totalPaid += fee.paidAmount
      report[village][route].totalOutstanding += fee.outstandingAmount
      
      totalBusCollection += fee.paidAmount
      totalStudents++
    })

    // Convert to array format
    const villageReports = Object.entries(report).map(([village, routes]) => ({
      village,
      routes: Object.entries(routes).map(([route, data]) => ({
        route,
        ...data,
        studentCount: data.students.length
      })),
      totalVillageCollection: Object.values(routes).reduce((sum, route) => sum + route.totalPaid, 0)
    }))

    res.status(200).json({
      success: true,
      data: {
        academicYear: academicYear || '2024-2025',
        totalStudents,
        totalBusCollection,
        villageReports,
        summary: {
          totalVillages: villageReports.length,
          totalRoutes: villageReports.reduce((sum, village) => sum + village.routes.length, 0)
        }
      }
    })
  } catch (error) {
    console.error('Error generating bus fee report:', error)
    res.status(500).json({
      success: false,
      message: 'Error generating bus fee report',
      error: error.message
    })
  }
}

// 9. Update fee record
exports.updateFeeRecord = async (req, res) => {
  try {
    const { feeId } = req.params
    const updateData = req.body

    const feeRecord = await Fee.findById(feeId)
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      })
    }

    // Cannot update if payment has been made
    if (feeRecord.paidAmount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update fee record with payments. Consider cancelling and creating a new one.'
      })
    }

    // Update allowed fields
    const allowedUpdates = [
      'dueDate', 'otherCharges', 'previousBalance', 
      'remarks', 'busRoute', 'villageName', 'busStop'
    ]

    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        feeRecord[field] = updateData[field]
      }
    })

    const currentUserId = getCurrentUserId(req)
    feeRecord.updatedBy = currentUserId
    await feeRecord.save()

    res.status(200).json({
      success: true,
      message: 'Fee record updated successfully',
      data: feeRecord
    })
  } catch (error) {
    console.error('Error updating fee record:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating fee record',
      error: error.message
    })
  }
}

// 10. Cancel fee record
exports.cancelFeeRecord = async (req, res) => {
  try {
    const { feeId } = req.params
    const { reason } = req.body

    const feeRecord = await Fee.findById(feeId)
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      })
    }

    // Cannot cancel if payment has been made
    if (feeRecord.paidAmount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel fee record with payments. Consider refund instead.'
      })
    }

    const currentUserId = getCurrentUserId(req)
    
    feeRecord.status = 'cancelled'
    feeRecord.remarks = feeRecord.remarks 
      ? `${feeRecord.remarks} Cancelled: ${reason}`
      : `Cancelled: ${reason}`
    feeRecord.updatedBy = currentUserId
    feeRecord.updatedAt = new Date()

    await feeRecord.save()

    res.status(200).json({
      success: true,
      message: 'Fee record cancelled successfully',
      data: feeRecord
    })
  } catch (error) {
    console.error('Error cancelling fee record:', error)
    res.status(500).json({
      success: false,
      message: 'Error cancelling fee record',
      error: error.message
    })
  }
}

// 11. Add late fee to fee record
exports.addLateFee = async (req, res) => {
  try {
    const { feeId } = req.params
    const { amount, reason } = req.body

    const feeRecord = await Fee.findById(feeId)
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      })
    }

    if (feeRecord.status === 'paid' || feeRecord.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot add late fee to ${feeRecord.status} fee`
      })
    }

    const currentUserId = getCurrentUserId(req)

    await feeRecord.addLateFee({
      amount,
      reason,
      updatedBy: currentUserId
    })

    res.status(200).json({
      success: true,
      message: 'Late fee added successfully',
      data: feeRecord
    })
  } catch (error) {
    console.error('Error adding late fee:', error)
    res.status(500).json({
      success: false,
      message: 'Error adding late fee',
      error: error.message
    })
  }
}

// 12. Search fees with filters
exports.searchFees = async (req, res) => {
  try {
    const {
      studentId,
      academicYear,
      status,
      termType,
      className,
      section,
      hasTransport,
      villageName,
      page = 1,
      limit = 50
    } = req.query

    const query = {}
    
    if (studentId) query.studentId = studentId
    if (academicYear) query.academicYear = academicYear
    if (status) query.status = status
    if (termType) query.termType = termType
    if (hasTransport !== undefined) query.hasTransport = hasTransport === 'true'
    if (villageName) query.villageName = { $regex: new RegExp(villageName, 'i') }
    if (className) query.className = className

    // If section filter is provided, get students first
    if (section && !studentId) {
      const students = await Student.find({
        section: section,
        academicYear: academicYear || '2024-2025'
      }).select('_id')
      
      const studentIds = students.map(student => student._id)
      
      if (studentIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            fees: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0
            }
          }
        })
      }
      
      query.studentId = { $in: studentIds }
    }

    const skip = (page - 1) * limit
    
    const fees = await Fee.find(query)
      .populate('studentId', 'firstName lastName admissionNo class section')
      .sort({ dueDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Fee.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        fees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error searching fees:', error)
    res.status(500).json({
      success: false,
      message: 'Error searching fees',
      error: error.message
    })
  }
}

// 13. Get fee collection report
exports.getFeeCollectionReport = async (req, res) => {
  try {
    const { startDate, endDate, academicYear, paymentMode } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      })
    }

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const query = {
      paymentDate: { $gte: start, $lte: end },
      academicYear: academicYear || '2024-2025',
      status: { $in: ['paid', 'partial'] }
    }

    if (paymentMode) {
      query.paymentMode = paymentMode
    }

    const fees = await Fee.find(query)
      .populate('studentId', 'firstName lastName class section')
      .sort({ paymentDate: -1 })

    let totalCollection = 0
    let cashCollection = 0
    let onlineCollection = 0
    let chequeCollection = 0
    let otherCollection = 0
    let classWiseCollection = {}
    let dailyCollections = {}

    fees.forEach(fee => {
      const paidAmount = fee.paidAmount
      totalCollection += paidAmount

      // Categorize by payment mode
      switch (fee.paymentMode) {
        case 'cash':
          cashCollection += paidAmount
          break
        case 'online':
        case 'card':
        case 'upi':
        case 'bank-transfer':
          onlineCollection += paidAmount
          break
        case 'cheque':
          chequeCollection += paidAmount
          break
        default:
          otherCollection += paidAmount
      }

      // Group by class
      const className = fee.className
      if (!classWiseCollection[className]) {
        classWiseCollection[className] = 0
      }
      classWiseCollection[className] += paidAmount

      // Group by date
      const dateStr = fee.paymentDate.toISOString().split('T')[0]
      if (!dailyCollections[dateStr]) {
        dailyCollections[dateStr] = 0
      }
      dailyCollections[dateStr] += paidAmount
    })

    // Convert to arrays
    const classWiseArray = Object.entries(classWiseCollection)
      .map(([className, amount]) => ({ className, amount }))
      .sort((a, b) => b.amount - a.amount)

    const dailyCollectionArray = Object.entries(dailyCollections)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    res.status(200).json({
      success: true,
      data: {
        period: { start, end },
        academicYear: academicYear || '2024-2025',
        summary: {
          totalFees: fees.length,
          totalCollection,
          cashCollection,
          onlineCollection,
          chequeCollection,
          otherCollection,
          averageCollection: fees.length > 0 ? (totalCollection / fees.length).toFixed(2) : 0
        },
        classWiseCollection: classWiseArray,
        dailyCollections: dailyCollectionArray,
        modeWisePercentage: {
          cash: totalCollection > 0 ? ((cashCollection / totalCollection) * 100).toFixed(2) : 0,
          online: totalCollection > 0 ? ((onlineCollection / totalCollection) * 100).toFixed(2) : 0,
          cheque: totalCollection > 0 ? ((chequeCollection / totalCollection) * 100).toFixed(2) : 0,
          other: totalCollection > 0 ? ((otherCollection / totalCollection) * 100).toFixed(2) : 0
        }
      }
    })
  } catch (error) {
    console.error('Error generating fee collection report:', error)
    res.status(500).json({
      success: false,
      message: 'Error generating fee collection report',
      error: error.message
    })
  }
}

// 14. Apply bulk discount to students
exports.applyBulkDiscount = async (req, res) => {
  try {
    const { studentIds, discountType, discountValue, discountReason, academicYear } = req.body

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student IDs array is required'
      })
    }

    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Discount percentage must be between 0 and 100'
      })
    }

    if (discountType === 'fixed' && discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Fixed discount must be greater than 0'
      })
    }

    // Get all pending fees for these students
    const fees = await Fee.find({
      studentId: { $in: studentIds },
      academicYear: academicYear || '2024-2025',
      status: { $in: ['pending', 'partial', 'overdue'] }
    })

    const results = []
    const currentUserId = getCurrentUserId(req)
    
    for (const fee of fees) {
      try {
        await fee.applyDiscount({
          type: discountType,
          value: discountValue,
          reason: discountReason,
          updatedBy: currentUserId
        })
        
        results.push({
          feeId: fee._id,
          studentId: fee.studentId,
          success: true,
          newTotal: fee.totalAmount,
          discountApplied: fee.discountedAmount
        })
      } catch (error) {
        results.push({
          feeId: fee._id,
          studentId: fee.studentId,
          success: false,
          error: error.message
        })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    res.status(200).json({
      success: true,
      message: `Discount applied to ${successful} fees. ${failed} failed.`,
      data: {
        discountType,
        discountValue,
        discountReason,
        academicYear: academicYear || '2024-2025',
        results,
        summary: {
          totalFees: fees.length,
          successful,
          failed
        }
      }
    })
  } catch (error) {
    console.error('Error applying bulk discount:', error)
    res.status(500).json({
      success: false,
      message: 'Error applying bulk discount',
      error: error.message
    })
  }
}

// 15. Get all fees (for listing)
exports.getAllFees = async (req, res) => {
  try {
    const { 
      academicYear, 
      status, 
      paymentMode, 
      startDate, 
      endDate,
      className,
      page = 1,
      limit = 50
    } = req.query

    const query = {}
    
    if (academicYear) query.academicYear = academicYear
    if (status) query.status = status
    if (paymentMode) query.paymentMode = paymentMode
    if (className) query.className = className
    
    // Date range filter
    if (startDate || endDate) {
      query.paymentDate = {}
      if (startDate) query.paymentDate.$gte = new Date(startDate)
      if (endDate) query.paymentDate.$lte = new Date(endDate)
    }

    const skip = (page - 1) * limit
    
    const fees = await Fee.find(query)
      .populate('studentId', 'firstName lastName admissionNo class section')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Fee.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        fees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching all fees:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching fees',
      error: error.message
    })
  }
}

// 16. Get fee by ID
exports.getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.feeId)
      .populate('studentId', 'firstName lastName admissionNo class section parentName parentPhone')

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      })
    }

    res.status(200).json({
      success: true,
      data: fee
    })
  } catch (error) {
    console.error('Error fetching fee by ID:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching fee record',
      error: error.message
    })
  }
}