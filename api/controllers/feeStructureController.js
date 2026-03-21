import prisma from '../lib/prisma.js'
import asyncHandler from 'express-async-handler'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import xlsx from 'xlsx'
import {
  mapClassToEnum,
  mapEnumToDisplayName,
  getClassOrder
} from '../utils/classMappings.js'

const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = 'temp/uploads/'
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    cb(null, tempDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({ 
  storage: tempStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|xlsx|xls/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.mimetype === 'application/vnd.ms-excel' ||
                    file.mimetype.startsWith('image/')
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image and Excel files are allowed'))
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
})

const cleanupTempFiles = (files) => {
  if (!files) return
  
  if (Array.isArray(files)) {
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
    })
  } else if (files.path && fs.existsSync(files.path)) {
    fs.unlinkSync(files.path)
  }
}

const validateFeeValue = (value, fieldName) => {
  const num = Number(value)
  if (isNaN(num) || num < 0) {
    return { valid: false, message: `${fieldName} must be a non-negative number` }
  }
  return { valid: true, value: num }
}

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

    const calculatedTotal = Number(tuitionFee) + Number(examFee) + Number(activityFee) + 
                           Number(booksFee) + Number(sportsFee) + Number(labFee) + 
                           Number(computerFee) + Number(otherCharges)

    if (calculatedTotal !== Number(totalAnnualFee)) {
      return res.status(400).json({
        success: false,
        message: `Component total (${calculatedTotal}) does not match totalAnnualFee (${totalAnnualFee})`,
        data: { calculatedTotal, providedTotal: totalAnnualFee }
      })
    }

    const feeStructure = await prisma.classFeeStructure.create({
      data: {
        className: classEnum,
        totalAnnualFee: Number(totalAnnualFee),
        tuitionFee: Number(tuitionFee),
        examFee: Number(examFee),
        activityFee: Number(activityFee),
        booksFee: Number(booksFee),
        sportsFee: Number(sportsFee),
        labFee: Number(labFee),
        computerFee: Number(computerFee),
        otherCharges: Number(otherCharges),
        description,
        createdBy,
        updatedBy: createdBy
      }
    })

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

