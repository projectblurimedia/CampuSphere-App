import prisma from '../lib/prisma.js'
import asyncHandler from 'express-async-handler'
import {
  mapClassToEnum,
  mapEnumToDisplayName,
  validateSection  // Only import what's actually exported
} from '../utils/classMappings.js'

// ============================================================================
// CLASS FEE STRUCTURE CONTROLLERS
// ============================================================================

/**
 * @desc    Create new class fee structure
 * @route   POST /api/fee-structure/class
 * @access  Private
 */
export const createClassFeeStructure = asyncHandler(async (req, res) => {
  const {
    className,
    totalAnnualFee,
    tuitionFee = 0,
    examFee = 0,
    activityFee = 0,
    booksFee = 0,
    sportsFee = 0,
    labFee = 0,
    computerFee = 0,
    otherCharges = 0,
    description,
    createdBy
  } = req.body

  // Validation
  if (!className || !totalAnnualFee || !createdBy) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      required: ['className', 'totalAnnualFee', 'createdBy']
    })
  }

  if (totalAnnualFee <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Total annual fee must be greater than 0'
    })
  }

  try {
    const classEnum = mapClassToEnum(className)
    if (!classEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class name'
      })
    }

    // Check if fee structure already exists for this class
    const existingStructure = await prisma.classFeeStructure.findFirst({
      where: {
        className: classEnum,
        isActive: true
      }
    })

    if (existingStructure) {
      return res.status(409).json({
        success: false,
        message: `Active fee structure already exists for ${className}. Please deactivate it first or update the existing one.`
      })
    }

    // Calculate total of all components
    const calculatedTotal = tuitionFee + examFee + activityFee + 
                           booksFee + sportsFee + labFee + 
                           computerFee + otherCharges

    if (calculatedTotal !== totalAnnualFee) {
      return res.status(400).json({
        success: false,
        message: `Component total (${calculatedTotal}) does not match totalAnnualFee (${totalAnnualFee})`,
        data: { calculatedTotal, providedTotal: totalAnnualFee }
      })
    }

    const feeStructure = await prisma.classFeeStructure.create({
      data: {
        className: classEnum,
        totalAnnualFee,
        tuitionFee,
        examFee,
        activityFee,
        booksFee,
        sportsFee,
        labFee,
        computerFee,
        otherCharges,
        description,
        createdBy,
        updatedBy: createdBy
      }
    })

    // Format response with display class name
    const response = {
      ...feeStructure,
      className: mapEnumToDisplayName(feeStructure.className)
    }

    res.status(201).json({
      success: true,
      data: response,
      message: 'Class fee structure created successfully'
    })
  } catch (error) {
    console.error('Error creating class fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating class fee structure',
      error: error.message
    })
  }
})

/**
 * @desc    Bulk create class fee structures
 * @route   POST /api/fee-structure/class/bulk
 * @access  Private
 */
