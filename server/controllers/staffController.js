const mongoose = require('mongoose')
const Staff = require('../models/Staff')
const cloudinaryUtils = require('../config/cloudinary')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const xlsx = require('xlsx')

// Configure multer for file uploads
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
  return phone.toString().replace(/\D/g, '').substring(0, 10)
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

// Helper function to validate Pincode
const validatePincode = (pincode) => {
  if (!pincode) return false
  const cleanPincode = pincode.toString().replace(/\D/g, '')
  return /^[0-9]{6}$/.test(cleanPincode)
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
exports.getAllStaff = async (req, res) => {
  try {
    const { 
      department,
      designation,
      status,
      page = 1, 
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query
    
    const query = {}
    
    if (department) {
      query.department = { $regex: department, $options: 'i' }
    }
    
    if (designation) {
      query.designation = { $regex: designation, $options: 'i' }
    }
    
    if (status) {
      query.status = status
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ]
    }
    
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    const sort = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    
    const staff = await Staff.find(query)
      .sort(sort)
      .limit(limitNum)
      .skip(skip)
      .select('-__v')
    
    const total = await Staff.countDocuments(query)
    
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
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).select('-__v')
    
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
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid staff ID format' 
      })
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch staff',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Create new staff
exports.createStaff = [
  upload.single('profilePic'),
  async (req, res) => {
    try {            
      const {
        firstName,
        lastName,
        gender,
        dob,
        email,
        phone,
        alternatePhone,
        address,
        city,
        state,
        pincode,
        employeeId,
        designation,
        department,
        joiningDate,
        qualification,
        experience,
        aadharNumber,
        panNumber,
        status
      } = req.body
      
      // Validate required fields
      const requiredFields = [
        'firstName', 'lastName', 'gender', 'dob', 'email', 'phone',
        'address', 'city', 'state', 'pincode', 'employeeId',
        'designation', 'department', 'qualification', 'experience',
        'aadharNumber'
      ]
      
      const missingFields = requiredFields.filter(field => !req.body[field])
      if (missingFields.length > 0) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        })
      }
      
      // Check for duplicate employee ID
      const existingStaffById = await Staff.findOne({ employeeId })
      if (existingStaffById) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Employee ID already exists' 
        })
      }
      
      // Check for duplicate email
      const existingStaffByEmail = await Staff.findOne({ email: email.toLowerCase() })
      if (existingStaffByEmail) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Email already exists' 
        })
      }
      
      // Check for duplicate Aadhar
      const existingStaffByAadhar = await Staff.findOne({ aadharNumber })
      if (existingStaffByAadhar) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Aadhar number already exists' 
        })
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
      
      // Validate pincode
      if (!validatePincode(pincode)) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid pincode (must be 6 digits)' 
        })
      }
      
      // Validate Aadhar
      if (!validateAadharNumber(aadharNumber)) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid Aadhar number (must be 12 digits)' 
        })
      }
      
      // Validate gender
      if (!['Male', 'Female', 'Other'].includes(gender)) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid gender. Must be Male, Female, or Other' 
        })
      }
      
      // Validate status if provided
      if (status && !['Active', 'Inactive', 'On Leave', 'Resigned', 'Terminated'].includes(status)) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid status' 
        })
      }
      
      let profilePicData = null
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
          
          profilePicData = {
            url: uploadResult.url,
            publicId: uploadResult.publicId
          }
          
        } catch (uploadError) {
          cleanupTempFiles(req.file)
          throw new Error(`Failed to upload profile picture: ${uploadError.message}`)
        }
        
        cleanupTempFiles(req.file)
      }
      
      // Prepare staff data
      const staffData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        dob: parseDate(dob),
        email: email.toLowerCase().trim(),
        phone: cleanPhoneNumber(phone),
        alternatePhone: alternatePhone ? cleanPhoneNumber(alternatePhone) : null,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.toString().replace(/\D/g, '').substring(0, 6),
        employeeId: employeeId.toUpperCase().trim(),
        designation: designation.trim(),
        department: department.trim(),
        joiningDate: joiningDate ? parseDate(joiningDate) : new Date(),
        qualification: qualification.trim(),
        experience: parseInt(experience) || 0,
        aadharNumber: aadharNumber.toString().replace(/\D/g, '').substring(0, 12),
        panNumber: panNumber ? panNumber.toUpperCase().trim() : null,
        profilePic: profilePicData,
        status: status || 'Active'
      }
      
      const staff = new Staff(staffData)
      await staff.save()
      
      res.status(201).json({
        success: true,
        message: 'Staff created successfully',
        data: staff
      })
      
    } catch (error) {
      if (req.file) {
        cleanupTempFiles(req.file)
      }
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map(err => err.message)
        })
      }
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0]
        return res.status(400).json({
          success: false,
          message: `${field === 'email' ? 'Email' : field === 'employeeId' ? 'Employee ID' : 'Aadhar number'} already exists`
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
exports.updateStaff = [
  upload.single('profilePic'),
  async (req, res) => {
    try {
      const existingStaff = await Staff.findById(req.params.id)
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
        alternatePhone,
        address,
        city,
        state,
        pincode,
        employeeId,
        designation,
        department,
        joiningDate,
        qualification,
        experience,
        aadharNumber,
        panNumber,
        status,
        removeProfilePic
      } = req.body
      
      // Check for duplicate employee ID if changing
      if (employeeId && employeeId !== existingStaff.employeeId) {
        const duplicate = await Staff.findOne({ employeeId })
        if (duplicate) {
          cleanupTempFiles(req.file)
          return res.status(400).json({ 
            success: false, 
            message: 'Employee ID already exists' 
          })
        }
      }
      
      // Check for duplicate email if changing
      if (email && email.toLowerCase() !== existingStaff.email) {
        const duplicate = await Staff.findOne({ email: email.toLowerCase() })
        if (duplicate) {
          cleanupTempFiles(req.file)
          return res.status(400).json({ 
            success: false, 
            message: 'Email already exists' 
          })
        }
      }
      
      // Check for duplicate Aadhar if changing
      if (aadharNumber && aadharNumber !== existingStaff.aadharNumber) {
        const duplicate = await Staff.findOne({ aadharNumber })
        if (duplicate) {
          cleanupTempFiles(req.file)
          return res.status(400).json({ 
            success: false, 
            message: 'Aadhar number already exists' 
          })
        }
      }
      
      let newProfilePicData = existingStaff.profilePic
      let oldPublicId = null
      
      if (removeProfilePic === 'true' || removeProfilePic === true) {
        if (existingStaff.profilePic && existingStaff.profilePic.publicId) {
          oldPublicId = existingStaff.profilePic.publicId
        }
        newProfilePicData = null
      }
      
      if (req.file) {
        if (existingStaff.profilePic && existingStaff.profilePic.publicId) {
          oldPublicId = existingStaff.profilePic.publicId
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
          
          newProfilePicData = {
            url: uploadResult.url,
            publicId: uploadResult.publicId
          }
          
        } catch (uploadError) {
          cleanupTempFiles(req.file)
          throw new Error(`Failed to upload new profile picture: ${uploadError.message}`)
        }
        
        cleanupTempFiles(req.file)
      }
      
      if (oldPublicId) {
        try {
          await cloudinaryUtils.deleteFromCloudinary(oldPublicId)
        } catch (deleteError) {
          console.error('Failed to delete old profile picture from Cloudinary:', deleteError.message)
        }
      }
      
      const updateData = {
        firstName: firstName !== undefined ? firstName.trim() : existingStaff.firstName,
        lastName: lastName !== undefined ? lastName.trim() : existingStaff.lastName,
        gender: gender || existingStaff.gender,
        dob: dob !== undefined ? parseDate(dob) : existingStaff.dob,
        email: email ? email.toLowerCase().trim() : existingStaff.email,
        phone: phone ? cleanPhoneNumber(phone) : existingStaff.phone,
        alternatePhone: alternatePhone !== undefined ? (alternatePhone ? cleanPhoneNumber(alternatePhone) : null) : existingStaff.alternatePhone,
        address: address !== undefined ? address.trim() : existingStaff.address,
        city: city !== undefined ? city.trim() : existingStaff.city,
        state: state !== undefined ? state.trim() : existingStaff.state,
        pincode: pincode !== undefined ? pincode.toString().replace(/\D/g, '').substring(0, 6) : existingStaff.pincode,
        employeeId: employeeId ? employeeId.toUpperCase().trim() : existingStaff.employeeId,
        designation: designation !== undefined ? designation.trim() : existingStaff.designation,
        department: department !== undefined ? department.trim() : existingStaff.department,
        joiningDate: joiningDate !== undefined ? parseDate(joiningDate) : existingStaff.joiningDate,
        qualification: qualification !== undefined ? qualification.trim() : existingStaff.qualification,
        experience: experience !== undefined ? parseInt(experience) || 0 : existingStaff.experience,
        aadharNumber: aadharNumber ? aadharNumber.toString().replace(/\D/g, '').substring(0, 12) : existingStaff.aadharNumber,
        panNumber: panNumber !== undefined ? (panNumber ? panNumber.toUpperCase().trim() : null) : existingStaff.panNumber,
        profilePic: newProfilePicData,
        status: status || existingStaff.status,
        updatedAt: Date.now()
      }
      
      const updatedStaff = await Staff.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-__v')
      
      res.status(200).json({
        success: true,
        message: 'Staff updated successfully',
        data: updatedStaff
      })
      
    } catch (error) {
      if (req.file) {
        cleanupTempFiles(req.file)
      }
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map(err => err.message)
        })
      }
      
      if (error.name === 'CastError') {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid staff ID format' 
        })
      }
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0]
        return res.status(400).json({
          success: false,
          message: `${field === 'email' ? 'Email' : field === 'employeeId' ? 'Employee ID' : 'Aadhar number'} already exists`
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

// Delete staff
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
    
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff not found' 
      })
    }
    
    // Delete profile picture from Cloudinary if exists
    if (staff.profilePic && staff.profilePic.publicId) {
      try {
        await cloudinaryUtils.deleteFromCloudinary(staff.profilePic.publicId)
      } catch (deleteError) {
        console.error('Failed to delete profile picture from Cloudinary:', deleteError.message)
      }
    }
    
    await Staff.findByIdAndDelete(req.params.id)
    
    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully'
    })
    
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid staff ID format' 
      })
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete staff',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Search staff
exports.searchStaff = async (req, res) => {
  try {
    const { 
      query: searchQuery,
      department,
      designation,
      status,
      page = 1,
      limit = 20,
      sortBy = 'firstName',
      sortOrder = 'asc'
    } = req.query
    
    const searchConditions = []
    
    if (searchQuery) {
      searchConditions.push(
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { employeeId: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { phone: { $regex: searchQuery, $options: 'i' } },
        { designation: { $regex: searchQuery, $options: 'i' } },
        { department: { $regex: searchQuery, $options: 'i' } },
        { city: { $regex: searchQuery, $options: 'i' } }
      )
    }
    
    if (department) {
      searchConditions.push({ department: { $regex: department, $options: 'i' } })
    }
    
    if (designation) {
      searchConditions.push({ designation: { $regex: designation, $options: 'i' } })
    }
    
    if (status) {
      searchConditions.push({ status })
    }
    
    const finalQuery = searchConditions.length > 0 ? { $or: searchConditions } : {}
    
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1
    
    const staff = await Staff.find(finalQuery)
      .sort(sort)
      .limit(limitNum)
      .skip(skip)
      .select('-__v')
    
    const total = await Staff.countDocuments(finalQuery)
    
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
exports.getStaffStatistics = async (req, res) => {
  try {
    const totalStaff = await Staff.countDocuments()
    
    const staffByDepartment = await Staff.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])
    
    const staffByDesignation = await Staff.aggregate([
      {
        $group: {
          _id: '$designation',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])
    
    const staffByStatus = await Staff.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    const staffByGender = await Staff.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    const latestStaff = await Staff.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName employeeId designation department profilePic createdAt')
    
    const statistics = {
      total: totalStaff,
      byDepartment: staffByDepartment,
      byDesignation: staffByDesignation,
      byStatus: staffByStatus,
      byGender: staffByGender,
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
exports.downloadStaffTemplate = async (req, res) => {
  try {
    // Create workbook
    const workbook = xlsx.utils.book_new()
    
    // Define headers with descriptions
    const headers = [
      ['firstName*', 'lastName*', 'gender* (Male/Female/Other)', 'dob* (YYYY-MM-DD)', 
       'email*', 'phone* (10 digits)', 'alternatePhone', 'address*', 'city*', 
       'state*', 'pincode* (6 digits)', 'employeeId* (Unique)', 'designation*', 
       'department*', 'joiningDate (YYYY-MM-DD)', 'qualification*', 'experience* (years)',
       'aadharNumber* (12 digits)', 'panNumber', 'status (Active/Inactive/On Leave/Resigned/Terminated)']
    ]
    
    // Add sample data for guidance
    const sampleData = [
      ['John', 'Doe', 'Male', '1985-05-15', 'john.doe@school.com', '9876543210', '9123456789', 
       '123 Main St', 'Mumbai', 'Maharashtra', '400001', 'EMP001', 'Teacher', 'Academic', 
       '2023-06-01', 'M.Sc, B.Ed', '5', '123456789012', 'ABCDE1234F', 'Active'],
      ['Jane', 'Smith', 'Female', '1990-08-20', 'jane.smith@school.com', '9123456780', '',
       '456 Oak Ave', 'Delhi', 'Delhi', '110001', 'EMP002', 'Admin Officer', 'Administration',
       '2024-01-15', 'MBA', '3', '987654321098', 'XYZAB1234C', 'Active']
    ]
    
    // Create worksheet
    const worksheet = xlsx.utils.aoa_to_sheet([...headers, ...sampleData])
    
    // Set column widths
    const colWidths = [
      { wch: 12 }, // firstName
      { wch: 12 }, // lastName
      { wch: 10 }, // gender
      { wch: 12 }, // dob
      { wch: 25 }, // email
      { wch: 12 }, // phone
      { wch: 12 }, // alternatePhone
      { wch: 25 }, // address
      { wch: 15 }, // city
      { wch: 15 }, // state
      { wch: 10 }, // pincode
      { wch: 12 }, // employeeId
      { wch: 15 }, // designation
      { wch: 15 }, // department
      { wch: 12 }, // joiningDate
      { wch: 20 }, // qualification
      { wch: 10 }, // experience
      { wch: 15 }, // aadharNumber
      { wch: 12 }, // panNumber
      { wch: 15 }  // status
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
      ['gender*: Gender (Male, Female, or Other)'],
      ['dob*: Date of birth (format: YYYY-MM-DD)'],
      ['email*: Email address (must be unique)'],
      ['phone*: Primary phone number (10 digits)'],
      ['alternatePhone: Secondary phone number (optional)'],
      ['address*: Complete address'],
      ['city*: City name'],
      ['state*: State name'],
      ['pincode*: 6-digit pincode'],
      ['employeeId*: Unique employee ID (no duplicates)'],
      ['designation*: Job designation (e.g., Teacher, Principal, Clerk)'],
      ['department*: Department (e.g., Academic, Administration, Sports)'],
      ['joiningDate: Date of joining (format: YYYY-MM-DD)'],
      ['qualification*: Educational qualifications'],
      ['experience*: Years of experience (number)'],
      ['aadharNumber*: 12-digit Aadhar number (must be unique)'],
      ['panNumber: PAN card number (optional)'],
      ['status: Active, Inactive, On Leave, Resigned, or Terminated'],
      [''],
      ['VALIDATION RULES:'],
      ['- employeeId, email, and aadharNumber must be UNIQUE'],
      ['- Phone numbers must be 10 digits'],
      ['- Pincode must be 6 digits'],
      ['- Aadhar number must be 12 digits'],
      ['- Dates must be in YYYY-MM-DD format'],
      ['- Gender must be Male, Female, or Other'],
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
    res.setHeader('Content-Disposition', 'attachment filename=staff_bulk_import_template.xlsx')
    
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
exports.bulkImportStaff = [
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
      
      // Log first few rows for debugging
      console.log('Sample data (first 2 rows):', JSON.stringify(data.slice(0, 2), null, 2))
      
      const errors = []
      let successCount = 0
      let skippedCount = 0
      
      // Process each row
      for (const [index, row] of data.entries()) {
        const rowNumber = index + 2 // +2 for header row and 1-based index
        
        try {
          console.log(`Processing row ${rowNumber}:`, row.employeeId || 'No employeeId')
          
          // Skip empty rows
          if (!row.firstName && !row.lastName && !row.employeeId) {
            console.log(`Row ${rowNumber} skipped: Empty row`)
            skippedCount++
            continue
          }
          
          // Validate required fields
          const requiredFields = [
            'firstName', 'lastName', 'gender', 'dob', 'email', 'phone',
            'address', 'city', 'state', 'pincode', 'employeeId',
            'designation', 'department', 'qualification', 'experience', 'aadharNumber'
          ]
          
          const missingFields = requiredFields.filter(field => !row[field] || row[field].toString().trim() === '')
          
          if (missingFields.length > 0) {
            errors.push({
              row: rowNumber,
              employeeId: row.employeeId || 'N/A',
              error: `Missing required fields: ${missingFields.join(', ')}`
            })
            continue
          }
          
          // Trim all string fields
          const firstName = row.firstName.toString().trim()
          const lastName = row.lastName.toString().trim()
          const email = row.email.toString().toLowerCase().trim()
          const employeeId = row.employeeId.toString().toUpperCase().trim()
          const aadharNumber = row.aadharNumber.toString().replace(/\D/g, '').substring(0, 12)
          
          // Check for duplicate employee ID
          const existingStaffById = await Staff.findOne({ employeeId })
          if (existingStaffById) {
            errors.push({
              row: rowNumber,
              employeeId: employeeId,
              error: `Duplicate employee ID: ${employeeId}`
            })
            continue
          }
          
          // Check for duplicate email
          const existingStaffByEmail = await Staff.findOne({ email })
          if (existingStaffByEmail) {
            errors.push({
              row: rowNumber,
              employeeId: employeeId,
              error: `Duplicate email: ${email}`
            })
            continue
          }
          
          // Check for duplicate Aadhar
          const existingStaffByAadhar = await Staff.findOne({ aadharNumber })
          if (existingStaffByAadhar) {
            errors.push({
              row: rowNumber,
              employeeId: employeeId,
              error: `Duplicate Aadhar number: ${aadharNumber}`
            })
            continue
          }
          
          // Validate email
          if (!validateEmail(email)) {
            errors.push({
              row: rowNumber,
              employeeId: employeeId,
              error: `Invalid email format: ${email}`
            })
            continue
          }
          
          // Validate phone
          if (!validatePhoneNumber(row.phone)) {
            errors.push({
              row: rowNumber,
              employeeId: employeeId,
              error: `Invalid phone number: ${row.phone}. Must be 10 digits.`
            })
            continue
          }
          
          // Validate pincode
          if (!validatePincode(row.pincode)) {
            errors.push({
              row: rowNumber,
              employeeId: employeeId,
              error: `Invalid pincode: ${row.pincode}. Must be 6 digits.`
            })
            continue
          }
          
          // Validate Aadhar
          if (!validateAadharNumber(row.aadharNumber)) {
            errors.push({
              row: rowNumber,
              employeeId: employeeId,
              error: `Invalid Aadhar number: ${row.aadharNumber}. Must be 12 digits.`
            })
            continue
          }
          
          // Validate gender
          const validGenders = ['Male', 'Female', 'Other']
          const gender = row.gender.toString().trim()
          if (!validGenders.includes(gender)) {
            errors.push({
              row: rowNumber,
              employeeId: employeeId,
              error: `Invalid gender: ${gender}. Must be Male, Female, or Other.`
            })
            continue
          }
          
          // Validate status if provided
          const validStatuses = ['Active', 'Inactive', 'On Leave', 'Resigned', 'Terminated']
          const status = row.status ? row.status.toString().trim() : 'Active'
          if (row.status && !validStatuses.includes(status)) {
            errors.push({
              row: rowNumber,
              employeeId: employeeId,
              error: `Invalid status: ${row.status}`
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
            phone: cleanPhoneNumber(row.phone),
            alternatePhone: row.alternatePhone ? cleanPhoneNumber(row.alternatePhone) : null,
            address: row.address.toString().trim(),
            city: row.city.toString().trim(),
            state: row.state.toString().trim(),
            pincode: row.pincode.toString().replace(/\D/g, '').substring(0, 6),
            employeeId: employeeId,
            designation: row.designation.toString().trim(),
            department: row.department.toString().trim(),
            joiningDate: joiningDate,
            qualification: row.qualification.toString().trim(),
            experience: parseInt(row.experience) || 0,
            aadharNumber: aadharNumber,
            panNumber: row.panNumber ? row.panNumber.toString().toUpperCase().trim() : null,
            status: status,
            importBatch: Date.now(),
            importSource: 'bulk_excel'
          }
          
          // Save staff
          const staff = new Staff(staffData)
          await staff.save()
          successCount++
          console.log(`✓ Row ${rowNumber} saved: ${employeeId} - ${firstName} ${lastName}`)
          
        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          errors.push({
            row: rowNumber,
            employeeId: row.employeeId || 'N/A',
            error: error.code === 11000 ? 'Duplicate entry (employeeId, email, or aadharNumber)' : 
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
exports.testImport = [
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