export const bulkCreateClassFeeStructures = [
  upload.single('file'),
  asyncHandler(async (req, res) => {
    console.log('=== BULK CLASS FEE STRUCTURES IMPORT STARTED (ULTRA FAST) ===')
    const startTime = Date.now()
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Please select a file.'
        })
      }

      console.log('File received:', req.file.originalname)
      console.log('File size:', req.file.size, 'bytes')

      if (!fs.existsSync(req.file.path)) {
        return res.status(400).json({
          success: false,
          message: 'Uploaded file not found on server'
        })
      }

      // Parse Excel file
      let workbook, rows
      try {
        workbook = xlsx.readFile(req.file.path)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        rows = xlsx.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
          blankrows: false
        })
        console.log('Rows found in Excel:', rows.length)
      } catch (excelError) {
        console.error('Excel read error:', excelError)
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Invalid Excel file format. Please use the provided template.',
          error: process.env.NODE_ENV === 'development' ? excelError.message : undefined
        })
      }

      if (rows.length === 0) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty. Please add class fee structure data to the template.'
        })
      }

      const createdBy = req.body.createdBy || 'system'
      const updatedBy = createdBy

      // STEP 1: PRE-FETCH ALL EXISTING CLASS FEE STRUCTURES
      const existingStructures = await prisma.classFeeStructure.findMany({
        where: { isActive: true },
        select: { className: true }
      })
      
      const existingClassNames = new Set(
        existingStructures.map(s => s.className)
      )

      // STEP 2: VALIDATE AND PREPARE DATA IN MEMORY
      const structuresToCreate = []
      const errors = []
      
      for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2
        
        try {
          // Skip empty rows
          if (!row.className && !row.tuitionFee && !row.examFee && !row.activityFee && 
              !row.booksFee && !row.sportsFee && !row.labFee && !row.computerFee && !row.otherCharges) {
            continue
          }

          // Validate required fields
          if (!row.className || row.className.toString().trim() === '') {
            errors.push({
              row: rowNumber,
              className: 'N/A',
              error: 'Missing required field: className'
            })
            continue
          }

          const className = row.className.toString().trim()
          const classEnum = mapClassToEnum(className)
          
          if (!classEnum) {
            errors.push({
              row: rowNumber,
              className,
              error: `Invalid class name: "${className}". Valid: Pre-Nursery, Nursery, LKG, UKG, 1-10`
            })
            continue
          }

          // Check for duplicate (existing in DB or within same file)
          if (existingClassNames.has(classEnum) || 
              structuresToCreate.some(s => s.className === classEnum)) {
            errors.push({
              row: rowNumber,
              className,
              error: `Active fee structure already exists for ${className}`
            })
            continue
          }

          // Parse fee components
          const tuitionFee = validateFeeValue(row.tuitionFee || 0, 'Tuition fee').value
          const examFee = validateFeeValue(row.examFee || 0, 'Exam fee').value
          const activityFee = validateFeeValue(row.activityFee || 0, 'Activity fee').value
          const booksFee = validateFeeValue(row.booksFee || 0, 'Books fee').value
          const sportsFee = validateFeeValue(row.sportsFee || 0, 'Sports fee').value
          const labFee = validateFeeValue(row.labFee || 0, 'Lab fee').value
          const computerFee = validateFeeValue(row.computerFee || 0, 'Computer fee').value
          const otherCharges = validateFeeValue(row.otherCharges || 0, 'Other charges').value

          // Calculate total
          const calculatedTotal = tuitionFee + examFee + activityFee + 
                                  booksFee + sportsFee + labFee + 
                                  computerFee + otherCharges

          if (calculatedTotal <= 0) {
            errors.push({
              row: rowNumber,
              className,
              error: 'Total annual fee must be greater than 0. Please provide at least one fee component.'
            })
            continue
          }

          // Prepare data for bulk insert
          structuresToCreate.push({
            id: crypto.randomUUID(),
            className: classEnum,
            totalAnnualFee: calculatedTotal,
            tuitionFee,
            examFee,
            activityFee,
            booksFee,
            sportsFee,
            labFee,
            computerFee,
            otherCharges,
            description: row.description ? row.description.toString().trim() : null,
            createdBy,
            updatedBy,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })

          existingClassNames.add(classEnum) // Prevent duplicates within same file

        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          errors.push({
            row: rowNumber,
            className: row.className || 'N/A',
            error: error.message || 'Database error'
          })
        }
      }

      // STEP 3: EXECUTE BULK INSERT
      if (structuresToCreate.length > 0) {
        const chunkSize = 1000
        for (let i = 0; i < structuresToCreate.length; i += chunkSize) {
          const chunk = structuresToCreate.slice(i, i + chunkSize)
          await prisma.classFeeStructure.createMany({
            data: chunk,
            skipDuplicates: true
          })
        }
      }

      cleanupTempFiles(req.file)

      const endTime = Date.now()
      const executionTime = ((endTime - startTime) / 1000).toFixed(2)

      console.log(`✅ Bulk class fee import completed in ${executionTime} seconds`)
      console.log(`   Created: ${structuresToCreate.length}, Failed: ${errors.length}`)

      const response = {
        success: true,
        message: `Bulk import completed. ${structuresToCreate.length} class fee structures imported successfully.`,
        summary: {
          total: rows.length,
          success: structuresToCreate.length,
          failed: errors.length,
          executionTimeSeconds: parseFloat(executionTime)
        },
        data: structuresToCreate.map(s => ({
          id: s.id,
          className: mapEnumToDisplayName(s.className),
          totalAnnualFee: s.totalAnnualFee,
          feeComponents: {
            tuitionFee: s.tuitionFee,
            examFee: s.examFee,
            activityFee: s.activityFee,
            booksFee: s.booksFee,
            sportsFee: s.sportsFee,
            labFee: s.labFee,
            computerFee: s.computerFee,
            otherCharges: s.otherCharges
          }
        }))
      }

      if (errors.length > 0) {
        response.errors = errors.slice(0, 100)
        response.message += ` ${errors.length} records failed.`
      }

      res.status(errors.length > 0 ? 207 : 200).json(response)

    } catch (error) {
      console.error('Bulk import overall error:', error)
      cleanupTempFiles(req.file)
      res.status(500).json({
        success: false,
        message: 'Bulk import failed due to server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    }
  })
]


