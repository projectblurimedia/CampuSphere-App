const ClassFeeStructure = require('../models/ClassFeeStructure')
const xlsx = require('xlsx')

// Helper function to get current user ID
const getCurrentUserId = (req) => {
  return req.user ? req.user.id : req.userId || 'system'
}

// 1. Create or update class fee structure
exports.createOrUpdateClassFee = async (req, res) => {
  try {
    const {
      className,
      academicYear,
      totalAnnualFee,
      totalTerms,
      tuitionFee,
      examFee,
      activityFee,
      libraryFee,
      sportsFee,
      labFee,
      computerFee,
      otherCharges,
      description
    } = req.body

    // Check if class fee structure already exists
    const existingFee = await ClassFeeStructure.findOne({
      className,
      academicYear
    })

    const currentUserId = getCurrentUserId(req)
    
    if (existingFee) {
      // Update existing
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined && key !== 'className' && key !== 'academicYear') {
          existingFee[key] = req.body[key]
        }
      })
      
      existingFee.updatedBy = currentUserId
      await existingFee.save()
      
      return res.status(200).json({
        success: true,
        message: 'Class fee structure updated successfully',
        data: existingFee
      })
    } else {
      // Create new
      const classFee = new ClassFeeStructure({
        className,
        academicYear,
        totalAnnualFee,
        totalTerms: totalTerms || 3,
        tuitionFee: tuitionFee || 0,
        examFee: examFee || 0,
        activityFee: activityFee || 0,
        libraryFee: libraryFee || 0,
        sportsFee: sportsFee || 0,
        labFee: labFee || 0,
        computerFee: computerFee || 0,
        otherCharges: otherCharges || 0,
        description,
        createdBy: currentUserId,
        updatedBy: currentUserId
      })

      await classFee.save()

      res.status(201).json({
        success: true,
        message: 'Class fee structure created successfully',
        data: classFee
      })
    }
  } catch (error) {
    console.error('Error creating/updating class fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating/updating class fee structure',
      error: error.message
    })
  }
}

// 2. Get class fee structure by class and academic year
exports.getClassFeeStructure = async (req, res) => {
  try {
    const { className, academicYear } = req.params

    const classFee = await ClassFeeStructure.findOne({
      className,
      academicYear
    })

    if (!classFee) {
      return res.status(404).json({
        success: false,
        message: 'Class fee structure not found'
      })
    }

    res.status(200).json({
      success: true,
      data: classFee
    })
  } catch (error) {
    console.error('Error fetching class fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching class fee structure',
      error: error.message
    })
  }
}

// 3. Get all class fee structures
exports.getAllClassFeeStructures = async (req, res) => {
  try {
    const { academicYear, className, isActive, page = 1, limit = 50 } = req.query

    const query = {}
    
    if (academicYear) query.academicYear = academicYear
    if (className) query.className = className
    if (isActive !== undefined) query.isActive = isActive === 'true'

    const skip = (page - 1) * limit
    
    const classFees = await ClassFeeStructure.find(query)
      .sort({ className: 1, academicYear: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await ClassFeeStructure.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        classFees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching class fee structures:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching class fee structures',
      error: error.message
    })
  }
}

// 4. Update class fee structure
exports.updateClassFeeStructure = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const classFee = await ClassFeeStructure.findById(id)
    if (!classFee) {
      return res.status(404).json({
        success: false,
        message: 'Class fee structure not found'
      })
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== '_id' && key !== '__v') {
        classFee[key] = updateData[key]
      }
    })

    const currentUserId = getCurrentUserId(req)
    classFee.updatedBy = currentUserId
    await classFee.save()

    res.status(200).json({
      success: true,
      message: 'Class fee structure updated successfully',
      data: classFee
    })
  } catch (error) {
    console.error('Error updating class fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating class fee structure',
      error: error.message
    })
  }
}

// 5. Delete class fee structure
exports.deleteClassFeeStructure = async (req, res) => {
  try {
    const { id } = req.params

    const classFee = await ClassFeeStructure.findById(id)
    if (!classFee) {
      return res.status(404).json({
        success: false,
        message: 'Class fee structure not found'
      })
    }

    // Check if any fees exist for this class structure
    const Fee = require('../models/Fee')
    const existingFees = await Fee.findOne({
      className: classFee.className,
      academicYear: classFee.academicYear
    })

    if (existingFees) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class fee structure. Fees already generated for this class.'
      })
    }

    await classFee.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Class fee structure deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting class fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting class fee structure',
      error: error.message
    })
  }
}

