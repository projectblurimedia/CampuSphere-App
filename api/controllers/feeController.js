import prisma from '../lib/prisma.js'
import {
  getNextClass,
  getPreviousClass,
  mapClassToEnum,
  mapEnumToDisplayName,
  parseDiscount,
} from '../utils/classMappings.js'

// ========== HELPER FUNCTIONS ==========

/**
 * Generate unique receipt number
 * Format: RCPT-YYYYMMDD-XXXX
 */
const generateReceiptNo = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `RCPT-${year}${month}${day}-${random}`
}

/**
 * Generate student details snapshot for payment history
 */
const getStudentDetailsSnapshot = (student) => {
  return {
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    parentName: student.parentName || '',
    parentPhone: student.parentPhone || '',
    class: student.class,
    classLabel: mapEnumToDisplayName(student.class),
    section: student.section || '',
    admissionNo: student.admissionNo || ''
  }
}

/**
 * Calculate discounted fees based on student-level discounts
 */
const calculateDiscountedFees = (originalAmount, discountPercent) => {
  if (!originalAmount || originalAmount <= 0) return 0
  const discountAmount = Math.floor((originalAmount * discountPercent) / 100)
  return originalAmount - discountAmount
}

/**
 * Calculate term distribution with efficient splitting including remainders
 * Returns JSON object with term-wise breakdown of each fee component
 */
const calculateTermDistribution = (discountedSchoolFee, discountedTransportFee, discountedHostelFee, terms = 3) => {
  if (terms <= 0) return {}
  
  const distribution = {}
  
  // Calculate base amounts per term (floor division)
  const baseSchoolFee = Math.floor(discountedSchoolFee / terms)
  const baseTransportFee = Math.floor(discountedTransportFee / terms)
  const baseHostelFee = Math.floor(discountedHostelFee / terms)
  
  // Calculate remainders
  const remainderSchool = discountedSchoolFee - (baseSchoolFee * terms)
  const remainderTransport = discountedTransportFee - (baseTransportFee * terms)
  const remainderHostel = discountedHostelFee - (baseHostelFee * terms)
  
  for (let i = 1; i <= terms; i++) {
    // Add remainder to the first term(s) - distribute remainders across first few terms
    const schoolFee = baseSchoolFee + (i <= remainderSchool ? 1 : 0)
    const transportFee = baseTransportFee + (i <= remainderTransport ? 1 : 0)
    const hostelFee = baseHostelFee + (i <= remainderHostel ? 1 : 0)
    
    distribution[i] = {
      schoolFee,
      transportFee,
      hostelFee,
      total: schoolFee + transportFee + hostelFee,
      // Initialize payment tracking fields
      schoolFeePaid: 0,
      transportFeePaid: 0,
      hostelFeePaid: 0,
      totalPaid: 0,
      status: 'Unpaid'
    }
  }
  
  return distribution
}

/**
 * Calculate term due amounts from term distribution (for backward compatibility)
 */
const calculateTermDueFromDistribution = (termDistribution) => {
  if (!termDistribution || Object.keys(termDistribution).length === 0) {
    return { term1Due: 0, term2Due: 0, term3Due: 0 }
  }
  
  return {
    term1Due: termDistribution[1]?.total || 0,
    term2Due: termDistribution[2]?.total || 0,
    term3Due: termDistribution[3]?.total || 0
  }
}

/**
 * Set due dates based on fee record creation date
 */
const calculateTermDueDates = (createdAt = new Date()) => {
  const date = new Date(createdAt)
  
  const term1DueDate = new Date(date)
  term1DueDate.setMonth(date.getMonth() + 4) // Due in 4 months
  
  const term2DueDate = new Date(date)
  term2DueDate.setMonth(date.getMonth() + 8) // Due in 8 months
  
  const term3DueDate = new Date(date)
  term3DueDate.setMonth(date.getMonth() + 12) // Due in 12 months
  
  return {
    term1DueDate,
    term2DueDate,
    term3DueDate
  }
}


/**
 * Update term paid amounts based on payment distribution
 */
const updateTermPaidAmounts = (termDistribution, termNumber, schoolFeePaid, transportFeePaid, hostelFeePaid) => {
  if (!termDistribution || !termDistribution[termNumber]) return termDistribution
  
  const updatedDistribution = JSON.parse(JSON.stringify(termDistribution)) // Deep clone
  
  // Get current term data
  const termData = updatedDistribution[termNumber]
  
  // Calculate maximum payable amounts for this term
  const maxSchoolFeePayable = termData.schoolFee - (termData.schoolFeePaid || 0)
  const maxTransportFeePayable = termData.transportFee - (termData.transportFeePaid || 0)
  const maxHostelFeePayable = termData.hostelFee - (termData.hostelFeePaid || 0)
  
  // Apply payment (cannot exceed due amount)
  const actualSchoolFeePaid = Math.min(schoolFeePaid, maxSchoolFeePayable)
  const actualTransportFeePaid = Math.min(transportFeePaid, maxTransportFeePayable)
  const actualHostelFeePaid = Math.min(hostelFeePaid, maxHostelFeePayable)
  
  // Update paid amounts
  termData.schoolFeePaid = (termData.schoolFeePaid || 0) + actualSchoolFeePaid
  termData.transportFeePaid = (termData.transportFeePaid || 0) + actualTransportFeePaid
  termData.hostelFeePaid = (termData.hostelFeePaid || 0) + actualHostelFeePaid
  
  // Update total paid
  termData.totalPaid = termData.schoolFeePaid + termData.transportFeePaid + termData.hostelFeePaid
  
  // Update status
  if (termData.totalPaid >= termData.total) {
    termData.status = 'Paid'
  } else if (termData.totalPaid > 0) {
    termData.status = 'Partial'
  } else {
    termData.status = 'Unpaid'
  }
  
  return updatedDistribution
}

/**
 * Recalculate overall totals from term distribution
 */
const recalculateOverallTotals = (termDistribution) => {
  let totalSchoolFeePaid = 0
  let totalTransportFeePaid = 0
  let totalHostelFeePaid = 0
  let totalPaid = 0
  
  for (let i = 1; i <= 3; i++) {
    if (termDistribution[i]) {
      totalSchoolFeePaid += termDistribution[i].schoolFeePaid || 0
      totalTransportFeePaid += termDistribution[i].transportFeePaid || 0
      totalHostelFeePaid += termDistribution[i].hostelFeePaid || 0
      totalPaid += termDistribution[i].totalPaid || 0
    }
  }
  
  return {
    schoolFeePaid: totalSchoolFeePaid,
    transportFeePaid: totalTransportFeePaid,
    hostelFeePaid: totalHostelFeePaid,
    totalPaid
  }
}

/**
 * Get formatted previous year details with proper structure
 */
const getFormattedPreviousYearDetails = (previousYearDetails) => {
  if (!previousYearDetails) return []
  
  try {
    const details = typeof previousYearDetails === 'string' 
      ? JSON.parse(previousYearDetails) 
      : previousYearDetails
      
    if (!Array.isArray(details)) return []
    
    return details.map(record => {
      // Ensure termPayments exists and has correct structure
      let termPayments = record.termPayments || {}
      
      // If termPayments doesn't exist but termDistribution does, build termPayments from termDistribution
      if (Object.keys(termPayments).length === 0 && record.termDistribution) {
        termPayments = {}
        Object.entries(record.termDistribution).forEach(([termNum, termData]) => {
          const schoolDue = termData.schoolFee || 0
          const transportDue = termData.transportFee || 0
          const hostelDue = termData.hostelFee || 0
          const totalDue = schoolDue + transportDue + hostelDue
          
          const schoolPaid = termData.schoolFeePaid || 0
          const transportPaid = termData.transportFeePaid || 0
          const hostelPaid = termData.hostelFeePaid || 0
          const totalPaid = schoolPaid + transportPaid + hostelPaid
          
          termPayments[`term${termNum}`] = {
            due: totalDue,
            paid: totalPaid,
            remaining: totalDue - totalPaid,
            components: {
              schoolFee: {
                due: schoolDue,
                paid: schoolPaid,
                remaining: schoolDue - schoolPaid
              },
              transportFee: {
                due: transportDue,
                paid: transportPaid,
                remaining: transportDue - transportPaid
              },
              hostelFee: {
                due: hostelDue,
                paid: hostelPaid,
                remaining: hostelDue - hostelPaid
              }
            }
          }
        })
      }
      
      // Calculate remaining breakdown by summing component remaining amounts
      let yearSchoolRemaining = 0
      let yearTransportRemaining = 0
      let yearHostelRemaining = 0
      
      // First, check if we have remainingBreakdown in the record (use it if available)
      if (record.remainingBreakdown) {
        yearSchoolRemaining = record.remainingBreakdown.school || 0
        yearTransportRemaining = record.remainingBreakdown.transport || 0
        yearHostelRemaining = record.remainingBreakdown.hostel || 0
      } 
      // Otherwise calculate from termPayments
      else if (Object.keys(termPayments).length > 0) {
        Object.values(termPayments).forEach(term => {
          if (term.components) {
            yearSchoolRemaining += term.components.schoolFee?.remaining || 0
            yearTransportRemaining += term.components.transportFee?.remaining || 0
            yearHostelRemaining += term.components.hostelFee?.remaining || 0
          }
        })
      }
      
      return {
        academicYear: record.academicYear,
        class: record.class,
        classLabel: record.classLabel,
        section: record.section,
        originalTotalFee: record.originalTotalFee,
        discountedTotalFee: record.discountedTotalFee,
        totalPaid: record.totalPaid,
        totalDue: record.totalDue,
        termDistribution: record.termDistribution || {},
        termPayments: termPayments,
        discounts: record.discounts || {
          school: 0,
          transport: 0,
          hostel: 0
        },
        isFullyPaid: record.isFullyPaid,
        archivedAt: record.archivedAt,
        remainingBreakdown: {
          school: yearSchoolRemaining,
          transport: yearTransportRemaining,
          hostel: yearHostelRemaining,
          total: yearSchoolRemaining + yearTransportRemaining + yearHostelRemaining
        }
      }
    })
  } catch (e) {
    console.error('Error formatting previous year details:', e)
    return []
  }
}

/**
 * Calculate total previous year pending fees (sum of all historical dues)
 */
const calculateTotalPreviousYearPending = (previousYearDetails) => {
  if (!previousYearDetails) return 0
  
  try {
    const details = typeof previousYearDetails === 'string' 
      ? JSON.parse(previousYearDetails) 
      : previousYearDetails
      
    if (!Array.isArray(details)) return 0
    
    return details.reduce((sum, record) => sum + (record.totalDue || 0), 0)
  } catch (e) {
    return 0
  }
}

/**
 * Get current academic year
 */
const getAcademicYear = () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  // Academic year typically starts in June (month 6)
  if (currentMonth >= 6) {
    return `${currentYear}-${currentYear + 1}`
  } else {
    return `${currentYear - 1}-${currentYear}`
  }
}

/**
 * Archive current year's attendance records before clearing
 */
const clearAttendanceRecords = async (tx, studentId) => {
  const result = await tx.attendance.deleteMany({
    where: { studentId }
  })
  return result.count
}

/**
 * Archive current year's marks records before clearing
 */
const clearMarksRecords = async (tx, studentId) => {
  const result = await tx.marks.deleteMany({
    where: { studentId }
  })
  return result.count
}

/**
 * Reset current year fee details while preserving previous year history
 * IMPORTANT: Previous year fees should NEVER be modified
 */
const resetCurrentYearFeeDetails = async (tx, studentId, action, updatedBy, targetClass = null) => {
  console.log('Resetting fee details for student:', studentId, 'action:', action, 'targetClass:', targetClass)
  
  // Get the latest fee record
  const currentFeeRecord = await tx.feeDetails.findFirst({
    where: { studentId },
    orderBy: { createdAt: 'desc' }
  })

  console.log('Current fee record found:', currentFeeRecord ? 'Yes' : 'No')

  // Get student details
  const student = await tx.student.findUnique({
    where: { id: studentId },
    select: {
      class: true,
      section: true,
      studentType: true,
      isUsingSchoolTransport: true,
      isUsingSchoolHostel: true,
      schoolFeeDiscount: true,
      transportFeeDiscount: true,
      hostelFeeDiscount: true
    }
  })

  // Determine which class fee to apply
  let classForNewFee = student.class
  if (action === 'PROMOTED' && targetClass) {
    classForNewFee = targetClass // For promotion, use next class
  }
  // For demotion, keep same class (classForNewFee = student.class)

  // Get previous year details from current record if it exists
  let previousYearDetails = []
  let previousYearFee = 0
  
  if (currentFeeRecord) {
    // Parse existing previous year details - KEEP THEM UNCHANGED
    try {
      previousYearDetails = typeof currentFeeRecord.previousYearDetails === 'string'
        ? JSON.parse(currentFeeRecord.previousYearDetails)
        : currentFeeRecord.previousYearDetails || []
    } catch (e) {
      console.error('Error parsing previousYearDetails:', e)
      previousYearDetails = []
    }

    // Ensure it's an array
    if (!Array.isArray(previousYearDetails)) {
      previousYearDetails = []
    }

    // Calculate previous year fee from existing records - UNCHANGED
    previousYearFee = previousYearDetails.reduce((sum, record) => sum + (record.totalDue || 0), 0)

    // Delete the current fee record (we'll create a new one)
    await tx.feeDetails.delete({
      where: { id: currentFeeRecord.id }
    })
  }

  // Create new fee record with the appropriate class fee structure
  const newFeeRecord = await createOrUpdateFeeRecord(
    tx,
    studentId,
    classForNewFee,
    student.studentType,
    student.isUsingSchoolTransport,
    student.isUsingSchoolHostel,
    updatedBy,
    previousYearDetails, // Pass existing previous year details
    previousYearFee // Pass existing previous year fee
  )

  return {
    resetFeeRecord: newFeeRecord,
    archivedYearRecord: null // No need to return archived record
  }
}

/**
 * Create or update fee record with class fee structure
 */
const createOrUpdateFeeRecord = async (tx, studentId, className, studentType, isUsingTransport, isUsingHostel, updatedBy, existingPreviousYearDetails = [], existingPreviousYearFee = 0) => {
  // Get class fee structure
  const classFeeStructure = await tx.classFeeStructure.findFirst({
    where: { 
      className: className,
      isActive: true 
    }
  })

  // Get transport fee if student uses transport
  let transportFee = 0
  if (isUsingTransport) {
    // You might want to get transport fee based on village
    transportFee = 5000 // Default transport fee
  }

  // Get hostel fee if student uses hostel
  let hostelFee = 0
  if (isUsingHostel) {
    const hostelFeeStructure = await tx.hostelFeeStructure.findFirst({
      where: { 
        className: className,
        isActive: true 
      }
    })
    hostelFee = hostelFeeStructure?.totalAnnualFee || 0
  }

  // Get student-level discounts
  const student = await tx.student.findUnique({
    where: { id: studentId },
    select: {
      schoolFeeDiscount: true,
      transportFeeDiscount: true,
      hostelFeeDiscount: true
    }
  })

  const schoolFeeDiscount = student?.schoolFeeDiscount || 0
  const transportFeeDiscount = student?.transportFeeDiscount || 0
  const hostelFeeDiscount = student?.hostelFeeDiscount || 0

  // Original amounts
  const originalSchoolFee = classFeeStructure?.totalAnnualFee || 0
  const originalTransportFee = transportFee
  const originalHostelFee = hostelFee
  const originalTotalFee = originalSchoolFee + originalTransportFee + originalHostelFee

  // Discounted amounts
  const discountedSchoolFee = calculateDiscountedFees(originalSchoolFee, schoolFeeDiscount)
  const discountedTransportFee = calculateDiscountedFees(originalTransportFee, transportFeeDiscount)
  const discountedHostelFee = calculateDiscountedFees(originalHostelFee, hostelFeeDiscount)
  const discountedTotalFee = discountedSchoolFee + discountedTransportFee + discountedHostelFee

  // Calculate term distribution
  const termDistribution = calculateTermDistribution(
    discountedSchoolFee,
    discountedTransportFee,
    discountedHostelFee,
    3
  )
  
  // Calculate term due amounts from distribution
  const termDueAmounts = calculateTermDueFromDistribution(termDistribution)
  const termDueDates = calculateTermDueDates()

  // Create new fee record
  const newFeeRecord = await tx.feeDetails.create({
    data: {
      studentId,
      
      // Original amounts
      originalSchoolFee,
      originalTransportFee,
      originalHostelFee,
      originalTotalFee,
      
      // Discounted amounts
      discountedSchoolFee,
      discountedTransportFee,
      discountedHostelFee,
      discountedTotalFee,
      
      // Paid amounts (initial zero)
      schoolFeePaid: 0,
      transportFeePaid: 0,
      hostelFeePaid: 0,
      totalPaid: 0,
      
      // Term distribution with initial values
      termDistribution,
      
      // Term amounts and due dates
      terms: 3,
      ...termDueAmounts,
      ...termDueDates,
      
      // Term paid amounts (initial zero)
      term1Paid: 0,
      term2Paid: 0,
      term3Paid: 0,
      
      // Discounts applied
      schoolFeeDiscountApplied: schoolFeeDiscount,
      transportFeeDiscountApplied: transportFeeDiscount,
      hostelFeeDiscountApplied: hostelFeeDiscount,
      
      // Total due equals discounted total fee initially
      totalDue: discountedTotalFee,
      
      // Previous year details - KEEP EXISTING ONES UNCHANGED
      previousYearDetails: existingPreviousYearDetails,
      previousYearFee: existingPreviousYearFee,
      
      isFullyPaid: false,
      updatedBy
    }
  })

  return newFeeRecord
}

/**
 * Update student's studiedClasses history
 */
const updateStudiedClasses = (currentStudiedClasses, newEntry) => {
  let studiedClasses = []
  
  try {
    studiedClasses = typeof currentStudiedClasses === 'string'
      ? JSON.parse(currentStudiedClasses)
      : currentStudiedClasses || []
  } catch (e) {
    studiedClasses = []
  }
  
  if (!Array.isArray(studiedClasses)) {
    studiedClasses = []
  }
  
  studiedClasses.push(newEntry)
  
  return studiedClasses
}

// ========== STUDENT FEE OPERATIONS ==========

/**
 * @desc    Search students for fee management
 * @route   GET /api/fee/students/search
 */
