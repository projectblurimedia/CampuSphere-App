import prisma from '../lib/prisma.js'
import cloudinaryUtils from '../config/cloudinary.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import xlsx from 'xlsx'

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

// Helper function to validate phone number
const validatePhoneNumber = (phone) => {
  if (!phone) return false
  const cleanPhone = phone.toString().replace(/\D/g, '')
  return /^[0-9]{10}$/.test(cleanPhone)
}

// Helper function to clean phone number
const cleanPhoneNumber = (phone) => {
  if (!phone) return ''
  const cleanPhone = phone.toString().replace(/\D/g, '')
  return cleanPhone.length === 10 ? cleanPhone : ''
}

// Helper function to validate email
const validateEmail = (email) => {
  if (!email) return false
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  return emailRegex.test(email.toString().toLowerCase())
}

// Helper function to validate Aadhar number
const validateAadharNumber = (aadhar) => {
  if (!aadhar) return false
  const cleanAadhar = aadhar.toString().replace(/\D/g, '')
  return /^[0-9]{12}$/.test(cleanAadhar)
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

// Helper function to map designation string to enum
const mapDesignationToEnum = (designation) => {
  const designationMap = {
    'chairperson': 'Chairperson',
    'principal': 'Principal',
    'vice_principal': 'Vice_Principal',
    'accountant': 'Accountant',
    'teacher': 'Teacher',
    'other': 'Other'
  }
  
  return designationMap[designation.toLowerCase()] || 'Other'
}

// Helper function to get display name for designation
const getDesignationDisplayName = (designation) => {
  const displayNames = {
    'Chairperson': 'Chairperson',
    'Principal': 'Principal',
    'Vice_Principal': 'Vice Principal',
    'Accountant': 'Accountant',
    'Teacher': 'Teacher',
    'Other': 'Other'
  }
  
  return displayNames[designation] || 'Other'
}

// Helper function to calculate age
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

// ==================== CRUD OPERATIONS ====================

// Get all employees with pagination and filters
export const getAllEmployees = async (req, res) => {
  try {
    const { 
      designation,
      status = 'active',
      page = 1, 
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query
    
    const where = {}
    
    if (designation) {
      const designationEnum = mapDesignationToEnum(designation)
      where.designation = designationEnum
    }
    
    // Handle status (convert to boolean)
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { village: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    const orderBy = {}
    orderBy[sortBy] = sortOrder
    
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy,
        take: limitNum,
        skip
      }),
      prisma.employee.count({ where })
    ])
    
    // Add display designation to response
    const employeesWithDisplay = employees.map(employee => ({
      ...employee,
      designationDisplay: getDesignationDisplayName(employee.designation)
    }))
    
    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      data: employeesWithDisplay
    })
    
  } catch (error) {
    console.error('Get all employees error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch employees',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Get single employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id }
    })
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      })
    }
    
    // Calculate age
    const age = calculateAge(employee.dob)
    
    // Add display designation to response
    const employeeWithDisplay = {
      ...employee,
      age,
      designationDisplay: getDesignationDisplayName(employee.designation)
    }
    
    res.status(200).json({
      success: true,
      data: employeeWithDisplay
    })
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch employee',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Create new employee
export const createEmployee = [
  upload.single('profilePic'),
  async (req, res) => {
    let uploadedProfilePic = false
    
    try {            
      const {
        firstName,
        lastName,
        gender = 'NOT_SPECIFIED',
        dob,
        email,
        phone,
        address,
        village,
        designation,
        joiningDate,
        qualification,
        aadharNumber,
        panNumber
      } = req.body
      
      // Validate required fields
      const requiredFields = [
        'firstName', 'lastName', 'dob', 'email', 'phone',
        'address', 'designation'
      ]
      
      const missingFields = requiredFields.filter(field => !req.body[field])
      if (missingFields.length > 0) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        })
      }
      
      // Check for duplicate email
      const existingEmployeeByEmail = await prisma.employee.findUnique({
        where: { email: email.toLowerCase() }
      })
      if (existingEmployeeByEmail) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Email already exists' 
        })
      }
      
      // Check for duplicate phone
      const existingEmployeeByPhone = await prisma.employee.findUnique({
        where: { phone: cleanPhoneNumber(phone) }
      })
      if (existingEmployeeByPhone) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Phone number already exists' 
        })
      }
      
      // Check for duplicate Aadhar if provided
      if (aadharNumber && aadharNumber.trim() !== '') {
        const existingEmployeeByAadhar = await prisma.employee.findUnique({
          where: { aadharNumber }
        })
        if (existingEmployeeByAadhar) {
          cleanupTempFiles(req.file)
          return res.status(400).json({ 
            success: false, 
            message: 'Aadhar number already exists' 
          })
        }
      }
      
      // Validate email
      if (!validateEmail(email)) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid email format' 
        })
      }
      
      // Validate phone
      if (!validatePhoneNumber(phone)) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid phone number (must be 10 digits)' 
        })
      }
      
      // Validate Aadhar if provided
      if (aadharNumber && aadharNumber.trim() !== '' && !validateAadharNumber(aadharNumber)) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid Aadhar number (must be 12 digits)' 
        })
      }
      
      // Validate gender
      if (!['MALE', 'FEMALE', 'NOT_SPECIFIED'].includes(gender.toUpperCase())) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid gender. Must be MALE, FEMALE, or NOT_SPECIFIED' 
        })
      }
      
      // Validate and map designation to enum
      const designationEnum = mapDesignationToEnum(designation)
      if (!designationEnum) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid designation' 
        })
      }
      
      // Upload profile picture if provided
      let profilePicUrl = null
      let profilePicPublicId = null
      if (req.file) {
        try {
          const uploadResult = await cloudinaryUtils.uploadToCloudinary(req.file.path, {
            folder: 'school/employees/profile-pictures',
            transformation: {
              width: 500,
              height: 500,
              crop: 'fill',
              gravity: 'face'
            }
          })
          
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
      
      // Create employee
      const employee = await prisma.employee.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender: gender.toUpperCase(),
          dob: parseDate(dob),
          email: email.toLowerCase().trim(),
          phone: cleanPhoneNumber(phone),
          address: address.trim(),
          village: village ? village.trim() : null,
          designation: designationEnum,
          joiningDate: joiningDate ? parseDate(joiningDate) : new Date(),
          qualification: qualification ? qualification.trim() : null,
          aadharNumber: aadharNumber && aadharNumber.trim() !== '' ? aadharNumber.trim() : null,
          panNumber: panNumber ? panNumber.toUpperCase().trim() : null,
          profilePicUrl,
          profilePicPublicId,
          isActive: true
        }
      })
      
      // Cleanup temp files
      if (req.file) {
        cleanupTempFiles(req.file)
      }
      
      // Add display designation to response
      const employeeWithDisplay = {
        ...employee,
        designationDisplay: getDesignationDisplayName(employee.designation)
      }
      
      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employeeWithDisplay
      })
      
    } catch (error) {
      // Cleanup uploaded files if error occurred
      if (uploadedProfilePic && req.file) {
        try {
          cleanupTempFiles(req.file)
        } catch (cleanupError) {
          console.error('Error cleaning up temp files:', cleanupError)
        }
      } else if (req.file) {
        cleanupTempFiles(req.file)
      }
      
      console.error('Create employee error:', error)
      
      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0]
        return res.status(400).json({
          success: false,
          message: `${field === 'email' ? 'Email' : field === 'phone' ? 'Phone number' : 'Aadhar number'} already exists`
        })
      }
      
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to create employee',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
]

