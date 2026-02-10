import prisma from '../lib/prisma.js'
import asyncHandler from 'express-async-handler'
import {
  mapClassToEnum,
  mapEnumToDisplayName,
  validateSection
} from '../utils/classMappings.js'

// Helper functions to map frontend values to enum values
const mapExamType = (type) => {
  if (!type) return null
  
  const typeStr = type.toString().trim()
  const lowerType = typeStr.toLowerCase()
  
  const typeMap = {
    'formative 1': 'FORMATIVE_1',
    'formative-1': 'FORMATIVE_1',
    'formative_1': 'FORMATIVE_1',
    'formative1': 'FORMATIVE_1',
    'formative 2': 'FORMATIVE_2',
    'formative-2': 'FORMATIVE_2',
    'formative_2': 'FORMATIVE_2',
    'formative2': 'FORMATIVE_2',
    'formative 3': 'FORMATIVE_3',
    'formative-3': 'FORMATIVE_3',
    'formative_3': 'FORMATIVE_3',
    'formative3': 'FORMATIVE_3',
    'summative 1': 'SUMMATIVE_1',
    'summative-1': 'SUMMATIVE_1',
    'summative_1': 'SUMMATIVE_1',
    'summative1': 'SUMMATIVE_1',
    'summative 2': 'SUMMATIVE_2',
    'summative-2': 'SUMMATIVE_2',
    'summative_2': 'SUMMATIVE_2',
    'summative2': 'SUMMATIVE_2',
    'pre-final 1': 'PRE_FINAL_1',
    'pre-final-1': 'PRE_FINAL_1',
    'pre_final_1': 'PRE_FINAL_1',
    'prefinal1': 'PRE_FINAL_1',
    'pre-final 2': 'PRE_FINAL_2',
    'pre-final-2': 'PRE_FINAL_2',
    'pre_final_2': 'PRE_FINAL_2',
    'prefinal2': 'PRE_FINAL_2',
    'pre-final 3': 'PRE_FINAL_3',
    'pre-final-3': 'PRE_FINAL_3',
    'pre_final_3': 'PRE_FINAL_3',
    'prefinal3': 'PRE_FINAL_3',
    'final': 'FINAL'
  }
  
  return typeMap[lowerType] || null
}

const mapSubject = (subject) => {
  if (!subject) return null
  
  const subjectStr = subject.toString().trim()
  const lowerSubject = subjectStr.toLowerCase()
  
  const subjectMap = {
    'telugu': 'TELUGU',
    'mathematics': 'MATHEMATICS',
    'math': 'MATHEMATICS',
    'maths': 'MATHEMATICS',
    'science': 'SCIENCE',
    'english': 'ENGLISH',
    'hindi': 'HINDI',
    'social': 'SOCIAL',
    'social studies': 'SOCIAL',
    'social-studies': 'SOCIAL',
    'social_studies': 'SOCIAL',
    'computers': 'COMPUTERS',
    'computer': 'COMPUTERS',
    'computer science': 'COMPUTERS',
    'computer-science': 'COMPUTERS',
    'computer_science': 'COMPUTERS',
    'physics': 'PHYSICS',
    'biology': 'BIOLOGY'
  }
  
  return subjectMap[lowerSubject] || null
}

// Helper function to parse JSON marks data
const parseMarksData = (marksData) => {
  if (!marksData) return {}
  
  try {
    if (typeof marksData === 'string') {
      return JSON.parse(marksData)
    }
    return marksData
  } catch (error) {
    console.error('Error parsing marks data:', error)
    return {}
  }
}

// Helper function to calculate grade based on percentage
const calculateGrade = (percentage) => {
  const perc = parseFloat(percentage)
  
  if (isNaN(perc)) return 'NA'
  if (perc >= 90) return 'A_PLUS'
  if (perc >= 80) return 'A'
  if (perc >= 70) return 'B_PLUS'
  if (perc >= 60) return 'B'
  if (perc >= 50) return 'C'
  if (perc >= 40) return 'D'
  if (perc >= 33) return 'E'
  return 'F'
}

// Helper function to calculate result status for a subject
const calculateResult = (percentage) => {
  const perc = parseFloat(percentage)
  
  if (isNaN(perc)) return 'NA'
  if (perc >= 33) return 'PASS'
  return 'FAIL'
}

// Helper function to calculate OVERALL result based on ALL subjects
// Overall result should be FAIL if ANY subject fails
const calculateOverallResult = (marksData) => {
  if (!marksData || typeof marksData !== 'object') return 'NA'
  
  const subjects = Object.keys(marksData)
  if (subjects.length === 0) return 'NA'
  
  // Check if any subject has result = 'FAIL'
  const hasFailedSubject = subjects.some(subject => {
    const subjectData = marksData[subject]
    return subjectData && subjectData.result === 'FAIL'
  })
  
  return hasFailedSubject ? 'FAIL' : 'PASS'
}

/**
 * @desc    Check if marks already exist for given criteria
 * @route   GET /api/marks/check
 * @access  Private
 */
