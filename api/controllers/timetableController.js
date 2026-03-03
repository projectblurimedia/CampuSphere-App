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
    console.log('=== TIMETABLE BULK IMPORT STARTED ===')
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Please select a file.'
        })
      }
      
      console.log('File received:', req.file.originalname)
      
      if (!fs.existsSync(req.file.path)) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Uploaded file not found on server'
        })
      }
      
      let workbook, data
      try {
        workbook = xlsx.readFile(req.file.path)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        data = xlsx.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
          blankrows: false
        })
        
        console.log('Rows found in Excel:', data.length)
        
      } catch (excelError) {
        console.error('Excel read error:', excelError)
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Invalid Excel file format. Please use the provided template.'
        })
      }
      
      if (data.length === 0) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty. Please add timetable data to the template.'
        })
      }
      
      const errors = []
      const validTimetables = new Map() // Key: classEnum_section_day
      const processedCount = 0
      
      // First pass: Validate all rows and collect unique class-section-day combinations
      for (const [index, row] of data.entries()) {
        const rowNumber = index + 2
        
        try {
          // Skip empty rows
          if (!row.class && !row.section && !row.day) {
            continue
          }
          
          // Validate required fields based on type
          const requiredFields = ['class', 'section', 'day', 'type', 'timings']
          const typeInput = row.type?.toString().toLowerCase().trim()
          
          if (typeInput === 'period') {
            requiredFields.push('sno', 'subject')
          } else if (typeInput === 'break') {
            // Break doesn't require sno or subject
            requiredFields.push('breakType')
          } else {
            // Invalid type
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
          
          const missingFields = requiredFields.filter(field => {
            const value = row[field]
            return !value || value.toString().trim() === ''
          })
          
          if (missingFields.length > 0) {
            errors.push({
              row: rowNumber,
              class: row.class || 'N/A',
              section: row.section || 'N/A',
              day: row.day || 'N/A',
              error: `Missing required fields: ${missingFields.join(', ')}`,
              type: 'missing_fields'
            })
            continue
          }
          
          // Validate sno only for periods
          if (typeInput === 'period') {
            const sno = parseInt(row.sno)
            if (isNaN(sno) || sno <= 0) {
              errors.push({
                row: rowNumber,
                class: row.class,
                section: row.section,
                day: row.day,
                error: `Invalid sno: ${row.sno}. Must be a positive number.`,
                type: 'invalid_sno'
              })
              continue
            }
          }
          
          // Trim and validate inputs
          const className = row.class.toString().trim()
          const sectionInput = row.section.toString().toUpperCase().trim()
          const dayInput = row.day.toString().trim()
          const dayCapitalized = dayInput.charAt(0).toUpperCase() + dayInput.slice(1).toLowerCase()
          const subject = row.subject ? row.subject.toString().trim() : ''
          const timings = row.timings.toString().trim()
          const teacherName = row.teacherName ? row.teacherName.toString().trim() : null
          const breakType = row.breakType ? row.breakType.toString().trim() : null
          
          // Validate day
          const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
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
          if (!validateTimings(timings)) {
            errors.push({
              row: rowNumber,
              class: className,
              section: sectionInput,
              day: dayInput,
              error: `Invalid timings format: ${timings}. Example: 9:00 AM - 10:00 AM`,
              type: 'invalid_timings'
            })
            continue
          }
          
          // Map class and section to enums using the utility functions
          const classEnum = mapClassToEnum(className)
          const sectionEnum = validateSection(sectionInput)
          
          if (!classEnum) {
            errors.push({
              row: rowNumber,
              class: className,
              section: sectionInput,
              day: dayInput,
              error: `Invalid class: ${className}. Must be one of: Pre-Nursery, Nursery, LKG, UKG, 1-10`,
              type: 'invalid_class'
            })
            continue
          }
          
          if (!sectionEnum) {
            errors.push({
              row: rowNumber,
              class: className,
              section: sectionInput,
              day: dayInput,
              error: `Invalid section: ${sectionInput}. Must be one of: A, B, C, D, E`,
              type: 'invalid_section'
            })
            continue
          }
          
          // Debug log to see what's being mapped
          console.log(`Row ${rowNumber}: ${className} -> ${classEnum}, ${sectionInput} -> ${sectionEnum}, Day: ${dayCapitalized}`)
          
          // Create unique key using the enum values
          const timetableKey = `${classEnum}_${sectionEnum}_${dayCapitalized}`
          
          // Initialize timetable entry if not exists
          if (!validTimetables.has(timetableKey)) {
            validTimetables.set(timetableKey, {
              class: classEnum, // This is the actual enum value like 'CLASS_1' or 'NURSERY'
              section: sectionEnum, // This is the section letter like 'A'
              day: dayCapitalized, // This is the day like 'Monday'
              slots: []
            })
          }
          
          // Get the timetable entry
          const timetableEntry = validTimetables.get(timetableKey)
          
          // Create slot object - sno only for periods
          const slot = {
            ...(typeInput === 'period' && { sno: parseInt(row.sno) }),
            subject: subject || (typeInput === 'break' ? 'Break' : ''),
            timings: timings,
            ...(typeInput === 'period' && { teacherName: teacherName }),
            isBreak: typeInput === 'break',
            ...(typeInput === 'break' && { breakType: breakType })
          }
          
          // Add slot to timetable
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
      
      // If there are validation errors, don't proceed
      if (errors.length > 0) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: `Validation failed. ${errors.length} rows have errors.`,
          summary: {
            totalRows: data.length,
            timetablesCreated: 0,
            totalSlots: 0,
            errors: errors.slice(0, 100)
          }
        })
      }
      
      // Format each timetable's slots - periods get sequential sno, breaks have no sno
      const formattedTimetables = []
      let totalSlots = 0
      
      for (const [key, timetable] of validTimetables) {
        // Format slots properly
        const formattedSlots = formatDaySlots(timetable.slots)
        totalSlots += formattedSlots.length
        
        // Validate structure
        if (!validateSlotsStructure(formattedSlots)) {
          cleanupTempFiles(req.file)
          return res.status(400).json({
            success: false,
            message: `Invalid slots structure for ${timetable.class} - ${timetable.section} - ${timetable.day}`,
            summary: {
              totalRows: data.length,
              timetablesCreated: 0,
              totalSlots: 0,
              errors: [{
                row: 0,
                class: timetable.class,
                section: timetable.section,
                day: timetable.day,
                error: 'Invalid slots structure',
                type: 'validation_error'
              }]
            }
          })
        }
        
        formattedTimetables.push({
          class: timetable.class,
          section: timetable.section,
          day: timetable.day,
          slots: formattedSlots
        })
      }
      
      console.log(`Validation passed. Found ${formattedTimetables.length} unique timetables with ${totalSlots} slots`)
      
      // Process in batches to avoid transaction timeout
      const BATCH_SIZE = 5
      let upsertedCount = 0
      const upsertErrors = []
      
      for (let i = 0; i < formattedTimetables.length; i += BATCH_SIZE) {
        const batch = formattedTimetables.slice(i, i + BATCH_SIZE)
        
        try {
          // Use Promise.all for parallel processing within batch
          await Promise.all(batch.map(async (timetable) => {
            try {
              console.log(`Upserting timetable for: ${timetable.class} - ${timetable.section} - ${timetable.day}`)
              
              // Use upsert for each timetable
              const result = await prisma.timetable.upsert({
                where: {
                  // Prisma will automatically use the unique constraint
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
              console.log(`Successfully upserted: ${timetable.class} - ${timetable.section} - ${timetable.day}`)
            } catch (upsertError) {
              console.error(`Error upserting ${timetable.class} - ${timetable.section} - ${timetable.day}:`, upsertError)
              upsertErrors.push({
                timetable: `${timetable.class}_${timetable.section}_${timetable.day}`,
                error: upsertError.message
              })
            }
          }))
        } catch (batchError) {
          console.error('Batch processing error:', batchError)
          // Continue with next batch even if this one fails
        }
      }
      
      if (upsertErrors.length > 0) {
        console.error('Some upserts failed:', upsertErrors)
        cleanupTempFiles(req.file)
        return res.status(207).json({
          success: false,
          message: `Import completed with ${upsertErrors.length} errors. ${upsertedCount} timetables were successfully upserted.`,
          summary: {
            totalRows: data.length,
            timetablesCreated: upsertedCount,
            totalSlots: totalSlots,
            errors: upsertErrors.slice(0, 100).map(e => ({
              row: 0,
              class: e.timetable?.split('_')[0] || 'N/A',
              section: e.timetable?.split('_')[1] || 'N/A',
              day: e.timetable?.split('_')[2] || 'N/A',
              error: e.error,
              type: 'upsert_error'
            }))
          }
        })
      }
      
      console.log(`Successfully upserted ${upsertedCount} timetables with ${totalSlots} slots`)
      
      cleanupTempFiles(req.file)
      
      res.status(200).json({
        success: true,
        message: `Bulk import completed successfully. Upserted ${upsertedCount} timetables with ${totalSlots} slots.`,
        summary: {
          totalRows: data.length,
          timetablesCreated: upsertedCount,
          totalSlots: totalSlots,
          errors: []
        }
      })
      
    } catch (error) {
      console.error('Bulk import error:', error)
      cleanupTempFiles(req.file)
      
      res.status(500).json({
        success: false,
        message: error.message || 'Bulk import failed due to server error',
        summary: {
          totalRows: 0,
          timetablesCreated: 0,
          totalSlots: 0,
          errors: [{
            row: 0,
            class: 'N/A',
            section: 'N/A',
            day: 'N/A',
            error: error.message || 'Internal server error',
            type: 'server_error'
          }]
        }
      })
    }
  })
]