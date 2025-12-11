const Class = require('../models/Class')
const Student = require('../models/Student')
const Staff = require('../models/Staff')
const Subject = require('../models/Subject')

/**
 * Get all classes
 */
exports.getAllClasses = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      gradeLevel, 
      status, 
      academicYear 
    } = req.query
    
    const filter = { school: req.school._id }
    
    if (gradeLevel) filter.gradeLevel = gradeLevel
    if (status) filter.status = status
    if (academicYear) filter.academicYear = academicYear
    
    const classes = await Class.find(filter)
      .populate('classTeacher', 'firstName lastName')
      .populate('subjects.subject', 'name')
      .populate('subjects.teacher', 'firstName lastName')
      .sort({ gradeLevel: 1, section: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
    
    const total = await Class.countDocuments(filter)
    
    res.status(200).json({
      success: true,
      data: classes,
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
 * Get class by ID
 */
exports.getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('classTeacher', 'firstName lastName email phone photo')
      .populate('assistantTeacher', 'firstName lastName email phone photo')
      .populate('subjects.subject', 'name code description')
      .populate('subjects.teacher', 'firstName lastName email phone photo')
      .lean()
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }
    
    // Check if class belongs to the school
    if (classData.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    res.status(200).json({
      success: true,
      data: classData
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Create new class
 */
exports.createClass = async (req, res) => {
  try {
    const classData = req.body
    classData.school = req.school._id
    
    // Check if class already exists
    const existingClass = await Class.findOne({
      school: req.school._id,
      className: classData.className,
      section: classData.section,
      academicYear: classData.academicYear
    })
    
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Class with same name and section already exists for this academic year'
      })
    }
    
    const newClass = new Class(classData)
    await newClass.save()
    
    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Update class
 */
exports.updateClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }
    
    // Check if class belongs to the school
    if (classData.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    Object.assign(classData, req.body)
    classData.updatedAt = Date.now()
    await classData.save()
    
    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: classData
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Delete class
 */
exports.deleteClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }
    
    // Check if class belongs to the school
    if (classData.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    // Check if class has students
    const studentCount = await Student.countDocuments({ currentClass: classData._id })
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class with ${studentCount} students. Please transfer or remove students first.`
      })
    }
    
    await classData.remove()
    
    res.status(200).json({
      success: true,
      message: 'Class deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get class students
 */
exports.getClassStudents = async (req, res) => {
  try {
    const classId = req.params.id
    
    const classData = await Class.findById(classId)
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }
    
    // Check if class belongs to the school
    if (classData.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    const students = await Student.find({
      currentClass: classId,
      school: req.school._id,
      status: 'active'
    })
    .select('firstName lastName admissionNo rollNo gender dateOfBirth fatherName phone photo')
    .sort({ rollNo: 1 })
    
    res.status(200).json({
      success: true,
      data: {
        class: {
          id: classData._id,
          name: classData.className,
          section: classData.section,
          gradeLevel: classData.gradeLevel
        },
        students,
        total: students.length
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
 * Get class timetable
 */
exports.getClassTimetable = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .select('timetable className section')
      .populate('timetable.monday.subject', 'name')
      .populate('timetable.monday.teacher', 'firstName lastName')
      .populate('timetable.tuesday.subject', 'name')
      .populate('timetable.tuesday.teacher', 'firstName lastName')
      .populate('timetable.wednesday.subject', 'name')
      .populate('timetable.wednesday.teacher', 'firstName lastName')
      .populate('timetable.thursday.subject', 'name')
      .populate('timetable.thursday.teacher', 'firstName lastName')
      .populate('timetable.friday.subject', 'name')
      .populate('timetable.friday.teacher', 'firstName lastName')
      .populate('timetable.saturday.subject', 'name')
      .populate('timetable.saturday.teacher', 'firstName lastName')
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }
    
    // Check if class belongs to the school
    if (classData.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    res.status(200).json({
      success: true,
      data: {
        class: {
          id: classData._id,
          name: classData.className,
          section: classData.section
        },
        timetable: classData.timetable
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
 * Update class timetable
 */
exports.updateClassTimetable = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }
    
    // Check if class belongs to the school
    if (classData.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    classData.timetable = req.body.timetable
    classData.updatedAt = Date.now()
    await classData.save()
    
    res.status(200).json({
      success: true,
      message: 'Timetable updated successfully',
      data: classData.timetable
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get class statistics
 */
exports.getClassStatistics = async (req, res) => {
  try {
    const classId = req.params.id
    
    const classData = await Class.findById(classId)
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }
    
    // Update class statistics
    await classData.updateStatistics()
    
    // Get subject-wise performance if available
    // This would require integration with results/marks system
    
    res.status(200).json({
      success: true,
      data: {
        totalStudents: classData.totalStudents,
        maleStudents: classData.maleStudents,
        femaleStudents: classData.femaleStudents,
        classTeacher: classData.classTeacher,
        subjects: classData.subjects.length,
        classroom: classData.classroomNo,
        capacity: classData.capacity,
        occupancyRate: ((classData.totalStudents / classData.capacity) * 100).toFixed(2) + '%',
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