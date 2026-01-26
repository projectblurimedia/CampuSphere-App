const mongoose = require('mongoose')
const Student = require('../models/Student')
const cloudinaryUtils = require('../config/cloudinary')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Import fee calculation utilities
const {
  calculateStudentFees,
  getDisplayClassName,
  classMappings,
  displayClassMappings,
  getClassNameForFeeLookup,
  calculateDiscountedFee
} = require('../utils/feeCalculations')

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
    'PRE-NURSERY': 0,
    'PRE NURSERY': 0,
    NURSERY: 0.25,
    LKG: 0.5,
    'L.K.G': 0.5,
    UKG: 0.75,
    'U.K.G': 0.75,
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

// Helper to parse discount values safely
const parseDiscount = (value) => {
  if (!value && value !== 0) return 0
  const num = parseFloat(value)
  return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 100)
}

// Helper to format phone number
const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  const cleaned = phone.toString().replace(/\D/g, '')
  return cleaned.substring(0, 10)
}

// Create student with automatic fee calculation
exports.createStudent = [
  upload.single('profilePic'),
  async (req, res) => {
    let uploadedProfilePic = false
    
    try {
      // Destructure with default values
      const {
        firstName,
        lastName,
        dob,
        gender = 'Not Specified',
        academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        class: className,
        section = 'A',
        admissionNo,
        rollNo,
        address,
        village,
        studentType = 'Day Scholar',
        isUsingSchoolTransport = false,
        schoolFeeDiscount = 0,
        transportFeeDiscount = 0,
        hostelFeeDiscount = 0,
        parentName,
        parentPhone,
        parentPhone2,
        parentEmail,
      } = req.body

      // Validate required fields
      if (!firstName || !lastName || !admissionNo || !parentPhone || !className) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: firstName, lastName, admissionNo, parentPhone, class'
        })
      }

      // Check for duplicate admission number
      const existingStudent = await Student.findOne({ admissionNo })
      if (existingStudent) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Admission number already exists'
        })
      }

      // Map class name to number
      const classNum = mapClassToNumber(className)
      if (classNum === null) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: `Invalid class: "${className}". Valid: Pre-Nursery, Nursery, LKG, UKG, 1-12`
        })
      }

      // Validate student type and transport logic
      if (studentType === 'Day Scholar' && isUsingSchoolTransport && !village) {
        console.warn('Student is using transport but no village specified. Using default transport fee.')
      }

      // Upload profile picture if provided
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
          uploadedProfilePic = true
          
        } catch (uploadError) {
          cleanupTempFiles(req.file)
          return res.status(500).json({
            success: false,
            message: `Failed to upload profile picture: ${uploadError.message}`
          })
        }
      }

      // Calculate fees automatically
      console.log('Calculating fees for new student...')
      console.log('Student Data:', {
        class: classNum,
        academicYear,
        village,
        isUsingSchoolTransport,
        studentType,
        schoolFeeDiscount: parseDiscount(schoolFeeDiscount),
        transportFeeDiscount: parseDiscount(transportFeeDiscount),
        hostelFeeDiscount: parseDiscount(hostelFeeDiscount)
      })

      const feeCalculation = await calculateStudentFees({
        class: classNum,
        academicYear,
        village,
        isUsingSchoolTransport: studentType === 'Day Scholar' ? isUsingSchoolTransport : false,
        studentType,
        schoolFeeDiscount: parseDiscount(schoolFeeDiscount),
        transportFeeDiscount: parseDiscount(transportFeeDiscount),
        hostelFeeDiscount: parseDiscount(hostelFeeDiscount)
      })

      console.log('Fee Calculation Result:', {
        success: feeCalculation.success,
        schoolFee: feeCalculation.schoolFee,
        transportFee: feeCalculation.transportFee,
        hostelFee: feeCalculation.hostelFee,
        totalFee: feeCalculation.totalFee,
        totalTerms: feeCalculation.totalTerms
      })

      if (!feeCalculation.success) {
        console.error('Fee calculation failed:', feeCalculation.error)
        // Continue with defaults if fee calculation fails
      }

      // Prepare student data
      const studentData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob: dob ? new Date(dob) : null,
        gender,
        academicYear,
        class: classNum,
        section: section.toUpperCase(),
        admissionNo: admissionNo.trim(),
        rollNo: rollNo ? rollNo.trim() : null,
        address: address ? address.trim() : null,
        village: village ? village.trim() : null,
        studentType,
        isUsingSchoolTransport: studentType === 'Day Scholar' ? (isUsingSchoolTransport === true || isUsingSchoolTransport === 'true') : false,
        schoolFeeDiscount: parseDiscount(schoolFeeDiscount),
        transportFeeDiscount: parseDiscount(transportFeeDiscount),
        hostelFeeDiscount: parseDiscount(hostelFeeDiscount),
        parentName: parentName ? parentName.trim() : null,
        parentPhone: formatPhoneNumber(parentPhone),
        parentPhone2: parentPhone2 ? formatPhoneNumber(parentPhone2) : null,
        parentEmail: parentEmail ? parentEmail.trim().toLowerCase() : null,
        profilePic: profilePicData,
        originalClassName: className.trim(),
        feeDetails: [{
          academicYear,
          schoolFee: feeCalculation.schoolFee || 0,
          transportFee: feeCalculation.transportFee || 0,
          hostelFee: feeCalculation.hostelFee || 0,
          terms: feeCalculation.totalTerms || 3,
          totalFee: (feeCalculation.schoolFee || 0) + (feeCalculation.transportFee || 0) + (feeCalculation.hostelFee || 0),
          schoolFeePaid: 0,
          transportFeePaid: 0,
          hostelFeePaid: 0,
          totalPaid: 0,
          totalDue: (feeCalculation.schoolFee || 0) + (feeCalculation.transportFee || 0) + (feeCalculation.hostelFee || 0),
          schoolFeeDiscountApplied: parseDiscount(schoolFeeDiscount),
          transportFeeDiscountApplied: parseDiscount(transportFeeDiscount),
          hostelFeeDiscountApplied: parseDiscount(hostelFeeDiscount),
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        feeCalculationDetails: feeCalculation.feeBreakdown || {},
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Validate student data consistency
      if (studentType === 'Day Scholar' && studentData.feeDetails[0].hostelFee > 0) {
        studentData.feeDetails[0].hostelFee = 0
        console.warn('Reset hostel fee to 0 for Day Scholar')
      }

      if (!studentData.isUsingSchoolTransport && studentData.feeDetails[0].transportFee > 0) {
        studentData.feeDetails[0].transportFee = 0
        console.warn('Reset transport fee to 0 for non-transport user')
      }

      // Recalculate totals after adjustments
      studentData.feeDetails[0].totalFee = studentData.feeDetails[0].schoolFee + 
                                          studentData.feeDetails[0].transportFee + 
                                          studentData.feeDetails[0].hostelFee
      studentData.feeDetails[0].totalDue = studentData.feeDetails[0].totalFee

      // Create and save student
      const studentRaw = new Student(studentData)
      await studentRaw.save()

      // Add display class to response
      const student = addDisplayClassToStudent(studentRaw)

      // Cleanup temp files if uploaded
      if (req.file) {
        cleanupTempFiles(req.file)
      }

      // Prepare response with fee details
      const response = {
        success: true,
        message: 'Student created successfully with automatic fee calculation',
        data: {
          ...student,
          feeSummary: {
            academicYear,
            schoolFee: studentRaw.feeDetails[0].schoolFee,
            transportFee: studentRaw.feeDetails[0].transportFee,
            hostelFee: studentRaw.feeDetails[0].hostelFee,
            totalFee: studentRaw.feeDetails[0].totalFee,
            totalDue: studentRaw.feeDetails[0].totalDue,
            discountsApplied: {
              school: studentRaw.feeDetails[0].schoolFeeDiscountApplied,
              transport: studentRaw.feeDetails[0].transportFeeDiscountApplied,
              hostel: studentRaw.feeDetails[0].hostelFeeDiscountApplied
            }
          },
          calculationDetails: {
            studentType,
            usesTransport: studentRaw.isUsingSchoolTransport,
            village: studentRaw.village || 'Not specified',
            note: feeCalculation.success ? 'Fees calculated from fee structures' : 'Fees calculated using defaults'
          }
        }
      }

      res.status(201).json(response)

    } catch (error) {
      // Cleanup uploaded profile picture if error occurred after upload
      if (uploadedProfilePic && req.file) {
        try {
          await cleanupTempFiles(req.file)
        } catch (cleanupError) {
          console.error('Error cleaning up temp files:', cleanupError)
        }
      } else if (req.file) {
        cleanupTempFiles(req.file)
      }

      // Handle specific error types
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map((err) => err.message),
        })
      }

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate admission number or roll number',
          error: error.keyValue
        })
      }

      console.error('Error creating student:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create student',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      })
    }
  }
]