export const searchStudentsForFee = async (req, res) => {
  try {
    const {
      search,
      class: classFilter,
      section,
      page = 1,
      limit = 20
    } = req.query

    const where = {
      isActive: true
    }

    // Search by name, admission no, parent name, phone
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNo: { contains: search, mode: 'insensitive' } },
        { parentName: { contains: search, mode: 'insensitive' } },
        { parentPhone: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Class filter
    if (classFilter && classFilter !== 'ALL' && classFilter !== 'all') {
      const classEnum = mapClassToEnum(classFilter)
      if (classEnum) where.class = classEnum
    }

    // Section filter
    if (section && section !== 'ALL' && section !== 'all') {
      where.section = section.toUpperCase()
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          feeDetails: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { class: 'asc' },
          { section: 'asc' },
          { firstName: 'asc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.student.count({ where })
    ])

    // Process students with fee summary using discounted fees
    const processedStudents = students.map(student => {
      const feeRecord = student.feeDetails[0] || null
      
      // Parse previous year details
      const previousYearDetails = feeRecord ? getFormattedPreviousYearDetails(feeRecord.previousYearDetails) : []
      const previousYearFee = feeRecord ? calculateTotalPreviousYearPending(previousYearDetails) : 0
      
      let feeSummary = null
      if (feeRecord) {
        const discountedTotalFee = feeRecord.discountedSchoolFee + feeRecord.discountedTransportFee + feeRecord.discountedHostelFee
        const totalPaid = feeRecord.schoolFeePaid + feeRecord.transportFeePaid + feeRecord.hostelFeePaid
        const currentYearDue = discountedTotalFee - totalPaid // Current year's due only
        const totalDue = previousYearFee + currentYearDue // Total due including previous years
        
        feeSummary = {
          discountedTotalFee,
          originalTotalFee: feeRecord.originalTotalFee,
          totalPaid,
          currentYearDue,
          previousYearFee,
          totalDue,
          paymentStatus: totalDue === 0 ? 'Paid' : 
                        totalDue === (discountedTotalFee + previousYearFee) ? 'Unpaid' : 'Partial',
          schoolFee: {
            original: feeRecord.originalSchoolFee,
            discounted: feeRecord.discountedSchoolFee,
            paid: feeRecord.schoolFeePaid,
            due: feeRecord.discountedSchoolFee - feeRecord.schoolFeePaid,
            discount: feeRecord.schoolFeeDiscountApplied
          },
          transportFee: {
            original: feeRecord.originalTransportFee,
            discounted: feeRecord.discountedTransportFee,
            paid: feeRecord.transportFeePaid,
            due: feeRecord.discountedTransportFee - feeRecord.transportFeePaid,
            discount: feeRecord.transportFeeDiscountApplied
          },
          hostelFee: {
            original: feeRecord.originalHostelFee,
            discounted: feeRecord.discountedHostelFee,
            paid: feeRecord.hostelFeePaid,
            due: feeRecord.discountedHostelFee - feeRecord.hostelFeePaid,
            discount: feeRecord.hostelFeeDiscountApplied
          },
          previousYears: previousYearDetails
        }
      }

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        class: student.class,
        displayClass: mapEnumToDisplayName(student.class),
        section: student.section,
        studentType: student.studentType,
        isUsingSchoolTransport: student.isUsingSchoolTransport,
        village: student.village,
        parentPhone: student.parentPhone,
        discounts: {
          schoolFee: student.schoolFeeDiscount,
          transportFee: student.transportFeeDiscount,
          hostelFee: student.hostelFeeDiscount
        },
        feeSummary
      }
    })

    res.status(200).json({
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
  } catch (error) {
    console.error('Search students for fee error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search students'
    })
  }
}

/**
 * @desc    Get detailed fee information for a specific student
 * @route   GET /api/fee/students/:studentId/fee-details
 */
export const getStudentFeeDetails = async (req, res) => {
  try {
    const { studentId } = req.params

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        feeDetails: {
          orderBy: { createdAt: 'desc' }
        },
        paymentHistory: {
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    const currentFeeRecord = student.feeDetails[0] || null

    if (!currentFeeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Fee details not found for this student'
      })
    }

    // Parse previous year details
    const previousYearDetails = getFormattedPreviousYearDetails(currentFeeRecord.previousYearDetails)
    const previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)

    // Calculate current year totals using discounted amounts
    const discountedSchoolFee = currentFeeRecord.discountedSchoolFee || 0
    const discountedTransportFee = currentFeeRecord.discountedTransportFee || 0
    const discountedHostelFee = currentFeeRecord.discountedHostelFee || 0
    const discountedTotalFee = discountedSchoolFee + discountedTransportFee + discountedHostelFee

    // Calculate paid amounts
    const schoolFeePaid = currentFeeRecord.schoolFeePaid || 0
    const transportFeePaid = currentFeeRecord.transportFeePaid || 0
    const hostelFeePaid = currentFeeRecord.hostelFeePaid || 0
    const totalPaid = schoolFeePaid + transportFeePaid + hostelFeePaid

    // Calculate due amounts
    const schoolFeeDue = Math.max(0, discountedSchoolFee - schoolFeePaid)
    const transportFeeDue = Math.max(0, discountedTransportFee - transportFeePaid)
    const hostelFeeDue = Math.max(0, discountedHostelFee - hostelFeePaid)
    const currentYearDue = schoolFeeDue + transportFeeDue + hostelFeeDue
    const totalDue = previousYearFee + currentYearDue

    // Parse term distribution
    const termDistribution = currentFeeRecord.termDistribution || {}

    // Calculate term-wise breakdown with component details
    const termWiseBreakdown = {}
    
    for (let termNum = 1; termNum <= 3; termNum++) {
      const termData = termDistribution[termNum] || {}
      
      // Calculate remaining amounts for this term
      const termSchoolDue = termData.schoolFee || 0
      const termTransportDue = termData.transportFee || 0
      const termHostelDue = termData.hostelFee || 0
      
      const termSchoolPaid = termData.schoolFeePaid || 0
      const termTransportPaid = termData.transportFeePaid || 0
      const termHostelPaid = termData.hostelFeePaid || 0
      
      const termSchoolRemaining = Math.max(0, termSchoolDue - termSchoolPaid)
      const termTransportRemaining = Math.max(0, termTransportDue - termTransportPaid)
      const termHostelRemaining = Math.max(0, termHostelDue - termHostelPaid)
      
      const termDueAmount = termSchoolDue + termTransportDue + termHostelDue
      const termPaidAmount = termSchoolPaid + termTransportPaid + termHostelPaid
      const termRemainingAmount = termDueAmount - termPaidAmount
      
      const termStatus = termRemainingAmount === 0 ? 'Paid' : 
                        termPaidAmount > 0 ? 'Partial' : 'Unpaid'
      
      termWiseBreakdown[`term${termNum}`] = {
        dueAmount: termDueAmount,
        paidAmount: termPaidAmount,
        remainingAmount: termRemainingAmount,
        dueDate: currentFeeRecord[`term${termNum}DueDate`],
        status: termStatus,
        components: {
          schoolFee: {
            due: termSchoolDue,
            paid: termSchoolPaid,
            remaining: termSchoolRemaining,
            discount: currentFeeRecord.schoolFeeDiscountApplied || 0
          },
          transportFee: {
            due: termTransportDue,
            paid: termTransportPaid,
            remaining: termTransportRemaining,
            discount: currentFeeRecord.transportFeeDiscountApplied || 0
          },
          hostelFee: {
            due: termHostelDue,
            paid: termHostelPaid,
            remaining: termHostelRemaining,
            discount: currentFeeRecord.hostelFeeDiscountApplied || 0
          }
        }
      }
    }

    // Prepare fee breakdown
    const feeBreakdown = {
      schoolFee: {
        original: currentFeeRecord.originalSchoolFee || 0,
        discounted: discountedSchoolFee,
        paid: schoolFeePaid,
        due: schoolFeeDue,
        discount: currentFeeRecord.schoolFeeDiscountApplied || 0,
        discountAmount: (currentFeeRecord.originalSchoolFee || 0) - discountedSchoolFee,
        percentagePaid: discountedSchoolFee > 0 
          ? ((schoolFeePaid / discountedSchoolFee) * 100).toFixed(2)
          : 100
      },
      transportFee: {
        original: currentFeeRecord.originalTransportFee || 0,
        discounted: discountedTransportFee,
        paid: transportFeePaid,
        due: transportFeeDue,
        discount: currentFeeRecord.transportFeeDiscountApplied || 0,
        discountAmount: (currentFeeRecord.originalTransportFee || 0) - discountedTransportFee,
        percentagePaid: discountedTransportFee > 0
          ? ((transportFeePaid / discountedTransportFee) * 100).toFixed(2)
          : 100
      },
      hostelFee: {
        original: currentFeeRecord.originalHostelFee || 0,
        discounted: discountedHostelFee,
        paid: hostelFeePaid,
        due: hostelFeeDue,
        discount: currentFeeRecord.hostelFeeDiscountApplied || 0,
        discountAmount: (currentFeeRecord.originalHostelFee || 0) - discountedHostelFee,
        percentagePaid: discountedHostelFee > 0
          ? ((hostelFeePaid / discountedHostelFee) * 100).toFixed(2)
          : 100
      }
    }

    // Process previous year details with correct remaining amounts
    const processedPreviousYearDetails = previousYearDetails.map(year => {
      // Calculate remaining amounts for each term
      const termPayments = {}
      let yearSchoolRemaining = 0
      let yearTransportRemaining = 0
      let yearHostelRemaining = 0
      
      if (year.termPayments) {
        // Use termPayments which is accurate
        Object.entries(year.termPayments).forEach(([termKey, termData]) => {
          if (termData.components) {
            const schoolRemaining = termData.components.schoolFee?.remaining || 0
            const transportRemaining = termData.components.transportFee?.remaining || 0
            const hostelRemaining = termData.components.hostelFee?.remaining || 0
            
            yearSchoolRemaining += schoolRemaining
            yearTransportRemaining += transportRemaining
            yearHostelRemaining += hostelRemaining
            
            termPayments[termKey] = {
              due: termData.due || 0,
              paid: termData.paid || 0,
              remaining: termData.remaining || 0,
              components: {
                schoolFee: {
                  due: termData.components.schoolFee?.due || 0,
                  paid: termData.components.schoolFee?.paid || 0,
                  remaining: schoolRemaining
                },
                transportFee: {
                  due: termData.components.transportFee?.due || 0,
                  paid: termData.components.transportFee?.paid || 0,
                  remaining: transportRemaining
                },
                hostelFee: {
                  due: termData.components.hostelFee?.due || 0,
                  paid: termData.components.hostelFee?.paid || 0,
                  remaining: hostelRemaining
                }
              }
            }
          }
        })
      } else if (year.termDistribution) {
        // Fallback to termDistribution
        Object.entries(year.termDistribution).forEach(([termNum, termData]) => {
          const schoolRemaining = Math.max(0, (termData.schoolFee || 0) - (termData.schoolFeePaid || 0))
          const transportRemaining = Math.max(0, (termData.transportFee || 0) - (termData.transportFeePaid || 0))
          const hostelRemaining = Math.max(0, (termData.hostelFee || 0) - (termData.hostelFeePaid || 0))
          const totalRemaining = schoolRemaining + transportRemaining + hostelRemaining
          
          yearSchoolRemaining += schoolRemaining
          yearTransportRemaining += transportRemaining
          yearHostelRemaining += hostelRemaining
          
          termPayments[`term${termNum}`] = {
            due: termData.total || 0,
            paid: termData.totalPaid || 0,
            remaining: totalRemaining,
            components: {
              schoolFee: {
                due: termData.schoolFee || 0,
                paid: termData.schoolFeePaid || 0,
                remaining: schoolRemaining
              },
              transportFee: {
                due: termData.transportFee || 0,
                paid: termData.transportFeePaid || 0,
                remaining: transportRemaining
              },
              hostelFee: {
                due: termData.hostelFee || 0,
                paid: termData.hostelFeePaid || 0,
                remaining: hostelRemaining
              }
            }
          }
        })
      }

      return {
        ...year,
        termPayments,
        remainingBreakdown: {
          school: yearSchoolRemaining,
          transport: yearTransportRemaining,
          hostel: yearHostelRemaining,
          total: yearSchoolRemaining + yearTransportRemaining + yearHostelRemaining
        }
      }
    })

    res.status(200).json({
      success: true,
      data: {
        studentInfo: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`.trim(),
          admissionNo: student.admissionNo,
          rollNo: student.rollNo,
          class: student.class,
          displayClass: mapEnumToDisplayName(student.class),
          section: student.section,
          studentType: student.studentType,
          usesTransport: student.isUsingSchoolTransport,
          village: student.village,
          parentName: student.parentName,
          parentPhone: student.parentPhone
        },
        previousYearDetails: processedPreviousYearDetails,
        feeBreakdown,
        termWiseBreakdown,
        termDistribution,
        summary: {
          originalTotalFee: currentFeeRecord.originalTotalFee || 0,
          discountedTotalFee,
          totalPaid,
          currentYearDue,
          previousYearFee,
          totalDue,
          totalDiscount: (currentFeeRecord.originalTotalFee || 0) - discountedTotalFee,
          overallPercentagePaid: discountedTotalFee > 0 ? ((totalPaid / discountedTotalFee) * 100).toFixed(2) : 100,
          paymentStatus: totalDue === 0 ? 'Paid' : 
                        totalDue === (discountedTotalFee + previousYearFee) ? 'Unpaid' : 'Partial',
          terms: currentFeeRecord.terms || 3
        },
        discounts: {
          studentLevel: {
            schoolFee: student.schoolFeeDiscount || 0,
            transportFee: student.transportFeeDiscount || 0,
            hostelFee: student.hostelFeeDiscount || 0
          },
          applied: {
            schoolFee: currentFeeRecord.schoolFeeDiscountApplied || 0,
            transportFee: currentFeeRecord.transportFeeDiscountApplied || 0,
            hostelFee: currentFeeRecord.hostelFeeDiscountApplied || 0
          }
        },
        createdAt: currentFeeRecord.createdAt,
        updatedAt: currentFeeRecord.updatedAt
      }
    })
  } catch (error) {
    console.error('Get student fee details error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get student fee details'
    })
  }
}

/**
 * @desc    Get payment history for a specific student
 * @route   GET /api/fee/students/:studentId/payment-history
 */
export const getStudentPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params
    const {
      startDate,
      endDate,
      paymentMode,
      termNumber,
      page = 1,
      limit = 50
    } = req.query

    const where = {
      studentId
    }

    // Date filters
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    // Payment mode filter
    if (paymentMode) {
      where.paymentMode = paymentMode.toUpperCase()
    }

    // Term filter
    if (termNumber) {
      where.termNumber = parseInt(termNumber)
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const [payments, total, student] = await Promise.all([
      prisma.paymentHistory.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.paymentHistory.count({ where }),
      prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNo: true,
          rollNo: true,
          class: true,
          section: true
        }
      })
    ])

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Calculate statistics
    const stats = {
      totalPayments: total,
      totalAmount: payments.reduce((sum, p) => sum + p.totalAmount, 0),
      totalSchoolFeePaid: payments.reduce((sum, p) => sum + p.schoolFeePaid, 0),
      totalTransportFeePaid: payments.reduce((sum, p) => sum + p.transportFeePaid, 0),
      totalHostelFeePaid: payments.reduce((sum, p) => sum + p.hostelFeePaid, 0),
      byPaymentMode: payments.reduce((acc, p) => {
        acc[p.paymentMode] = (acc[p.paymentMode] || 0) + p.totalAmount
        return acc
      }, {}),
      byTerm: {
        1: payments.filter(p => p.termNumber === 1).reduce((sum, p) => sum + p.totalAmount, 0),
        2: payments.filter(p => p.termNumber === 2).reduce((sum, p) => sum + p.totalAmount, 0),
        3: payments.filter(p => p.termNumber === 3).reduce((sum, p) => sum + p.totalAmount, 0)
      }
    }

    // Format payments with snapshot data if available
    const formattedPayments = payments.map(payment => {
      const snapshot = payment.studentDetails || {}
      
      return {
        id: payment.id,
        paymentId: payment.id,
        date: payment.date,
        receiptNo: payment.receiptNo,
        paymentMode: payment.paymentMode,
        termNumber: payment.termNumber,
        studentSnapshot: Object.keys(snapshot).length > 0 ? {
          name: snapshot.firstName && snapshot.lastName 
            ? `${snapshot.firstName} ${snapshot.lastName}`.trim()
            : null,
          class: snapshot.class,
          classLabel: snapshot.classLabel,
          section: snapshot.section,
          parentName: snapshot.parentName,
          parentPhone: snapshot.parentPhone
        } : null,
        breakdown: {
          schoolFeePaid: payment.schoolFeePaid,
          transportFeePaid: payment.transportFeePaid,
          hostelFeePaid: payment.hostelFeePaid
        },
        totalAmount: payment.totalAmount,
        description: payment.description,
        receivedBy: payment.receivedBy,
        chequeNo: payment.chequeNo,
        bankName: payment.bankName,
        transactionId: payment.transactionId,
        referenceNo: payment.referenceNo,
        receiptUrl: `/api/fee/receipt/${payment.id}`
      }
    })

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`.trim(),
          admissionNo: student.admissionNo,
          rollNo: student.rollNo,
          class: student.class,
          displayClass: mapEnumToDisplayName(student.class),
          section: student.section
        },
        payments: formattedPayments,
        statistics: stats,
        pagination: {
          current: pageNum,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        }
      }
    })
  } catch (error) {
    console.error('Get student payment history error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment history'
    })
  }
}

/**
 * @desc    Generate receipt data for a payment
 * @route   GET /api/fee/students/:studentId/receipt/:paymentId
 */
export const generateReceipt = async (req, res) => {
  try {
    const { studentId, paymentId } = req.params

    const [student, payment] = await Promise.all([
      prisma.student.findUnique({
        where: { id: studentId },
        include: {
          feeDetails: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.paymentHistory.findUnique({
        where: { id: paymentId }
      })
    ])

    if (!student || !payment) {
      return res.status(404).json({
        success: false,
        message: 'Student or payment not found'
      })
    }

    if (payment.studentId !== studentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment does not belong to this student'
      })
    }

    const feeRecord = student.feeDetails[0]
    const discountedTotalFee = feeRecord.discountedSchoolFee + feeRecord.discountedTransportFee + feeRecord.discountedHostelFee
    const termDistribution = feeRecord.termDistribution || {}

    // Parse previous year details
    const previousYearDetails = getFormattedPreviousYearDetails(feeRecord.previousYearDetails)
    const previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)

    // Get term details for this payment
    const termData = termDistribution[payment.termNumber] || {}

    // Generate receipt data
    const receiptData = {
      receiptNo: payment.receiptNo,
      date: payment.date,
      student: {
        name: `${student.firstName} ${student.lastName}`.trim(),
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        class: mapEnumToDisplayName(student.class),
        section: student.section,
        parentName: student.parentName,
        parentPhone: student.parentPhone
      },
      payment: {
        id: payment.id,
        mode: payment.paymentMode,
        termNumber: payment.termNumber,
        termDetails: {
          schoolFee: {
            due: termData.schoolFee || 0,
            paid: payment.schoolFeePaid,
            remaining: (termData.schoolFee || 0) - (termData.schoolFeePaid || 0) - payment.schoolFeePaid
          },
          transportFee: {
            due: termData.transportFee || 0,
            paid: payment.transportFeePaid,
            remaining: (termData.transportFee || 0) - (termData.transportFeePaid || 0) - payment.transportFeePaid
          },
          hostelFee: {
            due: termData.hostelFee || 0,
            paid: payment.hostelFeePaid,
            remaining: (termData.hostelFee || 0) - (termData.hostelFeePaid || 0) - payment.hostelFeePaid
          }
        },
        breakdown: {
          schoolFee: payment.schoolFeePaid,
          transportFee: payment.transportFeePaid,
          hostelFee: payment.hostelFeePaid
        },
        totalAmount: payment.totalAmount,
        description: payment.description,
        chequeNo: payment.chequeNo,
        bankName: payment.bankName,
        transactionId: payment.transactionId,
        referenceNo: payment.referenceNo,
        receivedBy: payment.receivedBy
      },
      feeSummary: {
        originalTotalFee: feeRecord.originalTotalFee,
        discountedTotalFee,
        totalPaid: feeRecord.totalPaid,
        currentYearDue: discountedTotalFee - feeRecord.totalPaid,
        previousYearFee,
        totalDue: previousYearFee + (discountedTotalFee - feeRecord.totalPaid),
        totalDiscount: feeRecord.originalTotalFee - discountedTotalFee,
        paymentStatus: (previousYearFee + (discountedTotalFee - feeRecord.totalPaid)) === 0 ? 'Paid' : 
                      (discountedTotalFee - feeRecord.totalPaid) === discountedTotalFee ? 'Unpaid' : 'Partial'
      },
      schoolInfo: {
        name: process.env.SCHOOL_NAME || 'Your School Name',
        address: process.env.SCHOOL_ADDRESS || 'School Address',
        phone: process.env.SCHOOL_PHONE || 'School Phone',
        email: process.env.SCHOOL_EMAIL || 'school@email.com',
        principal: process.env.SCHOOL_PRINCIPAL || 'Principal Name'
      },
      generatedAt: new Date(),
      isPartialPayment: (discountedTotalFee - feeRecord.totalPaid) > 0
    }

    res.status(200).json({
      success: true,
      data: receiptData
    })
  } catch (error) {
    console.error('Generate receipt error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate receipt'
    })
  }
}

