// Define class order from Pre Nursery to Class 12
export const classOrder = {
  'pre nursery': 1,
  'nursery': 2,
  'kg': 3,
  'lkg': 4,
  'ukg': 5,
  'prep': 6,
  '1': 7,
  '2': 8,
  '3': 9,
  '4': 10,
  '5': 11,
  '6': 12,
  '7': 13,
  '8': 14,
  '9': 15,
  '10': 16,
  '11': 17,
  '12': 18,
  'i': 15,
  'ii': 16,
  'iii': 17,
  'iv': 18,
  'v': 19,
  'vi': 20,
  'vii': 21,
  'viii': 22,
  'ix': 23,
  'x': 24,
  'xi': 25,
  'xii': 26,
}

// Academic years array
export const academicYears = [
  'All',
  '2023-2024',
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028',
]

// Function to sort classes in proper order
export const sortClassesByOrder = (fees) => {
  return [...fees].sort((a, b) => {
    const classA = (a.className || '').toString().toLowerCase().trim()
    const classB = (b.className || '').toString().toLowerCase().trim()
    
    // Extract numeric or named class
    const getClassValue = (className) => {
      // Remove non-alphanumeric characters and spaces
      const cleanClass = className.replace(/[^a-z0-9\s]/gi, '').toLowerCase().trim()
      
      // Check for pre nursery
      if (cleanClass.includes('pre') && cleanClass.includes('nursery')) return classOrder['pre nursery']
      
      // Check for nursery
      if (cleanClass.includes('nursery') && !cleanClass.includes('pre')) return classOrder['nursery']
      
      // Check for KG/LKG/UKG
      if (cleanClass.includes('kg')) {
        if (cleanClass.includes('lkg')) return classOrder['lkg']
        if (cleanClass.includes('ukg')) return classOrder['ukg']
        return classOrder['kg']
      }
      
      // Check for prep
      if (cleanClass.includes('prep')) return classOrder['prep']
      
      // Extract numeric part
      const numMatch = cleanClass.match(/\d+/)
      if (numMatch) {
        const num = parseInt(numMatch[0])
        if (num >= 1 && num <= 12) return classOrder[num.toString()]
      }
      
      // Check for roman numerals
      const romanMatch = cleanClass.match(/\b(i{1,3}|iv|v|vi{0,3}|ix|x|xi|xii)\b/i)
      if (romanMatch) {
        const roman = romanMatch[0].toLowerCase()
        if (classOrder[roman]) return classOrder[roman]
      }
      
      // Default: alphabetical
      return 100 + className.charCodeAt(0)
    }
    
    const valueA = getClassValue(classA)
    const valueB = getClassValue(classB)
    
    // First sort by order
    if (valueA !== valueB) return valueA - valueB
    
    // If same order, sort by academic year (newest first)
    const yearA = a.academicYear || ''
    const yearB = b.academicYear || ''
    return yearB.localeCompare(yearA)
  })
}