export const checkExistingMarks = asyncHandler(async (req, res) => {
  const { examType, subject, className, section } = req.query
  // Validation
  if (!examType || !subject || !className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Exam type, subject, class name, and section are required',
      missingFields: {
        examType: !examType,
        subject: !subject,
        className: !className,
        section: !section
      }
    })
  }

  try {
    // Map to enum values
    const classEnum = mapClassToEnum(className)
    const sectionEnum = validateSection(section)
    const validExamType = mapExamType(examType)
    const validSubject = mapSubject(subject)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    if (!validExamType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam type. Valid types: formative-1, formative-2, formative-3, summative-1, summative-2, pre-final-1, pre-final-2, pre-final-3, final'
      })
    }

    if (!validSubject) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject. Valid subjects: telugu, mathematics, science, english, hindi, social, computers, physics, biology'
      })
    }

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      select: {
        id: true,
        rollNo: true,
        firstName: true,
        lastName: true,
        admissionNo: true
      },
      orderBy: {
        rollNo: 'asc'
      }
    })

    if (students.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          exists: false,
          totalStudents: 0,
          markedStudents: [],
          totalMarked: 0,
          canOverride: false
        }
      })
    }

    const studentIds = students.map(s => s.id)

    // Get marks for all students in this class-section for the specific exam
    const marks = await prisma.marks.findMany({
      where: {
        studentId: { in: studentIds },
        examType: validExamType
      },
      select: {
        studentId: true,
        marksData: true,
        uploadedBy: true,
      }
    })

    // Check which students have marks for the specific subject
    const markedStudents = []
    const studentIdsWithMarks = new Set()
    let uploadedBy = null
    
    marks.forEach(mark => {
      const marksData = parseMarksData(mark.marksData)
      
      if (marksData[validSubject]) {
        const student = students.find(s => s.id === mark.studentId)
        if (student) {
          markedStudents.push({
            studentId: mark.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            rollNo: student.rollNo,
            admissionNo: student.admissionNo,
            marks: marksData[validSubject].marks || 0,
            totalMarks: marksData[validSubject].totalMarks || 0,
            grade: marksData[validSubject].grade || 'NA',
            result: marksData[validSubject].result || 'NA',
            isAbsent: marksData[validSubject].isAbsent || false
          })
          studentIdsWithMarks.add(mark.studentId)
          if (!uploadedBy && mark.uploadedBy) {
            uploadedBy = mark.uploadedBy
          }
        }
      }
    })

    const exists = markedStudents.length > 0
    const canOverride = exists

    return res.status(200).json({
      success: true,
      data: {
        exists,
        canOverride,
        totalStudents: students.length,
        markedStudents,
        totalMarked: markedStudents.length,
        uploadedBy: uploadedBy,
        class: mapEnumToDisplayName(classEnum) || className,
        section: sectionEnum,
        examType: validExamType,
        subject: validSubject,
        displayClass: mapEnumToDisplayName(classEnum)
      }
    })
  } catch (error) {
    console.error('Error checking existing marks:', error)
    res.status(500).json({
      success: false,
      message: 'Error checking existing marks',
      error: error.message
    })
  }
})

/**
 * @desc    Get students without marks for specific criteria
 * @route   GET /api/marks/students/without-marks
 * @access  Private
 */
export const getStudentsWithoutMarks = asyncHandler(async (req, res) => {
  const { examType, subject, className, section } = req.query
  // Validation
  if (!examType || !subject || !className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Exam type, subject, class name, and section are required'
    })
  }

  try {
    // Map to enum values
    const classEnum = mapClassToEnum(className)
    const sectionEnum = validateSection(section)
    const validExamType = mapExamType(examType)
    const validSubject = mapSubject(subject)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    if (!validExamType || !validSubject) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam type or subject'
      })
    }

    // Get all active students for the class and section
    const allStudents = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNo: true,
        admissionNo: true
      },
      orderBy: [
        { rollNo: 'asc' },
        { firstName: 'asc' }
      ]
    })

    if (allStudents.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        message: 'No students found for this class and section'
      })
    }

    const studentIds = allStudents.map(s => s.id)

    // Get marks for these students for the specific exam
    const marks = await prisma.marks.findMany({
      where: {
        studentId: { in: studentIds },
        examType: validExamType
      },
      select: {
        studentId: true,
        marksData: true
      }
    })

    // Filter out students who already have marks for this subject
    const studentsWithoutMarks = allStudents.filter(student => {
      const studentMark = marks.find(m => m.studentId === student.id)
      if (!studentMark) return true // No marks record at all
      
      const marksData = parseMarksData(studentMark.marksData)
      return !marksData[validSubject] // Return true if no marks for this subject
    })

    return res.status(200).json({
      success: true,
      data: studentsWithoutMarks.map(student => ({
        ...student,
        displayName: `${student.firstName} ${student.lastName}`
      })),
      total: studentsWithoutMarks.length,
      totalStudents: allStudents.length,
      markedStudents: allStudents.length - studentsWithoutMarks.length,
      class: mapEnumToDisplayName(classEnum) || className,
      section: sectionEnum,
      examType: validExamType,
      subject: validSubject,
      displayClass: mapEnumToDisplayName(classEnum)
    })
  } catch (error) {
    console.error('Error getting students without marks:', error)
    res.status(500).json({
      success: false,
      message: 'Error getting students without marks',
      error: error.message
    })
  }
})

/**
 * @desc    Get students for marks upload
 * @route   GET /api/marks/students
 * @access  Private
 */
export const getStudentsForMarks = asyncHandler(async (req, res) => {
  const { className, section } = req.query
  if (!className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Class name and section are required'
    })
  }

  try {
    const classEnum = mapClassToEnum(className)
    const sectionEnum = validateSection(section)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      select: {
        id: true,
        rollNo: true,
        firstName: true,
        lastName: true,
        admissionNo: true
      },
      orderBy: [
        { rollNo: 'asc' },
        { firstName: 'asc' }
      ]
    })

    const formattedStudents = students.map(student => ({
      id: student.id,
      rollNo: student.rollNo,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo
    }))

    res.status(200).json({
      success: true,
      count: formattedStudents.length,
      data: formattedStudents,
      message: `Found ${formattedStudents.length} students in ${mapEnumToDisplayName(classEnum) || className}-${section}`
    })
  } catch (error) {
    console.error('Error fetching students for marks:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    })
  }
})

/**
 * @desc    Upload marks for students
 * @route   POST /api/marks/upload
 * @access  Private
 */
