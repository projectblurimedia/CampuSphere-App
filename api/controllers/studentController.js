import prisma from '../lib/prisma.js'
import cloudinaryUtils from '../config/cloudinary.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import xlsx from 'xlsx'

import {
  mapClassToEnum,
  mapEnumToDisplayName,
  addDisplayClassToStudent,
  addDisplayClassToStudents,
  parseDiscount,
  formatPhoneNumber,
  validateSection,
  getNextClass,
  getCurrentAcademicYear,
  validatePhoneNumber,
  getPreviousClass,
} from '../utils/classMappings.js'

// Multer configuration for file uploads
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = 'temp/uploads/'
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    cb(null, tempDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({ 
  storage: tempStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|xlsx|xls/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.mimetype === 'application/vnd.ms-excel' ||
                    file.mimetype.startsWith('image/')
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image and Excel files are allowed'))
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
})

// Helper function to cleanup temporary files
const cleanupTempFiles = (files) => {
  if (!files) return
  
  if (Array.isArray(files)) {
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
    })
  } else if (files.path && fs.existsSync(files.path)) {
    fs.unlinkSync(files.path)
  }
}

// Helper function to parse date
const parseDate = (dateStr) => {
  if (!dateStr) return new Date()
  
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    // Try different formats
    const formats = [
      'YYYY-MM-DD',
      'DD-MM-YYYY',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'YYYY/MM/DD'
    ]
    
    for (const format of formats) {
      let normalizedDate = dateStr
      
      if (format === 'DD-MM-YYYY' && dateStr.includes('-')) {
        const parts = dateStr.split('-')
        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
          normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
        }
      } else if (format === 'MM/DD/YYYY' && dateStr.includes('/')) {
        const parts = dateStr.split('/')
        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
          normalizedDate = `${parts[2]}-${parts[0]}-${parts[1]}`
        }
      } else if (format === 'DD/MM/YYYY' && dateStr.includes('/')) {
        const parts = dateStr.split('/')
        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
          normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
        }
      }
      
      const testDate = new Date(normalizedDate)
      if (!isNaN(testDate.getTime())) {
        return testDate
      }
    }
    
    return new Date() // Return current date if parsing fails
  }
  
  return date
}

// Fast term distribution calculation (pure function)
function calculateTermDistribution(schoolFee, transportFee, hostelFee, terms = 3) {
  const distribution = {}
  
  const baseSchool = Math.floor(schoolFee / terms)
  const baseTransport = Math.floor(transportFee / terms)
  const baseHostel = Math.floor(hostelFee / terms)
  
  const remSchool = schoolFee - (baseSchool * terms)
  const remTransport = transportFee - (baseTransport * terms)
  const remHostel = hostelFee - (baseHostel * terms)
  
  for (let i = 1; i <= terms; i++) {
    distribution[i] = {
      schoolFee: baseSchool + (i <= remSchool ? 1 : 0),
      transportFee: baseTransport + (i <= remTransport ? 1 : 0),
      hostelFee: baseHostel + (i <= remHostel ? 1 : 0),
      total: baseSchool + baseTransport + baseHostel + 
             (i <= remSchool ? 1 : 0) + 
             (i <= remTransport ? 1 : 0) + 
             (i <= remHostel ? 1 : 0),
      schoolFeePaid: 0,
      transportFeePaid: 0,
      hostelFeePaid: 0,
      totalPaid: 0,
      status: 'Unpaid'
    }
  }
  
  return distribution
}

const calculateDiscountedFees = (originalAmount, discountPercent) => {
  if (!originalAmount || originalAmount <= 0) return 0
  const discountAmount = Math.floor((originalAmount * discountPercent) / 100)
  return originalAmount - discountAmount
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
 * @desc    Create a new student with automatic fee details creation
 * @route   POST /api/students
 */
export const createStudent = [
  upload.single('profilePic'),
  async (req, res) => {
    let uploadedProfilePic = false
    let profilePicPublicId = null
    
    try {
      const {
        firstName,
        lastName,
        dob,
        gender = 'NOT_SPECIFIED',
        class: className,
        section = 'A',
        admissionNo,
        rollNo,
        address,
        village,
        studentType = 'DAY_SCHOLAR',
        isUsingSchoolTransport = 'false',
        schoolFeeDiscount = 0,
        transportFeeDiscount = 0,
        hostelFeeDiscount = 0,
        parentName,
        parentPhone,
        parentPhone2,
        parentEmail,
      } = req.body

      console.log('Received data:', {
        firstName,
        lastName,
        class: className,
        admissionNo,
        parentPhone
      })

      // Validate required fields
      if (!firstName || !lastName) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'First name and last name are required'
        })
      }

      if (!admissionNo) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Admission number is required'
        })
      }

      if (!parentPhone) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Parent phone number is required'
        })
      }

      if (!className) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Class is required'
        })
      }

      // Check for duplicate admission number
      const existingStudent = await prisma.student.findUnique({
        where: { admissionNo }
      })
      if (existingStudent) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Admission number already exists'
        })
      }

      // Map class name to enum
      const classEnum = mapClassToEnum(className)
      if (!classEnum) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: `Invalid class: "${className}"`
        })
      }

      // Upload profile picture if provided
      let profilePicUrl = null
      if (req.file) {
        try {
          console.log('Uploading profile picture to Cloudinary...')
          const uploadResult = await cloudinaryUtils.uploadToCloudinary(
            req.file.path,
            {
              folder: 'school/students/profile-pictures',
              transformation: {
                width: 500,
                height: 500,
                crop: 'fill',
                gravity: 'face',
              },
            }
          )

          console.log('Profile picture uploaded successfully:', uploadResult)
          
          profilePicUrl = uploadResult.url
          profilePicPublicId = uploadResult.publicId
          uploadedProfilePic = true
          console.log('Profile picture uploaded successfully:', profilePicUrl)
          
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError)
          cleanupTempFiles(req.file)
          return res.status(500).json({
            success: false,
            message: `Failed to upload profile picture: ${uploadError.message}`
          })
        }
      }

      // ========== CALCULATE ORIGINAL FEES ==========
      
      // Get class fee structure
      const classFeeStructure = await prisma.classFeeStructure.findFirst({
        where: {
          className: classEnum,
          isActive: true
        }
      })

      // Calculate transport fee if applicable
      let transportFee = 0
      const usesTransport = studentType === 'DAY_SCHOLAR' && 
        (isUsingSchoolTransport === true || isUsingSchoolTransport === 'true')
      
      if (usesTransport && village) {
        const busFeeStructure = await prisma.busFeeStructure.findFirst({
          where: {
            villageName: { contains: village, mode: 'insensitive' },
            isActive: true
          }
        })
        transportFee = busFeeStructure?.feeAmount || 5000
      }

      // Calculate hostel fee if applicable
      let hostelFee = 0
      if (studentType === 'HOSTELLER') {
        const hostelFeeStructure = await prisma.hostelFeeStructure.findFirst({
          where: {
            className: classEnum,
            isActive: true
          }
        })
        hostelFee = hostelFeeStructure?.totalAnnualFee || 0
      }

      // Parse discount percentages
      const schoolFeeDiscountPercent = parseDiscount(schoolFeeDiscount)
      const transportFeeDiscountPercent = parseDiscount(transportFeeDiscount)
      const hostelFeeDiscountPercent = parseDiscount(hostelFeeDiscount)

      // Calculate original amounts
      const originalSchoolFee = classFeeStructure?.totalAnnualFee || 0
      const originalTransportFee = transportFee
      const originalHostelFee = hostelFee
      const originalTotalFee = originalSchoolFee + originalTransportFee + originalHostelFee

      // Calculate discounted amounts
      const discountedSchoolFee = calculateDiscountedFees(originalSchoolFee, schoolFeeDiscountPercent)
      const discountedTransportFee = calculateDiscountedFees(originalTransportFee, transportFeeDiscountPercent)
      const discountedHostelFee = calculateDiscountedFees(originalHostelFee, hostelFeeDiscountPercent)
      const discountedTotalFee = discountedSchoolFee + discountedTransportFee + discountedHostelFee

      // ========== CALCULATE TERM DISTRIBUTION ==========
      const terms = 3
      
      // Calculate term distribution with efficient splitting including remainders
      const termDistribution = {}
      
      // Calculate base amounts per term (floor division)
      const baseSchoolFee = Math.floor(discountedSchoolFee / terms)
      const baseTransportFee = Math.floor(discountedTransportFee / terms)
      const baseHostelFee = Math.floor(discountedHostelFee / terms)
      
      // Calculate remainders
      const remainderSchool = discountedSchoolFee - (baseSchoolFee * terms)
      const remainderTransport = discountedTransportFee - (baseTransportFee * terms)
      const remainderHostel = discountedHostelFee - (baseHostelFee * terms)
      
      // Calculate term due dates
      const now = new Date()
      const termDueDates = {
        term1DueDate: new Date(new Date(now).setMonth(now.getMonth() + 4)),
        term2DueDate: new Date(new Date(now).setMonth(now.getMonth() + 8)),
        term3DueDate: new Date(new Date(now).setMonth(now.getMonth() + 12))
      }
      
      // Initialize term amounts for backward compatibility
      let term1Due = 0
      let term2Due = 0
      let term3Due = 0
      
      for (let i = 1; i <= terms; i++) {
        // Add remainder to the first term(s) - distribute remainders across first few terms
        const schoolFee = baseSchoolFee + (i <= remainderSchool ? 1 : 0)
        const transportFee = baseTransportFee + (i <= remainderTransport ? 1 : 0)
        const hostelFee = baseHostelFee + (i <= remainderHostel ? 1 : 0)
        const termTotal = schoolFee + transportFee + hostelFee
        
        termDistribution[i] = {
          schoolFee,
          transportFee,
          hostelFee,
          total: termTotal,
          // Initialize payment tracking fields
          schoolFeePaid: 0,
          transportFeePaid: 0,
          hostelFeePaid: 0,
          totalPaid: 0,
          status: 'Unpaid'
        }
        
        // Set term due amounts for backward compatibility
        if (i === 1) term1Due = termTotal
        if (i === 2) term2Due = termTotal
        if (i === 3) term3Due = termTotal
      }

      // ========== CREATE STUDENT WITH FEE DETAILS ==========

      // Create student with Prisma
      const student = await prisma.student.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dob: dob ? new Date(dob) : new Date(),
          gender: gender.toUpperCase(),
          class: classEnum,
          section: section.toUpperCase(),
          admissionNo: admissionNo.trim(),
          rollNo: rollNo ? rollNo.trim() : null,
          address: address ? address.trim() : null,
          village: village ? village.trim() : null,
          studentType: studentType.toUpperCase(),
          isUsingSchoolTransport: usesTransport,
          schoolFeeDiscount: schoolFeeDiscountPercent,
          transportFeeDiscount: transportFeeDiscountPercent,
          hostelFeeDiscount: hostelFeeDiscountPercent,
          parentName: parentName ? parentName.trim() : null,
          parentPhone: formatPhoneNumber(parentPhone),
          parentPhone2: parentPhone2 ? formatPhoneNumber(parentPhone2) : null,
          parentEmail: parentEmail ? parentEmail.trim().toLowerCase() : null,
          profilePicUrl,
          profilePicPublicId,
          isActive: true,
          
          // Create fee details with original and discounted values
          feeDetails: {
            create: {
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
              
              // Term distribution JSON - THIS IS CRITICAL
              termDistribution,
              
              // Term amounts (for backward compatibility)
              term1Due,
              term2Due,
              term3Due,
              
              // Term due dates
              term1DueDate: termDueDates.term1DueDate,
              term2DueDate: termDueDates.term2DueDate,
              term3DueDate: termDueDates.term3DueDate,
              
              // Term paid amounts (initial zero) - for backward compatibility
              term1Paid: 0,
              term2Paid: 0,
              term3Paid: 0,
              
              // Discounts applied
              schoolFeeDiscountApplied: schoolFeeDiscountPercent,
              transportFeeDiscountApplied: transportFeeDiscountPercent,
              hostelFeeDiscountApplied: hostelFeeDiscountPercent,
              
              // Total due equals discounted total fee initially
              totalDue: discountedTotalFee,
              
              isFullyPaid: false,
              updatedBy: 'system'
            }
          }
        },
        include: {
          feeDetails: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })

      // Cleanup temp files if uploaded
      if (req.file) {
        cleanupTempFiles(req.file)
      }

      // Add display class to response
      const studentWithDisplay = addDisplayClassToStudent(student)

      // Prepare fee summary
      const feeRecord = student.feeDetails[0]
      const feeSummary = feeRecord ? {
        original: {
          schoolFee: feeRecord.originalSchoolFee,
          transportFee: feeRecord.originalTransportFee,
          hostelFee: feeRecord.originalHostelFee,
          totalFee: feeRecord.originalTotalFee
        },
        discounted: {
          schoolFee: feeRecord.discountedSchoolFee,
          transportFee: feeRecord.discountedTransportFee,
          hostelFee: feeRecord.discountedHostelFee,
          totalFee: feeRecord.discountedTotalFee
        },
        termWise: {
          term1: {
            due: feeRecord.termDistribution[1]?.total || 0,
            dueDate: feeRecord.term1DueDate,
            components: {
              schoolFee: feeRecord.termDistribution[1]?.schoolFee || 0,
              transportFee: feeRecord.termDistribution[1]?.transportFee || 0,
              hostelFee: feeRecord.termDistribution[1]?.hostelFee || 0
            }
          },
          term2: {
            due: feeRecord.termDistribution[2]?.total || 0,
            dueDate: feeRecord.term2DueDate,
            components: {
              schoolFee: feeRecord.termDistribution[2]?.schoolFee || 0,
              transportFee: feeRecord.termDistribution[2]?.transportFee || 0,
              hostelFee: feeRecord.termDistribution[2]?.hostelFee || 0
            }
          },
          term3: {
            due: feeRecord.termDistribution[3]?.total || 0,
            dueDate: feeRecord.term3DueDate,
            components: {
              schoolFee: feeRecord.termDistribution[3]?.schoolFee || 0,
              transportFee: feeRecord.termDistribution[3]?.transportFee || 0,
              hostelFee: feeRecord.termDistribution[3]?.hostelFee || 0
            }
          }
        },
        discounts: {
          schoolFee: schoolFeeDiscountPercent,
          transportFee: transportFeeDiscountPercent,
          hostelFee: hostelFeeDiscountPercent,
          totalDiscount: feeRecord.originalTotalFee - feeRecord.discountedTotalFee,
          discountPercentage: feeRecord.originalTotalFee > 0 
            ? (((feeRecord.originalTotalFee - feeRecord.discountedTotalFee) / feeRecord.originalTotalFee) * 100).toFixed(2)
            : 0
        },
        paymentStatus: feeRecord.totalDue === 0 ? 'Paid' : 
                      feeRecord.totalDue === feeRecord.discountedTotalFee ? 'Unpaid' : 'Partial'
      } : null

      const response = {
        success: true,
        message: 'Student created successfully',
        data: {
          ...studentWithDisplay,
          feeSummary,
          feeStructureSource: {
            classFee: classFeeStructure ? 'Found' : 'Not found - using default 0',
            transportFee: usesTransport ? (transportFee > 0 ? 'Calculated' : 'Not found - using 0') : 'Not applicable',
            hostelFee: studentType === 'HOSTELLER' ? (hostelFee > 0 ? 'Calculated' : 'Not found - using 0') : 'Not applicable'
          }
        }
      }

      res.status(201).json(response)

    } catch (error) {
      // Clean up uploaded file if there was an error
      if (uploadedProfilePic && req.file && profilePicPublicId) {
        try {
          await cloudinaryUtils.deleteFromCloudinary(profilePicPublicId)
        } catch (cleanupError) {
          console.error('Error cleaning up Cloudinary:', cleanupError)
        }
      }
      
      if (req.file) {
        cleanupTempFiles(req.file)
      }

      console.error('Error creating student:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create student',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      })
    }
  }
]

