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
 * Get previous year details with proper structure
 * Each object contains ONLY that year's fee data with class/section info
 */
const getFormattedPreviousYearDetails = (previousYearDetails) => {
  if (!previousYearDetails) return []
  
  try {
    const details = typeof previousYearDetails === 'string' 
      ? JSON.parse(previousYearDetails) 
      : previousYearDetails
      
    if (!Array.isArray(details)) return []
    
    return details.map(record => ({
      academicYear: record.academicYear,
      class: record.class,
      classLabel: record.classLabel,
      section: record.section,
      originalTotalFee: record.originalTotalFee,
      discountedTotalFee: record.discountedTotalFee,
      totalPaid: record.totalPaid,
      totalDue: record.totalDue, // This is ONLY that year's due
      termDistribution: record.termDistribution,
      termPayments: record.termPayments,
      discounts: record.discounts,
      isFullyPaid: record.isFullyPaid,
      archivedAt: record.archivedAt
    }))
  } catch (e) {
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

    // Get the latest fee record
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

    // Calculate fee summary using discounted amounts
    const discountedTotalFee = currentFeeRecord.discountedSchoolFee + currentFeeRecord.discountedTransportFee + currentFeeRecord.discountedHostelFee
    const totalPaid = currentFeeRecord.schoolFeePaid + currentFeeRecord.transportFeePaid + currentFeeRecord.hostelFeePaid
    const currentYearDue = Math.max(0, discountedTotalFee - totalPaid)
    const totalDue = previousYearFee + currentYearDue

    // Parse term distribution
    const termDistribution = currentFeeRecord.termDistribution || {}

    // Prepare fee breakdown with original vs discounted and term amounts
    const feeBreakdown = {
      schoolFee: {
        original: currentFeeRecord.originalSchoolFee,
        discounted: currentFeeRecord.discountedSchoolFee,
        paid: currentFeeRecord.schoolFeePaid,
        due: Math.max(0, currentFeeRecord.discountedSchoolFee - currentFeeRecord.schoolFeePaid),
        discount: currentFeeRecord.schoolFeeDiscountApplied,
        discountAmount: currentFeeRecord.originalSchoolFee - currentFeeRecord.discountedSchoolFee,
        percentagePaid: currentFeeRecord.discountedSchoolFee > 0 
          ? ((currentFeeRecord.schoolFeePaid / currentFeeRecord.discountedSchoolFee) * 100).toFixed(2)
          : 100,
        termAmounts: {
          1: termDistribution[1]?.schoolFee || 0,
          2: termDistribution[2]?.schoolFee || 0,
          3: termDistribution[3]?.schoolFee || 0
        },
        paidPerTerm: {
          1: termDistribution[1]?.schoolFeePaid || 0,
          2: termDistribution[2]?.schoolFeePaid || 0,
          3: termDistribution[3]?.schoolFeePaid || 0
        }
      },
      transportFee: {
        original: currentFeeRecord.originalTransportFee,
        discounted: currentFeeRecord.discountedTransportFee,
        paid: currentFeeRecord.transportFeePaid,
        due: Math.max(0, currentFeeRecord.discountedTransportFee - currentFeeRecord.transportFeePaid),
        discount: currentFeeRecord.transportFeeDiscountApplied,
        discountAmount: currentFeeRecord.originalTransportFee - currentFeeRecord.discountedTransportFee,
        percentagePaid: currentFeeRecord.discountedTransportFee > 0
          ? ((currentFeeRecord.transportFeePaid / currentFeeRecord.discountedTransportFee) * 100).toFixed(2)
          : 100,
        termAmounts: {
          1: termDistribution[1]?.transportFee || 0,
          2: termDistribution[2]?.transportFee || 0,
          3: termDistribution[3]?.transportFee || 0
        },
        paidPerTerm: {
          1: termDistribution[1]?.transportFeePaid || 0,
          2: termDistribution[2]?.transportFeePaid || 0,
          3: termDistribution[3]?.transportFeePaid || 0
        }
      },
      hostelFee: {
        original: currentFeeRecord.originalHostelFee,
        discounted: currentFeeRecord.discountedHostelFee,
        paid: currentFeeRecord.hostelFeePaid,
        due: Math.max(0, currentFeeRecord.discountedHostelFee - currentFeeRecord.hostelFeePaid),
        discount: currentFeeRecord.hostelFeeDiscountApplied,
        discountAmount: currentFeeRecord.originalHostelFee - currentFeeRecord.discountedHostelFee,
        percentagePaid: currentFeeRecord.discountedHostelFee > 0
          ? ((currentFeeRecord.hostelFeePaid / currentFeeRecord.discountedHostelFee) * 100).toFixed(2)
          : 100,
        termAmounts: {
          1: termDistribution[1]?.hostelFee || 0,
          2: termDistribution[2]?.hostelFee || 0,
          3: termDistribution[3]?.hostelFee || 0
        },
        paidPerTerm: {
          1: termDistribution[1]?.hostelFeePaid || 0,
          2: termDistribution[2]?.hostelFeePaid || 0,
          3: termDistribution[3]?.hostelFeePaid || 0
        }
      }
    }

    // Term-wise breakdown with component details from distribution
    const termWiseBreakdown = {
      term1: {
        dueAmount: termDistribution[1]?.total || 0,
        paidAmount: termDistribution[1]?.totalPaid || 0,
        remainingAmount: (termDistribution[1]?.total || 0) - (termDistribution[1]?.totalPaid || 0),
        dueDate: currentFeeRecord.term1DueDate,
        status: termDistribution[1]?.status || 'Unpaid',
        components: {
          schoolFee: {
            due: termDistribution[1]?.schoolFee || 0,
            paid: termDistribution[1]?.schoolFeePaid || 0,
            remaining: (termDistribution[1]?.schoolFee || 0) - (termDistribution[1]?.schoolFeePaid || 0),
            discount: currentFeeRecord.schoolFeeDiscountApplied
          },
          transportFee: {
            due: termDistribution[1]?.transportFee || 0,
            paid: termDistribution[1]?.transportFeePaid || 0,
            remaining: (termDistribution[1]?.transportFee || 0) - (termDistribution[1]?.transportFeePaid || 0),
            discount: currentFeeRecord.transportFeeDiscountApplied
          },
          hostelFee: {
            due: termDistribution[1]?.hostelFee || 0,
            paid: termDistribution[1]?.hostelFeePaid || 0,
            remaining: (termDistribution[1]?.hostelFee || 0) - (termDistribution[1]?.hostelFeePaid || 0),
            discount: currentFeeRecord.hostelFeeDiscountApplied
          }
        }
      },
      term2: {
        dueAmount: termDistribution[2]?.total || 0,
        paidAmount: termDistribution[2]?.totalPaid || 0,
        remainingAmount: (termDistribution[2]?.total || 0) - (termDistribution[2]?.totalPaid || 0),
        dueDate: currentFeeRecord.term2DueDate,
        status: termDistribution[2]?.status || 'Unpaid',
        components: {
          schoolFee: {
            due: termDistribution[2]?.schoolFee || 0,
            paid: termDistribution[2]?.schoolFeePaid || 0,
            remaining: (termDistribution[2]?.schoolFee || 0) - (termDistribution[2]?.schoolFeePaid || 0),
            discount: currentFeeRecord.schoolFeeDiscountApplied
          },
          transportFee: {
            due: termDistribution[2]?.transportFee || 0,
            paid: termDistribution[2]?.transportFeePaid || 0,
            remaining: (termDistribution[2]?.transportFee || 0) - (termDistribution[2]?.transportFeePaid || 0),
            discount: currentFeeRecord.transportFeeDiscountApplied
          },
          hostelFee: {
            due: termDistribution[2]?.hostelFee || 0,
            paid: termDistribution[2]?.hostelFeePaid || 0,
            remaining: (termDistribution[2]?.hostelFee || 0) - (termDistribution[2]?.hostelFeePaid || 0),
            discount: currentFeeRecord.hostelFeeDiscountApplied
          }
        }
      },
      term3: {
        dueAmount: termDistribution[3]?.total || 0,
        paidAmount: termDistribution[3]?.totalPaid || 0,
        remainingAmount: (termDistribution[3]?.total || 0) - (termDistribution[3]?.totalPaid || 0),
        dueDate: currentFeeRecord.term3DueDate,
        status: termDistribution[3]?.status || 'Unpaid',
        components: {
          schoolFee: {
            due: termDistribution[3]?.schoolFee || 0,
            paid: termDistribution[3]?.schoolFeePaid || 0,
            remaining: (termDistribution[3]?.schoolFee || 0) - (termDistribution[3]?.schoolFeePaid || 0),
            discount: currentFeeRecord.schoolFeeDiscountApplied
          },
          transportFee: {
            due: termDistribution[3]?.transportFee || 0,
            paid: termDistribution[3]?.transportFeePaid || 0,
            remaining: (termDistribution[3]?.transportFee || 0) - (termDistribution[3]?.transportFeePaid || 0),
            discount: currentFeeRecord.transportFeeDiscountApplied
          },
          hostelFee: {
            due: termDistribution[3]?.hostelFee || 0,
            paid: termDistribution[3]?.hostelFeePaid || 0,
            remaining: (termDistribution[3]?.hostelFee || 0) - (termDistribution[3]?.hostelFeePaid || 0),
            discount: currentFeeRecord.hostelFeeDiscountApplied
          }
        }
      }
    }

    // Payment statistics
    const payments = student.paymentHistory
    const paymentStats = {
      totalPayments: payments.length,
      totalAmountPaid: payments.reduce((sum, p) => sum + p.totalAmount, 0),
      firstPaymentDate: payments.length > 0 ? payments[payments.length - 1].date : null,
      lastPaymentDate: payments.length > 0 ? payments[0].date : null,
      byPaymentMode: payments.reduce((acc, p) => {
        acc[p.paymentMode] = (acc[p.paymentMode] || 0) + p.totalAmount
        return acc
      }, {}),
      byTerm: {
        term1: payments.filter(p => p.termNumber === 1).reduce((sum, p) => sum + p.totalAmount, 0),
        term2: payments.filter(p => p.termNumber === 2).reduce((sum, p) => sum + p.totalAmount, 0),
        term3: payments.filter(p => p.termNumber === 3).reduce((sum, p) => sum + p.totalAmount, 0)
      }
    }

    // Format payment history
    const formattedPaymentHistory = student.paymentHistory.map(payment => ({
      id: payment.id,
      paymentId: payment.id,
      date: payment.date,
      receiptNo: payment.receiptNo,
      paymentMode: payment.paymentMode,
      termNumber: payment.termNumber,
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
      referenceNo: payment.referenceNo
    }))

    // Determine next due date
    let nextDueDate = null
    let nextTermNumber = null
    
    if (currentYearDue > 0) {
      const today = new Date()
      
      if (termWiseBreakdown.term1.remainingAmount > 0 && 
          (!termWiseBreakdown.term1.dueDate || new Date(termWiseBreakdown.term1.dueDate) > today)) {
        nextDueDate = termWiseBreakdown.term1.dueDate
        nextTermNumber = 1
      } else if (termWiseBreakdown.term2.remainingAmount > 0 &&
                (!termWiseBreakdown.term2.dueDate || new Date(termWiseBreakdown.term2.dueDate) > today)) {
        nextDueDate = termWiseBreakdown.term2.dueDate
        nextTermNumber = 2
      } else if (termWiseBreakdown.term3.remainingAmount > 0) {
        nextDueDate = termWiseBreakdown.term3.dueDate
        nextTermNumber = 3
      }
    }

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
        previousYearDetails,
        feeBreakdown,
        termWiseBreakdown,
        termDistribution,
        summary: {
          originalTotalFee: currentFeeRecord.originalTotalFee,
          discountedTotalFee,
          totalPaid,
          currentYearDue,
          previousYearFee,
          totalDue,
          totalDiscount: currentFeeRecord.originalTotalFee - discountedTotalFee,
          overallPercentagePaid: discountedTotalFee > 0 ? ((totalPaid / discountedTotalFee) * 100).toFixed(2) : 100,
          paymentStatus: totalDue === 0 ? 'Paid' : 
                        totalDue === (discountedTotalFee + previousYearFee) ? 'Unpaid' : 'Partial',
          terms: currentFeeRecord.terms
        },
        discounts: {
          studentLevel: {
            schoolFee: student.schoolFeeDiscount,
            transportFee: student.transportFeeDiscount,
            hostelFee: student.hostelFeeDiscount
          },
          applied: {
            schoolFee: currentFeeRecord.schoolFeeDiscountApplied,
            transportFee: currentFeeRecord.transportFeeDiscountApplied,
            hostelFee: currentFeeRecord.hostelFeeDiscountApplied
          }
        },
        paymentStats,
        paymentHistory: formattedPaymentHistory,
        nextDueDate,
        nextTermNumber,
        createdAt: currentFeeRecord.createdAt,
        updatedAt: currentFeeRecord.updatedAt
      }
    })
  } catch (error) {
    console.error('Get student fee details error:', error)
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

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
      paymentType, // 'previousYear', 'allPreviousYears', 'currentYear', 'term', 'full'
      previousYearIndex, // Index of previous year record to pay
      previousYearDetails: paymentPreviousYearDetails // The specific previous year data
    } = req.body

    // Validate required fields
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

    // Get student with current fee details
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

    // Create student details snapshot for payment history
    const studentDetailsSnapshot = getStudentDetailsSnapshot(student)

    const feeRecord = student.feeDetails[0]
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Fee details not found for this student'
      })
    }

    // Parse previous year details
    let previousYearDetails = getFormattedPreviousYearDetails(feeRecord.previousYearDetails)
    let previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)

    // Handle PREVIOUS YEAR PAYMENT (Single Year)
    if (paymentType === 'previousYear' && previousYearIndex !== undefined) {
      // Validate index
      if (previousYearIndex < 0 || previousYearIndex >= previousYearDetails.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid previous year index'
        })
      }

      const yearRecord = previousYearDetails[previousYearIndex]
      
      // Validate payment amount doesn't exceed this year's due
      if (totalAmount > yearRecord.totalDue) {
        return res.status(400).json({
          success: false,
          message: `Payment amount (${totalAmount}) exceeds due amount (${yearRecord.totalDue}) for ${yearRecord.academicYear}`
        })
      }

      // Deep clone the year record to avoid mutations
      const updatedYearRecord = JSON.parse(JSON.stringify(yearRecord))
      
      // Update the specific previous year record totals
      updatedYearRecord.totalPaid = (updatedYearRecord.totalPaid || 0) + totalAmount
      updatedYearRecord.totalDue = (updatedYearRecord.totalDue || 0) - totalAmount
      updatedYearRecord.isFullyPaid = updatedYearRecord.totalDue === 0

      // ===== UPDATE TERM DISTRIBUTION DETAILS FOR PREVIOUS YEAR =====
      if (updatedYearRecord.termDistribution) {
        let remainingAmount = totalAmount
        
        // Apply payment to terms in order (1,2,3)
        for (let termNum = 1; termNum <= 3; termNum++) {
          if (remainingAmount <= 0) break
          
          const termData = updatedYearRecord.termDistribution[termNum]
          if (!termData) continue
          
          // Calculate what's still due in this term
          const termSchoolDue = termData.schoolFee - (termData.schoolFeePaid || 0)
          const termTransportDue = termData.transportFee - (termData.transportFeePaid || 0)
          const termHostelDue = termData.hostelFee - (termData.hostelFeePaid || 0)
          const termTotalDue = termSchoolDue + termTransportDue + termHostelDue
          
          if (termTotalDue === 0) continue
          
          // Calculate how much to pay to this term (at most the remaining amount)
          const paymentToTerm = Math.min(remainingAmount, termTotalDue)
          
          // Distribute payment within the term based on component dues
          let termRemaining = paymentToTerm
          
          // Track which components got paid
          const paidBreakdown = {
            school: 0,
            transport: 0,
            hostel: 0
          }
          
          // Pay school fee first
          if (termRemaining > 0 && termSchoolDue > 0) {
            const schoolPayment = Math.min(termRemaining, termSchoolDue)
            termData.schoolFeePaid = (termData.schoolFeePaid || 0) + schoolPayment
            termRemaining -= schoolPayment
            paidBreakdown.school = schoolPayment
          }
          
          // Then transport fee
          if (termRemaining > 0 && termTransportDue > 0) {
            const transportPayment = Math.min(termRemaining, termTransportDue)
            termData.transportFeePaid = (termData.transportFeePaid || 0) + transportPayment
            termRemaining -= transportPayment
            paidBreakdown.transport = transportPayment
          }
          
          // Then hostel fee
          if (termRemaining > 0 && termHostelDue > 0) {
            const hostelPayment = Math.min(termRemaining, termHostelDue)
            termData.hostelFeePaid = (termData.hostelFeePaid || 0) + hostelPayment
            termRemaining -= hostelPayment
            paidBreakdown.hostel = hostelPayment
          }
          
          // Update term total paid and status
          termData.totalPaid = (termData.schoolFeePaid || 0) + (termData.transportFeePaid || 0) + (termData.hostelFeePaid || 0)
          
          // Update term status
          if (termData.totalPaid >= termData.total) {
            termData.status = 'Paid'
          } else if (termData.totalPaid > 0) {
            termData.status = 'Partial'
          } else {
            termData.status = 'Unpaid'
          }
          
          // Reduce remaining amount
          remainingAmount -= paymentToTerm
          
          console.log(`Term ${termNum} updated: Paid ₹${paymentToTerm} (School: ${paidBreakdown.school}, Transport: ${paidBreakdown.transport}, Hostel: ${paidBreakdown.hostel})`)
        }
      }

      // ===== UPDATE TERM PAYMENTS OBJECT FOR UI =====
      if (updatedYearRecord.termPayments) {
        let remainingAmount = totalAmount
        
        for (let termNum = 1; termNum <= 3; termNum++) {
          if (remainingAmount <= 0) break
          
          const termKey = `term${termNum}`
          const termData = updatedYearRecord.termPayments[termKey]
          if (!termData) continue
          
          const termDue = termData.due || 0
          const termPaid = termData.paid || 0
          const termRemaining = termDue - termPaid
          
          if (termRemaining <= 0) continue
          
          const paymentToTerm = Math.min(remainingAmount, termRemaining)
          
          // Update components if they exist
          if (termData.components) {
            let compRemaining = paymentToTerm
            
            // Update school fee component
            if (compRemaining > 0 && termData.components.schoolFee) {
              const schoolRemaining = termData.components.schoolFee.remaining || 0
              const schoolPayment = Math.min(compRemaining, schoolRemaining)
              termData.components.schoolFee.paid = (termData.components.schoolFee.paid || 0) + schoolPayment
              termData.components.schoolFee.remaining = schoolRemaining - schoolPayment
              compRemaining -= schoolPayment
            }
            
            // Update transport fee component
            if (compRemaining > 0 && termData.components.transportFee) {
              const transportRemaining = termData.components.transportFee.remaining || 0
              const transportPayment = Math.min(compRemaining, transportRemaining)
              termData.components.transportFee.paid = (termData.components.transportFee.paid || 0) + transportPayment
              termData.components.transportFee.remaining = transportRemaining - transportPayment
              compRemaining -= transportPayment
            }
            
            // Update hostel fee component
            if (compRemaining > 0 && termData.components.hostelFee) {
              const hostelRemaining = termData.components.hostelFee.remaining || 0
              const hostelPayment = Math.min(compRemaining, hostelRemaining)
              termData.components.hostelFee.paid = (termData.components.hostelFee.paid || 0) + hostelPayment
              termData.components.hostelFee.remaining = hostelRemaining - hostelPayment
              compRemaining -= hostelPayment
            }
          }
          
          // Update term totals
          termData.paid = (termData.paid || 0) + paymentToTerm
          termData.remaining = termDue - termData.paid
          
          remainingAmount -= paymentToTerm
        }
      }

      // Replace the old record with updated one
      previousYearDetails[previousYearIndex] = updatedYearRecord

      // Remove fully paid years if you want (optional)
      // previousYearDetails = previousYearDetails.filter(year => !year.isFullyPaid)

      // Recalculate total previous year fee
      previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)

      // Use transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        // Create payment record with student details snapshot
        const payment = await tx.paymentHistory.create({
          data: {
            studentId,
            studentDetails: studentDetailsSnapshot, // Add snapshot
            date: new Date(),
            schoolFeePaid: totalAmount, // For previous years, all goes to school fee in summary
            transportFeePaid: 0,
            hostelFeePaid: 0,
            totalAmount,
            receiptNo: customReceiptNo || generateReceiptNo(),
            paymentMode,
            description: description || `Payment for ${yearRecord.academicYear}`,
            chequeNo,
            bankName,
            transactionId,
            referenceNo,
            termNumber: providedTermNumber || null,
            receivedBy,
            metadata: {
              paymentType: 'previousYear',
              academicYear: yearRecord.academicYear,
              previousYearIndex,
              distribution: {
                // Store how the payment was distributed across terms
                termDistribution: updatedYearRecord.termDistribution
              }
            }
          }
        })

        // Update fee details with modified previous year records
        const updatedFeeRecord = await tx.feeDetails.update({
          where: { id: feeRecord.id },
          data: {
            previousYearDetails: previousYearDetails,
            previousYearFee: previousYearFee,
            // Update total due calculation
            totalDue: previousYearFee + (feeRecord.discountedSchoolFee + feeRecord.discountedTransportFee + feeRecord.discountedHostelFee - feeRecord.totalPaid),
            updatedBy: receivedBy
          }
        })

        return { payment, updatedFeeRecord, previousYearDetails, previousYearFee, updatedYearRecord }
      })

      // Prepare response with detailed term information
      const discountedTotalFee = feeRecord.discountedSchoolFee + feeRecord.discountedTransportFee + feeRecord.discountedHostelFee
      const currentYearDue = discountedTotalFee - feeRecord.totalPaid
      
      return res.status(201).json({
        success: true,
        message: 'Previous year payment processed successfully',
        data: {
          paymentId: result.payment.id,
          receiptNo: result.payment.receiptNo,
          date: result.payment.date,
          totalAmount: result.payment.totalAmount,
          studentDetails: result.payment.studentDetails,
          breakdown: {
            schoolFeePaid: result.payment.schoolFeePaid,
            transportFeePaid: result.payment.transportFeePaid,
            hostelFeePaid: result.payment.hostelFeePaid
          },
          paymentType: 'previousYear',
          academicYear: yearRecord.academicYear,
          previousYearDetails: result.previousYearDetails,
          updatedYearRecord: result.updatedYearRecord, // Send the updated record with term details
          previousYearFee: result.previousYearFee,
          currentYearDue,
          totalDue: result.previousYearFee + currentYearDue,
          receiptUrl: `/api/fee/receipt/${result.payment.id}`
        }
      })
    }

    // Handle ALL PREVIOUS YEARS PAYMENT
    if (paymentType === 'allPreviousYears') {
      // Validate payment amount doesn't exceed total previous year due
      if (totalAmount > previousYearFee) {
        return res.status(400).json({
          success: false,
          message: `Payment amount (${totalAmount}) exceeds total previous years due (${previousYearFee})`
        })
      }

      let remainingAmount = totalAmount
      const updatedPreviousYears = []
      const distributionLog = []

      // Distribute payment across previous years in chronological order
      for (let i = 0; i < previousYearDetails.length; i++) {
        if (remainingAmount <= 0) {
          updatedPreviousYears.push(previousYearDetails[i])
          continue
        }
        
        const yearRecord = JSON.parse(JSON.stringify(previousYearDetails[i]))
        if (yearRecord.totalDue <= 0) {
          updatedPreviousYears.push(yearRecord)
          continue
        }

        const paymentForThisYear = Math.min(remainingAmount, yearRecord.totalDue)
        
        // Update year totals
        yearRecord.totalPaid = (yearRecord.totalPaid || 0) + paymentForThisYear
        yearRecord.totalDue = (yearRecord.totalDue || 0) - paymentForThisYear
        yearRecord.isFullyPaid = yearRecord.totalDue === 0

        // Update term distribution for this year
        if (yearRecord.termDistribution) {
          let yearRemaining = paymentForThisYear
          const yearDistribution = []
          
          for (let termNum = 1; termNum <= 3; termNum++) {
            if (yearRemaining <= 0) break
            
            const termData = yearRecord.termDistribution[termNum]
            if (!termData) continue
            
            const termSchoolDue = termData.schoolFee - (termData.schoolFeePaid || 0)
            const termTransportDue = termData.transportFee - (termData.transportFeePaid || 0)
            const termHostelDue = termData.hostelFee - (termData.hostelFeePaid || 0)
            const termTotalDue = termSchoolDue + termTransportDue + termHostelDue
            
            if (termTotalDue === 0) continue
            
            const paymentToTerm = Math.min(yearRemaining, termTotalDue)
            let termRemaining = paymentToTerm
            
            // Pay school fee
            if (termRemaining > 0 && termSchoolDue > 0) {
              const schoolPayment = Math.min(termRemaining, termSchoolDue)
              termData.schoolFeePaid = (termData.schoolFeePaid || 0) + schoolPayment
              termRemaining -= schoolPayment
            }
            
            // Pay transport fee
            if (termRemaining > 0 && termTransportDue > 0) {
              const transportPayment = Math.min(termRemaining, termTransportDue)
              termData.transportFeePaid = (termData.transportFeePaid || 0) + transportPayment
              termRemaining -= transportPayment
            }
            
            // Pay hostel fee
            if (termRemaining > 0 && termHostelDue > 0) {
              const hostelPayment = Math.min(termRemaining, termHostelDue)
              termData.hostelFeePaid = (termData.hostelFeePaid || 0) + hostelPayment
              termRemaining -= hostelPayment
            }
            
            // Update term totals
            termData.totalPaid = (termData.schoolFeePaid || 0) + (termData.transportFeePaid || 0) + (termData.hostelFeePaid || 0)
            
            if (termData.totalPaid >= termData.total) {
              termData.status = 'Paid'
            } else if (termData.totalPaid > 0) {
              termData.status = 'Partial'
            }
            
            yearRemaining -= paymentToTerm
            yearDistribution.push({
              term: termNum,
              amount: paymentToTerm
            })
          }
          
          distributionLog.push({
            academicYear: yearRecord.academicYear,
            amount: paymentForThisYear,
            termDistribution: yearDistribution
          })
        }

        // Update termPayments for UI
        if (yearRecord.termPayments) {
          let yearRemaining = paymentForThisYear
          
          for (let termNum = 1; termNum <= 3; termNum++) {
            if (yearRemaining <= 0) break
            
            const termKey = `term${termNum}`
            const termData = yearRecord.termPayments[termKey]
            if (!termData) continue
            
            const termDue = termData.due || 0
            const termPaid = termData.paid || 0
            const termRemaining = termDue - termPaid
            
            if (termRemaining <= 0) continue
            
            const paymentToTerm = Math.min(yearRemaining, termRemaining)
            
            if (termData.components) {
              let compRemaining = paymentToTerm
              
              if (compRemaining > 0 && termData.components.schoolFee) {
                const schoolRemaining = termData.components.schoolFee.remaining || 0
                const schoolPayment = Math.min(compRemaining, schoolRemaining)
                termData.components.schoolFee.paid = (termData.components.schoolFee.paid || 0) + schoolPayment
                termData.components.schoolFee.remaining = schoolRemaining - schoolPayment
                compRemaining -= schoolPayment
              }
              
              if (compRemaining > 0 && termData.components.transportFee) {
                const transportRemaining = termData.components.transportFee.remaining || 0
                const transportPayment = Math.min(compRemaining, transportRemaining)
                termData.components.transportFee.paid = (termData.components.transportFee.paid || 0) + transportPayment
                termData.components.transportFee.remaining = transportRemaining - transportPayment
                compRemaining -= transportPayment
              }
              
              if (compRemaining > 0 && termData.components.hostelFee) {
                const hostelRemaining = termData.components.hostelFee.remaining || 0
                const hostelPayment = Math.min(compRemaining, hostelRemaining)
                termData.components.hostelFee.paid = (termData.components.hostelFee.paid || 0) + hostelPayment
                termData.components.hostelFee.remaining = hostelRemaining - hostelPayment
                compRemaining -= hostelPayment
              }
            }
            
            termData.paid = (termData.paid || 0) + paymentToTerm
            termData.remaining = termDue - termData.paid
            
            yearRemaining -= paymentToTerm
          }
        }

        updatedPreviousYears.push(yearRecord)
        remainingAmount -= paymentForThisYear
      }

      previousYearDetails = updatedPreviousYears
      previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)

      // Use transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        // Create payment record with student details snapshot
        const payment = await tx.paymentHistory.create({
          data: {
            studentId,
            studentDetails: studentDetailsSnapshot, // Add snapshot
            date: new Date(),
            schoolFeePaid: totalAmount,
            transportFeePaid: 0,
            hostelFeePaid: 0,
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
              distribution: distributionLog
            }
          }
        })

        // Update fee details with modified previous year records
        const updatedFeeRecord = await tx.feeDetails.update({
          where: { id: feeRecord.id },
          data: {
            previousYearDetails: previousYearDetails,
            previousYearFee: previousYearFee,
            totalDue: previousYearFee + (feeRecord.discountedSchoolFee + feeRecord.discountedTransportFee + feeRecord.discountedHostelFee - feeRecord.totalPaid),
            updatedBy: receivedBy
          }
        })

        return { payment, updatedFeeRecord, previousYearDetails, previousYearFee }
      })

      const discountedTotalFee = feeRecord.discountedSchoolFee + feeRecord.discountedTransportFee + feeRecord.discountedHostelFee
      const currentYearDue = discountedTotalFee - feeRecord.totalPaid

      return res.status(201).json({
        success: true,
        message: 'Previous years payment processed successfully',
        data: {
          paymentId: result.payment.id,
          receiptNo: result.payment.receiptNo,
          date: result.payment.date,
          totalAmount: result.payment.totalAmount,
          studentDetails: result.payment.studentDetails,
          breakdown: {
            schoolFeePaid: result.payment.schoolFeePaid,
            transportFeePaid: result.payment.transportFeePaid,
            hostelFeePaid: result.payment.hostelFeePaid
          },
          paymentType: 'allPreviousYears',
          previousYearDetails: result.previousYearDetails,
          previousYearFee: result.previousYearFee,
          currentYearDue,
          totalDue: result.previousYearFee + currentYearDue,
          receiptUrl: `/api/fee/receipt/${result.payment.id}`
        }
      })
    }

    // ========== REGULAR PAYMENT HANDLING (CURRENT YEAR) ==========
    // Parse term distribution
    let termDistribution = JSON.parse(JSON.stringify(feeRecord.termDistribution || {}))

    // If paymentType is 'currentYear', distribute across all terms
    if (paymentType === 'currentYear') {
      // Distribute payment across all terms based on remaining dues
      let remainingSchoolFee = schoolFeePaid
      let remainingTransportFee = transportFeePaid
      let remainingHostelFee = hostelFeePaid
      
      for (let termNum = 1; termNum <= 3; termNum++) {
        if (!termDistribution[termNum]) continue
        
        const termData = termDistribution[termNum]
        
        const schoolFeeDue = termData.schoolFee - (termData.schoolFeePaid || 0)
        const transportFeeDue = termData.transportFee - (termData.transportFeePaid || 0)
        const hostelFeeDue = termData.hostelFee - (termData.hostelFeePaid || 0)
        
        const schoolFeeToPay = Math.min(remainingSchoolFee, schoolFeeDue)
        const transportFeeToPay = Math.min(remainingTransportFee, transportFeeDue)
        const hostelFeeToPay = Math.min(remainingHostelFee, hostelFeeDue)
        
        if (schoolFeeToPay > 0 || transportFeeToPay > 0 || hostelFeeToPay > 0) {
          termDistribution = updateTermPaidAmounts(
            termDistribution,
            termNum,
            schoolFeeToPay,
            transportFeeToPay,
            hostelFeeToPay
          )
          
          remainingSchoolFee -= schoolFeeToPay
          remainingTransportFee -= transportFeeToPay
          remainingHostelFee -= hostelFeeToPay
        }
        
        if (remainingSchoolFee === 0 && remainingTransportFee === 0 && remainingHostelFee === 0) {
          break
        }
      }
      
      // Check if any payment couldn't be allocated
      if (remainingSchoolFee > 0 || remainingTransportFee > 0 || remainingHostelFee > 0) {
        const discountedTotalFee = feeRecord.discountedSchoolFee + feeRecord.discountedTransportFee + feeRecord.discountedHostelFee
        const totalPaid = feeRecord.schoolFeePaid + feeRecord.transportFeePaid + feeRecord.hostelFeePaid
        const totalDue = discountedTotalFee - totalPaid
        
        return res.status(400).json({
          success: false,
          message: `Payment amount exceeds total due. Total due: ₹${totalDue}, Payment: ₹${totalAmount}. Unallocated: School: ${remainingSchoolFee}, Transport: ${remainingTransportFee}, Hostel: ${remainingHostelFee}`
        })
      }
    }
    // If term number is provided, validate and process single term payment
    else if (providedTermNumber) {
      // Validate that the term exists in distribution
      if (!termDistribution[providedTermNumber]) {
        return res.status(400).json({
          success: false,
          message: `Invalid term number: ${providedTermNumber}`
        })
      }

      // Validate payment amounts don't exceed term due amounts
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

      // Update single term
      termDistribution = updateTermPaidAmounts(
        termDistribution,
        providedTermNumber,
        schoolFeePaid,
        transportFeePaid,
        hostelFeePaid
      )
    } else {
      // FULL PAYMENT - Distribute across terms based on remaining dues
      
      // Calculate remaining amounts per component across all terms
      let remainingSchoolFee = schoolFeePaid
      let remainingTransportFee = transportFeePaid
      let remainingHostelFee = hostelFeePaid
      
      // Process terms in order (1, 2, 3)
      for (let termNum = 1; termNum <= 3; termNum++) {
        if (!termDistribution[termNum]) continue
        
        const termData = termDistribution[termNum]
        
        // Calculate due amounts for this term
        const schoolFeeDue = termData.schoolFee - (termData.schoolFeePaid || 0)
        const transportFeeDue = termData.transportFee - (termData.transportFeePaid || 0)
        const hostelFeeDue = termData.hostelFee - (termData.hostelFeePaid || 0)
        
        // Apply payments to this term (as much as possible)
        const schoolFeeToPay = Math.min(remainingSchoolFee, schoolFeeDue)
        const transportFeeToPay = Math.min(remainingTransportFee, transportFeeDue)
        const hostelFeeToPay = Math.min(remainingHostelFee, hostelFeeDue)
        
        if (schoolFeeToPay > 0 || transportFeeToPay > 0 || hostelFeeToPay > 0) {
          // Update term distribution
          termDistribution = updateTermPaidAmounts(
            termDistribution,
            termNum,
            schoolFeeToPay,
            transportFeeToPay,
            hostelFeeToPay
          )
          
          // Reduce remaining amounts
          remainingSchoolFee -= schoolFeeToPay
          remainingTransportFee -= transportFeeToPay
          remainingHostelFee -= hostelFeeToPay
        }
        
        // If all payments are allocated, break
        if (remainingSchoolFee === 0 && remainingTransportFee === 0 && remainingHostelFee === 0) {
          break
        }
      }
      
      // Check if any payment couldn't be allocated
      if (remainingSchoolFee > 0 || remainingTransportFee > 0 || remainingHostelFee > 0) {
        return res.status(400).json({
          success: false,
          message: `Payment amount exceeds total due. Unallocated: School: ${remainingSchoolFee}, Transport: ${remainingTransportFee}, Hostel: ${remainingHostelFee}`
        })
      }
    }

    // Generate receipt number
    const receiptNo = customReceiptNo || generateReceiptNo()

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record with student details snapshot
      const payment = await tx.paymentHistory.create({
        data: {
          studentId,
          studentDetails: studentDetailsSnapshot, // Add snapshot
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
          referenceNo,
          termNumber: providedTermNumber || null,
          receivedBy,
          metadata: {
            paymentType: providedTermNumber ? 'term' : (paymentType === 'currentYear' ? 'currentYear' : 'full')
          }
        }
      })

      // Recalculate overall totals from updated distribution
      const totals = recalculateOverallTotals(termDistribution)

      // Calculate current year due (only current year's fee)
      const discountedTotalFee = feeRecord.discountedSchoolFee + feeRecord.discountedTransportFee + feeRecord.discountedHostelFee
      const currentYearDue = discountedTotalFee - totals.totalPaid

      // Update fee details
      const updatedFeeRecord = await tx.feeDetails.update({
        where: { id: feeRecord.id },
        data: {
          schoolFeePaid: totals.schoolFeePaid,
          transportFeePaid: totals.transportFeePaid,
          hostelFeePaid: totals.hostelFeePaid,
          totalPaid: totals.totalPaid,
          termDistribution: termDistribution,
          // Update term-wise paid amounts (for backward compatibility)
          term1Paid: termDistribution[1]?.totalPaid || 0,
          term2Paid: termDistribution[2]?.totalPaid || 0,
          term3Paid: termDistribution[3]?.totalPaid || 0,
          // totalDue should be ONLY current year's due
          totalDue: currentYearDue,
          isFullyPaid: currentYearDue === 0,
          updatedBy: receivedBy
        }
      })

      return { payment, updatedFeeRecord, termDistribution, currentYearDue }
    })

    // Prepare term details for response
    const termDetails = {}
    for (let i = 1; i <= 3; i++) {
      if (result.termDistribution[i]) {
        const term = result.termDistribution[i]
        termDetails[`term${i}`] = {
          schoolFee: {
            due: term.schoolFee,
            paid: term.schoolFeePaid,
            remaining: term.schoolFee - term.schoolFeePaid
          },
          transportFee: {
            due: term.transportFee,
            paid: term.transportFeePaid,
            remaining: term.transportFee - term.transportFeePaid
          },
          hostelFee: {
            due: term.hostelFee,
            paid: term.hostelFeePaid,
            remaining: term.hostelFee - term.hostelFeePaid
          },
          totalDue: term.total,
          totalPaid: term.totalPaid,
          remaining: term.total - term.totalPaid,
          status: term.status
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        paymentId: result.payment.id,
        receiptNo: result.payment.receiptNo,
        date: result.payment.date,
        totalAmount: result.payment.totalAmount,
        studentDetails: result.payment.studentDetails,
        breakdown: {
          schoolFeePaid: result.payment.schoolFeePaid,
          transportFeePaid: result.payment.transportFeePaid,
          hostelFeePaid: result.payment.hostelFeePaid
        },
        termNumber: result.payment.termNumber,
        termDetails,
        previousYearFee,
        currentYearDue: result.currentYearDue,
        totalDue: previousYearFee + result.currentYearDue,
        receiptUrl: `/api/fee/receipt/${result.payment.id}`
      }
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
    const discountedTotalFee = feeRecord.discountedSchoolFee + feeRecord.discountedTransportFee + feeRecord.discountedHostelFee
    const termDistribution = feeRecord.termDistribution || {}

    // Parse previous year details
    const previousYearDetails = getFormattedPreviousYearDetails(feeRecord.previousYearDetails)
    const previousYearFee = calculateTotalPreviousYearPending(previousYearDetails)

    const termData = termDistribution[payment.termNumber] || {}

    // Check if this was a previous year payment
    const isPreviousYearPayment = payment.metadata?.paymentType === 'previousYear' || 
                                  payment.metadata?.paymentType === 'allPreviousYears'

    let previousYearInfo = null
    if (isPreviousYearPayment && payment.metadata?.academicYear) {
      previousYearInfo = {
        academicYear: payment.metadata.academicYear,
        paymentType: payment.metadata.paymentType
      }
    }

    // Use student snapshot if available, otherwise use current student data
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
      isHistoricalData: !!studentSnapshot.firstName // Flag to indicate if this is historical data
    }

    const receiptData = {
      receiptNo: payment.receiptNo,
      date: payment.date,
      student: studentData,
      payment: {
        id: payment.id,
        mode: payment.paymentMode,
        termNumber: payment.termNumber,
        isPreviousYear: isPreviousYearPayment,
        previousYearInfo,
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