export const uploadMarks = asyncHandler(async (req, res) => {
  const {
    examType,
    subject,
    className,
    section,
    totalMarks,
    studentMarks,
    uploadedBy
  } = req.body

  // Validation
  if (!examType || !subject || !className || !section || !totalMarks || !studentMarks || !uploadedBy) {
    return res.status(400).json({
      success: false,
      message: 'Exam type, subject, class name, section, total marks, student marks, and uploadedBy are required'
    })
  }

  if (!Array.isArray(studentMarks) || studentMarks.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Student marks must be a non-empty array'
    })
  }

  try {
    // Map to enum values
    const classEnum = mapClassToEnum(className)
    const sectionEnum = validateSection(section)
    const validExamType = mapExamType(examType)
    const validSubject = mapSubject(subject)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    if (!validExamType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam type'
      })
    }

    if (!validSubject) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject'
      })
    }

    const totalMarksValue = parseFloat(totalMarks)
    if (isNaN(totalMarksValue) || totalMarksValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total marks must be a positive number'
      })
    }

    // Get all students in the class-section
    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      select: {
        id: true,
        rollNo: true,
        firstName: true,
        lastName: true
      }
    })

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found in this class-section'
      })
    }

    // Validate student IDs
    const studentIds = students.map(s => s.id)
    const invalidStudentIds = []
    const validStudentMarks = []
    
    studentMarks.forEach(sm => {
      if (!sm.studentId || !studentIds.includes(sm.studentId)) {
        invalidStudentIds.push(sm.studentId)
      } else {
        validStudentMarks.push(sm)
      }
    })

    if (invalidStudentIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid student IDs: ${invalidStudentIds.join(', ')}`
      })
    }

    // Check for existing marks for this exam
    const existingMarks = await prisma.marks.findMany({
      where: {
        studentId: { in: studentIds },
        examType: validExamType
      }
    })

    const existingMarksMap = new Map()
    existingMarks.forEach(mark => {
      existingMarksMap.set(mark.studentId, mark)
    })

    // Check if any marks already exist for this subject
    const studentsWithExistingMarks = []
    existingMarks.forEach(mark => {
      const marksData = parseMarksData(mark.marksData)
      if (marksData[validSubject]) {
        const student = students.find(s => s.id === mark.studentId)
        if (student) {
          studentsWithExistingMarks.push({
            studentId: mark.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            rollNo: student.rollNo
          })
        }
      }
    })

    if (studentsWithExistingMarks.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Marks already exist for ${studentsWithExistingMarks.length} students`,
        canOverride: true,
        data: {
          totalMarked: studentsWithExistingMarks.length,
          totalStudents: students.length,
          studentsWithMarks: studentsWithExistingMarks,
          class: mapEnumToDisplayName(classEnum) || className,
          section: sectionEnum,
          examType: validExamType,
          subject: validSubject
        }
      })
    }

    // Process marks upload
    const processedMarks = []
    const errors = []

    for (const studentMark of validStudentMarks) {
      try {
        const { studentId, marks, isAbsent = false } = studentMark
        
        let marksValue = 0
        let isAbsentValue = false
        
        if (isAbsent) {
          marksValue = 0
          isAbsentValue = true
        } else {
          marksValue = parseFloat(marks)
          if (isNaN(marksValue) || marksValue < 0 || marksValue > totalMarksValue) {
            errors.push({
              studentId,
              message: `Marks must be between 0 and ${totalMarksValue}`
            })
            continue
          }
        }

        const percentage = isAbsentValue ? 0 : ((marksValue / totalMarksValue) * 100).toFixed(2)
        const grade = calculateGrade(percentage)
        const result = calculateResult(percentage)
        const existingMark = existingMarksMap.get(studentId)

        if (existingMark) {
          // Update existing marks record
          const existingMarksData = parseMarksData(existingMark.marksData)
          
          // Add new subject marks
          existingMarksData[validSubject] = {
            marks: marksValue,
            totalMarks: totalMarksValue,
            grade,
            result,
            isAbsent: isAbsentValue
          }

          // Recalculate overall totals
          const subjects = Object.keys(existingMarksData)
          let totalObtained = 0
          let totalMaximum = 0
          
          subjects.forEach(sub => {
            const subData = existingMarksData[sub]
            totalObtained += subData.marks || 0
            totalMaximum += subData.totalMarks || 0
          })
          
          const overallPercentage = totalMaximum > 0 ? (totalObtained / totalMaximum) * 100 : 0
          const overallGrade = calculateGrade(overallPercentage)
          // FIX: Use calculateOverallResult instead of calculateResult for overall result
          const overallResult = calculateOverallResult(existingMarksData)

          await prisma.marks.update({
            where: { id: existingMark.id },
            data: {
              marksData: existingMarksData,
              totalObtained,
              totalMaximum,
              percentage: overallPercentage,
              overallGrade,
              overallResult,
              uploadedBy,
              uploadedAt: new Date()
            }
          })

          processedMarks.push({
            studentId,
            action: 'updated',
            marks: marksValue,
            isAbsent: isAbsentValue
          })
        } else {
          // Create new marks record
          const newMarksData = {
            [validSubject]: {
              marks: marksValue,
              totalMarks: totalMarksValue,
              grade,
              result,
              isAbsent: isAbsentValue
            }
          }

          await prisma.marks.create({
            data: {
              studentId,
              examType: validExamType,
              marksData: newMarksData,
              totalObtained: marksValue,
              totalMaximum: totalMarksValue,
              percentage: parseFloat(percentage),
              overallGrade: grade,
              overallResult: result, // For single subject, result is the overall result
              uploadedBy,
              uploadedAt: new Date()
            }
          })

          processedMarks.push({
            studentId,
            action: 'created',
            marks: marksValue,
            isAbsent: isAbsentValue
          })
        }
      } catch (error) {
        errors.push({
          studentId: studentMark.studentId,
          message: error.message
        })
      }
    }

    if (errors.length > 0 && processedMarks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to upload marks',
        errors
      })
    }

    const response = {
      success: true,
      data: {
        processed: processedMarks.length,
        errors: errors.length,
        totalStudents: students.length,
        class: mapEnumToDisplayName(classEnum) || className,
        section: sectionEnum,
        examType: validExamType,
        subject: validSubject,
        displayClass: mapEnumToDisplayName(classEnum)
      },
      message: `Marks uploaded for ${processedMarks.length} students`
    }

    if (errors.length > 0) {
      response.partialSuccess = true
      response.message = `Marks uploaded for ${processedMarks.length} students with ${errors.length} errors`
      response.errorDetails = errors
    }

    res.status(201).json(response)
  } catch (error) {
    console.error('Error uploading marks:', error)
    res.status(500).json({
      success: false,
      message: 'Error uploading marks',
      error: error.message
    })
  }
})

/**
 * @desc    Override existing marks
 * @route   PUT /api/marks/override
 * @access  Private
 */
