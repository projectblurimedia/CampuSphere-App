const mongoose = require('mongoose')
const Student = require('../models/Student')
const PDFDocument = require('pdfkit')

// Helper function to format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Helper function to map class number to class name
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

// Generate unique receipt number
const generateReceiptNo = () => {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `RCPT-${year}${month}${day}-${random}`
}

// Generate unique payment ID
const generatePaymentId = () => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `PAY-${timestamp}-${random}`.toUpperCase()
}

// Round number to nearest integer
const roundAmount = (amount) => {
  return Math.round(parseFloat(amount) || 0)
}

// Helper function to split amount efficiently across terms
const splitAmountEfficiently = (totalAmount, numTerms) => {
  if (numTerms <= 0) return {}
  
  const baseAmount = Math.floor(totalAmount / numTerms)
  const remainder = totalAmount % numTerms
  
  const distribution = {}
  for (let term = 1; term <= numTerms; term++) {
    distribution[term] = baseAmount
  }
  
  // Distribute remainder evenly starting from first term
  for (let term = 1; term <= remainder; term++) {
    distribution[term] += 1
  }
  
  return distribution
}

// Distribute payment across terms intelligently with efficient splitting
const distributePaymentAcrossTerms = (paymentAmount, totalFee, totalTerms, existingPaymentsByTerm) => {
  const distribution = {}
  let remaining = roundAmount(paymentAmount)
  
  // Calculate how much should be paid per term efficiently
  const termDistribution = splitAmountEfficiently(totalFee, totalTerms)
  
  // Calculate remaining due for each term
  const remainingDuePerTerm = {}
  for (let term = 1; term <= totalTerms; term++) {
    const alreadyPaid = existingPaymentsByTerm[term] || 0
    const termDue = termDistribution[term] || 0
    remainingDuePerTerm[term] = Math.max(0, termDue - alreadyPaid)
  }
  
  // Sort terms by remaining due (descending)
  const sortedTerms = Object.entries(remainingDuePerTerm)
    .filter(([_, due]) => due > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => parseInt(term))
  
  // Distribute payment across terms with due amounts
  for (const term of sortedTerms) {
    if (remaining <= 0) break
    
    const termDue = remainingDuePerTerm[term]
    const payThisTerm = Math.min(remaining, termDue)
    
    if (payThisTerm > 0) {
      distribution[term] = roundAmount(payThisTerm)
      remaining -= payThisTerm
    }
  }
  
  // If there's still remaining (shouldn't happen with validation)
  if (remaining > 0) {
    // Add to the term with least payment to minimize imbalance
    const termsWithDistribution = Object.keys(distribution).map(Number)
    if (termsWithDistribution.length > 0) {
      const smallestTerm = termsWithDistribution.reduce((a, b) => 
        distribution[a] < distribution[b] ? a : b
      )
      distribution[smallestTerm] = roundAmount(distribution[smallestTerm] + remaining)
    } else {
      // If no distribution yet, add to first term
      distribution[1] = remaining
    }
  }
  
  return distribution
}