// Update student
export const updateStudent = [
  upload.single('profilePic'),
  async (req, res) => {
    try {
      const studentId = req.params.id
      
      const existingStudent = await prisma.student.findUnique({
        where: { id: studentId }
      })
      
      if (!existingStudent) {
        cleanupTempFiles(req.file)
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        })
      }

      const {
        firstName,
        lastName,
        dob,
        gender,
        address,
        village,
        parentName,
        parentPhone,
        parentPhone2,
        parentEmail,
        section,
        rollNo,
        studentType,
        isUsingSchoolTransport,
        schoolFeeDiscount,
        transportFeeDiscount,
        hostelFeeDiscount,
        removeProfilePic,
      } = req.body

      // Handle profile picture
      let newProfilePicUrl = existingStudent.profilePicUrl
      let newProfilePicPublicId = existingStudent.profilePicPublicId
      let oldPublicId = null

      if (removeProfilePic === 'true' || removeProfilePic === true) {
        if (existingStudent.profilePicPublicId) {
          oldPublicId = existingStudent.profilePicPublicId
        }
        newProfilePicUrl = null
        newProfilePicPublicId = null
      }

      if (req.file) {
        if (existingStudent.profilePicPublicId) {
          oldPublicId = existingStudent.profilePicPublicId
        }

        try {
          console.log('Uploading new profile picture to Cloudinary...')
          const uploadResult = await cloudinaryUtils.uploadToCloudinary(
            req.file.path,
            {
              folder: 'school/students/profile-pictures',
              transformation: {
                width: 500,
                height: 500,
                crop: 'fill',
                gravity: 'face',
              },
            }
          )

          newProfilePicUrl = uploadResult.url
          newProfilePicPublicId = uploadResult.publicId
          console.log('New profile picture uploaded successfully')
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError)
          cleanupTempFiles(req.file)
          return res.status(500).json({
            success: false,
            message: `Failed to upload new profile picture: ${uploadError.message}`
          })
        }

        cleanupTempFiles(req.file)
      }

      // Prepare update data - ONLY STUDENT FIELDS (NO FEE DETAILS)
      const updateData = {
        firstName: firstName !== undefined ? firstName.trim() : existingStudent.firstName,
        lastName: lastName !== undefined ? lastName.trim() : existingStudent.lastName,
        dob: dob !== undefined ? new Date(dob) : existingStudent.dob,
        gender: gender !== undefined ? gender.toUpperCase() : existingStudent.gender,
        address: address !== undefined ? address : existingStudent.address,
        village: village !== undefined ? village : existingStudent.village,
        parentName: parentName !== undefined ? parentName : existingStudent.parentName,
        parentPhone: parentPhone ? formatPhoneNumber(parentPhone) : existingStudent.parentPhone,
        parentPhone2: parentPhone2 !== undefined ? 
          (parentPhone2 ? formatPhoneNumber(parentPhone2) : null) : 
          existingStudent.parentPhone2,
        parentEmail: parentEmail !== undefined ? parentEmail : existingStudent.parentEmail,
        section: section !== undefined ? section.toUpperCase() : existingStudent.section,
        rollNo: rollNo !== undefined ? (rollNo ? rollNo.trim() : null) : existingStudent.rollNo,
        studentType: studentType !== undefined ? studentType.toUpperCase() : existingStudent.studentType,
        isUsingSchoolTransport: isUsingSchoolTransport !== undefined ? 
          (isUsingSchoolTransport === true || isUsingSchoolTransport === 'true') : 
          existingStudent.isUsingSchoolTransport,
        schoolFeeDiscount: schoolFeeDiscount !== undefined ? 
          parseDiscount(schoolFeeDiscount) : existingStudent.schoolFeeDiscount,
        transportFeeDiscount: transportFeeDiscount !== undefined ? 
          parseDiscount(transportFeeDiscount) : existingStudent.transportFeeDiscount,
        hostelFeeDiscount: hostelFeeDiscount !== undefined ? 
          parseDiscount(hostelFeeDiscount) : existingStudent.hostelFeeDiscount,
        profilePicUrl: newProfilePicUrl,
        profilePicPublicId: newProfilePicPublicId,
      }

      console.log('Updating student with data:', updateData)

      // Update ONLY student record - NO fee details changes
      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: updateData
      })

      // Cleanup old profile picture from Cloudinary if new one uploaded
      if (oldPublicId) {
        try {
          await cloudinaryUtils.deleteFromCloudinary(oldPublicId)
          console.log('Old profile picture deleted from Cloudinary')
        } catch (deleteError) {
          console.error(
            'Failed to delete old profile picture from Cloudinary:',
            deleteError.message
          )
        }
      }

      const studentWithDisplay = addDisplayClassToStudent(updatedStudent)

      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: studentWithDisplay,
      })
    } catch (error) {
      if (req.file) {
        cleanupTempFiles(req.file)
      }

      console.error('Error updating student:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update student',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      })
    }
  }
]

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const {
      class: classFilter,
      section,
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const where = {
      isActive: true
    }

    // Handle class filter
    if (classFilter) {
      const classEnum = mapClassToEnum(classFilter)
      if (classEnum) {
        where.class = classEnum
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid class filter: "${classFilter}"`
        })
      }
    }

    // Handle section filter
    if (section) {
      const validatedSection = validateSection(section)
      if (validatedSection) {
        where.section = validatedSection
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid section: "${section}". Valid sections: A, B, C, D, E`
        })
      }
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNo: { contains: search, mode: 'insensitive' } },
        { parentName: { contains: search, mode: 'insensitive' } },
        { parentPhone: { contains: search, mode: 'insensitive' } },
        { village: { contains: search, mode: 'insensitive' } },
      ]
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const orderBy = {}
    orderBy[sortBy] = sortOrder

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy,
        take: limitNum,
        skip,
        include: {
          feeDetails: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.student.count({ where })
    ])

     const formattedStudents = students.map(student => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      class: student.class,
      rollNo: student.rollNo,
      displayClass: mapEnumToDisplayName(student.class),
      section: student.section,
    }))

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
      data: formattedStudents,
    })
  } catch (error) {
    console.error('Get all students error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch students',
    })
  }
}

/**
 * @desc    Search students by name (OPTIMIZED - firstName and lastName only)
 * @route   GET /api/students/search
 * @access  Private
 */
export const searchStudents = async (req, res) => {
  try {
    const {
      query,
      class: classFilter,
      section,
      gender,
      page = 1,
      limit = 20,
      sortBy = 'firstName',
      sortOrder = 'asc',
    } = req.query

    // Build where clause efficiently
    const where = {
      isActive: true
    }

    // OPTIMIZED: Search only by firstName and lastName
    if (query && query.trim() !== '') {
      const searchTerm = query.trim()
      
      // Split search term into words for better matching
      const searchWords = searchTerm.split(' ').filter(word => word.length > 0)
      
      if (searchWords.length === 1) {
        // Single word - search in both firstName and lastName
        where.OR = [
          { firstName: { contains: searchWords[0], mode: 'insensitive' } },
          { lastName: { contains: searchWords[0], mode: 'insensitive' } },
        ]
      } else if (searchWords.length >= 2) {
        // Multiple words - try to match firstName + lastName pattern
        where.OR = [
          {
            AND: [
              { firstName: { contains: searchWords[0], mode: 'insensitive' } },
              { lastName: { contains: searchWords.slice(1).join(' '), mode: 'insensitive' } },
            ]
          },
          {
            AND: [
              { firstName: { contains: searchWords.slice(0, -1).join(' '), mode: 'insensitive' } },
              { lastName: { contains: searchWords[searchWords.length - 1], mode: 'insensitive' } },
            ]
          },
          // Also try matching any word in either field for flexibility
          {
            OR: searchWords.map(word => ({
              OR: [
                { firstName: { contains: word, mode: 'insensitive' } },
                { lastName: { contains: word, mode: 'insensitive' } },
              ]
            }))
          }
        ]
      }
    }

    // Apply class filter (using index)
    if (classFilter && classFilter !== 'All' && classFilter !== 'all') {
      const classEnum = mapClassToEnum(classFilter)
      if (classEnum) {
        where.class = classEnum
      }
    }

    // Apply section filter (using index)
    if (section && section !== 'All' && section !== 'all') {
      const validatedSection = validateSection(section)
      if (validatedSection) {
        where.section = validatedSection
      }
    }

    // Apply gender filter
    if (gender && gender !== 'All' && gender !== 'all') {
      where.gender = gender.toUpperCase()
    }

    // Pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Sorting (using indexes on firstName and lastName)
    const orderBy = {}
    const validSortFields = ['firstName', 'lastName', 'rollNo', 'admissionNo', 'createdAt']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'firstName'
    orderBy[sortField] = sortOrder === 'desc' ? 'desc' : 'asc'

    // Execute count and find in parallel for better performance
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy,
        take: limitNum,
        skip,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          rollNo: true,
          admissionNo: true,
          class: true,
          section: true,
          gender: true,
          profilePicUrl: true,
          parentName: true,
          parentPhone: true,
          village: true,
          studentType: true,
          createdAt: true,
        }
      }),
      prisma.student.count({ where })
    ])

    // Add display class names
    const studentsWithDisplay = students.map(student => ({
      ...student,
      name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      displayClass: mapEnumToDisplayName(student.class),
    }))

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
      data: studentsWithDisplay,
    })
  } catch (error) {
    console.error('Search students error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search students',
    })
  }
}

/**
 * @desc   Search for inactive students autocomplete (ULTRA OPTIMIZED)
 * @route   GET /api/students/inactive/search
 * @access  Private
 */
export const searchInactiveStudents = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query

    if (!query || query.trim() === '') {
      return res.status(200).json({
        success: true,
        data: []
      })
    }

    const searchTerm = query.trim()

    // Ultra fast search - only returns id and name for autocomplete
    const students = await prisma.student.findMany({
      where: {
        isActive: false,  // Only inactive students
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
        ]
      },
      take: parseInt(limit),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        village: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    const formattedStudents = students.map(student => ({
      id: student.id,
      name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNo: student.admissionNo,
      village: student.village,
      isActive: false
    }))

    console.log(formattedStudents)

    res.status(200).json({
      success: true,
      data: formattedStudents
    })
  } catch (error) {
    console.error('Quick search inactive students error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search inactive students',
    })
  }
}

/**
 * @desc    Quick search for autocomplete with advanced fuzzy matching
 * @route   GET /api/students/quick-search
 * @access  Private
 */
