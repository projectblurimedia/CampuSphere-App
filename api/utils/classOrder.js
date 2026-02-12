// utils/classOrder.js
export const CLASS_ORDER = [
  'PRE_NURSERY', // 0 - Pre-Nursery
  'NURSERY',     // 1 - Nursery
  'LKG',         // 2 - LKG
  'UKG',         // 3 - UKG
  'CLASS_1',     // 4 - Class 1
  'CLASS_2',     // 5 - Class 2
  'CLASS_3',     // 6 - Class 3
  'CLASS_4',     // 7 - Class 4
  'CLASS_5',     // 8 - Class 5
  'CLASS_6',     // 9 - Class 6
  'CLASS_7',     // 10 - Class 7
  'CLASS_8',     // 11 - Class 8
  'CLASS_9',     // 12 - Class 9
  'CLASS_10',    // 13 - Class 10
  'CLASS_11',    // 14 - Class 11
  'CLASS_12'     // 15 - Class 12
]

export const getClassIndex = (className) => {
  return CLASS_ORDER.indexOf(className)
}

export const sortClassesByOrder = (classes, order = 'asc') => {
  return [...classes].sort((a, b) => {
    const indexA = CLASS_ORDER.indexOf(a.className)
    const indexB = CLASS_ORDER.indexOf(b.className)
    
    if (indexA === -1) return order === 'asc' ? 1 : -1
    if (indexB === -1) return order === 'asc' ? -1 : 1
    
    return order === 'asc' ? indexA - indexB : indexB - indexA
  })
}