// ========== STATISTICS AND REPORTS ==========

/**
 * @desc    Get fee statistics (using discounted fees)
 * @route   GET /api/fee/statistics
 */
export const getFeeStatistics = async (req, res) => {
  try {
    const { class: classFilter, section, groupBy = 'overall' } = req.query

    // Build base where clause for students
    const studentWhere = { isActive: true }
    if (classFilter && classFilter !== 'ALL' && classFilter !== 'all') {
      const classEnum = mapClassToEnum(classFilter)
      if (classEnum) studentWhere.class = classEnum
    }
    if (section && section !== 'ALL' && section !== 'all') {
      studentWhere.section = section.toUpperCase()
    }

    // Get all active students with their fee details
    const students = await prisma.student.findMany({
      where: studentWhere,
      include: {
        feeDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    // Filter students with fee records
    const studentsWithFee = students.filter(s => s.feeDetails[0])

    if (studentsWithFee.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          statistics: {},
          summary: {
            totalStudents: 0,
            totalDiscountedFee: 0,
            totalPaid: 0,
            totalDue: 0,
            collectionRate: 0
          }
        }
      })
    }

    let statistics = []

    if (groupBy === 'overall') {
      // Overall statistics using discounted fees
      let totalPreviousYearFee = 0
      let totalDiscountedFee = 0
      let totalOriginalFee = 0
      let totalPaid = 0
      
      studentsWithFee.forEach(s => {
        const fee = s.feeDetails[0]
        const previousYearDetails = getFormattedPreviousYearDetails(fee.previousYearDetails)
        const previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)
        
        totalPreviousYearFee += previousYearFee
        totalDiscountedFee += fee.discountedSchoolFee + fee.discountedTransportFee + fee.discountedHostelFee
        totalOriginalFee += fee.originalTotalFee
        totalPaid += fee.totalPaid
      })
      
      const totalCurrentYearDue = totalDiscountedFee - totalPaid
      const totalDue = totalPreviousYearFee + totalCurrentYearDue

      statistics = [{
        totalStudents: studentsWithFee.length,
        totalOriginalFee,
        totalDiscountedFee,
        totalPreviousYearFee,
        totalCurrentYearDue,
        totalDue,
        totalPaid,
        collectionRate: totalDiscountedFee > 0 ? (totalPaid / totalDiscountedFee * 100).toFixed(2) : 100,
        averageFeePerStudent: studentsWithFee.length > 0 ? totalDiscountedFee / studentsWithFee.length : 0,
        averagePaidPerStudent: studentsWithFee.length > 0 ? totalPaid / studentsWithFee.length : 0
      }]
    } else if (groupBy === 'class') {
      // Group by class
      const classGroups = {}
      
      studentsWithFee.forEach(s => {
        const className = s.class
        if (!classGroups[className]) {
          classGroups[className] = {
            class: className,
            classLabel: mapEnumToDisplayName(className),
            totalStudents: 0,
            totalOriginalFee: 0,
            totalDiscountedFee: 0,
            totalPaid: 0,
            totalPreviousYearFee: 0
          }
        }
        
        classGroups[className].totalStudents++
        const fee = s.feeDetails[0]
        const previousYearDetails = getFormattedPreviousYearDetails(fee.previousYearDetails)
        const previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)
        
        classGroups[className].totalOriginalFee += fee.originalTotalFee
        classGroups[className].totalDiscountedFee += fee.discountedSchoolFee + fee.discountedTransportFee + fee.discountedHostelFee
        classGroups[className].totalPaid += fee.totalPaid
        classGroups[className].totalPreviousYearFee += previousYearFee
      })

      statistics = Object.values(classGroups).map(c => ({
        ...c,
        totalCurrentYearDue: c.totalDiscountedFee - c.totalPaid,
        totalDue: c.totalPreviousYearFee + (c.totalDiscountedFee - c.totalPaid),
        collectionRate: c.totalDiscountedFee > 0 ? (c.totalPaid / c.totalDiscountedFee * 100).toFixed(2) : 100
      })).sort((a, b) => a.class.localeCompare(b.class))
    } else if (groupBy === 'section') {
      // Group by class and section
      const sectionGroups = {}
      
      studentsWithFee.forEach(s => {
        const key = `${s.class}-${s.section}`
        if (!sectionGroups[key]) {
          sectionGroups[key] = {
            class: s.class,
            classLabel: mapEnumToDisplayName(s.class),
            section: s.section,
            totalStudents: 0,
            totalOriginalFee: 0,
            totalDiscountedFee: 0,
            totalPaid: 0,
            totalPreviousYearFee: 0
          }
        }
        
        sectionGroups[key].totalStudents++
        const fee = s.feeDetails[0]
        const previousYearDetails = getFormattedPreviousYearDetails(fee.previousYearDetails)
        const previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)
        
        sectionGroups[key].totalOriginalFee += fee.originalTotalFee
        sectionGroups[key].totalDiscountedFee += fee.discountedSchoolFee + fee.discountedTransportFee + fee.discountedHostelFee
        sectionGroups[key].totalPaid += fee.totalPaid
        sectionGroups[key].totalPreviousYearFee += previousYearFee
      })

      statistics = Object.values(sectionGroups).map(s => ({
        ...s,
        totalCurrentYearDue: s.totalDiscountedFee - s.totalPaid,
        totalDue: s.totalPreviousYearFee + (s.totalDiscountedFee - s.totalPaid),
        collectionRate: s.totalDiscountedFee > 0 ? (s.totalPaid / s.totalDiscountedFee * 100).toFixed(2) : 100
      })).sort((a, b) => {
        if (a.class === b.class) return a.section.localeCompare(b.section)
        return a.class.localeCompare(b.class)
      })
    }

    // Get payment method distribution
    const payments = await prisma.paymentHistory.findMany({
      where: {
        student: studentWhere
      }
    })

    const paymentMethodDistribution = payments.reduce((acc, p) => {
      acc[p.paymentMode] = (acc[p.paymentMode] || 0) + p.totalAmount
      return acc
    }, {})

    res.status(200).json({
      success: true,
      data: {
        statistics,
        paymentMethodDistribution,
        summary: statistics[0] || {},
        filters: {
          class: classFilter,
          section,
          groupBy
        }
      }
    })
  } catch (error) {
    console.error('Get fee statistics error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get fee statistics'
    })
  }
}

/**
 * @desc    Get class-wise fee pending data (optimized)
 * @route   GET /api/fees/class-wise-payments
 */
export const getClassWisePayments = async (req, res) => {
  try {
    const {
      class: classFilter,
      section,
      termNumber = 1
    } = req.query

    // Build where clause for students
    const studentWhere = { isActive: true }
    
    if (classFilter && classFilter !== 'ALL') {
      const classEnum = mapClassToEnum(classFilter)
      if (classEnum) studentWhere.class = classEnum
    }
    
    if (section && section !== 'ALL') {
      studentWhere.section = section
    }

    // Get students with fee details in a single optimized query
    const students = await prisma.student.findMany({
      where: studentWhere,
      include: {
        feeDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { class: 'asc' },
        { section: 'asc' },
        { rollNo: 'asc' }
      ]
    })

    // Group by class and section
    const groupedData = {}
    
    students.forEach(student => {
      const feeRecord = student.feeDetails[0]
      if (!feeRecord) return
      
      const termDistribution = feeRecord.termDistribution || {}
      const termData = termDistribution[termNumber] || {}
      
      // Calculate pending amounts efficiently
      const termFeePending = Math.max(0, (termData.schoolFee || 0) - (termData.schoolFeePaid || 0))
      const transportPending = Math.max(0, (termData.transportFee || 0) - (termData.transportFeePaid || 0))
      const hostelPending = Math.max(0, (termData.hostelFee || 0) - (termData.hostelFeePaid || 0))
      const totalPending = termFeePending + transportPending + hostelPending
      
      if (totalPending === 0) return // Skip if no pending
      
      const key = `${student.class}-${student.section}`
      
      if (!groupedData[key]) {
        groupedData[key] = {
          class: student.class,
          classLabel: mapEnumToDisplayName(student.class),
          section: student.section,
          totalAmount: 0,
          transportFeePaid: 0,
          hostelFeePaid: 0,
          paymentCount: 0,
          students: []
        }
      }
      
      groupedData[key].totalAmount += termFeePending
      groupedData[key].transportFeePaid += transportPending
      groupedData[key].hostelFeePaid += hostelPending
      groupedData[key].paymentCount++
      
      // Store student details for detailed view
      groupedData[key].students.push({
        rollNo: student.rollNo,
        name: `${student.firstName} ${student.lastName}`.trim(),
        termFee: termFeePending,
        transportFee: transportPending,
        hostelFee: hostelPending,
        total: totalPending
      })
    })

    const classWisePayments = Object.values(groupedData).sort((a, b) => {
      if (a.class === b.class) return a.section.localeCompare(b.section)
      return a.class.localeCompare(b.class)
    })

    // Calculate summary
    const summary = {
      totalSections: classWisePayments.length,
      totalStudents: classWisePayments.reduce((sum, s) => sum + s.paymentCount, 0),
      totalAmount: classWisePayments.reduce((sum, s) => sum + s.totalAmount, 0),
      totalTransport: classWisePayments.reduce((sum, s) => sum + s.transportFeePaid, 0),
      totalHostel: classWisePayments.reduce((sum, s) => sum + s.hostelFeePaid, 0)
    }

    res.status(200).json({
      success: true,
      data: {
        classWisePayments,
        summary
      }
    })
  } catch (error) {
    console.error('Get class-wise payments error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get class-wise payments'
    })
  }
}

/**
 * @desc    Get fee collection report
 * @route   GET /api/fee/collection-report
 */
export const getFeeCollectionReport = async (req, res) => {
  try {
    const {
      reportType = 'daily',
      startDate,
      endDate,
      class: classFilter,
      section
    } = req.query

    // Set date range based on report type
    let dateRange = {}
    const now = new Date()

    if (startDate && endDate) {
      dateRange = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else {
      switch (reportType) {
        case 'daily':
          dateRange = {
            gte: new Date(now.setHours(0, 0, 0, 0)),
            lte: new Date(now.setHours(23, 59, 59, 999))
          }
          break
        case 'weekly':
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay())
          weekStart.setHours(0, 0, 0, 0)
          dateRange = {
            gte: weekStart,
            lte: new Date(now.setHours(23, 59, 59, 999))
          }
          break
        case 'monthly':
          dateRange = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          }
          break
        case 'yearly':
          dateRange = {
            gte: new Date(now.getFullYear(), 0, 1),
            lte: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
          }
          break
      }
    }

    // Build student filter
    const studentWhere = { isActive: true }
    if (classFilter && classFilter !== 'ALL' && classFilter !== 'all') {
      const classEnum = mapClassToEnum(classFilter)
      if (classEnum) studentWhere.class = classEnum
    }
    if (section && section !== 'ALL' && section !== 'all') {
      studentWhere.section = section.toUpperCase()
    }

    // Get payments within date range
    const payments = await prisma.paymentHistory.findMany({
      where: {
        date: dateRange,
        student: studentWhere
      },
      include: {
        student: {
          select: {
            class: true,
            section: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    // Group by date based on report type
    const groupedData = {}

    payments.forEach(payment => {
      let key
      const date = new Date(payment.date)

      switch (reportType) {
        case 'daily':
          key = date.toISOString().split('T')[0]
          break
        case 'weekly':
          const weekNum = Math.ceil(date.getDate() / 7)
          key = `${date.getFullYear()}-W${weekNum}`
          break
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'yearly':
          key = `${date.getFullYear()}`
          break
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          period: key,
          date: payment.date,
          totalPayments: 0,
          totalAmount: 0,
          schoolFeePaid: 0,
          transportFeePaid: 0,
          hostelFeePaid: 0,
          paymentCount: 0,
          paymentMethods: {}
        }
      }

      groupedData[key].totalPayments++
      groupedData[key].totalAmount += payment.totalAmount
      groupedData[key].schoolFeePaid += payment.schoolFeePaid
      groupedData[key].transportFeePaid += payment.transportFeePaid
      groupedData[key].hostelFeePaid += payment.hostelFeePaid
      groupedData[key].paymentCount++
      groupedData[key].paymentMethods[payment.paymentMode] = 
        (groupedData[key].paymentMethods[payment.paymentMode] || 0) + payment.totalAmount
    })

    const reportData = Object.values(groupedData).sort((a, b) => b.period.localeCompare(a.period))

    // Calculate summary
    const summary = {
      totalCollections: reportData.reduce((sum, item) => sum + item.totalAmount, 0),
      totalTransactions: reportData.reduce((sum, item) => sum + item.totalPayments, 0),
      averageTransactionValue: reportData.reduce((sum, item) => sum + item.totalAmount, 0) / 
                              (reportData.reduce((sum, item) => sum + item.totalPayments, 0) || 1),
      periodCount: reportData.length
    }

    res.status(200).json({
      success: true,
      data: {
        reportType,
        dateRange,
        reportData,
        summary,
        filters: {
          class: classFilter,
          section
        }
      }
    })
  } catch (error) {
    console.error('Get fee collection report error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate fee collection report'
    })
  }
}

/**
 * @desc    Get fee defaulters list (based on discounted fees)
 * @route   GET /api/fee/defaulters
 */
export const getFeeDefaulters = async (req, res) => {
  try {
    const {
      class: classFilter,
      section,
      minDueAmount = 100,
      page = 1,
      limit = 50,
      sortBy = 'totalDue',
      sortOrder = 'desc'
    } = req.query

    // Build student where clause
    const studentWhere = { isActive: true }
    
    if (classFilter && classFilter !== 'ALL' && classFilter !== 'all') {
      const classEnum = mapClassToEnum(classFilter)
      if (classEnum) studentWhere.class = classEnum
    }
    
    if (section && section !== 'ALL' && section !== 'all') {
      studentWhere.section = section.toUpperCase()
    }

    // Get students with fee details that have due amount > minDueAmount
    const students = await prisma.student.findMany({
      where: studentWhere,
      include: {
        feeDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    // Filter students that have fee details with due amount
    const defaulters = students
      .filter(s => s.feeDetails[0])
      .map(s => {
        const fee = s.feeDetails[0]
        const discountedTotalFee = fee.discountedSchoolFee + fee.discountedTransportFee + fee.discountedHostelFee
        const totalDiscount = fee.originalTotalFee - discountedTotalFee
        
        // Parse previous year details
        const previousYearDetails = getFormattedPreviousYearDetails(fee.previousYearDetails)
        const previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)
        
        const currentYearDue = discountedTotalFee - fee.totalPaid
        const totalDue = previousYearFee + currentYearDue
        
        const termDistribution = fee.termDistribution || {}
        
        return {
          id: s.id,
          name: `${s.firstName} ${s.lastName}`.trim(),
          admissionNo: s.admissionNo,
          rollNo: s.rollNo,
          class: s.class,
          displayClass: mapEnumToDisplayName(s.class),
          section: s.section,
          studentType: s.studentType,
          village: s.village,
          parentPhone: s.parentPhone,
          discounts: {
            schoolFee: s.schoolFeeDiscount,
            transportFee: s.transportFeeDiscount,
            hostelFee: s.hostelFeeDiscount
          },
          dueDetails: {
            originalTotalFee: fee.originalTotalFee,
            discountedTotalFee,
            totalDiscount,
            totalPaid: fee.totalPaid,
            previousYearFee,
            currentYearDue,
            totalDue,
            schoolFeeDue: Math.max(0, fee.discountedSchoolFee - fee.schoolFeePaid),
            transportFeeDue: Math.max(0, fee.discountedTransportFee - fee.transportFeePaid),
            hostelFeeDue: Math.max(0, fee.discountedHostelFee - fee.hostelFeePaid),
            term1Due: termDistribution[1]?.total || 0,
            term2Due: termDistribution[2]?.total || 0,
            term3Due: termDistribution[3]?.total || 0,
            term1Paid: termDistribution[1]?.totalPaid || 0,
            term2Paid: termDistribution[2]?.totalPaid || 0,
            term3Paid: termDistribution[3]?.totalPaid || 0,
            term1Remaining: (termDistribution[1]?.total || 0) - (termDistribution[1]?.totalPaid || 0),
            term2Remaining: (termDistribution[2]?.total || 0) - (termDistribution[2]?.totalPaid || 0),
            term3Remaining: (termDistribution[3]?.total || 0) - (termDistribution[3]?.totalPaid || 0),
            percentagePaid: discountedTotalFee > 0 ? ((fee.totalPaid / discountedTotalFee) * 100).toFixed(2) : 0,
            discountPercentage: fee.originalTotalFee > 0 ? ((totalDiscount / fee.originalTotalFee) * 100).toFixed(2) : 0,
            isFullyPaid: fee.isFullyPaid
          }
        }
      })
      .filter(d => d.dueDetails.totalDue > parseInt(minDueAmount))

    // Sort defaulters
    defaulters.sort((a, b) => {
      if (sortBy === 'totalDue') {
        return sortOrder === 'desc' 
          ? b.dueDetails.totalDue - a.dueDetails.totalDue
          : a.dueDetails.totalDue - b.dueDetails.totalDue
      }
      if (sortBy === 'name') {
        return sortOrder === 'desc'
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name)
      }
      if (sortBy === 'discount') {
        return sortOrder === 'desc'
          ? b.dueDetails.discountPercentage - a.dueDetails.discountPercentage
          : a.dueDetails.discountPercentage - b.dueDetails.discountPercentage
      }
      return 0
    })

    // Paginate
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = pageNum * limitNum
    const paginatedDefaulters = defaulters.slice(startIndex, endIndex)

    // Calculate summary statistics
    const summary = {
      totalDefaulters: defaulters.length,
      totalDueAmount: defaulters.reduce((sum, d) => sum + d.dueDetails.totalDue, 0),
      totalOriginalFee: defaulters.reduce((sum, d) => sum + d.dueDetails.originalTotalFee, 0),
      totalDiscountedFee: defaulters.reduce((sum, d) => sum + d.dueDetails.discountedTotalFee, 0),
      totalDiscount: defaulters.reduce((sum, d) => sum + d.dueDetails.totalDiscount, 0),
      totalPreviousYearFee: defaulters.reduce((sum, d) => sum + d.dueDetails.previousYearFee, 0),
      totalCurrentYearDue: defaulters.reduce((sum, d) => sum + d.dueDetails.currentYearDue, 0),
      averageDueAmount: defaulters.length > 0 
        ? defaulters.reduce((sum, d) => sum + d.dueDetails.totalDue, 0) / defaulters.length 
        : 0,
      byClass: defaulters.reduce((acc, d) => {
        const className = d.displayClass
        if (!acc[className]) {
          acc[className] = { count: 0, totalDue: 0, totalDiscount: 0 }
        }
        acc[className].count++
        acc[className].totalDue += d.dueDetails.totalDue
        acc[className].totalDiscount += d.dueDetails.totalDiscount
        return acc
      }, {}),
      byStudentType: defaulters.reduce((acc, d) => {
        const type = d.studentType
        if (!acc[type]) {
          acc[type] = { count: 0, totalDue: 0, totalDiscount: 0 }
        }
        acc[type].count++
        acc[type].totalDue += d.dueDetails.totalDue
        acc[type].totalDiscount += d.dueDetails.totalDiscount
        return acc
      }, {})
    }

    res.status(200).json({
      success: true,
      count: paginatedDefaulters.length,
      total: defaulters.length,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(defaulters.length / limitNum),
        hasNext: endIndex < defaulters.length,
        hasPrev: pageNum > 1
      },
      data: paginatedDefaulters,
      summary,
      filters: {
        class: classFilter,
        section,
        minDueAmount: parseInt(minDueAmount)
      }
    })
  } catch (error) {
    console.error('Get fee defaulters error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get fee defaulters'
    })
  }
}

/**
 * @desc    Get all payment history with date range, class, and section filters only
 * @route   GET /api/fee/payment-history
 */
export const getAllPaymentHistory = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      class: classFilter,
      section,
      page = 1,
      limit = 50
    } = req.query

    // Build where clause
    const where = {}

    // Date range filter
    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        const startDateTime = new Date(startDate)
        startDateTime.setHours(0, 0, 0, 0)
        where.date.gte = startDateTime
      }
      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        where.date.lte = endDateTime
      }
    }

    // Class and section filters (through student relation)
    const studentWhere = {}
    
    if (classFilter && classFilter !== 'ALL' && classFilter !== 'all') {
      const classEnum = mapClassToEnum(classFilter)
      if (classEnum) studentWhere.class = classEnum
    }
    
    if (section && section !== 'ALL' && section !== 'all') {
      studentWhere.section = section
    }

    // If class or section filters are provided, add student condition
    if (Object.keys(studentWhere).length > 0) {
      where.student = studentWhere
    }

    // Pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Execute query with student details
    const [payments, total] = await Promise.all([
      prisma.paymentHistory.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
              rollNo: true,
              class: true,
              section: true,
              parentName: true,
              parentPhone: true,
              village: true,
              studentType: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.paymentHistory.count({ where })
    ])

    // Format payments with student details - prioritize snapshot data if available
    const formattedPayments = payments.map(payment => {
      // Use snapshot data if available, otherwise use current student data
      const studentSnapshot = payment.studentDetails || {}
      
      return {
        id: payment.id,
        receiptNo: payment.receiptNo,
        date: payment.date,
        paymentMode: payment.paymentMode,
        termNumber: payment.termNumber,
        breakdown: {
          schoolFeePaid: payment.schoolFeePaid,
          transportFeePaid: payment.transportFeePaid,
          hostelFeePaid: payment.hostelFeePaid
        },
        totalAmount: payment.totalAmount,
        description: payment.description,
        chequeNo: payment.chequeNo,
        bankName: payment.bankName,
        transactionId: payment.transactionId,
        referenceNo: payment.referenceNo,
        receivedBy: payment.receivedBy,
        student: {
          id: payment.student?.id,
          name: studentSnapshot.firstName && studentSnapshot.lastName 
            ? `${studentSnapshot.firstName} ${studentSnapshot.lastName}`.trim()
            : payment.student 
              ? `${payment.student.firstName} ${payment.student.lastName}`.trim()
              : 'Unknown',
          admissionNo: studentSnapshot.admissionNo || payment.student?.admissionNo || 'N/A',
          rollNo: payment.student?.rollNo || 'N/A',
          class: studentSnapshot.class || payment.student?.class,
          displayClass: studentSnapshot.classLabel || mapEnumToDisplayName(payment.student?.class),
          section: studentSnapshot.section || payment.student?.section || '',
          parentName: studentSnapshot.parentName || payment.student?.parentName || '',
          parentPhone: studentSnapshot.parentPhone || payment.student?.parentPhone || '',
          village: payment.student?.village || '',
          studentType: payment.student?.studentType || '',
          // Indicate if this is historical data
          isHistoricalData: !!studentSnapshot.firstName
        },
        receiptUrl: `/api/fee/receipt/${payment.id}`
      }
    })

    // Calculate summary statistics for the filtered payments
    const summary = {
      totalPayments: total,
      totalAmount: formattedPayments.reduce((sum, p) => sum + p.totalAmount, 0),
      totalSchoolFee: formattedPayments.reduce((sum, p) => sum + p.breakdown.schoolFeePaid, 0),
      totalTransportFee: formattedPayments.reduce((sum, p) => sum + p.breakdown.transportFeePaid, 0),
      totalHostelFee: formattedPayments.reduce((sum, p) => sum + p.breakdown.hostelFeePaid, 0),
      averageAmount: total > 0 
        ? formattedPayments.reduce((sum, p) => sum + p.totalAmount, 0) / total 
        : 0,
      byPaymentMode: formattedPayments.reduce((acc, p) => {
        acc[p.paymentMode] = (acc[p.paymentMode] || 0) + p.totalAmount
        return acc
      }, {}),
      byTerm: {
        term1: formattedPayments.filter(p => p.termNumber === 1).reduce((sum, p) => sum + p.totalAmount, 0),
        term2: formattedPayments.filter(p => p.termNumber === 2).reduce((sum, p) => sum + p.totalAmount, 0),
        term3: formattedPayments.filter(p => p.termNumber === 3).reduce((sum, p) => sum + p.totalAmount, 0)
      }
    }

    res.status(200).json({
      success: true,
      count: formattedPayments.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
        limit: limitNum
      },
      data: formattedPayments,
      summary,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        class: classFilter || null,
        section: section || null
      }
    })
  } catch (error) {
    console.error('Get all payment history error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment history'
    })
  }
}