export const getClassFeeStructures = asyncHandler(async (req, res) => {
  const {
    className,
    isActive,
    page = 1,
    limit = 20,
    sortBy = 'className',
    sortOrder = 'asc'
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

    const totalCount = await prisma.classFeeStructure.count({ where: filter })

    const feeStructures = await prisma.classFeeStructure.findMany({
      where: filter,
      skip,
      take,
      orderBy: [
        {
          className: 'asc'
        }
      ]
    })

    const formattedData = feeStructures
      .map(structure => ({
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

    const formattedData = feeStructures
      .map(structure => ({
        ...structure,
        className: mapEnumToDisplayName(structure.className)
      }))
      .sort((a, b) => {
        const orderA = getClassOrder(a.className)
        const orderB = getClassOrder(b.className)
        return orderA - orderB
      })

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

    if (totalAnnualFee !== undefined) {
      const numValue = Number(totalAnnualFee)
      if (isNaN(numValue) || numValue <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Total annual fee must be greater than 0'
        })
      }
      updateData.totalAnnualFee = numValue
    }

    if (tuitionFee !== undefined) updateData.tuitionFee = Number(tuitionFee)
    if (examFee !== undefined) updateData.examFee = Number(examFee)
    if (activityFee !== undefined) updateData.activityFee = Number(activityFee)
    if (booksFee !== undefined) updateData.booksFee = Number(booksFee)
    if (sportsFee !== undefined) updateData.sportsFee = Number(sportsFee)
    if (labFee !== undefined) updateData.labFee = Number(labFee)
    if (computerFee !== undefined) updateData.computerFee = Number(computerFee)
    if (otherCharges !== undefined) updateData.otherCharges = Number(otherCharges)
    if (description !== undefined) updateData.description = description

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

      const calculatedTotal = Number(tuition) + Number(exam) + Number(activity) + 
                            Number(library) + Number(sports) + Number(lab) + 
                            Number(computer) + Number(other)

      if (calculatedTotal !== Number(total)) {
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

export const createBusFeeStructure = asyncHandler(async (req, res) => {
  const {
    villageName,
    distance = 0.0,
    feeAmount,
    description,
    createdBy
  } = req.body

  if (!villageName || !feeAmount || !createdBy) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      required: ['villageName', 'feeAmount', 'createdBy']
    })
  }

  const numFeeAmount = Number(feeAmount)
  const numDistance = Number(distance)

  if (isNaN(numFeeAmount) || numFeeAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Fee amount must be greater than 0'
    })
  }

  if (isNaN(numDistance) || numDistance < 0) {
    return res.status(400).json({
      success: false,
      message: 'Distance cannot be negative'
    })
  }

  try {
    const existingStructure = await prisma.busFeeStructure.findFirst({
      where: {
        villageName: {
          equals: villageName.trim(),
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
        distance: numDistance,
        feeAmount: numFeeAmount,
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

export const bulkCreateBusFeeStructures = [
  upload.single('file'),
  asyncHandler(async (req, res) => {
    console.log('=== BULK BUS FEE STRUCTURES IMPORT STARTED (ULTRA FAST) ===')
    const startTime = Date.now()
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Please select a file.'
        })
      }

      console.log('File received:', req.file.originalname)
      console.log('File size:', req.file.size, 'bytes')

      if (!fs.existsSync(req.file.path)) {
        return res.status(400).json({
          success: false,
          message: 'Uploaded file not found on server'
        })
      }

      // Parse Excel file
      let workbook, rows
      try {
        workbook = xlsx.readFile(req.file.path)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        rows = xlsx.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
          blankrows: false
        })
        console.log('Rows found in Excel:', rows.length)
      } catch (excelError) {
        console.error('Excel read error:', excelError)
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Invalid Excel file format.',
          error: process.env.NODE_ENV === 'development' ? excelError.message : undefined
        })
      }

      if (rows.length === 0) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty.'
        })
      }

      const createdBy = req.body.createdBy || 'system'
      const updatedBy = createdBy

      // STEP 1: PRE-FETCH ALL EXISTING BUS FEE STRUCTURES
      const existingStructures = await prisma.busFeeStructure.findMany({
        where: { isActive: true },
        select: { villageName: true }
      })
      
      const existingVillages = new Set(
        existingStructures.map(s => s.villageName.toLowerCase())
      )

      // STEP 2: VALIDATE AND PREPARE DATA IN MEMORY
      const structuresToCreate = []
      const errors = []
      
      for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2
        
        try {
          // Skip empty rows
          if (!row.villageName && !row.feeAmount && !row.distance) {
            continue
          }

          // Validate required fields
          if (!row.villageName || row.villageName.toString().trim() === '') {
            errors.push({
              row: rowNumber,
              villageName: 'N/A',
              error: 'Missing required field: villageName'
            })
            continue
          }

          const villageName = row.villageName.toString().trim()
          const villageKey = villageName.toLowerCase()
          
          // Check for duplicate (existing in DB or within same file)
          if (existingVillages.has(villageKey) || 
              structuresToCreate.some(s => s.villageName.toLowerCase() === villageKey)) {
            errors.push({
              row: rowNumber,
              villageName,
              error: `Active fee structure already exists for village: ${villageName}`
            })
            continue
          }

          // Parse fee amount
          let feeAmount = 0
          if (row.feeAmount) {
            const feeAmountValidation = validateFeeValue(row.feeAmount, 'Fee amount')
            if (!feeAmountValidation.valid) {
              errors.push({
                row: rowNumber,
                villageName,
                error: feeAmountValidation.message
              })
              continue
            }
            feeAmount = feeAmountValidation.value
          }

          if (feeAmount <= 0) {
            errors.push({
              row: rowNumber,
              villageName,
              error: 'Fee amount must be provided and greater than 0'
            })
            continue
          }

          // Parse distance
          const distance = validateFeeValue(row.distance || 0, 'Distance').value

          // Prepare data for bulk insert
          structuresToCreate.push({
            id: crypto.randomUUID(),
            villageName,
            distance,
            feeAmount,
            description: row.description ? row.description.toString().trim() : null,
            createdBy,
            updatedBy,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })

          existingVillages.add(villageKey) // Prevent duplicates within same file

        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          errors.push({
            row: rowNumber,
            villageName: row.villageName || 'N/A',
            error: error.message || 'Database error'
          })
        }
      }

      // STEP 3: EXECUTE BULK INSERT
      if (structuresToCreate.length > 0) {
        const chunkSize = 1000
        for (let i = 0; i < structuresToCreate.length; i += chunkSize) {
          const chunk = structuresToCreate.slice(i, i + chunkSize)
          await prisma.busFeeStructure.createMany({
            data: chunk,
            skipDuplicates: true
          })
        }
      }

      cleanupTempFiles(req.file)

      const endTime = Date.now()
      const executionTime = ((endTime - startTime) / 1000).toFixed(2)

      console.log(`✅ Bulk bus fee import completed in ${executionTime} seconds`)
      console.log(`   Created: ${structuresToCreate.length}, Failed: ${errors.length}`)

      const response = {
        success: true,
        message: `Bulk import completed. ${structuresToCreate.length} bus fee structures imported successfully.`,
        summary: {
          total: rows.length,
          success: structuresToCreate.length,
          failed: errors.length,
          executionTimeSeconds: parseFloat(executionTime)
        },
        data: structuresToCreate.map(s => ({
          id: s.id,
          villageName: s.villageName,
          feeAmount: s.feeAmount,
          distance: s.distance
        }))
      }

      if (errors.length > 0) {
        response.errors = errors.slice(0, 100)
        response.message += ` ${errors.length} records failed.`
      }

      res.status(errors.length > 0 ? 207 : 200).json(response)

    } catch (error) {
      console.error('Bulk import overall error:', error)
      cleanupTempFiles(req.file)
      res.status(500).json({
        success: false,
        message: 'Bulk import failed due to server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    }
  })
]

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
      const numDistance = Number(distance)
      if (isNaN(numDistance) || numDistance < 0) {
        return res.status(400).json({
          success: false,
          message: 'Distance must be a non-negative number'
        })
      }
      updateData.distance = numDistance
    }
    
    if (feeAmount !== undefined) {
      const numFeeAmount = Number(feeAmount)
      if (isNaN(numFeeAmount) || numFeeAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Fee amount must be greater than 0'
        })
      }
      updateData.feeAmount = numFeeAmount
    }
    
    if (description !== undefined) updateData.description = description

    if (villageName && villageName.toLowerCase() !== existingStructure.villageName.toLowerCase()) {
      const duplicate = await prisma.busFeeStructure.findFirst({
        where: {
          villageName: {
            equals: villageName.trim(),
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

export const createHostelFeeStructure = asyncHandler(async (req, res) => {
  const {
    className,
    totalAnnualFee,
    totalTerms = 3,
    description,
    createdBy
  } = req.body

  if (!className || !totalAnnualFee || !createdBy) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      required: ['className', 'totalAnnualFee', 'createdBy']
    })
  }

  const numTotalAnnualFee = Number(totalAnnualFee)
  const numTotalTerms = Number(totalTerms)

  if (isNaN(numTotalAnnualFee) || numTotalAnnualFee <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Total annual fee must be greater than 0'
    })
  }

  if (isNaN(numTotalTerms) || numTotalTerms < 1 || numTotalTerms > 4) {
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
        totalAnnualFee: numTotalAnnualFee,
        totalTerms: numTotalTerms,
        description,
        createdBy,
        updatedBy: createdBy
      }
    })

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