export const quickSearchStudents = async (req, res) => {
  try {
    const { query, limit = 10, fuzzy = 'false' } = req.query

    if (!query || query.trim() === '') {
      return res.status(200).json({
        success: true,
        data: []
      })
    }

    const searchTerm = query.trim()
    let students = []

    if (fuzzy === 'true' && process.env.DATABASE_URL?.includes('postgres')) {
      // Use PostgreSQL trigram similarity for fuzzy matching
      students = await prisma.$queryRaw`
        SELECT 
          id, 
          "firstName", 
          "lastName", 
          "rollNo", 
          "admissionNo", 
          class, 
          section, 
          "profilePicUrl",
          GREATEST(
            similarity("firstName", ${searchTerm}),
            similarity("lastName", ${searchTerm}),
            similarity(CONCAT("firstName", ' ', "lastName"), ${searchTerm})
          ) as similarity
        FROM "Student"
        WHERE "isActive" = true
        AND (
          "firstName" ILIKE ${searchTerm + '%'} OR
          "lastName" ILIKE ${searchTerm + '%'} OR
          CONCAT("firstName", ' ', "lastName") ILIKE ${'%' + searchTerm + '%'}
        )
        ORDER BY similarity DESC
        LIMIT ${parseInt(limit)}
      `
    } else {
      // Standard prefix matching for better performance
      students = await prisma.student.findMany({
        where: {
          isActive: true,
          OR: [
            { firstName: { startsWith: searchTerm, mode: 'insensitive' } },
            { lastName: { startsWith: searchTerm, mode: 'insensitive' } },
            {
              AND: [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          ]
        },
        take: parseInt(limit),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          rollNo: true,
          admissionNo: true,
          class: true,
          section: true,
          profilePicUrl: true,
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      })
    }

    // Format and deduplicate results
    const formattedStudents = []
    const seenIds = new Set()

    for (const student of students) {
      if (!seenIds.has(student.id)) {
        seenIds.add(student.id)
        
        // Check if search term matches from start of either name
        const firstNameMatch = student.firstName?.toLowerCase().startsWith(searchTerm.toLowerCase())
        const lastNameMatch = student.lastName?.toLowerCase().startsWith(searchTerm.toLowerCase())
        
        formattedStudents.push({
          id: student.id,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          firstName: student.firstName,
          lastName: student.lastName,
          rollNo: student.rollNo,
          class: mapEnumToDisplayName(student.class),
          displayClass: mapEnumToDisplayName(student.class),
          section: student.section,
          profilePicUrl: student.profilePicUrl,
          matchType: firstNameMatch ? 'first-name' : (lastNameMatch ? 'last-name' : 'full-name'),
          similarity: student.similarity || undefined
        })
      }
    }

    // Sort by match type priority
    formattedStudents.sort((a, b) => {
      const priority = { 'first-name': 3, 'last-name': 2, 'full-name': 1 }
      return (priority[b.matchType] || 0) - (priority[a.matchType] || 0)
    })

    res.status(200).json({
      success: true,
      data: formattedStudents.slice(0, parseInt(limit))
    })
  } catch (error) {
    console.error('Quick search error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search students',
    })
  }
}

// Get student statistics
export const getStudentStatistics = async (req, res) => {
  try {
    const totalStudents = await prisma.student.count({
      where: { isActive: true }
    })

    const studentsByClass = await prisma.student.groupBy({
      by: ['class'],
      where: { isActive: true },
      _count: true,
      orderBy: {
        class: 'asc'
      }
    })

    const studentsByClassWithLabel = studentsByClass.map(item => ({
      class: item.class,
      classLabel: mapEnumToDisplayName(item.class),
      count: item._count
    }))

    const studentsBySection = await prisma.student.groupBy({
      by: ['section'],
      where: { isActive: true },
      _count: true,
      orderBy: {
        section: 'asc'
      }
    })

    const studentsByGender = await prisma.student.groupBy({
      by: ['gender'],
      where: { isActive: true },
      _count: true
    })

    const latestStudents = await prisma.student.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        class: true,
        section: true,
        profilePicUrl: true,
        createdAt: true
      }
    })

    const latestStudentsWithDisplay = addDisplayClassToStudents(latestStudents)

    const statistics = {
      total: totalStudents,
      byClass: studentsByClassWithLabel,
      bySection: studentsBySection,
      byGender: studentsByGender,
      latest: latestStudentsWithDisplay,
    }

    res.status(200).json({
      success: true,
      data: statistics,
    })
  } catch (error) {
    console.error('Statistics error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get student statistics',
    })
  }
}

// Get classes summary
export const getClassesSummary = async (req, res) => {
  try {
    const summary = await prisma.student.groupBy({
      by: ['class', 'section', 'gender'],
      where: { isActive: true },
      _count: true,
      orderBy: [
        { class: 'asc' },
        { section: 'asc' }
      ]
    })

    // Transform data to match expected format
    const classSummary = {}
    
    summary.forEach(item => {
      const classKey = item.class
      const sectionKey = item.section
      const genderKey = item.gender
      
      if (!classSummary[classKey]) {
        classSummary[classKey] = {
          class: classKey,
          classLabel: mapEnumToDisplayName(classKey),
          sections: new Set(),
          maleCount: 0,
          femaleCount: 0,
          otherCount: 0,
          totalCount: 0
        }
      }
      
      classSummary[classKey].sections.add(sectionKey)
      
      if (genderKey === 'MALE') {
        classSummary[classKey].maleCount += item._count
      } else if (genderKey === 'FEMALE') {
        classSummary[classKey].femaleCount += item._count
      } else {
        classSummary[classKey].otherCount += item._count
      }
      
      classSummary[classKey].totalCount += item._count
    })

    const result = Object.values(classSummary).map(item => ({
      ...item,
      sections: Array.from(item.sections).sort()
    }))

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get classes summary error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get classes summary',
    })
  }
}

// Get class details
export const getClassDetails = async (req, res) => {
  try {
    const { class: classInput } = req.query
    console.log('getClassDetails - Received classInput:', classInput)

    if (!classInput || classInput === '' || classInput === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Class parameter is required'
      })
    }

    // Map class name to enum
    const classEnum = mapClassToEnum(classInput)
    console.log('getClassDetails - Mapped classEnum:', classEnum)
    
    if (!classEnum) {
      return res.status(400).json({
        success: false,
        message: `Invalid class: "${classInput}". Valid formats: "1", "10", "Class 1", "Class_1", "CLASS_1"`
      })
    }

    const details = await prisma.student.groupBy({
      by: ['section', 'gender'],
      where: { 
        class: classEnum,
        isActive: true 
      },
      _count: true,
      orderBy: { section: 'asc' }
    })

    console.log('getClassDetails - Found details:', details)

    // Transform data
    const sectionSummary = {}
    
    details.forEach(item => {
      const sectionKey = item.section
      const genderKey = item.gender
      
      if (!sectionSummary[sectionKey]) {
        sectionSummary[sectionKey] = {
          section: sectionKey,
          maleCount: 0,
          femaleCount: 0,
          otherCount: 0,
          totalCount: 0
        }
      }
      
      if (genderKey === 'MALE') {
        sectionSummary[sectionKey].maleCount += item._count
      } else if (genderKey === 'FEMALE') {
        sectionSummary[sectionKey].femaleCount += item._count
      } else {
        sectionSummary[sectionKey].otherCount += item._count
      }
      
      sectionSummary[sectionKey].totalCount += item._count
    })

    const result = Object.values(sectionSummary)

    res.status(200).json({
      success: true,
      data: result,
      class: classEnum,
      classLabel: mapEnumToDisplayName(classEnum),
      totalStudents: result.reduce((sum, section) => sum + section.totalCount, 0),
    })
  } catch (error) {
    console.error('Get class details error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get class details',
    })
  }
}

// Get students by class and section (simplified - only basic info)
export const getStudentsByClassAndSection = async (req, res) => {
  try {
    const {
      class: classInput,
      section,
      sortBy = 'firstName',
      sortOrder = 'asc',
    } = req.query

    if (!classInput || classInput === '' || classInput === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Class parameter is required'
      })
    }

    // Map class name to enum
    const classEnum = mapClassToEnum(classInput)
    
    if (!classEnum) {
      return res.status(400).json({
        success: false,
        message: `Invalid class: "${classInput}"`
      })
    }

    if (!section || section === '' || section === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Section parameter is required'
      })
    }

    // Validate section
    const validatedSection = validateSection(section)
    
    if (!validatedSection) {
      return res.status(400).json({
        success: false,
        message: `Invalid section: "${section}". Valid sections: A, B, C, D, E`
      })
    }

    const where = {
      class: classEnum,
      section: validatedSection,
      isActive: true
    }

    const orderBy = {}
    const validSortFields = ['firstName', 'lastName', 'rollNo', 'admissionNo', 'createdAt']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'firstName'
    orderBy[sortField] = sortOrder === 'desc' ? 'desc' : 'asc'

    // Get only basic student info - no relations
    const students = await prisma.student.findMany({
      where,
      orderBy,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNo: true,
        admissionNo: true,
        class: true,
        section: true,
        profilePicUrl: true,
        gender: true,
        isActive: true
      }
    })

    const studentsWithDisplay = students.map(student => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      rollNo: student.rollNo || student.admissionNo,
      class: mapEnumToDisplayName(student.class),
      classEnum: student.class,
      section: student.section,
      profilePicUrl: student.profilePicUrl,
      gender: student.gender
    }))

    res.status(200).json({
      success: true,
      count: students.length,
      data: studentsWithDisplay,
      filters: {
        class: classEnum,
        classLabel: mapEnumToDisplayName(classEnum),
        section: validatedSection,
      },
    })
  } catch (error) {
    console.error('Get students by class and section error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get students by class and section',
    })
  }
}

// Get single student with complete details
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params
    
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        attendance: {
          orderBy: { date: 'desc' }
        },
        marks: {
          orderBy: { uploadedAt: 'desc' }
        },
        feeDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        paymentHistory: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      })
    }

    // Calculate attendance statistics
    const attendanceStats = {
      total: student.attendance.length,
      present: student.attendance.filter(a => a.morning === true || a.afternoon === true).length,
      absent: student.attendance.filter(a => a.morning === false && a.afternoon === false).length,
      records: student.attendance
    }
    
    attendanceStats.percentage = attendanceStats.total > 0 
      ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(2)
      : 0

    // Get fee details
    const feeRecord = student.feeDetails[0] || null
    const feeStats = feeRecord ? {
      totalFee: feeRecord.originalTotalFee,
      discountedFee: feeRecord.discountedTotalFee,
      paid: feeRecord.totalPaid,
      due: feeRecord.totalDue,
      isFullyPaid: feeRecord.isFullyPaid,
      termWise: feeRecord.termDistribution,
      term1DueDate: feeRecord.term1DueDate,
      term2DueDate: feeRecord.term2DueDate,
      term3DueDate: feeRecord.term3DueDate,
      paymentHistory: student.paymentHistory
    } : null

    // Get marks statistics
    const marksStats = {
      totalExams: student.marks.length,
      recent: student.marks[0] || null,
      all: student.marks
    }

    const studentWithDisplay = {
      ...student,
      displayClass: mapEnumToDisplayName(student.class),
      attendance: attendanceStats,
      fees: feeStats,
      marks: marksStats
    }

    // Remove relations from the main object to keep response clean
    delete studentWithDisplay.attendance
    delete studentWithDisplay.marks
    delete studentWithDisplay.feeDetails
    delete studentWithDisplay.paymentHistory

    res.status(200).json({
      success: true,
      data: studentWithDisplay,
    })
  } catch (error) {
    console.error('Get student by id error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student',
    })
  }
}

// Helper function to calculate working days (excluding Sundays and holidays)
async function calculateWorkingDays(year, month, daysInMonth) {
  try {
    // Get holidays for the month from a Holiday model (if you have one)
    // This is a simplified version - you can enhance based on your schema
    let holidays = []
    
    // Try to get holidays from database if you have a Holiday model
    if (prisma.holiday) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)
      
      holidays = await prisma.holiday.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        select: { date: true }
      })
    }

    const holidayDates = holidays.map(h => new Date(h.date).toDateString())
    
    let workingDays = 0
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day)
      const dayOfWeek = currentDate.getDay() // 0 = Sunday, 6 = Saturday
      
      // Skip Sundays (0) and holidays
      if (dayOfWeek !== 0 && !holidayDates.includes(currentDate.toDateString())) {
        workingDays++
      }
    }
    
    return workingDays
  } catch (error) {
    console.error('Error calculating working days:', error)
    // Fallback: return days in month minus Sundays (approx 4-5 Sundays)
    return daysInMonth - Math.floor(daysInMonth / 7)
  }
}

// Delete student (soft delete)
export const deleteStudent = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      })
    }

    // Soft delete by marking as inactive
    await prisma.student.update({
      where: { id: req.params.id },
      data: { isActive: false }
    })

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete student',
    })
  }
}

/**
 * @desc    Get all unique classes with their sections (only classes with active students)
 * @route   GET /api/students/classes-sections
 * @access  Private
 */
export const getClassesAndSections = async (req, res) => {
  try {
    // Get all unique classes and sections from active students
    const classGroups = await prisma.student.groupBy({
      by: ['class', 'section'],
      where: { 
        isActive: true 
      },
      orderBy: [
        { class: 'asc' },
        { section: 'asc' }
      ]
    })

    // If no active students found
    if (classGroups.length === 0) {
      return res.status(200).json({
        success: true,
        data: {}
      })
    }

    // Transform data into the required format - ONLY include classes with sections
    const classSections = {}

    // Collect all sections for each class
    classGroups.forEach(item => {
      const classLabel = mapEnumToDisplayName(item.class)
      const section = item.section

      if (!classLabel) return // Skip if class label not found

      // Initialize class entry if it doesn't exist
      if (!classSections[classLabel]) {
        classSections[classLabel] = new Set()
      }

      // Add section to the set (Set ensures uniqueness)
      classSections[classLabel].add(section)
    })

    // Remove classes with no sections
    Object.keys(classSections).forEach(className => {
      if (classSections[className].size === 0) {
        delete classSections[className]
      }
    })

    // Convert Sets to sorted arrays and create final object
    const result = {}

    // Define class order for sorting
    const classOrder = [
      'Pre-Nursery',
      'Nursery',
      'LKG',
      'UKG',
      'Class 1',
      'Class 2',
      'Class 3',
      'Class 4',
      'Class 5',
      'Class 6',
      'Class 7',
      'Class 8',
      'Class 9',
      'Class 10',
      'Class 11',
      'Class 12'
    ]

    // Sort classes according to predefined order
    const sortedClasses = Object.keys(classSections).sort((a, b) => {
      const aIndex = classOrder.indexOf(a)
      const bIndex = classOrder.indexOf(b)
      
      // If class not in order list, put it at the end
      return (aIndex !== -1 ? aIndex : Infinity) - (bIndex !== -1 ? bIndex : Infinity)
    })

    // Build the result object in sorted order
    sortedClasses.forEach(className => {
      // Convert Set to array and sort sections alphabetically
      const sections = Array.from(classSections[className]).sort()
      result[className] = sections
    })

    res.status(200).json({
      success: true,
      data: result,
      count: Object.keys(result).length
    })
  } catch (error) {
    console.error('Get classes and sections error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get classes and sections'
    })
  }
}


