const ClassFeeStructure = require('../models/ClassFeeStructure')
const BusFeeStructure = require('../models/BusFeeStructure')
const HostelFeeStructure = require('../models/HostelFeeStructure')

// Class mapping utility
const classMappings = {
  // Numeric to String (for lookup)
  0: 'Pre Nursery' || 'Pre-Nursery',
  0.25: 'Nursery',
  0.5: 'LKG',
  0.75: 'UKG',
  1: '1', 2: '2', 3: '3', 4: '4', 5: '5',
  6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: '11', 12: '12'
}

// String to display name
const displayClassMappings = {
  0: 'Pre Nursery',
  0.25: 'Nursery',
  0.5: 'L.K.G',
  0.75: 'U.K.G',
  1: '1', 2: '2', 3: '3', 4: '4', 5: '5',
  6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: '11', 12: '12'
}

// Convert numeric class to string for fee structure lookup
const getClassNameForFeeLookup = (classNum) => {
  const num = Number(classNum)
  if (num === 0) return 'Pre Nursery'
  if (num === 0.25) return 'Nursery'
  if (num === 0.5) return 'LKG'
  if (num === 0.75) return 'UKG'
  if (num >= 1 && num <= 12) return num.toString()
  return num.toString()
}

// Convert numeric class to display name
const getDisplayClassName = (classNum) => {
  const num = Number(classNum)
  return displayClassMappings[num] || `Class ${num}`
}

// Calculate fee with discount applied
const calculateDiscountedFee = (baseFee, discountPercentage) => {
  const discount = discountPercentage || 0
  const discountAmount = baseFee * (discount / 100)
  return Math.round(baseFee - discountAmount)
}

// Get class fee structure
const getClassFeeStructure = async (className, academicYear) => {
  try {
    const feeStructure = await ClassFeeStructure.findOne({
      className: className,
      academicYear: academicYear,
      isActive: true
    })
    
    if (!feeStructure) {
      // Return default fee structure if not found
      console.warn(`No fee structure found for class ${className}, academic year ${academicYear}. Using defaults.`)
      return {
        totalAnnualFee: 50000, // Default annual fee
        totalTerms: 3,
        tuitionFee: 40000,
        examFee: 5000,
        activityFee: 3000,
        libraryFee: 1000,
        sportsFee: 1000,
        otherCharges: 0
      }
    }
    
    return feeStructure
  } catch (error) {
    console.error('Error fetching class fee structure:', error)
    throw error
  }
}

// Get bus fee structure
const getBusFeeStructure = async (villageName, academicYear) => {
  try {
    if (!villageName) {
      return {
        feeAmount: 10000, // Default transport fee
        distance: 0,
        vehicleType: 'bus'
      }
    }
    
    const busFeeStructure = await BusFeeStructure.findOne({
      $or: [
        { villageName: { $regex: new RegExp(`^${villageName.trim()}$`, 'i') } },
        { villageName: { $regex: new RegExp(villageName.trim(), 'i') } }
      ],
      academicYear: academicYear,
      isActive: true
    })
    
    if (!busFeeStructure) {
      console.warn(`No bus fee structure found for village ${villageName}. Using default.`)
      return {
        feeAmount: 10000, // Default transport fee
        distance: 0,
        vehicleType: 'bus'
      }
    }
    
    return busFeeStructure
  } catch (error) {
    console.error('Error fetching bus fee structure:', error)
    // Return default on error
    return {
      feeAmount: 10000,
      distance: 0,
      vehicleType: 'bus'
    }
  }
}

// Get hostel fee structure
const getHostelFeeStructure = async (className, academicYear) => {
  try {
    const hostelFeeStructure = await HostelFeeStructure.findOne({
      className: className,
      academicYear: academicYear,
      isActive: true
    })
    
    if (!hostelFeeStructure) {
      console.warn(`No hostel fee structure found for class ${className}. Using defaults.`)
      return {
        totalAnnualFee: 80000, // Default hostel fee
        totalTerms: 3
      }
    }
    
    return hostelFeeStructure
  } catch (error) {
    console.error('Error fetching hostel fee structure:', error)
    throw error
  }
}

