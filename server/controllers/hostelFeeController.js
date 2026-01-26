const HostelFeeStructure = require('../models/HostelFeeStructure')
const xlsx = require('xlsx')

// Helper function to get current user ID
const getCurrentUserId = (req) => {
  return req.user ? req.user.id : req.userId || 'system'
}

// 1. Create or update hostel fee structure
exports.createOrUpdateHostelFee = async (req, res) => {
  try {
    const {
      academicYear,
      className,
      totalAnnualFee,
      totalTerms,
      description
    } = req.body

    // Check if hostel fee structure already exists
    const existingFee = await HostelFeeStructure.findOne({
      academicYear,
      className
    })

    const currentUserId = getCurrentUserId(req)
    
    if (existingFee) {
      // Update existing
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined && 
            key !== 'academicYear' && 
            key !== 'className') {
          existingFee[key] = req.body[key]
        }
      })
      
      existingFee.updatedBy = currentUserId
      existingFee.updatedAt = new Date()
      await existingFee.save()
      
      return res.status(200).json({
        success: true,
        message: 'Hostel fee structure updated successfully',
        data: existingFee
      })
    } else {
      // Create new
      const hostelFee = new HostelFeeStructure({
        academicYear,
        className,
        totalAnnualFee,
        totalTerms: totalTerms || 3,
        description,
        createdBy: currentUserId,
        updatedBy: currentUserId
      })

      await hostelFee.save()

      res.status(201).json({
        success: true,
        message: 'Hostel fee structure created successfully',
        data: hostelFee
      })
    }
  } catch (error) {
    console.error('Error creating/updating hostel fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating/updating hostel fee structure',
      error: error.message
    })
  }
}

// 2. Get hostel fee structure by academic year and class
exports.getHostelFeeStructure = async (req, res) => {
  try {
    const { academicYear, className } = req.params

    const hostelFee = await HostelFeeStructure.findOne({
      academicYear,
      className
    })

    if (!hostelFee) {
      return res.status(404).json({
        success: false,
        message: 'Hostel fee structure not found'
      })
    }

    res.status(200).json({
      success: true,
      data: hostelFee
    })
  } catch (error) {
    console.error('Error fetching hostel fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching hostel fee structure',
      error: error.message
    })
  }
}

// 3. Get all hostel fee structures
exports.getAllHostelFeeStructures = async (req, res) => {
  try {
    const { 
      academicYear, 
      className, 
      isActive,
      page = 1, 
      limit = 50 
    } = req.query

    const query = {}
    
    if (academicYear) query.academicYear = academicYear
    if (className) query.className = className
    if (isActive !== undefined) query.isActive = isActive === 'true'

    const skip = (page - 1) * limit
    
    const hostelFees = await HostelFeeStructure.find(query)
      .sort({ academicYear: -1, className: 1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await HostelFeeStructure.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        hostelFees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching hostel fee structures:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching hostel fee structures',
      error: error.message
    })
  }
}

// 4. Update hostel fee structure by ID
exports.updateHostelFeeStructure = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const hostelFee = await HostelFeeStructure.findById(id)
    if (!hostelFee) {
      return res.status(404).json({
        success: false,
        message: 'Hostel fee structure not found'
      })
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== '_id' && key !== '__v') {
        hostelFee[key] = updateData[key]
      }
    })

    const currentUserId = getCurrentUserId(req)
    hostelFee.updatedBy = currentUserId
    hostelFee.updatedAt = new Date()
    await hostelFee.save()

    res.status(200).json({
      success: true,
      message: 'Hostel fee structure updated successfully',
      data: hostelFee
    })
  } catch (error) {
    console.error('Error updating hostel fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating hostel fee structure',
      error: error.message
    })
  }
}

// 5. Delete hostel fee structure
exports.deleteHostelFeeStructure = async (req, res) => {
  try {
    const { id } = req.params

    const hostelFee = await HostelFeeStructure.findById(id)
    if (!hostelFee) {
      return res.status(404).json({
        success: false,
        message: 'Hostel fee structure not found'
      })
    }

    await hostelFee.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Hostel fee structure deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting hostel fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting hostel fee structure',
      error: error.message
    })
  }
}