/**
 * @desc    Get class-wise fee pending report for a specific term including previous year fees
 * @route   GET /api/fees/class-wise-pending
 */
export const getClassWiseFeePending = async (req, res) => {
  try {
    const {
      class: classFilter,
      section,
      termNumber = 1,
      includePreviousYear = 'true'
    } = req.query

    // Validate term number
    const termNum = parseInt(termNumber)
    if (termNum < 1 || termNum > 3) {
      return res.status(400).json({
        success: false,
        message: 'Term number must be between 1 and 3'
      })
    }

    const includePreviousYearBool = includePreviousYear === 'true'

    // Build where clause for students
    const studentWhere = { isActive: true }
    
    if (classFilter && classFilter !== 'ALL') {
      const classEnum = mapClassToEnum(classFilter)
      if (classEnum) studentWhere.class = classEnum
    }
    
    if (section && section !== 'ALL') {
      studentWhere.section = section
    }

    // Get all active students with their latest fee details
    const students = await prisma.student.findMany({
      where: studentWhere,
      include: {
        feeDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { class: 'asc' },
        { section: 'asc' },
        { rollNo: 'asc' }
      ]
    })

    // Process students to extract term-specific pending fees and previous year fees
    const classWiseData = []
    const summary = {
      totalStudents: 0,
      totalWithFees: 0,
      totalTerm1Pending: 0,
      totalTerm2Pending: 0,
      totalTerm3Pending: 0,
      totalPreviousYearPending: 0,
      totalPending: 0
    }

    students.forEach(student => {
      const feeRecord = student.feeDetails[0]
      if (!feeRecord) return // Skip if no fee record

      // Parse previous year details
      const previousYearDetails = getFormattedPreviousYearDetails(feeRecord.previousYearDetails)
      const previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)

      // Parse term distribution
      const termDistribution = feeRecord.termDistribution || {}
      
      // Calculate pending amounts for each term (combined total of school + transport + hostel)
      const term1Pending = Math.max(0, (termDistribution[1]?.total || 0) - (termDistribution[1]?.totalPaid || 0))
      const term2Pending = Math.max(0, (termDistribution[2]?.total || 0) - (termDistribution[2]?.totalPaid || 0))
      const term3Pending = Math.max(0, (termDistribution[3]?.total || 0) - (termDistribution[3]?.totalPaid || 0))
      
      // Calculate total pending including previous year
      const totalPending = term1Pending + term2Pending + term3Pending + previousYearFee

      // Create student object with all fee components
      const studentData = {
        rollNo: student.rollNo || 'N/A',
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        admissionNo: student.admissionNo,
        class: student.class,
        classLabel: mapEnumToDisplayName(student.class),
        section: student.section,
        term1Pending,
        term2Pending,
        term3Pending,
        previousYearFee,
        totalPending
      }

      classWiseData.push(studentData)

      // Update summary counts
      summary.totalStudents++
      if (totalPending > 0) {
        summary.totalWithFees++
        summary.totalTerm1Pending += term1Pending
        summary.totalTerm2Pending += term2Pending
        summary.totalTerm3Pending += term3Pending
        summary.totalPreviousYearPending += previousYearFee
        summary.totalPending += totalPending
      }
    })

    // Group by class and section for easier consumption
    const groupedByClassSection = {}
    classWiseData.forEach(student => {
      const key = `${student.classLabel}-${student.section}`
      if (!groupedByClassSection[key]) {
        groupedByClassSection[key] = {
          class: student.class,
          classLabel: student.classLabel,
          section: student.section,
          students: [],
          summary: {
            totalStudents: 0,
            totalWithPending: 0,
            totalTerm1Pending: 0,
            totalTerm2Pending: 0,
            totalTerm3Pending: 0,
            totalPreviousYearPending: 0,
            totalPending: 0
          }
        }
      }

      groupedByClassSection[key].students.push(student)
      groupedByClassSection[key].summary.totalStudents++

      if (student.totalPending > 0) {
        groupedByClassSection[key].summary.totalWithPending++
        groupedByClassSection[key].summary.totalTerm1Pending += student.term1Pending || 0
        groupedByClassSection[key].summary.totalTerm2Pending += student.term2Pending || 0
        groupedByClassSection[key].summary.totalTerm3Pending += student.term3Pending || 0
        groupedByClassSection[key].summary.totalPreviousYearPending += student.previousYearFee || 0
        groupedByClassSection[key].summary.totalPending += student.totalPending
      }
    })

    // Convert grouped object to array and sort by class and section
    const groupedResult = Object.values(groupedByClassSection).sort((a, b) => {
      if (a.class === b.class) {
        return a.section.localeCompare(b.section)
      }
      return a.class.localeCompare(b.class)
    })

    res.status(200).json({
      success: true,
      data: {
        term: termNum,
        filters: {
          class: classFilter || 'ALL',
          section: section || 'ALL',
          includePreviousYear: includePreviousYearBool
        },
        summary: {
          totalStudents: summary.totalStudents,
          studentsWithPendingFees: summary.totalWithFees,
          totalTerm1Pending: summary.totalTerm1Pending,
          totalTerm2Pending: summary.totalTerm2Pending,
          totalTerm3Pending: summary.totalTerm3Pending,
          totalPreviousYearPending: summary.totalPreviousYearPending,
          totalPendingAmount: summary.totalPending,
          breakdown: {
            term1: summary.totalTerm1Pending,
            term2: summary.totalTerm2Pending,
            term3: summary.totalTerm3Pending,
            previousYear: summary.totalPreviousYearPending
          }
        },
        classWiseBreakdown: groupedResult,
        allStudents: classWiseData
      }
    })
  } catch (error) {
    console.error('Get class-wise fee pending error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get class-wise fee pending'
    })
  }
}

/**
 * @desc    Process a payment for a student
 * @route   POST /api/fee/students/:studentId/process-payment
 */
