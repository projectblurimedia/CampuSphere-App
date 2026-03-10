export const mapClassToEnum = (classInput) => {
  if (!classInput && classInput !== 0 && classInput !== '0') return null
  
  const classStr = classInput.toString().trim()
  
  // Direct mapping for CLASS_X format
  if (classStr.toUpperCase().startsWith('CLASS_')) {
    return classStr.toUpperCase()
  }
  
  // Handle numeric values and other formats
  const upperStr = classStr.toUpperCase()
  
  const enumMap = {
    'PRE_NURSERY': 'PRE_NURSERY',
    'PRE-NURSERY': 'PRE_NURSERY',
    'NURSERY': 'NURSERY',
    'LKG': 'LKG',
    'UKG': 'UKG',
    '1': 'CLASS_1',
    '2': 'CLASS_2',
    '3': 'CLASS_3',
    '4': 'CLASS_4',
    '5': 'CLASS_5',
    '6': 'CLASS_6',
    '7': 'CLASS_7',
    '8': 'CLASS_8',
    '9': 'CLASS_9',
    '10': 'CLASS_10',
    'CLASS 1': 'CLASS_1',
    'CLASS 2': 'CLASS_2',
    'CLASS 3': 'CLASS_3',
    'CLASS 4': 'CLASS_4',
    'CLASS 5': 'CLASS_5',
    'CLASS 6': 'CLASS_6',
    'CLASS 7': 'CLASS_7',
    'CLASS 8': 'CLASS_8',
    'CLASS 9': 'CLASS_9',
    'CLASS 10': 'CLASS_10',
  }
  
  return enumMap[upperStr] || null
}

export const mapEnumToDisplayName = (classEnum) => {
  if (!classEnum) return null
  
  const displayMap = {
    'PRE_NURSERY': 'Pre-Nursery',
    'NURSERY': 'Nursery',
    'LKG': 'LKG',
    'UKG': 'UKG',
    'CLASS_1': 'Class 1',
    'CLASS_2': 'Class 2',
    'CLASS_3': 'Class 3',
    'CLASS_4': 'Class 4',
    'CLASS_5': 'Class 5',
    'CLASS_6': 'Class 6',
    'CLASS_7': 'Class 7',
    'CLASS_8': 'Class 8',
    'CLASS_9': 'Class 9',
    'CLASS_10': 'Class 10',
  }
  
  return displayMap[classEnum] || `Class ${classEnum}`
}

export const addDisplayClassToStudent = (student) => {
  if (!student) return student
  
  const studentObj = typeof student === 'object' ? student : {}
  studentObj.displayClass = mapEnumToDisplayName(studentObj.class)
  
  return studentObj
}

export const addDisplayClassToStudents = (students) => {
  if (!Array.isArray(students)) return students
  
  return students.map(student => addDisplayClassToStudent(student))
}

export const parseDiscount = (value) => {
  if (!value && value !== 0) return 0
  const num = parseFloat(value)
  return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 100)
}

export const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  const cleaned = phone.toString().replace(/\D/g, '')
  return cleaned.substring(0, 10)
}

export const validateSection = (sectionInput) => {
  if (!sectionInput) return null
  
  const sectionStr = sectionInput.toString().trim().toUpperCase()
  const validSections = ['A', 'B', 'C', 'D', 'E']
  
  return validSections.includes(sectionStr) ? sectionStr : null
}

export const validatePhoneNumber = (phone) => {
  if (!phone) return false
  const cleanPhone = phone.toString().replace(/\D/g, '')
  return /^[0-9]{10}$/.test(cleanPhone)
}