export const bulkCreateClassFeeStructures = asyncHandler(async (req, res) => {
  const { structures, createdBy } = req.body

  if (!structures || !Array.isArray(structures) || structures.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Structures array is required and must not be empty'
    })
  }

  if (!createdBy) {
    return res.status(400).json({
      success: false,
      message: 'createdBy is required'
    })
  }

  try {
    const results = {
      successful: [],
      failed: []
    }

    for (const structure of structures) {
      try {
        const {
          className,
          totalAnnualFee,
          tuitionFee = 0,
          examFee = 0,
          activityFee = 0,
          booksFee = 0,
          sportsFee = 0,
          labFee = 0,
          computerFee = 0,
          otherCharges = 0,
          description
        } = structure

        const classEnum = mapClassToEnum(className)
        if (!classEnum) {
          results.failed.push({ className, reason: 'Invalid class name' })
          continue
        }

        // Check if exists
        const existing = await prisma.classFeeStructure.findFirst({
          where: { className: classEnum, isActive: true }
        })

        if (existing) {
          results.failed.push({ className, reason: 'Active fee structure already exists' })
          continue
        }

        const calculatedTotal = tuitionFee + examFee + activityFee + 
                               booksFee + sportsFee + labFee + 
                               computerFee + otherCharges

        if (calculatedTotal !== totalAnnualFee) {
          results.failed.push({ className, reason: 'Component total mismatch' })
          continue
        }

        const created = await prisma.classFeeStructure.create({
          data: {
            className: classEnum,
            totalAnnualFee,
            tuitionFee,
            examFee,
            activityFee,
            booksFee,
            sportsFee,
            labFee,
            computerFee,
            otherCharges,
            description,
            createdBy,
            updatedBy: createdBy
          }
        })

        results.successful.push({
          ...created,
          className: mapEnumToDisplayName(created.className)
        })
      } catch (error) {
        results.failed.push({ 
          className: structure.className, 
          reason: error.message 
        })
      }
    }

    res.status(201).json({
      success: true,
      data: results,
      message: `Bulk creation completed: ${results.successful.length} successful, ${results.failed.length} failed`
    })
  } catch (error) {
    console.error('Error bulk creating class fee structures:', error)
    res.status(500).json({
      success: false,
      message: 'Error bulk creating class fee structures',
      error: error.message
    })
  }
})

/**
 * @desc    Get all class fee structures with filters
 * @route   GET /api/fee-structure/class
 * @access  Private
 */
export const getClassFeeStructures = asyncHandler(async (req, res) => {
  const {
    className,
    isActive,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  try {
    // Build filter object
    const filter = {}
    
    if (className) {
      const classEnum = mapClassToEnum(className)
      if (classEnum) filter.className = classEnum
    }
    
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    // Get total count for pagination
    const totalCount = await prisma.classFeeStructure.count({ where: filter })

    // Get fee structures
    const feeStructures = await prisma.classFeeStructure.findMany({
      where: filter,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder
      }
    })

    // Format response with display class names
    const formattedData = feeStructures.map(structure => ({
      ...structure,
      className: mapEnumToDisplayName(structure.className)
    }))

    res.status(200).json({
      success: true,
      data: formattedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
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
})

/**
 * @desc    Get class fee structure by ID
 * @route   GET /api/fee-structure/class/:id
 * @access  Private
 */
export const getClassFeeStructureById = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const feeStructure = await prisma.classFeeStructure.findUnique({
      where: { id }
    })

    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: 'Class fee structure not found'
      })
    }

    const response = {
      ...feeStructure,
      className: mapEnumToDisplayName(feeStructure.className)
    }

    res.status(200).json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Error fetching class fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching class fee structure',
      error: error.message
    })
  }
})

/**
 * @desc    Get class fee structure by class name
 * @route   GET /api/fee-structure/class/class/:className
 * @access  Private
 */
export const getClassFeeStructureByClass = asyncHandler(async (req, res) => {
  const { className } = req.params
  const { isActive = true } = req.query

  try {
    const classEnum = mapClassToEnum(className)
    if (!classEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class name'
      })
    }

    const feeStructures = await prisma.classFeeStructure.findMany({
      where: {
        className: classEnum,
        isActive: isActive === 'true'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedData = feeStructures.map(structure => ({
      ...structure,
      className: mapEnumToDisplayName(structure.className)
    }))

    res.status(200).json({
      success: true,
      count: formattedData.length,
      data: formattedData
    })
  } catch (error) {
    console.error('Error fetching class fee structure by class:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching class fee structure',
      error: error.message
    })
  }
})

/**
 * @desc    Update class fee structure
 * @route   PUT /api/fee-structure/class/:id
 * @access  Private
 */