export const processPayment = async (req, res) => {
  try {
    const { studentId } = req.params
    const {
      schoolFeePaid = 0,
      transportFeePaid = 0,
      hostelFeePaid = 0,
      paymentMode = 'CASH',
      description = '',
      chequeNo,
      bankName,
      transactionId,
      referenceNo,
      termNumber: providedTermNumber,
      receiptNo: customReceiptNo,
      receivedBy,
      paymentType,
      previousYearIndex,
    } = req.body

    if (!receivedBy) {
      return res.status(400).json({
        success: false,
        message: 'Received by is required'
      })
    }

    const totalAmount = schoolFeePaid + transportFeePaid + hostelFeePaid
    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        feeDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    const studentDetailsSnapshot = getStudentDetailsSnapshot(student)

    const feeRecord = student.feeDetails[0]
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Fee details not found for this student'
      })
    }

    let previousYearDetails = getFormattedPreviousYearDetails(feeRecord.previousYearDetails)
    let previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)

    const discountedSchoolFee = feeRecord.discountedSchoolFee || 0
    const discountedTransportFee = feeRecord.discountedTransportFee || 0
    const discountedHostelFee = feeRecord.discountedHostelFee || 0
    const discountedTotalFee = discountedSchoolFee + discountedTransportFee + discountedHostelFee
    
    const currentYearPaidSchool = feeRecord.schoolFeePaid || 0
    const currentYearPaidTransport = feeRecord.transportFeePaid || 0
    const currentYearPaidHostel = feeRecord.hostelFeePaid || 0
    
    const currentYearDueSchool = discountedSchoolFee - currentYearPaidSchool
    const currentYearDueTransport = discountedTransportFee - currentYearPaidTransport
    const currentYearDueHostel = discountedHostelFee - currentYearPaidHostel
    const currentYearDue = currentYearDueSchool + currentYearDueTransport + currentYearDueHostel
    
    const totalDue = previousYearFee + currentYearDue

    const previousYearFeeBeforePayment = previousYearFee
    const currentYearDueBeforePayment = currentYearDue

    // ========== PREVIOUS YEAR PAYMENT (Single Year) - FIXED ==========
    if (paymentType === 'previousYear' && previousYearIndex !== undefined) {
      if (previousYearIndex < 0 || previousYearIndex >= previousYearDetails.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid previous year index'
        })
      }

      // Deep clone the year record
      const yearRecord = JSON.parse(JSON.stringify(previousYearDetails[previousYearIndex]))
      
      // Validate that the payment amounts don't exceed what's due for each component
      if (schoolFeePaid > (yearRecord.remainingBreakdown?.school || 0)) {
        return res.status(400).json({
          success: false,
          message: `School fee payment (${schoolFeePaid}) exceeds due amount (${yearRecord.remainingBreakdown?.school || 0}) for ${yearRecord.academicYear}`
        })
      }
      if (transportFeePaid > (yearRecord.remainingBreakdown?.transport || 0)) {
        return res.status(400).json({
          success: false,
          message: `Transport fee payment (${transportFeePaid}) exceeds due amount (${yearRecord.remainingBreakdown?.transport || 0}) for ${yearRecord.academicYear}`
        })
      }
      if (hostelFeePaid > (yearRecord.remainingBreakdown?.hostel || 0)) {
        return res.status(400).json({
          success: false,
          message: `Hostel fee payment (${hostelFeePaid}) exceeds due amount (${yearRecord.remainingBreakdown?.hostel || 0}) for ${yearRecord.academicYear}`
        })
      }

      // Keep track of original payment amounts - these are EXACTLY what the user paid
      const originalSchoolPaid = schoolFeePaid
      const originalTransportPaid = transportFeePaid
      const originalHostelPaid = hostelFeePaid

      // Track remaining amounts to allocate
      let remainingSchool = schoolFeePaid
      let remainingTransport = transportFeePaid
      let remainingHostel = hostelFeePaid

      console.log('Starting previous year payment distribution:', {
        academicYear: yearRecord.academicYear,
        schoolPayment: originalSchoolPaid,
        transportPayment: originalTransportPaid,
        hostelPayment: originalHostelPaid,
        totalPayment: totalAmount
      })

      // Process payments by component type (school, transport, hostel)
      // Each component's payment should ONLY be applied to that component's outstanding amounts
      
      if (yearRecord.termPayments) {
        // Process terms in order (term1, term2, term3) - oldest first
        const termOrder = ['term1', 'term2', 'term3']
        
        for (const termKey of termOrder) {
          const termData = yearRecord.termPayments[termKey]
          if (!termData) continue
          
          // Process SCHOOL fee for this term - ONLY if we have school payment remaining
          if (remainingSchool > 0 && termData.components?.schoolFee?.remaining > 0) {
            const schoolPayment = Math.min(remainingSchool, termData.components.schoolFee.remaining)
            termData.components.schoolFee.paid = (termData.components.schoolFee.paid || 0) + schoolPayment
            termData.components.schoolFee.remaining = termData.components.schoolFee.due - termData.components.schoolFee.paid
            remainingSchool -= schoolPayment
            console.log(`Applied ${schoolPayment} school fee to ${termKey}`)
          }
          
          // Process TRANSPORT fee for this term - ONLY if we have transport payment remaining
          if (remainingTransport > 0 && termData.components?.transportFee?.remaining > 0) {
            const transportPayment = Math.min(remainingTransport, termData.components.transportFee.remaining)
            termData.components.transportFee.paid = (termData.components.transportFee.paid || 0) + transportPayment
            termData.components.transportFee.remaining = termData.components.transportFee.due - termData.components.transportFee.paid
            remainingTransport -= transportPayment
            console.log(`Applied ${transportPayment} transport fee to ${termKey}`)
          }
          
          // Process HOSTEL fee for this term - ONLY if we have hostel payment remaining
          if (remainingHostel > 0 && termData.components?.hostelFee?.remaining > 0) {
            const hostelPayment = Math.min(remainingHostel, termData.components.hostelFee.remaining)
            termData.components.hostelFee.paid = (termData.components.hostelFee.paid || 0) + hostelPayment
            termData.components.hostelFee.remaining = termData.components.hostelFee.due - termData.components.hostelFee.paid
            remainingHostel -= hostelPayment
            console.log(`Applied ${hostelPayment} hostel fee to ${termKey}`)
          }
          
          // Recalculate term totals based on components
          const termComponents = termData.components
          termData.paid = (termComponents.schoolFee?.paid || 0) + 
                          (termComponents.transportFee?.paid || 0) + 
                          (termComponents.hostelFee?.paid || 0)
          termData.remaining = termData.due - termData.paid
        }
        
        // If there's any remaining payment that couldn't be allocated (shouldn't happen if validation passed)
        if (remainingSchool > 0 || remainingTransport > 0 || remainingHostel > 0) {
          console.warn('Unallocated payment remaining:', { remainingSchool, remainingTransport, remainingHostel })
        }
      } else if (yearRecord.termDistribution) {
        // Fallback to termDistribution if termPayments doesn't exist
        const termNumbers = [1, 2, 3]
        
        for (const termNum of termNumbers) {
          const termData = yearRecord.termDistribution[termNum]
          if (!termData) continue
          
          // Process SCHOOL fee - ONLY if we have school payment remaining
          if (remainingSchool > 0) {
            const termSchoolRemaining = Math.max(0, (termData.schoolFee || 0) - (termData.schoolFeePaid || 0))
            if (termSchoolRemaining > 0) {
              const schoolPayment = Math.min(remainingSchool, termSchoolRemaining)
              termData.schoolFeePaid = (termData.schoolFeePaid || 0) + schoolPayment
              remainingSchool -= schoolPayment
            }
          }
          
          // Process TRANSPORT fee - ONLY if we have transport payment remaining
          if (remainingTransport > 0) {
            const termTransportRemaining = Math.max(0, (termData.transportFee || 0) - (termData.transportFeePaid || 0))
            if (termTransportRemaining > 0) {
              const transportPayment = Math.min(remainingTransport, termTransportRemaining)
              termData.transportFeePaid = (termData.transportFeePaid || 0) + transportPayment
              remainingTransport -= transportPayment
            }
          }
          
          // Process HOSTEL fee - ONLY if we have hostel payment remaining
          if (remainingHostel > 0) {
            const termHostelRemaining = Math.max(0, (termData.hostelFee || 0) - (termData.hostelFeePaid || 0))
            if (termHostelRemaining > 0) {
              const hostelPayment = Math.min(remainingHostel, termHostelRemaining)
              termData.hostelFeePaid = (termData.hostelFeePaid || 0) + hostelPayment
              remainingHostel -= hostelPayment
            }
          }
          
          // Recalculate term totals
          termData.totalPaid = (termData.schoolFeePaid || 0) + (termData.transportFeePaid || 0) + (termData.hostelFeePaid || 0)
          
          // Update status
          if (termData.totalPaid >= termData.total) {
            termData.status = 'Paid'
          } else if (termData.totalPaid > 0) {
            termData.status = 'Partial'
          } else {
            termData.status = 'Unpaid'
          }
        }
        
        // Rebuild termPayments from termDistribution
        if (!yearRecord.termPayments) {
          yearRecord.termPayments = {}
          for (const termNum of termNumbers) {
            const termData = yearRecord.termDistribution[termNum]
            if (termData) {
              const schoolDue = termData.schoolFee || 0
              const transportDue = termData.transportFee || 0
              const hostelDue = termData.hostelFee || 0
              const totalDue = schoolDue + transportDue + hostelDue
              
              const schoolPaid = termData.schoolFeePaid || 0
              const transportPaid = termData.transportFeePaid || 0
              const hostelPaid = termData.hostelFeePaid || 0
              const totalPaid = schoolPaid + transportPaid + hostelPaid
              
              yearRecord.termPayments[`term${termNum}`] = {
                due: totalDue,
                paid: totalPaid,
                remaining: totalDue - totalPaid,
                components: {
                  schoolFee: {
                    due: schoolDue,
                    paid: schoolPaid,
                    remaining: schoolDue - schoolPaid
                  },
                  transportFee: {
                    due: transportDue,
                    paid: transportPaid,
                    remaining: transportDue - transportPaid
                  },
                  hostelFee: {
                    due: hostelDue,
                    paid: hostelPaid,
                    remaining: hostelDue - hostelPaid
                  }
                }
              }
            }
          }
        }
      }

      // Update year totals - these are the exact amounts paid
      yearRecord.totalPaid = (yearRecord.totalPaid || 0) + totalAmount
      yearRecord.totalDue = Math.max(0, (yearRecord.totalDue || 0) - totalAmount)
      yearRecord.isFullyPaid = yearRecord.totalDue === 0

      // Recalculate remainingBreakdown - SUM BY COMPONENT TYPE
      let yearSchoolRemaining = 0
      let yearTransportRemaining = 0
      let yearHostelRemaining = 0
      
      if (yearRecord.termPayments) {
        Object.values(yearRecord.termPayments).forEach(term => {
          if (term.components) {
            yearSchoolRemaining += term.components.schoolFee?.remaining || 0
            yearTransportRemaining += term.components.transportFee?.remaining || 0
            yearHostelRemaining += term.components.hostelFee?.remaining || 0
          }
        })
      }
      
      yearRecord.remainingBreakdown = {
        school: yearSchoolRemaining,
        transport: yearTransportRemaining,
        hostel: yearHostelRemaining,
        total: yearSchoolRemaining + yearTransportRemaining + yearHostelRemaining
      }

      // Update the previous year details array
      previousYearDetails[previousYearIndex] = yearRecord
      previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)

      console.log('After Payment - Final State:', {
        academicYear: yearRecord.academicYear,
        schoolPaid: originalSchoolPaid,
        transportPaid: originalTransportPaid,
        hostelPaid: originalHostelPaid,
        schoolRemaining: yearSchoolRemaining,
        transportRemaining: yearTransportRemaining,
        hostelRemaining: yearHostelRemaining,
        totalRemaining: yearRecord.totalDue
      })

      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.paymentHistory.create({
          data: {
            studentId,
            studentDetails: studentDetailsSnapshot,
            date: new Date(),
            schoolFeePaid: originalSchoolPaid,
            transportFeePaid: originalTransportPaid,
            hostelFeePaid: originalHostelPaid,
            totalAmount,
            receiptNo: customReceiptNo || generateReceiptNo(),
            paymentMode,
            description: description || `Payment for ${yearRecord.academicYear}`,
            chequeNo,
            bankName,
            transactionId,
            referenceNo,
            termNumber: null,
            receivedBy,
            metadata: {
              paymentType: 'previousYear',
              academicYear: yearRecord.academicYear,
              previousYearIndex,
              previousYearBreakdown: {
                school: originalSchoolPaid,
                transport: originalTransportPaid,
                hostel: originalHostelPaid,
                total: totalAmount
              },
              remainingAfterPayment: {
                school: yearSchoolRemaining,
                transport: yearTransportRemaining,
                hostel: yearHostelRemaining,
                total: yearRecord.totalDue
              }
            }
          }
        })

        const updatedFeeRecord = await tx.feeDetails.update({
          where: { id: feeRecord.id },
          data: {
            previousYearDetails: previousYearDetails,
            previousYearFee: previousYearFee,
            totalDue: previousYearFee + currentYearDue,
            updatedBy: receivedBy
          }
        })

        return { payment, updatedFeeRecord }
      })

      return res.status(201).json({
        success: true,
        message: 'Previous year payment processed successfully',
        data: {
          paymentId: result.payment.id,
          receiptNo: result.payment.receiptNo,
          date: result.payment.date,
          totalAmount: result.payment.totalAmount,
          previousYearBreakdown: {
            school: originalSchoolPaid,
            transport: originalTransportPaid,
            hostel: originalHostelPaid,
            total: totalAmount
          },
          paymentType: 'previousYear',
          academicYear: yearRecord.academicYear,
          receiptUrl: `/api/fee/receipt/${result.payment.id}`,
          remainingAfterPayment: {
            school: yearSchoolRemaining,
            transport: yearTransportRemaining,
            hostel: yearHostelRemaining,
            total: yearRecord.totalDue
          }
        }
      })
    }

    // ========== ALL PREVIOUS YEARS PAYMENT - FIXED ==========
    if (paymentType === 'allPreviousYears') {
      if (totalAmount > previousYearFee) {
        return res.status(400).json({
          success: false,
          message: `Payment amount (${totalAmount}) exceeds total previous years due (${previousYearFee})`
        })
      }

      // Track exactly what was paid for each component
      let remainingSchoolToAllocate = schoolFeePaid
      let remainingTransportToAllocate = transportFeePaid
      let remainingHostelToAllocate = hostelFeePaid
      
      const originalSchoolPaid = schoolFeePaid
      const originalTransportPaid = transportFeePaid
      const originalHostelPaid = hostelFeePaid

      const updatedPreviousYears = []
      const distributionLog = []

      // Distribute payment across previous years (oldest first) - but keep components separate
      for (let i = 0; i < previousYearDetails.length; i++) {
        if (remainingSchoolToAllocate === 0 && remainingTransportToAllocate === 0 && remainingHostelToAllocate === 0) {
          updatedPreviousYears.push(previousYearDetails[i])
          continue
        }
        
        const yearRecord = JSON.parse(JSON.stringify(previousYearDetails[i]))
        
        // Skip fully paid years
        if (yearRecord.totalDue <= 0) {
          updatedPreviousYears.push(yearRecord)
          continue
        }

        // Calculate how much of each component is due for this year
        let yearSchoolDue = 0
        let yearTransportDue = 0
        let yearHostelDue = 0
        
        if (yearRecord.remainingBreakdown) {
          yearSchoolDue = yearRecord.remainingBreakdown.school || 0
          yearTransportDue = yearRecord.remainingBreakdown.transport || 0
          yearHostelDue = yearRecord.remainingBreakdown.hostel || 0
        } else if (yearRecord.termPayments) {
          Object.values(yearRecord.termPayments).forEach(term => {
            if (term.components) {
              yearSchoolDue += term.components.schoolFee?.remaining || 0
              yearTransportDue += term.components.transportFee?.remaining || 0
              yearHostelDue += term.components.hostelFee?.remaining || 0
            }
          })
        }

        // Calculate how much to pay for each component for THIS YEAR ONLY
        // School payments ONLY go to school dues, transport ONLY to transport, etc.
        const yearSchoolPaid = Math.min(remainingSchoolToAllocate, yearSchoolDue)
        const yearTransportPaid = Math.min(remainingTransportToAllocate, yearTransportDue)
        const yearHostelPaid = Math.min(remainingHostelToAllocate, yearHostelDue)
        const yearTotalPaid = yearSchoolPaid + yearTransportPaid + yearHostelPaid

        // Update remaining amounts to allocate
        remainingSchoolToAllocate -= yearSchoolPaid
        remainingTransportToAllocate -= yearTransportPaid
        remainingHostelToAllocate -= yearHostelPaid

        // Apply the payments to this year's record if any payment was made
        if (yearTotalPaid > 0) {
          // Update termPayments for this year - component by component
          if (yearRecord.termPayments) {
            let remainingSchool = yearSchoolPaid
            let remainingTransport = yearTransportPaid
            let remainingHostel = yearHostelPaid
            
            const termOrder = ['term1', 'term2', 'term3']
            
            for (const termKey of termOrder) {
              if (remainingSchool === 0 && remainingTransport === 0 && remainingHostel === 0) break
              
              const termData = yearRecord.termPayments[termKey]
              if (!termData) continue
              
              // Apply school payment
              if (remainingSchool > 0 && termData.components?.schoolFee?.remaining > 0) {
                const schoolPayment = Math.min(remainingSchool, termData.components.schoolFee.remaining)
                termData.components.schoolFee.paid = (termData.components.schoolFee.paid || 0) + schoolPayment
                termData.components.schoolFee.remaining = termData.components.schoolFee.due - termData.components.schoolFee.paid
                remainingSchool -= schoolPayment
              }
              
              // Apply transport payment
              if (remainingTransport > 0 && termData.components?.transportFee?.remaining > 0) {
                const transportPayment = Math.min(remainingTransport, termData.components.transportFee.remaining)
                termData.components.transportFee.paid = (termData.components.transportFee.paid || 0) + transportPayment
                termData.components.transportFee.remaining = termData.components.transportFee.due - termData.components.transportFee.paid
                remainingTransport -= transportPayment
              }
              
              // Apply hostel payment
              if (remainingHostel > 0 && termData.components?.hostelFee?.remaining > 0) {
                const hostelPayment = Math.min(remainingHostel, termData.components.hostelFee.remaining)
                termData.components.hostelFee.paid = (termData.components.hostelFee.paid || 0) + hostelPayment
                termData.components.hostelFee.remaining = termData.components.hostelFee.due - termData.components.hostelFee.paid
                remainingHostel -= hostelPayment
              }
              
              // Recalculate term totals
              const termComponents = termData.components
              termData.paid = (termComponents.schoolFee?.paid || 0) + 
                              (termComponents.transportFee?.paid || 0) + 
                              (termComponents.hostelFee?.paid || 0)
              termData.remaining = termData.due - termData.paid
            }
          }
          
          // Update termDistribution to match termPayments
          if (yearRecord.termDistribution && yearRecord.termPayments) {
            Object.keys(yearRecord.termDistribution).forEach(termNum => {
              const termKey = `term${termNum}`
              const termPaymentData = yearRecord.termPayments[termKey]
              
              if (termPaymentData && termPaymentData.components) {
                const schoolFeePaid = termPaymentData.components.schoolFee?.paid || 0
                const transportFeePaid = termPaymentData.components.transportFee?.paid || 0
                const hostelFeePaid = termPaymentData.components.hostelFee?.paid || 0
                const totalPaid = schoolFeePaid + transportFeePaid + hostelFeePaid
                
                let status = 'Unpaid'
                if (totalPaid >= yearRecord.termDistribution[termNum].total) {
                  status = 'Paid'
                } else if (totalPaid > 0) {
                  status = 'Partial'
                }
                
                yearRecord.termDistribution[termNum] = {
                  ...yearRecord.termDistribution[termNum],
                  schoolFeePaid: schoolFeePaid,
                  transportFeePaid: transportFeePaid,
                  hostelFeePaid: hostelFeePaid,
                  totalPaid: totalPaid,
                  status: status
                }
              }
            })
          }

          // Update year totals
          yearRecord.totalPaid = (yearRecord.totalPaid || 0) + yearTotalPaid
          yearRecord.totalDue = Math.max(0, (yearRecord.totalDue || 0) - yearTotalPaid)
          yearRecord.isFullyPaid = yearRecord.totalDue === 0

          // Recalculate remainingBreakdown
          let yearSchoolRemaining = 0
          let yearTransportRemaining = 0
          let yearHostelRemaining = 0
          
          if (yearRecord.termPayments) {
            Object.values(yearRecord.termPayments).forEach(term => {
              if (term.components) {
                yearSchoolRemaining += term.components.schoolFee?.remaining || 0
                yearTransportRemaining += term.components.transportFee?.remaining || 0
                yearHostelRemaining += term.components.hostelFee?.remaining || 0
              }
            })
          }
          
          yearRecord.remainingBreakdown = {
            school: yearSchoolRemaining,
            transport: yearTransportRemaining,
            hostel: yearHostelRemaining,
            total: yearSchoolRemaining + yearTransportRemaining + yearHostelRemaining
          }
        }

        updatedPreviousYears.push(yearRecord)
        
        if (yearTotalPaid > 0) {
          distributionLog.push({
            academicYear: yearRecord.academicYear,
            amount: yearTotalPaid,
            breakdown: {
              school: yearSchoolPaid,
              transport: yearTransportPaid,
              hostel: yearHostelPaid
            }
          })
        }
      }

      previousYearDetails = updatedPreviousYears
      previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)

      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.paymentHistory.create({
          data: {
            studentId,
            studentDetails: studentDetailsSnapshot,
            date: new Date(),
            schoolFeePaid: originalSchoolPaid,
            transportFeePaid: originalTransportPaid,
            hostelFeePaid: originalHostelPaid,
            totalAmount,
            receiptNo: customReceiptNo || generateReceiptNo(),
            paymentMode,
            description: description || 'Payment for all previous years',
            chequeNo,
            bankName,
            transactionId,
            referenceNo,
            termNumber: null,
            receivedBy,
            metadata: {
              paymentType: 'allPreviousYears',
              distribution: distributionLog,
              previousYearBreakdown: {
                school: originalSchoolPaid,
                transport: originalTransportPaid,
                hostel: originalHostelPaid,
                total: totalAmount
              },
              previousYearFee: previousYearFeeBeforePayment,
              currentYearDue: currentYearDueBeforePayment
            }
          }
        })

        const updatedFeeRecord = await tx.feeDetails.update({
          where: { id: feeRecord.id },
          data: {
            previousYearDetails: previousYearDetails,
            previousYearFee: previousYearFee,
            totalDue: previousYearFee + currentYearDue,
            updatedBy: receivedBy
          }
        })

        return { payment, updatedFeeRecord }
      })

      return res.status(201).json({
        success: true,
        message: 'Previous years payment processed successfully',
        data: {
          paymentId: result.payment.id,
          receiptNo: result.payment.receiptNo,
          date: result.payment.date,
          totalAmount: result.payment.totalAmount,
          previousYearBreakdown: {
            school: originalSchoolPaid,
            transport: originalTransportPaid,
            hostel: originalHostelPaid,
            total: totalAmount
          },
          paymentType: 'allPreviousYears',
          receiptUrl: `/api/fee/receipt/${result.payment.id}`
        }
      })
    }

    // ========== CURRENT YEAR PAYMENT ==========
    if (paymentType === 'currentYear') {
      if (totalAmount > currentYearDue) {
        return res.status(400).json({
          success: false,
          message: `Payment amount (${totalAmount}) exceeds current year due (${currentYearDue})`
        })
      }

      let termDistribution = JSON.parse(JSON.stringify(feeRecord.termDistribution || {}))
      
      let schoolPaid = schoolFeePaid
      let transportPaid = transportFeePaid
      let hostelPaid = hostelFeePaid
      
      let remainingSchool = schoolPaid
      let remainingTransport = transportPaid
      let remainingHostel = hostelPaid
      
      for (let termNum = 1; termNum <= 3; termNum++) {
        if (!termDistribution[termNum]) continue
        
        const termData = termDistribution[termNum]
        
        const schoolFeeDue = termData.schoolFee - (termData.schoolFeePaid || 0)
        const transportFeeDue = termData.transportFee - (termData.transportFeePaid || 0)
        const hostelFeeDue = termData.hostelFee - (termData.hostelFeePaid || 0)
        
        const schoolFeeToPay = Math.min(remainingSchool, schoolFeeDue)
        const transportFeeToPay = Math.min(remainingTransport, transportFeeDue)
        const hostelFeeToPay = Math.min(remainingHostel, hostelFeeDue)
        
        if (schoolFeeToPay > 0 || transportFeeToPay > 0 || hostelFeeToPay > 0) {
          termDistribution = updateTermPaidAmounts(
            termDistribution,
            termNum,
            schoolFeeToPay,
            transportFeeToPay,
            hostelFeeToPay
          )
          
          remainingSchool -= schoolFeeToPay
          remainingTransport -= transportFeeToPay
          remainingHostel -= hostelFeeToPay
        }
        
        if (remainingSchool === 0 && remainingTransport === 0 && remainingHostel === 0) break
      }

      const totals = recalculateOverallTotals(termDistribution)

      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.paymentHistory.create({
          data: {
            studentId,
            studentDetails: studentDetailsSnapshot,
            date: new Date(),
            schoolFeePaid: schoolPaid,
            transportFeePaid: transportPaid,
            hostelFeePaid: hostelPaid,
            totalAmount,
            receiptNo: customReceiptNo || generateReceiptNo(),
            paymentMode,
            description: description || 'Current year payment',
            chequeNo,
            bankName,
            transactionId,
            referenceNo,
            termNumber: null,
            receivedBy,
            metadata: {
              paymentType: 'currentYear',
              currentYearBreakdown: {
                school: schoolPaid,
                transport: transportPaid,
                hostel: hostelPaid,
                total: totalAmount
              },
              previousYearFee: previousYearFeeBeforePayment,
              currentYearDue: currentYearDueBeforePayment
            }
          }
        })

        const updatedFeeRecord = await tx.feeDetails.update({
          where: { id: feeRecord.id },
          data: {
            schoolFeePaid: totals.schoolFeePaid,
            transportFeePaid: totals.transportFeePaid,
            hostelFeePaid: totals.hostelFeePaid,
            totalPaid: totals.totalPaid,
            termDistribution: termDistribution,
            term1Paid: termDistribution[1]?.totalPaid || 0,
            term2Paid: termDistribution[2]?.totalPaid || 0,
            term3Paid: termDistribution[3]?.totalPaid || 0,
            totalDue: previousYearFee + (discountedTotalFee - totals.totalPaid),
            isFullyPaid: (discountedTotalFee - totals.totalPaid) === 0 && previousYearFee === 0,
            updatedBy: receivedBy
          }
        })

        return { payment, updatedFeeRecord }
      })

      return res.status(201).json({
        success: true,
        message: 'Current year payment processed successfully',
        data: {
          paymentId: result.payment.id,
          receiptNo: result.payment.receiptNo,
          date: result.payment.date,
          totalAmount: result.payment.totalAmount,
          currentYearBreakdown: {
            school: schoolPaid,
            transport: transportPaid,
            hostel: hostelPaid,
            total: totalAmount
          },
          paymentType: 'currentYear',
          receiptUrl: `/api/fee/receipt/${result.payment.id}`
        }
      })
    }

    // ========== TERM PAYMENT ==========
    if (providedTermNumber) {
      if (providedTermNumber < 1 || providedTermNumber > 3) {
        return res.status(400).json({
          success: false,
          message: `Invalid term number: ${providedTermNumber}`
        })
      }

      let termDistribution = JSON.parse(JSON.stringify(feeRecord.termDistribution || {}))
      
      if (!termDistribution[providedTermNumber]) {
        return res.status(400).json({
          success: false,
          message: `Term ${providedTermNumber} not found in distribution`
        })
      }

      const termData = termDistribution[providedTermNumber]
      const schoolFeeDue = termData.schoolFee - (termData.schoolFeePaid || 0)
      const transportFeeDue = termData.transportFee - (termData.transportFeePaid || 0)
      const hostelFeeDue = termData.hostelFee - (termData.hostelFeePaid || 0)

      if (schoolFeePaid > schoolFeeDue) {
        return res.status(400).json({
          success: false,
          message: `School fee payment (${schoolFeePaid}) exceeds term ${providedTermNumber} due amount (${schoolFeeDue})`
        })
      }
      if (transportFeePaid > transportFeeDue) {
        return res.status(400).json({
          success: false,
          message: `Transport fee payment (${transportFeePaid}) exceeds term ${providedTermNumber} due amount (${transportFeeDue})`
        })
      }
      if (hostelFeePaid > hostelFeeDue) {
        return res.status(400).json({
          success: false,
          message: `Hostel fee payment (${hostelFeePaid}) exceeds term ${providedTermNumber} due amount (${hostelFeeDue})`
        })
      }

      termDistribution = updateTermPaidAmounts(
        termDistribution,
        providedTermNumber,
        schoolFeePaid,
        transportFeePaid,
        hostelFeePaid
      )

      const totals = recalculateOverallTotals(termDistribution)

      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.paymentHistory.create({
          data: {
            studentId,
            studentDetails: studentDetailsSnapshot,
            date: new Date(),
            schoolFeePaid,
            transportFeePaid,
            hostelFeePaid,
            totalAmount,
            receiptNo: customReceiptNo || generateReceiptNo(),
            paymentMode,
            description: description || `Term ${providedTermNumber} payment`,
            chequeNo,
            bankName,
            transactionId,
            referenceNo,
            termNumber: providedTermNumber,
            receivedBy,
            metadata: {
              paymentType: 'term',
              termNumber: providedTermNumber,
              currentYearBreakdown: {
                school: schoolFeePaid,
                transport: transportFeePaid,
                hostel: hostelFeePaid,
                total: totalAmount
              },
              previousYearFee: previousYearFeeBeforePayment,
              currentYearDue: currentYearDueBeforePayment
            }
          }
        })

        const updatedFeeRecord = await tx.feeDetails.update({
          where: { id: feeRecord.id },
          data: {
            schoolFeePaid: totals.schoolFeePaid,
            transportFeePaid: totals.transportFeePaid,
            hostelFeePaid: totals.hostelFeePaid,
            totalPaid: totals.totalPaid,
            termDistribution: termDistribution,
            term1Paid: termDistribution[1]?.totalPaid || 0,
            term2Paid: termDistribution[2]?.totalPaid || 0,
            term3Paid: termDistribution[3]?.totalPaid || 0,
            totalDue: previousYearFee + (discountedTotalFee - totals.totalPaid),
            isFullyPaid: (discountedTotalFee - totals.totalPaid) === 0 && previousYearFee === 0,
            updatedBy: receivedBy
          }
        })

        return { payment, updatedFeeRecord }
      })

      return res.status(201).json({
        success: true,
        message: `Term ${providedTermNumber} payment processed successfully`,
        data: {
          paymentId: result.payment.id,
          receiptNo: result.payment.receiptNo,
          date: result.payment.date,
          totalAmount: result.payment.totalAmount,
          currentYearBreakdown: {
            school: schoolFeePaid,
            transport: transportFeePaid,
            hostel: hostelFeePaid,
            total: totalAmount
          },
          termNumber: providedTermNumber,
          paymentType: 'term',
          receiptUrl: `/api/fee/receipt/${result.payment.id}`
        }
      })
    }

    // ========== TOTAL PAYMENT ==========
    if (paymentType === 'total' || paymentType === 'full') {
      let remainingAmount = totalAmount
      const distributionLog = []
      let updatedPreviousYears = JSON.parse(JSON.stringify(previousYearDetails))
      
      let allocatedSchoolToPrevious = 0
      let allocatedTransportToPrevious = 0
      let allocatedHostelToPrevious = 0

      if (previousYearFee > 0 && remainingAmount > 0) {
        for (let i = 0; i < updatedPreviousYears.length; i++) {
          if (remainingAmount <= 0) break
          
          const yearRecord = updatedPreviousYears[i]
          if (!yearRecord || yearRecord.totalDue <= 0) continue

          let yearSchoolDue = 0
          let yearTransportDue = 0
          let yearHostelDue = 0
          
          if (yearRecord.termPayments) {
            Object.values(yearRecord.termPayments).forEach(term => {
              if (term.components) {
                yearSchoolDue += term.components.schoolFee?.remaining || 0
                yearTransportDue += term.components.transportFee?.remaining || 0
                yearHostelDue += term.components.hostelFee?.remaining || 0
              }
            })
          }

          const yearTotalDue = yearSchoolDue + yearTransportDue + yearHostelDue
          if (yearTotalDue <= 0) continue

          const paymentForThisYear = Math.min(remainingAmount, yearTotalDue)
          
          let yearSchoolPaid = 0
          let yearTransportPaid = 0
          let yearHostelPaid = 0
          
          if (yearSchoolDue > 0) {
            const schoolRatio = yearSchoolDue / yearTotalDue
            yearSchoolPaid = Math.min(
              Math.round(schoolRatio * paymentForThisYear),
              yearSchoolDue
            )
          }
          
          if (yearTransportDue > 0) {
            const transportRatio = yearTransportDue / yearTotalDue
            yearTransportPaid = Math.min(
              Math.round(transportRatio * paymentForThisYear),
              yearTransportDue
            )
          }
          
          yearHostelPaid = paymentForThisYear - yearSchoolPaid - yearTransportPaid
          if (yearHostelPaid > yearHostelDue) {
            const excess = yearHostelPaid - yearHostelDue
            yearHostelPaid = yearHostelDue
            if (yearSchoolDue - yearSchoolPaid > 0) {
              yearSchoolPaid += Math.min(excess, yearSchoolDue - yearSchoolPaid)
            } else if (yearTransportDue - yearTransportPaid > 0) {
              yearTransportPaid += Math.min(excess, yearTransportDue - yearTransportPaid)
            }
          }

          allocatedSchoolToPrevious += yearSchoolPaid
          allocatedTransportToPrevious += yearTransportPaid
          allocatedHostelToPrevious += yearHostelPaid

          // Update termPayments for this year
          if (yearRecord.termPayments) {
            let remainingSchool = yearSchoolPaid
            let remainingTransport = yearTransportPaid
            let remainingHostel = yearHostelPaid
            
            const termOrder = ['term1', 'term2', 'term3']
            
            for (const termKey of termOrder) {
              if (remainingSchool === 0 && remainingTransport === 0 && remainingHostel === 0) break
              
              const termData = yearRecord.termPayments[termKey]
              if (!termData) continue
              
              const termSchoolRemaining = termData.components?.schoolFee?.remaining || 0
              const termTransportRemaining = termData.components?.transportFee?.remaining || 0
              const termHostelRemaining = termData.components?.hostelFee?.remaining || 0
              
              if (remainingSchool > 0 && termSchoolRemaining > 0) {
                const schoolPayment = Math.min(remainingSchool, termSchoolRemaining)
                termData.components.schoolFee.paid = (termData.components.schoolFee.paid || 0) + schoolPayment
                termData.components.schoolFee.remaining = termData.components.schoolFee.due - termData.components.schoolFee.paid
                remainingSchool -= schoolPayment
              }
              
              if (remainingTransport > 0 && termTransportRemaining > 0) {
                const transportPayment = Math.min(remainingTransport, termTransportRemaining)
                termData.components.transportFee.paid = (termData.components.transportFee.paid || 0) + transportPayment
                termData.components.transportFee.remaining = termData.components.transportFee.due - termData.components.transportFee.paid
                remainingTransport -= transportPayment
              }
              
              if (remainingHostel > 0 && termHostelRemaining > 0) {
                const hostelPayment = Math.min(remainingHostel, termHostelRemaining)
                termData.components.hostelFee.paid = (termData.components.hostelFee.paid || 0) + hostelPayment
                termData.components.hostelFee.remaining = termData.components.hostelFee.due - termData.components.hostelFee.paid
                remainingHostel -= hostelPayment
              }
              
              const termComponents = termData.components
              termData.paid = (termComponents.schoolFee?.paid || 0) + 
                              (termComponents.transportFee?.paid || 0) + 
                              (termComponents.hostelFee?.paid || 0)
              termData.remaining = termData.due - termData.paid
            }
          }
          
          // Update termDistribution
          if (yearRecord.termDistribution && yearRecord.termPayments) {
            Object.keys(yearRecord.termDistribution).forEach(termNum => {
              const termKey = `term${termNum}`
              const termPaymentData = yearRecord.termPayments[termKey]
              
              if (termPaymentData && termPaymentData.components) {
                const schoolFeePaid = termPaymentData.components.schoolFee?.paid || 0
                const transportFeePaid = termPaymentData.components.transportFee?.paid || 0
                const hostelFeePaid = termPaymentData.components.hostelFee?.paid || 0
                const totalPaid = schoolFeePaid + transportFeePaid + hostelFeePaid
                const totalDue = (termPaymentData.components.schoolFee?.due || 0) + 
                                 (termPaymentData.components.transportFee?.due || 0) + 
                                 (termPaymentData.components.hostelFee?.due || 0)
                
                let status = 'Unpaid'
                if (totalPaid >= totalDue) {
                  status = 'Paid'
                } else if (totalPaid > 0) {
                  status = 'Partial'
                }
                
                yearRecord.termDistribution[termNum] = {
                  ...yearRecord.termDistribution[termNum],
                  schoolFeePaid: schoolFeePaid,
                  transportFeePaid: transportFeePaid,
                  hostelFeePaid: hostelFeePaid,
                  totalPaid: totalPaid,
                  status: status
                }
              }
            })
          }

          // Update year totals
          yearRecord.totalPaid = (yearRecord.totalPaid || 0) + paymentForThisYear
          yearRecord.totalDue = (yearRecord.totalDue || 0) - paymentForThisYear
          yearRecord.isFullyPaid = yearRecord.totalDue === 0

          // Recalculate remainingBreakdown
          let yearSchoolRemaining = 0
          let yearTransportRemaining = 0
          let yearHostelRemaining = 0
          
          if (yearRecord.termPayments) {
            Object.values(yearRecord.termPayments).forEach(term => {
              if (term.components) {
                yearSchoolRemaining += term.components.schoolFee?.remaining || 0
                yearTransportRemaining += term.components.transportFee?.remaining || 0
                yearHostelRemaining += term.components.hostelFee?.remaining || 0
              }
            })
          }
          
          yearRecord.remainingBreakdown = {
            school: yearSchoolRemaining,
            transport: yearTransportRemaining,
            hostel: yearHostelRemaining,
            total: yearSchoolRemaining + yearTransportRemaining + yearHostelRemaining
          }

          updatedPreviousYears[i] = yearRecord
          remainingAmount -= paymentForThisYear
          
          distributionLog.push({
            academicYear: yearRecord.academicYear,
            amount: paymentForThisYear,
            breakdown: {
              school: yearSchoolPaid,
              transport: yearTransportPaid,
              hostel: yearHostelPaid
            }
          })
        }
      }

      let updatedTermDistribution = JSON.parse(JSON.stringify(feeRecord.termDistribution || {}))
      let schoolFeePaidCurrent = 0
      let transportFeePaidCurrent = 0
      let hostelFeePaidCurrent = 0
      
      if (remainingAmount > 0 && currentYearDue > 0) {
        const remainingSchoolFromRequest = Math.max(0, schoolFeePaid - allocatedSchoolToPrevious)
        const remainingTransportFromRequest = Math.max(0, transportFeePaid - allocatedTransportToPrevious)
        const remainingHostelFromRequest = Math.max(0, hostelFeePaid - allocatedHostelToPrevious)
        
        schoolFeePaidCurrent = Math.min(remainingSchoolFromRequest, currentYearDueSchool)
        transportFeePaidCurrent = Math.min(remainingTransportFromRequest, currentYearDueTransport)
        hostelFeePaidCurrent = Math.min(remainingHostelFromRequest, currentYearDueHostel)

        let remainingSchool = schoolFeePaidCurrent
        let remainingTransport = transportFeePaidCurrent
        let remainingHostel = hostelFeePaidCurrent
        
        for (let termNum = 1; termNum <= 3; termNum++) {
          if (remainingSchool === 0 && remainingTransport === 0 && remainingHostel === 0) break
          if (!updatedTermDistribution[termNum]) continue
          
          const termData = updatedTermDistribution[termNum]
          
          const schoolFeeDue = termData.schoolFee - (termData.schoolFeePaid || 0)
          const transportFeeDue = termData.transportFee - (termData.transportFeePaid || 0)
          const hostelFeeDue = termData.hostelFee - (termData.hostelFeePaid || 0)
          
          const schoolFeeToPay = Math.min(remainingSchool, schoolFeeDue)
          const transportFeeToPay = Math.min(remainingTransport, transportFeeDue)
          const hostelFeeToPay = Math.min(remainingHostel, hostelFeeDue)
          
          if (schoolFeeToPay > 0 || transportFeeToPay > 0 || hostelFeeToPay > 0) {
            updatedTermDistribution = updateTermPaidAmounts(
              updatedTermDistribution,
              termNum,
              schoolFeeToPay,
              transportFeeToPay,
              hostelFeeToPay
            )
            
            remainingSchool -= schoolFeeToPay
            remainingTransport -= transportFeeToPay
            remainingHostel -= hostelFeeToPay
          }
        }
      }

      previousYearFee = calculateTotalPreviousYearPending(updatedPreviousYears)
      const totals = recalculateOverallTotals(updatedTermDistribution)
      
      const newCurrentYearDueSchool = discountedSchoolFee - totals.schoolFeePaid
      const newCurrentYearDueTransport = discountedTransportFee - totals.transportFeePaid
      const newCurrentYearDueHostel = discountedHostelFee - totals.hostelFeePaid
      const newCurrentYearDue = newCurrentYearDueSchool + newCurrentYearDueTransport + newCurrentYearDueHostel

      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.paymentHistory.create({
          data: {
            studentId,
            studentDetails: studentDetailsSnapshot,
            date: new Date(),
            schoolFeePaid: schoolFeePaidCurrent,
            transportFeePaid: transportFeePaidCurrent,
            hostelFeePaid: hostelFeePaidCurrent,
            totalAmount,
            receiptNo: customReceiptNo || generateReceiptNo(),
            paymentMode,
            description: description || 'Total outstanding payment',
            chequeNo,
            bankName,
            transactionId,
            referenceNo,
            termNumber: null,
            receivedBy,
            metadata: {
              paymentType: 'total',
              distribution: distributionLog,
              previousYearsPaid: distributionLog.length,
              currentYearPaid: totalAmount - (distributionLog.reduce((sum, d) => sum + d.amount, 0)),
              previousYearBreakdown: {
                school: allocatedSchoolToPrevious,
                transport: allocatedTransportToPrevious,
                hostel: allocatedHostelToPrevious,
                total: allocatedSchoolToPrevious + allocatedTransportToPrevious + allocatedHostelToPrevious
              },
              currentYearBreakdown: {
                school: schoolFeePaidCurrent,
                transport: transportFeePaidCurrent,
                hostel: hostelFeePaidCurrent,
                total: schoolFeePaidCurrent + transportFeePaidCurrent + hostelFeePaidCurrent
              },
              previousYearFee: previousYearFeeBeforePayment,
              currentYearDue: currentYearDueBeforePayment
            }
          }
        })

        const updatedFeeRecord = await tx.feeDetails.update({
          where: { id: feeRecord.id },
          data: {
            schoolFeePaid: totals.schoolFeePaid,
            transportFeePaid: totals.transportFeePaid,
            hostelFeePaid: totals.hostelFeePaid,
            totalPaid: totals.totalPaid,
            termDistribution: updatedTermDistribution,
            term1Paid: updatedTermDistribution[1]?.totalPaid || 0,
            term2Paid: updatedTermDistribution[2]?.totalPaid || 0,
            term3Paid: updatedTermDistribution[3]?.totalPaid || 0,
            previousYearDetails: updatedPreviousYears,
            previousYearFee: previousYearFee,
            totalDue: previousYearFee + newCurrentYearDue,
            isFullyPaid: previousYearFee === 0 && newCurrentYearDue === 0,
            updatedBy: receivedBy
          }
        })

        return { payment, updatedFeeRecord }
      })

      return res.status(201).json({
        success: true,
        message: 'Total payment processed successfully',
        data: {
          paymentId: result.payment.id,
          receiptNo: result.payment.receiptNo,
          date: result.payment.date,
          totalAmount: result.payment.totalAmount,
          previousYearBreakdown: {
            school: allocatedSchoolToPrevious,
            transport: allocatedTransportToPrevious,
            hostel: allocatedHostelToPrevious,
            total: allocatedSchoolToPrevious + allocatedTransportToPrevious + allocatedHostelToPrevious
          },
          currentYearBreakdown: {
            school: schoolFeePaidCurrent,
            transport: transportFeePaidCurrent,
            hostel: hostelFeePaidCurrent,
            total: schoolFeePaidCurrent + transportFeePaidCurrent + hostelFeePaidCurrent
          },
          paymentType: 'total',
          receiptUrl: `/api/fee/receipt/${result.payment.id}`
        }
      })
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid payment type or missing required parameters'
    })

  } catch (error) {
    console.error('Process payment error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process payment'
    })
  }
}