// Update employee
export const updateEmployee = [
  upload.single('profilePic'),
  async (req, res) => {
    try {
      const employeeId = req.params.id
      
      const existingEmployee = await prisma.employee.findUnique({
        where: { id: employeeId }
      })
      
      if (!existingEmployee) {
        cleanupTempFiles(req.file)
        return res.status(404).json({ 
          success: false, 
          message: 'Employee not found' 
        })
      }
      
      const {
        firstName,
        lastName,
        gender,
        dob,
        email,
        phone,
        address,
        village,
        designation,
        joiningDate,
        qualification,
        aadharNumber,
        panNumber,
        removeProfilePic
      } = req.body
      
      // Check for duplicate email if changing
      if (email && email.toLowerCase() !== existingEmployee.email) {
        const duplicate = await prisma.employee.findUnique({
          where: { email: email.toLowerCase() }
        })
        if (duplicate) {
          cleanupTempFiles(req.file)
          return res.status(400).json({ 
            success: false, 
            message: 'Email already exists' 
          })
        }
      }
      
      // Check for duplicate phone if changing
      if (phone && cleanPhoneNumber(phone) !== existingEmployee.phone) {
        const duplicate = await prisma.employee.findUnique({
          where: { phone: cleanPhoneNumber(phone) }
        })
        if (duplicate) {
          cleanupTempFiles(req.file)
          return res.status(400).json({ 
            success: false, 
            message: 'Phone number already exists' 
          })
        }
      }
      
      // Check for duplicate Aadhar if changing
      if (aadharNumber && aadharNumber.trim() !== '' && aadharNumber !== existingEmployee.aadharNumber) {
        const duplicate = await prisma.employee.findUnique({
          where: { aadharNumber }
        })
        if (duplicate) {
          cleanupTempFiles(req.file)
          return res.status(400).json({ 
            success: false, 
            message: 'Aadhar number already exists' 
          })
        }
      }
      
      // Handle profile picture
      let newProfilePicUrl = existingEmployee.profilePicUrl
      let newProfilePicPublicId = existingEmployee.profilePicPublicId
      let oldPublicId = null
      
      if (removeProfilePic === 'true' || removeProfilePic === true) {
        if (existingEmployee.profilePicPublicId) {
          oldPublicId = existingEmployee.profilePicPublicId
        }
        newProfilePicUrl = null
        newProfilePicPublicId = null
      }
      
      if (req.file) {
        if (existingEmployee.profilePicPublicId) {
          oldPublicId = existingEmployee.profilePicPublicId
        }
        
        try {
          const uploadResult = await cloudinaryUtils.uploadToCloudinary(req.file.path, {
            folder: 'school/employees/profile-pictures',
            transformation: {
              width: 500,
              height: 500,
              crop: 'fill',
              gravity: 'face'
            }
          })
          
          newProfilePicUrl = uploadResult.url
          newProfilePicPublicId = uploadResult.publicId
          
        } catch (uploadError) {
          cleanupTempFiles(req.file)
          throw new Error(`Failed to upload new profile picture: ${uploadError.message}`)
        }
        
        cleanupTempFiles(req.file)
      }
      
      // Map designation to enum if provided
      let designationEnum = existingEmployee.designation
      if (designation !== undefined) {
        const mappedDesignation = mapDesignationToEnum(designation)
        if (!mappedDesignation) {
          cleanupTempFiles(req.file)
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid designation' 
          })
        }
        designationEnum = mappedDesignation
      }
      
      // Prepare update data
      const updateData = {
        firstName: firstName !== undefined ? firstName.trim() : existingEmployee.firstName,
        lastName: lastName !== undefined ? lastName.trim() : existingEmployee.lastName,
        gender: gender ? gender.toUpperCase() : existingEmployee.gender,
        dob: dob !== undefined ? parseDate(dob) : existingEmployee.dob,
        email: email ? email.toLowerCase().trim() : existingEmployee.email,
        phone: phone ? cleanPhoneNumber(phone) : existingEmployee.phone,
        address: address !== undefined ? address.trim() : existingEmployee.address,
        village: village !== undefined ? village.trim() : existingEmployee.village,
        designation: designationEnum,
        joiningDate: joiningDate !== undefined ? parseDate(joiningDate) : existingEmployee.joiningDate,
        qualification: qualification !== undefined ? qualification.trim() : existingEmployee.qualification,
        aadharNumber: aadharNumber !== undefined ? (aadharNumber.trim() !== '' ? aadharNumber.trim() : null) : existingEmployee.aadharNumber,
        panNumber: panNumber !== undefined ? (panNumber ? panNumber.toUpperCase().trim() : null) : existingEmployee.panNumber,
        profilePicUrl: newProfilePicUrl,
        profilePicPublicId: newProfilePicPublicId
      }
      
      // Update employee
      const updatedEmployee = await prisma.employee.update({
        where: { id: employeeId },
        data: updateData
      })
      
      // Delete old profile picture from Cloudinary
      if (oldPublicId) {
        try {
          await cloudinaryUtils.deleteFromCloudinary(oldPublicId)
        } catch (deleteError) {
          console.error('Failed to delete old profile picture from Cloudinary:', deleteError.message)
        }
      }
      
      // Calculate age
      const age = calculateAge(updatedEmployee.dob)
      
      // Add display designation to response
      const employeeWithDisplay = {
        ...updatedEmployee,
        age,
        designationDisplay: getDesignationDisplayName(updatedEmployee.designation)
      }
      
      res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        data: employeeWithDisplay
      })
      
    } catch (error) {
      if (req.file) {
        cleanupTempFiles(req.file)
      }
      
      console.error('Update employee error:', error)
      
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0]
        return res.status(400).json({
          success: false,
          message: `${field === 'email' ? 'Email' : field === 'phone' ? 'Phone number' : 'Aadhar number'} already exists`
        })
      }
      
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to update employee',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
]

