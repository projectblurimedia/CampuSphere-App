export const mapClassToEnum = (classInput) => {
  if (!classInput && classInput !== 0) return 'CLASS_1'
  
  const classStr = classInput.toString().trim().toUpperCase().replace(/\s+/g, '_')
  
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
  }
  
  return enumMap[classStr] || 'CLASS_1'
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