// Main function to calculate all fees for a student
const calculateStudentFees = async (studentData) => {
  const {
    class: classNum,
    academicYear,
    village,
    isUsingSchoolTransport = false,
    studentType = 'Day Scholar',
    schoolFeeDiscount = 0,
    transportFeeDiscount = 0,
    hostelFeeDiscount = 0
  } = studentData
  
  // Get class name for fee lookup
  const className = getClassNameForFeeLookup(classNum)
  const displayClassName = getDisplayClassName(classNum)
  
  // Initialize fee components
  let schoolFee = 0
  let transportFee = 0
  let hostelFee = 0
  let feeBreakdown = {}
    let totalTerms = 3 
  
  try {
    // 1. Calculate School Fee
    const classFeeStructure = await getClassFeeStructure(className, academicYear)
    const baseSchoolFee = classFeeStructure.totalAnnualFee

    totalTerms = classFeeStructure.totalTerms || 3
    
    // Apply school fee discount
    schoolFee = calculateDiscountedFee(baseSchoolFee, schoolFeeDiscount)
    
    // Store fee breakdown
    feeBreakdown.schoolFee = {
      baseAmount: baseSchoolFee,
      discountPercentage: schoolFeeDiscount,
      discountedAmount: schoolFee,
      components: {
        tuitionFee: classFeeStructure.tuitionFee || 0,
        examFee: classFeeStructure.examFee || 0,
        activityFee: classFeeStructure.activityFee || 0,
        libraryFee: classFeeStructure.libraryFee || 0,
        sportsFee: classFeeStructure.sportsFee || 0,
        labFee: classFeeStructure.labFee || 0,
        computerFee: classFeeStructure.computerFee || 0,
        otherCharges: classFeeStructure.otherCharges || 0
      },
      totalTerms: totalTerms,
      termAmount: classFeeStructure.termAmount || Math.round(classFeeStructure.totalAnnualFee / classFeeStructure.totalTerms)
    }
    
    // 2. Calculate Transport Fee (if using transport)
    if (isUsingSchoolTransport) {
      const busFeeStructure = await getBusFeeStructure(village, academicYear)
      const baseTransportFee = busFeeStructure.feeAmount
      
      // Apply transport fee discount
      transportFee = calculateDiscountedFee(baseTransportFee, transportFeeDiscount)
      
      feeBreakdown.transportFee = {
        baseAmount: baseTransportFee,
        discountPercentage: transportFeeDiscount,
        discountedAmount: transportFee,
        village: village || 'Default',
        distance: busFeeStructure.distance || 0,
        vehicleType: busFeeStructure.vehicleType || 'bus',
        totalTerms: 3, // Default terms for transport
        termAmount: Math.round(transportFee / 3)
      }
    }
    
    // 3. Calculate Hostel Fee (if hosteller)
    if (studentType === 'Hosteller') {
      const hostelFeeStructure = await getHostelFeeStructure(className, academicYear)
      const baseHostelFee = hostelFeeStructure.totalAnnualFee
      
      // Apply hostel fee discount
      hostelFee = calculateDiscountedFee(baseHostelFee, hostelFeeDiscount)
      
      feeBreakdown.hostelFee = {
        baseAmount: baseHostelFee,
        discountPercentage: hostelFeeDiscount,
        discountedAmount: hostelFee,
        totalTerms: hostelFeeStructure.totalTerms,
        termAmount: hostelFeeStructure.termAmount || Math.round(hostelFeeStructure.totalAnnualFee / hostelFeeStructure.totalTerms)
      }
    }
    
    // Calculate total fee
    const totalFee = schoolFee + transportFee + hostelFee
    
    return {
      success: true,
      schoolFee,
      transportFee,
      hostelFee,
      totalFee,
      totalTerms,
      feeBreakdown,
      details: {
        className: displayClassName,
        academicYear,
        studentType,
        usesTransport: isUsingSchoolTransport,
        village: village || 'Not specified'
      }
    }
    
  } catch (error) {
    console.error('Error calculating student fees:', error)
    // Return default fees in case of error
    return {
      success: false,
      error: error.message,
      schoolFee: calculateDiscountedFee(50000, schoolFeeDiscount),
      transportFee: isUsingSchoolTransport ? calculateDiscountedFee(10000, transportFeeDiscount) : 0,
      hostelFee: studentType === 'Hosteller' ? calculateDiscountedFee(80000, hostelFeeDiscount) : 0,
      totalterms: 3,
      totalFee: 0, // Will be calculated
      feeBreakdown: {},
      details: {
        className: displayClassName,
        academicYear,
        studentType,
        usesTransport: isUsingSchoolTransport,
        village: village || 'Not specified',
        note: 'Using default fees due to calculation error'
      }
    }
  }
}

module.exports = {
  classMappings,
  displayClassMappings,
  getClassNameForFeeLookup,
  getDisplayClassName,
  calculateDiscountedFee,
  getClassFeeStructure,
  getBusFeeStructure,
  getHostelFeeStructure,
  calculateStudentFees
}