/**
 * @desc    Get all students whose birthday is today
 * @route   GET /api/students/today-birthdays
 * @access  Private
 */
export const getTodayBirthdays = async (req, res) => {
  try {
    const today = new Date()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()

    console.log(`Fetching birthdays for: Month ${todayMonth}, Day ${todayDay}`)

    // Use raw SQL to filter by month and day directly in the database
    // This is much more efficient than fetching all students
    const birthdayStudents = await prisma.$queryRaw`
      SELECT 
        id, 
        "firstName", 
        "lastName", 
        dob, 
        class, 
        section, 
        "profilePicUrl", 
        "profilePicPublicId", 
        gender, 
        "rollNo",
        "admissionNo",
        "parentName",
        "parentPhone",
        "parentEmail"
      FROM "Student"
      WHERE 
        "isActive" = true 
        AND dob IS NOT NULL
        AND EXTRACT(MONTH FROM dob) = ${todayMonth}
        AND EXTRACT(DAY FROM dob) = ${todayDay}
      ORDER BY 
        class ASC, 
        section ASC, 
        "firstName" ASC
    `

    console.log(`Found ${birthdayStudents.length} students with birthday today`)

    // If no students found, return early
    if (birthdayStudents.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        date: today.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        data: [],
        groupedByClass: {}
      })
    }

    // Calculate age function
    const calculateAge = (dob) => {
      const today = new Date()
      const birthDate = new Date(dob)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      return age
    }

    // Add display class name and formatted data
    const studentsWithDisplay = birthdayStudents.map(student => ({
      id: student.id,
      name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      firstName: student.firstName,
      lastName: student.lastName,
      displayClass: mapEnumToDisplayName(student.class),
      class: student.class,
      classLabel: mapEnumToDisplayName(student.class),
      section: student.section,
      rollNo: student.rollNo,
      admissionNo: student.admissionNo,
      dob: student.dob,
      age: calculateAge(student.dob),
      ageYears: `${calculateAge(student.dob)} years`,
      dobFormatted: new Date(student.dob).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      profilePicUrl: student.profilePicUrl,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      gender: student.gender
    }))

    // Group by class for better presentation
    const groupedByClass = {}
    studentsWithDisplay.forEach(student => {
      const classKey = student.displayClass
      if (!groupedByClass[classKey]) {
        groupedByClass[classKey] = []
      }
      groupedByClass[classKey].push(student)
    })

    // Sort classes in correct order
    const classOrder = [
      'Pre-Nursery', 'Nursery', 'LKG', 'UKG',
      'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
      'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
      'Class 11', 'Class 12'
    ]

    const sortedGroupedByClass = {}
    Object.keys(groupedByClass)
      .sort((a, b) => {
        const aIndex = classOrder.indexOf(a)
        const bIndex = classOrder.indexOf(b)
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
      })
      .forEach(key => {
        sortedGroupedByClass[key] = groupedByClass[key]
      })

    res.status(200).json({
      success: true,
      count: birthdayStudents.length,
      date: today.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      data: studentsWithDisplay,
      groupedByClass: sortedGroupedByClass
    })
  } catch (error) {
    console.error('Get today birthdays error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch birthday students',
    })
  }
}



/**
 * @desc    Get comprehensive attendance statistics report for all classes and sections
 * @route   GET /api/students/attendance-stats
 * @access  Private
 */
