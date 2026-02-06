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
  formatPhoneNumber
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

// Create student
export const createStudent = [
  upload.single('profilePic'),
  async (req, res) => {
    let uploadedProfilePic = false
    
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
        isUsingSchoolTransport = false,
        schoolFeeDiscount = 0,
        transportFeeDiscount = 0,
        hostelFeeDiscount = 0,
        parentName,
        parentPhone,
        parentPhone2,
        parentEmail,
      } = req.body

      // Validate required fields
      if (!firstName || !lastName || !admissionNo || !parentPhone || !className) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: firstName, lastName, admissionNo, parentPhone, class'
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
      let profilePicPublicId = null
      if (req.file) {
        try {
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
          
          profilePicUrl = uploadResult.url
          profilePicPublicId = uploadResult.publicId
          uploadedProfilePic = true
          
        } catch (uploadError) {
          cleanupTempFiles(req.file)
          return res.status(500).json({
            success: false,
            message: `Failed to upload profile picture: ${uploadError.message}`
          })
        }
      }

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
          isUsingSchoolTransport: studentType === 'DAY_SCHOLAR' ? 
            (isUsingSchoolTransport === true || isUsingSchoolTransport === 'true') : false,
          schoolFeeDiscount: parseDiscount(schoolFeeDiscount),
          transportFeeDiscount: parseDiscount(transportFeeDiscount),
          hostelFeeDiscount: parseDiscount(hostelFeeDiscount),
          parentName: parentName ? parentName.trim() : null,
          parentPhone: formatPhoneNumber(parentPhone),
          parentPhone2: parentPhone2 ? formatPhoneNumber(parentPhone2) : null,
          parentEmail: parentEmail ? parentEmail.trim().toLowerCase() : null,
          profilePicUrl,
          profilePicPublicId,
          isActive: true,
          
          // Create fee details
          feeDetails: {
            create: {
              schoolFee: 0,
              transportFee: 0,
              hostelFee: 0,
              totalFee: 0,
              terms: 3,
              schoolFeePaid: 0,
              transportFeePaid: 0,
              hostelFeePaid: 0,
              totalPaid: 0,
              totalDue: 0,
              schoolFeeDiscountApplied: parseDiscount(schoolFeeDiscount),
              transportFeeDiscountApplied: parseDiscount(transportFeeDiscount),
              hostelFeeDiscountApplied: parseDiscount(hostelFeeDiscount),
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

      // Prepare response
      const response = {
        success: true,
        message: 'Student created successfully',
        data: {
          ...studentWithDisplay,
          feeSummary: student.feeDetails[0] || null
        }
      }

      res.status(201).json(response)

    } catch (error) {
      if (uploadedProfilePic && req.file) {
        try {
          cleanupTempFiles(req.file)
        } catch (cleanupError) {
          console.error('Error cleaning up temp files:', cleanupError)
        }
      } else if (req.file) {
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
        class: className,
        section,
        admissionNo,
        rollNo,
        address,
        village,
        studentType,
        isUsingSchoolTransport,
        schoolFeeDiscount,
        transportFeeDiscount,
        hostelFeeDiscount,
        parentName,
        parentPhone,
        parentPhone2,
        parentEmail,
        removeProfilePic,
      } = req.body

      // Check for duplicate admission number if changed
      if (admissionNo && admissionNo !== existingStudent.admissionNo) {
        const duplicate = await prisma.student.findUnique({
          where: { admissionNo }
        })
        if (duplicate) {
          cleanupTempFiles(req.file)
          return res.status(400).json({
            success: false,
            message: 'Admission number already exists',
          })
        }
      }

      // Handle class change
      let classEnum = existingStudent.class
      if (className !== undefined) {
        const mappedClass = mapClassToEnum(className)
        if (!mappedClass) {
          cleanupTempFiles(req.file)
          return res.status(400).json({
            success: false,
            message: `Invalid class: "${className}"`,
          })
        }
        classEnum = mappedClass
      }

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
        } catch (uploadError) {
          cleanupTempFiles(req.file)
          throw new Error(
            `Failed to upload new profile picture: ${uploadError.message}`
          )
        }

        cleanupTempFiles(req.file)
      }

      // Prepare update data
      const updateData = {
        firstName: firstName !== undefined ? firstName.trim() : existingStudent.firstName,
        lastName: lastName !== undefined ? lastName.trim() : existingStudent.lastName,
        dob: dob !== undefined ? new Date(dob) : existingStudent.dob,
        gender: gender !== undefined ? gender.toUpperCase() : existingStudent.gender,
        class: classEnum,
        section: section ? section.toUpperCase() : existingStudent.section,
        admissionNo: admissionNo || existingStudent.admissionNo,
        rollNo: rollNo !== undefined ? rollNo : existingStudent.rollNo,
        address: address !== undefined ? address : existingStudent.address,
        village: village !== undefined ? village : existingStudent.village,
        studentType: studentType !== undefined ? studentType.toUpperCase() : existingStudent.studentType,
        isUsingSchoolTransport: isUsingSchoolTransport !== undefined ? 
          (isUsingSchoolTransport === true || isUsingSchoolTransport === 'true') : 
          existingStudent.isUsingSchoolTransport,
        schoolFeeDiscount: parseDiscount(schoolFeeDiscount !== undefined ? schoolFeeDiscount : existingStudent.schoolFeeDiscount),
        transportFeeDiscount: parseDiscount(transportFeeDiscount !== undefined ? transportFeeDiscount : existingStudent.transportFeeDiscount),
        hostelFeeDiscount: parseDiscount(hostelFeeDiscount !== undefined ? hostelFeeDiscount : existingStudent.hostelFeeDiscount),
        parentName: parentName !== undefined ? parentName : existingStudent.parentName,
        parentPhone: parentPhone ? formatPhoneNumber(parentPhone) : existingStudent.parentPhone,
        parentPhone2: parentPhone2 !== undefined ? 
          (parentPhone2 ? formatPhoneNumber(parentPhone2) : null) : 
          existingStudent.parentPhone2,
        parentEmail: parentEmail !== undefined ? parentEmail : existingStudent.parentEmail,
        profilePicUrl: newProfilePicUrl,
        profilePicPublicId: newProfilePicPublicId,
      }

      // Update student
      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: updateData
      })

      // Cleanup old profile picture from Cloudinary if new one uploaded
      if (oldPublicId) {
        try {
          await cloudinaryUtils.deleteFromCloudinary(oldPublicId)
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

// Get student by ID
export const getStudentById = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        attendance: true,
        marks: true,
        feeDetails: true,
        paymentHistory: true
      }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      })
    }

    const studentWithDisplay = addDisplayClassToStudent(student)

    res.status(200).json({
      success: true,
      data: studentWithDisplay,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student',
    })
  }
}

