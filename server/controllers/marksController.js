const Student = require('../models/Student')
const asyncHandler = require('express-async-handler')

const getStudentsForMarks = asyncHandler(async (req, res) => {
  const { className, section, academicYear } = req.query

  if (!className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Class name and section are required'
    })
  }

  try {
    const students = await Student.getStudentsForMarks(className, section, academicYear)

    res.status(200).json({
      success: true,
      data: students
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch students'
    })
  }
})

const checkMarksExist = asyncHandler(async (req, res) => {
  const { examType, subject, className, section, academicYear } = req.query

  if (!examType || !subject || !className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Exam type, subject, class name and section are required'
    })
  }

  try {
    const result = await Student.checkMarksExist(className, section, examType, subject, academicYear)

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check marks'
    })
  }
})

const uploadMarks = asyncHandler(async (req, res) => {
  const { 
    examType, 
    customExamName,
    subject, 
    className, 
    section, 
    academicYear, 
    totalMarks, 
    studentMarks,
    passingPercentage = 35
  } = req.body

  if (!examType || !subject || !className || !section || !totalMarks || !studentMarks || !Array.isArray(studentMarks)) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required and studentMarks must be an array'
    })
  }

  const totalMarksNum = parseFloat(totalMarks)
  if (isNaN(totalMarksNum) || totalMarksNum <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Total marks must be a positive number'
    })
  }

  const passingPercentageNum = parseFloat(passingPercentage)
  if (isNaN(passingPercentageNum) || passingPercentageNum < 0 || passingPercentageNum > 100) {
    return res.status(400).json({
      success: false,
      message: 'Passing percentage must be between 0 and 100'
    })
  }

  for (const student of studentMarks) {
    if (!student.studentId || student.marks === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Each student must have studentId and marks'
      })
    }
    
    const marksNum = parseFloat(student.marks)
    if (isNaN(marksNum) || marksNum < 0 || marksNum > totalMarksNum) {
      return res.status(400).json({
        success: false,
        message: `Invalid marks for student ${student.studentId}`
      })
    }
  }

  try {
    const existingMarks = await Student.checkMarksExist(className, section, examType, subject, academicYear)

    if (existingMarks.exists && existingMarks.totalMarked > 0) {
      return res.status(409).json({
        success: false,
        message: 'Marks already exist for this exam and subject',
        canOverride: true,
        data: {
          totalMarked: existingMarks.totalMarked,
          totalStudents: existingMarks.totalStudents,
          passCount: existingMarks.markedStudents.filter(s => s.result === 'Pass').length,
          failCount: existingMarks.markedStudents.filter(s => s.result === 'Fail').length
        }
      })
    }

    const uploadedBy = req.user?.name || req.user?.email || 'System'
    
    const result = await Student.uploadClassMarks({
      examType,
      customExamName,
      subject,
      className,
      section,
      academicYear,
      totalMarks: totalMarksNum,
      passingPercentage: passingPercentageNum,
      studentMarks,
      uploadedBy
    })

    res.status(200).json({
      success: true,
      message: `Marks uploaded successfully for ${result.markedCount} students`,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload marks'
    })
  }
})

const overrideMarks = asyncHandler(async (req, res) => {
  const { 
    examType, 
    customExamName,
    subject, 
    className, 
    section, 
    academicYear, 
    totalMarks, 
    studentMarks,
    passingPercentage = 35
  } = req.body

  if (!examType || !subject || !className || !section || !totalMarks || !studentMarks || !Array.isArray(studentMarks)) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required and studentMarks must be an array'
    })
  }

  const totalMarksNum = parseFloat(totalMarks)
  if (isNaN(totalMarksNum) || totalMarksNum <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Total marks must be a positive number'
    })
  }

  const passingPercentageNum = parseFloat(passingPercentage)
  if (isNaN(passingPercentageNum) || passingPercentageNum < 0 || passingPercentageNum > 100) {
    return res.status(400).json({
      success: false,
      message: 'Passing percentage must be between 0 and 100'
    })
  }

  for (const student of studentMarks) {
    if (!student.studentId || student.marks === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Each student must have studentId and marks'
      })
    }
    
    const marksNum = parseFloat(student.marks)
    if (isNaN(marksNum) || marksNum < 0 || marksNum > totalMarksNum) {
      return res.status(400).json({
        success: false,
        message: `Invalid marks for student ${student.studentId}`
      })
    }
  }

  try {
    const uploadedBy = req.user?.name || req.user?.email || 'System'
    
    const result = await Student.overrideClassMarks({
      examType,
      customExamName,
      subject,
      className,
      section,
      academicYear,
      totalMarks: totalMarksNum,
      passingPercentage: passingPercentageNum,
      studentMarks,
      uploadedBy
    })

    res.status(200).json({
      success: true,
      message: `Marks overridden successfully for ${result.markedCount} students`,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to override marks'
    })
  }
})