/**
 * @desc    Get payment receipt by ID
 * @route   GET /api/fee/receipt/:paymentId
 */
export const getPaymentReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params

    const payment = await prisma.paymentHistory.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            feeDetails: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      })
    }

    const feeRecord = payment.student.feeDetails[0]
    
    // Parse previous year details
    const previousYearDetails = getFormattedPreviousYearDetails(feeRecord.previousYearDetails)
    
    // Calculate previous year totals
    let totalPreviousYearFee = 0
    let totalPreviousYearPaid = 0
    let totalPreviousYearDue = 0
    
    previousYearDetails.forEach(year => {
      totalPreviousYearFee += year.originalTotalFee || 0
      totalPreviousYearPaid += year.totalPaid || 0
      totalPreviousYearDue += year.totalDue || 0
    })

    // Calculate current year totals
    const discountedSchoolFee = feeRecord.discountedSchoolFee || 0
    const discountedTransportFee = feeRecord.discountedTransportFee || 0
    const discountedHostelFee = feeRecord.discountedHostelFee || 0
    const discountedTotalFee = discountedSchoolFee + discountedTransportFee + discountedHostelFee

    const currentYearPaidSchool = feeRecord.schoolFeePaid || 0
    const currentYearPaidTransport = feeRecord.transportFeePaid || 0
    const currentYearPaidHostel = feeRecord.hostelFeePaid || 0
    const currentYearTotalPaid = currentYearPaidSchool + currentYearPaidTransport + currentYearPaidHostel

    const currentYearDueSchool = discountedSchoolFee - currentYearPaidSchool
    const currentYearDueTransport = discountedTransportFee - currentYearPaidTransport
    const currentYearDueHostel = discountedHostelFee - currentYearPaidHostel
    const currentYearDue = currentYearDueSchool + currentYearDueTransport + currentYearDueHostel

    // Calculate grand totals
    const grandTotal = discountedTotalFee + totalPreviousYearFee
    const totalPaidAcrossAllYears = currentYearTotalPaid + totalPreviousYearPaid
    const totalDueAcrossAllYears = currentYearDue + totalPreviousYearDue

    // Get payment metadata
    const metadata = payment.metadata || {}
    const paymentType = metadata.paymentType || 
                       (payment.termNumber ? 'term' : 
                        payment.description?.toLowerCase().includes('previous') ? 'previousYear' : 'currentYear')

    console.log('Payment Receipt - Processing:', {
      paymentId: payment.id,
      paymentType,
      totalAmount: payment.totalAmount,
      schoolFeePaid: payment.schoolFeePaid,
      transportFeePaid: payment.transportFeePaid,
      hostelFeePaid: payment.hostelFeePaid,
      metadata
    })

    // Initialize breakdowns with exact amounts from payment
    let previousYearPaidInThisTransaction = {
      schoolFee: 0,
      transportFee: 0,
      hostelFee: 0,
      total: 0
    }

    let currentYearPaidInThisTransaction = {
      schoolFee: 0,
      transportFee: 0,
      hostelFee: 0,
      total: 0
    }

    // ===== EXTRACT EXACT BREAKDOWN FROM METADATA =====
    
    // For TOTAL payment type - use distribution log from metadata
    if (paymentType === 'total' || paymentType === 'full') {
      if (metadata.distribution && metadata.distribution.length > 0) {
        // Sum up previous year payments from distribution log
        metadata.distribution.forEach(dist => {
          if (dist.breakdown) {
            previousYearPaidInThisTransaction.schoolFee += dist.breakdown.school || 0
            previousYearPaidInThisTransaction.transportFee += dist.breakdown.transport || 0
            previousYearPaidInThisTransaction.hostelFee += dist.breakdown.hostel || 0
          }
        })
        previousYearPaidInThisTransaction.total = 
          previousYearPaidInThisTransaction.schoolFee + 
          previousYearPaidInThisTransaction.transportFee + 
          previousYearPaidInThisTransaction.hostelFee
        
        // Current year payment = total - previous year total
        currentYearPaidInThisTransaction.schoolFee = payment.schoolFeePaid - previousYearPaidInThisTransaction.schoolFee
        currentYearPaidInThisTransaction.transportFee = payment.transportFeePaid - previousYearPaidInThisTransaction.transportFee
        currentYearPaidInThisTransaction.hostelFee = payment.hostelFeePaid - previousYearPaidInThisTransaction.hostelFee
        currentYearPaidInThisTransaction.total = 
          currentYearPaidInThisTransaction.schoolFee + 
          currentYearPaidInThisTransaction.transportFee + 
          currentYearPaidInThisTransaction.hostelFee
      } 
      else if (metadata.previousYearBreakdown && metadata.currentYearBreakdown) {
        // Use breakdowns directly from metadata
        previousYearPaidInThisTransaction = {
          schoolFee: metadata.previousYearBreakdown.school || 0,
          transportFee: metadata.previousYearBreakdown.transport || 0,
          hostelFee: metadata.previousYearBreakdown.hostel || 0,
          total: metadata.previousYearBreakdown.total || 0
        }
        
        currentYearPaidInThisTransaction = {
          schoolFee: metadata.currentYearBreakdown.school || 0,
          transportFee: metadata.currentYearBreakdown.transport || 0,
          hostelFee: metadata.currentYearBreakdown.hostel || 0,
          total: metadata.currentYearBreakdown.total || 0
        }
      }
      else {
        // Fallback: Assume all payment is for previous years if previous year fee exists
        const totalPreviousYearDue = previousYearDetails.reduce((sum, year) => sum + (year.totalDue || 0), 0)
        const totalCurrentYearDue = currentYearDue
        
        // If total payment matches previous year due, it's all previous year
        if (Math.abs(payment.totalAmount - totalPreviousYearDue) < 10 && totalPreviousYearDue > 0) {
          previousYearPaidInThisTransaction = {
            schoolFee: payment.schoolFeePaid,
            transportFee: payment.transportFeePaid,
            hostelFee: payment.hostelFeePaid,
            total: payment.totalAmount
          }
        }
        // If total payment matches current year due, it's all current year
        else if (Math.abs(payment.totalAmount - totalCurrentYearDue) < 10 && totalCurrentYearDue > 0) {
          currentYearPaidInThisTransaction = {
            schoolFee: payment.schoolFeePaid,
            transportFee: payment.transportFeePaid,
            hostelFee: payment.hostelFeePaid,
            total: payment.totalAmount
          }
        }
        // Otherwise, split proportionally based on dues
        else {
          const totalDue = totalPreviousYearDue + totalCurrentYearDue
          if (totalDue > 0) {
            const previousYearRatio = totalPreviousYearDue / totalDue
            const previousYearAmount = Math.round(payment.totalAmount * previousYearRatio)
            
            // Split component amounts proportionally
            previousYearPaidInThisTransaction.schoolFee = Math.round(payment.schoolFeePaid * previousYearRatio)
            previousYearPaidInThisTransaction.transportFee = Math.round(payment.transportFeePaid * previousYearRatio)
            previousYearPaidInThisTransaction.hostelFee = Math.round(payment.hostelFeePaid * previousYearRatio)
            previousYearPaidInThisTransaction.total = previousYearAmount
            
            currentYearPaidInThisTransaction.schoolFee = payment.schoolFeePaid - previousYearPaidInThisTransaction.schoolFee
            currentYearPaidInThisTransaction.transportFee = payment.transportFeePaid - previousYearPaidInThisTransaction.transportFee
            currentYearPaidInThisTransaction.hostelFee = payment.hostelFeePaid - previousYearPaidInThisTransaction.hostelFee
            currentYearPaidInThisTransaction.total = payment.totalAmount - previousYearAmount
          }
        }
      }
    }
    // For PREVIOUS YEAR payment type
    else if (paymentType === 'previousYear' && metadata.previousYearBreakdown) {
      previousYearPaidInThisTransaction = {
        schoolFee: metadata.previousYearBreakdown.school || 0,
        transportFee: metadata.previousYearBreakdown.transport || 0,
        hostelFee: metadata.previousYearBreakdown.hostel || 0,
        total: metadata.previousYearBreakdown.total || payment.totalAmount
      }
    }
    // For ALL PREVIOUS YEARS payment type
    else if (paymentType === 'allPreviousYears' && metadata.previousYearBreakdown) {
      previousYearPaidInThisTransaction = {
        schoolFee: metadata.previousYearBreakdown.school || 0,
        transportFee: metadata.previousYearBreakdown.transport || 0,
        hostelFee: metadata.previousYearBreakdown.hostel || 0,
        total: metadata.previousYearBreakdown.total || payment.totalAmount
      }
    }
    // For CURRENT YEAR payment type
    else if (paymentType === 'currentYear' && metadata.currentYearBreakdown) {
      currentYearPaidInThisTransaction = {
        schoolFee: metadata.currentYearBreakdown.school || 0,
        transportFee: metadata.currentYearBreakdown.transport || 0,
        hostelFee: metadata.currentYearBreakdown.hostel || 0,
        total: metadata.currentYearBreakdown.total || payment.totalAmount
      }
    }
    // For TERM payment type
    else if (paymentType === 'term' && metadata.currentYearBreakdown) {
      currentYearPaidInThisTransaction = {
        schoolFee: metadata.currentYearBreakdown.school || 0,
        transportFee: metadata.currentYearBreakdown.transport || 0,
        hostelFee: metadata.currentYearBreakdown.hostel || 0,
        total: metadata.currentYearBreakdown.total || payment.totalAmount
      }
    }
    // Fallback: use payment fields directly with description analysis
    else {
      // Check if this payment is for previous years based on description
      if (payment.description?.toLowerCase().includes('previous') || 
          payment.description?.toLowerCase().includes('2024') ||
          payment.description?.toLowerCase().includes('2025')) {
        previousYearPaidInThisTransaction = {
          schoolFee: payment.schoolFeePaid,
          transportFee: payment.transportFeePaid,
          hostelFee: payment.hostelFeePaid,
          total: payment.totalAmount
        }
      } else {
        currentYearPaidInThisTransaction = {
          schoolFee: payment.schoolFeePaid,
          transportFee: payment.transportFeePaid,
          hostelFee: payment.hostelFeePaid,
          total: payment.totalAmount
        }
      }
    }

    // Ensure component totals match the payment total
    const calculatedComponentTotal = previousYearPaidInThisTransaction.total + currentYearPaidInThisTransaction.total
    if (Math.abs(calculatedComponentTotal - payment.totalAmount) > 1 && payment.totalAmount > 0) {
      // Adjust to fix mismatch - prioritize the breakdown that makes sense
      if (previousYearPaidInThisTransaction.total > 0 && currentYearPaidInThisTransaction.total === 0) {
        // All payment is for previous years
        previousYearPaidInThisTransaction.total = payment.totalAmount
        // Adjust individual components proportionally if needed
        const totalComponents = previousYearPaidInThisTransaction.schoolFee + 
                               previousYearPaidInThisTransaction.transportFee + 
                               previousYearPaidInThisTransaction.hostelFee
        if (totalComponents > 0 && totalComponents !== payment.totalAmount) {
          const ratio = payment.totalAmount / totalComponents
          previousYearPaidInThisTransaction.schoolFee = Math.round(previousYearPaidInThisTransaction.schoolFee * ratio)
          previousYearPaidInThisTransaction.transportFee = Math.round(previousYearPaidInThisTransaction.transportFee * ratio)
          previousYearPaidInThisTransaction.hostelFee = Math.round(previousYearPaidInThisTransaction.hostelFee * ratio)
        }
      } else if (currentYearPaidInThisTransaction.total > 0 && previousYearPaidInThisTransaction.total === 0) {
        // All payment is for current year
        currentYearPaidInThisTransaction.total = payment.totalAmount
        // Adjust individual components proportionally if needed
        const totalComponents = currentYearPaidInThisTransaction.schoolFee + 
                               currentYearPaidInThisTransaction.transportFee + 
                               currentYearPaidInThisTransaction.hostelFee
        if (totalComponents > 0 && totalComponents !== payment.totalAmount) {
          const ratio = payment.totalAmount / totalComponents
          currentYearPaidInThisTransaction.schoolFee = Math.round(currentYearPaidInThisTransaction.schoolFee * ratio)
          currentYearPaidInThisTransaction.transportFee = Math.round(currentYearPaidInThisTransaction.transportFee * ratio)
          currentYearPaidInThisTransaction.hostelFee = Math.round(currentYearPaidInThisTransaction.hostelFee * ratio)
        }
      } else {
        // Split payment - use original payment fields
        currentYearPaidInThisTransaction.schoolFee = payment.schoolFeePaid
        currentYearPaidInThisTransaction.transportFee = payment.transportFeePaid
        currentYearPaidInThisTransaction.hostelFee = payment.hostelFeePaid
        currentYearPaidInThisTransaction.total = payment.totalAmount
      }
    }

    // Log the final breakdown for verification
    console.log('Final Payment Breakdown:', {
      previousYear: previousYearPaidInThisTransaction,
      currentYear: currentYearPaidInThisTransaction,
      totalPayment: payment.totalAmount
    })

    // Use student snapshot if available
    const studentSnapshot = payment.studentDetails || {}
    const studentData = {
      name: studentSnapshot.firstName && studentSnapshot.lastName 
        ? `${studentSnapshot.firstName} ${studentSnapshot.lastName}`.trim()
        : `${payment.student.firstName} ${payment.student.lastName}`.trim(),
      admissionNo: studentSnapshot.admissionNo || payment.student.admissionNo,
      rollNo: payment.student.rollNo,
      class: studentSnapshot.class || payment.student.class,
      displayClass: studentSnapshot.classLabel || mapEnumToDisplayName(payment.student.class),
      section: studentSnapshot.section || payment.student.section,
      parentName: studentSnapshot.parentName || payment.student.parentName,
      parentPhone: studentSnapshot.parentPhone || payment.student.parentPhone,
      isHistoricalData: !!studentSnapshot.firstName
    }

    const receiptData = {
      receiptNo: payment.receiptNo,
      date: payment.date,
      student: studentData,
      payment: {
        id: payment.id,
        mode: payment.paymentMode,
        termNumber: payment.termNumber,
        type: paymentType,
        description: payment.description,
        chequeNo: payment.chequeNo,
        bankName: payment.bankName,
        transactionId: payment.transactionId,
        referenceNo: payment.referenceNo,
        receivedBy: payment.receivedBy,
        totalAmount: payment.totalAmount,
        breakdown: {
          schoolFee: payment.schoolFeePaid,
          transportFee: payment.transportFeePaid,
          hostelFee: payment.hostelFeePaid
        },
        // EXACT breakdown of what was paid for previous years
        previousYearBreakdown: {
          schoolFee: previousYearPaidInThisTransaction.schoolFee,
          transportFee: previousYearPaidInThisTransaction.transportFee,
          hostelFee: previousYearPaidInThisTransaction.hostelFee,
          total: previousYearPaidInThisTransaction.total
        },
        // EXACT breakdown of what was paid for current year
        currentYearBreakdown: {
          schoolFee: currentYearPaidInThisTransaction.schoolFee,
          transportFee: currentYearPaidInThisTransaction.transportFee,
          hostelFee: currentYearPaidInThisTransaction.hostelFee,
          total: currentYearPaidInThisTransaction.total
        },
        metadata
      },
      feeSummary: {
        // Current year details
        discountedSchoolFee,
        discountedTransportFee,
        discountedHostelFee,
        discountedTotalFee,
        currentYearPaidSchool,
        currentYearPaidTransport,
        currentYearPaidHostel,
        currentYearTotalPaid,
        currentYearDueSchool,
        currentYearDueTransport,
        currentYearDueHostel,
        currentYearDue,
        
        // Previous year details
        previousYearDetails,
        previousYearFee: totalPreviousYearFee,
        previousYearPaid: totalPreviousYearPaid,
        previousYearDue: totalPreviousYearDue,
        
        // Overall totals
        grandTotal,
        totalPaidAcrossAllYears,
        totalDueAcrossAllYears,
        paymentStatus: totalDueAcrossAllYears === 0 ? 'Paid' : 
                      totalDueAcrossAllYears === grandTotal ? 'Unpaid' : 'Partial'
      },
      schoolInfo: {
        name: process.env.SCHOOL_NAME || 'Your School Name',
        address: process.env.SCHOOL_ADDRESS || 'School Address',
        phone: process.env.SCHOOL_PHONE || 'School Phone',
        email: process.env.SCHOOL_EMAIL || 'school@email.com',
        principal: process.env.SCHOOL_PRINCIPAL || 'Principal Name'
      },
      generatedAt: new Date()
    }

    res.status(200).json({
      success: true,
      data: receiptData
    })
  } catch (error) {
    console.error('Get payment receipt error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment receipt'
    })
  }
}

