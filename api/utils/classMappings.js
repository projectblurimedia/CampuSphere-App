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
    '11': 'CLASS_11',
    '12': 'CLASS_12',
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
    'CLASS 11': 'CLASS_11',
    'CLASS 12': 'CLASS_12',
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
    'CLASS_11': 'Class 11',
    'CLASS_12': 'Class 12',
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