const getMarksSummary = asyncHandler(async (req, res) => {
  const { examType, subject, className, section, academicYear } = req.query

  if (!examType || !subject || !className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Exam type, subject, class name and section are required'
    })
  }

  try {
    const result = await Student.getClassMarksSummary(className, section, examType, subject, academicYear)

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch marks summary'
    })
  }
})

const getStudentMarks = asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { examType, subject, academicYear } = req.query

  try {
    const student = await Student.findById(studentId)

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    let marksData = null

    if (examType && subject) {
      marksData = student.getMarksForExam(examType, subject)
    } else if (subject) {
      marksData = student.getSubjectMarks(subject)
    } else {
      marksData = student.getAllMarks()
    }

    const subjectPerformance = student.getSubjectPerformance()

    res.status(200).json({
      success: true,
      data: {
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        admissionNo: student.admissionNo,
        class: student.class,
        section: student.section,
        academicYear: student.academicYear,
        marks: marksData,
        subjectPerformance
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student marks'
    })
  }
})

const getClassMarksReport = asyncHandler(async (req, res) => {
  const { className, section, examType, subject, academicYear } = req.query

  if (!className || !section || !examType || !subject) {
    return res.status(400).json({
      success: false,
      message: 'Class name, section, exam type and subject are required'
    })
  }

  try {
    const result = await Student.getClassMarksSummary(className, section, examType, subject, academicYear)

    if (!result || !result.marksDetails) {
      return res.status(404).json({
        success: false,
        message: 'No marks found for the specified criteria'
      })
    }

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate marks report'
    })
  }
})

const getClassSubjectPerformance = asyncHandler(async (req, res) => {
  const { className, section, academicYear } = req.query

  if (!className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Class name and section are required'
    })
  }

  try {
    const performanceReport = await Student.getClassSubjectPerformance(className, section, academicYear)

    res.status(200).json({
      success: true,
      data: performanceReport
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subject performance'
    })
  }
})

const getStudentPerformance = asyncHandler(async (req, res) => {
  const { studentId } = req.params

  try {
    const student = await Student.findById(studentId)

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    const subjectPerformance = student.getSubjectPerformance()

    let totalSubjects = subjectPerformance.length
    let passedSubjects = subjectPerformance.filter(s => s.overallStatus === 'Pass').length
    let borderlineSubjects = subjectPerformance.filter(s => s.overallStatus === 'Borderline').length
    let failedSubjects = subjectPerformance.filter(s => s.overallStatus === 'Fail').length

    const overallPerformance = {
      totalSubjects,
      passedSubjects,
      borderlineSubjects,
      failedSubjects,
      passPercentage: totalSubjects > 0 ? ((passedSubjects / totalSubjects) * 100).toFixed(2) : 0,
      overallStatus: failedSubjects > 0 ? 'Needs Improvement' : 'Good'
    }

    res.status(200).json({
      success: true,
      data: {
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        class: student.class,
        section: student.section,
        subjectPerformance,
        overallPerformance
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student performance'
    })
  }
})

module.exports = {
  getStudentsForMarks,
  checkMarksExist,
  uploadMarks,
  overrideMarks,
  getMarksSummary,
  getStudentMarks,
  getClassMarksReport,
  getClassSubjectPerformance,
  getStudentPerformance
}