/**
 * @desc    Promote a student to the next class (e.g., UKG → CLASS_1)
 * @route   POST /api/fees/:studentId/promote
 */
export const promoteStudent = async (req, res) => {
  try {
    const { studentId } = req.params
    const { 
      updatedBy,
      newSection,
      newRollNo
    } = req.body

    if (!updatedBy) {
      return res.status(400).json({
        success: false,
        message: 'Updated by is required'
      })
    }

    // Get student with current details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        feeDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    if (!student.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot promote an inactive student'
      })
    }

    // Check if student is in 10th class (cannot promote)
    if (student.class === 'CLASS_10') {
      return res.status(400).json({
        success: false,
        message: 'Students in Class 10 cannot be promoted. They will graduate.'
      })
    }

    // Get next class
    const nextClass = getNextClass(student.class)
    
    if (!nextClass) {
      return res.status(400).json({
        success: false,
        message: 'Cannot determine next class for promotion'
      })
    }

    const academicYear = getAcademicYear()

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Clear attendance records
      await tx.attendance.deleteMany({
        where: { studentId }
      })

      // 2. Clear marks records
      await tx.marks.deleteMany({
        where: { studentId }
      })

      // 3. Handle current fee record - DELETE IT WITHOUT ARCHIVING
      const currentFee = student.feeDetails[0]
      
      if (currentFee) {
        // Parse existing previous year details (KEEP THEM UNCHANGED)
        let previousYearDetails = []
        try {
          previousYearDetails = typeof currentFee.previousYearDetails === 'string'
            ? JSON.parse(currentFee.previousYearDetails)
            : currentFee.previousYearDetails || []
          if (!Array.isArray(previousYearDetails)) {
            previousYearDetails = []
          }
        } catch (e) {
          previousYearDetails = []
        }

        // Calculate previous year fee (sum of all historical dues) - UNCHANGED
        const previousYearFee = previousYearDetails.reduce((sum, record) => sum + (record.totalDue || 0), 0)

        // Delete the old fee record
        await tx.feeDetails.delete({
          where: { id: currentFee.id }
        })
      }

      // 4. Calculate new fee for NEXT class (following createStudent pattern)
      
      // Get class fee structure for the NEXT class
      const classFeeStructure = await tx.classFeeStructure.findFirst({
        where: {
          className: nextClass,
          isActive: true
        }
      })

      // Calculate transport fee if applicable
      let transportFee = 0
      if (student.isUsingSchoolTransport && student.village) {
        const busFeeStructure = await tx.busFeeStructure.findFirst({
          where: {
            villageName: { contains: student.village, mode: 'insensitive' },
            isActive: true
          }
        })
        transportFee = busFeeStructure?.feeAmount || 0
      }

      // Calculate hostel fee if applicable
      let hostelFee = 0
      if (student.studentType === 'HOSTELLER') {
        const hostelFeeStructure = await tx.hostelFeeStructure.findFirst({
          where: {
            className: nextClass,
            isActive: true
          }
        })
        hostelFee = hostelFeeStructure?.totalAnnualFee || 0
      }

      // Keep existing discounts
      const schoolFeeDiscount = student.schoolFeeDiscount || 0
      const transportFeeDiscount = student.transportFeeDiscount || 0
      const hostelFeeDiscount = student.hostelFeeDiscount || 0

      // Calculate original amounts (following createStudent pattern)
      const originalSchoolFee = classFeeStructure?.totalAnnualFee || 0
      const originalTransportFee = transportFee
      const originalHostelFee = hostelFee
      const originalTotalFee = originalSchoolFee + originalTransportFee + originalHostelFee

      // Calculate discounted amounts (following createStudent pattern)
      const discountedSchoolFee = calculateDiscountedFees(originalSchoolFee, schoolFeeDiscount)
      const discountedTransportFee = calculateDiscountedFees(originalTransportFee, transportFeeDiscount)
      const discountedHostelFee = calculateDiscountedFees(originalHostelFee, hostelFeeDiscount)
      const discountedTotalFee = discountedSchoolFee + discountedTransportFee + discountedHostelFee

      // Calculate term distribution (following createStudent pattern)
      const terms = 3
      const termDistribution = {}
      
      const baseSchoolFee = Math.floor(discountedSchoolFee / terms)
      const baseTransportFee = Math.floor(discountedTransportFee / terms)
      const baseHostelFee = Math.floor(discountedHostelFee / terms)
      
      const remainderSchool = discountedSchoolFee - (baseSchoolFee * terms)
      const remainderTransport = discountedTransportFee - (baseTransportFee * terms)
      const remainderHostel = discountedHostelFee - (baseHostelFee * terms)
      
      const now = new Date()
      const termDueDates = {
        term1DueDate: new Date(new Date(now).setMonth(now.getMonth() + 4)),
        term2DueDate: new Date(new Date(now).setMonth(now.getMonth() + 8)),
        term3DueDate: new Date(new Date(now).setMonth(now.getMonth() + 12))
      }
      
      let term1Due = 0, term2Due = 0, term3Due = 0
      
      for (let i = 1; i <= terms; i++) {
        const schoolFeeAmt = baseSchoolFee + (i <= remainderSchool ? 1 : 0)
        const transportFeeAmt = baseTransportFee + (i <= remainderTransport ? 1 : 0)
        const hostelFeeAmt = baseHostelFee + (i <= remainderHostel ? 1 : 0)
        const termTotal = schoolFeeAmt + transportFeeAmt + hostelFeeAmt
        
        termDistribution[i] = {
          schoolFee: schoolFeeAmt,
          transportFee: transportFeeAmt,
          hostelFee: hostelFeeAmt,
          total: termTotal,
          schoolFeePaid: 0,
          transportFeePaid: 0,
          hostelFeePaid: 0,
          totalPaid: 0,
          status: 'Unpaid'
        }
        
        if (i === 1) term1Due = termTotal
        if (i === 2) term2Due = termTotal
        if (i === 3) term3Due = termTotal
      }

      // Get previous year details from the deleted record (if any)
      let previousYearDetails = []
      let previousYearFee = 0
      
      if (currentFee) {
        try {
          previousYearDetails = typeof currentFee.previousYearDetails === 'string'
            ? JSON.parse(currentFee.previousYearDetails)
            : currentFee.previousYearDetails || []
          if (!Array.isArray(previousYearDetails)) {
            previousYearDetails = []
          }
          previousYearFee = previousYearDetails.reduce((sum, record) => sum + (record.totalDue || 0), 0)
        } catch (e) {
          previousYearDetails = []
          previousYearFee = 0
        }
      }

      // 5. Create NEW fee record for the promoted class (following createStudent pattern)
      const newFeeRecord = await tx.feeDetails.create({
        data: {
          studentId,
          
          // Original amounts
          originalSchoolFee,
          originalTransportFee,
          originalHostelFee,
          originalTotalFee,
          
          // Discounted amounts
          discountedSchoolFee,
          discountedTransportFee,
          discountedHostelFee,
          discountedTotalFee,
          
          // Paid amounts (initial zero)
          schoolFeePaid: 0,
          transportFeePaid: 0,
          hostelFeePaid: 0,
          totalPaid: 0,
          
          // Term distribution
          termDistribution,
          
          // Term amounts
          term1Due,
          term2Due,
          term3Due,
          
          // Term due dates
          term1DueDate: termDueDates.term1DueDate,
          term2DueDate: termDueDates.term2DueDate,
          term3DueDate: termDueDates.term3DueDate,
          
          // Term paid amounts (initial zero)
          term1Paid: 0,
          term2Paid: 0,
          term3Paid: 0,
          
          // Discounts applied
          schoolFeeDiscountApplied: schoolFeeDiscount,
          transportFeeDiscountApplied: transportFeeDiscount,
          hostelFeeDiscountApplied: hostelFeeDiscount,
          
          // Total due = discounted total fee (current year only)
          totalDue: discountedTotalFee,
          
          // Previous year details - KEEP EXISTING ONES UNCHANGED
          previousYearDetails: previousYearDetails,
          previousYearFee: previousYearFee,
          
          terms,
          isFullyPaid: false,
          updatedBy
        }
      })

      // 6. Update student with new class (NO studiedClasses update)
      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: {
          class: nextClass,
          section: newSection || student.section,
          rollNo: newRollNo || null,
          // studiedClasses: NOT UPDATED HERE
          updatedAt: new Date()
        }
      })

      return {
        updatedStudent,
        newFeeRecord,
        previousYearDetails,
        previousYearFee
      }
    })

    res.status(200).json({
      success: true,
      message: `Student promoted from ${mapEnumToDisplayName(student.class)} to ${mapEnumToDisplayName(nextClass)} successfully`,
      data: {
        student: {
          id: result.updatedStudent.id,
          name: `${result.updatedStudent.firstName} ${result.updatedStudent.lastName}`.trim(),
          admissionNo: result.updatedStudent.admissionNo,
          previousClass: mapEnumToDisplayName(student.class),
          previousSection: student.section,
          newClass: mapEnumToDisplayName(result.updatedStudent.class),
          newSection: result.updatedStudent.section,
          newRollNo: result.updatedStudent.rollNo
        },
        academicYear,
        feeSummary: {
          previousYearDetails: result.previousYearDetails,
          previousYearFee: result.previousYearFee,
          newYearFee: result.newFeeRecord.discountedTotalFee,
          totalDue: result.previousYearFee + result.newFeeRecord.discountedTotalFee
        }
      }
    })

  } catch (error) {
    console.error('Promote student error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to promote student'
    })
  }
}

