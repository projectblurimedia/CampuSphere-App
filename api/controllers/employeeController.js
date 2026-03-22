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
        'village', 'designation'
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
 * @desc    Search for employees with advanced fuzzy matching (name only)
 * @route   GET /api/employees/quick-search
 * @access  Private
 */
export const searchEmployees = async (req, res) => {
  try {
    const { query, limit = 10, fuzzy = 'false' } = req.query

    if (!query || query.trim() === '') {
      return res.status(200).json({
        success: true,
        data: []
      })
    }

    const searchTerm = query.trim()
    let employees = []

    if (fuzzy === 'true' && process.env.DATABASE_URL?.includes('postgres')) {
      // Use PostgreSQL trigram similarity for fuzzy matching
      employees = await prisma.$queryRaw`
        SELECT 
          id, 
          "firstName", 
          "lastName", 
          designation, 
          "joiningDate",
          "isActive",
          GREATEST(
            similarity("firstName", ${searchTerm}),
            similarity("lastName", ${searchTerm}),
            similarity(CONCAT("firstName", ' ', "lastName"), ${searchTerm})
          ) as similarity
        FROM "Employee"
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
      employees = await prisma.employee.findMany({
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
          designation: true,
          joiningDate: true,
          isActive: true,
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      })
    }

    // Format and deduplicate results
    const formattedEmployees = []
    const seenIds = new Set()

    for (const employee of employees) {
      if (!seenIds.has(employee.id)) {
        seenIds.add(employee.id)
        
        // Check if search term matches from start of either name
        const firstNameMatch = employee.firstName?.toLowerCase().startsWith(searchTerm.toLowerCase())
        const lastNameMatch = employee.lastName?.toLowerCase().startsWith(searchTerm.toLowerCase())
        
        formattedEmployees.push({
          id: employee.id,
          name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
          firstName: employee.firstName,
          lastName: employee.lastName,
          designation: employee.designation,
          joiningDate: employee.joiningDate,
          isActive: employee.isActive,
          matchType: firstNameMatch ? 'first-name' : (lastNameMatch ? 'last-name' : 'full-name'),
          similarity: employee.similarity || undefined
        })
      }
    }

    // Sort by match type priority
    formattedEmployees.sort((a, b) => {
      const priority = { 'first-name': 3, 'last-name': 2, 'full-name': 1 }
      return (priority[b.matchType] || 0) - (priority[a.matchType] || 0)
    })

    res.status(200).json({
      success: true,
      data: formattedEmployees.slice(0, parseInt(limit))
    })
  } catch (error) {
    console.error('Quick search employees error:', error)
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


/**
 * @desc    Bulk import employees from Excel with optimized batch processing
 * @route   POST /api/employees/bulk-import
 * @access  Private
 */
export const bulkImportEmployees = [
  upload.single('excelFile'),
  async (req, res) => {
    console.log('=== EMPLOYEE BULK IMPORT STARTED (OPTIMIZED) ===')
    const startTime = Date.now()
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Please select a file.'
        })
      }
      
      console.log('File received:', req.file.originalname)
      console.log('File size:', req.file.size, 'bytes')
      
      // Parse Excel file with raw data handling
      let workbook, rows
      try {
        workbook = xlsx.readFile(req.file.path, {
          cellDates: true,      // Parse dates
          cellNF: true,         // Keep number formatting
          cellText: false,      // Don't convert to text
          raw: true             // Keep raw values for numbers
        })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Use raw data parsing to handle scientific notation
        rows = xlsx.utils.sheet_to_json(worksheet, {
          raw: true,            // Keep raw values
          defval: '',
          blankrows: false,
          header: 1              // Get as array first to handle formatting
        })
        
        // Get headers from first row
        const headers = rows[0]
        const dataRows = rows.slice(1)
        
        // Convert to objects with proper handling of numbers
        rows = dataRows.map(row => {
          const obj = {}
          headers.forEach((header, index) => {
            let value = row[index]
            
            // Handle scientific notation numbers (like Aadhar)
            if (typeof value === 'number' && header === 'aadharNumber') {
              // Convert to string without scientific notation
              value = value.toString().replace(/[^0-9]/g, '')
            }
            // Handle Excel date numbers
            else if (typeof value === 'number' && (header === 'dob' || header === 'joiningDate')) {
              // Excel dates are numbers starting from 1900-01-01
              const excelDate = new Date((value - 25569) * 86400 * 1000)
              if (!isNaN(excelDate.getTime())) {
                value = excelDate.toISOString().split('T')[0]
              }
            }
            // Handle regular numbers (like phone)
            else if (typeof value === 'number' && header === 'phone') {
              value = value.toString()
            }
            
            obj[header] = value || ''
          })
          return obj
        }).filter(row => row.firstName || row.lastName || row.email) // Filter empty rows
        
        console.log(`Found ${rows.length} valid rows in Excel file`)
        
      } catch (excelError) {
        console.error('Excel read error:', excelError)
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Invalid Excel file format. Please use the provided template.',
          error: process.env.NODE_ENV === 'development' ? excelError.message : undefined
        })
      }
      
      if (rows.length === 0) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty. Please add employee data.'
        })
      }
      
      // ========== STEP 1: Pre-fetch all existing data for duplicate checks ==========
      console.log('Pre-fetching existing employee data...')
      
      // Extract all emails, phones, and aadhar numbers from Excel with proper formatting
      const emailsToCheck = new Set()
      const phonesToCheck = new Set()
      const aadharNumbersToCheck = new Set()
      
      for (const row of rows) {
        // Handle email
        if (row.email && row.email.toString().trim()) {
          emailsToCheck.add(row.email.toString().toLowerCase().trim())
        }
        
        // Handle phone - clean to 10 digits
        if (row.phone) {
          let phoneStr = row.phone.toString().replace(/\D/g, '')
          if (phoneStr.length > 10) phoneStr = phoneStr.slice(-10)
          if (phoneStr.length === 10) phonesToCheck.add(phoneStr)
        }
        
        // Handle Aadhar - clean to 12 digits
        if (row.aadharNumber) {
          let aadharStr = row.aadharNumber.toString().replace(/[^0-9]/g, '')
          if (aadharStr.length > 12) aadharStr = aadharStr.slice(0, 12)
          if (aadharStr.length === 12) aadharNumbersToCheck.add(aadharStr)
        }
      }
      
      // Fetch all existing records in a single query each
      const [existingEmails, existingPhones, existingAadharNumbers] = await Promise.all([
        emailsToCheck.size > 0 
          ? prisma.employee.findMany({
              where: { email: { in: Array.from(emailsToCheck) } },
              select: { email: true }
            }).then(results => new Set(results.map(r => r.email)))
          : Promise.resolve(new Set()),
        phonesToCheck.size > 0
          ? prisma.employee.findMany({
              where: { phone: { in: Array.from(phonesToCheck) } },
              select: { phone: true }
            }).then(results => new Set(results.map(r => r.phone)))
          : Promise.resolve(new Set()),
        aadharNumbersToCheck.size > 0
          ? prisma.employee.findMany({
              where: { aadharNumber: { in: Array.from(aadharNumbersToCheck) } },
              select: { aadharNumber: true }
            }).then(results => new Set(results.map(r => r.aadharNumber)))
          : Promise.resolve(new Set())
      ])
      
      console.log(`Found ${existingEmails.size} existing emails, ${existingPhones.size} existing phones, ${existingAadharNumbers.size} existing Aadhar numbers`)
      
      // ========== STEP 2: Process all rows in memory ==========
      console.log('Processing rows in memory...')
      const employeesToCreate = []
      const errors = []
      let skippedCount = 0
      
      // Track duplicates within the same file
      const fileEmails = new Set()
      const filePhones = new Set()
      const fileAadharNumbers = new Set()
      
      for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2 // +2 for header row and 1-based index
        
        try {
          // Skip empty rows
          if (!row.firstName && !row.lastName && !row.email) {
            skippedCount++
            continue
          }
          
          // ========== VALIDATION (No DB calls) ==========
          
          // Check required fields
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
          
          // Clean and validate data
          const firstName = row.firstName.toString().trim()
          const lastName = row.lastName.toString().trim()
          const email = row.email.toString().toLowerCase().trim()
          
          // Clean phone number - remove all non-digits and take last 10
          let phoneRaw = row.phone.toString().replace(/\D/g, '')
          if (phoneRaw.length > 10) phoneRaw = phoneRaw.slice(-10)
          const phone = phoneRaw
          
          // Clean Aadhar number - remove all non-digits and take first 12
          let aadharNumber = null
          if (row.aadharNumber && row.aadharNumber.toString().trim()) {
            let aadharRaw = row.aadharNumber.toString().replace(/[^0-9]/g, '')
            if (aadharRaw.length > 12) aadharRaw = aadharRaw.slice(0, 12)
            aadharNumber = aadharRaw.length === 12 ? aadharRaw : null
          }
          
          // Check for duplicate email (in file and existing)
          if (fileEmails.has(email)) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Duplicate email within file: ${email}`
            })
            continue
          }
          
          if (existingEmails.has(email)) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Email already exists in system: ${email}`
            })
            continue
          }
          
          // Check for duplicate phone (in file and existing)
          if (filePhones.has(phone)) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Duplicate phone number within file: ${row.phone}`
            })
            continue
          }
          
          if (existingPhones.has(phone)) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Phone number already exists in system: ${row.phone}`
            })
            continue
          }
          
          // Check for duplicate Aadhar (in file and existing)
          if (aadharNumber) {
            if (fileAadharNumbers.has(aadharNumber)) {
              errors.push({
                row: rowNumber,
                email: email,
                error: `Duplicate Aadhar number within file: ${aadharNumber}`
              })
              continue
            }
            
            if (existingAadharNumbers.has(aadharNumber)) {
              errors.push({
                row: rowNumber,
                email: email,
                error: `Aadhar number already exists in system: ${aadharNumber}`
              })
              continue
            }
          }
          
          // Validate email format
          if (!validateEmail(email)) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Invalid email format: ${email}`
            })
            continue
          }
          
          // Validate phone format
          if (!validatePhoneNumber(phone)) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Invalid phone number: ${row.phone}. Must be 10 digits.`
            })
            continue
          }
          
          // Validate Aadhar format
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
          let gender = row.gender.toString().trim().toUpperCase()
          if (!validGenders.includes(gender)) {
            // Try to map common variations
            if (gender === 'M' || gender === 'MALE') gender = 'MALE'
            else if (gender === 'F' || gender === 'FEMALE') gender = 'FEMALE'
            else gender = 'NOT_SPECIFIED'
          }
          
          // Validate and map designation
          let designationStr = row.designation.toString().trim()
          // Handle various formats
          const designationMap = {
            'chairperson': 'Chairperson',
            'principal': 'Principal',
            'vice_principal': 'Vice_Principal',
            'vice principal': 'Vice_Principal',
            'vice-principal': 'Vice_Principal',
            'accountant': 'Accountant',
            'teacher': 'Teacher',
            'other': 'Other'
          }
          
          let designationEnum = designationMap[designationStr.toLowerCase()]
          if (!designationEnum) {
            designationEnum = mapDesignationToEnum(designationStr)
          }
          
          if (!designationEnum) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Invalid designation: ${row.designation}. Must be Chairperson, Principal, Vice_Principal, Accountant, Teacher, or Other.`
            })
            continue
          }
          
          // Parse dates with better handling
          let dob, joiningDate
          
          try {
            // Handle date parsing
            if (row.dob) {
              if (row.dob instanceof Date) {
                dob = row.dob
              } else {
                dob = parseDate(row.dob.toString())
              }
            } else {
              dob = new Date('2000-01-01')
            }
            
            if (row.joiningDate) {
              if (row.joiningDate instanceof Date) {
                joiningDate = row.joiningDate
              } else if (row.joiningDate.toString().trim()) {
                joiningDate = parseDate(row.joiningDate.toString())
              } else {
                joiningDate = new Date()
              }
            } else {
              joiningDate = new Date()
            }
            
            // Validate date is not in future
            if (dob > new Date()) {
              dob = new Date('2000-01-01')
            }
            
          } catch (dateError) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Invalid date format: DOB=${row.dob}, Joining=${row.joiningDate}. Use YYYY-MM-DD`
            })
            continue
          }
          
          // Prepare employee data
          const employeeId = crypto.randomUUID()
          
          const employeeData = {
            id: employeeId,
            firstName,
            lastName,
            gender,
            dob,
            email,
            phone,
            address: row.address.toString().trim(),
            village: row.village ? row.village.toString().trim() : 'Guntur', // Default village
            designation: designationEnum,
            joiningDate,
            qualification: row.qualification ? row.qualification.toString().trim() : null,
            aadharNumber: aadharNumber || null,
            panNumber: row.panNumber ? row.panNumber.toString().toUpperCase().trim() : null,
            isActive: true,
            profilePicUrl: null,
            profilePicPublicId: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          employeesToCreate.push(employeeData)
          
          // Track duplicates within file
          fileEmails.add(email)
          filePhones.add(phone)
          if (aadharNumber) fileAadharNumbers.add(aadharNumber)
          
          console.log(`✓ Row ${rowNumber} validated: ${firstName} ${lastName} - ${email}`)
          
        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          errors.push({
            row: rowNumber,
            email: row.email || 'N/A',
            error: error.message || 'Validation error'
          })
        }
      }
      
      // ========== STEP 3: Execute BULK insert in chunks ==========
      if (employeesToCreate.length === 0) {
        cleanupTempFiles(req.file)
        return res.status(200).json({
          success: true,
          message: 'No valid employees to import',
          summary: {
            total: rows.length,
            success: 0,
            failed: errors.length,
            skipped: skippedCount
          },
          errors: errors.slice(0, 100),
          debug: {
            sampleData: rows.slice(0, 2),
            sampleValidated: employeesToCreate.slice(0, 2)
          }
        })
      }
      
      console.log(`Preparing to insert ${employeesToCreate.length} employees in chunks...`)
      
      // Split into chunks of 500 for better performance
      const chunkSize = 500
      let insertedCount = 0
      const failedInserts = []
      
      for (let i = 0; i < employeesToCreate.length; i += chunkSize) {
        const chunk = employeesToCreate.slice(i, i + chunkSize)
        
        try {
          // Use createMany for maximum performance
          const result = await prisma.employee.createMany({
            data: chunk,
            skipDuplicates: true
          })
          insertedCount += result.count
          console.log(`Inserted chunk ${Math.floor(i / chunkSize) + 1}: ${result.count} employees`)
        } catch (chunkError) {
          console.error(`Error inserting chunk at index ${i}:`, chunkError)
          
          // Fallback: Insert one by one for this chunk to identify problematic records
          for (const employee of chunk) {
            try {
              await prisma.employee.create({ data: employee })
              insertedCount++
            } catch (singleError) {
              failedInserts.push({
                email: employee.email,
                error: singleError.message
              })
            }
          }
        }
      }
      
      // ========== STEP 4: Cleanup and response ==========
      cleanupTempFiles(req.file)
      
      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(2)
      
      console.log('=== IMPORT SUMMARY ===')
      console.log(`Total rows: ${rows.length}`)
      console.log(`Successfully imported: ${insertedCount}`)
      console.log(`Failed: ${errors.length + failedInserts.length}`)
      console.log(`Skipped (empty): ${skippedCount}`)
      console.log(`Duration: ${duration} seconds`)
      
      const allErrors = [...errors, ...failedInserts.map(f => ({ 
        email: f.email, 
        error: f.error 
      }))]
      
      const response = {
        success: true,
        message: `Bulk import completed. ${insertedCount} employees imported successfully in ${duration}s.`,
        summary: {
          total: rows.length,
          success: insertedCount,
          failed: allErrors.length,
          skipped: skippedCount,
          duration: `${duration}s`
        }
      }
      
      if (allErrors.length > 0) {
        response.message += ` ${allErrors.length} records failed.`
        response.errors = allErrors.slice(0, 100)
      }
      
      res.status(200).json(response)
      
    } catch (error) {
      console.error('Bulk import overall error:', error)
      console.error('Error stack:', error.stack)
      
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