export const bulkCreateHostelFeeStructures = [
  upload.single('file'),
  asyncHandler(async (req, res) => {
    console.log('=== BULK HOSTEL FEE STRUCTURES IMPORT STARTED (ULTRA FAST) ===')
    const startTime = Date.now()
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Please select a file.'
        })
      }

      console.log('File received:', req.file.originalname)
      console.log('File size:', req.file.size, 'bytes')

      if (!fs.existsSync(req.file.path)) {
        return res.status(400).json({
          success: false,
          message: 'Uploaded file not found on server'
        })
      }

      // Parse Excel file
      let workbook, rows
      try {
        workbook = xlsx.readFile(req.file.path)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        rows = xlsx.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
          blankrows: false
        })
        console.log('Rows found in Excel:', rows.length)
      } catch (excelError) {
        console.error('Excel read error:', excelError)
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Invalid Excel file format.',
          error: process.env.NODE_ENV === 'development' ? excelError.message : undefined
        })
      }

      if (rows.length === 0) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty.'
        })
      }

      const createdBy = req.body.createdBy || 'system'
      const updatedBy = createdBy

      // STEP 1: PRE-FETCH ALL EXISTING HOSTEL FEE STRUCTURES
      const existingStructures = await prisma.hostelFeeStructure.findMany({
        where: { isActive: true },
        select: { className: true }
      })
      
      const existingClassNames = new Set(
        existingStructures.map(s => s.className)
      )

      // STEP 2: VALIDATE AND PREPARE DATA IN MEMORY
      const structuresToCreate = []
      const errors = []
      
      for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2
        
        try {
          // Skip empty rows
          if (!row.className && !row.totalAnnualFee) {
            continue
          }

          // Validate required fields
          if (!row.className || row.className.toString().trim() === '') {
            errors.push({
              row: rowNumber,
              className: 'N/A',
              error: 'Missing required field: className'
            })
            continue
          }

          const className = row.className.toString().trim()
          const classEnum = mapClassToEnum(className)
          
          if (!classEnum) {
            errors.push({
              row: rowNumber,
              className,
              error: `Invalid class name: "${className}". Valid: Pre-Nursery, Nursery, LKG, UKG, 1-10`
            })
            continue
          }

          // Check for duplicate (existing in DB or within same file)
          if (existingClassNames.has(classEnum) || 
              structuresToCreate.some(s => s.className === classEnum)) {
            errors.push({
              row: rowNumber,
              className,
              error: `Active hostel fee structure already exists for ${className}`
            })
            continue
          }

          // Parse total annual fee
          let totalAnnualFee = 0
          if (row.totalAnnualFee) {
            const totalAnnualFeeValidation = validateFeeValue(row.totalAnnualFee, 'Total annual fee')
            if (!totalAnnualFeeValidation.valid) {
              errors.push({
                row: rowNumber,
                className,
                error: totalAnnualFeeValidation.message
              })
              continue
            }
            totalAnnualFee = totalAnnualFeeValidation.value
          }

          if (totalAnnualFee <= 0) {
            errors.push({
              row: rowNumber,
              className,
              error: 'Total annual fee must be provided and greater than 0'
            })
            continue
          }

          // Parse total terms (default to 3)
          let totalTerms = 3
          if (row.totalTerms) {
            const termsValidation = validateFeeValue(row.totalTerms, 'Total terms')
            if (!termsValidation.valid) {
              errors.push({
                row: rowNumber,
                className,
                error: termsValidation.message
              })
              continue
            }
            totalTerms = termsValidation.value
          }

          if (totalTerms < 1 || totalTerms > 4) {
            errors.push({
              row: rowNumber,
              className,
              error: 'Total terms must be between 1 and 4'
            })
            continue
          }

          // Prepare data for bulk insert
          structuresToCreate.push({
            id: crypto.randomUUID(),
            className: classEnum,
            totalAnnualFee,
            totalTerms,
            description: row.description ? row.description.toString().trim() : null,
            createdBy,
            updatedBy,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })

          existingClassNames.add(classEnum) // Prevent duplicates within same file

        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          errors.push({
            row: rowNumber,
            className: row.className || 'N/A',
            error: error.message || 'Database error'
          })
        }
      }

      // STEP 3: EXECUTE BULK INSERT
      if (structuresToCreate.length > 0) {
        const chunkSize = 1000
        for (let i = 0; i < structuresToCreate.length; i += chunkSize) {
          const chunk = structuresToCreate.slice(i, i + chunkSize)
          await prisma.hostelFeeStructure.createMany({
            data: chunk,
            skipDuplicates: true
          })
        }
      }

      cleanupTempFiles(req.file)

      const endTime = Date.now()
      const executionTime = ((endTime - startTime) / 1000).toFixed(2)

      console.log(`✅ Bulk hostel fee import completed in ${executionTime} seconds`)
      console.log(`   Created: ${structuresToCreate.length}, Failed: ${errors.length}`)

      const response = {
        success: true,
        message: `Bulk import completed. ${structuresToCreate.length} hostel fee structures imported successfully.`,
        summary: {
          total: rows.length,
          success: structuresToCreate.length,
          failed: errors.length,
          executionTimeSeconds: parseFloat(executionTime)
        },
        data: structuresToCreate.map(s => ({
          id: s.id,
          className: mapEnumToDisplayName(s.className),
          totalAnnualFee: s.totalAnnualFee,
          totalTerms: s.totalTerms,
          termAmount: s.totalAnnualFee / s.totalTerms
        }))
      }

      if (errors.length > 0) {
        response.errors = errors.slice(0, 100)
        response.message += ` ${errors.length} records failed.`
      }

      res.status(errors.length > 0 ? 207 : 200).json(response)

    } catch (error) {
      console.error('Bulk import overall error:', error)
      cleanupTempFiles(req.file)
      res.status(500).json({
        success: false,
        message: 'Bulk import failed due to server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    }
  })
]