export const updateClassFeeStructure = asyncHandler(async (req, res) => {
  const { id } = req.params
  const {
    totalAnnualFee,
    tuitionFee,
    examFee,
    activityFee,
    booksFee,
    sportsFee,
    labFee,
    computerFee,
    otherCharges,
    description,
    updatedBy
  } = req.body

  if (!updatedBy) {
    return res.status(400).json({
      success: false,
      message: 'updatedBy is required'
    })
  }

  try {
    const existingStructure = await prisma.classFeeStructure.findUnique({
      where: { id }
    })

    if (!existingStructure) {
      return res.status(404).json({
        success: false,
        message: 'Class fee structure not found'
      })
    }

    const updateData = {
      updatedBy,
      updatedAt: new Date()
    }

    // Update fields if provided
    if (totalAnnualFee !== undefined) {
      if (totalAnnualFee <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Total annual fee must be greater than 0'
        })
      }
      updateData.totalAnnualFee = totalAnnualFee
    }

    if (tuitionFee !== undefined) updateData.tuitionFee = tuitionFee
    if (examFee !== undefined) updateData.examFee = examFee
    if (activityFee !== undefined) updateData.activityFee = activityFee
    if (booksFee !== undefined) updateData.booksFee = booksFee
    if (sportsFee !== undefined) updateData.sportsFee = sportsFee
    if (labFee !== undefined) updateData.labFee = labFee
    if (computerFee !== undefined) updateData.computerFee = computerFee
    if (otherCharges !== undefined) updateData.otherCharges = otherCharges
    if (description !== undefined) updateData.description = description

    // Validate total if totalAnnualFee or any component is updated
    if (updateData.totalAnnualFee || 
        tuitionFee !== undefined || examFee !== undefined || 
        activityFee !== undefined || booksFee !== undefined ||
        sportsFee !== undefined || labFee !== undefined ||
        computerFee !== undefined || otherCharges !== undefined) {
      
      const total = updateData.totalAnnualFee ?? existingStructure.totalAnnualFee
      const tuition = updateData.tuitionFee ?? existingStructure.tuitionFee
      const exam = updateData.examFee ?? existingStructure.examFee
      const activity = updateData.activityFee ?? existingStructure.activityFee
      const library = updateData.booksFee ?? existingStructure.booksFee
      const sports = updateData.sportsFee ?? existingStructure.sportsFee
      const lab = updateData.labFee ?? existingStructure.labFee
      const computer = updateData.computerFee ?? existingStructure.computerFee
      const other = updateData.otherCharges ?? existingStructure.otherCharges

      const calculatedTotal = tuition + exam + activity + library + sports + lab + computer + other

      if (calculatedTotal !== total) {
        return res.status(400).json({
          success: false,
          message: `Component total (${calculatedTotal}) does not match totalAnnualFee (${total})`
        })
      }
    }

    const updatedStructure = await prisma.classFeeStructure.update({
      where: { id },
      data: updateData
    })

    const response = {
      ...updatedStructure,
      className: mapEnumToDisplayName(updatedStructure.className)
    }

    res.status(200).json({
      success: true,
      data: response,
      message: 'Class fee structure updated successfully'
    })
  } catch (error) {
    console.error('Error updating class fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating class fee structure',
      error: error.message
    })
  }
})

/**
 * @desc    Delete class fee structure
 * @route   DELETE /api/fee-structure/class/:id
 * @access  Private
 */
export const deleteClassFeeStructure = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const existingStructure = await prisma.classFeeStructure.findUnique({
      where: { id }
    })

    if (!existingStructure) {
      return res.status(404).json({
        success: false,
        message: 'Class fee structure not found'
      })
    }

    await prisma.classFeeStructure.delete({
      where: { id }
    })

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
})

/**
 * @desc    Toggle class fee structure active status
 * @route   PATCH /api/fee-structure/class/:id/toggle-status
 * @access  Private
 */