// Update student (with optional fee recalculation if class/village/type changes)
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
        gender,
        academicYear,
        class: className,
        section,
        admissionNo,
        rollNo,
        address,
        village,
        studentType,
        isUsingSchoolTransport,
        schoolFeeDiscount,
        transportFeeDiscount,
        hostelFeeDiscount,
        parentName,
        parentPhone,
        parentPhone2,
        parentEmail,
        removeProfilePic,
        recalculateFees = false, // New flag to trigger fee recalculation
      } = req.body

      // Check for duplicate admission number if changed
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

      // Handle class change
      let classNum = existingStudent.class
      if (className !== undefined) {
        const mappedClass = mapClassToNumber(className)
        if (mappedClass === null) {
          cleanupTempFiles(req.file)
          return res.status(400).json({
            success: false,
            message: `Invalid class: "${className}". Valid: Pre-Nursery, Nursery, LKG, UKG, 1-12`,
          })
        }
        classNum = mappedClass
        // If class changed, auto-trigger fee recalculation
        if (classNum !== existingStudent.class) {
          recalculateFees = true
        }
      }

      // Handle profile picture
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

      // Calculate new fees if needed
      let newFeeDetails = existingStudent.feeDetails
      let feeCalculationDetails = existingStudent.feeCalculationDetails || {}
      
      if (recalculateFees === true || recalculateFees === 'true' || 
          studentType !== undefined || 
          village !== undefined ||
          isUsingSchoolTransport !== undefined ||
          schoolFeeDiscount !== undefined ||
          transportFeeDiscount !== undefined ||
          hostelFeeDiscount !== undefined) {
        
        const currentAcademicYear = academicYear || existingStudent.academicYear
        
        console.log('Recalculating fees for updated student...')
        const feeCalculation = await calculateStudentFees({
          class: classNum,
          academicYear: currentAcademicYear,
          village: village || existingStudent.village,
          isUsingSchoolTransport: studentType === 'Day Scholar' ? 
            (isUsingSchoolTransport !== undefined ? (isUsingSchoolTransport === true || isUsingSchoolTransport === 'true') : existingStudent.isUsingSchoolTransport) : 
            false,
          studentType: studentType || existingStudent.studentType,
          schoolFeeDiscount: parseDiscount(schoolFeeDiscount !== undefined ? schoolFeeDiscount : existingStudent.schoolFeeDiscount),
          transportFeeDiscount: parseDiscount(transportFeeDiscount !== undefined ? transportFeeDiscount : existingStudent.transportFeeDiscount),
          hostelFeeDiscount: parseDiscount(hostelFeeDiscount !== undefined ? hostelFeeDiscount : existingStudent.hostelFeeDiscount)
        })

        if (feeCalculation.success) {
          // Find or create fee record for current academic year
          let feeRecord = existingStudent.feeDetails.find(
            record => record.academicYear === currentAcademicYear
          )
          
          if (!feeRecord) {
            feeRecord = {
              academicYear: currentAcademicYear,
              schoolFee: 0,
              transportFee: 0,
              hostelFee: 0,
              totalFee: 0,
              terms: feeCalculation.totalTerms || 3,
              schoolFeePaid: 0,
              transportFeePaid: 0,
              hostelFeePaid: 0,
              totalPaid: 0,
              totalDue: 0,
              schoolFeeDiscountApplied: parseDiscount(schoolFeeDiscount !== undefined ? schoolFeeDiscount : existingStudent.schoolFeeDiscount),
              transportFeeDiscountApplied: parseDiscount(transportFeeDiscount !== undefined ? transportFeeDiscount : existingStudent.transportFeeDiscount),
              hostelFeeDiscountApplied: parseDiscount(hostelFeeDiscount !== undefined ? hostelFeeDiscount : existingStudent.hostelFeeDiscount),
              createdAt: new Date(),
              updatedAt: new Date()
            }
            newFeeDetails.push(feeRecord)
          }
          
          // Update fees (keep existing payments)
          feeRecord.schoolFee = feeCalculation.schoolFee || 0
          feeRecord.transportFee = feeCalculation.transportFee || 0
          feeRecord.hostelFee = feeCalculation.hostelFee || 0
          feeRecord.terms = feeCalculation.totalTerms || 3 
          feeRecord.totalFee = feeRecord.schoolFee + feeRecord.transportFee + feeRecord.hostelFee
          feeRecord.totalDue = Math.max(0, feeRecord.totalFee - feeRecord.totalPaid)
          feeRecord.schoolFeeDiscountApplied = parseDiscount(schoolFeeDiscount !== undefined ? schoolFeeDiscount : existingStudent.schoolFeeDiscount)
          feeRecord.transportFeeDiscountApplied = parseDiscount(transportFeeDiscount !== undefined ? transportFeeDiscount : existingStudent.transportFeeDiscount)
          feeRecord.hostelFeeDiscountApplied = parseDiscount(hostelFeeDiscount !== undefined ? hostelFeeDiscount : existingStudent.hostelFeeDiscount)
          feeRecord.updatedAt = new Date()
          
          feeCalculationDetails = feeCalculation.feeBreakdown || {}
        }
      }

      // Prepare update data
      const updateData = {
        firstName: firstName !== undefined ? firstName.trim() : existingStudent.firstName,
        lastName: lastName !== undefined ? lastName.trim() : existingStudent.lastName,
        dob: dob !== undefined ? (dob ? new Date(dob) : null) : existingStudent.dob,
        gender: gender !== undefined ? gender : existingStudent.gender,
        academicYear: academicYear || existingStudent.academicYear,
        class: classNum,
        section: section ? section.toUpperCase() : existingStudent.section,
        admissionNo: admissionNo || existingStudent.admissionNo,
        rollNo: rollNo !== undefined ? rollNo : existingStudent.rollNo,
        address: address !== undefined ? address : existingStudent.address,
        village: village !== undefined ? village : existingStudent.village,
        studentType: studentType !== undefined ? studentType : existingStudent.studentType,
        isUsingSchoolTransport: isUsingSchoolTransport !== undefined ? 
          (isUsingSchoolTransport === true || isUsingSchoolTransport === 'true') : 
          existingStudent.isUsingSchoolTransport,
        schoolFeeDiscount: parseDiscount(schoolFeeDiscount !== undefined ? schoolFeeDiscount : existingStudent.schoolFeeDiscount),
        transportFeeDiscount: parseDiscount(transportFeeDiscount !== undefined ? transportFeeDiscount : existingStudent.transportFeeDiscount),
        hostelFeeDiscount: parseDiscount(hostelFeeDiscount !== undefined ? hostelFeeDiscount : existingStudent.hostelFeeDiscount),
        parentName: parentName !== undefined ? parentName : existingStudent.parentName,
        parentPhone: parentPhone ? formatPhoneNumber(parentPhone) : existingStudent.parentPhone,
        parentPhone2: parentPhone2 !== undefined ? 
          (parentPhone2 ? formatPhoneNumber(parentPhone2) : null) : 
          existingStudent.parentPhone2,
        parentEmail: parentEmail !== undefined ? parentEmail : existingStudent.parentEmail,
        profilePic: newProfilePicData,
        originalClassName: className !== undefined ? className : existingStudent.originalClassName,
        feeDetails: newFeeDetails,
        feeCalculationDetails: feeCalculationDetails,
        updatedAt: new Date(),
      }

      // Validate and adjust fees based on student type
      if (updateData.studentType === 'Day Scholar') {
        // Ensure hostel fee is 0 for day scholars
        updateData.feeDetails.forEach(record => {
          if (record.hostelFee > 0) {
            record.hostelFee = 0
            record.totalFee = record.schoolFee + record.transportFee + record.hostelFee
            record.totalDue = Math.max(0, record.totalFee - record.totalPaid)
          }
        })
      }

      if (!updateData.isUsingSchoolTransport) {
        // Ensure transport fee is 0 for non-transport users
        updateData.feeDetails.forEach(record => {
          if (record.transportFee > 0) {
            record.transportFee = 0
            record.totalFee = record.schoolFee + record.transportFee + record.hostelFee
            record.totalDue = Math.max(0, record.totalFee - record.totalPaid)
          }
        })
      }

      // Update student
      const updatedStudentRaw = await Student.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-__v')

      // Cleanup old profile picture from Cloudinary if new one uploaded
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

      const updatedStudent = addDisplayClassToStudent(updatedStudentRaw)

      res.status(200).json({
        success: true,
        message: 'Student updated successfully' + (recalculateFees ? ' with fee recalculation' : ''),
        data: updatedStudent,
        feeRecalculated: recalculateFees === true || recalculateFees === 'true'
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
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      })
    }
  }
]