// Delete employee (soft delete)
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id }
    })
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      })
    }
    
    // Delete profile picture from Cloudinary if exists
    if (employee.profilePicPublicId) {
      try {
        await cloudinaryUtils.deleteFromCloudinary(employee.profilePicPublicId)
      } catch (deleteError) {
        console.error('Failed to delete profile picture from Cloudinary:', deleteError.message)
      }
    }
    
    // Soft delete by marking as inactive
    await prisma.employee.update({
      where: { id: req.params.id },
      data: { 
        isActive: false,
        profilePicUrl: null,
        profilePicPublicId: null
      }
    })
    
    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    })
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete employee',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Search employees by name, email, phone (OPTIMIZED)
 * @route   GET /api/employees/search
 * @access  Private
 */
export const searchEmployees = async (req, res) => {
  try {
    const {
      query,
      designation,
      status = 'active',
      page = 1,
      limit = 20,
      sortBy = 'firstName',
      sortOrder = 'asc',
    } = req.query

    // Build where clause efficiently
    const where = {}

    // Handle status filter
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // OPTIMIZED: Search by name, email, phone
    if (query && query.trim() !== '') {
      const searchTerm = query.trim()
      
      // Split search term into words for better matching
      const searchWords = searchTerm.split(' ').filter(word => word.length > 0)
      
      if (searchWords.length === 1) {
        // Single word - search in multiple fields
        where.OR = [
          { firstName: { contains: searchWords[0], mode: 'insensitive' } },
          { lastName: { contains: searchWords[0], mode: 'insensitive' } },
          { email: { contains: searchWords[0], mode: 'insensitive' } },
          { phone: { contains: searchWords[0], mode: 'insensitive' } },
          { village: { contains: searchWords[0], mode: 'insensitive' } },
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
          // Also try matching any word in any field for flexibility
          {
            OR: searchWords.map(word => ({
              OR: [
                { firstName: { contains: word, mode: 'insensitive' } },
                { lastName: { contains: word, mode: 'insensitive' } },
                { email: { contains: word, mode: 'insensitive' } },
                { phone: { contains: word, mode: 'insensitive' } },
                { village: { contains: word, mode: 'insensitive' } },
              ]
            }))
          }
        ]
      }
    }

    // Apply designation filter
    if (designation && designation !== 'All' && designation !== 'all') {
      const designationEnum = mapDesignationToEnum(designation)
      if (designationEnum) {
        where.designation = designationEnum
      }
    }

    // Pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Sorting (using indexes on firstName, lastName, email)
    const orderBy = {}
    const validSortFields = ['firstName', 'lastName', 'email', 'designation', 'joiningDate', 'createdAt']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'firstName'
    orderBy[sortField] = sortOrder === 'desc' ? 'desc' : 'asc'

    // Execute count and find in parallel for better performance
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy,
        take: limitNum,
        skip,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          designation: true,
          gender: true,
          village: true,
          profilePicUrl: true,
          isActive: true,
          joiningDate: true,
          createdAt: true,
        }
      }),
      prisma.employee.count({ where })
    ])

    // Add display names
    const employeesWithDisplay = employees.map(employee => ({
      ...employee,
      name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      designationDisplay: getDesignationDisplayName(employee.designation),
    }))

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
      data: employeesWithDisplay,
    })
  } catch (error) {
    console.error('Search employees error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search employees',
    })
  }
}

