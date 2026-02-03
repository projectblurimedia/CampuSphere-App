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

// ==================== CRUD OPERATIONS ====================

// Get all staff with pagination and filters
export const getAllStaff = async (req, res) => {
  try {
    const { 
      department,
      designation,
      status = 'active',
      page = 1, 
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query
    
    const where = {}
    
    if (department) {
      where.department = { contains: department, mode: 'insensitive' }
    }
    
    if (designation) {
      where.designation = { contains: designation, mode: 'insensitive' }
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
        { designation: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { village: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    const orderBy = {}
    orderBy[sortBy] = sortOrder
    
    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        orderBy,
        take: limitNum,
        skip
      }),
      prisma.staff.count({ where })
    ])
    
    res.status(200).json({
      success: true,
      count: staff.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      data: staff
    })
    
  } catch (error) {
    console.error('Get all staff error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch staff',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Get single staff by ID
export const getStaffById = async (req, res) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id }
    })
    
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff not found' 
      })
    }
    
    res.status(200).json({
      success: true,
      data: staff
    })
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch staff',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Create new staff
export const createStaff = [
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
        department,
        joiningDate,
        qualification,
        aadharNumber,
        panNumber
      } = req.body
      
      // Validate required fields
      const requiredFields = [
        'firstName', 'lastName', 'dob', 'email', 'phone',
        'address', 'designation', 'department'
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
      const existingStaffByEmail = await prisma.staff.findUnique({
        where: { email: email.toLowerCase() }
      })
      if (existingStaffByEmail) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Email already exists' 
        })
      }
      
      // Check for duplicate phone
      const existingStaffByPhone = await prisma.staff.findUnique({
        where: { phone: cleanPhoneNumber(phone) }
      })
      if (existingStaffByPhone) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Phone number already exists' 
        })
      }
      
      // Check for duplicate Aadhar if provided
      if (aadharNumber) {
        const existingStaffByAadhar = await prisma.staff.findUnique({
          where: { aadharNumber }
        })
        if (existingStaffByAadhar) {
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
      if (aadharNumber && !validateAadharNumber(aadharNumber)) {
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
          message: 'Invalid gender. Must be Male, Female, or Not Specified' 
        })
      }
      
      // Upload profile picture if provided
      let profilePicUrl = null
      let profilePicPublicId = null
      if (req.file) {
        try {
          const uploadResult = await cloudinaryUtils.uploadToCloudinary(req.file.path, {
            folder: 'school/staff/profile-pictures',
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
      
      // Create staff
      const staff = await prisma.staff.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender: gender.toUpperCase(),
          dob: parseDate(dob),
          email: email.toLowerCase().trim(),
          phone: cleanPhoneNumber(phone),
          address: address.trim(),
          village: village ? village.trim() : null,
          designation: designation.trim(),
          department: department.trim(),
          joiningDate: joiningDate ? parseDate(joiningDate) : new Date(),
          qualification: qualification ? qualification.trim() : null,
          aadharNumber: aadharNumber ? aadharNumber.trim() : null,
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
      
      res.status(201).json({
        success: true,
        message: 'Staff created successfully',
        data: staff
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
      
      console.error('Create staff error:', error)
      
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
        message: error.message || 'Failed to create staff',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
]

// Update staff
export const updateStaff = [
  upload.single('profilePic'),
  async (req, res) => {
    try {
      const staffId = req.params.id
      
      const existingStaff = await prisma.staff.findUnique({
        where: { id: staffId }
      })
      
      if (!existingStaff) {
        cleanupTempFiles(req.file)
        return res.status(404).json({ 
          success: false, 
          message: 'Staff not found' 
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
        department,
        joiningDate,
        qualification,
        aadharNumber,
        panNumber,
        removeProfilePic
      } = req.body
      
      // Check for duplicate email if changing
      if (email && email.toLowerCase() !== existingStaff.email) {
        const duplicate = await prisma.staff.findUnique({
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
      if (phone && cleanPhoneNumber(phone) !== existingStaff.phone) {
        const duplicate = await prisma.staff.findUnique({
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
      if (aadharNumber && aadharNumber !== existingStaff.aadharNumber) {
        const duplicate = await prisma.staff.findUnique({
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
      let newProfilePicUrl = existingStaff.profilePicUrl
      let newProfilePicPublicId = existingStaff.profilePicPublicId
      let oldPublicId = null
      
      if (removeProfilePic === 'true' || removeProfilePic === true) {
        if (existingStaff.profilePicPublicId) {
          oldPublicId = existingStaff.profilePicPublicId
        }
        newProfilePicUrl = null
        newProfilePicPublicId = null
      }
      
      if (req.file) {
        if (existingStaff.profilePicPublicId) {
          oldPublicId = existingStaff.profilePicPublicId
        }
        
        try {
          const uploadResult = await cloudinaryUtils.uploadToCloudinary(req.file.path, {
            folder: 'school/staff/profile-pictures',
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
      
      // Prepare update data
      const updateData = {
        firstName: firstName !== undefined ? firstName.trim() : existingStaff.firstName,
        lastName: lastName !== undefined ? lastName.trim() : existingStaff.lastName,
        gender: gender ? gender.toUpperCase() : existingStaff.gender,
        dob: dob !== undefined ? parseDate(dob) : existingStaff.dob,
        email: email ? email.toLowerCase().trim() : existingStaff.email,
        phone: phone ? cleanPhoneNumber(phone) : existingStaff.phone,
        address: address !== undefined ? address.trim() : existingStaff.address,
        village: village !== undefined ? village.trim() : existingStaff.village,
        designation: designation !== undefined ? designation.trim() : existingStaff.designation,
        department: department !== undefined ? department.trim() : existingStaff.department,
        joiningDate: joiningDate !== undefined ? parseDate(joiningDate) : existingStaff.joiningDate,
        qualification: qualification !== undefined ? qualification.trim() : existingStaff.qualification,
        aadharNumber: aadharNumber !== undefined ? aadharNumber.trim() : existingStaff.aadharNumber,
        panNumber: panNumber !== undefined ? (panNumber ? panNumber.toUpperCase().trim() : null) : existingStaff.panNumber,
        profilePicUrl: newProfilePicUrl,
        profilePicPublicId: newProfilePicPublicId
      }
      
      // Update staff
      const updatedStaff = await prisma.staff.update({
        where: { id: staffId },
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
      
      res.status(200).json({
        success: true,
        message: 'Staff updated successfully',
        data: updatedStaff
      })
      
    } catch (error) {
      if (req.file) {
        cleanupTempFiles(req.file)
      }
      
      console.error('Update staff error:', error)
      
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0]
        return res.status(400).json({
          success: false,
          message: `${field === 'email' ? 'Email' : field === 'phone' ? 'Phone number' : 'Aadhar number'} already exists`
        })
      }
      
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to update staff',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
]

// Delete staff (soft delete)
export const deleteStaff = async (req, res) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id }
    })
    
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff not found' 
      })
    }
    
    // Delete profile picture from Cloudinary if exists
    if (staff.profilePicPublicId) {
      try {
        await cloudinaryUtils.deleteFromCloudinary(staff.profilePicPublicId)
      } catch (deleteError) {
        console.error('Failed to delete profile picture from Cloudinary:', deleteError.message)
      }
    }
    
    // Soft delete by marking as inactive
    await prisma.staff.update({
      where: { id: req.params.id },
      data: { 
        isActive: false,
        profilePicUrl: null,
        profilePicPublicId: null
      }
    })
    
    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully'
    })
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete staff',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Search staff
export const searchStaff = async (req, res) => {
  try {
    const { 
      query: searchQuery,
      department,
      designation,
      status = 'active',
      page = 1,
      limit = 20,
      sortBy = 'firstName',
      sortOrder = 'asc'
    } = req.query
    
    const where = {}
    
    if (searchQuery) {
      where.OR = [
        { firstName: { contains: searchQuery, mode: 'insensitive' } },
        { lastName: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { phone: { contains: searchQuery, mode: 'insensitive' } },
        { designation: { contains: searchQuery, mode: 'insensitive' } },
        { department: { contains: searchQuery, mode: 'insensitive' } },
        { village: { contains: searchQuery, mode: 'insensitive' } }
      ]
    }
    
    if (department) {
      where.department = { contains: department, mode: 'insensitive' }
    }
    
    if (designation) {
      where.designation = { contains: designation, mode: 'insensitive' }
    }
    
    // Handle status
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }
    
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    const orderBy = {}
    orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc'
    
    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        orderBy,
        take: limitNum,
        skip
      }),
      prisma.staff.count({ where })
    ])
    
    res.status(200).json({
      success: true,
      count: staff.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      data: staff
    })
    
  } catch (error) {
    console.error('Search staff error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to search staff',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Get staff statistics
export const getStaffStatistics = async (req, res) => {
  try {
    const [total, byDepartment, byDesignation, byGender, latestStaff] = await Promise.all([
      // Total staff
      prisma.staff.count({
        where: { isActive: true }
      }),
      
      // Staff by department
      prisma.staff.groupBy({
        by: ['department'],
        where: { isActive: true },
        _count: true,
        orderBy: {
          _count: 'desc'
        }
      }),
      
      // Staff by designation
      prisma.staff.groupBy({
        by: ['designation'],
        where: { isActive: true },
        _count: true,
        orderBy: {
          _count: 'desc'
        }
      }),
      
      // Staff by gender
      prisma.staff.groupBy({
        by: ['gender'],
        where: { isActive: true },
        _count: true,
        orderBy: {
          gender: 'asc'
        }
      }),
      
      // Latest staff
      prisma.staff.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: true,
          department: true,
          profilePicUrl: true,
          createdAt: true
        }
      })
    ])
    
    const statistics = {
      total,
      byDepartment,
      byDesignation,
      byGender,
      latest: latestStaff
    }
    
    res.status(200).json({
      success: true,
      data: statistics
    })
    
  } catch (error) {
    console.error('Statistics error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get staff statistics',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// ==================== BULK IMPORT ====================

// Generate Excel template for bulk import
export const downloadStaffTemplate = async (req, res) => {
  try {
    // Create workbook
    const workbook = xlsx.utils.book_new()
    
    // Define headers with descriptions
    const headers = [
      ['firstName*', 'lastName*', 'gender* (MALE/FEMALE/NOT_SPECIFIED)', 'dob* (YYYY-MM-DD)', 
       'email*', 'phone* (10 digits)', 'address*', 'village', 'designation*', 
       'department*', 'joiningDate (YYYY-MM-DD)', 'qualification', 
       'aadharNumber (12 digits)', 'panNumber (10 characters)']
    ]
    
    // Add sample data for guidance
    const sampleData = [
      ['John', 'Doe', 'MALE', '1985-05-15', 'john.doe@school.com', '9876543210', 
       '123 Main St', 'Mumbai', 'Teacher', 'Academic', '2023-06-01', 'M.Sc, B.Ed',
       '123456789012', 'ABCDE1234F'],
      ['Jane', 'Smith', 'FEMALE', '1990-08-20', 'jane.smith@school.com', '9123456780', 
       '456 Oak Ave', 'Delhi', 'Admin Officer', 'Administration', '2024-01-15', 'MBA',
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
      { wch: 15 }, // designation
      { wch: 15 }, // department
      { wch: 12 }, // joiningDate
      { wch: 20 }, // qualification
      { wch: 15 }, // aadharNumber
      { wch: 12 }  // panNumber
    ]
    worksheet['!cols'] = colWidths
    
    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Staff Template')
    
    // Add instructions sheet
    const instructions = [
      ['STAFF BULK IMPORT - TEMPLATE INSTRUCTIONS'],
      [''],
      ['IMPORTANT NOTES:'],
      ['1. Columns marked with * are REQUIRED'],
      ['2. Do not modify the column headers in the first row'],
      ['3. Delete the sample rows (2-3) before adding your data'],
      ['4. Save file as .xlsx format'],
      [''],
      ['FIELD DETAILS:'],
      ['firstName*: Staff first name (required)'],
      ['lastName*: Staff last name (required)'],
      ['gender*: Gender (MALE, FEMALE, or NOT_SPECIFIED)'],
      ['dob*: Date of birth (format: YYYY-MM-DD)'],
      ['email*: Email address (must be unique)'],
      ['phone*: Phone number (10 digits, must be unique)'],
      ['address*: Complete address'],
      ['village: Village/Town name'],
      ['designation*: Job designation (e.g., Teacher, Principal, Clerk)'],
      ['department*: Department (e.g., Academic, Administration, Sports)'],
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
    res.setHeader('Content-Disposition', 'attachment; filename=staff_bulk_import_template.xlsx')
    
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

// Bulk import staff from Excel
export const bulkImportStaff = [
  upload.single('excelFile'),
  async (req, res) => {
    console.log('=== STAFF BULK IMPORT STARTED ===')
    
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
          message: 'Excel file is empty. Please add staff data to the template.'
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
            'address', 'designation', 'department'
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
          const existingStaffByEmail = await prisma.staff.findUnique({
            where: { email }
          })
          if (existingStaffByEmail) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Duplicate email: ${email}`
            })
            continue
          }
          
          // Check for duplicate phone
          const existingStaffByPhone = await prisma.staff.findUnique({
            where: { phone }
          })
          if (existingStaffByPhone) {
            errors.push({
              row: rowNumber,
              email: email,
              error: `Duplicate phone number: ${row.phone}`
            })
            continue
          }
          
          // Check for duplicate Aadhar if provided
          if (aadharNumber) {
            const existingStaffByAadhar = await prisma.staff.findUnique({
              where: { aadharNumber }
            })
            if (existingStaffByAadhar) {
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
          
          // Parse dates
          const dob = parseDate(row.dob)
          const joiningDate = row.joiningDate ? parseDate(row.joiningDate) : new Date()
          
          // Prepare staff data
          const staffData = {
            firstName: firstName,
            lastName: lastName,
            gender: gender,
            dob: dob,
            email: email,
            phone: phone,
            address: row.address.toString().trim(),
            village: row.village ? row.village.toString().trim() : null,
            designation: row.designation.toString().trim(),
            department: row.department.toString().trim(),
            joiningDate: joiningDate,
            qualification: row.qualification ? row.qualification.toString().trim() : null,
            aadharNumber: aadharNumber,
            panNumber: row.panNumber ? row.panNumber.toString().toUpperCase().trim() : null,
            isActive: true
          }
          
          // Save staff
          await prisma.staff.create({
            data: staffData
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
        message: `Bulk import completed. ${successCount} staff members imported successfully.`,
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