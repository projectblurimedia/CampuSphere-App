const School = require('../models/School')
const Student = require('../models/Student')
const Staff = require('../models/Staff')
const Class = require('../models/Class')
const cloudinary = require('../config/cloudinary')

exports.getSchoolProfile = async (req, res) => {
  try {
    const schoolId = req.params.id || req.school._id
    
    const school = await School.getSchoolProfile(schoolId)
    
    res.status(200).json({
      success: true,
      data: school
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

exports.updateSchoolProfile = async (req, res) => {
  try {
    const schoolId = req.params.id || req.school._id
    const updateData = req.body
    
    if (typeof updateData.address === 'string') {
      updateData.address = { fullAddress: updateData.address }
    }
    
    if (updateData.schoolHours && typeof updateData.schoolHours === 'string') {
      const [start, end] = updateData.schoolHours.split(' - ')
      updateData.schoolHours = { start, end, display: updateData.schoolHours }
    }
    
    if (updateData.officeHours && typeof updateData.officeHours === 'string') {
      const [start, end] = updateData.officeHours.split(' - ')
      updateData.officeHours = { start, end, display: updateData.officeHours }
    }
    
    const school = await School.findByIdAndUpdate(
      schoolId,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('principal vicePrincipal')
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'School profile updated successfully',
      data: school
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

exports.uploadSchoolImages = async (req, res) => {
  try {
    const schoolId = req.params.id || req.school._id
    const files = req.files
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      })
    }
    
    const school = await School.findById(schoolId)
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      })
    }
    
    const uploadedImages = []
    
    for (const file of files) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: `schools/${schoolId}/images`,
          transformation: [
            { width: 1200, height: 800, crop: 'fill' },
            { quality: 'auto' }
          ]
        })
        
        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
          caption: req.body.caption || '',
          isPrimary: req.body.isPrimary === 'true'
        })
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError)
      }
    }
    
    if (uploadedImages.some(img => img.isPrimary)) {
      school.images.forEach(img => img.isPrimary = false)
    }
    
    school.images.push(...uploadedImages)
    await school.save()
    
    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: uploadedImages
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

exports.deleteSchoolImage = async (req, res) => {
  try {
    const { id, imageId } = req.params
    
    const school = await School.findById(id || req.school._id)
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      })
    }
    
    const imageIndex = school.images.findIndex(img => img._id.toString() === imageId)
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      })
    }
    
    const image = school.images[imageIndex]
    
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId)
    }
    
    school.images.splice(imageIndex, 1)
    await school.save()
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

exports.getSchoolStatistics = async (req, res) => {
  try {
    const schoolId = req.params.id || req.school._id
    
    const school = await School.findById(schoolId)
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      })
    }
    
    await school.updateStatistics()
    
    const classes = await Class.find({ school: schoolId, status: 'active' })
      .select('className section totalStudents maleStudents femaleStudents classTeacher')
      .populate('classTeacher', 'firstName lastName')
    
    const students = await Student.find({ school: schoolId, status: 'active' })
    const genderDistribution = {
      male: students.filter(s => s.gender === 'Male').length,
      female: students.filter(s => s.gender === 'Female').length,
      other: students.filter(s => s.gender === 'Other').length
    }
    
    const staff = await Staff.find({ school: schoolId, status: 'active' })
    const staffDistribution = {
      teaching: staff.filter(s => s.role === 'teaching').length,
      nonTeaching: staff.filter(s => s.role === 'non-teaching').length,
      administrative: staff.filter(s => s.role === 'administrative').length
    }
    
    res.status(200).json({
      success: true,
      data: {
        totalStudents: school.totalStudents,
        totalTeachers: school.totalTeachers,
        totalStaff: school.totalStaff,
        totalClassrooms: school.totalClassrooms,
        genderDistribution,
        staffDistribution,
        classDistribution: classes,
        updatedAt: new Date()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

exports.getSchoolImages = async (req, res) => {
  try {
    const schoolId = req.params.id || req.school._id
    
    const school = await School.findById(schoolId).select('images')
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      })
    }
    
    res.status(200).json({
      success: true,
      data: school.images
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}