// ==================== GET FEE DETAILS WITH EFFICIENT SPLITTING ====================
exports.getStudentFeeDetails = async (req, res) => {
  try {
    const { id } = req.params
    const { academicYear } = req.query

    const student = await Student.findById(id)
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Determine which academic year to use
    const targetAcademicYear = academicYear || student.academicYear
    
    // Find fee record for the academic year
    const feeRecord = student.feeDetails.find(fd => fd.academicYear === targetAcademicYear)
    
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: `Fee details not found for academic year ${targetAcademicYear}`
      })
    }

    // Get payments for the academic year
    const payments = student.paymentHistory
      .filter(p => p.academicYear === targetAcademicYear && p.status === 'Completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    // Round all fee amounts
    const schoolFee = roundAmount(feeRecord.schoolFee)
    const transportFee = roundAmount(feeRecord.transportFee)
    const hostelFee = roundAmount(feeRecord.hostelFee)
    const totalFee = roundAmount(feeRecord.totalFee)
    const totalTerms = feeRecord.terms || 3
    
    // Calculate component-wise totals with efficient splitting
    const components = {}
    const componentKeys = ['schoolFee', 'transportFee', 'hostelFee']
    
    componentKeys.forEach(key => {
      const total = feeRecord[key] || 0
      if (total > 0) {
        // Split efficiently across terms
        const termDistribution = splitAmountEfficiently(total, totalTerms)
        const termAmounts = Object.values(termDistribution)
        
        const paid = feeRecord[`${key}Paid`] || 0
        const due = Math.max(0, total - paid)
        const percentagePaid = total > 0 ? roundAmount((paid / total * 100)) : 0
        
        components[key] = {
          total: roundAmount(total),
          termDistribution: termDistribution,
          termAmount: roundAmount(total / totalTerms),
          paid: roundAmount(paid),
          due: roundAmount(due),
          percentagePaid: percentagePaid.toFixed(2),
          discount: feeRecord[`${key}DiscountApplied`] || 0
        }
      }
    })

    // Calculate term-wise details with efficient splitting
    const termDetails = []
    
    // Calculate total per term efficiently
    const totalPerTerm = {}
    
    componentKeys.forEach(key => {
      if (feeRecord[key] > 0) {
        const distribution = splitAmountEfficiently(feeRecord[key], totalTerms)
        Object.entries(distribution).forEach(([term, amount]) => {
          const termNum = parseInt(term)
          totalPerTerm[termNum] = (totalPerTerm[termNum] || 0) + amount
        })
      }
    })
    
    for (let term = 1; term <= totalTerms; term++) {
      const termDueAmount = totalPerTerm[term] || 0
      let termPaidAmount = 0
      
      componentKeys.forEach(key => {
        if (feeRecord[key] > 0) {
          // Calculate paid amount for this term from payment history
          const paidThisTerm = payments
            .filter(p => {
              const description = p.description || ''
              return description.includes(`Term ${term}`) && p[`${key}Paid`] > 0
            })
            .reduce((sum, p) => sum + p[`${key}Paid`], 0)
          
          termPaidAmount += roundAmount(paidThisTerm)
        }
      })
      
      const termRemainingAmount = Math.max(0, termDueAmount - termPaidAmount)
      const status = termRemainingAmount === 0 ? 'Paid' : 
                    termPaidAmount > 0 ? 'Partial' : 'Unpaid'
      
      termDetails.push({
        term: term,
        dueAmount: roundAmount(termDueAmount),
        paidAmount: roundAmount(termPaidAmount),
        remainingAmount: roundAmount(termRemainingAmount),
        status: status
      })
    }

    // Calculate overall summary with rounding
    const totalPaid = roundAmount(feeRecord.totalPaid)
    const totalDue = Math.max(0, totalFee - totalPaid)
    const overallPercentagePaid = totalFee > 0 ? roundAmount((totalPaid / totalFee * 100)) : 0

    // Find next due term
    const nextTerm = termDetails.find(term => term.remainingAmount > 0)
    const nextDueDate = feeRecord.installmentDueDates?.find(date => date.term === nextTerm?.term)?.dueDate

    res.status(200).json({
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
          academicYear: student.academicYear,
          studentType: student.studentType
        },
        feeBreakdown: {
          components: components,
          summary: {
            totalFee: roundAmount(totalFee),
            totalPaid: roundAmount(totalPaid),
            totalDue: roundAmount(totalDue),
            overallPercentagePaid: overallPercentagePaid.toFixed(2)
          }
        },
        feeTerms: {
          totalTerms: totalTerms,
          termDetails: termDetails
        },
        paymentHistory: payments.slice(0, 10).map(p => ({
          paymentId: p.paymentId,
          receiptNo: p.receiptNo,
          date: p.date,
          schoolFeePaid: roundAmount(p.schoolFeePaid),
          transportFeePaid: roundAmount(p.transportFeePaid),
          hostelFeePaid: roundAmount(p.hostelFeePaid),
          totalAmount: roundAmount(p.totalAmount),
          paymentMode: p.paymentMode,
          description: p.description,
          status: p.status
        })),
        currentAcademicYear: targetAcademicYear,
        feeRecordUpdatedAt: feeRecord.updatedAt,
        nextDueDate: nextDueDate,
        nextTermNumber: nextTerm?.term
      }
    })

  } catch (error) {
    console.error('Get fee details error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      })
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get fee details'
    })
  }
}

