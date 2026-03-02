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

// Helper function to calculate term distribution
const calculateTermDistribution = (discountedSchoolFee, discountedTransportFee, discountedHostelFee, terms = 3) => {
  if (terms <= 0) return {}
  
  const distribution = {}
  
  const baseSchoolFee = Math.floor(discountedSchoolFee / terms)
  const baseTransportFee = Math.floor(discountedTransportFee / terms)
  const baseHostelFee = Math.floor(discountedHostelFee / terms)
  
  const remainderSchool = discountedSchoolFee - (baseSchoolFee * terms)
  const remainderTransport = discountedTransportFee - (baseTransportFee * terms)
  const remainderHostel = discountedHostelFee - (baseHostelFee * terms)
  
  for (let i = 1; i <= terms; i++) {
    const schoolFee = baseSchoolFee + (i <= remainderSchool ? 1 : 0)
    const transportFee = baseTransportFee + (i <= remainderTransport ? 1 : 0)
    const hostelFee = baseHostelFee + (i <= remainderHostel ? 1 : 0)
    
    distribution[i] = {
      schoolFee,
      transportFee,
      hostelFee,
      total: schoolFee + transportFee + hostelFee,
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

      // Prepare update data - ONLY EDITABLE FIELDS
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
        profilePicUrl: newProfilePicUrl,
        profilePicPublicId: newProfilePicPublicId,
      }

      console.log('Updating student with data:', updateData)

      // Update student
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
 * @desc    Quick search for autocomplete (ULTRA OPTIMIZED)
 * @route   GET /api/students/quick-search
 * @access  Private
 */
export const quickSearchStudents = async (req, res) => {
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
        isActive: true,
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

    const formattedStudents = students.map(student => ({
      id: student.id,
      name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      firstName: student.firstName,
      lastName: student.lastName,
      rollNo: student.rollNo,
      class: mapEnumToDisplayName(student.class),
      displayClass: mapEnumToDisplayName(student.class),
      section: student.section,
      profilePicUrl: student.profilePicUrl,
    }))

    res.status(200).json({
      success: true,
      data: formattedStudents
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
      },
      orderBy: [
        { class: 'asc' },
        { section: 'asc' },
        { firstName: 'asc' }
      ]
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
    let schoolTotalPresentPercentage = 0

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
        students: sectionStats.students
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
        classes: classes.sort((a, b) => {
          // Sort by class label then section
          if (a.classLabel === b.classLabel) {
            return a.section.localeCompare(b.section)
          }
          return a.classLabel.localeCompare(b.classLabel)
        })
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
 * @desc    Promote students to next class with proper data archiving
 * @route   POST /api/students/promote
 * @access  Private
 */
export const promoteStudents = async (req, res) => {
  try {
    const { 
      studentIds, 
      academicYear,
      action = 'promote', // 'promote', 'demote', or 'graduate'
      newSection // Optional: assign new section for promoted students
    } = req.body

    // Validate input
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs to promote'
      })
    }

    // Get current academic year if not provided
    const targetAcademicYear = academicYear || getCurrentAcademicYear()

    // Fetch all students with their current data
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        isActive: true
      },
      include: {
        feeDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active students found with the provided IDs'
      })
    }

    const promotionResults = []
    const errors = []

    // Process each student
    for (const student of students) {
      try {
        // ========== 1. FETCH ATTENDANCE AND MARKS FOR THE YEAR ==========
        // Get all attendance records for this student
        const attendanceRecords = await prisma.attendance.findMany({
          where: { studentId: student.id },
          orderBy: { date: 'asc' }
        })

        // Get all marks records for this student
        const marksRecords = await prisma.marks.findMany({
          where: { studentId: student.id },
          orderBy: { uploadedAt: 'desc' }
        })

        // ========== 2. CALCULATE ATTENDANCE STATISTICS ==========
        // Calculate based on SESSIONS not days
        let totalSessions = 0
        let presentSessions = 0
        
        attendanceRecords.forEach(record => {
          // Each day has 2 sessions
          totalSessions += 2
          
          // Count present sessions
          if (record.morning === true) presentSessions++
          if (record.afternoon === true) presentSessions++
        })
        
        // Calculate attendance percentage based on total sessions
        const attendancePercentage = totalSessions > 0 
          ? Math.round((presentSessions / totalSessions) * 100 * 100) / 100
          : 0

        // ========== 3. CALCULATE MARKS STATISTICS ==========
        // Find FINAL exam marks
        const finalExamMarks = marksRecords.find(m => m.examType === 'FINAL')
        
        // Calculate overall marks statistics
        let marksPercentage = 0
        let overallResult = 'NA'
        
        if (marksRecords.length > 0) {
          // Check if any exam has FAIL result
          const hasFailed = marksRecords.some(m => m.overallResult === 'FAIL')
          overallResult = hasFailed ? 'FAIL' : 'PASS'
          
          // Use FINAL exam if available, otherwise use best exam
          if (finalExamMarks?.percentage) {
            marksPercentage = Math.round(finalExamMarks.percentage * 100) / 100
          } else {
            // Calculate average of all exams
            const totalPercentage = marksRecords.reduce((sum, m) => sum + (m.percentage || 0), 0)
            marksPercentage = Math.round((totalPercentage / marksRecords.length) * 100) / 100
          }
        }

        // ========== 4. PARSE EXISTING STUDIED CLASSES ==========
        let studiedClasses = []
        try {
          studiedClasses = typeof student.studiedClasses === 'string' 
            ? JSON.parse(student.studiedClasses) 
            : (student.studiedClasses || [])
          if (!Array.isArray(studiedClasses)) {
            studiedClasses = []
          }
        } catch (e) {
          studiedClasses = []
        }

        // ========== 5. CREATE ACADEMIC YEAR RECORD ==========
        const academicYearRecord = {
          academicYear: targetAcademicYear,
          class: student.class,
          classLabel: mapEnumToDisplayName(student.class),
          section: student.section,
          action: action,
          promotedAt: new Date().toISOString(),
          summary: {
            overallResult: overallResult,
            attendancePercentage: attendancePercentage,
            marksPercentage: marksPercentage
          }
        }

        studiedClasses.push(academicYearRecord)

        // ========== 6. HANDLE FEE DETAILS ARCHIVING ==========
        const currentFee = student.feeDetails[0]
        let previousYearDetailsArray = []
        let totalPreviousYearPending = 0

        if (currentFee) {
          // Parse existing previous year details
          try {
            previousYearDetailsArray = typeof currentFee.previousYearDetails === 'string'
              ? JSON.parse(currentFee.previousYearDetails)
              : (currentFee.previousYearDetails || [])
            if (!Array.isArray(previousYearDetailsArray)) {
              previousYearDetailsArray = []
            }
          } catch (e) {
            previousYearDetailsArray = []
          }

          // ===== Calculate term-wise paid amounts from termDistribution =====
          const termDistribution = currentFee.termDistribution || {}
          
          // Calculate total paid from termDistribution
          const totalPaidFromTerms = Object.values(termDistribution).reduce((sum, term) => {
            return sum + (term.totalPaid || 0)
          }, 0)

          // Calculate term-wise due and paid from distribution
          const termPayments = {
            term1: {
              due: termDistribution[1]?.total || 0,
              paid: termDistribution[1]?.totalPaid || 0,
              remaining: (termDistribution[1]?.total || 0) - (termDistribution[1]?.totalPaid || 0),
              components: termDistribution[1] ? {
                schoolFee: {
                  due: termDistribution[1].schoolFee || 0,
                  paid: termDistribution[1].schoolFeePaid || 0,
                  remaining: (termDistribution[1].schoolFee || 0) - (termDistribution[1].schoolFeePaid || 0)
                },
                transportFee: {
                  due: termDistribution[1].transportFee || 0,
                  paid: termDistribution[1].transportFeePaid || 0,
                  remaining: (termDistribution[1].transportFee || 0) - (termDistribution[1].transportFeePaid || 0)
                },
                hostelFee: {
                  due: termDistribution[1].hostelFee || 0,
                  paid: termDistribution[1].hostelFeePaid || 0,
                  remaining: (termDistribution[1].hostelFee || 0) - (termDistribution[1].hostelFeePaid || 0)
                }
              } : null
            },
            term2: {
              due: termDistribution[2]?.total || 0,
              paid: termDistribution[2]?.totalPaid || 0,
              remaining: (termDistribution[2]?.total || 0) - (termDistribution[2]?.totalPaid || 0),
              components: termDistribution[2] ? {
                schoolFee: {
                  due: termDistribution[2].schoolFee || 0,
                  paid: termDistribution[2].schoolFeePaid || 0,
                  remaining: (termDistribution[2].schoolFee || 0) - (termDistribution[2].schoolFeePaid || 0)
                },
                transportFee: {
                  due: termDistribution[2].transportFee || 0,
                  paid: termDistribution[2].transportFeePaid || 0,
                  remaining: (termDistribution[2].transportFee || 0) - (termDistribution[2].transportFeePaid || 0)
                },
                hostelFee: {
                  due: termDistribution[2].hostelFee || 0,
                  paid: termDistribution[2].hostelFeePaid || 0,
                  remaining: (termDistribution[2].hostelFee || 0) - (termDistribution[2].hostelFeePaid || 0)
                }
              } : null
            },
            term3: {
              due: termDistribution[3]?.total || 0,
              paid: termDistribution[3]?.totalPaid || 0,
              remaining: (termDistribution[3]?.total || 0) - (termDistribution[3]?.totalPaid || 0),
              components: termDistribution[3] ? {
                schoolFee: {
                  due: termDistribution[3].schoolFee || 0,
                  paid: termDistribution[3].schoolFeePaid || 0,
                  remaining: (termDistribution[3].schoolFee || 0) - (termDistribution[3].schoolFeePaid || 0)
                },
                transportFee: {
                  due: termDistribution[3].transportFee || 0,
                  paid: termDistribution[3].transportFeePaid || 0,
                  remaining: (termDistribution[3].transportFee || 0) - (termDistribution[3].transportFeePaid || 0)
                },
                hostelFee: {
                  due: termDistribution[3].hostelFee || 0,
                  paid: termDistribution[3].hostelFeePaid || 0,
                  remaining: (termDistribution[3].hostelFee || 0) - (termDistribution[3].hostelFeePaid || 0)
                }
              } : null
            }
          }

          // Create FEE-ONLY record for THIS academic year
          // This object contains ONLY this year's fee data with class info
          const feeYearRecord = {
            academicYear: targetAcademicYear,
            class: student.class,
            classLabel: mapEnumToDisplayName(student.class),
            section: student.section,
            originalTotalFee: currentFee.originalTotalFee,
            discountedTotalFee: currentFee.discountedSchoolFee + currentFee.discountedTransportFee + currentFee.discountedHostelFee,
            totalPaid: totalPaidFromTerms,
            totalDue: (currentFee.discountedSchoolFee + currentFee.discountedTransportFee + currentFee.discountedHostelFee) - totalPaidFromTerms,
            termDistribution: currentFee.termDistribution, // ✅ Use the full termDistribution object
            termPayments: termPayments, // ✅ Detailed term-wise breakdown
            discounts: {
              school: currentFee.schoolFeeDiscountApplied,
              transport: currentFee.transportFeeDiscountApplied,
              hostel: currentFee.hostelFeeDiscountApplied
            },
            isFullyPaid: totalPaidFromTerms >= (currentFee.discountedSchoolFee + currentFee.discountedTransportFee + currentFee.discountedHostelFee),
            archivedAt: new Date().toISOString()
          }

          // Add this year's record to previous year details array
          previousYearDetailsArray.push(feeYearRecord)
          
          // Calculate total previous year pending by summing ALL historical records
          totalPreviousYearPending = previousYearDetailsArray.reduce((sum, record) => {
            return sum + (record.totalDue || 0)
          }, 0)
          
          console.log('Previous Year Details Array:', JSON.stringify(previousYearDetailsArray, null, 2))
          console.log('Total Previous Year Pending:', totalPreviousYearPending)
        }

        // ========== 7. DETERMINE NEXT CLASS ==========
        let nextClass = null
        let isActive = true

        if (action === 'graduate') {
          isActive = false
          nextClass = student.class
        } else if (action === 'demote') {
          nextClass = student.class
        } else {
          nextClass = getNextClass(student.class)
          if (nextClass === 'GRADUATED') {
            isActive = false
            nextClass = student.class
          }
        }

        // ========== 8. UPDATE STUDENT ==========
        const studentUpdateData = {
          studiedClasses: studiedClasses
        }

        if (isActive && nextClass && nextClass !== 'GRADUATED') {
          studentUpdateData.class = nextClass
          if (newSection) {
            studentUpdateData.section = newSection
          }
        } else {
          studentUpdateData.isActive = false
        }

        const updatedStudent = await prisma.student.update({
          where: { id: student.id },
          data: studentUpdateData
        })

        // ========== 9. DELETE ATTENDANCE AND MARKS ==========
        await prisma.attendance.deleteMany({
          where: { studentId: student.id }
        })

        await prisma.marks.deleteMany({
          where: { studentId: student.id }
        })

        // ========== 10. UPDATE FEE DETAILS ==========
        let newYearFee = 0 // Fee for the upcoming academic year
        
        if (currentFee) {
          if (!isActive) {
            // GRADUATION CASE: Archive fees, student is leaving
            await prisma.feeDetails.update({
              where: { id: currentFee.id },
              data: {
                previousYearDetails: previousYearDetailsArray,
                previousYearFee: totalPreviousYearPending,
                
                // Reset all current year amounts to 0
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
                totalDue: 0, // Graduates have no current year fee
                termDistribution: {},
                term1Due: 0,
                term2Due: 0,
                term3Due: 0,
                term1Paid: 0,
                term2Paid: 0,
                term3Paid: 0,
                term1DueDate: null,
                term2DueDate: null,
                term3DueDate: null,
                isFullyPaid: totalPreviousYearPending === 0,
                updatedBy: 'system-graduation',
                updatedAt: new Date()
              }
            })
            
            newYearFee = 0
            
          } else if (nextClass && nextClass !== 'GRADUATED') {
            // PROMOTION CASE: Set up new class fees for NEXT academic year
            
            // Get new class fee structure for the NEXT class
            const classFeeStructure = await prisma.classFeeStructure.findFirst({
              where: {
                className: nextClass,
                isActive: true
              }
            })

            // Calculate transport fee if applicable
            let transportFee = 0
            if (student.isUsingSchoolTransport && student.village) {
              const busFeeStructure = await prisma.busFeeStructure.findFirst({
                where: {
                  villageName: { contains: student.village, mode: 'insensitive' },
                  isActive: true
                }
              })
              transportFee = busFeeStructure?.feeAmount || 5000
            }

            // Calculate hostel fee if applicable
            let hostelFee = 0
            if (student.studentType === 'HOSTELLER') {
              const hostelFeeStructure = await prisma.hostelFeeStructure.findFirst({
                where: {
                  className: nextClass,
                  isActive: true
                }
              })
              hostelFee = hostelFeeStructure?.totalAnnualFee || 0
            }

            // Keep existing discounts
            const schoolFeeDiscount = student.schoolFeeDiscount
            const transportFeeDiscount = student.transportFeeDiscount
            const hostelFeeDiscount = student.hostelFeeDiscount

            // Calculate new year fees (for the upcoming academic year)
            const originalSchoolFee = classFeeStructure?.totalAnnualFee || 0
            const originalTransportFee = transportFee
            const originalHostelFee = hostelFee
            const originalTotalFee = originalSchoolFee + originalTransportFee + originalHostelFee

            const discountedSchoolFee = calculateDiscountedFees(originalSchoolFee, schoolFeeDiscount)
            const discountedTransportFee = calculateDiscountedFees(originalTransportFee, transportFeeDiscount)
            const discountedHostelFee = calculateDiscountedFees(originalHostelFee, hostelFeeDiscount)
            newYearFee = discountedSchoolFee + discountedTransportFee + discountedHostelFee

            // Calculate term distribution for new year
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

            // Update fee details
            await prisma.feeDetails.update({
              where: { id: currentFee.id },
              data: {
                // Store updated previous year details (historical records)
                previousYearDetails: previousYearDetailsArray,
                previousYearFee: totalPreviousYearPending,
                
                // NEW YEAR's fee data - these are for the UPCOMING academic year
                originalSchoolFee,
                originalTransportFee,
                originalHostelFee,
                originalTotalFee,
                
                discountedSchoolFee,
                discountedTransportFee,
                discountedHostelFee,
                discountedTotalFee: newYearFee, // ✅ This is ONLY next year's fee
                
                // RESET all paid amounts to 0 for new year
                schoolFeePaid: 0,
                transportFeePaid: 0,
                hostelFeePaid: 0,
                totalPaid: 0,
                
                // ⚠️ totalDue = ONLY the new year's fee (NO accumulation!)
                totalDue: newYearFee, // ✅ This is the key fix - ONLY current year's fee
                
                // New term distribution
                termDistribution,
                
                // New term amounts
                term1Due,
                term2Due,
                term3Due,
                
                // RESET term paid amounts
                term1Paid: 0,
                term2Paid: 0,
                term3Paid: 0,
                
                // Term due dates
                term1DueDate: termDueDates.term1DueDate,
                term2DueDate: termDueDates.term2DueDate,
                term3DueDate: termDueDates.term3DueDate,
                
                // Keep discounts
                schoolFeeDiscountApplied: schoolFeeDiscount,
                transportFeeDiscountApplied: transportFeeDiscount,
                hostelFeeDiscountApplied: hostelFeeDiscount,
                
                terms,
                isFullyPaid: newYearFee === 0, // Only check current year
                updatedBy: 'system-promotion',
                updatedAt: new Date()
              }
            })
          }
        }

        // ========== 11. FORMAT RESPONSE ==========
        promotionResults.push({
          id: student.id,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          admissionNo: student.admissionNo,
          previousClass: student.class,
          previousClassLabel: mapEnumToDisplayName(student.class),
          previousSection: student.section,
          newClass: updatedStudent.class,
          newClassLabel: mapEnumToDisplayName(updatedStudent.class),
          newSection: updatedStudent.section,
          academicYear: targetAcademicYear,
          isActive: updatedStudent.isActive,
          status: !updatedStudent.isActive ? 'Graduated' : 
                  (action === 'demote' ? 'Demoted' : 'Promoted'),
          
          academicSummary: {
            overallResult: overallResult,
            attendancePercentage: attendancePercentage,
            marksPercentage: marksPercentage
          },
          
          // ✅ FEE SUMMARY - PERFECTLY SEPARATED
          feeSummary: {
            // Array of all historical fee records - each with its own totalDue for that year ONLY
            previousYearDetails: previousYearDetailsArray.map(record => ({
              academicYear: record.academicYear,
              class: record.class,
              classLabel: record.classLabel,
              section: record.section,
              totalDue: record.totalDue, // This year's due only
              totalPaid: record.totalPaid,
              discountedTotalFee: record.discountedTotalFee,
              originalTotalFee: record.originalTotalFee,
              isFullyPaid: record.isFullyPaid,
              termDistribution: record.termDistribution, // ✅ Full term distribution
              termPayments: record.termPayments, // ✅ Detailed term breakdown
              discounts: record.discounts,
              archivedAt: record.archivedAt
            })),
            
            // ✅ SUM of all historical years' dues (e.g., 30000 + 31000 = 61000)
            previousYearsTotal: totalPreviousYearPending,
            
            // ✅ Current year's fee ONLY (for the upcoming year - e.g., 31000)
            newYearFee: newYearFee,
            
            // ✅ Current year's details (class, section for the upcoming year)
            newYearDetails: {
              academicYear: targetAcademicYear,
              class: nextClass,
              classLabel: mapEnumToDisplayName(nextClass),
              section: newSection || student.section,
              fee: newYearFee
            },
            
            // Number of historical years
            previousYearsCount: previousYearDetailsArray.length,
            
            // Is current year fully paid?
            isCurrentYearFullyPaid: newYearFee === 0
          }
        })

      } catch (error) {
        console.error(`Error promoting student ${student.id}:`, error)
        errors.push({
          id: student.id,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          error: error.message
        })
      }
    }

    // Prepare summary statistics
    const summary = {
      totalProcessed: students.length,
      successful: promotionResults.length,
      failed: errors.length,
      promoted: promotionResults.filter(r => r.status === 'Promoted').length,
      demoted: promotionResults.filter(r => r.status === 'Demoted').length,
      graduated: promotionResults.filter(r => r.status === 'Graduated').length,
      academicYear: targetAcademicYear,
      
      averageAttendance: promotionResults.length > 0
        ? Math.round((promotionResults.reduce((sum, r) => sum + (r.academicSummary?.attendancePercentage || 0), 0) / promotionResults.length) * 100) / 100
        : 0,
      averageMarks: promotionResults.length > 0
        ? Math.round((promotionResults.reduce((sum, r) => sum + (r.academicSummary?.marksPercentage || 0), 0) / promotionResults.length) * 100) / 100
        : 0,
      
      // Fee summary
      totalPreviousYearFees: promotionResults.reduce((sum, r) => sum + (r.feeSummary?.previousYearsTotal || 0), 0),
      totalNewYearFees: promotionResults.reduce((sum, r) => sum + (r.feeSummary?.newYearFee || 0), 0),
      studentsWithPendingFees: promotionResults.filter(r => (r.feeSummary?.previousYearsTotal || 0) > 0).length,
      studentsWithCurrentYearFee: promotionResults.filter(r => (r.feeSummary?.newYearFee || 0) > 0).length
    }

    if (errors.length > 0) {
      return res.status(207).json({
        success: true,
        message: `Partially successful. Processed ${promotionResults.length} out of ${students.length} students`,
        summary,
        data: {
          results: promotionResults,
          errors
        }
      })
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed ${promotionResults.length} students`,
      summary,
      data: {
        results: promotionResults
      }
    })

  } catch (error) {
    console.error('Promote students error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to promote students',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Get promotion preview with fee impact
 * @route   POST /api/students/promote/preview
 * @access  Private
 */
export const getPromotionPreview = async (req, res) => {
  try {
    const { 
      studentIds,
      academicYear,
      promoteToClass,
      newSection,
      action = 'promote',
      resetFeeDiscounts = false
    } = req.body

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs to preview'
      })
    }

    const targetAcademicYear = academicYear || getCurrentAcademicYear()

    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        isActive: true
      },
      include: {
        feeDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    const preview = await Promise.all(students.map(async (student) => {
      const currentFee = student.feeDetails[0]
      const pendingFees = currentFee ? currentFee.totalDue : 0
      
      let nextClass = null
      let isActive = true

      if (promoteToClass) {
        nextClass = promoteToClass
      } else {
        nextClass = getNextClass(student.class)
      }

      if (action === 'graduate' || nextClass === 'GRADUATED' || student.class === 'CLASS_10') {
        isActive = false
        nextClass = student.class
      }

      // Calculate new year fees if active
      let newYearFee = 0
      if (isActive && nextClass && nextClass !== 'GRADUATED') {
        const classFeeStructure = await prisma.classFeeStructure.findFirst({
          where: {
            className: nextClass,
            isActive: true
          }
        })

        let transportFee = 0
        if (student.isUsingSchoolTransport && student.village) {
          const busFeeStructure = await prisma.busFeeStructure.findFirst({
            where: {
              villageName: { contains: student.village, mode: 'insensitive' },
              isActive: true
            }
          })
          transportFee = busFeeStructure?.feeAmount || 5000
        }

        let hostelFee = 0
        if (student.studentType === 'HOSTELLER') {
          const hostelFeeStructure = await prisma.hostelFeeStructure.findFirst({
            where: {
              className: nextClass,
              isActive: true
            }
          })
          hostelFee = hostelFeeStructure?.totalAnnualFee || 0
        }

        const schoolFeeDiscount = resetFeeDiscounts ? 0 : student.schoolFeeDiscount
        const transportFeeDiscount = resetFeeDiscounts ? 0 : student.transportFeeDiscount
        const hostelFeeDiscount = resetFeeDiscounts ? 0 : student.hostelFeeDiscount

        const originalSchoolFee = classFeeStructure?.totalAnnualFee || 0
        const discountedSchoolFee = calculateDiscountedFees(originalSchoolFee, schoolFeeDiscount)
        const discountedTransportFee = calculateDiscountedFees(transportFee, transportFeeDiscount)
        const discountedHostelFee = calculateDiscountedFees(hostelFee, hostelFeeDiscount)
        
        newYearFee = discountedSchoolFee + discountedTransportFee + discountedHostelFee
      }

      return {
        id: student.id,
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        admissionNo: student.admissionNo,
        currentClass: student.class,
        currentClassLabel: mapEnumToDisplayName(student.class),
        currentSection: student.section,
        newClass: isActive ? nextClass : student.class,
        newClassLabel: isActive ? mapEnumToDisplayName(nextClass) : mapEnumToDisplayName(student.class),
        newSection: newSection || (isActive ? student.section : null),
        academicYear: targetAcademicYear,
        willBeActive: isActive,
        action: !isActive ? 'Graduate' : (action === 'demote' ? 'Demote' : 'Promote'),
        
        // Fee impact preview
        feeImpact: {
          previousYearPending: pendingFees,
          newYearFee: newYearFee,
          totalAfterPromotion: newYearFee + pendingFees,
          hasPendingFees: pendingFees > 0
        }
      }
    }))

    // Summary statistics
    const summary = {
      totalStudents: preview.length,
      willBePromoted: preview.filter(s => s.action === 'Promote').length,
      willBeDemoted: preview.filter(s => s.action === 'Demote').length,
      willGraduate: preview.filter(s => s.action === 'Graduate').length,
      willRemainActive: preview.filter(s => s.willBeActive).length,
      willBeInactive: preview.filter(s => !s.willBeActive).length,
      academicYear: targetAcademicYear,
      
      // Fee summary
      totalPreviousYearFees: preview.reduce((sum, s) => sum + (s.feeImpact?.previousYearPending || 0), 0),
      totalNewYearFees: preview.reduce((sum, s) => sum + (s.feeImpact?.newYearFee || 0), 0),
      totalFeesAfterPromotion: preview.reduce((sum, s) => sum + (s.feeImpact?.totalAfterPromotion || 0), 0),
      studentsWithPendingFees: preview.filter(s => s.feeImpact?.hasPendingFees).length
    }

    res.status(200).json({
      success: true,
      message: 'Preview generated successfully',
      summary,
      data: preview
    })

  } catch (error) {
    console.error('Promotion preview error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate promotion preview'
    })
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

// Bulk import students from Excel
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
      
      let workbook, data
      try {
        workbook = xlsx.readFile(req.file.path)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        data = xlsx.utils.sheet_to_json(worksheet, {
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
      
      if (data.length === 0) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty'
        })
      }
      
      const errors = []
      let successCount = 0
      let skippedCount = 0
      const results = []
      
      // Process each row
      for (const [index, row] of data.entries()) {
        const rowNumber = index + 2
        
        try {
          // Skip empty rows
          if (!row.firstName && !row.lastName && !row.admissionNo) {
            skippedCount++
            continue
          }
          
          // Validate required fields
          const missingFields = []
          if (!row.firstName) missingFields.push('firstName')
          if (!row.lastName) missingFields.push('lastName')
          if (!row.admissionNo) missingFields.push('admissionNo')
          if (!row.parentPhone) missingFields.push('parentPhone')
          if (!row.parentName) missingFields.push('parentName')
          
          if (missingFields.length > 0) {
            errors.push({
              row: rowNumber,
              admissionNo: row.admissionNo || 'N/A',
              error: `Missing required fields: ${missingFields.join(', ')}`
            })
            continue
          }
          
          const firstName = row.firstName.toString().trim()
          const lastName = row.lastName.toString().trim()
          const admissionNo = row.admissionNo.toString().trim()
          
          // Check duplicate
          const existingStudent = await prisma.student.findUnique({
            where: { admissionNo }
          })
          
          if (existingStudent) {
            errors.push({
              row: rowNumber,
              admissionNo,
              error: `Duplicate admission number`
            })
            continue
          }
          
          // Map class
          const classEnum = mapClassToEnum(row.class)
          if (!classEnum) {
            errors.push({
              row: rowNumber,
              admissionNo,
              error: `Invalid class: "${row.class}"`
            })
            continue
          }
          
          // Validate section
          let section = 'A'
          if (row.section) {
            const sectionStr = row.section.toString().trim().toUpperCase()
            if (['A', 'B', 'C', 'D', 'E'].includes(sectionStr)) {
              section = sectionStr
            } else {
              errors.push({
                row: rowNumber,
                admissionNo,
                error: `Invalid section. Must be A, B, C, D, or E`
              })
              continue
            }
          }
          
          // Validate phone
          if (!validatePhoneNumber(row.parentPhone)) {
            errors.push({
              row: rowNumber,
              admissionNo,
              error: `Invalid parent phone number`
            })
            continue
          }
          
          const dob = parseDate(row.dob)
          
          // Parse student type
          let studentType = 'DAY_SCHOLAR'
          if (row.studentType) {
            const typeStr = row.studentType.toString().trim().toUpperCase()
            if (typeStr === 'HOSTELLER') {
              studentType = 'HOSTELLER'
            }
          }
          
          // Parse transport
          let isUsingSchoolTransport = false
          if (row.isUsingSchoolTransport) {
            const transportStr = row.isUsingSchoolTransport.toString().trim().toLowerCase()
            isUsingSchoolTransport = transportStr === 'true' || transportStr === 'yes' || transportStr === '1'
          }
          
          // Parse discounts
          const schoolFeeDiscount = parseDiscount(row.schoolFeeDiscount)
          const transportFeeDiscount = parseDiscount(row.transportFeeDiscount)
          const hostelFeeDiscount = parseDiscount(row.hostelFeeDiscount)
          
          // ========== HANDLE PREVIOUS YEAR FEE ==========
          let previousYearDetailsArray = []
          let totalPreviousYearFee = 0
          
          const previousYearFee = parseFloat(row.previousYearFee) || 0
          
          if (previousYearFee > 0) {
            const currentAcademicYear = getCurrentAcademicYear()
            const [startYear, endYear] = currentAcademicYear.split('-').map(Number)
            const previousAcademicYear = `${startYear - 1}-${endYear - 1}`

            const currentClassDisplay = mapEnumToDisplayName(classEnum)
            const previousClassDisplay = getPreviousClass(currentClassDisplay)
            const previousClassEnum = previousClassDisplay ? mapClassToEnum(previousClassDisplay) : null

            const targetPreviousClass = previousClassEnum || classEnum
            const targetPreviousClassLabel = mapEnumToDisplayName(targetPreviousClass)

            // Create fee record following feeController structure
            const feeYearRecord = {
              academicYear: previousAcademicYear, 
              class: targetPreviousClass,
              classLabel: targetPreviousClassLabel,
              section: section,
              originalTotalFee: previousYearFee,
              discountedTotalFee: previousYearFee,
              totalPaid: 0,
              totalDue: previousYearFee,
              
              // Term distribution - all in term1 (school fee only)
              termDistribution: {
                1: {
                  schoolFee: previousYearFee,
                  transportFee: 0,
                  hostelFee: 0,
                  total: previousYearFee,
                  schoolFeePaid: 0,
                  transportFeePaid: 0,
                  hostelFeePaid: 0,
                  totalPaid: 0,
                  status: 'Unpaid'
                },
                2: {
                  schoolFee: 0, transportFee: 0, hostelFee: 0, total: 0,
                  schoolFeePaid: 0, transportFeePaid: 0, hostelFeePaid: 0,
                  totalPaid: 0, status: 'Unpaid'
                },
                3: {
                  schoolFee: 0, transportFee: 0, hostelFee: 0, total: 0,
                  schoolFeePaid: 0, transportFeePaid: 0, hostelFeePaid: 0,
                  totalPaid: 0, status: 'Unpaid'
                }
              },
              
              // Term payments breakdown
              termPayments: {
                term1: {
                  due: previousYearFee,
                  paid: 0,
                  remaining: previousYearFee,
                  components: {
                    schoolFee: { due: previousYearFee, paid: 0, remaining: previousYearFee },
                    transportFee: { due: 0, paid: 0, remaining: 0 },
                    hostelFee: { due: 0, paid: 0, remaining: 0 }
                  }
                },
                term2: {
                  due: 0, paid: 0, remaining: 0,
                  components: {
                    schoolFee: { due: 0, paid: 0, remaining: 0 },
                    transportFee: { due: 0, paid: 0, remaining: 0 },
                    hostelFee: { due: 0, paid: 0, remaining: 0 }
                  }
                },
                term3: {
                  due: 0, paid: 0, remaining: 0,
                  components: {
                    schoolFee: { due: 0, paid: 0, remaining: 0 },
                    transportFee: { due: 0, paid: 0, remaining: 0 },
                    hostelFee: { due: 0, paid: 0, remaining: 0 }
                  }
                }
              },
              
              remainingBreakdown: {
                school: previousYearFee,
                transport: 0,
                hostel: 0,
                total: previousYearFee
              },
              
              discounts: { school: 0, transport: 0, hostel: 0 },
              isFullyPaid: false,
              archivedAt: new Date().toISOString()
            }
            
            previousYearDetailsArray = [feeYearRecord]
            totalPreviousYearFee = previousYearFee
          }
          
          // ========== GET FEE STRUCTURES ==========
          const classFeeStructure = await prisma.classFeeStructure.findFirst({
            where: { className: classEnum, isActive: true }
          })
          
          // Transport fee
          let transportFee = 0
          if (isUsingSchoolTransport && row.village) {
            const busFeeStructure = await prisma.busFeeStructure.findFirst({
              where: {
                villageName: { contains: row.village.toString().trim(), mode: 'insensitive' },
                isActive: true
              }
            })
            transportFee = busFeeStructure?.feeAmount || 5000
          }
          
          // Hostel fee
          let hostelFee = 0
          if (studentType === 'HOSTELLER') {
            const hostelFeeStructure = await prisma.hostelFeeStructure.findFirst({
              where: { className: classEnum, isActive: true }
            })
            hostelFee = hostelFeeStructure?.totalAnnualFee || 0
          }
          
          // Calculate fees
          const originalSchoolFee = classFeeStructure?.totalAnnualFee || 0
          const originalTransportFee = transportFee
          const originalHostelFee = hostelFee
          const originalTotalFee = originalSchoolFee + originalTransportFee + originalHostelFee
          
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
          
          // Calculate term amounts
          let term1Due = 0, term2Due = 0, term3Due = 0
          for (let i = 1; i <= 3; i++) {
            if (termDistribution[i]) {
              if (i === 1) term1Due = termDistribution[i].total
              if (i === 2) term2Due = termDistribution[i].total
              if (i === 3) term3Due = termDistribution[i].total
            }
          }
          
          // Calculate due dates
          const now = new Date()
          const termDueDates = {
            term1DueDate: new Date(now.setMonth(now.getMonth() + 4)),
            term2DueDate: new Date(now.setMonth(now.getMonth() + 8)),
            term3DueDate: new Date(now.setMonth(now.getMonth() + 12))
          }
          
          // ========== CREATE STUDENT ==========
          const student = await prisma.student.create({
            data: {
              firstName,
              lastName,
              dob,
              gender: row.gender?.toUpperCase() || 'NOT_SPECIFIED',
              class: classEnum,
              section,
              admissionNo,
              rollNo: row.rollNo ? row.rollNo.toString().trim() : null,
              address: row.address ? row.address.toString().trim() : null,
              village: row.village ? row.village.toString().trim() : null,
              parentName: row.parentName.toString().trim(),
              parentPhone: row.parentPhone,
              parentPhone2: row.parentPhone2 ? row.parentPhone2 : null,
              parentEmail: row.parentEmail ? row.parentEmail.toString().trim().toLowerCase() : null,
              studentType,
              isUsingSchoolTransport,
              schoolFeeDiscount,
              transportFeeDiscount,
              hostelFeeDiscount,
              isActive: true,
              
              feeDetails: {
                create: {
                  originalSchoolFee,
                  originalTransportFee,
                  originalHostelFee,
                  originalTotalFee,
                  discountedSchoolFee,
                  discountedTransportFee,
                  discountedHostelFee,
                  discountedTotalFee,
                  schoolFeePaid: 0,
                  transportFeePaid: 0,
                  hostelFeePaid: 0,
                  totalPaid: 0,
                  termDistribution,
                  term1Due,
                  term2Due,
                  term3Due,
                  term1DueDate: termDueDates.term1DueDate,
                  term2DueDate: termDueDates.term2DueDate,
                  term3DueDate: termDueDates.term3DueDate,
                  term1Paid: 0,
                  term2Paid: 0,
                  term3Paid: 0,
                  schoolFeeDiscountApplied: schoolFeeDiscount,
                  transportFeeDiscountApplied: transportFeeDiscount,
                  hostelFeeDiscountApplied: hostelFeeDiscount,
                  previousYearDetails: previousYearDetailsArray,
                  previousYearFee: totalPreviousYearFee,
                  totalDue: discountedTotalFee + totalPreviousYearFee,
                  isFullyPaid: false,
                  updatedBy: 'bulk-import'
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
          
          successCount++
          results.push({
            row: rowNumber,
            admissionNo,
            name: `${firstName} ${lastName}`,
            status: 'success',
            previousYearFee: totalPreviousYearFee,
            currentYearFee: discountedTotalFee,
            totalDue: discountedTotalFee + totalPreviousYearFee
          })
          
        } catch (error) {
          console.error(`Error row ${rowNumber}:`, error)
          errors.push({
            row: rowNumber,
            admissionNo: row.admissionNo || 'N/A',
            error: error.code === 'P2002' ? 'Duplicate admission number' : error.message
          })
        }
      }
      
      cleanupTempFiles(req.file)
      
      const response = {
        success: true,
        message: `Imported ${successCount} students successfully`,
        summary: {
          total: data.length,
          success: successCount,
          failed: errors.length,
          skipped: skippedCount
        },
        results
      }
      
      if (errors.length > 0) {
        response.errors = errors.slice(0, 100)
      }
      
      res.status(errors.length > 0 ? 207 : 200).json(response)
      
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