export const overrideMarks = asyncHandler(async (req, res) => {
  const {
    examType,
    subject,
    className,
    section,
    totalMarks,
    studentMarks,
    uploadedBy
  } = req.body

  // Validation
  if (!examType || !subject || !className || !section || !totalMarks || !studentMarks || !uploadedBy) {
    return res.status(400).json({
      success: false,
      message: 'Exam type, subject, class name, section, total marks, student marks, and uploadedBy are required'
    })
  }

  if (!Array.isArray(studentMarks) || studentMarks.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Student marks must be a non-empty array'
    })
  }

  try {
    // Map to enum values
    const classEnum = mapClassToEnum(className)
    const sectionEnum = validateSection(section)
    const validExamType = mapExamType(examType)
    const validSubject = mapSubject(subject)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    if (!validExamType || !validSubject) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam type or subject'
      })
    }

    const totalMarksValue = parseFloat(totalMarks)
    if (isNaN(totalMarksValue) || totalMarksValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total marks must be a positive number'
      })
    }

    // Get all students in the class-section
    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      select: {
        id: true,
        rollNo: true,
        firstName: true,
        lastName: true
      }
    })

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found in this class-section'
      })
    }

    const studentIds = students.map(s => s.id)

    // Validate student IDs
    const invalidStudentIds = []
    const validStudentMarks = []
    
    studentMarks.forEach(sm => {
      if (!sm.studentId || !studentIds.includes(sm.studentId)) {
        invalidStudentIds.push(sm.studentId)
      } else {
        validStudentMarks.push(sm)
      }
    })

    if (invalidStudentIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid student IDs: ${invalidStudentIds.join(', ')}`
      })
    }

    // Start transaction for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Get existing marks for this exam
      const existingMarks = await tx.marks.findMany({
        where: {
          studentId: { in: studentIds },
          examType: validExamType
        }
      })

      const existingMarksMap = new Map()
      existingMarks.forEach(mark => {
        existingMarksMap.set(mark.studentId, mark)
      })

      // Track which students received marks in this upload
      const studentsWithMarks = new Set(validStudentMarks.map(sm => sm.studentId))
      
      // Process each student's marks
      const processedMarks = []
      
      // 1. Update or create marks for students in the upload
      for (const studentMark of validStudentMarks) {
        const { studentId, marks, isAbsent = false } = studentMark
        
        let marksValue = 0
        let isAbsentValue = false
        
        if (isAbsent) {
          marksValue = 0
          isAbsentValue = true
        } else {
          marksValue = parseFloat(marks)
          if (isNaN(marksValue) || marksValue < 0 || marksValue > totalMarksValue) {
            // Skip invalid marks but continue with others
            continue
          }
        }

        const percentage = isAbsentValue ? 0 : ((marksValue / totalMarksValue) * 100).toFixed(2)
        const grade = calculateGrade(percentage)
        const result = calculateResult(percentage)
        const existingMark = existingMarksMap.get(studentId)

        if (existingMark) {
          // Update existing marks data
          const existingMarksData = parseMarksData(existingMark.marksData)
          
          // Override the subject
          existingMarksData[validSubject] = {
            marks: marksValue,
            totalMarks: totalMarksValue,
            grade,
            result,
            isAbsent: isAbsentValue
          }

          // Recalculate overall totals
          const subjects = Object.keys(existingMarksData)
          let totalObtained = 0
          let totalMaximum = 0
          
          subjects.forEach(sub => {
            const subData = existingMarksData[sub]
            totalObtained += subData.marks || 0
            totalMaximum += subData.totalMarks || 0
          })
          
          const overallPercentage = totalMaximum > 0 ? (totalObtained / totalMaximum) * 100 : 0
          const overallGrade = calculateGrade(overallPercentage)
          // FIX: Use calculateOverallResult instead of calculateResult for overall result
          const overallResult = calculateOverallResult(existingMarksData)

          await tx.marks.update({
            where: { id: existingMark.id },
            data: {
              marksData: existingMarksData,
              totalObtained,
              totalMaximum,
              percentage: overallPercentage,
              overallGrade,
              overallResult,
              uploadedBy,
              uploadedAt: new Date()
            }
          })
        } else {
          // Create new marks record
          const newMarksData = {
            [validSubject]: {
              marks: marksValue,
              totalMarks: totalMarksValue,
              grade,
              result,
              isAbsent: isAbsentValue
            }
          }

          await tx.marks.create({
            data: {
              studentId,
              examType: validExamType,
              marksData: newMarksData,
              totalObtained: marksValue,
              totalMaximum: totalMarksValue,
              percentage: parseFloat(percentage),
              overallGrade: grade,
              overallResult: result, // For single subject, result is the overall result
              uploadedBy,
              uploadedAt: new Date()
            }
          })
        }

        processedMarks.push({
          studentId,
          marks: marksValue,
          isAbsent: isAbsentValue
        })
      }

      // 2. For students not in this upload, remove this subject from their marks if it exists
      const studentsToProcess = studentIds.filter(id => !studentsWithMarks.has(id))
      
      for (const studentId of studentsToProcess) {
        const existingMark = existingMarksMap.get(studentId)
        
        if (existingMark) {
          const existingMarksData = parseMarksData(existingMark.marksData)
          
          // Remove the subject if it exists
          if (existingMarksData[validSubject]) {
            delete existingMarksData[validSubject]
            
            // If no subjects left, delete the entire marks record
            if (Object.keys(existingMarksData).length === 0) {
              await tx.marks.delete({
                where: { id: existingMark.id }
              })
            } else {
              // Recalculate totals without this subject
              const subjects = Object.keys(existingMarksData)
              let totalObtained = 0
              let totalMaximum = 0
              
              subjects.forEach(sub => {
                const subData = existingMarksData[sub]
                totalObtained += subData.marks || 0
                totalMaximum += subData.totalMarks || 0
              })
              
              const overallPercentage = totalMaximum > 0 ? (totalObtained / totalMaximum) * 100 : 0
              const overallGrade = calculateGrade(overallPercentage)
              // FIX: Use calculateOverallResult instead of calculateResult for overall result
              const overallResult = calculateOverallResult(existingMarksData)
              
              await tx.marks.update({
                where: { id: existingMark.id },
                data: {
                  marksData: existingMarksData,
                  totalObtained,
                  totalMaximum,
                  percentage: overallPercentage,
                  overallGrade,
                  overallResult,
                  uploadedBy,
                  uploadedAt: new Date()
                }
              })
            }
          }
        }
      }

      return {
        processedCount: processedMarks.length,
        totalStudents: students.length,
        removedCount: studentsToProcess.length
      }
    }, {
      maxWait: 5000,
      timeout: 10000
    })

    res.status(200).json({
      success: true,
      data: {
        markedCount: result.processedCount,
        totalStudents: result.totalStudents,
        removedCount: result.removedCount,
        class: mapEnumToDisplayName(classEnum) || className,
        section: sectionEnum,
        examType: validExamType,
        subject: validSubject,
        displayClass: mapEnumToDisplayName(classEnum)
      },
      message: `Marks overridden for ${result.processedCount} students, removed for ${result.removedCount} students`
    })
  } catch (error) {
    console.error('Error overriding marks:', error)
    res.status(500).json({
      success: false,
      message: 'Error overriding marks',
      error: error.message
    })
  }
})

/**
 * @desc    Get marks for a specific student
 * @route   GET /api/marks/student/:studentId
 * @access  Private
 */
export const getMarksByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params
  try {
    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNo: true,
        admissionNo: true,
        class: true,
        section: true,
        isActive: true
      }
    })

    if (!student || !student.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or inactive'
      })
    }

    // Get all marks for this student
    const marks = await prisma.marks.findMany({
      where: {
        studentId: studentId
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    // Format marks data
    const formattedMarks = marks.map(mark => {
      const marksData = parseMarksData(mark.marksData)
      const subjects = Object.keys(marksData)
      
      const subjectDetails = subjects.map(subject => ({
        subject,
        ...marksData[subject]
      }))

      return {
        id: mark.id,
        examType: mark.examType,
        marksData: marksData,
        subjectDetails,
        totalObtained: mark.totalObtained,
        totalMaximum: mark.totalMaximum,
        percentage: mark.percentage,
        overallGrade: mark.overallGrade,
        overallResult: mark.overallResult,
        uploadedBy: mark.uploadedBy,
        uploadedAt: mark.uploadedAt
      }
    })

    // Calculate summary
    const totalExams = formattedMarks.length
    const totalSubjects = formattedMarks.reduce((sum, mark) => sum + mark.subjectDetails.length, 0)
    const averagePercentage = totalExams > 0 
      ? formattedMarks.reduce((sum, mark) => sum + (mark.percentage || 0), 0) / totalExams
      : 0

    res.status(200).json({
      success: true,
      data: {
        student: {
          ...student,
          displayClass: mapEnumToDisplayName(student.class)
        },
        marks: formattedMarks,
        summary: {
          totalExams,
          totalSubjects,
          averagePercentage: parseFloat(averagePercentage.toFixed(2)),
          examsWithMarks: formattedMarks.filter(m => m.totalObtained > 0).length
        }
      }
    })
  } catch (error) {
    console.error('Error fetching student marks:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching student marks',
      error: error.message
    })
  }
})

/**
 * @desc    Get marks by exam type, class, and section
 * @route   GET /api/marks/exam
 * @access  Private
 */
export const getMarksByExam = asyncHandler(async (req, res) => {
  const { examType, className, section, subject } = req.query
  if (!examType || !className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Exam type, class name, and section are required'
    })
  }

  try {
    // Map to enum values
    const classEnum = mapClassToEnum(className)
    const sectionEnum = validateSection(section)
    const validExamType = mapExamType(examType)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    if (!validExamType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam type'
      })
    }

    // Get all students in the class-section
    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      select: {
        id: true,
        rollNo: true,
        firstName: true,
        lastName: true,
        admissionNo: true
      },
      orderBy: [
        { rollNo: 'asc' },
        { firstName: 'asc' }
      ]
    })

    if (students.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        message: 'No students found for this class and section'
      })
    }

    const studentIds = students.map(s => s.id)

    // Get marks for these students and exam type
    const marks = await prisma.marks.findMany({
      where: {
        studentId: { in: studentIds },
        examType: validExamType
      }
    })

    // Combine student info with marks
    const result = students.map(student => {
      const studentMark = marks.find(m => m.studentId === student.id)
      
      if (!studentMark) {
        return {
          ...student,
          fullName: `${student.firstName} ${student.lastName}`,
          hasMarks: false,
          marksData: null,
          totalObtained: 0,
          totalMaximum: 0,
          percentage: 0,
          overallGrade: 'NA',
          overallResult: 'NA'
        }
      }

      const marksData = parseMarksData(studentMark.marksData)
      
      // Filter by subject if specified
      let filteredMarksData = marksData
      let subjectDetails = null
      
      if (subject) {
        const validSubject = mapSubject(subject)
        if (validSubject && marksData[validSubject]) {
          filteredMarksData = { [validSubject]: marksData[validSubject] }
          subjectDetails = {
            subject: validSubject,
            ...marksData[validSubject]
          }
        } else {
          filteredMarksData = {}
          subjectDetails = null
        }
      }

      return {
        ...student,
        fullName: `${student.firstName} ${student.lastName}`,
        hasMarks: true,
        marksData: filteredMarksData,
        subjectDetails,
        totalObtained: studentMark.totalObtained,
        totalMaximum: studentMark.totalMaximum,
        percentage: studentMark.percentage,
        overallGrade: studentMark.overallGrade,
        overallResult: studentMark.overallResult,
        uploadedBy: studentMark.uploadedBy,
        uploadedAt: studentMark.uploadedAt
      }
    })

    // Calculate class summary
    const studentsWithMarks = result.filter(r => r.hasMarks)
    const totalWithMarks = studentsWithMarks.length
    const totalWithoutMarks = result.length - totalWithMarks
    
    let classTotalObtained = 0
    let classTotalMaximum = 0
    
    studentsWithMarks.forEach(student => {
      classTotalObtained += student.totalObtained || 0
      classTotalMaximum += student.totalMaximum || 0
    })
    
    const classAveragePercentage = classTotalMaximum > 0 
      ? (classTotalObtained / classTotalMaximum) * 100 
      : 0

    res.status(200).json({
      success: true,
      data: {
        students: result,
        summary: {
          totalStudents: result.length,
          withMarks: totalWithMarks,
          withoutMarks: totalWithoutMarks,
          classTotalObtained,
          classTotalMaximum,
          classAveragePercentage: parseFloat(classAveragePercentage.toFixed(2))
        },
        examType: validExamType,
        class: mapEnumToDisplayName(classEnum) || className,
        section: sectionEnum,
        displayClass: mapEnumToDisplayName(classEnum)
      }
    })
  } catch (error) {
    console.error('Error fetching marks by exam:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching marks by exam',
      error: error.message
    })
  }
})

/**
 * @desc    Get student marks for specific criteria (UI-friendly format)
 * @route   GET /api/marks/student-marks
 * @access  Private
 */
export const getStudentMarks = asyncHandler(async (req, res) => {
  const { examType, subject, className, section } = req.query
  if (!examType || !subject || !className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Exam type, subject, class name, and section are required'
    })
  }

  try {
    // Map to enum values
    const classEnum = mapClassToEnum(className)
    const sectionEnum = validateSection(section)
    const validExamType = mapExamType(examType)
    const validSubject = mapSubject(subject)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    if (!validExamType || !validSubject) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam type or subject'
      })
    }

    // Get students with their marks for this exam
    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      include: {
        marks: {
          where: {
            examType: validExamType
          }
        }
      },
      orderBy: [
        { rollNo: 'asc' },
        { firstName: 'asc' }
      ]
    })

    const result = students.map(student => {
      const marksRecord = student.marks[0]
      let marksValue = null
      let totalMarks = null
      let grade = 'NA'
      let resultStatus = 'NA'
      let isAbsent = false
      let percentage = null

      if (marksRecord) {
        const marksData = parseMarksData(marksRecord.marksData)
        const subjectData = marksData[validSubject]
        
        if (subjectData) {
          marksValue = subjectData.marks || 0
          totalMarks = subjectData.totalMarks || 0
          grade = subjectData.grade || 'NA'
          resultStatus = subjectData.result || 'NA'
          isAbsent = subjectData.isAbsent || false
          percentage = totalMarks > 0 ? ((marksValue / totalMarks) * 100).toFixed(2) : '0.00'
        }
      }

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        admissionNumber: student.admissionNo,
        marks: marksValue,
        totalMarks: totalMarks,
        percentage: percentage !== null ? parseFloat(percentage) : null,
        grade,
        result: resultStatus,
        isAbsent,
        hasMarks: marksValue !== null
      }
    })

    // Calculate summary
    const studentsWithMarks = result.filter(r => r.hasMarks)
    const totalStudents = result.length
    const markedCount = studentsWithMarks.length
    
    let totalObtained = 0
    let totalMaximum = 0
    
    studentsWithMarks.forEach(student => {
      totalObtained += student.marks || 0
      totalMaximum += student.totalMarks || 0
    })
    
    const averagePercentage = totalMaximum > 0 ? (totalObtained / totalMaximum) * 100 : 0
    const averageGrade = calculateGrade(averagePercentage)

    res.status(200).json({
      success: true,
      data: {
        students: result,
        summary: {
          totalStudents,
          markedCount,
          notMarkedCount: totalStudents - markedCount,
          totalObtained,
          totalMaximum,
          averagePercentage: parseFloat(averagePercentage.toFixed(2)),
          averageGrade
        },
        examType: validExamType,
        subject: validSubject,
        class: mapEnumToDisplayName(classEnum) || className,
        section: sectionEnum,
        displayClass: mapEnumToDisplayName(classEnum)
      }
    })
  } catch (error) {
    console.error('Error fetching student marks:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching student marks',
      error: error.message
    })
  }
})

/**
 * @desc    Delete marks for a specific student and exam
 * @route   DELETE /api/marks/:studentId
 * @access  Private
 */
export const deleteMarks = asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { examType, subject } = req.body

  if (!examType) {
    return res.status(400).json({
      success: false,
      message: 'Exam type is required'
    })
  }

  try {
    // Map to enum values
    const validExamType = mapExamType(examType)
    const validSubject = subject ? mapSubject(subject) : null

    if (!validExamType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam type'
      })
    }

    // Get existing marks
    const existingMark = await prisma.marks.findFirst({
      where: {
        studentId,
        examType: validExamType
      }
    })

    if (!existingMark) {
      return res.status(404).json({
        success: false,
        message: 'No marks found for this student and exam'
      })
    }

    // Get student info for response
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNo: true,
        class: true,
        section: true
      }
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    if (validSubject) {
      // Delete specific subject marks
      const marksData = parseMarksData(existingMark.marksData)
      
      if (!marksData[validSubject]) {
        return res.status(404).json({
          success: false,
          message: `No marks found for subject ${subject}`
        })
      }

      // Remove the subject
      delete marksData[validSubject]

      if (Object.keys(marksData).length === 0) {
        // If no subjects left, delete the entire record
        await prisma.marks.delete({
          where: { id: existingMark.id }
        })
      } else {
        // Recalculate totals without this subject
        const subjects = Object.keys(marksData)
        let totalObtained = 0
        let totalMaximum = 0
        
        subjects.forEach(sub => {
          const subData = marksData[sub]
          totalObtained += subData.marks || 0
          totalMaximum += subData.totalMarks || 0
        })
        
        const overallPercentage = totalMaximum > 0 ? (totalObtained / totalMaximum) * 100 : 0
        const overallGrade = calculateGrade(overallPercentage)
        // FIX: Use calculateOverallResult instead of calculateResult for overall result
        const overallResult = calculateOverallResult(marksData)
        
        await prisma.marks.update({
          where: { id: existingMark.id },
          data: {
            marksData,
            totalObtained,
            totalMaximum,
            percentage: overallPercentage,
            overallGrade,
            overallResult,
            uploadedAt: new Date()
          }
        })
      }

      res.status(200).json({
        success: true,
        data: {
          student: {
            ...student,
            displayClass: mapEnumToDisplayName(student.class)
          },
          examType: validExamType,
          subject: validSubject
        },
        message: `Marks for subject ${subject} deleted successfully`
      })
    } else {
      // Delete entire exam marks
      await prisma.marks.delete({
        where: { id: existingMark.id }
      })

      res.status(200).json({
        success: true,
        data: {
          student: {
            ...student,
            displayClass: mapEnumToDisplayName(student.class)
          },
          examType: validExamType
        },
        message: `All marks for ${validExamType} deleted successfully`
      })
    }
  } catch (error) {
    console.error('Error deleting marks:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting marks',
      error: error.message
    })
  }
})

/**
 * @desc    Get marks summary for multiple exams
 * @route   GET /api/marks/summary
 * @access  Private
 */
export const getMarksSummary = asyncHandler(async (req, res) => {
  const { studentId, className, section } = req.query

  try {
    let whereClause = {}
    let student = null

    if (studentId) {
      // Get summary for specific student
      student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          rollNo: true,
          admissionNo: true,
          class: true,
          section: true
        }
      })

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        })
      }

      whereClause.studentId = studentId
    } else if (className && section) {
      // Get summary for class-section
      const classEnum = mapClassToEnum(className)
      const sectionEnum = validateSection(section)

      if (!classEnum || !sectionEnum) {
        return res.status(400).json({
          success: false,
          message: 'Invalid class or section'
        })
      }

      const students = await prisma.student.findMany({
        where: {
          class: classEnum,
          section: sectionEnum,
          isActive: true
        },
        select: {
          id: true
        }
      })

      if (students.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            summary: [],
            totalExams: 0,
            totalStudents: 0
          }
        })
      }

      whereClause.studentId = {
        in: students.map(s => s.id)
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either studentId or both className and section are required'
      })
    }

    // Get all marks for the criteria
    const marks = await prisma.marks.findMany({
      where: whereClause,
      orderBy: {
        examType: 'asc'
      }
    })

    // Group marks by exam type
    const summaryByExam = {}
    marks.forEach(mark => {
      if (!summaryByExam[mark.examType]) {
        summaryByExam[mark.examType] = {
          examType: mark.examType,
          totalStudents: 0,
          totalObtained: 0,
          totalMaximum: 0,
          students: []
        }
      }
      
      summaryByExam[mark.examType].totalStudents++
      summaryByExam[mark.examType].totalObtained += mark.totalObtained || 0
      summaryByExam[mark.examType].totalMaximum += mark.totalMaximum || 0
      summaryByExam[mark.examType].students.push({
        studentId: mark.studentId,
        totalObtained: mark.totalObtained,
        totalMaximum: mark.totalMaximum,
        percentage: mark.percentage,
        grade: mark.overallGrade,
        result: mark.overallResult
      })
    })

    // Calculate percentages and averages
    const summary = Object.values(summaryByExam).map(exam => {
      const averagePercentage = exam.totalMaximum > 0 
        ? (exam.totalObtained / exam.totalMaximum) * 100 
        : 0
      
      return {
        ...exam,
        averagePercentage: parseFloat(averagePercentage.toFixed(2)),
        averageGrade: calculateGrade(averagePercentage)
      }
    })

    // Overall summary
    const totalExams = summary.length
    const overallTotalObtained = summary.reduce((sum, exam) => sum + exam.totalObtained, 0)
    const overallTotalMaximum = summary.reduce((sum, exam) => sum + exam.totalMaximum, 0)
    const overallAveragePercentage = overallTotalMaximum > 0 
      ? (overallTotalObtained / overallTotalMaximum) * 100 
      : 0

    const response = {
      success: true,
      data: {
        summary,
        overall: {
          totalExams,
          totalStudents: student ? 1 : (className && section ? summary.reduce((sum, exam) => sum + exam.totalStudents, 0) / totalExams : 0),
          overallAveragePercentage: parseFloat(overallAveragePercentage.toFixed(2)),
          overallAverageGrade: calculateGrade(overallAveragePercentage)
        }
      }
    }

    if (student) {
      response.data.student = {
        ...student,
        displayClass: mapEnumToDisplayName(student.class)
      }
    } else {
      response.data.class = mapEnumToDisplayName(mapClassToEnum(className)),
      response.data.section = section
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching marks summary:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching marks summary',
      error: error.message
    })
  }
})

/**
 * @desc    Delete marks for all students in a class-section for specific exam type and subject
 * @route   DELETE /api/marks/class-section/all
 * @access  Private
 */
export const deleteMarksForClassSection = asyncHandler(async (req, res) => {
  const { examType, subject, className, section } = req.body

  // Validation
  if (!examType || !subject || !className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Exam type, subject, class name, and section are required'
    })
  }

  try {
    // Map to enum values
    const classEnum = mapClassToEnum(className)
    const sectionEnum = validateSection(section)
    const validExamType = mapExamType(examType)
    const validSubject = mapSubject(subject)

    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }

    if (!validExamType || !validSubject) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam type or subject'
      })
    }

    // Get all active students in the class-section
    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNo: true,
        admissionNo: true
      },
      orderBy: {
        rollNo: 'asc'
      }
    })

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active students found in this class-section'
      })
    }

    const studentIds = students.map(s => s.id)

    // Get existing marks for these students and exam type
    const existingMarks = await prisma.marks.findMany({
      where: {
        studentId: { in: studentIds },
        examType: validExamType
      },
      select: {
        id: true,
        studentId: true,
        marksData: true
      }
    })

    if (existingMarks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No marks found for this class-section and exam type'
      })
    }

    // Track results
    const results = {
      totalStudents: students.length,
      studentsProcessed: 0,
      marksDeleted: 0,
      marksRecordsRemoved: 0,
      marksRecordsUpdated: 0,
      studentsWithoutMarks: 0,
      studentsWithSubjectMarks: 0,
      errors: []
    }

    // Use transaction for atomic operation
    await prisma.$transaction(async (tx) => {
      for (const mark of existingMarks) {
        try {
          const marksData = parseMarksData(mark.marksData)
          
          // Check if this student has marks for the specific subject
          if (marksData[validSubject]) {
            results.studentsWithSubjectMarks++
            
            // Remove the subject from marks data
            delete marksData[validSubject]
            
            if (Object.keys(marksData).length === 0) {
              // If no subjects left, delete the entire marks record
              await tx.marks.delete({
                where: { id: mark.id }
              })
              results.marksRecordsRemoved++
            } else {
              // Recalculate totals without this subject
              const subjects = Object.keys(marksData)
              let totalObtained = 0
              let totalMaximum = 0
              
              subjects.forEach(sub => {
                const subData = marksData[sub]
                totalObtained += subData.marks || 0
                totalMaximum += subData.totalMarks || 0
              })
              
              const overallPercentage = totalMaximum > 0 ? (totalObtained / totalMaximum) * 100 : 0
              const overallGrade = calculateGrade(overallPercentage)
              // FIX: Use calculateOverallResult instead of calculateResult for overall result
              const overallResult = calculateOverallResult(marksData)
              
              await tx.marks.update({
                where: { id: mark.id },
                data: {
                  marksData,
                  totalObtained,
                  totalMaximum,
                  percentage: overallPercentage,
                  overallGrade,
                  overallResult,
                  uploadedAt: new Date()
                }
              })
              results.marksRecordsUpdated++
            }
            
            results.marksDeleted++
          } else {
            results.studentsWithoutMarks++
          }
          
          results.studentsProcessed++
        } catch (error) {
          results.errors.push({
            studentId: mark.studentId,
            message: error.message
          })
        }
      }
    }, {
      maxWait: 10000,
      timeout: 30000
    })

    // Format the response
    const response = {
      success: true,
      data: {
        summary: results,
        classSection: {
          class: mapEnumToDisplayName(classEnum) || className,
          section: sectionEnum,
          displayClass: mapEnumToDisplayName(classEnum)
        },
        examSubject: {
          examType: validExamType,
          subject: validSubject
        },
        studentsAffected: results.studentsWithSubjectMarks
      },
      message: `Deleted marks for ${results.marksDeleted} students in ${className}-${section}`
    }

    // Add detailed error info if any
    if (results.errors.length > 0) {
      response.partialSuccess = true
      response.errorDetails = results.errors
      response.message = `Deleted marks for ${results.marksDeleted} students with ${results.errors.length} errors`
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Error deleting marks for class-section:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting marks for class-section',
      error: error.message
    })
  }
})

/**
 * @desc    Batch delete marks for all students in class-section (Optimized)
 * @route   DELETE /api/marks/class-section/batch
 * @access  Private
 */
export const batchDeleteMarksForClassSection = asyncHandler(async (req, res) => {
  const { examType, subject, className, section, confirm = false } = req.body

  // Validation
  if (!examType || !subject || !className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Exam type, subject, class name, and section are required'
    })
  }

  // Require confirmation for batch delete
  if (!confirm) {
    return res.status(400).json({
      success: false,
      message: 'Confirmation required for batch delete. Set confirm=true in request body',
      requiresConfirmation: true
    })
  }

  try {
    // Map to enum values
    const classEnum = mapClassToEnum(className)
    const sectionEnum = validateSection(section)
    const validExamType = mapExamType(examType)
    const validSubject = mapSubject(subject)

    if (!classEnum || !sectionEnum || !validExamType || !validSubject) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters'
      })
    }

    // First, get the count and preview of what will be deleted
    const students = await prisma.student.findMany({
      where: {
        class: classEnum,
        section: sectionEnum,
        isActive: true
      },
      include: {
        marks: {
          where: {
            examType: validExamType
          }
        }
      }
    })

    const affectedStudents = students.filter(student => {
      if (student.marks.length === 0) return false
      
      const marksData = parseMarksData(student.marks[0].marksData)
      return marksData[validSubject] !== undefined
    })

    if (affectedStudents.length === 0) {
      return res.status(404).json({
        success: true,
        message: 'No marks found to delete',
        data: {
          totalStudents: students.length,
          affectedStudents: 0,
          preview: []
        }
      })
    }

    // Use a single transaction with optimized queries
    const results = await prisma.$transaction(async (tx) => {
      const deletedResults = {
        totalStudents: students.length,
        affectedStudents: affectedStudents.length,
        deletedCount: 0,
        updatedCount: 0,
        removedRecords: 0
      }

      // Get all marks records for these students
      const studentIds = affectedStudents.map(s => s.id)
      const marksRecords = await tx.marks.findMany({
        where: {
          studentId: { in: studentIds },
          examType: validExamType
        },
        select: {
          id: true,
          studentId: true,
          marksData: true
        }
      })

      // Process in batches for better performance
      const batchSize = 50
      const batches = []
      
      for (let i = 0; i < marksRecords.length; i += batchSize) {
        batches.push(marksRecords.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        // Process each batch
        const updatePromises = []
        const deletePromises = []
        
        for (const mark of batch) {
          const marksData = parseMarksData(mark.marksData)
          
          if (marksData[validSubject]) {
            delete marksData[validSubject]
            
            if (Object.keys(marksData).length === 0) {
              // Delete the entire record
              deletePromises.push(
                tx.marks.delete({
                  where: { id: mark.id }
                })
              )
              deletedResults.removedRecords++
            } else {
              // Recalculate and update
              const subjects = Object.keys(marksData)
              let totalObtained = 0
              let totalMaximum = 0
              
              subjects.forEach(sub => {
                const subData = marksData[sub]
                totalObtained += subData.marks || 0
                totalMaximum += subData.totalMarks || 0
              })
              
              const overallPercentage = totalMaximum > 0 ? (totalObtained / totalMaximum) * 100 : 0
              const overallGrade = calculateGrade(overallPercentage)
              // FIX: Use calculateOverallResult instead of calculateResult for overall result
              const overallResult = calculateOverallResult(marksData)
              
              updatePromises.push(
                tx.marks.update({
                  where: { id: mark.id },
                  data: {
                    marksData,
                    totalObtained,
                    totalMaximum,
                    percentage: overallPercentage,
                    overallGrade,
                    overallResult,
                    uploadedAt: new Date()
                  }
                })
              )
              deletedResults.updatedCount++
            }
            
            deletedResults.deletedCount++
          }
        }
        
        // Execute batch operations
        await Promise.all([...updatePromises, ...deletePromises])
      }
      
      return deletedResults
    }, {
      maxWait: 15000,
      timeout: 45000
    })

    // Create preview of affected students
    const preview = affectedStudents.slice(0, 10).map(student => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      rollNo: student.rollNo,
      admissionNo: student.admissionNo
    }))

    res.status(200).json({
      success: true,
      data: {
        results,
        preview: affectedStudents.length > 10 ? {
          displayed: 10,
          total: affectedStudents.length,
          students: preview
        } : {
          displayed: affectedStudents.length,
          total: affectedStudents.length,
          students: preview
        },
        classSection: {
          class: mapEnumToDisplayName(classEnum) || className,
          section: sectionEnum,
          displayClass: mapEnumToDisplayName(classEnum)
        },
        examSubject: {
          examType: validExamType,
          subject: validSubject
        }
      },
      message: `Successfully deleted marks for ${results.deletedCount} students`
    })
  } catch (error) {
    console.error('Error in batch delete marks:', error)
    
    // Provide more specific error messages
    let statusCode = 500
    let errorMessage = 'Error deleting marks in batch'
    
    if (error.code === 'P2002') {
      statusCode = 409
      errorMessage = 'Duplicate entry detected during batch operation'
    } else if (error.code === 'P2025') {
      statusCode = 404
      errorMessage = 'Record not found during batch operation'
    } else if (error.code === 'P2034') {
      statusCode = 409
      errorMessage = 'Transaction conflict occurred'
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      code: error.code
    })
  }
})