// ==================== PROCESS PAYMENT WITH EFFICIENT TERM DISTRIBUTION ====================
exports.processPayment = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { id } = req.params
    const {
      academicYear,
      schoolFeePaid = 0,
      transportFeePaid = 0,
      hostelFeePaid = 0,
      description = '',
      paymentMode = 'Cash',
      chequeNo = '',
      bankName = '',
      transactionId = '',
      notes = '',
      term = null,
      customReceiptNo,
      customPaymentId
    } = req.body

    const receivedBy = req.user?.name || req.body.receivedBy || 'Admin'

    // Validate required fields
    if (!academicYear) {
      await session.abortTransaction()
      session.endSession()
      return res.status(400).json({
        success: false,
        message: 'Academic year is required'
      })
    }

    // Round all payment amounts
    const schoolFeeToPay = roundAmount(schoolFeePaid)
    const transportFeeToPay = roundAmount(transportFeePaid)
    const hostelFeeToPay = roundAmount(hostelFeePaid)
    const totalToPay = schoolFeeToPay + transportFeeToPay + hostelFeeToPay

    if (totalToPay <= 0) {
      await session.abortTransaction()
      session.endSession()
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      })
    }

    // Find student with session
    const student = await Student.findById(id).session(session)
    
    if (!student) {
      await session.abortTransaction()
      session.endSession()
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Get fee record
    const feeRecord = student.feeDetails.find(fd => fd.academicYear === academicYear)
    
    if (!feeRecord) {
      await session.abortTransaction()
      session.endSession()
      return res.status(404).json({
        success: false,
        message: `Fee details not found for academic year ${academicYear}`
      })
    }

    // Round all fee amounts
    const schoolFee = roundAmount(feeRecord.schoolFee)
    const transportFee = roundAmount(feeRecord.transportFee)
    const hostelFee = roundAmount(feeRecord.hostelFee)
    const totalFee = roundAmount(feeRecord.totalFee)
    const totalTerms = feeRecord.terms || 3

    // Calculate current paid amounts
    const currentSchoolPaid = roundAmount(feeRecord.schoolFeePaid)
    const currentTransportPaid = roundAmount(feeRecord.transportFeePaid)
    const currentHostelPaid = roundAmount(feeRecord.hostelFeePaid)

    // Calculate remaining due amounts
    const schoolFeeDue = Math.max(0, schoolFee - currentSchoolPaid)
    const transportFeeDue = Math.max(0, transportFee - currentTransportPaid)
    const hostelFeeDue = Math.max(0, hostelFee - currentHostelPaid)

    // Validate payments don't exceed due amounts
    if (schoolFeeToPay > schoolFeeDue) {
      await session.abortTransaction()
      session.endSession()
      return res.status(400).json({
        success: false,
        message: `School fee payment (${schoolFeeToPay}) exceeds due amount (${schoolFeeDue})`
      })
    }

    if (transportFeeToPay > transportFeeDue) {
      await session.abortTransaction()
      session.endSession()
      return res.status(400).json({
        success: false,
        message: `Transport fee payment (${transportFeeToPay}) exceeds due amount (${transportFeeDue})`
      })
    }

    if (hostelFeeToPay > hostelFeeDue) {
      await session.abortTransaction()
      session.endSession()
      return res.status(400).json({
        success: false,
        message: `Hostel fee payment (${hostelFeeToPay}) exceeds due amount (${hostelFeeDue})`
      })
    }

    // Get existing payments by term for distribution
    const existingSchoolPaymentsByTerm = {}
    const existingTransportPaymentsByTerm = {}
    const existingHostelPaymentsByTerm = {}
    
    if (!term) {
      // Calculate how much is already paid per term for each component
      for (let t = 1; t <= totalTerms; t++) {
        const termPayments = student.paymentHistory.filter(p => 
          p.academicYear === academicYear && p.description?.includes(`Term ${t}`)
        )
        
        existingSchoolPaymentsByTerm[t] = termPayments.reduce((sum, p) => sum + roundAmount(p.schoolFeePaid), 0)
        existingTransportPaymentsByTerm[t] = termPayments.reduce((sum, p) => sum + roundAmount(p.transportFeePaid), 0)
        existingHostelPaymentsByTerm[t] = termPayments.reduce((sum, p) => sum + roundAmount(p.hostelFeePaid), 0)
      }
    }

    // Generate payment ID and receipt number
    const paymentId = customPaymentId || generatePaymentId()
    const receiptNo = customReceiptNo || generateReceiptNo()

    // Process payments
    const paymentRecords = []
    
    // If specific term is provided, create one payment record
    if (term) {
      const paymentRecord = {
        paymentId,
        academicYear,
        date: new Date(),
        schoolFeePaid: schoolFeeToPay,
        transportFeePaid: transportFeeToPay,
        hostelFeePaid: hostelFeeToPay,
        totalAmount: totalToPay,
        receiptNo,
        paymentMode,
        description: `Term ${term} Payment` + (description ? ` - ${description}` : ''),
        chequeNo,
        bankName,
        transactionId,
        receivedBy,
        status: 'Completed',
        notes,
        createdAt: new Date()
      }

      paymentRecords.push(paymentRecord)
    } else {
      // Distribute payments across terms efficiently
      let paymentCounter = 1
      
      // Distribute school fee across terms with efficient splitting
      if (schoolFeeToPay > 0) {
        const termDistribution = distributePaymentAcrossTerms(
          schoolFeeToPay,
          schoolFee,
          totalTerms,
          existingSchoolPaymentsByTerm
        )
        
        for (const [termNum, amount] of Object.entries(termDistribution)) {
          if (amount > 0) {
            const termPaymentId = `${paymentId}-S${termNum}`
            paymentRecords.push({
              paymentId: termPaymentId,
              academicYear,
              date: new Date(),
              schoolFeePaid: roundAmount(amount),
              transportFeePaid: 0,
              hostelFeePaid: 0,
              totalAmount: roundAmount(amount),
              receiptNo: `${receiptNo}-S${termNum}`,
              paymentMode,
              description: `Term ${termNum} Payment - School Fee`,
              chequeNo,
              bankName,
              transactionId: transactionId ? `${transactionId}-S${termNum}` : '',
              receivedBy,
              status: 'Completed',
              notes: `Part of full payment ${receiptNo}: ${notes || 'School Fee Payment'}`,
              createdAt: new Date()
            })
          }
        }
      }
      
      // Distribute transport fee across terms with efficient splitting
      if (transportFeeToPay > 0) {
        const termDistribution = distributePaymentAcrossTerms(
          transportFeeToPay,
          transportFee,
          totalTerms,
          existingTransportPaymentsByTerm
        )
        
        for (const [termNum, amount] of Object.entries(termDistribution)) {
          if (amount > 0) {
            const termPaymentId = `${paymentId}-T${termNum}`
            paymentRecords.push({
              paymentId: termPaymentId,
              academicYear,
              date: new Date(),
              schoolFeePaid: 0,
              transportFeePaid: roundAmount(amount),
              hostelFeePaid: 0,
              totalAmount: roundAmount(amount),
              receiptNo: `${receiptNo}-T${termNum}`,
              paymentMode,
              description: `Term ${termNum} Payment - Transport Fee`,
              chequeNo,
              bankName,
              transactionId: transactionId ? `${transactionId}-T${termNum}` : '',
              receivedBy,
              status: 'Completed',
              notes: `Part of full payment ${receiptNo}: ${notes || 'Transport Fee Payment'}`,
              createdAt: new Date()
            })
          }
        }
      }
      
      // Distribute hostel fee across terms with efficient splitting
      if (hostelFeeToPay > 0) {
        const termDistribution = distributePaymentAcrossTerms(
          hostelFeeToPay,
          hostelFee,
          totalTerms,
          existingHostelPaymentsByTerm
        )
        
        for (const [termNum, amount] of Object.entries(termDistribution)) {
          if (amount > 0) {
            const termPaymentId = `${paymentId}-H${termNum}`
            paymentRecords.push({
              paymentId: termPaymentId,
              academicYear,
              date: new Date(),
              schoolFeePaid: 0,
              transportFeePaid: 0,
              hostelFeePaid: roundAmount(amount),
              totalAmount: roundAmount(amount),
              receiptNo: `${receiptNo}-H${termNum}`,
              paymentMode,
              description: `Term ${termNum} Payment - Hostel Fee`,
              chequeNo,
              bankName,
              transactionId: transactionId ? `${transactionId}-H${termNum}` : '',
              receivedBy,
              status: 'Completed',
              notes: `Part of full payment ${receiptNo}: ${notes || 'Hostel Fee Payment'}`,
              createdAt: new Date()
            })
          }
        }
      }
      
      // Check if any payments were created
      if (paymentRecords.length === 0) {
        await session.abortTransaction()
        session.endSession()
        return res.status(400).json({
          success: false,
          message: 'No valid payment amounts provided'
        })
      }
    }

    // Add all payment records to history
    paymentRecords.forEach(record => {
      student.paymentHistory.push(record)
    })

    // Update fee details totals
    const totalSchoolPaid = paymentRecords.reduce((sum, p) => sum + roundAmount(p.schoolFeePaid), 0)
    const totalTransportPaid = paymentRecords.reduce((sum, p) => sum + roundAmount(p.transportFeePaid), 0)
    const totalHostelPaid = paymentRecords.reduce((sum, p) => sum + roundAmount(p.hostelFeePaid), 0)
    const totalPaid = totalSchoolPaid + totalTransportPaid + totalHostelPaid

    feeRecord.schoolFeePaid = roundAmount(currentSchoolPaid + totalSchoolPaid)
    feeRecord.transportFeePaid = roundAmount(currentTransportPaid + totalTransportPaid)
    feeRecord.hostelFeePaid = roundAmount(currentHostelPaid + totalHostelPaid)
    feeRecord.totalPaid = roundAmount(feeRecord.totalPaid + totalPaid)
    feeRecord.totalDue = Math.max(0, totalFee - feeRecord.totalPaid)
    feeRecord.updatedAt = new Date()

    // Save the student document
    await student.save({ session })

    // Commit transaction
    await session.commitTransaction()
    session.endSession()

    // Calculate updated due amounts
    const updatedSchoolDue = Math.max(0, schoolFee - feeRecord.schoolFeePaid)
    const updatedTransportDue = Math.max(0, transportFee - feeRecord.transportFeePaid)
    const updatedHostelDue = Math.max(0, hostelFee - feeRecord.hostelFeePaid)

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        paymentId,
        receiptNo,
        paymentRecords,
        totalAmount: totalPaid,
        updatedFeeDetails: {
          schoolFee: schoolFee,
          schoolFeePaid: feeRecord.schoolFeePaid,
          schoolFeeDue: updatedSchoolDue,
          transportFee: transportFee,
          transportFeePaid: feeRecord.transportFeePaid,
          transportFeeDue: updatedTransportDue,
          hostelFee: hostelFee,
          hostelFeePaid: feeRecord.hostelFeePaid,
          hostelFeeDue: updatedHostelDue,
          totalFee: totalFee,
          totalPaid: feeRecord.totalPaid,
          totalDue: feeRecord.totalDue
        }
      }
    })

  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    
    console.error('Process payment error:', error)
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      })
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process payment'
    })
  }
}

