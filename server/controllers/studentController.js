const mongoose = require('mongoose')
const Student = require('../models/Student')
const cloudinaryUtils = require('../config/cloudinary')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = 'temp/uploads/'
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    cb(null, tempDir)
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
        '-' +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    )
  },
})

const upload = multer({
  storage: tempStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    )
    const mimetype = file.mimetype.startsWith('image/')

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files are allowed for profile pictures'))
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
})

const cleanupTempFiles = (files) => {
  if (!files) return

  if (Array.isArray(files)) {
    files.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
    })
  } else if (files.path && fs.existsSync(files.path)) {
    fs.unlinkSync(files.path)
  }
}

const getNextAcademicYear = (currentYear) => {
  if (!currentYear || !currentYear.includes('-')) {
    return null
  }
  const [start, end] = currentYear.split('-').map(Number)
  return `${start + 1}-${end + 1}`
}

// EXISTING: number mapper (input → numeric)
const mapClassToNumber = (classInput) => {
  if (!classInput && classInput !== 0) return 1

  const classStr = classInput.toString().trim().toUpperCase()

  const classMap = {
    'PRE NURSERY': 0,
    NURSERY: 0.25,
    LKG: 0.5,
    UKG: 0.75,
    '1': 1,
    FIRST: 1,
    ONE: 1,
    '2': 2,
    SECOND: 2,
    TWO: 2,
    '3': 3,
    THIRD: 3,
    THREE: 3,
    '4': 4,
    FOURTH: 4,
    FOUR: 4,
    '5': 5,
    FIFTH: 5,
    FIVE: 5,
    '6': 6,
    SIXTH: 6,
    SIX: 6,
    '7': 7,
    SEVENTH: 7,
    SEVEN: 7,
    '8': 8,
    EIGHTH: 8,
    EIGHT: 8,
    '9': 9,
    NINTH: 9,
    NINE: 9,
    '10': 10,
    TENTH: 10,
    TEN: 10,
    '11': 11,
    ELEVENTH: 11,
    ELEVEN: 11,
    '12': 12,
    TWELFTH: 12,
    TWELVE: 12,

    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
    XI: 11,
    XII: 12,
  }

  if (classMap[classStr] !== undefined) {
    return classMap[classStr]
  }

  const classNum = parseFloat(classStr)
  if (!isNaN(classNum)) {
    return classNum
  }

  return null
}

// NEW: reverse mapper (numeric → label for UI)
const mapNumberToClassName = (classNum) => {
  if (classNum === null || classNum === undefined) return null

  const num = Number(classNum)

  if (num === 0) return 'Pre Nursery'
  if (num === 0.25) return 'Nursery'
  if (num === 0.5) return 'LKG'
  if (num === 0.75) return 'UKG'
  if (num >= 1 && num <= 12) return `Class ${num}`

  return `Class ${num}`
}

// helper: attach displayClass to student docs
const addDisplayClassToStudent = (studentDoc) => {
  if (!studentDoc) return studentDoc
  const obj = studentDoc.toObject ? studentDoc.toObject() : studentDoc
  obj.displayClass = mapNumberToClassName(obj.class)
  return obj
}

// helper: attach displayClass to array
const addDisplayClassToStudents = (students) =>
  students.map((s) => addDisplayClassToStudent(s))

exports.getAllStudents = async (req, res) => {
  try {
    const {
      class: classFilter,
      section,
      academicYear,
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const query = {}

    if (classFilter) {
      const classNum = mapClassToNumber(classFilter)
      if (classNum !== null) {
        query.class = classNum
      }
    }

    if (section) {
      query.section = section.toUpperCase()
    }

    if (academicYear) {
      query.academicYear = academicYear
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { admissionNo: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
        { parentPhone: { $regex: search, $options: 'i' } },
        { village: { $regex: search, $options: 'i' } },
      ]
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const sort = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const studentsRaw = await Student.find(query)
      .sort(sort)
      .limit(limitNum)
      .skip(skip)
      .select('-__v')

    const students = addDisplayClassToStudents(studentsRaw)

    const total = await Student.countDocuments(query)

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
      data: students,
    })
  } catch (error) {
    console.error('Get all students error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch students',
      errorDetails:
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

exports.getStudentById = async (req, res) => {
  try {
    const studentRaw = await Student.findById(req.params.id).select('-__v')

    if (!studentRaw) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      })
    }

    const student = addDisplayClassToStudent(studentRaw)

    res.status(200).json({
      success: true,
      data: student,
    })
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format',
      })
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student',
      errorDetails:
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

