import prisma from '../lib/prisma.js'
import cloudinaryUtils from '../config/cloudinary.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import {
  mapClassToEnum,
  mapEnumToDisplayName,
  addDisplayClassToStudent,
  addDisplayClassToStudents,
  parseDiscount,
  formatPhoneNumber,
  validateSection,
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
    cb(
      null,
      Date.now() +
        '-' +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    )
  },
})

const upload = multer({
  storage: tempStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    )
    const mimetype = file.mimetype.startsWith('image/')

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files are allowed for profile pictures'))
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
})

const cleanupTempFiles = (files) => {
  if (!files) return

  if (Array.isArray(files)) {
    files.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
    })
  } else if (files.path && fs.existsSync(files.path)) {
    fs.unlinkSync(files.path)
  }
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
        transportFee = busFeeStructure?.feeAmount || 0
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

    const studentsWithDisplay = addDisplayClassToStudents(students)

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