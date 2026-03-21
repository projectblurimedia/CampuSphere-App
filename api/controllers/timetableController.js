import prisma from '../lib/prisma.js'
import asyncHandler from 'express-async-handler'
import xlsx from 'xlsx'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import {
  mapClassToEnum,
  mapEnumToDisplayName,
  validateSection
} from '../utils/classMappings.js'

// ==================== MULTER CONFIGURATION ====================

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
    const allowedTypes = /xlsx|xls/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.mimetype === 'application/vnd.ms-excel'
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only Excel files are allowed'))
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
})

// ==================== HELPER FUNCTIONS ====================

const cleanupTempFiles = (file) => {
  if (file && file.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path)
  }
}

const sortDays = (timetables) => {
  const dayOrder = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 7
  }
  return timetables.sort((a, b) => dayOrder[a.day] - dayOrder[b.day])
}

const validateTimings = (timings) => {
  const regex = /^\d{1,2}:\d{2}\s*(AM|PM)?\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)?$/i
  return regex.test(timings)
}

const validateSlotsStructure = (slots) => {
  if (!Array.isArray(slots)) return false
  
  return slots.every(slot => {
    // For breaks, sno is optional and subject is not required
    if (slot.isBreak) {
      return (
        typeof slot.timings === 'string' &&
        (slot.sno === undefined || slot.sno === null) &&
        (slot.breakType === undefined || slot.breakType === null || ['LUNCH', 'SHORT_BREAK', 'ASSEMBLY'].includes(slot.breakType))
      )
    }
    
    // For periods, sno is required
    return (
      typeof slot.sno === 'number' &&
      typeof slot.subject === 'string' &&
      typeof slot.timings === 'string' &&
      (slot.teacherName === undefined || slot.teacherName === null || typeof slot.teacherName === 'string') &&
      slot.isBreak === false
    )
  })
}

// Reset sno only for periods, remove sno from breaks
const formatDaySlots = (slots) => {
  if (!slots || slots.length === 0) return []
  
  // Sort by original order first
  const sortedSlots = [...slots].sort((a, b) => {
    // If both are periods, sort by sno
    if (!a.isBreak && !b.isBreak) {
      return (a.sno || 0) - (b.sno || 0)
    }
    // If one is break, maintain order based on original array position
    return 0
  })
  
  let periodCounter = 1
  const formattedSlots = []
  
  sortedSlots.forEach(slot => {
    if (slot.isBreak) {
      // Break: no sno, keep other fields
      formattedSlots.push({
        subject: slot.subject || 'Break',
        timings: slot.timings,
        isBreak: true,
        breakType: slot.breakType || null
      })
    } else {
      // Period: assign sequential sno
      formattedSlots.push({
        sno: periodCounter++,
        subject: slot.subject,
        timings: slot.timings,
        teacherName: slot.teacherName || null,
        isBreak: false
      })
    }
  })
  
  return formattedSlots
}

// ==================== CONTROLLER FUNCTIONS ====================

export const getClassesAndSections = asyncHandler(async (req, res) => {
  try {
    const classGroups = await prisma.timetable.groupBy({
      by: ['class', 'section'],
      orderBy: [
        { class: 'asc' },
        { section: 'asc' }
      ]
    })

    if (classGroups.length === 0) {
      return res.status(200).json({
        success: true,
        data: {}
      })
    }

    const classSections = {}
    const classOrder = [
      'Pre-Nursery',
      'Nursery',
      'LKG',
      'UKG',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10'
    ]

    classGroups.forEach(item => {
      const classLabel = mapEnumToDisplayName(item.class)
      const section = item.section

      if (!classLabel) return

      if (!classSections[classLabel]) {
        classSections[classLabel] = new Set()
      }
      classSections[classLabel].add(section)
    })

    const result = {}
    
    const sortedClasses = Object.keys(classSections).sort((a, b) => {
      const aIndex = classOrder.indexOf(a)
      const bIndex = classOrder.indexOf(b)
      return (aIndex !== -1 ? aIndex : Infinity) - (bIndex !== -1 ? bIndex : Infinity)
    })

    sortedClasses.forEach(className => {
      result[className] = Array.from(classSections[className]).sort()
    })

    res.status(200).json({
      success: true,
      data: result,
      count: Object.keys(result).length
    })
  } catch (error) {
    console.error('Get classes and sections error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get classes and sections'
    })
  }
})