/**
 * @desc    Demote a student to the previous class (e.g., UKG → LKG)
 * @route   POST /api/fees/:studentId/demote
 */
export const demoteStudent = async (req, res) => {  
  try {
    const { studentId } = req.params
    const { 
      updatedBy,
      newSection,
      newRollNo
    } = req.body

    if (!updatedBy) {
      return res.status(400).json({
        success: false,
        message: 'Updated by is required'
      })
    }

    // Get student with current details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        feeDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    if (!student.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot demote an inactive student'
      })
    }

    // Check if student is in Pre-Nursery (cannot demote - first class)
    if (student.class === 'PRE_NURSERY') {
      return res.status(400).json({
        success: false,
        message: 'Students in Pre-Nursery cannot be demoted as it is the first class'
      })
    }

    // Get the previous class (e.g., for UKG, this should return LKG)
    const previousClass = getPreviousClass(student.class)
    
    if (!previousClass) {
      return res.status(400).json({
        success: false,
        message: 'Cannot determine previous class for demotion'
      })
    }

    console.log(`Demoting student from ${student.class} to ${previousClass}`)

    const academicYear = getAcademicYear()

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Clear attendance records
      await tx.attendance.deleteMany({
        where: { studentId }
      })

      // 2. Clear marks records
      await tx.marks.deleteMany({
        where: { studentId }
      })

      // 3. Handle current fee record - DELETE IT WITHOUT ARCHIVING
      const currentFee = student.feeDetails[0]
      
      // Get previous year details from the current record (if any)
      let previousYearDetails = []
      let previousYearFee = 0
      
      if (currentFee) {
        try {
          previousYearDetails = typeof currentFee.previousYearDetails === 'string'
            ? JSON.parse(currentFee.previousYearDetails)
            : currentFee.previousYearDetails || []
          if (!Array.isArray(previousYearDetails)) {
            previousYearDetails = []
          }
          previousYearFee = previousYearDetails.reduce((sum, record) => sum + (record.totalDue || 0), 0)
        } catch (e) {
          previousYearDetails = []
          previousYearFee = 0
        }

        // Delete the old fee record
        await tx.feeDetails.delete({
          where: { id: currentFee.id }
        })
      }

      // 4. Calculate new fee for PREVIOUS class (demotion)
      
      // Get class fee structure for the PREVIOUS class
      const classFeeStructure = await tx.classFeeStructure.findFirst({
        where: {
          className: previousClass, // ← USE PREVIOUS CLASS, NOT SAME CLASS
          isActive: true
        }
      })

      // Calculate transport fee if applicable (using same village)
      let transportFee = 0
      if (student.isUsingSchoolTransport && student.village) {
        const busFeeStructure = await tx.busFeeStructure.findFirst({
          where: {
            villageName: { contains: student.village, mode: 'insensitive' },
            isActive: true
          }
        })
        transportFee = busFeeStructure?.feeAmount || 0
      }

      // Calculate hostel fee if applicable for the PREVIOUS class
      let hostelFee = 0
      if (student.studentType === 'HOSTELLER') {
        const hostelFeeStructure = await tx.hostelFeeStructure.findFirst({
          where: {
            className: previousClass, // ← USE PREVIOUS CLASS
            isActive: true
          }
        })
        hostelFee = hostelFeeStructure?.totalAnnualFee || 0
      }

      // Keep existing discounts
      const schoolFeeDiscount = student.schoolFeeDiscount || 0
      const transportFeeDiscount = student.transportFeeDiscount || 0
      const hostelFeeDiscount = student.hostelFeeDiscount || 0

      // Calculate original amounts
      const originalSchoolFee = classFeeStructure?.totalAnnualFee || 0
      const originalTransportFee = transportFee
      const originalHostelFee = hostelFee
      const originalTotalFee = originalSchoolFee + originalTransportFee + originalHostelFee

      // Calculate discounted amounts
      const discountedSchoolFee = calculateDiscountedFees(originalSchoolFee, schoolFeeDiscount)
      const discountedTransportFee = calculateDiscountedFees(originalTransportFee, transportFeeDiscount)
      const discountedHostelFee = calculateDiscountedFees(originalHostelFee, hostelFeeDiscount)
      const discountedTotalFee = discountedSchoolFee + discountedTransportFee + discountedHostelFee

      // Calculate term distribution
      const terms = 3
      const termDistribution = {}
      
      const baseSchoolFee = Math.floor(discountedSchoolFee / terms)
      const baseTransportFee = Math.floor(discountedTransportFee / terms)
      const baseHostelFee = Math.floor(discountedHostelFee / terms)
      
      const remainderSchool = discountedSchoolFee - (baseSchoolFee * terms)
      const remainderTransport = discountedTransportFee - (baseTransportFee * terms)
      const remainderHostel = discountedHostelFee - (baseHostelFee * terms)
      
      const now = new Date()
      const termDueDates = {
        term1DueDate: new Date(new Date(now).setMonth(now.getMonth() + 4)),
        term2DueDate: new Date(new Date(now).setMonth(now.getMonth() + 8)),
        term3DueDate: new Date(new Date(now).setMonth(now.getMonth() + 12))
      }
      
      let term1Due = 0, term2Due = 0, term3Due = 0
      
      for (let i = 1; i <= terms; i++) {
        const schoolFeeAmt = baseSchoolFee + (i <= remainderSchool ? 1 : 0)
        const transportFeeAmt = baseTransportFee + (i <= remainderTransport ? 1 : 0)
        const hostelFeeAmt = baseHostelFee + (i <= remainderHostel ? 1 : 0)
        const termTotal = schoolFeeAmt + transportFeeAmt + hostelFeeAmt
        
        termDistribution[i] = {
          schoolFee: schoolFeeAmt,
          transportFee: transportFeeAmt,
          hostelFee: hostelFeeAmt,
          total: termTotal,
          schoolFeePaid: 0,
          transportFeePaid: 0,
          hostelFeePaid: 0,
          totalPaid: 0,
          status: 'Unpaid'
        }
        
        if (i === 1) term1Due = termTotal
        if (i === 2) term2Due = termTotal
        if (i === 3) term3Due = termTotal
      }

      // 5. Create NEW fee record for the PREVIOUS class
      const newFeeRecord = await tx.feeDetails.create({
        data: {
          studentId,
          
          // Original amounts
          originalSchoolFee,
          originalTransportFee,
          originalHostelFee,
          originalTotalFee,
          
          // Discounted amounts
          discountedSchoolFee,
          discountedTransportFee,
          discountedHostelFee,
          discountedTotalFee,
          
          // Paid amounts (initial zero)
          schoolFeePaid: 0,
          transportFeePaid: 0,
          hostelFeePaid: 0,
          totalPaid: 0,
          
          // Term distribution
          termDistribution,
          
          // Term amounts
          term1Due,
          term2Due,
          term3Due,
          
          // Term due dates
          term1DueDate: termDueDates.term1DueDate,
          term2DueDate: termDueDates.term2DueDate,
          term3DueDate: termDueDates.term3DueDate,
          
          // Term paid amounts (initial zero)
          term1Paid: 0,
          term2Paid: 0,
          term3Paid: 0,
          
          // Discounts applied
          schoolFeeDiscountApplied: schoolFeeDiscount,
          transportFeeDiscountApplied: transportFeeDiscount,
          hostelFeeDiscountApplied: hostelFeeDiscount,
          
          // Total due = discounted total fee (current year only)
          totalDue: discountedTotalFee,
          
          // Previous year details - KEEP EXISTING ONES UNCHANGED
          previousYearDetails: previousYearDetails,
          previousYearFee: previousYearFee,
          
          terms,
          isFullyPaid: false,
          updatedBy
        }
      })

      // 6. Update student with PREVIOUS class (ACTUAL DEMOTION)
      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: {
          class: previousClass, // ← USE PREVIOUS CLASS, NOT SAME CLASS
          section: newSection || student.section,
          rollNo: newRollNo || student.rollNo,
          updatedAt: new Date()
        }
      })

      return {
        updatedStudent,
        newFeeRecord,
        previousYearDetails,
        previousYearFee
      }
    })

    res.status(200).json({
      success: true,
      message: `Student demoted from ${mapEnumToDisplayName(student.class)} to ${mapEnumToDisplayName(previousClass)}`,
      data: {
        student: {
          id: result.updatedStudent.id,
          name: `${result.updatedStudent.firstName} ${result.updatedStudent.lastName}`.trim(),
          admissionNo: result.updatedStudent.admissionNo,
          previousClass: mapEnumToDisplayName(student.class),
          previousSection: student.section,
          newClass: mapEnumToDisplayName(result.updatedStudent.class),
          newSection: result.updatedStudent.section,
          newRollNo: result.updatedStudent.rollNo
        },
        academicYear,
        feeSummary: {
          previousYearDetails: result.previousYearDetails,
          previousYearFee: result.previousYearFee,
          newYearFee: result.newFeeRecord.discountedTotalFee,
          totalDue: result.previousYearFee + result.newFeeRecord.discountedTotalFee
        }
      }
    })

  } catch (error) {
    console.error('Demote student error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to demote student'
    })
  }
}

/**
 * @desc    Inactivate a student - Just clear current year fee, keep previous year history
 * @route   POST /api/fees/:studentId/inactivate
 */
export const inactivateStudent = async (req, res) => {
  try {
    const { studentId } = req.params
    const { 
      updatedBy,
      reason
    } = req.body

    if (!updatedBy) {
      return res.status(400).json({
        success: false,
        message: 'Updated by is required'
      })
    }

    // Get student with current details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        feeDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    if (!student.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Student is already inactive'
      })
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Clear attendance records
      await tx.attendance.deleteMany({
        where: { studentId }
      })

      // 2. Clear marks records
      await tx.marks.deleteMany({
        where: { studentId }
      })

      // 3. Handle current fee record - DELETE IT BUT KEEP PREVIOUS YEAR DETAILS
      const currentFee = student.feeDetails[0]
      
      let previousYearDetails = []
      let previousYearFee = 0

      if (currentFee) {
        // Parse existing previous year details (KEEP THEM UNCHANGED)
        try {
          previousYearDetails = typeof currentFee.previousYearDetails === 'string'
            ? JSON.parse(currentFee.previousYearDetails)
            : currentFee.previousYearDetails || []
          if (!Array.isArray(previousYearDetails)) {
            previousYearDetails = []
          }
          previousYearFee = previousYearDetails.reduce((sum, record) => sum + (record.totalDue || 0), 0)
        } catch (e) {
          previousYearDetails = []
          previousYearFee = 0
        }

        // Delete the old fee record
        await tx.feeDetails.delete({
          where: { id: currentFee.id }
        })
      }

      // 4. Create new empty fee record with ONLY previous year details
      const newFeeRecord = await tx.feeDetails.create({
        data: {
          studentId,
          originalSchoolFee: 0,
          originalTransportFee: 0,
          originalHostelFee: 0,
          originalTotalFee: 0,
          discountedSchoolFee: 0,
          discountedTransportFee: 0,
          discountedHostelFee: 0,
          discountedTotalFee: 0,
          schoolFeePaid: 0,
          transportFeePaid: 0,
          hostelFeePaid: 0,
          totalPaid: 0,
          termDistribution: {},
          term1Due: 0,
          term2Due: 0,
          term3Due: 0,
          term1Paid: 0,
          term2Paid: 0,
          term3Paid: 0,
          totalDue: 0,
          isFullyPaid: true,
          // Keep previous year details UNCHANGED
          previousYearDetails: previousYearDetails,
          previousYearFee: previousYearFee,
          updatedBy
        }
      })

      // 5. Update student to inactive
      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: {
          isActive: false,
          isUsingSchoolTransport: false,
          isUsingSchoolHostel: false,
          updatedAt: new Date()
        }
      })

      return {
        updatedStudent,
        newFeeRecord,
        previousYearDetails,
        previousYearFee
      }
    })

    res.status(200).json({
      success: true,
      message: `Student ${student.firstName} ${student.lastName} has been marked as inactive`,
      data: {
        student: {
          id: result.updatedStudent.id,
          name: `${result.updatedStudent.firstName} ${result.updatedStudent.lastName}`.trim(),
          admissionNo: result.updatedStudent.admissionNo,
          class: mapEnumToDisplayName(result.updatedStudent.class),
          section: result.updatedStudent.section,
          isActive: result.updatedStudent.isActive
        },
        reason: reason || null,
        feeSummary: {
          previousYearDetails: result.previousYearDetails,
          previousYearFee: result.previousYearFee,
          currentYearFee: 0,
          totalDue: result.previousYearFee
        }
      }
    })

  } catch (error) {
    console.error('Inactivate student error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to inactivate student'
    })
  }
}

/**
 * @desc    Get student progression history
 * @route   GET /api/students/:studentId/progression-history
 */
export const getStudentProgressionHistory = async (req, res) => {
  try {
    const { studentId } = req.params

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        class: true,
        section: true,
        isActive: true,
        studiedClasses: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Parse studied classes
    let progressionHistory = []
    try {
      progressionHistory = typeof student.studiedClasses === 'string'
        ? JSON.parse(student.studiedClasses)
        : student.studiedClasses || []
    } catch (e) {
      progressionHistory = []
    }

    // Ensure it's an array
    if (!Array.isArray(progressionHistory)) {
      progressionHistory = []
    }

    // Sort by date (newest first)
    progressionHistory.sort((a, b) => {
      return new Date(b.actionDate) - new Date(a.actionDate)
    })

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`.trim(),
          admissionNo: student.admissionNo,
          currentClass: mapEnumToDisplayName(student.class),
          currentSection: student.section,
          isActive: student.isActive
        },
        progressionHistory,
        totalProgressionEvents: progressionHistory.length
      }
    })

  } catch (error) {
    console.error('Get student progression history error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get student progression history'
    })
  }
}