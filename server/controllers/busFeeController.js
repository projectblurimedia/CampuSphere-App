const BusFeeStructure = require('../models/BusFeeStructure')
const xlsx = require('xlsx')

// Helper function to get current user ID
const getCurrentUserId = (req) => {
  return req.user ? req.user.id : req.userId || 'system'
}

// 1. Create or update bus fee structure
exports.createOrUpdateBusFee = async (req, res) => {
  try {
    const {
      villageName,
      distance,
      feeAmount,
      vehicleType,
      academicYear,
      description
    } = req.body

    // Check if bus fee structure already exists
    const existingFee = await BusFeeStructure.findOne({
      villageName,
      academicYear
    })

    const currentUserId = getCurrentUserId(req)
    
    if (existingFee) {
      // Update existing
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined && 
            key !== 'villageName' && 
            key !== 'academicYear') {
          existingFee[key] = req.body[key]
        }
      })
      
      existingFee.updatedBy = currentUserId
      await existingFee.save()
      
      return res.status(200).json({
        success: true,
        message: 'Bus fee structure updated successfully',
        data: existingFee
      })
    } else {
      // Create new
      const busFee = new BusFeeStructure({
        villageName,
        distance,
        feeAmount,
        vehicleType: vehicleType || 'bus',
        academicYear,
        description,
        createdBy: currentUserId,
        updatedBy: currentUserId
      })

      await busFee.save()

      res.status(201).json({
        success: true,
        message: 'Bus fee structure created successfully',
        data: busFee
      })
    }
  } catch (error) {
    console.error('Error creating/updating bus fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating/updating bus fee structure',
      error: error.message
    })
  }
}

// 2. Get bus fee structure by village and academic year
exports.getBusFeeStructure = async (req, res) => {
  try {
    const { villageName, academicYear } = req.params

    const busFee = await BusFeeStructure.findOne({
      villageName: { $regex: new RegExp(villageName, 'i') },
      academicYear
    })

    if (!busFee) {
      return res.status(404).json({
        success: false,
        message: 'Bus fee structure not found'
      })
    }

    res.status(200).json({
      success: true,
      data: busFee
    })
  } catch (error) {
    console.error('Error fetching bus fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching bus fee structure',
      error: error.message
    })
  }
}

// 3. Get all bus fee structures
exports.getAllBusFeeStructures = async (req, res) => {
  try {
    const { 
      academicYear, 
      villageName, 
      isActive, 
      vehicleType,
      page = 1, 
      limit = 50 
    } = req.query

    const query = {}
    
    if (academicYear) query.academicYear = academicYear
    if (villageName) query.villageName = { $regex: new RegExp(villageName, 'i') }
    if (isActive !== undefined) query.isActive = isActive === 'true'
    if (vehicleType) query.vehicleType = vehicleType

    const skip = (page - 1) * limit
    
    const busFees = await BusFeeStructure.find(query)
      .sort({ villageName: 1, academicYear: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await BusFeeStructure.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        busFees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching bus fee structures:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching bus fee structures',
      error: error.message
    })
  }
}

// 4. Update bus fee structure
exports.updateBusFeeStructure = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const busFee = await BusFeeStructure.findById(id)
    if (!busFee) {
      return res.status(404).json({
        success: false,
        message: 'Bus fee structure not found'
      })
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== '_id' && key !== '__v') {
        busFee[key] = updateData[key]
      }
    })

    const currentUserId = getCurrentUserId(req)
    busFee.updatedBy = currentUserId
    await busFee.save()

    res.status(200).json({
      success: true,
      message: 'Bus fee structure updated successfully',
      data: busFee
    })
  } catch (error) {
    console.error('Error updating bus fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating bus fee structure',
      error: error.message
    })
  }
}