// Rest of the functions remain the same (getAllStudents, getStudentById, etc.)
// ... (Keep all other functions as they are, unchanged)

// Add a new endpoint to manually recalculate fees for a student
exports.recalculateStudentFees = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    const { academicYear } = req.body
    const targetAcademicYear = academicYear || student.academicYear

    console.log(`Recalculating fees for student ${student.admissionNo}, academic year ${targetAcademicYear}`)

    const feeCalculation = await calculateStudentFees({
      class: student.class,
      academicYear: targetAcademicYear,
      village: student.village,
      isUsingSchoolTransport: student.isUsingSchoolTransport,
      studentType: student.studentType,
      schoolFeeDiscount: student.schoolFeeDiscount,
      transportFeeDiscount: student.transportFeeDiscount,
      hostelFeeDiscount: student.hostelFeeDiscount
    })

    if (!feeCalculation.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to recalculate fees: ' + (feeCalculation.error || 'Unknown error')
      })
    }

    // Find or create fee record for the academic year
    let feeRecord = student.feeDetails.find(
      record => record.academicYear === targetAcademicYear
    )
    
    if (!feeRecord) {
      feeRecord = {
        academicYear: targetAcademicYear,
        schoolFee: 0,
        transportFee: 0,
        hostelFee: 0,
        totalFee: 0,
        terms: feeCalculation.totalTerms || 3,
        schoolFeePaid: 0,
        transportFeePaid: 0,
        hostelFeePaid: 0,
        totalPaid: 0,
        totalDue: 0,
        schoolFeeDiscountApplied: student.schoolFeeDiscount,
        transportFeeDiscountApplied: student.transportFeeDiscount,
        hostelFeeDiscountApplied: student.hostelFeeDiscount,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      student.feeDetails.push(feeRecord)
    }
    
    // Update fees (preserve payments)
    const previousSchoolFee = feeRecord.schoolFee
    const previousTransportFee = feeRecord.transportFee
    const previousHostelFee = feeRecord.hostelFee
    
    feeRecord.schoolFee = feeCalculation.schoolFee || 0
    feeRecord.transportFee = feeCalculation.transportFee || 0
    feeRecord.hostelFee = feeCalculation.hostelFee || 0
    feeRecord.totalFee = feeRecord.schoolFee + feeRecord.transportFee + feeRecord.hostelFee
    
    // Adjust payments if fees decreased
    if (feeRecord.schoolFee < previousSchoolFee) {
      feeRecord.schoolFeePaid = Math.min(feeRecord.schoolFeePaid, feeRecord.schoolFee)
    }
    if (feeRecord.transportFee < previousTransportFee) {
      feeRecord.transportFeePaid = Math.min(feeRecord.transportFeePaid, feeRecord.transportFee)
    }
    if (feeRecord.hostelFee < previousHostelFee) {
      feeRecord.hostelFeePaid = Math.min(feeRecord.hostelFeePaid, feeRecord.hostelFee)
    }
    
    feeRecord.totalPaid = feeRecord.schoolFeePaid + feeRecord.transportFeePaid + feeRecord.hostelFeePaid
    feeRecord.totalDue = Math.max(0, feeRecord.totalFee - feeRecord.totalPaid)
    feeRecord.schoolFeeDiscountApplied = student.schoolFeeDiscount
    feeRecord.transportFeeDiscountApplied = student.transportFeeDiscount
    feeRecord.hostelFeeDiscountApplied = student.hostelFeeDiscount
    feeRecord.updatedAt = new Date()
    
    student.feeCalculationDetails = feeCalculation.feeBreakdown || {}
    student.updatedAt = new Date()

    await student.save()

    const updatedStudent = addDisplayClassToStudent(student)

    res.status(200).json({
      success: true,
      message: 'Fees recalculated successfully',
      data: {
        student: updatedStudent,
        feeSummary: {
          academicYear: targetAcademicYear,
          schoolFee: feeRecord.schoolFee,
          transportFee: feeRecord.transportFee,
          hostelFee: feeRecord.hostelFee,
          totalFee: feeRecord.totalFee,
          totalPaid: feeRecord.totalPaid,
          totalDue: feeRecord.totalDue,
          discountsApplied: {
            school: feeRecord.schoolFeeDiscountApplied,
            transport: feeRecord.transportFeeDiscountApplied,
            hostel: feeRecord.hostelFeeDiscountApplied
          }
        },
        calculationDetails: feeCalculation.feeBreakdown || {}
      }
    })
  } catch (error) {
    console.error('Recalculate fees error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to recalculate fees',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

// Keep all other existing functions exactly as they were...
// getAllStudents, getStudentById, deleteStudent, promoteStudent, batchPromoteStudents,
// searchStudents, getStudentStatistics, getClassesSummary, getClassDetails, getStudentsByClassAndSection

// Export all functions
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