// 6. Toggle active status
exports.toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    const hostelFee = await HostelFeeStructure.findById(id)
    if (!hostelFee) {
      return res.status(404).json({
        success: false,
        message: 'Hostel fee structure not found'
      })
    }

    const currentUserId = getCurrentUserId(req)
    
    hostelFee.isActive = isActive
    hostelFee.updatedBy = currentUserId
    hostelFee.updatedAt = new Date()
    await hostelFee.save()

    res.status(200).json({
      success: true,
      message: `Hostel fee structure ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: hostelFee
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

// 7. Get hostel fee summary
exports.getHostelFeeSummary = async (req, res) => {
  try {
    const { academicYear } = req.query

    const query = { isActive: true }
    if (academicYear) query.academicYear = academicYear

    const hostelFees = await HostelFeeStructure.find(query)
      .sort({ className: 1 })

    const summary = hostelFees.map(fee => ({
      className: fee.className,
      academicYear: fee.academicYear,
      totalAnnualFee: fee.totalAnnualFee,
      totalTerms: fee.totalTerms,
      termAmount: fee.termAmount,
      description: fee.description,
      isActive: fee.isActive
    }))

    // Calculate totals
    const totals = {
      totalClasses: hostelFees.length,
      totalAnnualRevenue: hostelFees.reduce((sum, fee) => sum + fee.totalAnnualFee, 0),
      averageAnnualFee: hostelFees.length > 0 ? 
        (hostelFees.reduce((sum, fee) => sum + fee.totalAnnualFee, 0) / hostelFees.length).toFixed(2) : 0
    }

    res.status(200).json({
      success: true,
      data: {
        summary,
        totals
      }
    })
  } catch (error) {
    console.error('Error fetching hostel fee summary:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching hostel fee summary',
      error: error.message
    })
  }
}

// 8. Bulk upload hostel fees from Excel
exports.bulkUploadHostelFees = async (req, res) => {
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
      const rowNumber = i + 2
      
      try {
        // Validate required fields
        const requiredFields = ['academicYear', 'className', 'totalAnnualFee']
        const missingFields = requiredFields.filter(field => {
          const value = row[field];
          return value === undefined || value === null || value === '';
        })
        
        if (missingFields.length > 0) {
          results.errors.push({
            row: rowNumber,
            message: `Missing required fields: ${missingFields.join(', ')}`
          })
          results.skipped++
          continue
        }

        // Validate className
        let className = String(row.className).trim();
        if (!className || className.length === 0) {
          results.errors.push({
            row: rowNumber,
            message: 'Class name cannot be empty'
          })
          results.skipped++
          continue
        }

        // Validate total annual fee
        const totalAnnualFee = parseFloat(row.totalAnnualFee);
        if (isNaN(totalAnnualFee) || totalAnnualFee <= 0) {
          results.errors.push({
            row: rowNumber,
            message: 'Total annual fee must be a positive number'
          })
          results.skipped++
          continue
        }

        // Validate total terms
        const totalTerms = row.totalTerms ? parseInt(row.totalTerms) : 3
        if (totalTerms < 1 || totalTerms > 4) {
          results.errors.push({
            row: rowNumber,
            message: 'Total terms must be between 1 and 4'
          })
          results.skipped++
          continue
        }

        // Validate academic year
        const academicYear = String(row.academicYear).trim();
        if (!academicYear || academicYear.length === 0) {
          results.errors.push({
            row: rowNumber,
            message: 'Academic year cannot be empty'
          })
          results.skipped++
          continue
        }

        // Check if exists
        const existingFee = await HostelFeeStructure.findOne({
          academicYear: academicYear,
          className: className
        })

        if (existingFee) {
          // Update existing
          existingFee.totalAnnualFee = totalAnnualFee;
          existingFee.totalTerms = totalTerms;
          existingFee.description = row.description || existingFee.description;
          existingFee.updatedBy = currentUserId;
          existingFee.updatedAt = new Date();
          await existingFee.save();
          results.updated++;
        } else {
          // Create new
          const hostelFee = new HostelFeeStructure({
            academicYear: academicYear,
            className: className,
            totalAnnualFee: totalAnnualFee,
            totalTerms: totalTerms,
            description: row.description || '',
            createdBy: currentUserId,
            updatedBy: currentUserId
          });
          await hostelFee.save();
          results.created++;
        }
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        results.errors.push({
          row: rowNumber,
          message: error.message || 'Error processing this row'
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

// 9. Download hostel fees template
exports.downloadHostelFeesTemplate = async (req, res) => {
  try {
    // Create sample data for template
    const sampleData = [
      {
        academicYear: '2024-2025',
        className: 'Class 1',
        totalAnnualFee: '25000',
        totalTerms: '3',
        description: 'Hostel fee for Class 1'
      },
      {
        academicYear: '2024-2025',
        className: 'Class 2',
        totalAnnualFee: '28000',
        totalTerms: '3',
        description: 'Hostel fee for Class 2'
      }
    ]

    // Create workbook
    const workbook = xlsx.utils.book_new()
    const worksheet = xlsx.utils.json_to_sheet(sampleData)
    
    xlsx.utils.book_append_sheet(workbook, worksheet, 'HostelFeesTemplate')

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=hostel_fees_template.xlsx')

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