// 5. Delete bus fee structure
exports.deleteBusFeeStructure = async (req, res) => {
  try {
    const { id } = req.params

    const busFee = await BusFeeStructure.findById(id)
    if (!busFee) {
      return res.status(404).json({
        success: false,
        message: 'Bus fee structure not found'
      })
    }

    await busFee.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Bus fee structure deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting bus fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting bus fee structure',
      error: error.message
    })
  }
}

// 6. Toggle active status
exports.toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    const busFee = await BusFeeStructure.findById(id)
    if (!busFee) {
      return res.status(404).json({
        success: false,
        message: 'Bus fee structure not found'
      })
    }

    const currentUserId = getCurrentUserId(req)
    
    busFee.isActive = isActive
    busFee.updatedBy = currentUserId
    await busFee.save()

    res.status(200).json({
      success: true,
      message: `Bus fee structure ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: busFee
    })
  } catch (error) {
    console.error('Error toggling active status:', error)
    res.status(500).json({
      success: false,
      message: 'Error toggling active status',
      error: error.message
    })
  }
}

// 7. Get bus fee summary by village
exports.getBusFeeSummaryByVillage = async (req, res) => {
  try {
    const { academicYear } = req.query

    const query = { isActive: true }
    if (academicYear) query.academicYear = academicYear

    const busFees = await BusFeeStructure.find(query)
      .sort({ villageName: 1, distance: 1 })

    // Group by village
    const villageSummary = {}
    
    busFees.forEach(fee => {
      if (!villageSummary[fee.villageName]) {
        villageSummary[fee.villageName] = {
          villageName: fee.villageName,
          entries: [],
          totalEntries: 0,
          minFee: fee.feeAmount,
          maxFee: fee.feeAmount,
          averageFee: fee.feeAmount,
          totalDistance: fee.distance
        }
      }
      
      villageSummary[fee.villageName].entries.push({
        distance: fee.distance,
        feeAmount: fee.feeAmount,
        vehicleType: fee.vehicleType,
        description: fee.description
      })
      
      villageSummary[fee.villageName].totalEntries++
      villageSummary[fee.villageName].minFee = Math.min(villageSummary[fee.villageName].minFee, fee.feeAmount)
      villageSummary[fee.villageName].maxFee = Math.max(villageSummary[fee.villageName].maxFee, fee.feeAmount)
      villageSummary[fee.villageName].totalDistance += fee.distance
    })

    // Calculate averages
    Object.keys(villageSummary).forEach(village => {
      const villageData = villageSummary[village]
      villageData.averageFee = (villageData.entries.reduce((sum, entry) => sum + entry.feeAmount, 0) / villageData.totalEntries).toFixed(2)
      villageData.averageDistance = (villageData.totalDistance / villageData.totalEntries).toFixed(2)
    })

    const summaryArray = Object.values(villageSummary)

    res.status(200).json({
      success: true,
      data: {
        summary: summaryArray,
        totals: {
          totalVillages: summaryArray.length,
          totalEntries: summaryArray.reduce((sum, village) => sum + village.totalEntries, 0)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching bus fee summary:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching bus fee summary',
      error: error.message
    })
  }
}

// 8. Search bus fees by village name
exports.searchBusFees = async (req, res) => {
  try {
    const { villageName, academicYear } = req.query

    if (!villageName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide village name for search'
      })
    }

    const query = { isActive: true }
    query.villageName = { $regex: new RegExp(villageName, 'i') }
    
    if (academicYear) {
      query.academicYear = academicYear
    }

    const busFees = await BusFeeStructure.find(query)
      .sort({ villageName: 1 })
      .limit(100)

    res.status(200).json({
      success: true,
      data: {
        busFees,
        count: busFees.length
      }
    })
  } catch (error) {
    console.error('Error searching bus fees:', error)
    res.status(500).json({
      success: false,
      message: 'Error searching bus fees',
      error: error.message
    })
  }
}

// 9. Bulk upload bus fees from Excel
exports.bulkUploadBusFees = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty'
      })
    }

    const currentUserId = getCurrentUserId(req)
    const results = {
      created: 0,
      updated: 0,
      errors: [],
      skipped: 0
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // Excel rows start from 1, header is row 1
      
      try {
        // Validate required fields
        const requiredFields = ['villageName', 'distance', 'feeAmount', 'academicYear']
        const missingFields = requiredFields.filter(field => !row[field] && row[field] !== 0)
        
        if (missingFields.length > 0) {
          results.errors.push({
            row: rowNumber,
            message: `Missing required fields: ${missingFields.join(', ')}`
          })
          results.skipped++
          continue
        }

        // Validate numeric fields
        if (isNaN(row.distance) || parseFloat(row.distance) <= 0) {
          results.errors.push({
            row: rowNumber,
            message: 'Distance must be a positive number'
          })
          results.skipped++
          continue
        }

        if (isNaN(row.feeAmount) || parseFloat(row.feeAmount) <= 0) {
          results.errors.push({
            row: rowNumber,
            message: 'Fee amount must be a positive number'
          })
          results.skipped++
          continue
        }

        // Validate vehicle type
        const validVehicleTypes = ['bus', 'van', 'auto', 'other']
        const vehicleType = row.vehicleType || 'bus'
        if (!validVehicleTypes.includes(vehicleType.toLowerCase())) {
          results.errors.push({
            row: rowNumber,
            message: `Invalid vehicle type. Must be one of: ${validVehicleTypes.join(', ')}`
          })
          results.skipped++
          continue
        }

        // Check if exists
        const existingFee = await BusFeeStructure.findOne({
          villageName: row.villageName.trim(),
          academicYear: row.academicYear
        })

        if (existingFee) {
          // Update existing
          existingFee.distance = parseFloat(row.distance)
          existingFee.feeAmount = parseFloat(row.feeAmount)
          existingFee.vehicleType = vehicleType.toLowerCase()
          existingFee.description = row.description || existingFee.description
          existingFee.updatedBy = currentUserId
          await existingFee.save()
          results.updated++
        } else {
          // Create new
          const busFee = new BusFeeStructure({
            villageName: row.villageName.trim(),
            distance: parseFloat(row.distance),
            feeAmount: parseFloat(row.feeAmount),
            vehicleType: vehicleType.toLowerCase(),
            academicYear: row.academicYear,
            description: row.description || '',
            createdBy: currentUserId,
            updatedBy: currentUserId
          })
          await busFee.save()
          results.created++
        }
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          message: error.message
        })
        results.skipped++
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk upload completed',
      data: results
    })
  } catch (error) {
    console.error('Error in bulk upload:', error)
    res.status(500).json({
      success: false,
      message: 'Error processing bulk upload',
      error: error.message
    })
  }
}

// 10. Download bus fees template
exports.downloadBusFeesTemplate = async (req, res) => {
  try {
    // Create sample data for template
    const sampleData = [
      {
        villageName: 'Sample Village 1',
        distance: '5',
        feeAmount: '2000',
        vehicleType: 'bus',
        academicYear: '2024-2025',
        description: 'Sample bus route'
      },
      {
        villageName: 'Sample Village 2',
        distance: '8',
        feeAmount: '2500',
        vehicleType: 'van',
        academicYear: '2024-2025',
        description: 'Another route'
      }
    ]

    // Create workbook
    const workbook = xlsx.utils.book_new()
    const worksheet = xlsx.utils.json_to_sheet(sampleData)
    
    // Add headers style (optional)
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4F81BD' } }
    }

    xlsx.utils.book_append_sheet(workbook, worksheet, 'BusFeesTemplate')

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=bus_fees_template.xlsx')

    res.send(buffer)
  } catch (error) {
    console.error('Error generating template:', error)
    res.status(500).json({
      success: false,
      message: 'Error generating template',
      error: error.message
    })
  }
}