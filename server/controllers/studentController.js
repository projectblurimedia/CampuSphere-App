const Student = require('../models/Student')
const cloudinaryUtils = require('../config/cloudinary')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Configure multer for temporary storage
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = 'temp/uploads/'
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    cb(null, tempDir)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  },
})

const upload = multer({ 
  storage: tempStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
})

// Helper function to clean up temporary files
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

// Helper function to get next academic year
const getNextAcademicYear = (currentYear) => {
  if (!currentYear || !currentYear.includes('-')) {
    return null
  }
  const [start, end] = currentYear.split('-').map(Number)
  return `${start + 1}-${end + 1}`
}

// Get all students with filtering and pagination
exports.getAllStudents = async (req, res) => {
  try {
    console.log('=== GET ALL STUDENTS REQUEST ===')
    console.log('Query params:', req.query)
    
    const { 
      class: classFilter, 
      section, 
      academicYear, 
      page = 1, 
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query
    
    const query = {}
    
    // Apply filters
    if (classFilter && !isNaN(classFilter)) {
      query.class = parseInt(classFilter)
      console.log('Class filter applied:', query.class)
    }
    
    if (section) {
      query.section = section.toUpperCase()
      console.log('Section filter applied:', query.section)
    }
    
    if (academicYear) {
      query.academicYear = academicYear
      console.log('Academic year filter applied:', query.academicYear)
    }
    
    // Apply search
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { admissionNo: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
        { parentPhone: { $regex: search, $options: 'i' } }
      ]
      console.log('Search filter applied:', search)
    }
    
    // Calculate pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    // Sort configuration
    const sort = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    
    console.log('Final query:', JSON.stringify(query, null, 2))
    console.log('Pagination:', { page: pageNum, limit: limitNum, skip })
    console.log('Sort:', sort)
    
    // Execute query
    const students = await Student.find(query)
      .sort(sort)
      .limit(limitNum)
      .skip(skip)
      .select('-__v')
    
    const total = await Student.countDocuments(query)
    
    console.log(`Found ${students.length} students out of ${total} total`)
    
    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      data: students
    })
    
  } catch (error) {
    console.error('=== GET ALL STUDENTS ERROR ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch students',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    console.log('=== GET STUDENT BY ID REQUEST ===')
    console.log('Student ID:', req.params.id)
    
    const student = await Student.findById(req.params.id).select('-__v')
    
    if (!student) {
      console.log('Student not found')
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      })
    }
    
    console.log('Student found:', {
      id: student._id,
      name: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo
    })
    
    res.status(200).json({
      success: true,
      data: student
    })
    
  } catch (error) {
    console.error('=== GET STUDENT BY ID ERROR ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      })
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch student',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Create a new student with profile picture
exports.createStudent = [
  upload.single('profilePic'),
  async (req, res) => {
    try {            
      const {
        firstName,
        lastName,
        dob,
        academicYear,
        class: classNum,
        section,
        admissionNo,
        rollNo,
        address,
        village,
        parentName,
        parentPhone,
        parentPhone2,
        parentEmail
      } = req.body
      
      // Validate required fields
      if (!firstName || !lastName || !admissionNo || !parentPhone) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: firstName, lastName, admissionNo, parentPhone' 
        })
      }
      
      // Check if admission number already exists
      const existingStudent = await Student.findOne({ admissionNo })
      if (existingStudent) {
        cleanupTempFiles(req.file)
        return res.status(400).json({ 
          success: false, 
          message: 'Admission number already exists' 
        })
      }
      
      let profilePicData = null
      if (req.file) {
        try {
          const uploadResult = await cloudinaryUtils.uploadToCloudinary(req.file.path, {
            folder: 'school/students/profile-pictures',
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
          console.error('Profile picture upload failed:', uploadError)
          cleanupTempFiles(req.file)
          throw new Error(`Failed to upload profile picture: ${uploadError.message}`)
        }
        
        // Clean up temp file after upload
        cleanupTempFiles(req.file)
      }
      
      // Create new student document
      const studentData = {
        firstName,
        lastName,
        dob: dob ? new Date(dob) : null,
        academicYear,
        class: classNum ? parseInt(classNum) : 1,
        section: section ? section.toUpperCase() : 'A',
        admissionNo,
        rollNo: rollNo || null,
        address: address || null,
        village: village || null,
        parentName: parentName || null,
        parentPhone,
        parentPhone2: parentPhone2 || null,
        parentEmail: parentEmail || null,
        profilePic: profilePicData
      }
      
      const student = new Student(studentData)
      await student.save()
      
      console.log('Student created successfully:', {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`
      })
      
      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student
      })
      
    } catch (error) {
      console.error('=== CREATE STUDENT ERROR ===')
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      // Clean up temp files on error
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
      
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to create student',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
]

// Update existing student with optional profile picture update
exports.updateStudent = [
  upload.single('profilePic'),
  async (req, res) => {
    try {
      console.log('=== UPDATE STUDENT REQUEST ===')
      console.log('Student ID:', req.params.id)
      console.log('Request body keys:', Object.keys(req.body))
      console.log('Has file:', !!req.file)
      
      if (req.file) {
        console.log('Uploaded file:', {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        })
      }
      
      // Find the existing student
      const existingStudent = await Student.findById(req.params.id)
      if (!existingStudent) {
        console.log('Student not found')
        cleanupTempFiles(req.file)
        return res.status(404).json({ 
          success: false, 
          message: 'Student not found' 
        })
      }
      
      console.log('Found student:', {
        id: existingStudent._id,
        name: `${existingStudent.firstName} ${existingStudent.lastName}`,
        admissionNo: existingStudent.admissionNo
      })
      
      // Extract all fields from request body
      const {
        firstName,
        lastName,
        dob,
        academicYear,
        class: classNum,
        section,
        admissionNo,
        rollNo,
        address,
        village,
        parentName,
        parentPhone,
        parentPhone2,
        parentEmail,
        removeProfilePic
      } = req.body
      
      // Check for duplicate admission number if changed
      if (admissionNo && admissionNo !== existingStudent.admissionNo) {
        const duplicate = await Student.findOne({ admissionNo })
        if (duplicate) {
          cleanupTempFiles(req.file)
          return res.status(400).json({ 
            success: false, 
            message: 'Admission number already exists' 
          })
        }
      }
      
      // Handle profile picture updates
      let newProfilePicData = existingStudent.profilePic
      let oldPublicId = null
      
      // Case 1: Remove existing profile picture if requested
      if (removeProfilePic === 'true' || removeProfilePic === true) {
        console.log('Removing existing profile picture...')
        if (existingStudent.profilePic && existingStudent.profilePic.publicId) {
          oldPublicId = existingStudent.profilePic.publicId
          console.log('Old public ID to delete:', oldPublicId)
        }
        newProfilePicData = null
      }
      
      // Case 2: Upload new profile picture
      if (req.file) {
        console.log('Processing new profile picture...')
        
        // Delete old profile picture from Cloudinary if exists
        if (existingStudent.profilePic && existingStudent.profilePic.publicId) {
          oldPublicId = existingStudent.profilePic.publicId
          console.log('Old public ID to delete:', oldPublicId)
        }
        
        // Upload new picture to Cloudinary
        try {
          const uploadResult = await cloudinaryUtils.uploadToCloudinary(req.file.path, {
            folder: 'school/students/profile-pictures',
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
          
          console.log('New profile picture uploaded:', {
            url: uploadResult.url ? uploadResult.url.substring(0, 50) + '...' : 'no url',
            publicId: uploadResult.publicId
          })
          
        } catch (uploadError) {
          console.error('Profile picture upload failed:', uploadError)
          cleanupTempFiles(req.file)
          throw new Error(`Failed to upload new profile picture: ${uploadError.message}`)
        }
        
        // Clean up temp file
        cleanupTempFiles(req.file)
      }
      
      // Delete old profile picture from Cloudinary
      if (oldPublicId) {
        try {
          console.log('Deleting old profile picture from Cloudinary:', oldPublicId)
          await cloudinaryUtils.deleteFromCloudinary(oldPublicId)
          console.log('Old profile picture deleted successfully')
        } catch (deleteError) {
          console.error('Failed to delete old profile picture from Cloudinary:', deleteError.message)
          // Don't fail the whole update if deletion fails
        }
      }
      
      // Prepare update data
      const updateData = {
        firstName: firstName || existingStudent.firstName,
        lastName: lastName || existingStudent.lastName,
        dob: dob ? new Date(dob) : existingStudent.dob,
        academicYear: academicYear || existingStudent.academicYear,
        class: classNum ? parseInt(classNum) : existingStudent.class,
        section: section ? section.toUpperCase() : existingStudent.section,
        admissionNo: admissionNo || existingStudent.admissionNo,
        rollNo: rollNo || existingStudent.rollNo,
        address: address !== undefined ? address : existingStudent.address,
        village: village !== undefined ? village : existingStudent.village,
        parentName: parentName || existingStudent.parentName,
        parentPhone: parentPhone || existingStudent.parentPhone,
        parentPhone2: parentPhone2 !== undefined ? parentPhone2 : existingStudent.parentPhone2,
        parentEmail: parentEmail !== undefined ? parentEmail : existingStudent.parentEmail,
        profilePic: newProfilePicData,
        updatedAt: Date.now()
      }
      
      console.log('Update data:', {
        name: `${updateData.firstName} ${updateData.lastName}`,
        admissionNo: updateData.admissionNo,
        hasProfilePic: !!updateData.profilePic
      })
      
      // Update student in database
      const updatedStudent = await Student.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-__v')
      
      console.log('Student updated successfully:', {
        id: updatedStudent._id,
        name: `${updatedStudent.firstName} ${updatedStudent.lastName}`
      })
      
      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: updatedStudent
      })
      
    } catch (error) {
      console.error('=== UPDATE STUDENT ERROR ===')
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      // Clean up temp files on error
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
          message: 'Invalid student ID format' 
        })
      }
      
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to update student',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
]

// Delete student and their profile picture
exports.deleteStudent = async (req, res) => {
  try {
    console.log('=== DELETE STUDENT REQUEST ===')
    console.log('Student ID:', req.params.id)
    
    const student = await Student.findById(req.params.id)
    
    if (!student) {
      console.log('Student not found')
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      })
    }
    
    console.log('Found student to delete:', {
      id: student._id,
      name: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo
    })
    
    // Delete profile picture from Cloudinary if exists
    if (student.profilePic && student.profilePic.publicId) {
      console.log('Deleting profile picture from Cloudinary:', student.profilePic.publicId)
      try {
        await cloudinaryUtils.deleteFromCloudinary(student.profilePic.publicId)
        console.log('Profile picture deleted from Cloudinary')
      } catch (deleteError) {
        console.error('Failed to delete profile picture from Cloudinary:', deleteError.message)
        // Continue with deletion even if Cloudinary deletion fails
      }
    } else {
      console.log('No profile picture to delete from Cloudinary')
    }
    
    // Delete student from database
    await Student.findByIdAndDelete(req.params.id)
    
    console.log('Student deleted successfully from database')
    
    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    })
    
  } catch (error) {
    console.error('=== DELETE STUDENT ERROR ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      })
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete student',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Promote student to next class
exports.promoteStudent = async (req, res) => {
  try {
    console.log('=== PROMOTE STUDENT REQUEST ===')
    console.log('Student ID:', req.params.id)
    
    const student = await Student.findById(req.params.id)
    
    if (!student) {
      console.log('Student not found')
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      })
    }
    
    console.log('Found student:', {
      id: student._id,
      name: `${student.firstName} ${student.lastName}`,
      currentClass: student.class,
      currentAcademicYear: student.academicYear
    })
    
    // Check if student can be promoted
    if (student.class >= 12) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot promote beyond class 12' 
      })
    }
    
    // Calculate next academic year
    const nextAcademicYear = getNextAcademicYear(student.academicYear)
    if (!nextAcademicYear) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid academic year format' 
      })
    }
    
    // Update student
    student.class += 1
    student.academicYear = nextAcademicYear
    student.updatedAt = Date.now()
    
    await student.save()
    
    console.log('Student promoted successfully:', {
      newClass: student.class,
      newAcademicYear: student.academicYear
    })
    
    res.status(200).json({
      success: true,
      message: 'Student promoted successfully',
      data: student
    })
    
  } catch (error) {
    console.error('=== PROMOTE STUDENT ERROR ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      })
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to promote student',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Batch promote students (promote all students in a class/section)
exports.batchPromoteStudents = async (req, res) => {
  try {
    console.log('=== BATCH PROMOTE STUDENTS REQUEST ===')
    console.log('Request body:', req.body)
    
    const { 
      currentClass, 
      currentSection, 
      currentAcademicYear,
      skipStudentIds = []
    } = req.body
    
    if (!currentClass || !currentAcademicYear) {
      return res.status(400).json({ 
        success: false, 
        message: 'currentClass and currentAcademicYear are required' 
      })
    }
    
    // Build query
    const query = {
      class: parseInt(currentClass),
      academicYear: currentAcademicYear
    }
    
    if (currentSection) {
      query.section = currentSection.toUpperCase()
    }
    
    if (skipStudentIds && skipStudentIds.length > 0) {
      query._id = { $nin: skipStudentIds }
    }
    
    console.log('Query for batch promotion:', JSON.stringify(query, null, 2))
    
    // Check if promotion is possible (not beyond class 12)
    if (parseInt(currentClass) >= 12) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot promote students beyond class 12' 
      })
    }
    
    // Calculate next academic year
    const nextAcademicYear = getNextAcademicYear(currentAcademicYear)
    if (!nextAcademicYear) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid academic year format' 
      })
    }
    
    // Find students to promote
    const studentsToPromote = await Student.find(query)
    console.log(`Found ${studentsToPromote.length} students to promote`)
    
    if (studentsToPromote.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No students found for promotion',
        count: 0
      })
    }
    
    // Prepare bulk update operations
    const bulkOperations = studentsToPromote.map(student => ({
      updateOne: {
        filter: { _id: student._id },
        update: {
          $set: {
            class: student.class + 1,
            academicYear: nextAcademicYear,
            updatedAt: Date.now()
          }
        }
      }
    }))
    
    // Execute bulk update
    const result = await Student.bulkWrite(bulkOperations)
    
    console.log('Batch promotion result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount
    })
    
    res.status(200).json({
      success: true,
      message: `Successfully promoted ${result.modifiedCount} students`,
      count: result.modifiedCount,
      data: {
        promotedFromClass: currentClass,
        promotedToClass: parseInt(currentClass) + 1,
        previousAcademicYear: currentAcademicYear,
        newAcademicYear: nextAcademicYear
      }
    })
    
  } catch (error) {
    console.error('=== BATCH PROMOTE STUDENTS ERROR ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to batch promote students',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Search students with advanced filtering
exports.searchStudents = async (req, res) => {
  try {
    console.log('=== SEARCH STUDENTS REQUEST ===')
    console.log('Query params:', req.query)
    
    const { 
      query: searchQuery,
      class: classFilter,
      section,
      academicYear,
      parentPhone,
      admissionNo,
      rollNo,
      page = 1,
      limit = 20,
      sortBy = 'firstName',
      sortOrder = 'asc'
    } = req.query
    
    // Build search query
    const searchConditions = []
    
    if (searchQuery) {
      searchConditions.push(
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { parentName: { $regex: searchQuery, $options: 'i' } },
        { admissionNo: { $regex: searchQuery, $options: 'i' } },
        { village: { $regex: searchQuery, $options: 'i' } }
      )
    }
    
    if (classFilter && !isNaN(classFilter)) {
      searchConditions.push({ class: parseInt(classFilter) })
    }
    
    if (section) {
      searchConditions.push({ section: section.toUpperCase() })
    }
    
    if (academicYear) {
      searchConditions.push({ academicYear })
    }
    
    if (parentPhone) {
      searchConditions.push({ 
        $or: [
          { parentPhone: { $regex: parentPhone, $options: 'i' } },
          { parentPhone2: { $regex: parentPhone, $options: 'i' } }
        ]
      })
    }
    
    if (admissionNo) {
      searchConditions.push({ admissionNo: { $regex: admissionNo, $options: 'i' } })
    }
    
    if (rollNo) {
      searchConditions.push({ rollNo: { $regex: rollNo, $options: 'i' } })
    }
    
    // Combine conditions
    const finalQuery = searchConditions.length > 0 ? { $or: searchConditions } : {}
    
    console.log('Final search query:', JSON.stringify(finalQuery, null, 2))
    
    // Calculate pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    // Sort configuration
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1
    
    // Execute search
    const students = await Student.find(finalQuery)
      .sort(sort)
      .limit(limitNum)
      .skip(skip)
      .select('-__v')
    
    const total = await Student.countDocuments(finalQuery)
    
    console.log(`Search found ${students.length} students out of ${total} total`)
    
    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      data: students
    })
    
  } catch (error) {
    console.error('=== SEARCH STUDENTS ERROR ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to search students',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Get student statistics
exports.getStudentStatistics = async (req, res) => {
  try {
    console.log('=== GET STUDENT STATISTICS REQUEST ===')
    
    const totalStudents = await Student.countDocuments()
    
    // Count by class
    const studentsByClass = await Student.aggregate([
      {
        $group: {
          _id: '$class',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // Count by section
    const studentsBySection = await Student.aggregate([
      {
        $group: {
          _id: '$section',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // Count by academic year
    const studentsByAcademicYear = await Student.aggregate([
      {
        $group: {
          _id: '$academicYear',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ])
    
    // Latest students
    const latestStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName admissionNo class section profilePic createdAt')
    
    const statistics = {
      total: totalStudents,
      byClass: studentsByClass,
      bySection: studentsBySection,
      byAcademicYear: studentsByAcademicYear,
      latest: latestStudents
    }
    
    console.log('Statistics generated:', {
      total: totalStudents,
      classCount: studentsByClass.length,
      sectionCount: studentsBySection.length,
      academicYearCount: studentsByAcademicYear.length
    })
    
    res.status(200).json({
      success: true,
      data: statistics
    })
    
  } catch (error) {
    console.error('=== GET STUDENT STATISTICS ERROR ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get student statistics',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}