// 6. Toggle active status
exports.toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    const classFee = await ClassFeeStructure.findById(id)
    if (!classFee) {
      return res.status(404).json({
        success: false,
        message: 'Class fee structure not found'
      })
    }

    const currentUserId = getCurrentUserId(req)
    
    classFee.isActive = isActive
    classFee.updatedBy = currentUserId
    await classFee.save()

    res.status(200).json({
      success: true,
      message: `Class fee structure ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: classFee
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

// 7. Get class fee summary for all classes
exports.getClassFeeSummary = async (req, res) => {
  try {
    const { academicYear } = req.query

    const query = { isActive: true }
    if (academicYear) query.academicYear = academicYear

    const classFees = await ClassFeeStructure.find(query)
      .sort({ className: 1 })

    const summary = classFees.map(fee => ({
      className: fee.className,
      academicYear: fee.academicYear,
      totalAnnualFee: fee.totalAnnualFee,
      totalTerms: fee.totalTerms,
      termAmount: fee.termAmount,
      tuitionFee: fee.tuitionFee,
      examFee: fee.examFee,
      activityFee: fee.activityFee,
      libraryFee: fee.libraryFee,
      sportsFee: fee.sportsFee,
      labFee: fee.labFee,
      computerFee: fee.computerFee,
      otherCharges: fee.otherCharges,
      isActive: fee.isActive
    }))

    // Calculate totals
    const totals = {
      totalClasses: classFees.length,
      totalAnnualRevenue: classFees.reduce((sum, fee) => sum + fee.totalAnnualFee, 0),
      averageAnnualFee: classFees.length > 0 ? 
        (classFees.reduce((sum, fee) => sum + fee.totalAnnualFee, 0) / classFees.length).toFixed(2) : 0
    }

    res.status(200).json({
      success: true,
      data: {
        summary,
        totals
      }
    })
  } catch (error) {
    console.error('Error fetching class fee summary:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching class fee summary',
      error: error.message
    })
  }
}

// 8. Bulk upload class fees from Excel
exports.bulkUploadClassFees = async (req, res) => {
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
        const requiredFields = ['className', 'academicYear', 'totalAnnualFee']
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

        // Validate and normalize className
        let className = String(row.className).trim();
        
        // Handle numeric class names like 1, 2, 3 etc.
        // Convert to string if it's a number
        if (!isNaN(className) && className !== '') {
          className = parseInt(className).toString();
        }
        
        if (!className || className.length === 0) {
          results.errors.push({
            row: rowNumber,
            message: 'Class name cannot be empty'
          })
          results.skipped++
          continue
        }

        // Validate numeric fields
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

        // Validate academic year format
        const academicYear = String(row.academicYear).trim();
        if (!academicYear || academicYear.length === 0) {
          results.errors.push({
            row: rowNumber,
            message: 'Academic year cannot be empty'
          })
          results.skipped++
          continue
        }

        // Validate fee breakdown fields
        const feeFields = [
          'tuitionFee', 'examFee', 'activityFee', 'libraryFee',
          'sportsFee', 'labFee', 'computerFee', 'otherCharges'
        ]
        
        for (const field of feeFields) {
          if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
            const feeValue = parseFloat(row[field]);
            if (isNaN(feeValue) || feeValue < 0) {
              results.errors.push({
                row: rowNumber,
                message: `${field} must be a non-negative number`
              })
              results.skipped++
              continue
            }
          }
        }

        // Check if exists
        const existingFee = await ClassFeeStructure.findOne({
          className: className,
          academicYear: academicYear
        })

        if (existingFee) {
          // Update existing
          existingFee.totalAnnualFee = totalAnnualFee;
          existingFee.totalTerms = totalTerms;
          
          // Update fee breakdown fields
          feeFields.forEach(field => {
            if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
              existingFee[field] = parseFloat(row[field]);
            }
          })
          
          existingFee.description = row.description || existingFee.description;
          existingFee.updatedBy = currentUserId;
          existingFee.updatedAt = new Date();
          await existingFee.save();
          results.updated++;
        } else {
          // Create new
          const classFeeData = {
            className: className,
            academicYear: academicYear,
            totalAnnualFee: totalAnnualFee,
            totalTerms: totalTerms,
            description: row.description || '',
            createdBy: currentUserId,
            updatedBy: currentUserId,
            isActive: true
          };
          
          // Add fee breakdown fields
          feeFields.forEach(field => {
            if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
              classFeeData[field] = parseFloat(row[field]);
            } else {
              classFeeData[field] = 0; // Default to 0 if not provided
            }
          });
          
          const classFee = new ClassFeeStructure(classFeeData);
          await classFee.save();
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

    // Log summary
    console.log('Bulk upload completed:', {
      total: data.length,
      created: results.created,
      updated: results.updated,
      skipped: results.skipped,
      errors: results.errors.length
    });

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

// 9. Download class fees template
exports.downloadClassFeesTemplate = async (req, res) => {
  try {
    // Create sample data for template
    const sampleData = [
      {
        className: 'Class 1',
        academicYear: '2024-2025',
        totalAnnualFee: '50000',
        totalTerms: '3',
        tuitionFee: '30000',
        examFee: '5000',
        activityFee: '2000',
        libraryFee: '1000',
        sportsFee: '1500',
        labFee: '2000',
        computerFee: '1500',
        otherCharges: '3000',
        description: 'Sample class fee structure'
      },
      {
        className: 'Class 2',
        academicYear: '2024-2025',
        totalAnnualFee: '55000',
        totalTerms: '3',
        tuitionFee: '32000',
        examFee: '5500',
        activityFee: '2500',
        libraryFee: '1200',
        sportsFee: '1800',
        labFee: '2200',
        computerFee: '1800',
        otherCharges: '3500',
        description: 'Another class'
      }
    ]

    // Create workbook
    const workbook = xlsx.utils.book_new()
    const worksheet = xlsx.utils.json_to_sheet(sampleData)
    
    xlsx.utils.book_append_sheet(workbook, worksheet, 'ClassFeesTemplate')

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=class_fees_template.xlsx')

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