/**
 * @desc    Quick search for autocomplete (ULTRA OPTIMIZED)
 * @route   GET /api/employees/quick-search
 * @access  Private
 */
export const quickSearchEmployees = async (req, res) => {
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
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ]
      },
      take: parseInt(limit),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        designation: true,
        profilePicUrl: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    const formattedEmployees = employees.map(employee => ({
      id: employee.id,
      name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      designation: employee.designation,
      designationDisplay: getDesignationDisplayName(employee.designation),
      profilePicUrl: employee.profilePicUrl,
    }))

    res.status(200).json({
      success: true,
      data: formattedEmployees
    })
  } catch (error) {
    console.error('Quick search error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search employees',
    })
  }
}

/**
 * @desc    Get all employees whose birthday is today
 * @route   GET /api/employees/today-birthdays
 * @access  Private
 */
export const getTodayBirthdays = async (req, res) => {
  try {
    const today = new Date()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()

    console.log(`Fetching employee birthdays for: Month ${todayMonth}, Day ${todayDay}`)

    // Use raw SQL to filter by month and day directly in the database
    const birthdayEmployees = await prisma.$queryRaw`
      SELECT 
        id, 
        "firstName", 
        "lastName", 
        dob, 
        email,
        phone,
        designation, 
        "profilePicUrl", 
        "profilePicPublicId", 
        gender,
        village,
        "isActive"
      FROM "Employee"
      WHERE 
        "isActive" = true 
        AND dob IS NOT NULL
        AND EXTRACT(MONTH FROM dob) = ${todayMonth}
        AND EXTRACT(DAY FROM dob) = ${todayDay}
      ORDER BY 
        designation ASC, 
        "firstName" ASC
    `

    console.log(`Found ${birthdayEmployees.length} employees with birthday today`)

    // If no employees found, return early
    if (birthdayEmployees.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        date: today.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        data: [],
        groupedByDesignation: {}
      })
    }

    // Add display name and formatted data
    const employeesWithDisplay = birthdayEmployees.map(employee => ({
      id: employee.id,
      name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      designation: employee.designation,
      designationDisplay: getDesignationDisplayName(employee.designation),
      village: employee.village,
      dob: employee.dob,
      age: calculateAge(employee.dob),
      ageYears: `${calculateAge(employee.dob)} years`,
      dobFormatted: new Date(employee.dob).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      profilePicUrl: employee.profilePicUrl,
      gender: employee.gender,
      isActive: employee.isActive
    }))

    // Group by designation for better presentation
    const groupedByDesignation = {}
    employeesWithDisplay.forEach(employee => {
      const designationKey = employee.designationDisplay
      if (!groupedByDesignation[designationKey]) {
        groupedByDesignation[designationKey] = []
      }
      groupedByDesignation[designationKey].push(employee)
    })

    // Sort designations in a logical order
    const designationOrder = [
      'Chairperson',
      'Principal',
      'Vice Principal',
      'Accountant',
      'Teacher',
      'Other'
    ]

    const sortedGroupedByDesignation = {}
    Object.keys(groupedByDesignation)
      .sort((a, b) => {
        const aIndex = designationOrder.indexOf(a)
        const bIndex = designationOrder.indexOf(b)
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
      })
      .forEach(key => {
        sortedGroupedByDesignation[key] = groupedByDesignation[key]
      })

    res.status(200).json({
      success: true,
      count: birthdayEmployees.length,
      date: today.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      data: employeesWithDisplay,
      groupedByDesignation: sortedGroupedByDesignation
    })
  } catch (error) {
    console.error('Get today birthdays error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch birthday employees',
    })
  }
}