// ==================== GENERATE FEE RECEIPT PDF ====================
exports.generateReceiptPDF = async (req, res) => {
  try {
    const { id } = req.params
    const { paymentId } = req.query

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      })
    }

    const student = await Student.findById(id)
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Find payment record(s) - could be multiple if distributed
    const payments = student.paymentHistory.filter(p => 
      p.paymentId === paymentId || p.paymentId.startsWith(`${paymentId}-`)
    )
    
    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Payment with ID ${paymentId} not found`
      })
    }

    const mainPayment = payments.find(p => p.paymentId === paymentId) || payments[0]
    const feeRecord = student.feeDetails.find(fd => fd.academicYear === mainPayment.academicYear)
    
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: `Fee details not found for academic year ${mainPayment.academicYear}`
      })
    }

    // Calculate totals from all related payments
    const totalSchoolPaid = payments.reduce((sum, p) => sum + roundAmount(p.schoolFeePaid), 0)
    const totalTransportPaid = payments.reduce((sum, p) => sum + roundAmount(p.transportFeePaid), 0)
    const totalHostelPaid = payments.reduce((sum, p) => sum + roundAmount(p.hostelFeePaid), 0)
    const totalAmountPaid = totalSchoolPaid + totalTransportPaid + totalHostelPaid

    // Generate receipt data
    const receiptData = {
      student: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        class: student.class,
        displayClass: mapNumberToClassName(student.class),
        section: student.section,
        academicYear: student.academicYear,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        village: student.village
      },
      payment: {
        paymentId: mainPayment.paymentId,
        receiptNo: mainPayment.receiptNo,
        date: mainPayment.date,
        breakdown: {
          schoolFee: roundAmount(totalSchoolPaid),
          transportFee: roundAmount(totalTransportPaid),
          hostelFee: roundAmount(totalHostelPaid)
        },
        totalAmount: roundAmount(totalAmountPaid),
        paymentMode: mainPayment.paymentMode,
        description: mainPayment.description,
        receivedBy: mainPayment.receivedBy,
        chequeNo: mainPayment.chequeNo,
        bankName: mainPayment.bankName,
        transactionId: mainPayment.transactionId,
        status: mainPayment.status
      },
      feeSummary: {
        academicYear: feeRecord.academicYear,
        totalFee: roundAmount(feeRecord.totalFee),
        totalPaid: roundAmount(feeRecord.totalPaid),
        totalDue: roundAmount(feeRecord.totalDue),
        paymentStatus: feeRecord.totalDue === 0 ? 'Paid' : 
                     feeRecord.totalDue === feeRecord.totalFee ? 'Unpaid' : 'Partial',
        components: {
          schoolFee: {
            total: roundAmount(feeRecord.schoolFee),
            paid: roundAmount(feeRecord.schoolFeePaid),
            due: Math.max(0, roundAmount(feeRecord.schoolFee) - roundAmount(feeRecord.schoolFeePaid))
          },
          transportFee: {
            total: roundAmount(feeRecord.transportFee),
            paid: roundAmount(feeRecord.transportFeePaid),
            due: Math.max(0, roundAmount(feeRecord.transportFee) - roundAmount(feeRecord.transportFeePaid))
          },
          hostelFee: {
            total: roundAmount(feeRecord.hostelFee),
            paid: roundAmount(feeRecord.hostelFeePaid),
            due: Math.max(0, roundAmount(feeRecord.hostelFee) - roundAmount(feeRecord.hostelFeePaid))
          }
        }
      },
      schoolInfo: {
        name: process.env.SCHOOL_NAME || "Your School Name",
        address: process.env.SCHOOL_ADDRESS || "School Address",
        phone: process.env.SCHOOL_PHONE || "School Phone",
        email: process.env.SCHOOL_EMAIL || "school@email.com",
        principal: process.env.SCHOOL_PRINCIPAL || "Principal Name"
      },
      generatedAt: new Date(),
      receiptId: `RECEIPT-${mainPayment.receiptNo}`,
      isPartialPayment: feeRecord.totalDue > 0,
      isDistributedPayment: payments.length > 1
    }

    // Create PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: `Fee Receipt - ${receiptData.payment.receiptNo}`,
        Author: receiptData.schoolInfo.name,
        Subject: 'Fee Payment Receipt',
        Keywords: 'fee, receipt, payment, school'
      }
    })

    // Set response headers for PDF
    const filename = `Fee-Receipt-${receiptData.payment.receiptNo}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    // Pipe PDF to response
    doc.pipe(res)

    // ========== PDF CONTENT ==========
    
    // Header with school details
    doc.fontSize(20).font('Helvetica-Bold').text(receiptData.schoolInfo.name, { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(12).font('Helvetica').text(receiptData.schoolInfo.address, { align: 'center' })
    doc.text(`Phone: ${receiptData.schoolInfo.phone} | Email: ${receiptData.schoolInfo.email}`, { align: 'center' })
    doc.moveDown()
    
    // Title
    doc.fontSize(16).font('Helvetica-Bold').text('FEE PAYMENT RECEIPT', { align: 'center', underline: true })
    doc.moveDown(1)
    
    // Receipt details
    doc.fontSize(10)
    doc.text(`Receipt No: ${receiptData.payment.receiptNo}`, { align: 'right' })
    doc.text(`Date: ${formatDate(receiptData.payment.date)}`, { align: 'right' })
    doc.moveDown(1)
    
    // Student details section
    doc.font('Helvetica-Bold').text('STUDENT DETAILS:')
    doc.moveDown(0.5)
    doc.font('Helvetica')
    doc.text(`Name: ${receiptData.student.name}`)
    doc.text(`Admission No: ${receiptData.student.admissionNo}`)
    doc.text(`Roll No: ${receiptData.student.rollNo || 'N/A'}`)
    doc.text(`Class: ${receiptData.student.displayClass} - Section ${receiptData.student.section}`)
    doc.text(`Academic Year: ${receiptData.student.academicYear}`)
    doc.text(`Parent/Guardian: ${receiptData.student.parentName}`)
    doc.text(`Phone: ${receiptData.student.parentPhone}`)
    if (receiptData.student.village) {
      doc.text(`Village: ${receiptData.student.village}`)
    }
    doc.moveDown(1)
    
    // Payment details
    doc.font('Helvetica-Bold').text('PAYMENT DETAILS:')
    doc.moveDown(0.5)
    doc.font('Helvetica')
    
    // Create payment breakdown table
    const tableTop = doc.y
    const col1 = 50
    const col2 = 250
    const col3 = 350
    const col4 = 450
    
    // Table headers
    doc.font('Helvetica-Bold')
    doc.text('Fee Component', col1, tableTop)
    doc.text('Amount Paid', col2, tableTop)
    doc.text('Payment Mode', col3, tableTop)
    doc.text('Status', col4, tableTop)
    
    doc.moveDown(0.5)
    doc.lineWidth(0.5)
    doc.moveTo(col1, doc.y).lineTo(col4 + 100, doc.y).stroke()
    doc.moveDown(0.5)
    
    // Table rows
    doc.font('Helvetica')
    const components = [
      ['School Fee', receiptData.payment.breakdown.schoolFee],
      ['Transport Fee', receiptData.payment.breakdown.transportFee],
      ['Hostel Fee', receiptData.payment.breakdown.hostelFee]
    ]
    
    let currentY = doc.y
    
    components.forEach(([name, amount]) => {
      if (amount > 0) {
        doc.text(name, col1, currentY)
        doc.text(formatCurrency(amount), col2, currentY)
        doc.text(receiptData.payment.paymentMode, col3, currentY)
        doc.text('Paid', col4, currentY)
        currentY += 20
      }
    })
    
    doc.y = currentY
    doc.moveDown(0.5)
    doc.lineWidth(0.5)
    doc.moveTo(col1, doc.y).lineTo(col4 + 100, doc.y).stroke()
    doc.moveDown(0.5)
    
    // Total row
    doc.font('Helvetica-Bold')
    const totalPaid = receiptData.payment.totalAmount
    
    doc.text('TOTAL', col1, doc.y)
    doc.text(formatCurrency(totalPaid), col2, doc.y)
    doc.text(receiptData.payment.paymentMode, col3, doc.y)
    doc.text('Paid', col4, doc.y)
    doc.moveDown(2)
    
    // Payment method details
    doc.font('Helvetica-Bold').text('PAYMENT INFORMATION:')
    doc.moveDown(0.5)
    doc.font('Helvetica')
    doc.text(`Payment Mode: ${receiptData.payment.paymentMode}`)
    if (receiptData.payment.chequeNo) {
      doc.text(`Cheque No: ${receiptData.payment.chequeNo}`)
    }
    if (receiptData.payment.bankName) {
      doc.text(`Bank Name: ${receiptData.payment.bankName}`)
    }
    if (receiptData.payment.transactionId) {
      doc.text(`Transaction ID: ${receiptData.payment.transactionId}`)
    }
    doc.text(`Description: ${receiptData.payment.description || 'Fee Payment'}`)
    doc.text(`Received By: ${receiptData.payment.receivedBy}`)
    
    // If distributed payment, show note
    if (receiptData.isDistributedPayment) {
      doc.moveDown(1)
      doc.font('Helvetica-Oblique').fontSize(10)
      doc.text('Note: This payment was distributed across multiple terms as per fee structure.', { color: 'gray' })
    }
    
    doc.moveDown(2)
    
    // Fee summary
    doc.font('Helvetica-Bold').text('FEE SUMMARY:')
    doc.moveDown(0.5)
    doc.font('Helvetica')
    doc.text(`Total Fee for ${receiptData.feeSummary.academicYear}: ${formatCurrency(receiptData.feeSummary.totalFee)}`)
    doc.text(`Total Paid till date: ${formatCurrency(receiptData.feeSummary.totalPaid)}`)
    doc.text(`Total Balance Due: ${formatCurrency(receiptData.feeSummary.totalDue)}`)
    doc.text(`Payment Status: ${receiptData.feeSummary.paymentStatus}`)
    doc.moveDown(2)
    
    // Payment ID and footer
    doc.fontSize(9).font('Helvetica-Oblique')
    doc.text(`Payment ID: ${receiptData.payment.paymentId}`, { align: 'center' })
    doc.text(`Receipt ID: ${receiptData.receiptId}`, { align: 'center' })
    doc.moveDown(1)
    
    // Footer
    doc.font('Helvetica').fontSize(10)
    doc.text('Note: This is a computer generated receipt and does not require signature.', { align: 'center' })
    doc.text('Please keep this receipt for future reference.', { align: 'center' })
    doc.moveDown(1)
    doc.text('Thank you for your payment!', { align: 'center' })
    doc.moveDown(2)
    doc.text(`Generated on: ${formatDate(receiptData.generatedAt)}`, { align: 'right' })
    
    // Finalize PDF
    doc.end()

  } catch (error) {
    console.error('Generate receipt PDF error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      })
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate receipt'
    })
  }
}