export const toggleClassFeeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { updatedBy } = req.body

  if (!updatedBy) {
    return res.status(400).json({
      success: false,
      message: 'updatedBy is required'
    })
  }

  try {
    const existingStructure = await prisma.classFeeStructure.findUnique({
      where: { id }
    })

    if (!existingStructure) {
      return res.status(404).json({
        success: false,
        message: 'Class fee structure not found'
      })
    }

    const updatedStructure = await prisma.classFeeStructure.update({
      where: { id },
      data: {
        isActive: !existingStructure.isActive,
        updatedBy,
        updatedAt: new Date()
      }
    })

    const response = {
      ...updatedStructure,
      className: mapEnumToDisplayName(updatedStructure.className)
    }

    res.status(200).json({
      success: true,
      data: response,
      message: `Class fee structure ${updatedStructure.isActive ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    console.error('Error toggling class fee structure status:', error)
    res.status(500).json({
      success: false,
      message: 'Error toggling class fee structure status',
      error: error.message
    })
  }
})

// ============================================================================
// BUS FEE STRUCTURE CONTROLLERS
// ============================================================================

/**
 * @desc    Create new bus fee structure
 * @route   POST /api/fee-structure/bus
 * @access  Private
 */
export const createBusFeeStructure = asyncHandler(async (req, res) => {
  const {
    villageName,
    distance = 0.0,
    feeAmount,
    description,
    createdBy
  } = req.body

  // Validation
  if (!villageName || !feeAmount || !createdBy) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      required: ['villageName', 'feeAmount', 'createdBy']
    })
  }

  if (feeAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Fee amount must be greater than 0'
    })
  }

  if (distance < 0) {
    return res.status(400).json({
      success: false,
      message: 'Distance cannot be negative'
    })
  }

  try {
    // Check if fee structure already exists for this village
    const existingStructure = await prisma.busFeeStructure.findFirst({
      where: {
        villageName: {
          equals: villageName,
          mode: 'insensitive'
        },
        isActive: true
      }
    })

    if (existingStructure) {
      return res.status(409).json({
        success: false,
        message: `Active fee structure already exists for village: ${villageName}`
      })
    }

    const feeStructure = await prisma.busFeeStructure.create({
      data: {
        villageName: villageName.trim(),
        distance: parseFloat(distance),
        feeAmount,
        description,
        createdBy,
        updatedBy: createdBy
      }
    })

    res.status(201).json({
      success: true,
      data: feeStructure,
      message: 'Bus fee structure created successfully'
    })
  } catch (error) {
    console.error('Error creating bus fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating bus fee structure',
      error: error.message
    })
  }
})

/**
 * @desc    Bulk create bus fee structures
 * @route   POST /api/fee-structure/bus/bulk
 * @access  Private
 */
export const bulkCreateBusFeeStructures = asyncHandler(async (req, res) => {
  const { structures, createdBy } = req.body

  if (!structures || !Array.isArray(structures) || structures.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Structures array is required and must not be empty'
    })
  }

  if (!createdBy) {
    return res.status(400).json({
      success: false,
      message: 'createdBy is required'
    })
  }

  try {
    const results = {
      successful: [],
      failed: []
    }

    for (const structure of structures) {
      try {
        const {
          villageName,
          distance = 0.0,
          feeAmount,
          description
        } = structure

        if (!villageName || !feeAmount) {
          results.failed.push({ villageName, reason: 'Missing required fields' })
          continue
        }

        const existing = await prisma.busFeeStructure.findFirst({
          where: {
            villageName: {
              equals: villageName,
              mode: 'insensitive'
            },
            isActive: true
          }
        })

        if (existing) {
          results.failed.push({ villageName, reason: 'Active fee structure already exists' })
          continue
        }

        const created = await prisma.busFeeStructure.create({
          data: {
            villageName: villageName.trim(),
            distance: parseFloat(distance),
            feeAmount,
            description,
            createdBy,
            updatedBy: createdBy
          }
        })

        results.successful.push(created)
      } catch (error) {
        results.failed.push({ 
          villageName: structure.villageName, 
          reason: error.message 
        })
      }
    }

    res.status(201).json({
      success: true,
      data: results,
      message: `Bulk creation completed: ${results.successful.length} successful, ${results.failed.length} failed`
    })
  } catch (error) {
    console.error('Error bulk creating bus fee structures:', error)
    res.status(500).json({
      success: false,
      message: 'Error bulk creating bus fee structures',
      error: error.message
    })
  }
})

/**
 * @desc    Get all bus fee structures with filters
 * @route   GET /api/fee-structure/bus
 * @access  Private
 */
export const getBusFeeStructures = asyncHandler(async (req, res) => {
  const {
    villageName,
    isActive,
    minDistance,
    maxDistance,
    minFee,
    maxFee,
    page = 1,
    limit = 20,
    sortBy = 'villageName',
    sortOrder = 'asc'
  } = req.query

  try {
    const filter = {}
    
    if (villageName) {
      filter.villageName = {
        contains: villageName,
        mode: 'insensitive'
      }
    }
    
    if (isActive !== undefined) filter.isActive = isActive === 'true'
    
    if (minDistance || maxDistance) {
      filter.distance = {}
      if (minDistance) filter.distance.gte = parseFloat(minDistance)
      if (maxDistance) filter.distance.lte = parseFloat(maxDistance)
    }
    
    if (minFee || maxFee) {
      filter.feeAmount = {}
      if (minFee) filter.feeAmount.gte = parseInt(minFee)
      if (maxFee) filter.feeAmount.lte = parseInt(maxFee)
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const totalCount = await prisma.busFeeStructure.count({ where: filter })

    const feeStructures = await prisma.busFeeStructure.findMany({
      where: filter,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder
      }
    })

    res.status(200).json({
      success: true,
      data: feeStructures,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
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
})

/**
 * @desc    Get bus fee structure by ID
 * @route   GET /api/fee-structure/bus/:id
 * @access  Private
 */
export const getBusFeeStructureById = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const feeStructure = await prisma.busFeeStructure.findUnique({
      where: { id }
    })

    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: 'Bus fee structure not found'
      })
    }

    res.status(200).json({
      success: true,
      data: feeStructure
    })
  } catch (error) {
    console.error('Error fetching bus fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching bus fee structure',
      error: error.message
    })
  }
})

/**
 * @desc    Get bus fee structure by village name
 * @route   GET /api/fee-structure/bus/village/:villageName
 * @access  Private
 */
export const getBusFeeStructureByVillage = asyncHandler(async (req, res) => {
  const { villageName } = req.params
  const { isActive = true } = req.query

  try {
    const feeStructures = await prisma.busFeeStructure.findMany({
      where: {
        villageName: {
          equals: villageName,
          mode: 'insensitive'
        },
        isActive: isActive === 'true'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.status(200).json({
      success: true,
      count: feeStructures.length,
      data: feeStructures
    })
  } catch (error) {
    console.error('Error fetching bus fee structure by village:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching bus fee structure',
      error: error.message
    })
  }
})

/**
 * @desc    Update bus fee structure
 * @route   PUT /api/fee-structure/bus/:id
 * @access  Private
 */
export const updateBusFeeStructure = asyncHandler(async (req, res) => {
  const { id } = req.params
  const {
    villageName,
    distance,
    feeAmount,
    description,
    updatedBy
  } = req.body

  if (!updatedBy) {
    return res.status(400).json({
      success: false,
      message: 'updatedBy is required'
    })
  }

  try {
    const existingStructure = await prisma.busFeeStructure.findUnique({
      where: { id }
    })

    if (!existingStructure) {
      return res.status(404).json({
        success: false,
        message: 'Bus fee structure not found'
      })
    }

    const updateData = {
      updatedBy,
      updatedAt: new Date()
    }

    if (villageName !== undefined) updateData.villageName = villageName.trim()
    if (distance !== undefined) {
      if (distance < 0) {
        return res.status(400).json({
          success: false,
          message: 'Distance cannot be negative'
        })
      }
      updateData.distance = parseFloat(distance)
    }
    if (feeAmount !== undefined) {
      if (feeAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Fee amount must be greater than 0'
        })
      }
      updateData.feeAmount = feeAmount
    }
    if (description !== undefined) updateData.description = description

    // If village name is being updated, check for duplicates
    if (villageName && villageName.toLowerCase() !== existingStructure.villageName.toLowerCase()) {
      const duplicate = await prisma.busFeeStructure.findFirst({
        where: {
          villageName: {
            equals: villageName,
            mode: 'insensitive'
          },
          isActive: true,
          id: { not: id }
        }
      })

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Another active fee structure already exists for village: ${villageName}`
        })
      }
    }

    const updatedStructure = await prisma.busFeeStructure.update({
      where: { id },
      data: updateData
    })

    res.status(200).json({
      success: true,
      data: updatedStructure,
      message: 'Bus fee structure updated successfully'
    })
  } catch (error) {
    console.error('Error updating bus fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating bus fee structure',
      error: error.message
    })
  }
})