export const getTimetableForClassSection = asyncHandler(async (req, res) => {
  const { class: className, section } = req.query
  
  if (!className || !section) {
    return res.status(400).json({
      success: false,
      message: 'Class and section are required'
    })
  }
  
  try {
    const classEnum = mapClassToEnum(className)
    const sectionEnum = validateSection(section)
    
    if (!classEnum || !sectionEnum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class or section'
      })
    }
    
    const timetables = await prisma.timetable.findMany({
      where: {
        class: classEnum,
        section: sectionEnum
      },
      orderBy: {
        day: 'asc'
      }
    })
    
    const sortedTimetables = sortDays(timetables)
    
    // Format each day's slots - periods get sequential sno, breaks have no sno
    const formattedTimetable = sortedTimetables.map(day => {
      const slots = typeof day.slots === 'string' ? JSON.parse(day.slots) : day.slots
      
      return {
        day: day.day,
        slots: formatDaySlots(slots)
      }
    })

    res.status(200).json({
      success: true,
      data: {
        className: mapEnumToDisplayName(classEnum) || className,
        section: sectionEnum,
        timetable: formattedTimetable
      }
    })
  } catch (error) {
    console.error('Error fetching timetable:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching timetable',
      error: error.message
    })
  }
})

export const bulkImportTimetable = [
  upload.single('excelFile'),
  asyncHandler(async (req, res) => {
    console.log('=== TIMETABLE BULK IMPORT STARTED (ULTRA FAST) ===')
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
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Uploaded file not found on server'
        })
      }
      
      // STEP 1: Parse Excel file
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
          message: 'Excel file is empty. Please add timetable data to the template.'
        })
      }
      
      // STEP 2: Pre-fetch all existing timetables
      const existingTimetables = await prisma.timetable.findMany({
        select: {
          class: true,
          section: true,
          day: true,
          id: true,
          slots: true
        }
      })
      
      // Create lookup maps for existing timetables
      const existingTimetableMap = new Map()
      existingTimetables.forEach(t => {
        const key = `${t.class}_${t.section}_${t.day}`
        existingTimetableMap.set(key, {
          id: t.id,
          slots: typeof t.slots === 'string' ? JSON.parse(t.slots) : t.slots
        })
      })
      
      // STEP 3: Validate and prepare data in memory
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const timetablesMap = new Map() // Key: class_section_day -> { class, section, day, slots: [] }
      const errors = []
      
      for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2
        
        try {
          // Skip empty rows
          if (!row.class && !row.section && !row.day) {
            continue
          }
          
          // Validate required fields based on type
          const typeInput = row.type?.toString().toLowerCase().trim()
          
          if (!typeInput || (typeInput !== 'period' && typeInput !== 'break')) {
            errors.push({
              row: rowNumber,
              class: row.class || 'N/A',
              section: row.section || 'N/A',
              day: row.day || 'N/A',
              error: `Invalid type: ${row.type}. Must be 'period' or 'break'`,
              type: 'invalid_type'
            })
            continue
          }
          
          // Validate class
          const className = row.class?.toString().trim()
          if (!className) {
            errors.push({
              row: rowNumber,
              class: 'N/A',
              section: row.section || 'N/A',
              day: row.day || 'N/A',
              error: 'Missing required field: class',
              type: 'missing_field'
            })
            continue
          }
          
          const classEnum = mapClassToEnum(className)
          if (!classEnum) {
            errors.push({
              row: rowNumber,
              class: className,
              section: row.section || 'N/A',
              day: row.day || 'N/A',
              error: `Invalid class: ${className}. Must be one of: Pre-Nursery, Nursery, LKG, UKG, 1-10`,
              type: 'invalid_class'
            })
            continue
          }
          
          // Validate section
          const sectionInput = row.section?.toString().toUpperCase().trim()
          if (!sectionInput) {
            errors.push({
              row: rowNumber,
              class: className,
              section: 'N/A',
              day: row.day || 'N/A',
              error: 'Missing required field: section',
              type: 'missing_field'
            })
            continue
          }
          
          const sectionEnum = validateSection(sectionInput)
          if (!sectionEnum) {
            errors.push({
              row: rowNumber,
              class: className,
              section: sectionInput,
              day: row.day || 'N/A',
              error: `Invalid section: ${sectionInput}. Must be one of: A, B, C, D, E`,
              type: 'invalid_section'
            })
            continue
          }
          
          // Validate day
          const dayInput = row.day?.toString().trim()
          if (!dayInput) {
            errors.push({
              row: rowNumber,
              class: className,
              section: sectionInput,
              day: 'N/A',
              error: 'Missing required field: day',
              type: 'missing_field'
            })
            continue
          }
          
          const dayCapitalized = dayInput.charAt(0).toUpperCase() + dayInput.slice(1).toLowerCase()
          if (!validDays.includes(dayCapitalized)) {
            errors.push({
              row: rowNumber,
              class: className,
              section: sectionInput,
              day: dayInput,
              error: `Invalid day: ${dayInput}. Must be one of: ${validDays.join(', ')}`,
              type: 'invalid_day'
            })
            continue
          }
          
          // Validate timings
          const timings = row.timings?.toString().trim()
          if (!timings) {
            errors.push({
              row: rowNumber,
              class: className,
              section: sectionInput,
              day: dayCapitalized,
              error: 'Missing required field: timings',
              type: 'missing_field'
            })
            continue
          }
          
          if (!validateTimings(timings)) {
            errors.push({
              row: rowNumber,
              class: className,
              section: sectionInput,
              day: dayCapitalized,
              error: `Invalid timings format: ${timings}. Example: 9:00 AM - 10:00 AM`,
              type: 'invalid_timings'
            })
            continue
          }
          
          // Validate period-specific fields
          let sno = null
          let subject = ''
          let teacherName = null
          let breakType = null
          
          if (typeInput === 'period') {
            // Validate sno
            const snoValue = row.sno
            if (!snoValue) {
              errors.push({
                row: rowNumber,
                class: className,
                section: sectionInput,
                day: dayCapitalized,
                error: 'Missing required field: sno for period',
                type: 'missing_field'
              })
              continue
            }
            
            sno = parseInt(snoValue)
            if (isNaN(sno) || sno <= 0) {
              errors.push({
                row: rowNumber,
                class: className,
                section: sectionInput,
                day: dayCapitalized,
                error: `Invalid sno: ${snoValue}. Must be a positive number.`,
                type: 'invalid_sno'
              })
              continue
            }
            
            // Validate subject
            subject = row.subject?.toString().trim()
            if (!subject) {
              errors.push({
                row: rowNumber,
                class: className,
                section: sectionInput,
                day: dayCapitalized,
                error: 'Missing required field: subject for period',
                type: 'missing_field'
              })
              continue
            }
            
            teacherName = row.teacherName ? row.teacherName.toString().trim() : null
          } else if (typeInput === 'break') {
            // Validate break type
            breakType = row.breakType?.toString().trim()
            if (!breakType) {
              errors.push({
                row: rowNumber,
                class: className,
                section: sectionInput,
                day: dayCapitalized,
                error: 'Missing required field: breakType for break',
                type: 'missing_field'
              })
              continue
            }
            
            const validBreakTypes = ['LUNCH', 'SHORT_BREAK', 'ASSEMBLY']
            if (!validBreakTypes.includes(breakType)) {
              errors.push({
                row: rowNumber,
                class: className,
                section: sectionInput,
                day: dayCapitalized,
                error: `Invalid breakType: ${breakType}. Must be one of: ${validBreakTypes.join(', ')}`,
                type: 'invalid_break_type'
              })
              continue
            }
            
            subject = row.subject ? row.subject.toString().trim() : 'Break'
          }
          
          // Create unique key for this timetable
          const timetableKey = `${classEnum}_${sectionEnum}_${dayCapitalized}`
          
          // Get or create timetable entry
          if (!timetablesMap.has(timetableKey)) {
            timetablesMap.set(timetableKey, {
              class: classEnum,
              section: sectionEnum,
              day: dayCapitalized,
              slots: []
            })
          }
          
          const timetableEntry = timetablesMap.get(timetableKey)
          
          // Create slot object
          const slot = {
            timings: timings,
            isBreak: typeInput === 'break',
            ...(typeInput === 'period' && { sno: sno }),
            ...(typeInput === 'period' && { subject: subject }),
            ...(typeInput === 'period' && teacherName && { teacherName: teacherName }),
            ...(typeInput === 'break' && { subject: subject }),
            ...(typeInput === 'break' && { breakType: breakType })
          }
          
          timetableEntry.slots.push(slot)
          
        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          errors.push({
            row: rowNumber,
            class: row.class || 'N/A',
            section: row.section || 'N/A',
            day: row.day || 'N/A',
            error: error.message || 'Processing error',
            type: 'processing_error'
          })
        }
      }
      
      // If there are validation errors, return early
      if (errors.length > 0) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: `Validation failed. ${errors.length} rows have errors.`,
          summary: {
            totalRows: rows.length,
            timetablesProcessed: 0,
            totalSlots: 0,
            errors: errors.slice(0, 100)
          }
        })
      }
      
      // STEP 4: Format and validate all timetables
      const timetablesToUpsert = []
      let totalSlots = 0
      
      for (const [key, timetable] of timetablesMap) {
        // Format slots - periods get sequential sno, breaks have no sno
        const formattedSlots = formatDaySlots(timetable.slots)
        totalSlots += formattedSlots.length
        
        // Validate slots structure
        if (!validateSlotsStructure(formattedSlots)) {
          cleanupTempFiles(req.file)
          return res.status(400).json({
            success: false,
            message: `Invalid slots structure for ${timetable.class} - ${timetable.section} - ${timetable.day}`,
            summary: {
              totalRows: rows.length,
              timetablesProcessed: 0,
              totalSlots: 0,
              errors: [{
                row: 0,
                class: mapEnumToDisplayName(timetable.class),
                section: timetable.section,
                day: timetable.day,
                error: 'Invalid slots structure after formatting',
                type: 'validation_error'
              }]
            }
          })
        }
        
        timetablesToUpsert.push({
          key: key,
          class: timetable.class,
          section: timetable.section,
          day: timetable.day,
          slots: formattedSlots,
          existingId: existingTimetableMap.get(key)?.id || null
        })
      }
      
      console.log(`Validation passed. Found ${timetablesToUpsert.length} unique timetables with ${totalSlots} total slots`)
      
      // STEP 5: Batch process upserts using transactions
      const BATCH_SIZE = 50 // Increased from 5 to 50 for better performance
      let upsertedCount = 0
      const upsertErrors = []
      
      // Prepare operations for each batch
      for (let i = 0; i < timetablesToUpsert.length; i += BATCH_SIZE) {
        const batch = timetablesToUpsert.slice(i, i + BATCH_SIZE)
        
        try {
          // Execute all upserts in a single transaction for this batch
          const operations = batch.map(timetable => {
            return prisma.timetable.upsert({
              where: {
                class_section_day: {
                  class: timetable.class,
                  section: timetable.section,
                  day: timetable.day
                }
              },
              update: {
                slots: JSON.stringify(timetable.slots),
                updatedAt: new Date()
              },
              create: {
                class: timetable.class,
                section: timetable.section,
                day: timetable.day,
                slots: JSON.stringify(timetable.slots)
              }
            })
          })
          
          // Execute batch in parallel with Promise.all
          const results = await Promise.all(operations)
          upsertedCount += results.length
          
          console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} completed: ${results.length} timetables upserted`)
          
        } catch (batchError) {
          console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, batchError)
          
          // If batch fails, try individual upserts to identify which ones failed
          for (const timetable of batch) {
            try {
              await prisma.timetable.upsert({
                where: {
                  class_section_day: {
                    class: timetable.class,
                    section: timetable.section,
                    day: timetable.day
                  }
                },
                update: {
                  slots: JSON.stringify(timetable.slots),
                  updatedAt: new Date()
                },
                create: {
                  class: timetable.class,
                  section: timetable.section,
                  day: timetable.day,
                  slots: JSON.stringify(timetable.slots)
                }
              })
              upsertedCount++
            } catch (upsertError) {
              console.error(`Failed to upsert ${timetable.key}:`, upsertError)
              upsertErrors.push({
                timetable: `${mapEnumToDisplayName(timetable.class)} - ${timetable.section} - ${timetable.day}`,
                error: upsertError.message
              })
            }
          }
        }
      }
      
      const endTime = Date.now()
      const executionTime = ((endTime - startTime) / 1000).toFixed(2)
      
      console.log(`✅ Timetable bulk import completed in ${executionTime} seconds`)
      console.log(`   Upserted: ${upsertedCount}/${timetablesToUpsert.length} timetables, ${totalSlots} slots`)
      console.log(`   Errors: ${upsertErrors.length}`)
      
      cleanupTempFiles(req.file)
      
      const response = {
        success: upsertErrors.length === 0,
        message: upsertErrors.length === 0 
          ? `Bulk import completed successfully. Upserted ${upsertedCount} timetables with ${totalSlots} slots.`
          : `Import completed with ${upsertErrors.length} errors. ${upsertedCount} timetables were successfully upserted.`,
        summary: {
          totalRows: rows.length,
          timetablesProcessed: timetablesToUpsert.length,
          timetablesUpserted: upsertedCount,
          totalSlots: totalSlots,
          executionTimeSeconds: parseFloat(executionTime)
        }
      }
      
      if (upsertErrors.length > 0) {
        response.errors = upsertErrors.slice(0, 100)
      }
      
      res.status(upsertErrors.length > 0 ? 207 : 200).json(response)
      
    } catch (error) {
      console.error('Bulk import error:', error)
      cleanupTempFiles(req.file)
      
      res.status(500).json({
        success: false,
        message: error.message || 'Bulk import failed due to server error',
        summary: {
          totalRows: 0,
          timetablesProcessed: 0,
          timetablesUpserted: 0,
          totalSlots: 0,
          errors: [{
            error: error.message || 'Internal server error',
            type: 'server_error'
          }]
        }
      })
    }
  })
]