export const getAttendanceStatsByClassSection = async (req, res) => {
  try {
    // Find the date range from actual attendance records
    const dateRange = await prisma.attendance.aggregate({
      _min: {
        date: true
      },
      _max: {
        date: true
      }
    })

    const startDate = dateRange._min.date
    const endDate = dateRange._max.date

    // If no attendance records exist, return empty report
    if (!startDate || !endDate) {
      return res.status(200).json({
        success: true,
        message: 'No attendance records found in the system',
        data: {
          dateRange: null,
          totalWorkingDays: 0,
          schoolSummary: {
            totalStudents: 0,
            studentsWithAttendance: 0,
            studentsWithoutAttendance: 0,
            totalAttendanceRecords: 0,
            overallAttendancePercentage: 0,
            averagePresentPerDay: 0,
            averageAbsentPerDay: 0
          },
          classes: []
        }
      })
    }

    // Calculate working days in this date range (excluding Sundays)
    const totalWorkingDays = await calculateWorkingDaysInRange(startDate, endDate)

    // Get all active students with their attendance
    const students = await prisma.student.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        class: true,
        section: true,
        rollNo: true,
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
          },
          select: {
            id: true,
            date: true,
            morning: true,
            afternoon: true
          }
        }
      }
      // Remove the orderBy here - we'll sort manually after grouping
    })

    // Group by class and section
    const classSectionMap = new Map()
    const schoolStats = {
      totalStudents: students.length,
      studentsWithAttendance: 0,
      studentsWithoutAttendance: 0,
      totalAttendanceRecords: 0,
      totalPresentCount: 0,
      totalAbsentCount: 0,
      attendanceByDate: new Map() // For daily averages
    }

    // Process each student
    students.forEach(student => {
      const classKey = student.class
      const sectionKey = student.section
      const compositeKey = `${classKey}-${sectionKey}`

      if (!classSectionMap.has(compositeKey)) {
        classSectionMap.set(compositeKey, {
          class: classKey,
          classLabel: mapEnumToDisplayName(classKey),
          section: sectionKey,
          totalStudents: 0,
          studentsWithAttendance: 0,
          studentsWithoutAttendance: 0,
          totalAttendanceRecords: 0,
          totalPresentCount: 0,
          totalAbsentCount: 0,
          attendancePercentage: 0,
          attendanceByDate: new Map(),
          students: []
        })
      }

      const sectionStats = classSectionMap.get(compositeKey)
      sectionStats.totalStudents++

      // Calculate individual student statistics
      const attendanceCount = student.attendance.length
      const presentCount = student.attendance.filter(a => 
        a.morning === true || a.afternoon === true
      ).length
      const absentCount = student.attendance.filter(a => 
        a.morning === false && a.afternoon === false
      ).length

      // Track per-date attendance for this section
      student.attendance.forEach(record => {
        const dateStr = record.date.toISOString().split('T')[0]
        const isPresent = record.morning === true || record.afternoon === true
        
        // Update section's per-date stats
        if (!sectionStats.attendanceByDate.has(dateStr)) {
          sectionStats.attendanceByDate.set(dateStr, {
            date: record.date,
            present: 0,
            absent: 0,
            total: 0
          })
        }
        const dateStats = sectionStats.attendanceByDate.get(dateStr)
        dateStats.total++
        if (isPresent) {
          dateStats.present++
        } else {
          dateStats.absent++
        }

        // Update school's per-date stats
        if (!schoolStats.attendanceByDate.has(dateStr)) {
          schoolStats.attendanceByDate.set(dateStr, {
            date: record.date,
            present: 0,
            absent: 0,
            total: 0
          })
        }
        const schoolDateStats = schoolStats.attendanceByDate.get(dateStr)
        schoolDateStats.total++
        if (isPresent) {
          schoolDateStats.present++
        } else {
          schoolDateStats.absent++
        }
      })

      // Update section statistics
      if (attendanceCount > 0) {
        sectionStats.studentsWithAttendance++
        schoolStats.studentsWithAttendance++
        
        sectionStats.totalAttendanceRecords += attendanceCount
        sectionStats.totalPresentCount += presentCount
        sectionStats.totalAbsentCount += absentCount
        
        schoolStats.totalAttendanceRecords += attendanceCount
        schoolStats.totalPresentCount += presentCount
        schoolStats.totalAbsentCount += absentCount
      } else {
        sectionStats.studentsWithoutAttendance++
        schoolStats.studentsWithoutAttendance++
      }

      // Add student details
      sectionStats.students.push({
        id: student.id,
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        rollNo: student.rollNo || student.admissionNo,
        attendanceCount,
        presentCount,
        absentCount,
        attendancePercentage: attendanceCount > 0 
          ? Number(((presentCount / attendanceCount) * 100).toFixed(2))
          : 0,
        hasAttendance: attendanceCount > 0
      })
    })

    // Calculate percentages and format the response
    const classes = []

    // Process each class-section
    for (const [_, sectionStats] of classSectionMap) {
      // Calculate section attendance percentage
      if (sectionStats.totalAttendanceRecords > 0) {
        sectionStats.attendancePercentage = Number(
          ((sectionStats.totalPresentCount / sectionStats.totalAttendanceRecords) * 100).toFixed(2)
        )
      }

      // Convert attendanceByDate Map to array for response
      const dailyAttendance = Array.from(sectionStats.attendanceByDate.values())
        .map(day => ({
          date: day.date.toISOString().split('T')[0],
          present: day.present,
          absent: day.absent,
          total: day.total,
          percentage: Number(((day.present / day.total) * 100).toFixed(2))
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))

      // Calculate average daily attendance for this section
      const avgDailyAttendance = dailyAttendance.length > 0
        ? Number((dailyAttendance.reduce((sum, day) => sum + day.percentage, 0) / dailyAttendance.length).toFixed(2))
        : 0

      classes.push({
        class: sectionStats.class,
        classLabel: sectionStats.classLabel,
        section: sectionStats.section,
        summary: {
          totalStudents: sectionStats.totalStudents,
          studentsWithAttendance: sectionStats.studentsWithAttendance,
          studentsWithoutAttendance: sectionStats.studentsWithoutAttendance,
          totalAttendanceRecords: sectionStats.totalAttendanceRecords,
          totalPresent: sectionStats.totalPresentCount,
          totalAbsent: sectionStats.totalAbsentCount,
          overallAttendancePercentage: sectionStats.attendancePercentage,
          averageDailyAttendance: avgDailyAttendance,
          status: sectionStats.studentsWithAttendance === 0 ? 'No attendance data' : 'Data available'
        },
        dailyAttendance,
        students: sectionStats.students.sort((a, b) => {
          // Sort students by roll number numerically
          const rollA = parseInt(a.rollNo, 10) || 0
          const rollB = parseInt(b.rollNo, 10) || 0
          return rollA - rollB
        })
      })
    }

    // Calculate school-wide statistics
    const schoolDailyAttendance = Array.from(schoolStats.attendanceByDate.values())
      .map(day => ({
        date: day.date.toISOString().split('T')[0],
        present: day.present,
        absent: day.absent,
        total: day.total,
        percentage: Number(((day.present / day.total) * 100).toFixed(2))
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    const avgSchoolDailyAttendance = schoolDailyAttendance.length > 0
      ? Number((schoolDailyAttendance.reduce((sum, day) => sum + day.percentage, 0) / schoolDailyAttendance.length).toFixed(2))
      : 0

    const schoolSummary = {
      totalStudents: schoolStats.totalStudents,
      studentsWithAttendance: schoolStats.studentsWithAttendance,
      studentsWithoutAttendance: schoolStats.studentsWithoutAttendance,
      totalAttendanceRecords: schoolStats.totalAttendanceRecords,
      totalPresent: schoolStats.totalPresentCount,
      totalAbsent: schoolStats.totalAbsentCount,
      overallAttendancePercentage: schoolStats.totalAttendanceRecords > 0
        ? Number(((schoolStats.totalPresentCount / schoolStats.totalAttendanceRecords) * 100).toFixed(2))
        : 0,
      averageDailyAttendance: avgSchoolDailyAttendance,
      averagePresentPerDay: schoolDailyAttendance.length > 0
        ? Number((schoolDailyAttendance.reduce((sum, day) => sum + day.present, 0) / schoolDailyAttendance.length).toFixed(2))
        : 0,
      averageAbsentPerDay: schoolDailyAttendance.length > 0
        ? Number((schoolDailyAttendance.reduce((sum, day) => sum + day.absent, 0) / schoolDailyAttendance.length).toFixed(2))
        : 0
    }

    // Define the correct class order
    const classOrder = [
      'Pre-Nursery', 'Nursery', 'LKG', 'UKG',
      'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
      'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
    ]

    // Sort classes by the defined order
    const sortedClasses = classes.sort((a, b) => {
      const aIndex = classOrder.indexOf(a.classLabel)
      const bIndex = classOrder.indexOf(b.classLabel)
      
      // If class not found in order, put it at the end
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      
      // If same class, sort by section
      if (aIndex === bIndex) {
        return a.section.localeCompare(b.section)
      }
      
      return aIndex - bIndex
    })

    res.status(200).json({
      success: true,
      data: {
        dateRange: {
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
          totalWorkingDays
        },
        schoolSummary,
        dailyAttendance: schoolDailyAttendance,
        classes: sortedClasses
      }
    })

  } catch (error) {
    console.error('Get attendance stats error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance statistics',
    })
  }
}

/**
 * @desc    Get comprehensive marks statistics report for all classes and sections
 * @route   GET /api/students/marks-stats
 * @access  Private
 */
export const getMarksStatsByClassSection = async (req, res) => {
  try {
    // Get all available exam types from the database
    const examTypes = await prisma.marks.findMany({
      distinct: ['examType'],
      select: {
        examType: true
      },
      orderBy: {
        examType: 'asc'
      }
    })

    // If no marks records exist, return empty report
    if (examTypes.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No marks records found in the system',
        data: {
          availableExams: [],
          schoolSummary: {
            totalStudents: 0,
            studentsWithMarks: 0,
            studentsWithoutMarks: 0
          },
          exams: []
        }
      })
    }

    // Get all active students
    const allStudents = await prisma.student.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        class: true,
        section: true,
        rollNo: true,
        admissionNo: true
      }
    })

    // Create a map of students by class-section for quick lookup
    const studentsByClassSection = new Map()
    allStudents.forEach(student => {
      const classKey = student.class
      const sectionKey = student.section
      const compositeKey = `${classKey}-${sectionKey}`

      if (!studentsByClassSection.has(compositeKey)) {
        studentsByClassSection.set(compositeKey, {
          class: classKey,
          classLabel: mapEnumToDisplayName(classKey),
          section: sectionKey,
          students: []
        })
      }
      studentsByClassSection.get(compositeKey).students.push({
        id: student.id,
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        rollNo: student.rollNo || student.admissionNo,
        hasMarks: false
      })
    })

    // Get all marks records
    const allMarks = await prisma.marks.findMany({
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            class: true,
            section: true,
            rollNo: true,
            admissionNo: true
          }
        }
      },
      orderBy: [
        { uploadedAt: 'desc' }
      ]
    })

    // Group marks by exam type and class-section
    const examData = new Map()

    allMarks.forEach(marks => {
      const examType = marks.examType
      const studentClass = marks.student.class
      const studentSection = marks.student.section
      const compositeKey = `${examType}-${studentClass}-${studentSection}`

      if (!examData.has(examType)) {
        examData.set(examType, {
          examType,
          examTypeLabel: marks.examType.replace(/_/g, ' '),
          totalStudentsWithMarks: 0,
          classSections: new Map(),
          subjectSummary: new Map()
        })
      }

      const exam = examData.get(examType)
      
      if (!exam.classSections.has(compositeKey)) {
        exam.classSections.set(compositeKey, {
          class: studentClass,
          classLabel: mapEnumToDisplayName(studentClass),
          section: studentSection,
          totalStudents: 0,
          studentsWithMarks: 0,
          totalObtained: 0,
          totalMaximum: 0,
          gradeDistribution: {
            A_PLUS: 0, A: 0, B_PLUS: 0, B: 0, C: 0, D: 0, E: 0, F: 0, NA: 0
          },
          resultDistribution: {
            PASS: 0, FAIL: 0, NA: 0
          },
          subjectStats: new Map(),
          students: []
        })
      }

      const sectionStats = exam.classSections.get(compositeKey)
      
      // Get the base student info from our map
      const studentCompositeKey = `${studentClass}-${studentSection}`
      const classSectionData = studentsByClassSection.get(studentCompositeKey)
      
      if (classSectionData) {
        const studentInfo = classSectionData.students.find(s => s.id === marks.studentId)
        
        if (studentInfo) {
          sectionStats.totalStudents = classSectionData.students.length
          sectionStats.studentsWithMarks++
          exam.totalStudentsWithMarks++

          // Add marks totals
          sectionStats.totalObtained += marks.totalObtained || 0
          sectionStats.totalMaximum += marks.totalMaximum || 0

          // Update grade distribution
          if (marks.overallGrade) {
            sectionStats.gradeDistribution[marks.overallGrade] = 
              (sectionStats.gradeDistribution[marks.overallGrade] || 0) + 1
          }

          // Update result distribution
          if (marks.overallResult) {
            sectionStats.resultDistribution[marks.overallResult] = 
              (sectionStats.resultDistribution[marks.overallResult] || 0) + 1
          }

          // Parse marksData for subject-wise statistics
          if (marks.marksData && typeof marks.marksData === 'object') {
            Object.entries(marks.marksData).forEach(([subjectName, subjectData]) => {
              // Update section subject stats
              if (!sectionStats.subjectStats.has(subjectName)) {
                sectionStats.subjectStats.set(subjectName, {
                  subject: subjectName,
                  totalObtained: 0,
                  totalMaximum: 0,
                  count: 0,
                  gradeDistribution: {},
                  resultDistribution: {}
                })
              }
              
              const subjectStats = sectionStats.subjectStats.get(subjectName)
              subjectStats.totalObtained += subjectData.marks || 0
              subjectStats.totalMaximum += subjectData.totalMarks || 0
              subjectStats.count++
              
              if (subjectData.grade) {
                subjectStats.gradeDistribution[subjectData.grade] = 
                  (subjectStats.gradeDistribution[subjectData.grade] || 0) + 1
              }
              
              if (subjectData.result) {
                subjectStats.resultDistribution[subjectData.result] = 
                  (subjectStats.resultDistribution[subjectData.result] || 0) + 1
              }

              // Update exam-wide subject summary
              if (!exam.subjectSummary.has(subjectName)) {
                exam.subjectSummary.set(subjectName, {
                  subject: subjectName,
                  totalObtained: 0,
                  totalMaximum: 0,
                  count: 0
                })
              }
              const examSubjectStats = exam.subjectSummary.get(subjectName)
              examSubjectStats.totalObtained += subjectData.marks || 0
              examSubjectStats.totalMaximum += subjectData.totalMarks || 0
              examSubjectStats.count++
            })
          }

          // Add student marks details
          sectionStats.students.push({
            studentId: marks.studentId,
            name: studentInfo.name,
            rollNo: studentInfo.rollNo,
            totalObtained: marks.totalObtained || 0,
            totalMaximum: marks.totalMaximum || 0,
            percentage: marks.percentage ? Number(marks.percentage.toFixed(2)) : 0,
            grade: marks.overallGrade || 'NA',
            result: marks.overallResult || 'NA',
            subjectWise: marks.marksData
          })
        }
      }
    })

    // Format the response
    const formattedExams = []

    for (const [examType, exam] of examData) {
      const classSections = []
      let examTotalObtained = 0
      let examTotalMaximum = 0
      let examTotalStudents = 0

      for (const [_, sectionStats] of exam.classSections) {
        // Calculate section averages
        const avgPercentage = sectionStats.totalMaximum > 0
          ? Number(((sectionStats.totalObtained / sectionStats.totalMaximum) * 100).toFixed(2))
          : 0

        const passPercentage = sectionStats.studentsWithMarks > 0
          ? Number(((sectionStats.resultDistribution.PASS / sectionStats.studentsWithMarks) * 100).toFixed(2))
          : 0

        // Format subject stats for this section
        const subjectStats = Array.from(sectionStats.subjectStats.values()).map(subject => ({
          subject: subject.subject,
          averageMarks: subject.count > 0 
            ? Number((subject.totalObtained / subject.count).toFixed(2))
            : 0,
          averagePercentage: subject.totalMaximum > 0
            ? Number(((subject.totalObtained / subject.totalMaximum) * 100).toFixed(2))
            : 0,
          gradeDistribution: subject.gradeDistribution,
          resultDistribution: subject.resultDistribution,
          studentCount: subject.count
        }))

        classSections.push({
          class: sectionStats.class,
          classLabel: sectionStats.classLabel,
          section: sectionStats.section,
          summary: {
            totalStudents: sectionStats.totalStudents,
            studentsWithMarks: sectionStats.studentsWithMarks,
            studentsWithoutMarks: sectionStats.totalStudents - sectionStats.studentsWithMarks,
            totalObtained: sectionStats.totalObtained,
            totalMaximum: sectionStats.totalMaximum,
            averageMarks: sectionStats.studentsWithMarks > 0
              ? Number((sectionStats.totalObtained / sectionStats.studentsWithMarks).toFixed(2))
              : 0,
            averagePercentage: avgPercentage,
            passPercentage,
            gradeDistribution: sectionStats.gradeDistribution,
            resultDistribution: sectionStats.resultDistribution
          },
          subjectStats,
          students: sectionStats.students.sort((a, b) => a.rollNo.localeCompare(b.rollNo))
        })

        examTotalObtained += sectionStats.totalObtained
        examTotalMaximum += sectionStats.totalMaximum
        examTotalStudents += sectionStats.studentsWithMarks
      }

      // Format exam-wide subject summary
      const examSubjectSummary = Array.from(exam.subjectSummary.values()).map(subject => ({
        subject: subject.subject,
        totalObtained: subject.totalObtained,
        totalMaximum: subject.totalMaximum,
        averageMarks: subject.count > 0
          ? Number((subject.totalObtained / subject.count).toFixed(2))
          : 0,
        averagePercentage: subject.totalMaximum > 0
          ? Number(((subject.totalObtained / subject.totalMaximum) * 100).toFixed(2))
          : 0,
        studentCount: subject.count
      }))

      formattedExams.push({
        examType: exam.examType,
        examTypeLabel: exam.examTypeLabel,
        summary: {
          totalStudentsWithMarks: exam.totalStudentsWithMarks,
          totalObtained: examTotalObtained,
          totalMaximum: examTotalMaximum,
          averagePercentage: examTotalMaximum > 0
            ? Number(((examTotalObtained / examTotalMaximum) * 100).toFixed(2))
            : 0,
          subjectSummary: examSubjectSummary
        },
        classSections: classSections.sort((a, b) => {
          if (a.classLabel === b.classLabel) {
            return a.section.localeCompare(b.section)
          }
          return a.classLabel.localeCompare(b.classLabel)
        })
      })
    }

    // Calculate school-wide summary
    const schoolSummary = {
      totalStudents: allStudents.length,
      totalExams: examTypes.length,
      studentsWithMarks: allMarks.length, // This is number of marks records, not unique students
      uniqueStudentsWithMarks: new Set(allMarks.map(m => m.studentId)).size,
      studentsWithoutAnyMarks: allStudents.length - new Set(allMarks.map(m => m.studentId)).size
    }

    res.status(200).json({
      success: true,
      data: {
        availableExams: examTypes.map(e => ({
          examType: e.examType,
          examTypeLabel: e.examType.replace(/_/g, ' ')
        })),
        schoolSummary,
        exams: formattedExams.sort((a, b) => a.examType.localeCompare(b.examType))
      }
    })

  } catch (error) {
    console.error('Get marks stats error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch marks statistics',
    })
  }
}

/**
 * Helper function to calculate working days in a date range (excluding Sundays)
 */
async function calculateWorkingDaysInRange(startDate, endDate) {
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    let workingDays = 0
    const currentDate = new Date(start)
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay() // 0 = Sunday
      
      // Skip Sundays
      if (dayOfWeek !== 0) {
        workingDays++
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return workingDays
  } catch (error) {
    console.error('Error calculating working days:', error)
    // Approximate working days (roughly 6/7 of days if excluding only Sundays)
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
    return Math.floor(daysDiff * 6 / 7)
  }
}

/**
 * @desc    End of academic year promotion - promotes all active students to next class
 * @route   POST /api/students/end-of-academics
 * @access  Private
 */