/**
 * @desc    Delete bus fee structure
 * @route   DELETE /api/fee-structure/bus/:id
 * @access  Private
 */
export const deleteBusFeeStructure = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const existingStructure = await prisma.busFeeStructure.findUnique({
      where: { id }
    })

    if (!existingStructure) {
      return res.status(404).json({
        success: false,
        message: 'Bus fee structure not found'
      })
    }

    await prisma.busFeeStructure.delete({
      where: { id }
    })

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
})

/**
 * @desc    Toggle bus fee structure active status
 * @route   PATCH /api/fee-structure/bus/:id/toggle-status
 * @access  Private
 */
export const toggleBusFeeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { updatedBy } = req.body

  if (!updatedBy) {
    return res.status(400).json({
      success: false,
      message: 'updatedBy is required'
    })
  }

  try {
    const existingStructure = await prisma.busFeeStructure.findUnique({
      where: { id }
    })

    if (!existingStructure) {
      return res.status(404).json({
        success: false,
        message: 'Bus fee structure not found'
      })
    }

    const updatedStructure = await prisma.busFeeStructure.update({
      where: { id },
      data: {
        isActive: !existingStructure.isActive,
        updatedBy,
        updatedAt: new Date()
      }
    })

    res.status(200).json({
      success: true,
      data: updatedStructure,
      message: `Bus fee structure ${updatedStructure.isActive ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    console.error('Error toggling bus fee structure status:', error)
    res.status(500).json({
      success: false,
      message: 'Error toggling bus fee structure status',
      error: error.message
    })
  }
})

// ============================================================================
// HOSTEL FEE STRUCTURE CONTROLLERS
// ============================================================================

/**
 * @desc    Create new hostel fee structure
 * @route   POST /api/fee-structure/hostel
 * @access  Private
 */
export const createHostelFeeStructure = asyncHandler(async (req, res) => {
  const {
    className,
    totalAnnualFee,
    totalTerms = 3,
    description,
    createdBy
  } = req.body

  // Validation
  if (!className || !totalAnnualFee || !createdBy) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      required: ['className', 'totalAnnualFee', 'createdBy']
    })
  }

  if (totalAnnualFee <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Total annual fee must be greater than 0'
    })
  }

  if (totalTerms < 1 || totalTerms > 4) {
    return res.status(400).json({
      success: false,
      message: 'Total terms must be between 1 and 4'
    })
  }

  try {
    const classEnum = mapClassToEnum(className)
    if (!classEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class name'
      })
    }

    // Check if fee structure already exists for this class
    const existingStructure = await prisma.hostelFeeStructure.findFirst({
      where: {
        className: classEnum,
        isActive: true
      }
    })

    if (existingStructure) {
      return res.status(409).json({
        success: false,
        message: `Active hostel fee structure already exists for ${className}`
      })
    }

    const feeStructure = await prisma.hostelFeeStructure.create({
      data: {
        className: classEnum,
        totalAnnualFee,
        totalTerms,
        description,
        createdBy,
        updatedBy: createdBy
      }
    })

    // Format response with display class name and term amount
    const response = {
      ...feeStructure,
      className: mapEnumToDisplayName(feeStructure.className),
      termAmount: feeStructure.totalAnnualFee / feeStructure.totalTerms
    }

    res.status(201).json({
      success: true,
      data: response,
      message: 'Hostel fee structure created successfully'
    })
  } catch (error) {
    console.error('Error creating hostel fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating hostel fee structure',
      error: error.message
    })
  }
})

/**
 * @desc    Bulk create hostel fee structures
 * @route   POST /api/fee-structure/hostel/bulk
 * @access  Private
 */
export const bulkCreateHostelFeeStructures = asyncHandler(async (req, res) => {
  const { structures, createdBy } = req.body

  if (!structures || !Array.isArray(structures) || structures.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Structures array is required and must not be empty'
    })
  }

  if (!createdBy) {
    return res.status(400).json({
      success: false,
      message: 'createdBy is required'
    })
  }

  try {
    const results = {
      successful: [],
      failed: []
    }

    for (const structure of structures) {
      try {
        const {
          className,
          totalAnnualFee,
          totalTerms = 3,
          description
        } = structure

        const classEnum = mapClassToEnum(className)
        if (!classEnum) {
          results.failed.push({ className, reason: 'Invalid class name' })
          continue
        }

        const existing = await prisma.hostelFeeStructure.findFirst({
          where: { className: classEnum, isActive: true }
        })

        if (existing) {
          results.failed.push({ className, reason: 'Active fee structure already exists' })
          continue
        }

        const created = await prisma.hostelFeeStructure.create({
          data: {
            className: classEnum,
            totalAnnualFee,
            totalTerms,
            description,
            createdBy,
            updatedBy: createdBy
          }
        })

        results.successful.push({
          ...created,
          className: mapEnumToDisplayName(created.className),
          termAmount: created.totalAnnualFee / created.totalTerms
        })
      } catch (error) {
        results.failed.push({ 
          className: structure.className, 
          reason: error.message 
        })
      }
    }

    res.status(201).json({
      success: true,
      data: results,
      message: `Bulk creation completed: ${results.successful.length} successful, ${results.failed.length} failed`
    })
  } catch (error) {
    console.error('Error bulk creating hostel fee structures:', error)
    res.status(500).json({
      success: false,
      message: 'Error bulk creating hostel fee structures',
      error: error.message
    })
  }
})

/**
 * @desc    Get all hostel fee structures with filters
 * @route   GET /api/fee-structure/hostel
 * @access  Private
 */
export const getHostelFeeStructures = asyncHandler(async (req, res) => {
  const {
    className,
    isActive,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  try {
    const filter = {}
    
    if (className) {
      const classEnum = mapClassToEnum(className)
      if (classEnum) filter.className = classEnum
    }
    
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const totalCount = await prisma.hostelFeeStructure.count({ where: filter })

    const feeStructures = await prisma.hostelFeeStructure.findMany({
      where: filter,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder
      }
    })

    const formattedData = feeStructures.map(structure => ({
      ...structure,
      className: mapEnumToDisplayName(structure.className),
      termAmount: structure.totalAnnualFee / structure.totalTerms
    }))

    res.status(200).json({
      success: true,
      data: formattedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
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
})

/**
 * @desc    Get hostel fee structure by ID
 * @route   GET /api/fee-structure/hostel/:id
 * @access  Private
 */
export const getHostelFeeStructureById = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const feeStructure = await prisma.hostelFeeStructure.findUnique({
      where: { id }
    })

    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: 'Hostel fee structure not found'
      })
    }

    const response = {
      ...feeStructure,
      className: mapEnumToDisplayName(feeStructure.className),
      termAmount: feeStructure.totalAnnualFee / feeStructure.totalTerms
    }

    res.status(200).json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Error fetching hostel fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching hostel fee structure',
      error: error.message
    })
  }
})

/**
 * @desc    Get hostel fee structure by class name
 * @route   GET /api/fee-structure/hostel/class/:className
 * @access  Private
 */
export const getHostelFeeStructureByClass = asyncHandler(async (req, res) => {
  const { className } = req.params
  const { isActive = true } = req.query

  try {
    const classEnum = mapClassToEnum(className)
    if (!classEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class name'
      })
    }

    const feeStructures = await prisma.hostelFeeStructure.findMany({
      where: {
        className: classEnum,
        isActive: isActive === 'true'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedData = feeStructures.map(structure => ({
      ...structure,
      className: mapEnumToDisplayName(structure.className),
      termAmount: structure.totalAnnualFee / structure.totalTerms
    }))

    res.status(200).json({
      success: true,
      count: formattedData.length,
      data: formattedData
    })
  } catch (error) {
    console.error('Error fetching hostel fee structure by class:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching hostel fee structure',
      error: error.message
    })
  }
})

/**
 * @desc    Update hostel fee structure
 * @route   PUT /api/fee-structure/hostel/:id
 * @access  Private
 */
export const updateHostelFeeStructure = asyncHandler(async (req, res) => {
  const { id } = req.params
  const {
    totalAnnualFee,
    totalTerms,
    description,
    updatedBy
  } = req.body

  if (!updatedBy) {
    return res.status(400).json({
      success: false,
      message: 'updatedBy is required'
    })
  }

  try {
    const existingStructure = await prisma.hostelFeeStructure.findUnique({
      where: { id }
    })

    if (!existingStructure) {
      return res.status(404).json({
        success: false,
        message: 'Hostel fee structure not found'
      })
    }

    const updateData = {
      updatedBy,
      updatedAt: new Date()
    }

    if (totalAnnualFee !== undefined) {
      if (totalAnnualFee <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Total annual fee must be greater than 0'
        })
      }
      updateData.totalAnnualFee = totalAnnualFee
    }

    if (totalTerms !== undefined) {
      if (totalTerms < 1 || totalTerms > 4) {
        return res.status(400).json({
          success: false,
          message: 'Total terms must be between 1 and 4'
        })
      }
      updateData.totalTerms = totalTerms
    }

    if (description !== undefined) updateData.description = description

    const updatedStructure = await prisma.hostelFeeStructure.update({
      where: { id },
      data: updateData
    })

    const response = {
      ...updatedStructure,
      className: mapEnumToDisplayName(updatedStructure.className),
      termAmount: updatedStructure.totalAnnualFee / updatedStructure.totalTerms
    }

    res.status(200).json({
      success: true,
      data: response,
      message: 'Hostel fee structure updated successfully'
    })
  } catch (error) {
    console.error('Error updating hostel fee structure:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating hostel fee structure',
      error: error.message
    })
  }
})

/**
 * @desc    Delete hostel fee structure
 * @route   DELETE /api/fee-structure/hostel/:id
 * @access  Private
 */
export const deleteHostelFeeStructure = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const existingStructure = await prisma.hostelFeeStructure.findUnique({
      where: { id }
    })

    if (!existingStructure) {
      return res.status(404).json({
        success: false,
        message: 'Hostel fee structure not found'
      })
    }

    await prisma.hostelFeeStructure.delete({
      where: { id }
    })

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
})

/**
 * @desc    Toggle hostel fee structure active status
 * @route   PATCH /api/fee-structure/hostel/:id/toggle-status
 * @access  Private
 */
export const toggleHostelFeeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { updatedBy } = req.body

  if (!updatedBy) {
    return res.status(400).json({
      success: false,
      message: 'updatedBy is required'
    })
  }

  try {
    const existingStructure = await prisma.hostelFeeStructure.findUnique({
      where: { id }
    })

    if (!existingStructure) {
      return res.status(404).json({
        success: false,
        message: 'Hostel fee structure not found'
      })
    }

    const updatedStructure = await prisma.hostelFeeStructure.update({
      where: { id },
      data: {
        isActive: !existingStructure.isActive,
        updatedBy,
        updatedAt: new Date()
      }
    })

    const response = {
      ...updatedStructure,
      className: mapEnumToDisplayName(updatedStructure.className),
      termAmount: updatedStructure.totalAnnualFee / updatedStructure.totalTerms
    }

    res.status(200).json({
      success: true,
      data: response,
      message: `Hostel fee structure ${updatedStructure.isActive ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    console.error('Error toggling hostel fee structure status:', error)
    res.status(500).json({
      success: false,
      message: 'Error toggling hostel fee structure status',
      error: error.message
    })
  }
})