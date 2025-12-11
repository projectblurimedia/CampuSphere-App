const Student = require('../models/Student')
const Class = require('../models/Class')
const School = require('../models/School')
const cloudinary = require('../config/cloudinary')

/**
 * Get all students
 */
exports.getAllStudents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      class: classId, 
      status, 
      search 
    } = req.query
    
    const filter = { school: req.school._id }
    
    if (classId) filter.currentClass = classId
    if (status) filter.status = status
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { admissionNo: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } }
      ]
    }
    
    const students = await Student.find(filter)
      .populate('currentClass', 'className section')
      .sort({ admissionNo: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-__v')
    
    const total = await Student.countDocuments(filter)
    
    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get student by ID
 */
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('currentClass', 'className section gradeLevel')
      .populate('school', 'name')
      .lean()
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }
    
    // Check if student belongs to the school
    if (student.school._id.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    res.status(200).json({
      success: true,
      data: student
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Create new student
 */
exports.createStudent = async (req, res) => {
  try {
    const studentData = req.body
    studentData.school = req.school._id
    
    // Validate class exists
    const classExists = await Class.findOne({
      _id: studentData.currentClass,
      school: req.school._id
    })
    
    if (!classExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class'
      })
    }
    
    const student = new Student(studentData)
    await student.save()
    
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Update student
 */
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }
    
    // Check if student belongs to the school
    if (student.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    Object.assign(student, req.body)
    student.updatedAt = Date.now()
    await student.save()
    
    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Delete student
 */
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }
    
    // Check if student belongs to the school
    if (student.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    await student.remove()
    
    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Upload student photo
 */
exports.uploadStudentPhoto = async (req, res) => {
  try {
    const studentId = req.params.id
    const file = req.file
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      })
    }
    
    const student = await Student.findById(studentId)
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }
    
    // Check if student belongs to the school
    if (student.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    // Delete old photo from Cloudinary if exists
    if (student.photo && student.photo.publicId) {
      await cloudinary.uploader.destroy(student.photo.publicId)
    }
    
    // Upload new photo to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `students/${studentId}/photos`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]
    })
    
    student.photo = {
      url: result.secure_url,
      publicId: result.public_id
    }
    
    await student.save()
    
    res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully',
      data: student.photo
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get students by class
 */
exports.getStudentsByClass = async (req, res) => {
  try {
    const classId = req.params.classId
    
    const students = await Student.find({
      currentClass: classId,
      school: req.school._id,
      status: 'active'
    })
    .select('firstName lastName admissionNo rollNo gender dateOfBirth fatherName phone photo')
    .sort({ rollNo: 1 })
    
    res.status(200).json({
      success: true,
      data: students
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}