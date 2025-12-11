const Subject = require('../models/Subject')

/**
 * Get all subjects
 */
exports.getAllSubjects = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      department, 
      gradeLevel, 
      status, 
      search 
    } = req.query
    
    const filter = { school: req.school._id }
    
    if (department) filter.department = department
    if (gradeLevel) filter.gradeLevel = gradeLevel
    if (status) filter.status = status
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    const subjects = await Subject.find(filter)
      .sort({ code: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
    
    const total = await Subject.countDocuments(filter)
    
    res.status(200).json({
      success: true,
      data: subjects,
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
 * Get subject by ID
 */
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('school', 'name')
      .lean()
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      })
    }
    
    // Check if subject belongs to the school
    if (subject.school._id.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    // Get subject teachers and classes
    const subjectModel = await Subject.findById(req.params.id)
    const teachers = await subjectModel.getSubjectTeachers()
    const classes = await subjectModel.getOfferingClasses()
    
    res.status(200).json({
      success: true,
      data: {
        ...subject,
        teachers,
        classes
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
 * Create new subject
 */
exports.createSubject = async (req, res) => {
  try {
    const subjectData = req.body
    subjectData.school = req.school._id
    
    // Check if subject code already exists
    const existingSubject = await Subject.findOne({
      school: req.school._id,
      code: subjectData.code
    })
    
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject code already exists'
      })
    }
    
    const subject = new Subject(subjectData)
    await subject.save()
    
    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Update subject
 */
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      })
    }
    
    // Check if subject belongs to the school
    if (subject.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    Object.assign(subject, req.body)
    subject.updatedAt = Date.now()
    await subject.save()
    
    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Delete subject
 */
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      })
    }
    
    // Check if subject belongs to the school
    if (subject.school.toString() !== req.school._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    // Check if subject is assigned to any class
    const Class = require('../models/Class')
    const classCount = await Class.countDocuments({
      school: req.school._id,
      'subjects.subject': subject._id
    })
    
    if (classCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject. It is assigned to ${classCount} classes.`
      })
    }
    
    await subject.remove()
    
    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get subjects by grade level
 */
exports.getSubjectsByGradeLevel = async (req, res) => {
  try {
    const { gradeLevel } = req.params
    
    const subjects = await Subject.find({
      school: req.school._id,
      $or: [
        { gradeLevel: gradeLevel },
        { gradeLevel: 'All' }
      ],
      status: 'active'
    }).sort({ name: 1 })
    
    res.status(200).json({
      success: true,
      data: subjects
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get elective subjects
 */
exports.getElectiveSubjects = async (req, res) => {
  try {
    const { group } = req.query
    
    const filter = {
      school: req.school._id,
      isElective: true,
      status: 'active'
    }
    
    if (group) filter.electiveGroup = group
    
    const subjects = await Subject.find(filter).sort({ name: 1 })
    
    res.status(200).json({
      success: true,
      data: subjects
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}