// ==================== GET RECEIPT DATA (JSON) ====================
exports.getReceiptData = async (req, res) => {
  try {
    const { id } = req.params
    const { paymentId } = req.query

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      })
    }

    const student = await Student.findById(id)
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Find payment record
    const payment = student.paymentHistory.find(p => p.paymentId === paymentId)
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `Payment with ID ${paymentId} not found`
      })
    }

    const feeRecord = student.feeDetails.find(fd => fd.academicYear === payment.academicYear)
    
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: `Fee details not found for academic year ${payment.academicYear}`
      })
    }

    const receiptData = {
      student: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        class: student.class,
        displayClass: mapNumberToClassName(student.class),
        section: student.section,
        academicYear: student.academicYear,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        village: student.village
      },
      payment: {
        paymentId: payment.paymentId,
        receiptNo: payment.receiptNo,
        date: payment.date,
        breakdown: {
          schoolFee: roundAmount(payment.schoolFeePaid),
          transportFee: roundAmount(payment.transportFeePaid),
          hostelFee: roundAmount(payment.hostelFeePaid)
        },
        totalAmount: roundAmount(payment.totalAmount),
        paymentMode: payment.paymentMode,
        description: payment.description,
        receivedBy: payment.receivedBy,
        chequeNo: payment.chequeNo,
        bankName: payment.bankName,
        transactionId: payment.transactionId,
        status: payment.status
      },
      feeSummary: {
        academicYear: feeRecord.academicYear,
        totalFee: roundAmount(feeRecord.totalFee),
        totalPaid: roundAmount(feeRecord.totalPaid),
        totalDue: roundAmount(feeRecord.totalDue),
        paymentStatus: feeRecord.totalDue === 0 ? 'Paid' : 
                     feeRecord.totalDue === feeRecord.totalFee ? 'Unpaid' : 'Partial',
        components: {
          schoolFee: {
            total: roundAmount(feeRecord.schoolFee),
            paid: roundAmount(feeRecord.schoolFeePaid),
            due: Math.max(0, roundAmount(feeRecord.schoolFee) - roundAmount(feeRecord.schoolFeePaid))
          },
          transportFee: {
            total: roundAmount(feeRecord.transportFee),
            paid: roundAmount(feeRecord.transportFeePaid),
            due: Math.max(0, roundAmount(feeRecord.transportFee) - roundAmount(feeRecord.transportFeePaid))
          },
          hostelFee: {
            total: roundAmount(feeRecord.hostelFee),
            paid: roundAmount(feeRecord.hostelFeePaid),
            due: Math.max(0, roundAmount(feeRecord.hostelFee) - roundAmount(feeRecord.hostelFeePaid))
          }
        }
      },
      schoolInfo: {
        name: process.env.SCHOOL_NAME || "Your School Name",
        address: process.env.SCHOOL_ADDRESS || "School Address",
        phone: process.env.SCHOOL_PHONE || "School Phone",
        email: process.env.SCHOOL_EMAIL || "school@email.com",
        principal: process.env.SCHOOL_PRINCIPAL || "Principal Name"
      },
      generatedAt: new Date(),
      receiptId: `RECEIPT-${payment.receiptNo}`,
      isPartialPayment: feeRecord.totalDue > 0
    }

    res.status(200).json({
      success: true,
      data: receiptData
    })

  } catch (error) {
    console.error('Get receipt data error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      })
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get receipt data'
    })
  }
}