// Add exam type mapping helper
export const mapExamType = (examType) => {
  if (!examType) return null
  
  const typeStr = examType.toString().trim().toLowerCase()
  
  const examTypeMap = {
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
  
  return examTypeMap[typeStr] || null
}

// Add subject mapping helper
export const mapSubject = (subject) => {
  if (!subject) return null
  
  const subjectStr = subject.toString().trim().toLowerCase()
  
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
  
  return subjectMap[subjectStr] || null
}

// Add helper to get display names for enums
export const getExamTypeDisplayName = (examType) => {
  if (!examType) return null
  
  const examTypeStr = examType.toString()
  
  const displayMap = {
    'FORMATIVE_1': 'Formative 1',
    'FORMATIVE_2': 'Formative 2',
    'FORMATIVE_3': 'Formative 3',
    'SUMMATIVE_1': 'Summative 1',
    'SUMMATIVE_2': 'Summative 2',
    'PRE_FINAL_1': 'Pre-Final 1',
    'PRE_FINAL_2': 'Pre-Final 2',
    'PRE_FINAL_3': 'Pre-Final 3',
    'FINAL': 'Final'
  }
  
  return displayMap[examTypeStr] || examTypeStr
}

export const getSubjectDisplayName = (subject) => {
  if (!subject) return null
  
  const subjectStr = subject.toString()
  
  const displayMap = {
    'TELUGU': 'Telugu',
    'MATHEMATICS': 'Mathematics',
    'SCIENCE': 'Science',
    'ENGLISH': 'English',
    'HINDI': 'Hindi',
    'SOCIAL': 'Social Studies',
    'COMPUTERS': 'Computers',
    'PHYSICS': 'Physics',
    'BIOLOGY': 'Biology'
  }
  
  return displayMap[subjectStr] || subjectStr
}

export const classOrderMap = {
  'Pre-Nursery': 1,
  'Nursery': 2,
  'LKG': 3,
  'UKG': 4,
  '1': 5,
  '2': 6,
  '3': 7,
  '4': 8,
  '5': 9,
  '6': 10,
  '7': 11,
  '8': 12,
  '9': 13,
  '10': 14,
  '11': 15,
  '12': 16,
  'I': 5,
  'II': 6,
  'III': 7,
  'IV': 8,
  'V': 9,
  'VI': 10,
  'VII': 11,
  'VIII': 12,
  'IX': 13,
  'X': 14,
}

export function getClassOrder(className) {
  return classOrderMap[className] || 999
}


// Add this to your existing classMappings.js file

/**
 * Get the next class in sequence for promotion
 * @param {string} currentClass - Current class enum value
 * @returns {string|null} - Next class enum value or null if graduated
 */
export const getNextClass = (currentClass) => {
  const classOrder = [
    'PRE_NURSERY',
    'NURSERY',
    'LKG',
    'UKG',
    'CLASS_1',
    'CLASS_2',
    'CLASS_3',
    'CLASS_4',
    'CLASS_5',
    'CLASS_6',
    'CLASS_7',
    'CLASS_8',
    'CLASS_9',
    'CLASS_10',
  ]

  const currentIndex = classOrder.indexOf(currentClass)
  
  if (currentIndex === -1) return null
  if (currentIndex === classOrder.length - 1) return 'GRADUATED'
  
  return classOrder[currentIndex + 1]
}

export const getPreviousClass = (currentClass) => {
  const classOrder = [
    'PRE_NURSERY',
    'NURSERY',
    'LKG',
    'UKG',
    'CLASS_1',
    'CLASS_2',
    'CLASS_3',
    'CLASS_4',
    'CLASS_5',
    'CLASS_6',
    'CLASS_7',
    'CLASS_8',
    'CLASS_9',
    'CLASS_10',
  ]

  const currentIndex = classOrder.indexOf(currentClass)
  if (currentIndex === -1) return null
  if (currentIndex === 0) return null // Cannot demote from Pre-Nursery
  
  return classOrder[currentIndex - 1]
}

/**
 * Get academic year string based on current date
 * @returns {string} - Academic year in format "2025-2026"
 */
export const getCurrentAcademicYear = () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12
  
  // Academic year typically starts in June (month 6)
  // If current month is >= 6, academic year is currentYear - (currentYear+1)
  // If current month is < 6, academic year is (currentYear-1) - currentYear
  if (currentMonth >= 6) {
    return `${currentYear}-${currentYear + 1}`
  } else {
    return `${currentYear - 1}-${currentYear}`
  }
}