// Get employee statistics
export const getEmployeeStatistics = async (req, res) => {
  try {
    const [total, byDesignation, byGender, latestEmployees, birthdayCount] = await Promise.all([
      // Total employees
      prisma.employee.count({
        where: { isActive: true }
      }),
      
      // Employees by designation
      prisma.employee.groupBy({
        by: ['designation'],
        where: { isActive: true },
        _count: true,
        orderBy: {
          _count: 'desc'
        }
      }),
      
      // Employees by gender
      prisma.employee.groupBy({
        by: ['gender'],
        where: { isActive: true },
        _count: true,
        orderBy: {
          gender: 'asc'
        }
      }),
      
      // Latest employees
      prisma.employee.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: true,
          profilePicUrl: true,
          createdAt: true
        }
      }),
      
      // Today's birthday count
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "Employee"
        WHERE 
          "isActive" = true 
          AND dob IS NOT NULL
          AND EXTRACT(MONTH FROM dob) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(DAY FROM dob) = EXTRACT(DAY FROM CURRENT_DATE)
      `
    ])
    
    // Add display names to designation statistics
    const byDesignationWithDisplay = byDesignation.map(item => ({
      ...item,
      designationDisplay: getDesignationDisplayName(item.designation)
    }))
    
    // Add display names to latest employees
    const latestEmployeesWithDisplay = latestEmployees.map(employee => ({
      ...employee,
      name: `${employee.firstName} ${employee.lastName}`.trim(),
      designationDisplay: getDesignationDisplayName(employee.designation)
    }))
    
    const statistics = {
      total,
      byDesignation: byDesignationWithDisplay,
      byGender,
      latest: latestEmployeesWithDisplay,
      birthdaysToday: parseInt(birthdayCount[0]?.count || 0)
    }
    
    res.status(200).json({
      success: true,
      data: statistics
    })
    
  } catch (error) {
    console.error('Statistics error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get employee statistics',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// ==================== BULK IMPORT ====================

// Generate Excel template for bulk import
export const downloadEmployeeTemplate = async (req, res) => {
  try {
    // Create workbook
    const workbook = xlsx.utils.book_new()
    
    // Define headers with descriptions
    const headers = [
      ['firstName*', 'lastName*', 'gender* (MALE/FEMALE/NOT_SPECIFIED)', 'dob* (YYYY-MM-DD)', 
       'email*', 'phone* (10 digits)', 'address*', 'village', 'designation* (Chairperson/Principal/Vice_Principal/Accountant/Teacher/Other)', 
        'joiningDate (YYYY-MM-DD)', 'qualification', 
       'aadharNumber (12 digits)', 'panNumber (10 characters)']
    ]
    
    // Add sample data for guidance
    const sampleData = [
      ['John', 'Doe', 'MALE', '1985-05-15', 'john.doe@school.com', '9876543210', 
       '123 Main St', 'Mumbai', 'Teacher', '2023-06-01', 'M.Sc, B.Ed',
       '123456789012', 'ABCDE1234F'],
      ['Jane', 'Smith', 'FEMALE', '1990-08-20', 'jane.smith@school.com', '9123456780', 
       '456 Oak Ave', 'Delhi', 'Principal', '2024-01-15', 'MBA',
       '987654321098', 'XYZAB1234C']
    ]
    
    // Create worksheet
    const worksheet = xlsx.utils.aoa_to_sheet([...headers, ...sampleData])
    
    // Set column widths
    const colWidths = [
      { wch: 12 }, // firstName
      { wch: 12 }, // lastName
      { wch: 15 }, // gender
      { wch: 12 }, // dob
      { wch: 25 }, // email
      { wch: 12 }, // phone
      { wch: 25 }, // address
      { wch: 15 }, // village
      { wch: 20 }, // designation
      { wch: 12 }, // joiningDate
      { wch: 20 }, // qualification
      { wch: 15 }, // aadharNumber
      { wch: 12 }  // panNumber
    ]
    worksheet['!cols'] = colWidths
    
    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Employee Template')
    
    // Add instructions sheet
    const instructions = [
      ['EMPLOYEE BULK IMPORT - TEMPLATE INSTRUCTIONS'],
      [''],
      ['IMPORTANT NOTES:'],
      ['1. Columns marked with * are REQUIRED'],
      ['2. Do not modify the column headers in the first row'],
      ['3. Delete the sample rows (2-3) before adding your data'],
      ['4. Save file as .xlsx format'],
      [''],
      ['FIELD DETAILS:'],
      ['firstName*: Employee first name (required)'],
      ['lastName*: Employee last name (required)'],
      ['gender*: Gender (MALE, FEMALE, or NOT_SPECIFIED)'],
      ['dob*: Date of birth (format: YYYY-MM-DD)'],
      ['email*: Email address (must be unique)'],
      ['phone*: Phone number (10 digits, must be unique)'],
      ['address*: Complete address'],
      ['village: Village/Town name'],
      ['designation*: Job designation (Chairperson, Principal, Vice_Principal, Accountant, Teacher, or Other)'],
      ['joiningDate: Date of joining (format: YYYY-MM-DD)'],
      ['qualification: Educational qualifications'],
      ['aadharNumber: 12-digit Aadhar number (must be unique if provided)'],
      ['panNumber: PAN card number (10 characters)'],
      [''],
      ['VALIDATION RULES:'],
      ['- email and phone must be UNIQUE'],
      ['- Phone numbers must be 10 digits'],
      ['- Aadhar number must be 12 digits if provided'],
      ['- Dates must be in YYYY-MM-DD format'],
      ['- Designation must be from the predefined list'],
      ['- Maximum file size: 10MB'],
      ['- Save file before uploading']
    ]
    
    const instructionSheet = xlsx.utils.aoa_to_sheet(instructions)
    instructionSheet['!cols'] = [{ wch: 100 }]
    xlsx.utils.book_append_sheet(workbook, instructionSheet, 'Instructions')
    
    // Generate buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=employee_bulk_import_template.xlsx')
    
    // Send file
    res.send(excelBuffer)
    
  } catch (error) {
    console.error('Template generation error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate Excel template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Bulk import employees from Excel
export const bulkImportEmployees = [
  upload.single('excelFile'),
  async (req, res) => {
    console.log('=== EMPLOYEE BULK IMPORT STARTED ===')
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Please select a file.'
        })
      }
      
      console.log('File received:', req.file.originalname)
      console.log('File size:', req.file.size, 'bytes')
      console.log('File path:', req.file.path)
      
      // Verify file exists
      if (!fs.existsSync(req.file.path)) {
        return res.status(400).json({
          success: false,
          message: 'Uploaded file not found on server'
        })
      }
      
      let workbook, data
      try {
        // Read the Excel file
        workbook = xlsx.readFile(req.file.path)
        console.log('Excel sheets:', workbook.SheetNames)
        
        const sheetName = workbook.SheetNames[0] || workbook.SheetNames
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to JSON
        data = xlsx.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
          blankrows: false
        })
        
        console.log('Rows found in Excel:', data.length)
        
      } catch (excelError) {
        console.error('Excel read error:', excelError)
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Invalid Excel file format. Please use the provided template.',
          error: process.env.NODE_ENV === 'development' ? excelError.message : undefined
        })
      }
      
      if (data.length === 0) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty. Please add employee data to the template.'
        })
      }
      
      const errors = []
      let successCount = 0
      let skippedCount = 0
      
      // Process each row
      for (const [index, row] of data.entries()) {
        const rowNumber = index + 2 // +2 for header row and 1-based index
        
        try {
          console.log(`Processing row ${rowNumber}:`, row.email || 'No email')
          
          // Skip empty rows
          if (!row.firstName && !row.lastName && !row.email) {
            console.log(`Row ${rowNumber} skipped: Empty row`)
            skippedCount++
            continue
          }
          
          // Validate required fields
          const requiredFields = [
            'firstName', 'lastName', 'gender', 'dob', 'email', 'phone',
            'address', 'designation'
          ]
          
          const missingFields = requiredFields.filter(field => !row[field] || row[field].toString().trim() === '')
          
          if (missingFields.length > 0) {
            errors.push({
              row: rowNumber,
              email: row.email || 'N/A',
              error: `Missing required fields: ${missingFields.join(', ')}`
            })
            continue
          }
          
          // Trim all string fields
          const firstName = row.firstName.toString().trim()
          const lastName = row.lastName.toString().trim()
          const email = row.email.toString().toLowerCase().trim()
          const phone = cleanPhoneNumber(row.phone)
          const aadharNumber = row.aadharNumber ? row.aadharNumber.toString().replace(/\D/g, '').substring(0, 12) : null
          
          // Check for duplicate email
          const existingEmployeeByEmail = await prisma.employee.findUnique({
            where: { email }
          })
          if (existingEmployeeByEmail) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Duplicate email: ${email}`
            })
            continue
          }
          
          // Check for duplicate phone
          const existingEmployeeByPhone = await prisma.employee.findUnique({
            where: { phone }
          })
          if (existingEmployeeByPhone) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Duplicate phone number: ${row.phone}`
            })
            continue
          }
          
          // Check for duplicate Aadhar if provided
          if (aadharNumber) {
            const existingEmployeeByAadhar = await prisma.employee.findUnique({
              where: { aadharNumber }
            })
            if (existingEmployeeByAadhar) {
              errors.push({
                row: rowNumber,
                email: email,
                error: `Duplicate Aadhar number: ${aadharNumber}`
              })
              continue
            }
          }
          
          // Validate email
          if (!validateEmail(email)) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Invalid email format: ${email}`
            })
            continue
          }
          
          // Validate phone
          if (!validatePhoneNumber(row.phone)) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Invalid phone number: ${row.phone}. Must be 10 digits.`
            })
            continue
          }
          
          // Validate Aadhar if provided
          if (aadharNumber && !validateAadharNumber(aadharNumber)) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Invalid Aadhar number: ${row.aadharNumber}. Must be 12 digits.`
            })
            continue
          }
          
          // Validate gender
          const validGenders = ['MALE', 'FEMALE', 'NOT_SPECIFIED']
          const gender = row.gender.toString().trim().toUpperCase()
          if (!validGenders.includes(gender)) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Invalid gender: ${row.gender}. Must be MALE, FEMALE, or NOT_SPECIFIED.`
            })
            continue
          }
          
          // Validate and map designation
          const designationEnum = mapDesignationToEnum(row.designation)
          if (!designationEnum) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Invalid designation: ${row.designation}. Must be Chairperson, Principal, Vice_Principal, Accountant, Teacher, or Other.`
            })
            continue
          }
          
          // Parse dates
          const dob = parseDate(row.dob)
          const joiningDate = row.joiningDate ? parseDate(row.joiningDate) : new Date()
          
          // Prepare employee data
          const employeeData = {
            firstName: firstName,
            lastName: lastName,
            gender: gender,
            dob: dob,
            email: email,
            phone: phone,
            address: row.address.toString().trim(),
            village: row.village ? row.village.toString().trim() : null,
            designation: designationEnum,
            joiningDate: joiningDate,
            qualification: row.qualification ? row.qualification.toString().trim() : null,
            aadharNumber: aadharNumber,
            panNumber: row.panNumber ? row.panNumber.toString().toUpperCase().trim() : null,
            isActive: true
          }
          
          // Save employee
          await prisma.employee.create({
            data: employeeData
          })
          successCount++
          console.log(`✓ Row ${rowNumber} saved: ${email} - ${firstName} ${lastName}`)
          
        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          errors.push({
            row: rowNumber,
            email: row.email || 'N/A',
            error: error.code === 'P2002' ? 'Duplicate entry (email or phone)' : 
                  error.message || 'Database error. Check data format.'
          })
        }
      }
      
      // Cleanup temp file
      cleanupTempFiles(req.file)
      
      console.log('=== IMPORT SUMMARY ===')
      console.log(`Total rows processed: ${data.length}`)
      console.log(`Successfully imported: ${successCount}`)
      console.log(`Failed: ${errors.length}`)
      console.log(`Skipped (empty): ${skippedCount}`)
      
      // Prepare response
      const response = {
        success: true,
        message: `Bulk import completed. ${successCount} employees imported successfully.`,
        summary: {
          total: data.length,
          success: successCount,
          failed: errors.length,
          skipped: skippedCount,
          errors: errors.slice(0, 100) // Limit to 100 errors
        }
      }
      
      // Add warning if there were failures
      if (errors.length > 0) {
        response.message += ` ${errors.length} records failed.`
      }
      
      res.status(200).json(response)
      
    } catch (error) {
      console.error('Bulk import overall error:', error)
      console.error('Error stack:', error.stack)
      
      // Cleanup temp file if exists
      cleanupTempFiles(req.file)
      
      res.status(500).json({
        success: false,
        message: 'Bulk import failed due to server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
]

// Test endpoint for debugging
export const testImport = [
  upload.single('excelFile'),
  async (req, res) => {
    try {
      console.log('Test import endpoint called')
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file received'
        })
      }
      
      const fileInfo = {
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path,
        mimetype: req.file.mimetype,
        exists: fs.existsSync(req.file.path)
      }
      
      // Try to read the Excel file
      try {
        const workbook = xlsx.readFile(req.file.path)
        const sheetNames = workbook.SheetNames
        const firstSheet = workbook.Sheets[sheetNames[0]]
        const data = xlsx.utils.sheet_to_json(firstSheet, { 
          raw: false,
          defval: '',
          blankrows: false 
        })
        
        fileInfo.sheetCount = sheetNames.length
        fileInfo.rowCount = data.length
        
        // Show column names from first row
        if (data.length > 0) {
          fileInfo.columns = Object.keys(data[0])
          fileInfo.sampleData = data.slice(0, 2)
        }
        
      } catch (excelError) {
        fileInfo.excelError = excelError.message
      }
      
      // Cleanup
      cleanupTempFiles(req.file)
      
      res.status(200).json({
        success: true,
        message: 'Test successful',
        fileInfo: fileInfo
      })
      
    } catch (error) {
      console.error('Test error:', error)
      cleanupTempFiles(req.file)
      
      res.status(500).json({
        success: false,
        message: 'Test failed',
        error: error.message
      })
    }
  }
]