// ==================== GET PAYMENT DETAILS ====================
exports.getPaymentDetails = async (req, res) => {
  try {
    const { id, paymentId } = req.params

    const student = await Student.findById(id)
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    const payment = student.paymentHistory.find(p => p.paymentId === paymentId)
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        payment,
        student: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNo,
          class: student.class,
          displayClass: mapNumberToClassName(student.class),
          section: student.section,
          parentName: student.parentName,
          parentPhone: student.parentPhone
        }
      }
    })

  } catch (error) {
    console.error('Get payment details error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      })
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment details'
    })
  }
}

// ==================== VALIDATE PAYMENT ====================
exports.validatePayment = async (req, res) => {
  try {
    const { id } = req.params
    const paymentData = req.body

    const student = await Student.findById(id)
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    const { academicYear, schoolFeePaid = 0, transportFeePaid = 0, hostelFeePaid = 0, term } = paymentData
    const totalAmount = schoolFeePaid + transportFeePaid + hostelFeePaid

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      })
    }

    const feeRecord = student.feeDetails.find(fd => fd.academicYear === academicYear)
    
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: `Fee details not found for academic year ${academicYear}`
      })
    }

    // Round all amounts for validation
    const schoolFee = roundAmount(feeRecord.schoolFee)
    const transportFee = roundAmount(feeRecord.transportFee)
    const hostelFee = roundAmount(feeRecord.hostelFee)
    
    const currentSchoolPaid = roundAmount(feeRecord.schoolFeePaid)
    const currentTransportPaid = roundAmount(feeRecord.transportFeePaid)
    const currentHostelPaid = roundAmount(feeRecord.hostelFeePaid)

    // Calculate due amounts
    const schoolFeeDue = Math.max(0, schoolFee - currentSchoolPaid)
    const transportFeeDue = Math.max(0, transportFee - currentTransportPaid)
    const hostelFeeDue = Math.max(0, hostelFee - currentHostelPaid)

    const validation = {
      isValid: true,
      issues: [],
      dueAmounts: {
        schoolFee: schoolFeeDue,
        transportFee: transportFeeDue,
        hostelFee: hostelFeeDue,
        total: schoolFeeDue + transportFeeDue + hostelFeeDue
      },
      proposedPayment: {
        schoolFeePaid: roundAmount(schoolFeePaid),
        transportFeePaid: roundAmount(transportFeePaid),
        hostelFeePaid: roundAmount(hostelFeePaid),
        total: roundAmount(totalAmount)
      },
      remainingAfterPayment: {
        schoolFee: Math.max(0, schoolFeeDue - roundAmount(schoolFeePaid)),
        transportFee: Math.max(0, transportFeeDue - roundAmount(transportFeePaid)),
        hostelFee: Math.max(0, hostelFeeDue - roundAmount(hostelFeePaid)),
        total: Math.max(0, (schoolFeeDue + transportFeeDue + hostelFeeDue) - roundAmount(totalAmount))
      }
    }

    // Validate each component
    if (schoolFeePaid > schoolFeeDue) {
      validation.isValid = false
      validation.issues.push(`School fee payment (${schoolFeePaid}) exceeds due amount (${schoolFeeDue})`)
    }

    if (transportFeePaid > transportFeeDue) {
      validation.isValid = false
      validation.issues.push(`Transport fee payment (${transportFeePaid}) exceeds due amount (${transportFeeDue})`)
    }

    if (hostelFeePaid > hostelFeeDue) {
      validation.isValid = false
      validation.issues.push(`Hostel fee payment (${hostelFeePaid}) exceeds due amount (${hostelFeeDue})`)
    }

    res.status(200).json({
      success: true,
      data: validation
    })

  } catch (error) {
    console.error('Validate payment error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      })
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to validate payment'
    })
  }
}