exports.createStudent = [
  upload.single('profilePic'),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        dob,
        academicYear,
        class: className,
        section,
        admissionNo,
        rollNo,
        address,
        village,
        parentName,
        parentPhone,
        parentPhone2,
        parentEmail,
      } = req.body

      if (!firstName || !lastName || !admissionNo || !parentPhone) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message:
            'Missing required fields: firstName, lastName, admissionNo, parentPhone',
        })
      }

      const existingStudent = await Student.findOne({ admissionNo })
      if (existingStudent) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Admission number already exists',
        })
      }

      const classNum = mapClassToNumber(className)
      if (classNum === null) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: `Invalid class: "${className}". Valid: Nursery, LKG, UKG, 1-12`,
        })
      }

      let profilePicData = null
      if (req.file) {
        try {
          const uploadResult = await cloudinaryUtils.uploadToCloudinary(
            req.file.path,
            {
              folder: 'school/students/profile-pictures',
              transformation: {
                width: 500,
                height: 500,
                crop: 'fill',
                gravity: 'face',
              },
            }
          )

          profilePicData = {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
          }
        } catch (uploadError) {
          cleanupTempFiles(req.file)
          throw new Error(
            `Failed to upload profile picture: ${uploadError.message}`
          )
        }

        cleanupTempFiles(req.file)
      }

      const studentData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob: dob ? new Date(dob) : null,
        academicYear:
          academicYear ||
          `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        class: classNum,
        section: section ? section.toUpperCase() : 'A',
        admissionNo: admissionNo.trim(),
        rollNo: rollNo || null,
        address: address || null,
        village: village || null,
        parentName: parentName || null,
        parentPhone: parentPhone
          .toString()
          .replace(/\D/g, '')
          .substring(0, 10),
        parentPhone2: parentPhone2
          ? parentPhone2.toString().replace(/\D/g, '').substring(0, 10)
          : null,
        parentEmail: parentEmail || null,
        profilePic: profilePicData,
        originalClassName: className || '',
      }

      const studentRaw = new Student(studentData)
      await studentRaw.save()

      const student = addDisplayClassToStudent(studentRaw)

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student,
      })
    } catch (error) {
      if (req.file) {
        cleanupTempFiles(req.file)
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map((err) => err.message),
        })
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create student',
        errorDetails:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      })
    }
  },
]

exports.updateStudent = [
  upload.single('profilePic'),
  async (req, res) => {
    try {
      const existingStudent = await Student.findById(req.params.id)
      if (!existingStudent) {
        cleanupTempFiles(req.file)
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        })
      }

      const {
        firstName,
        lastName,
        dob,
        academicYear,
        class: className,
        section,
        admissionNo,
        rollNo,
        address,
        village,
        parentName,
        parentPhone,
        parentPhone2,
        parentEmail,
        removeProfilePic,
      } = req.body

      if (admissionNo && admissionNo !== existingStudent.admissionNo) {
        const duplicate = await Student.findOne({ admissionNo })
        if (duplicate) {
          cleanupTempFiles(req.file)
          return res.status(400).json({
            success: false,
            message: 'Admission number already exists',
          })
        }
      }

      let classNum = existingStudent.class
      if (className !== undefined) {
        const mappedClass = mapClassToNumber(className)
        if (mappedClass === null) {
          cleanupTempFiles(req.file)
          return res.status(400).json({
            success: false,
            message: `Invalid class: "${className}". Valid: Nursery, LKG, UKG, 1-12`,
          })
        }
        classNum = mappedClass
      }

      let newProfilePicData = existingStudent.profilePic
      let oldPublicId = null

      if (removeProfilePic === 'true' || removeProfilePic === true) {
        if (existingStudent.profilePic && existingStudent.profilePic.publicId) {
          oldPublicId = existingStudent.profilePic.publicId
        }
        newProfilePicData = null
      }

      if (req.file) {
        if (existingStudent.profilePic && existingStudent.profilePic.publicId) {
          oldPublicId = existingStudent.profilePic.publicId
        }

        try {
          const uploadResult = await cloudinaryUtils.uploadToCloudinary(
            req.file.path,
            {
              folder: 'school/students/profile-pictures',
              transformation: {
                width: 500,
                height: 500,
                crop: 'fill',
                gravity: 'face',
              },
            }
          )

          newProfilePicData = {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
          }
        } catch (uploadError) {
          cleanupTempFiles(req.file)
          throw new Error(
            `Failed to upload new profile picture: ${uploadError.message}`
          )
        }

        cleanupTempFiles(req.file)
      }

      if (oldPublicId) {
        try {
          await cloudinaryUtils.deleteFromCloudinary(oldPublicId)
        } catch (deleteError) {
          console.error(
            'Failed to delete old profile picture from Cloudinary:',
            deleteError.message
          )
        }
      }

      const updateData = {
        firstName:
          firstName !== undefined
            ? firstName.trim()
            : existingStudent.firstName,
        lastName:
          lastName !== undefined ? lastName.trim() : existingStudent.lastName,
        dob:
          dob !== undefined
            ? dob
              ? new Date(dob)
              : null
            : existingStudent.dob,
        academicYear: academicYear || existingStudent.academicYear,
        class: classNum,
        section: section ? section.toUpperCase() : existingStudent.section,
        admissionNo: admissionNo || existingStudent.admissionNo,
        rollNo: rollNo !== undefined ? rollNo : existingStudent.rollNo,
        address: address !== undefined ? address : existingStudent.address,
        village: village !== undefined ? village : existingStudent.village,
        parentName:
          parentName !== undefined ? parentName : existingStudent.parentName,
        parentPhone: parentPhone
          ? parentPhone.toString().replace(/\D/g, '').substring(0, 10)
          : existingStudent.parentPhone,
        parentPhone2:
          parentPhone2 !== undefined
            ? parentPhone2
              ? parentPhone2.toString().replace(/\D/g, '').substring(0, 10)
              : null
            : existingStudent.parentPhone2,
        parentEmail:
          parentEmail !== undefined ? parentEmail : existingStudent.parentEmail,
        profilePic: newProfilePicData,
        originalClassName:
          className !== undefined ? className : existingStudent.originalClassName,
        updatedAt: Date.now(),
      }

      const updatedStudentRaw = await Student.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-__v')

      const updatedStudent = addDisplayClassToStudent(updatedStudentRaw)

      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: updatedStudent,
      })
    } catch (error) {
      if (req.file) {
        cleanupTempFiles(req.file)
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map((err) => err.message),
        })
      }

      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID format',
        })
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update student',
        errorDetails:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      })
    }
  },
]

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      })
    }

    if (student.profilePic && student.profilePic.publicId) {
      try {
        await cloudinaryUtils.deleteFromCloudinary(student.profilePic.publicId)
      } catch (deleteError) {
        console.error(
          'Failed to delete profile picture from Cloudinary:',
          deleteError.message
        )
      }
    }

    await Student.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    })
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format',
      })
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete student',
      errorDetails:
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

exports.promoteStudent = async (req, res) => {
  try {
    const studentRaw = await Student.findById(req.params.id)

    if (!studentRaw) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      })
    }

    if (studentRaw.class >= 12) {
      return res.status(400).json({
        success: false,
        message: 'Cannot promote beyond class 12',
      })
    }

    const nextAcademicYear = getNextAcademicYear(studentRaw.academicYear)
    if (!nextAcademicYear) {
      return res.status(400).json({
        success: false,
        message: 'Invalid academic year format',
      })
    }

    studentRaw.class += 1
    studentRaw.academicYear = nextAcademicYear
    studentRaw.updatedAt = Date.now()

    await studentRaw.save()

    const student = addDisplayClassToStudent(studentRaw)

    res.status(200).json({
      success: true,
      message: 'Student promoted successfully',
      data: student,
    })
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format',
      })
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to promote student',
      errorDetails:
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

exports.batchPromoteStudents = async (req, res) => {
  try {
    const {
      currentClass,
      currentSection,
      currentAcademicYear,
      skipStudentIds = [],
    } = req.body

    if (!currentClass || !currentAcademicYear) {
      return res.status(400).json({
        success: false,
        message: 'currentClass and currentAcademicYear are required',
      })
    }

    const classNum = mapClassToNumber(currentClass)
    if (classNum === null) {
      return res.status(400).json({
        success: false,
        message: `Invalid currentClass: "${currentClass}"`,
      })
    }

    const query = {
      class: classNum,
      academicYear: currentAcademicYear,
    }

    if (currentSection) {
      query.section = currentSection.toUpperCase()
    }

    if (skipStudentIds && skipStudentIds.length > 0) {
      query._id = { $nin: skipStudentIds }
    }

    if (classNum >= 12) {
      return res.status(400).json({
        success: false,
        message: 'Cannot promote students beyond class 12',
      })
    }

    const nextAcademicYear = getNextAcademicYear(currentAcademicYear)
    if (!nextAcademicYear) {
      return res.status(400).json({
        success: false,
        message: 'Invalid academic year format',
      })
    }

    const studentsToPromote = await Student.find(query)

    if (studentsToPromote.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No students found for promotion',
        count: 0,
      })
    }

    const bulkOperations = studentsToPromote.map((student) => ({
      updateOne: {
        filter: { _id: student._id },
        update: {
          $set: {
            class: student.class + 1,
            academicYear: nextAcademicYear,
            updatedAt: Date.now(),
          },
        },
      },
    }))

    const result = await Student.bulkWrite(bulkOperations)

    res.status(200).json({
      success: true,
      message: `Successfully promoted ${result.modifiedCount} students`,
      count: result.modifiedCount,
      data: {
        promotedFromClass: currentClass,
        promotedToClass: mapNumberToClassName(classNum + 1),
        previousAcademicYear: currentAcademicYear,
        newAcademicYear: nextAcademicYear,
      },
    })
  } catch (error) {
    console.error('Batch promote error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to batch promote students',
      errorDetails:
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

exports.searchStudents = async (req, res) => {
  try {
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
      sortOrder = 'asc',
    } = req.query

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

    if (classFilter) {
      const classNum = mapClassToNumber(classFilter)
      if (classNum !== null) {
        searchConditions.push({ class: classNum })
      }
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
          { parentPhone2: { $regex: parentPhone, $options: 'i' } },
        ],
      })
    }

    if (admissionNo) {
      searchConditions.push({
        admissionNo: { $regex: admissionNo, $options: 'i' },
      })
    }

    if (rollNo) {
      searchConditions.push({ rollNo: { $regex: rollNo, $options: 'i' } })
    }

    const finalQuery =
      searchConditions.length > 0 ? { $or: searchConditions } : {}

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    const studentsRaw = await Student.find(finalQuery)
      .sort(sort)
      .limit(limitNum)
      .skip(skip)
      .select('-__v')

    const students = addDisplayClassToStudents(studentsRaw)

    const total = await Student.countDocuments(finalQuery)

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
      data: students,
    })
  } catch (error) {
    console.error('Search students error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search students',
      errorDetails:
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

exports.getStudentStatistics = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments()

    const studentsByClassRaw = await Student.aggregate([
      {
        $group: {
          _id: '$class',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const studentsByClass = studentsByClassRaw.map((c) => ({
      class: c._id,
      classLabel: mapNumberToClassName(c._id),
      count: c.count,
    }))

    const studentsBySection = await Student.aggregate([
      {
        $group: {
          _id: '$section',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const studentsByAcademicYear = await Student.aggregate([
      {
        $group: {
          _id: '$academicYear',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ])

    const latestStudentsRaw = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName admissionNo class section profilePic createdAt')

    const latestStudents = latestStudentsRaw.map((s) =>
      addDisplayClassToStudent(s)
    )

    const statistics = {
      total: totalStudents,
      byClass: studentsByClass,
      bySection: studentsBySection,
      byAcademicYear: studentsByAcademicYear,
      latest: latestStudents,
    }

    res.status(200).json({
      success: true,
      data: statistics,
    })
  } catch (error) {
    console.error('Statistics error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get student statistics',
      errorDetails:
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

exports.getClassesSummary = async (req, res) => {
  try {
    const { academicYear } = req.query
    console.log(academicYear)

    let pipeline = []
    if (academicYear) {
      pipeline.push({ $match: { academicYear } })
    }

    pipeline = pipeline.concat([
      {
        $group: {
          _id: {
            class: '$class',
            section: '$section',
            gender: { $ifNull: ['$gender', 'Not Specified'] },
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: {
            class: '$_id.class',
            gender: '$_id.gender',
          },
          sections: { $addToSet: '$_id.section' },
          totalCount: { $sum: '$count' },
        },
      },
      {
        $group: {
          _id: '$_id.class',
          sections: { $first: '$sections' },
          maleCount: {
            $sum: {
              $cond: [
                { $eq: ['$_id.gender', 'Male'] },
                '$totalCount',
                0,
              ],
            },
          },
          femaleCount: {
            $sum: {
              $cond: [
                { $eq: ['$_id.gender', 'Female'] },
                '$totalCount',
                0,
              ],
            },
          },
          otherCount: {
            $sum: {
              $cond: [
                {
                  $in: ['$_id.gender', ['Not Specified']],
                },
                '$totalCount',
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          class: '$_id',
          sections: { $sortArray: { input: '$sections', sortBy: 1 } },
          maleCount: 1,
          femaleCount: 1,
          totalCount: { $add: ['$maleCount', '$femaleCount', '$otherCount'] },
        },
      },
      { $sort: { class: 1 } },
    ])

    const summaryRaw = await Student.aggregate(pipeline)

    const summary = summaryRaw.map((item) => ({
      ...item,
      classLabel: mapNumberToClassName(item.class),
    }))

    res.status(200).json({
      success: true,
      data: summary,
    })
  } catch (error) {
    console.error('Get classes summary error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get classes summary',
      errorDetails:
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

exports.getClassDetails = async (req, res) => {
  try {
    const { class: classInput, academicYear } = req.query

    const classNum = mapClassToNumber(classInput)
    if (classNum === null) {
      return res.status(400).json({
        success: false,
        message: `Invalid class: "${classInput}". Valid: Nursery, LKG, UKG, 1-12`,
      })
    }

    const matchStage = { class: classNum }
    if (academicYear) {
      matchStage.academicYear = academicYear
    }

    const detailsRaw = await Student.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            section: '$section',
            gender: { $ifNull: ['$gender', 'Not Specified'] },
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.section',
          maleCount: {
            $sum: {
              $cond: [
                { $eq: ['$_id.gender', 'Male'] },
                '$count',
                0,
              ],
            },
          },
          femaleCount: {
            $sum: {
              $cond: [
                { $eq: ['$_id.gender', 'Female'] },
                '$count',
                0,
              ],
            },
          },
          otherCount: {
            $sum: {
              $cond: [
                {
                  $in: ['$_id.gender', ['Not Specified']],
                },
                '$count',
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          section: '$_id',
          maleCount: 1,
          femaleCount: 1,
          totalCount: { $add: ['$maleCount', '$femaleCount', '$otherCount'] },
        },
      },
      { $sort: { section: 1 } },
    ])

    res.status(200).json({
      success: true,
      data: detailsRaw,
      class: classNum,
      classLabel: mapNumberToClassName(classNum),
    })
  } catch (error) {
    console.error('Get class details error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get class details',
      errorDetails:
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

exports.getStudentsByClassAndSection = async (req, res) => {
  try {
    const {
      class: classInput,
      section,
      academicYear,
      sortBy = 'firstName',
      sortOrder = 'asc',
    } = req.query

    const classNum = mapClassToNumber(classInput)
    if (classNum === null) {
      return res.status(400).json({
        success: false,
        message: `Invalid class: "${classInput}". Valid: Nursery, LKG, UKG, 1-12`,
      })
    }

    if (!section) {
      return res.status(400).json({
        success: false,
        message: 'Section is required',
      })
    }

    const query = {
      class: classNum,
      section: section.toUpperCase(),
    }
    if (academicYear) {
      query.academicYear = academicYear
    }

    const sort = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const studentsRaw = await Student.find(query)
      .sort(sort)
      .select('-__v -updatedAt')

    const students = addDisplayClassToStudents(studentsRaw)

    const total = students.length

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      data: students,
      filters: {
        class: classNum,
        classLabel: mapNumberToClassName(classNum),
        section: section.toUpperCase(),
        academicYear,
      },
    })
  } catch (error) {
    console.error('Get students by class and section error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get students by class and section',
      errorDetails:
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}
