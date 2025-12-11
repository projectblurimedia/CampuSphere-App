const Staff = require('../models/Staff')
const School = require('../models/School')
const Class = require('../models/Class')
const cloudinary = require('../config/cloudinary')

/**
 * Get all staff members
 */
exports.getAllStaff = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      department, 
      role, 
      status, 
      search 
    } = req.query
    
    const filter = { school: req.school._id }
    
    if (department) filter.department = department
    if (role) filter.role = role
    if (status) filter.status = status
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    const staff = await Staff.find(filter)
      .populate('classTeacherOf', 'className section')
      .sort({ employeeId: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-__v')
    
    const total = await Staff.countDocuments(filter)
    
    res.status(200).json({
      success: true,
      data: staff,
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
 * Get staff by ID
 */
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('school', 'name')
      .populate('classTeacherOf', 'className section')
      .populate('classes', 'className section')
      .populate('subjects', 'name code')
      .lean()
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      })
    }
    
    // Check if staff belongs to the school
    if (staff.school._id.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    res.status(200).json({
      success: true,
      data: staff
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Create new staff member
 */
exports.createStaff = async (req, res) => {
  try {
    const staffData = req.body
    staffData.school = req.school._id
    
    const staff = new Staff(staffData)
    await staff.save()
    
    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: staff
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Update staff member
 */
exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      })
    }
    
    // Check if staff belongs to the school
    if (staff.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    Object.assign(staff, req.body)
    staff.updatedAt = Date.now()
    await staff.save()
    
    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      data: staff
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Delete staff member
 */
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      })
    }
    
    // Check if staff belongs to the school
    if (staff.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    await staff.remove()
    
    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Upload staff photo
 */
exports.uploadStaffPhoto = async (req, res) => {
  try {
    const staffId = req.params.id
    const file = req.file
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      })
    }
    
    const staff = await Staff.findById(staffId)
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      })
    }
    
    // Check if staff belongs to the school
    if (staff.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    // Delete old photo from Cloudinary if exists
    if (staff.photo && staff.photo.publicId) {
      await cloudinary.uploader.destroy(staff.photo.publicId)
    }
    
    // Upload new photo to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `staff/${staffId}/photos`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]
    })
    
    staff.photo = {
      url: result.secure_url,
      publicId: result.public_id
    }
    
    await staff.save()
    
    res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully',
      data: staff.photo
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get teaching staff
 */
exports.getTeachingStaff = async (req, res) => {
  try {
    const staff = await Staff.find({
      school: req.school._id,
      role: 'teaching',
      status: 'active'
    })
    .select('firstName lastName employeeId designation subjects classes photo')
    .populate('subjects', 'name')
    .populate('classes', 'className section')
    .sort({ designation: 1, firstName: 1 })
    
    res.status(200).json({
      success: true,
      data: staff
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get staff by designation
 */
exports.getStaffByDesignation = async (req, res) => {
  try {
    const { designation } = req.params
    
    const staff = await Staff.find({
      school: req.school._id,
      designation: designation,
      status: 'active'
    })
    .select('firstName lastName employeeId email phone photo dateOfJoining')
    .sort({ dateOfJoining: 1 })
    
    res.status(200).json({
      success: true,
      data: staff
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}