export const endOfAcademicYear = async (req, res) => {
  console.log('=== END OF ACADEMIC YEAR STARTED (RAW SQL ULTRA FAST) ===')
  const startTime = Date.now()

  try {
    const { academicYear } = req.body
    const targetAcademicYear = academicYear || getCurrentAcademicYear()

    // ========== STEP 1: FETCH ALL ACTIVE STUDENTS ==========
    const allActiveStudents = await prisma.student.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        class: true,
        section: true,
        studentType: true,
        isUsingSchoolTransport: true,
        isUsingSchoolHostel: true,
        schoolFeeDiscount: true,
        transportFeeDiscount: true,
        hostelFeeDiscount: true,
        village: true,
        studiedClasses: true
      }
    })

    if (allActiveStudents.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active students found to promote',
        summary: {
          totalProcessed: 0,
          successful: 0,
          failed: 0,
          academicYear: targetAcademicYear,
          promoted: 0,
          graduated: 0,
          executionTimeSeconds: 0
        },
        data: { results: [], errors: [] }
      })
    }

    const studentIds = allActiveStudents.map(s => s.id)

    // ========== STEP 2: PRE-FETCH ALL DATA IN PARALLEL ==========
    console.log(`Fetching data for ${studentIds.length} students...`)
    const [
      classFeeStructures,
      busFeeStructures,
      hostelFeeStructures,
      allAttendance,
      allMarks,
      allFeeDetails
    ] = await Promise.all([
      prisma.classFeeStructure.findMany({ where: { isActive: true } }),
      prisma.busFeeStructure.findMany({ where: { isActive: true } }),
      prisma.hostelFeeStructure.findMany({ where: { isActive: true } }),
      prisma.attendance.findMany({
        where: { studentId: { in: studentIds } },
        select: { studentId: true, morning: true, afternoon: true }
      }),
      prisma.marks.findMany({
        where: { studentId: { in: studentIds } },
        select: { studentId: true, examType: true, overallResult: true, percentage: true }
      }),
      prisma.feeDetails.findMany({
        where: { studentId: { in: studentIds } },
        orderBy: { createdAt: 'desc' },
        distinct: ['studentId']
      })
    ])

    // Create fast lookup maps
    const classFeeMap = new Map(classFeeStructures.map(c => [c.className, c]))
    const busFeeMap = new Map(busFeeStructures.map(b => [b.villageName.toLowerCase(), b]))
    const hostelFeeMap = new Map(hostelFeeStructures.map(h => [h.className, h]))

    // Attendance aggregation - SESSION BASED CORRECT CALCULATION
    const attendanceStats = {}
    for (const att of allAttendance) {
      if (!attendanceStats[att.studentId]) {
        attendanceStats[att.studentId] = { totalSessions: 0, presentSessions: 0 }
      }
      
      // Count morning session if marked
      if (att.morning !== null) {
        attendanceStats[att.studentId].totalSessions++
        if (att.morning === true) {
          attendanceStats[att.studentId].presentSessions++
        }
      }
      
      // Count afternoon session if marked
      if (att.afternoon !== null) {
        attendanceStats[att.studentId].totalSessions++
        if (att.afternoon === true) {
          attendanceStats[att.studentId].presentSessions++
        }
      }
    }

    // Marks aggregation
    const marksByStudent = {}
    for (const mark of allMarks) {
      if (!marksByStudent[mark.studentId]) marksByStudent[mark.studentId] = []
      marksByStudent[mark.studentId].push(mark)
    }

    // Fee details map
    const feeMap = new Map()
    for (const fee of allFeeDetails) {
      feeMap.set(fee.studentId, fee)
    }

    // ========== STEP 3: PREPARE DATA ==========
    // Define class order and their database mapped values
    const classOrder = [
      { enum: 'PRE_NURSERY', dbValue: 'Pre-Nursery' },
      { enum: 'NURSERY', dbValue: 'Nursery' },
      { enum: 'LKG', dbValue: 'LKG' },
      { enum: 'UKG', dbValue: 'UKG' },
      { enum: 'CLASS_1', dbValue: '1' },
      { enum: 'CLASS_2', dbValue: '2' },
      { enum: 'CLASS_3', dbValue: '3' },
      { enum: 'CLASS_4', dbValue: '4' },
      { enum: 'CLASS_5', dbValue: '5' },
      { enum: 'CLASS_6', dbValue: '6' },
      { enum: 'CLASS_7', dbValue: '7' },
      { enum: 'CLASS_8', dbValue: '8' },
      { enum: 'CLASS_9', dbValue: '9' },
      { enum: 'CLASS_10', dbValue: '10' }
    ]
    
    const getNextClassOptimized = (currentClass) => {
      const idx = classOrder.findIndex(c => c.enum === currentClass)
      if (idx !== -1 && idx < classOrder.length - 1) {
        return classOrder[idx + 1].enum
      }
      return null
    }
    
    const getDbClassValue = (classEnum) => {
      const found = classOrder.find(c => c.enum === classEnum)
      return found ? found.dbValue : classEnum
    }

    const now = new Date()
    const termDueDates = {
      term1DueDate: new Date(now.getFullYear(), now.getMonth() + 4, now.getDate()),
      term2DueDate: new Date(now.getFullYear(), now.getMonth() + 8, now.getDate()),
      term3DueDate: new Date(now.getFullYear(), now.getMonth() + 12, now.getDate())
    }

    // Prepare arrays for bulk updates
    const promotedStudents = [] // { id, dbClassValue }
    const graduatedStudents = [] // array of ids
    const studiedClassesData = [] // { id, studiedClassesJson }
    const feeUpdatesData = [] // { id, updateData }
    const promotionResults = []
    const errors = []

    // Process all students
    for (const student of allActiveStudents) {
      try {
        // Calculate stats
        const stats = attendanceStats[student.id] || { totalSessions: 0, presentSessions: 0 }
        const attendancePercentage = stats.totalSessions > 0 
          ? Math.round((stats.presentSessions / stats.totalSessions) * 10000) / 100 : 0

        const marks = marksByStudent[student.id] || []
        let overallResult = 'NA', marksPercentage = 0
        
        if (marks.length > 0) {
          overallResult = marks.some(m => m.overallResult === 'FAIL') ? 'FAIL' : 'PASS'
          const finalExam = marks.find(m => m.examType === 'FINAL')
          if (finalExam?.percentage) {
            marksPercentage = Math.round(finalExam.percentage * 100) / 100
          } else {
            const totalPercentage = marks.reduce((sum, m) => sum + (m.percentage || 0), 0)
            marksPercentage = Math.round((totalPercentage / marks.length) * 100) / 100
          }
        }

        // Update studied classes
        let studiedClasses = []
        try {
          studiedClasses = typeof student.studiedClasses === 'string' 
            ? JSON.parse(student.studiedClasses) : (student.studiedClasses || [])
          if (!Array.isArray(studiedClasses)) studiedClasses = []
        } catch (e) {
          studiedClasses = []
        }

        studiedClasses.push({
          academicYear: targetAcademicYear,
          class: student.class,
          classLabel: mapEnumToDisplayName(student.class),
          section: student.section,
          action: 'promote',
          promotedAt: new Date().toISOString(),
          summary: { overallResult, attendancePercentage, marksPercentage }
        })

        const nextClass = getNextClassOptimized(student.class)
        const isActive = nextClass !== null

        if (isActive) {
          const dbClassValue = getDbClassValue(nextClass)
          promotedStudents.push({ id: student.id, dbClassValue })
        } else {
          graduatedStudents.push(student.id)
        }
        
        studiedClassesData.push({ id: student.id, studiedClasses: JSON.stringify(studiedClasses) })

        // Handle fee updates
        const currentFee = feeMap.get(student.id)
        let previousYearDetailsArray = []
        let totalPreviousYearPending = 0
        let newYearFee = 0
        let feeUpdateData = null

        if (currentFee) {
          try {
            previousYearDetailsArray = typeof currentFee.previousYearDetails === 'string'
              ? JSON.parse(currentFee.previousYearDetails) : (currentFee.previousYearDetails || [])
            if (!Array.isArray(previousYearDetailsArray)) previousYearDetailsArray = []
          } catch (e) {
            previousYearDetailsArray = []
          }

          const termDist = currentFee.termDistribution || {}
          const totalPaidFromTerms = Object.values(termDist).reduce((sum, term) => sum + (term.totalPaid || 0), 0)

          previousYearDetailsArray.push({
            academicYear: targetAcademicYear,
            class: student.class,
            classLabel: mapEnumToDisplayName(student.class),
            section: student.section,
            originalTotalFee: currentFee.originalTotalFee || 0,
            discountedTotalFee: currentFee.discountedTotalFee || 0,
            totalPaid: totalPaidFromTerms,
            totalDue: (currentFee.discountedTotalFee || 0) - totalPaidFromTerms,
            termDistribution: currentFee.termDistribution,
            isFullyPaid: totalPaidFromTerms >= (currentFee.discountedTotalFee || 0),
            archivedAt: new Date().toISOString()
          })

          totalPreviousYearPending = previousYearDetailsArray.reduce((sum, record) => sum + (record.totalDue || 0), 0)

          if (!isActive) {
            feeUpdateData = {
              id: currentFee.id,
              previousYearDetails: JSON.stringify(previousYearDetailsArray),
              previousYearFee: totalPreviousYearPending,
              originalSchoolFee: 0, originalTransportFee: 0, originalHostelFee: 0,
              originalTotalFee: 0, discountedSchoolFee: 0, discountedTransportFee: 0,
              discountedHostelFee: 0, discountedTotalFee: 0, schoolFeePaid: 0,
              transportFeePaid: 0, hostelFeePaid: 0, totalPaid: 0, totalDue: 0,
              termDistribution: '{}', term1Due: 0, term2Due: 0, term3Due: 0,
              term1Paid: 0, term2Paid: 0, term3Paid: 0, term1DueDate: null,
              term2DueDate: null, term3DueDate: null, isFullyPaid: totalPreviousYearPending === 0,
              updatedBy: 'system-graduation'
            }
            newYearFee = 0
          } else {
            const classFee = classFeeMap.get(nextClass)
            const busFee = busFeeMap.get(student.village?.toLowerCase())
            const hostelFee = hostelFeeMap.get(nextClass)

            const originalSchoolFee = classFee?.totalAnnualFee || 0
            const originalTransportFee = (student.isUsingSchoolTransport && student.village) 
              ? (busFee?.feeAmount || 5000) : 0
            const originalHostelFee = (student.studentType === 'HOSTELLER') 
              ? (hostelFee?.totalAnnualFee || 0) : 0

            const discountedSchoolFee = Math.floor(originalSchoolFee * (100 - student.schoolFeeDiscount) / 100)
            const discountedTransportFee = Math.floor(originalTransportFee * (100 - student.transportFeeDiscount) / 100)
            const discountedHostelFee = Math.floor(originalHostelFee * (100 - student.hostelFeeDiscount) / 100)
            newYearFee = discountedSchoolFee + discountedTransportFee + discountedHostelFee

            const terms = 3
            const termDistribution = {}
            
            const baseSchoolFee = Math.floor(discountedSchoolFee / terms)
            const baseTransportFee = Math.floor(discountedTransportFee / terms)
            const baseHostelFee = Math.floor(discountedHostelFee / terms)
            
            const remainderSchool = discountedSchoolFee - (baseSchoolFee * terms)
            const remainderTransport = discountedTransportFee - (baseTransportFee * terms)
            const remainderHostel = discountedHostelFee - (baseHostelFee * terms)
            
            let term1Due = 0, term2Due = 0, term3Due = 0
            
            for (let i = 1; i <= terms; i++) {
              const schoolFeeAmt = baseSchoolFee + (i <= remainderSchool ? 1 : 0)
              const transportFeeAmt = baseTransportFee + (i <= remainderTransport ? 1 : 0)
              const hostelFeeAmt = baseHostelFee + (i <= remainderHostel ? 1 : 0)
              const termTotal = schoolFeeAmt + transportFeeAmt + hostelFeeAmt
              
              termDistribution[i] = {
                schoolFee: schoolFeeAmt, transportFee: transportFeeAmt,
                hostelFee: hostelFeeAmt, total: termTotal,
                schoolFeePaid: 0, transportFeePaid: 0, hostelFeePaid: 0,
                totalPaid: 0, status: 'Unpaid'
              }
              
              if (i === 1) term1Due = termTotal
              if (i === 2) term2Due = termTotal
              if (i === 3) term3Due = termTotal
            }

            feeUpdateData = {
              id: currentFee.id,
              previousYearDetails: JSON.stringify(previousYearDetailsArray),
              previousYearFee: totalPreviousYearPending,
              originalSchoolFee, originalTransportFee, originalHostelFee,
              originalTotalFee: originalSchoolFee + originalTransportFee + originalHostelFee,
              discountedSchoolFee, discountedTransportFee, discountedHostelFee,
              discountedTotalFee: newYearFee, schoolFeePaid: 0, transportFeePaid: 0,
              hostelFeePaid: 0, totalPaid: 0, totalDue: newYearFee,
              termDistribution: JSON.stringify(termDistribution), 
              term1Due, term2Due, term3Due,
              term1Paid: 0, term2Paid: 0, term3Paid: 0,
              term1DueDate: termDueDates.term1DueDate,
              term2DueDate: termDueDates.term2DueDate,
              term3DueDate: termDueDates.term3DueDate,
              isFullyPaid: newYearFee === 0,
              updatedBy: 'system-promotion'
            }
          }

          feeUpdatesData.push(feeUpdateData)
        }

        promotionResults.push({
          id: student.id,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          admissionNo: student.admissionNo,
          previousClass: student.class,
          previousClassLabel: mapEnumToDisplayName(student.class),
          previousSection: student.section,
          newClass: isActive ? nextClass : student.class,
          newClassLabel: isActive ? mapEnumToDisplayName(nextClass) : mapEnumToDisplayName(student.class),
          newSection: student.section,
          academicYear: targetAcademicYear,
          isActive: isActive,
          status: !isActive ? 'Graduated' : 'Promoted',
          academicSummary: { overallResult, attendancePercentage, marksPercentage },
          feeSummary: {
            previousYearDetails: previousYearDetailsArray,
            previousYearsTotal: totalPreviousYearPending,
            newYearFee: newYearFee,
            previousYearsCount: previousYearDetailsArray.length
          }
        })

      } catch (error) {
        errors.push({
          id: student.id,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          error: error.message
        })
      }
    }

    // ========== STEP 4: EXECUTE RAW SQL BULK UPDATES ==========
    console.log(`Executing raw SQL bulk updates...`)
    console.log(`- ${promotedStudents.length} promotions`)
    console.log(`- ${graduatedStudents.length} graduations`)
    console.log(`- ${feeUpdatesData.length} fee updates`)
    
    // Helper to escape strings for SQL
    const escapeSql = (str) => {
      if (str === null || str === undefined) return 'NULL'
      if (typeof str === 'string') return `'${str.replace(/'/g, "''")}'`
      return str
    }
    
    // 1. Delete attendance and marks
    if (studentIds.length > 0) {
      const idsList = studentIds.map(id => `'${id}'`).join(',')
      await prisma.$executeRawUnsafe(`DELETE FROM "Attendance" WHERE "studentId" IN (${idsList})`)
      await prisma.$executeRawUnsafe(`DELETE FROM "Marks" WHERE "studentId" IN (${idsList})`)
    }
    
    // 2. Bulk update student classes (cast to enum type)
    if (promotedStudents.length > 0) {
      const caseStatements = promotedStudents.map(s => 
        `WHEN '${s.id}' THEN '${s.dbClassValue}'::"Class"`
      ).join(' ')
      const idsList = promotedStudents.map(s => `'${s.id}'`).join(',')
      await prisma.$executeRawUnsafe(`
        UPDATE "Student" 
        SET "class" = CASE id ${caseStatements} END,
            "updatedAt" = NOW()
        WHERE id IN (${idsList})
      `)
    }
    
    // 3. Bulk inactivate graduated students
    if (graduatedStudents.length > 0) {
      const idsList = graduatedStudents.map(id => `'${id}'`).join(',')
      await prisma.$executeRawUnsafe(`
        UPDATE "Student" 
        SET "isActive" = false,
            "updatedAt" = NOW()
        WHERE id IN (${idsList})
      `)
    }
    
    // 4. Bulk update studied classes
    if (studiedClassesData.length > 0) {
      const caseStatements = studiedClassesData.map(s => 
        `WHEN '${s.id}' THEN '${s.studiedClasses.replace(/'/g, "''")}'::jsonb`
      ).join(' ')
      const idsList = studiedClassesData.map(s => `'${s.id}'`).join(',')
      await prisma.$executeRawUnsafe(`
        UPDATE "Student" 
        SET "studiedClasses" = CASE id ${caseStatements} END,
            "updatedAt" = NOW()
        WHERE id IN (${idsList})
      `)
    }
    
    // 5. Bulk update fee details
    if (feeUpdatesData.length > 0) {
      const idsList = feeUpdatesData.map(f => `'${f.id}'`).join(',')
      
      // Build CASE statements for each field
      const buildCase = (getValue) => {
        const cases = feeUpdatesData.map(f => {
          const value = getValue(f)
          if (value === 'NULL') return `WHEN '${f.id}' THEN NULL`
          return `WHEN '${f.id}' THEN ${value}`
        }).join(' ')
        return `CASE id ${cases} END`
      }
      
      const query = `
        UPDATE "FeeDetails" 
        SET 
          "previousYearDetails" = ${buildCase(f => escapeSql(f.previousYearDetails))}::jsonb,
          "previousYearFee" = ${buildCase(f => f.previousYearFee)},
          "originalSchoolFee" = ${buildCase(f => f.originalSchoolFee)},
          "originalTransportFee" = ${buildCase(f => f.originalTransportFee)},
          "originalHostelFee" = ${buildCase(f => f.originalHostelFee)},
          "originalTotalFee" = ${buildCase(f => f.originalTotalFee)},
          "discountedSchoolFee" = ${buildCase(f => f.discountedSchoolFee)},
          "discountedTransportFee" = ${buildCase(f => f.discountedTransportFee)},
          "discountedHostelFee" = ${buildCase(f => f.discountedHostelFee)},
          "discountedTotalFee" = ${buildCase(f => f.discountedTotalFee)},
          "schoolFeePaid" = ${buildCase(f => f.schoolFeePaid)},
          "transportFeePaid" = ${buildCase(f => f.transportFeePaid)},
          "hostelFeePaid" = ${buildCase(f => f.hostelFeePaid)},
          "totalPaid" = ${buildCase(f => f.totalPaid)},
          "totalDue" = ${buildCase(f => f.totalDue)},
          "termDistribution" = ${buildCase(f => escapeSql(f.termDistribution))}::jsonb,
          "term1Due" = ${buildCase(f => f.term1Due)},
          "term2Due" = ${buildCase(f => f.term2Due)},
          "term3Due" = ${buildCase(f => f.term3Due)},
          "term1Paid" = ${buildCase(f => f.term1Paid)},
          "term2Paid" = ${buildCase(f => f.term2Paid)},
          "term3Paid" = ${buildCase(f => f.term3Paid)},
          "term1DueDate" = ${buildCase(f => f.term1DueDate ? `'${f.term1DueDate.toISOString()}'::timestamp` : 'NULL')},
          "term2DueDate" = ${buildCase(f => f.term2DueDate ? `'${f.term2DueDate.toISOString()}'::timestamp` : 'NULL')},
          "term3DueDate" = ${buildCase(f => f.term3DueDate ? `'${f.term3DueDate.toISOString()}'::timestamp` : 'NULL')},
          "isFullyPaid" = ${buildCase(f => f.isFullyPaid)},
          "updatedBy" = ${buildCase(f => escapeSql(f.updatedBy))},
          "updatedAt" = NOW()
        WHERE id IN (${idsList})
      `
      
      await prisma.$executeRawUnsafe(query)
    }

    const endTime = Date.now()
    const executionTime = ((endTime - startTime) / 1000).toFixed(2)

    const summary = {
      totalProcessed: allActiveStudents.length,
      successful: promotionResults.length,
      failed: errors.length,
      promoted: promotionResults.filter(r => r.status === 'Promoted').length,
      graduated: promotionResults.filter(r => r.status === 'Graduated').length,
      academicYear: targetAcademicYear,
      averageAttendance: promotionResults.length > 0
        ? Math.round((promotionResults.reduce((sum, r) => sum + (r.academicSummary?.attendancePercentage || 0), 0) / promotionResults.length) * 100) / 100 : 0,
      averageMarks: promotionResults.length > 0
        ? Math.round((promotionResults.reduce((sum, r) => sum + (r.academicSummary?.marksPercentage || 0), 0) / promotionResults.length) * 100) / 100 : 0,
      totalPreviousYearFees: promotionResults.reduce((sum, r) => sum + (r.feeSummary?.previousYearsTotal || 0), 0),
      totalNewYearFees: promotionResults.reduce((sum, r) => sum + (r.feeSummary?.newYearFee || 0), 0),
      studentsWithPendingFees: promotionResults.filter(r => (r.feeSummary?.previousYearsTotal || 0) > 0).length,
      studentsWithCurrentYearFee: promotionResults.filter(r => (r.feeSummary?.newYearFee || 0) > 0).length,
      executionTimeSeconds: parseFloat(executionTime)
    }

    console.log(`✅ End of academic year completed in ${executionTime} seconds`)

    if (errors.length > 0) {
      return res.status(207).json({
        success: true,
        message: `Partially successful. Processed ${promotionResults.length} out of ${allActiveStudents.length} students`,
        summary,
        data: { results: promotionResults, errors }
      })
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed ${promotionResults.length} students`,
      summary,
      data: { results: promotionResults }
    })

  } catch (error) {
    console.error('End of academics error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process end of academics',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Get count of active students for promotion (NO PAGINATION)
 * @route   GET /api/students/for-promotion
 * @access  Private
 */
export const getStudentsForEndOfAcademicYear = async (req, res) => {
  try {
    const count = await prisma.student.count({
      where: {
        isActive: true
      }
    })

    res.status(200).json({
      success: true,
      count: count,
      data: null
    })
  } catch (error) {
    console.error('Get students for promotion error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch students count for promotion'
    })
  }
}

// Helper functions for in-memory calculations
function calculateAttendanceStats(attendance) {
  let totalSessions = 0
  let presentSessions = 0
  
  attendance.forEach(record => {
    totalSessions += 2
    if (record.morning === true) presentSessions++
    if (record.afternoon === true) presentSessions++
  })
  
  const percentage = totalSessions > 0 
    ? Math.round((presentSessions / totalSessions) * 100 * 100) / 100
    : 0
  
  return { totalSessions, presentSessions, percentage }
}

function calculateMarksStats(marks) {
  const finalExam = marks.find(m => m.examType === 'FINAL')
  const hasFailed = marks.some(m => m.overallResult === 'FAIL')
  const overallResult = hasFailed ? 'FAIL' : 'PASS'
  
  const percentage = finalExam?.percentage || 
    (marks.length > 0 
      ? marks.reduce((sum, m) => sum + (m.percentage || 0), 0) / marks.length
      : 0)
  
  return { overallResult, percentage: Math.round(percentage * 100) / 100 }
}

function prepareFeeUpdate(student, currentFee, nextClass, isActive, academicYear, classFees, busFees, hostelFees) {
  // Archive current year
  let previousYearDetails = []
  try {
    previousYearDetails = typeof currentFee.previousYearDetails === 'string'
      ? JSON.parse(currentFee.previousYearDetails)
      : (currentFee.previousYearDetails || [])
  } catch (e) {
    previousYearDetails = []
  }

  // Add current year to archive
  previousYearDetails.push({
    academicYear,
    class: student.class,
    classLabel: mapEnumToDisplayName(student.class),
    section: student.section,
    originalTotalFee: currentFee.originalTotalFee,
    discountedTotalFee: currentFee.discountedTotalFee,
    totalPaid: currentFee.totalPaid,
    totalDue: currentFee.totalDue,
    termDistribution: currentFee.termDistribution,
    isFullyPaid: currentFee.isFullyPaid,
    archivedAt: new Date().toISOString()
  })

  const previousYearFee = previousYearDetails.reduce((sum, r) => sum + (r.totalDue || 0), 0)

  // Calculate new year fee if active
  let updateData = {
    previousYearDetails,
    previousYearFee,
    updatedBy: 'system-promotion',
    updatedAt: new Date()
  }

  if (!isActive) {
    // Graduation case
    updateData = {
      ...updateData,
      originalSchoolFee: 0,
      originalTransportFee: 0,
      originalHostelFee: 0,
      originalTotalFee: 0,
      discountedSchoolFee: 0,
      discountedTransportFee: 0,
      discountedHostelFee: 0,
      discountedTotalFee: 0,
      totalDue: 0,
      termDistribution: {},
      isFullyPaid: previousYearFee === 0
    }
  } else if (nextClass && nextClass !== 'GRADUATED') {
    // Promotion case
    const classFee = classFees.get(nextClass)
    const busFee = busFees.get(student.village?.toLowerCase())
    const hostelFee = hostelFees.get(nextClass)

    const newSchoolFee = classFee?.totalAnnualFee || 0
    const newTransportFee = student.isUsingSchoolTransport && student.village ? (busFee?.feeAmount || 5000) : 0
    const newHostelFee = student.studentType === 'HOSTELLER' ? (hostelFee?.totalAnnualFee || 0) : 0

    const discountedSchoolFee = Math.floor(newSchoolFee * (100 - student.schoolFeeDiscount) / 100)
    const discountedTransportFee = Math.floor(newTransportFee * (100 - student.transportFeeDiscount) / 100)
    const discountedHostelFee = Math.floor(newHostelFee * (100 - student.hostelFeeDiscount) / 100)
    const discountedTotalFee = discountedSchoolFee + discountedTransportFee + discountedHostelFee

    const termDistribution = calculateTermDistribution(
      discountedSchoolFee,
      discountedTransportFee,
      discountedHostelFee
    )

    updateData = {
      ...updateData,
      originalSchoolFee: newSchoolFee,
      originalTransportFee: newTransportFee,
      originalHostelFee: newHostelFee,
      originalTotalFee: newSchoolFee + newTransportFee + newHostelFee,
      discountedSchoolFee,
      discountedTransportFee,
      discountedHostelFee,
      discountedTotalFee,
      schoolFeePaid: 0,
      transportFeePaid: 0,
      hostelFeePaid: 0,
      totalPaid: 0,
      totalDue: discountedTotalFee + previousYearFee,
      termDistribution,
      term1Due: termDistribution[1]?.total || 0,
      term2Due: termDistribution[2]?.total || 0,
      term3Due: termDistribution[3]?.total || 0,
      term1Paid: 0,
      term2Paid: 0,
      term3Paid: 0,
      isFullyPaid: false
    }
  }

  return {
    where: { id: currentFee.id },
    data: updateData,
    summary: {
      previousYearFee,
      newYearFee: updateData.discountedTotalFee || 0,
      totalDue: updateData.totalDue || 0
    }
  }
}

/**
 * @desc    Get promotion history for a student
 * @route   GET /api/students/:id/promotion-history
 * @access  Private
 */
export const getStudentPromotionHistory = async (req, res) => {
  try {
    const { id } = req.params

    const student = await prisma.student.findUnique({
      where: { id },
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

    // Parse studied classes (academic history)
    let studiedClasses = []
    try {
      studiedClasses = typeof student.studiedClasses === 'string' 
        ? JSON.parse(student.studiedClasses) 
        : (student.studiedClasses || [])
    } catch (e) {
      studiedClasses = []
    }

    // Parse previous year details (fee history)
    const currentFee = student.feeDetails[0]
    let previousYearDetails = []
    if (currentFee) {
      try {
        previousYearDetails = typeof currentFee.previousYearDetails === 'string'
          ? JSON.parse(currentFee.previousYearDetails)
          : (currentFee.previousYearDetails || [])
      } catch (e) {
        previousYearDetails = []
      }
    }

    // Sort by date (most recent first)
    studiedClasses.sort((a, b) => {
      const dateA = a.promotedAt ? new Date(a.promotedAt) : new Date(0)
      const dateB = b.promotedAt ? new Date(b.promotedAt) : new Date(0)
      return dateB - dateA
    })

    previousYearDetails.sort((a, b) => {
      const dateA = a.archivedAt ? new Date(a.archivedAt) : new Date(0)
      const dateB = b.archivedAt ? new Date(b.archivedAt) : new Date(0)
      return dateB - dateA
    })

    // Add display labels to studied classes
    const formattedAcademicHistory = studiedClasses.map(entry => ({
      ...entry,
      classLabel: mapEnumToDisplayName(entry.class),
      academicYear: entry.academicYear,
      action: entry.action || 'promote',
      date: entry.promotedAt ? new Date(entry.promotedAt).toLocaleDateString() : null,
      // These now come directly from the record
      marksPercentage: entry.marksPercentage,
      attendancePercentage: entry.attendancePercentage
    }))

    // Format fee history
    const formattedFeeHistory = previousYearDetails.map(entry => ({
      academicYear: entry.academicYear,
      originalTotalFee: entry.originalTotalFee,
      discountedTotalFee: entry.discountedTotalFee,
      totalPaid: entry.totalPaid,
      totalDue: entry.totalDue,
      isFullyPaid: entry.isFullyPaid,
      termPayments: entry.termPayments,
      discounts: entry.discounts,
      archivedAt: entry.archivedAt ? new Date(entry.archivedAt).toLocaleDateString() : null
    }))

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          admissionNo: student.admissionNo,
          currentClass: student.class,
          currentClassLabel: mapEnumToDisplayName(student.class),
          currentSection: student.section
        },
        academicHistory: formattedAcademicHistory,
        feeHistory: formattedFeeHistory,
        totalPromotions: formattedAcademicHistory.length,
        totalFeeYears: formattedFeeHistory.length,
        currentFeeStatus: currentFee ? {
          totalDue: currentFee.totalDue,
          isFullyPaid: currentFee.isFullyPaid,
          previousYearPending: currentFee.previousYearFee
        } : null
      }
    })

  } catch (error) {
    console.error('Get promotion history error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch promotion history'
    })
  }
}

// Optimized bulk import
export const bulkImportStudents = [
  upload.single('excelFile'),
  async (req, res) => {
    console.log('=== BULK IMPORT STARTED ===')
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded'
        })
      }
      
      // Parse Excel file
      let workbook, rows
      try {
        workbook = xlsx.readFile(req.file.path)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        rows = xlsx.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
          blankrows: false
        })
      } catch (excelError) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Invalid Excel file format'
        })
      }
      
      if (rows.length === 0) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty'
        })
      }

      // STEP 1: Pre-fetch all reference data in BULK
      const [
        existingAdmissionNos,
        classFeeStructures,
        busFeeStructures,
        hostelFeeStructures
      ] = await Promise.all([
        // Get all existing admission numbers for duplicate check
        prisma.student.findMany({
          select: { admissionNo: true },
          where: { admissionNo: { in: rows.map(r => r.admissionNo?.toString().trim()).filter(Boolean) } }
        }).then(results => new Set(results.map(r => r.admissionNo))),
        
        // Get all class fee structures
        prisma.classFeeStructure.findMany({
          where: { isActive: true }
        }).then(results => {
          const map = new Map()
          results.forEach(r => map.set(r.className, r))
          return map
        }),
        
        // Get all bus fee structures
        prisma.busFeeStructure.findMany({
          where: { isActive: true }
        }).then(results => {
          const map = new Map()
          results.forEach(r => map.set(r.villageName.toLowerCase(), r))
          return map
        }),
        
        // Get all hostel fee structures
        prisma.hostelFeeStructure.findMany({
          where: { isActive: true }
        }).then(results => {
          const map = new Map()
          results.forEach(r => map.set(r.className, r))
          return map
        })
      ])

      // STEP 2: Prepare data in memory (NO database calls)
      const studentsToCreate = []
      const feeDetailsToCreate = []
      const errors = []
      
      const now = new Date()
      const termDueDates = {
        term1DueDate: new Date(now.setMonth(now.getMonth() + 4)),
        term2DueDate: new Date(now.setMonth(now.getMonth() + 8)),
        term3DueDate: new Date(now.setMonth(now.getMonth() + 12))
      }

      for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2
        
        try {
          // Validation (keep your existing validation)
          if (!row.firstName || !row.lastName || !row.admissionNo || !row.parentPhone || !row.parentName) {
            errors.push({ row: rowNumber, admissionNo: row.admissionNo || 'N/A', error: 'Missing required fields' })
            continue
          }

          const admissionNo = row.admissionNo.toString().trim()
          
          // Check duplicate
          if (existingAdmissionNos.has(admissionNo)) {
            errors.push({ row: rowNumber, admissionNo, error: 'Duplicate admission number' })
            continue
          }

          // Map class
          const classEnum = mapClassToEnum(row.class)
          if (!classEnum) {
            errors.push({ row: rowNumber, admissionNo, error: `Invalid class: "${row.class}"` })
            continue
          }

          // Get fee structures from pre-fetched maps
          const classFee = classFeeStructures.get(classEnum)
          const busFee = busFeeStructures.get(row.village?.toString().toLowerCase())
          const hostelFee = hostelFeeStructures.get(classEnum)

          // Calculate fees in memory
          const isUsingTransport = row.isUsingSchoolTransport?.toString().toLowerCase() === 'true'
          const studentType = row.studentType?.toString().toUpperCase() === 'HOSTELLER' ? 'HOSTELLER' : 'DAY_SCHOLAR'
          
          const schoolFeeDiscount = parseDiscount(row.schoolFeeDiscount)
          const transportFeeDiscount = parseDiscount(row.transportFeeDiscount)
          const hostelFeeDiscount = parseDiscount(row.hostelFeeDiscount)

          // Calculate transport fee
          const transportFee = isUsingTransport && row.village ? (busFee?.feeAmount || 5000) : 0
          
          // Calculate hostel fee
          const hostelFeeAmount = studentType === 'HOSTELLER' ? (hostelFee?.totalAnnualFee || 0) : 0

          // Calculate discounted amounts
          const originalSchoolFee = classFee?.totalAnnualFee || 0
          const discountedSchoolFee = Math.floor(originalSchoolFee * (100 - schoolFeeDiscount) / 100)
          const discountedTransportFee = Math.floor(transportFee * (100 - transportFeeDiscount) / 100)
          const discountedHostelFee = Math.floor(hostelFeeAmount * (100 - hostelFeeDiscount) / 100)
          const discountedTotalFee = discountedSchoolFee + discountedTransportFee + discountedHostelFee

          // Calculate term distribution (in memory function)
          const termDistribution = calculateTermDistribution(
            discountedSchoolFee,
            discountedTransportFee,
            discountedHostelFee
          )

          // Prepare student data
          const studentId = crypto.randomUUID()
          
          studentsToCreate.push({
            id: studentId,
            firstName: row.firstName.toString().trim(),
            lastName: row.lastName.toString().trim(),
            dob: parseDate(row.dob),
            gender: row.gender?.toUpperCase() || 'NOT_SPECIFIED',
            class: classEnum,
            section: row.section?.toString().toUpperCase() || 'A',
            admissionNo,
            rollNo: row.rollNo?.toString().trim() || null,
            address: row.address?.toString().trim() || null,
            village: row.village?.toString().trim() || null,
            parentName: row.parentName.toString().trim(),
            parentPhone: row.parentPhone,
            parentPhone2: row.parentPhone2 || null,
            parentEmail: row.parentEmail?.toString().trim().toLowerCase() || null,
            studentType,
            isUsingSchoolTransport: isUsingTransport,
            schoolFeeDiscount,
            transportFeeDiscount,
            hostelFeeDiscount,
            isActive: true,
            createdAt: now,
            updatedAt: now
          })

          // Prepare fee details data
          feeDetailsToCreate.push({
            id: crypto.randomUUID(),
            studentId,
            originalSchoolFee,
            originalTransportFee: transportFee,
            originalHostelFee: hostelFeeAmount,
            originalTotalFee: originalSchoolFee + transportFee + hostelFeeAmount,
            discountedSchoolFee,
            discountedTransportFee,
            discountedHostelFee,
            discountedTotalFee,
            schoolFeePaid: 0,
            transportFeePaid: 0,
            hostelFeePaid: 0,
            totalPaid: 0,
            termDistribution,
            term1Due: termDistribution[1]?.total || 0,
            term2Due: termDistribution[2]?.total || 0,
            term3Due: termDistribution[3]?.total || 0,
            term1DueDate: termDueDates.term1DueDate,
            term2DueDate: termDueDates.term2DueDate,
            term3DueDate: termDueDates.term3DueDate,
            term1Paid: 0,
            term2Paid: 0,
            term3Paid: 0,
            schoolFeeDiscountApplied: schoolFeeDiscount,
            transportFeeDiscountApplied: transportFeeDiscount,
            hostelFeeDiscountApplied: hostelFeeDiscount,
            previousYearDetails: [],
            previousYearFee: 0,
            totalDue: discountedTotalFee,
            isFullyPaid: false,
            updatedBy: 'bulk-import',
            createdAt: now,
            updatedAt: now
          })

          existingAdmissionNos.add(admissionNo) // Prevent duplicates within same file

        } catch (error) {
          errors.push({ row: rowNumber, admissionNo: row.admissionNo || 'N/A', error: error.message })
        }
      }

      // STEP 3: Execute BULK inserts using createMany
      if (studentsToCreate.length > 0) {
        // Split into chunks of 1000 for better performance
        const chunkSize = 1000
        for (let i = 0; i < studentsToCreate.length; i += chunkSize) {
          const studentChunk = studentsToCreate.slice(i, i + chunkSize)
          const feeChunk = feeDetailsToCreate.slice(i, i + chunkSize)
          
          await prisma.$transaction([
            prisma.student.createMany({
              data: studentChunk,
              skipDuplicates: true
            }),
            prisma.feeDetails.createMany({
              data: feeChunk,
              skipDuplicates: true
            })
          ])
        }
      }

      cleanupTempFiles(req.file)

      res.status(errors.length > 0 ? 207 : 200).json({
        success: true,
        message: `Imported ${studentsToCreate.length} students successfully`,
        summary: {
          total: rows.length,
          success: studentsToCreate.length,
          failed: errors.length
        },
        errors: errors.slice(0, 100)
      })

    } catch (error) {
      console.error('Bulk import error:', error)
      cleanupTempFiles(req.file)
      res.status(500).json({
        success: false,
        message: 'Bulk import failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
]

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
export const inactiveStudent = async (req, res) => {
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

/**
 * @desc    Get students who completed 10th class for a specific academic year
 * @route   GET /api/students/graduated/batch/:academicYear
 * @access  Private
 */
export const getGraduatedBatchStudents = async (req, res) => {
  console.log('=== GET GRADUATED BATCH STUDENTS STARTED ===')
  const startTime = Date.now()

  try {
    const { academicYear } = req.params

    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Academic year is required'
      })
    }

    console.log(`Fetching students for academic year: ${academicYear}`)

    // Fetch all students with studied classes
    const allStudents = await prisma.student.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        class: true,
        section: true,
        gender: true,
        studentType: true,
        parentName: true,
        parentPhone: true,
        parentEmail: true,
        village: true,
        profilePicUrl: true,
        isActive: true,
        studiedClasses: true,
        createdAt: true,
        updatedAt: true,
        feeDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            previousYearDetails: true,
            previousYearFee: true,
            totalDue: true,
            isFullyPaid: true,
            discountedTotalFee: true,
            totalPaid: true
          }
        }
      }
    })

    // Filter students who completed 10th in the specified academic year
    const batchStudents = []

    for (const student of allStudents) {
      let studiedClasses = []
      try {
        studiedClasses = typeof student.studiedClasses === 'string'
          ? JSON.parse(student.studiedClasses)
          : (student.studiedClasses || [])
        if (!Array.isArray(studiedClasses)) studiedClasses = []
      } catch (e) {
        studiedClasses = []
      }

      // Check if student completed 10th class in the given academic year
      const class10Record = studiedClasses.find(record => 
        (record.class === 'CLASS_10' || record.classLabel === 'Class 10' || record.class === '10') &&
        record.academicYear === academicYear
      )

      if (class10Record) {
        // Get fee summary
        let feeSummary = {
          totalDue: 0,
          isFullyPaid: true,
          previousYearPending: 0,
          discountedTotalFee: 0,
          totalPaid: 0
        }
        
        if (student.feeDetails && student.feeDetails[0]) {
          const feeRecord = student.feeDetails[0]
          feeSummary = {
            totalDue: feeRecord.totalDue || 0,
            isFullyPaid: feeRecord.isFullyPaid || false,
            previousYearPending: feeRecord.previousYearFee || 0,
            discountedTotalFee: feeRecord.discountedTotalFee || 0,
            totalPaid: feeRecord.totalPaid || 0
          }
        }

        batchStudents.push({
          id: student.id,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          firstName: student.firstName,
          lastName: student.lastName,
          admissionNo: student.admissionNo,
          gender: student.gender,
          studentType: student.studentType,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          village: student.village,
          profilePicUrl: student.profilePicUrl,
          isActive: student.isActive,
          graduationInfo: {
            academicYear: class10Record.academicYear,
            class: class10Record.classLabel || 'Class 10',
            section: class10Record.section || student.section,
            passedAt: class10Record.promotedAt || class10Record.archivedAt,
            summary: class10Record.summary || {}
          },
          feeSummary,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt
        })
      }
    }

    // Calculate batch statistics
    const batchStats = {
      totalStudents: batchStudents.length,
      activeStudents: batchStudents.filter(s => s.isActive).length,
      inactiveStudents: batchStudents.filter(s => !s.isActive).length,
      maleStudents: batchStudents.filter(s => s.gender === 'MALE').length,
      femaleStudents: batchStudents.filter(s => s.gender === 'FEMALE').length,
      totalPendingFee: batchStudents.reduce((sum, s) => sum + (s.feeSummary.totalDue || 0), 0),
      fullyPaidCount: batchStudents.filter(s => s.feeSummary.isFullyPaid).length,
      passPercentage: 0, // You can calculate from studiedClasses if needed
      averageAttendance: 0, // You can calculate from attendance if needed
      averageMarks: 0 // You can calculate from marks if needed
    }

    const endTime = Date.now()
    const executionTime = ((endTime - startTime) / 1000).toFixed(2)

    console.log(`✅ Batch students fetched in ${executionTime} seconds`)
    console.log(`   Batch: ${academicYear}, Students: ${batchStudents.length}`)

    res.status(200).json({
      success: true,
      data: {
        batch: {
          academicYear,
          statistics: batchStats
        },
        students: batchStudents
      },
      executionTime: `${executionTime} seconds`
    })

  } catch (error) {
    console.error('Get graduated batch students error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch batch students',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