export const getHostelFeeStructures = asyncHandler(async (req, res) => {
  const {
    className,
    isActive,
    page = 1,
    limit = 20,
    sortBy = 'className',
    sortOrder = 'asc'
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
      orderBy: [
        {
          className: 'asc'
        }
      ]
    })

    const formattedData = feeStructures
      .map(structure => ({
        ...structure,
        className: mapEnumToDisplayName(structure.className),
        termAmount: structure.totalAnnualFee / structure.totalTerms
      }))
      .sort((a, b) => {
        const orderA = getClassOrder(a.className)
        const orderB = getClassOrder(b.className)
        return orderA - orderB
      })

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

    const formattedData = feeStructures
      .map(structure => ({
        ...structure,
        className: mapEnumToDisplayName(structure.className),
        termAmount: structure.totalAnnualFee / structure.totalTerms
      }))
      .sort((a, b) => {
        const orderA = getClassOrder(a.className)
        const orderB = getClassOrder(b.className)
        return orderA - orderB
      })

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
      const numValue = Number(totalAnnualFee)
      if (isNaN(numValue) || numValue <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Total annual fee must be greater than 0'
        })
      }
      updateData.totalAnnualFee = numValue
    }

    if (totalTerms !== undefined) {
      const numValue = Number(totalTerms)
      if (isNaN(numValue) || numValue < 1 || numValue > 4) {
        return res.status(400).json({
          success: false,
          message: 'Total terms must be between 1 and 4'
        })
      }
      updateData.totalTerms = numValue
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