// ==================== GET STUDENT PAYMENT SUMMARY ====================
exports.getPaymentSummary = async (req, res) => {
  try {
    const { id } = req.params
    const { academicYear } = req.query

    const student = await Student.findById(id)
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Determine which academic year to use
    const targetAcademicYear = academicYear || student.academicYear
    
    // Find fee record for the academic year
    const feeRecord = student.feeDetails.find(fd => fd.academicYear === targetAcademicYear)
    
    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: `Fee details not found for academic year ${targetAcademicYear}`
      })
    }

    // Get payments for the academic year
    const payments = student.paymentHistory.filter(p => p.academicYear === targetAcademicYear && p.status === 'Completed')
    
    // Calculate payment statistics
    const paymentStats = {
      totalPayments: payments.length,
      totalAmountPaid: payments.reduce((sum, p) => sum + roundAmount(p.totalAmount), 0),
      firstPaymentDate: payments.length > 0 ? 
        new Date(Math.min(...payments.map(p => new Date(p.date)))) : null,
      lastPaymentDate: payments.length > 0 ? 
        new Date(Math.max(...payments.map(p => new Date(p.date)))) : null,
      paymentMethods: payments.reduce((acc, p) => {
        acc[p.paymentMode] = (acc[p.paymentMode] || 0) + 1
        return acc
      }, {})
    }

    // Calculate component-wise payments
    const componentPayments = {
      schoolFee: payments.reduce((sum, p) => sum + roundAmount(p.schoolFeePaid), 0),
      transportFee: payments.reduce((sum, p) => sum + roundAmount(p.transportFeePaid), 0),
      hostelFee: payments.reduce((sum, p) => sum + roundAmount(p.hostelFeePaid), 0)
    }

    // Calculate term-wise breakdown with efficient splitting
    const totalTerms = feeRecord.terms || 3
    const termBreakdown = []
    
    // Calculate total per term efficiently
    const totalPerTerm = {}
    const componentKeys = ['schoolFee', 'transportFee', 'hostelFee']
    
    componentKeys.forEach(key => {
      if (feeRecord[key] > 0) {
        const distribution = splitAmountEfficiently(feeRecord[key], totalTerms)
        Object.entries(distribution).forEach(([term, amount]) => {
          const termNum = parseInt(term)
          totalPerTerm[termNum] = (totalPerTerm[termNum] || 0) + amount
        })
      }
    })
    
    for (let term = 1; term <= totalTerms; term++) {
      const termDue = totalPerTerm[term] || 0
      const termPayments = payments.filter(p => p.description?.includes(`Term ${term}`))
      const termPaid = termPayments.reduce((sum, p) => sum + roundAmount(p.totalAmount), 0)
      const termStatus = termPaid >= termDue ? 'Paid' : termPaid > 0 ? 'Partial' : 'Unpaid'
      
      termBreakdown.push({
        term: term,
        dueAmount: termDue,
        paidAmount: termPaid,
        remainingAmount: Math.max(0, termDue - termPaid),
        status: termStatus,
        paymentCount: termPayments.length
      })
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNo,
          class: student.class,
          displayClass: mapNumberToClassName(student.class),
          section: student.section
        },
        academicYear: targetAcademicYear,
        feeSummary: {
          totalFee: roundAmount(feeRecord.totalFee),
          totalPaid: roundAmount(feeRecord.totalPaid),
          totalDue: roundAmount(feeRecord.totalDue),
          paymentStatus: feeRecord.totalDue === 0 ? 'Paid' : 
                       feeRecord.totalDue === feeRecord.totalFee ? 'Unpaid' : 'Partial'
        },
        componentBreakdown: {
          schoolFee: {
            total: roundAmount(feeRecord.schoolFee),
            paid: roundAmount(feeRecord.schoolFeePaid),
            due: Math.max(0, roundAmount(feeRecord.schoolFee) - roundAmount(feeRecord.schoolFeePaid)),
            percentagePaid: feeRecord.schoolFee > 0 ? 
              roundAmount((feeRecord.schoolFeePaid / feeRecord.schoolFee * 100)).toFixed(2) : 100
          },
          transportFee: {
            total: roundAmount(feeRecord.transportFee),
            paid: roundAmount(feeRecord.transportFeePaid),
            due: Math.max(0, roundAmount(feeRecord.transportFee) - roundAmount(feeRecord.transportFeePaid)),
            percentagePaid: feeRecord.transportFee > 0 ? 
              roundAmount((feeRecord.transportFeePaid / feeRecord.transportFee * 100)).toFixed(2) : 100
          },
          hostelFee: {
            total: roundAmount(feeRecord.hostelFee),
            paid: roundAmount(feeRecord.hostelFeePaid),
            due: Math.max(0, roundAmount(feeRecord.hostelFee) - roundAmount(feeRecord.hostelFeePaid)),
            percentagePaid: feeRecord.hostelFee > 0 ? 
              roundAmount((feeRecord.hostelFeePaid / feeRecord.hostelFee * 100)).toFixed(2) : 100
          }
        },
        termBreakdown: termBreakdown,
        paymentStats: paymentStats,
        recentPayments: payments
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5)
          .map(p => ({
            date: p.date,
            receiptNo: p.receiptNo,
            paymentMode: p.paymentMode,
            amount: roundAmount(p.totalAmount),
            description: p.description
          })),
        outstandingDetails: feeRecord.totalDue > 0 ? {
          amount: roundAmount(feeRecord.totalDue),
          schoolFee: Math.max(0, roundAmount(feeRecord.schoolFee) - roundAmount(feeRecord.schoolFeePaid)),
          transportFee: Math.max(0, roundAmount(feeRecord.transportFee) - roundAmount(feeRecord.transportFeePaid)),
          hostelFee: Math.max(0, roundAmount(feeRecord.hostelFee) - roundAmount(feeRecord.hostelFeePaid))
        } : null
      }
    })

  } catch (error) {
    console.error('Get payment summary error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      })
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment summary'
    })
  }
}