// Search students
export const searchStudents = async (req, res) => {
  try {
    const {
      query: searchQuery,
      class: classFilter,
      section,
      parentPhone,
      admissionNo,
      rollNo,
      page = 1,
      limit = 20,
      sortBy = 'firstName',
      sortOrder = 'asc',
    } = req.query

    const where = {
      isActive: true
    }

    if (searchQuery) {
      where.OR = [
        { firstName: { contains: searchQuery, mode: 'insensitive' } },
        { lastName: { contains: searchQuery, mode: 'insensitive' } },
        { parentName: { contains: searchQuery, mode: 'insensitive' } },
        { admissionNo: { contains: searchQuery, mode: 'insensitive' } },
        { village: { contains: searchQuery, mode: 'insensitive' } }
      ]
    }

    if (classFilter) {
      const classEnum = mapClassToEnum(classFilter)
      if (classEnum) {
        where.class = classEnum
      }
    }

    if (section) {
      where.section = section.toUpperCase()
    }

    if (parentPhone) {
      const cleanedPhone = formatPhoneNumber(parentPhone)
      where.OR = [
        { parentPhone: { contains: cleanedPhone, mode: 'insensitive' } },
        { parentPhone2: { contains: cleanedPhone, mode: 'insensitive' } },
      ]
    }

    if (admissionNo) {
      where.admissionNo = { contains: admissionNo, mode: 'insensitive' }
    }

    if (rollNo) {
      where.rollNo = { contains: rollNo, mode: 'insensitive' }
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
    console.error('Search students error:', error)
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

// Get students by class and section
export const getStudentsByClassAndSection = async (req, res) => {
  try {
    const {
      class: classInput,
      section,
      sortBy = 'firstName',
      sortOrder = 'asc',
    } = req.query

    console.log('getStudentsByClassAndSection - classInput:', classInput, 'section:', section)

    if (!classInput || classInput === '' || classInput === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Class parameter is required'
      })
    }

    // Map class name to enum
    const classEnum = mapClassToEnum(classInput)
    console.log('getStudentsByClassAndSection - Mapped classEnum:', classEnum)
    
    if (!classEnum) {
      return res.status(400).json({
        success: false,
        message: `Invalid class: "${classInput}". Valid formats: "1", "10", "Class 1", "Class_1", "CLASS_1"`
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
    console.log('getStudentsByClassAndSection - Validated section:', validatedSection)
    
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

    console.log('getStudentsByClassAndSection - Where clause:', where)

    const orderBy = {}
    const validSortFields = ['firstName', 'lastName', 'rollNo', 'admissionNo', 'createdAt']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'firstName'
    orderBy[sortField] = sortOrder === 'desc' ? 'desc' : 'asc'

    const students = await prisma.student.findMany({
      where,
      orderBy,
      include: {
        feeDetails: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    console.log('getStudentsByClassAndSection - Found students:', students.length)

    const studentsWithDisplay = addDisplayClassToStudents(students)

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