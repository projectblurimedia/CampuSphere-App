const xlsx = require('xlsx')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const Timetable = require('../models/Timetable')

// Configure multer for file uploads
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

// Helper function to cleanup temporary files
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

// Helper functions
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

const validateTimings = (timings) => {
  const regex = /^\d{1,2}:\d{2}\s?(AM|PM)\s?-\s?\d{1,2}:\d{2}\s?(AM|PM)$/i
  return regex.test(timings)
}

const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const validTypes = ['period', 'break']

// Bulk import timetable from Excel
exports.bulkImportTimetable = [
  upload.single('excelFile'),
  async (req, res) => {
    console.log('=== TIMETABLE BULK IMPORT STARTED ===')
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Please select a file.'
        })
      }
      
      console.log('File received:', req.file.originalname)
      console.log('File size:', req.file.size, 'bytes')
      console.log('File path:', req.file.path)
      
      // Verify file exists
      if (!fs.existsSync(req.file.path)) {
        return res.status(400).json({
          success: false,
          message: 'Uploaded file not found on server'
        })
      }
      
      let workbook, data
      try {
        // Read the Excel file
        workbook = xlsx.readFile(req.file.path)
        console.log('Excel sheets:', workbook.SheetNames)
        
        const sheetName = workbook.SheetNames[0] || workbook.SheetNames
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to JSON
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
          message: 'Invalid Excel file format. Please use the provided template.',
          error: process.env.NODE_ENV === 'development' ? excelError.message : undefined
        })
      }
      
      if (data.length === 0) {
        cleanupTempFiles(req.file)
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty. Please add timetable data to the template.'
        })
      }
      
      // Log first few rows for debugging
      console.log('Sample data (first 2 rows):', JSON.stringify(data.slice(0, 2), null, 2))
      
      const errors = []
      let successCount = 0 // Number of successful slots added
      let skippedCount = 0
      const groups = new Map() // key: class_section_day, value: {class, section, day, slots: []}
      
      // Process each row
      for (const [index, row] of data.entries()) {
        const rowNumber = index + 2 // +2 for header row and 1-based index
        
        try {
          console.log(`Processing row ${rowNumber}`)
          
          // Skip empty rows
          if (!row.class && !row.section && !row.day) {
            console.log(`Row ${rowNumber} skipped: Empty row`)
            skippedCount++
            continue
          }
          
          // Validate required fields
          const requiredFields = ['class', 'section', 'day', 'type', 'name', 'timings']
          const missingFields = requiredFields.filter(field => !row[field] || row[field].toString().trim() === '')
          
          if (missingFields.length > 0) {
            errors.push({
              row: rowNumber,
              error: `Missing required fields: ${missingFields.join(', ')}`
            })
            continue
          }
          
          // Trim all string fields
          const className = row.class.toString().trim()
          const section = row.section.toString().toUpperCase().trim()
          const dayInput = capitalize(row.day.toString().trim())
          const typeInput = row.type.toString().toLowerCase().trim()
          const name = row.name.toString().trim()
          const timings = row.timings.toString().trim()
          const staffName = row.staffName ? row.staffName.toString().trim() : null
          
          // Validate day
          if (!validDays.includes(dayInput)) {
            errors.push({
              row: rowNumber,
              error: `Invalid day: ${row.day}. Must be one of: ${validDays.join(', ')}`
            })
            continue
          }
          
          // Validate type
          if (!validTypes.includes(typeInput)) {
            errors.push({
              row: rowNumber,
              error: `Invalid type: ${row.type}. Must be 'period' or 'break'`
            })
            continue
          }
          
          // Require staffName for period
          if (typeInput === 'period' && !staffName) {
            errors.push({
              row: rowNumber,
              error: 'Staff name required for period type'
            })
            continue
          }
          
          // Validate timings
          if (!validateTimings(timings)) {
            errors.push({
              row: rowNumber,
              error: `Invalid timings format: ${timings}. Example: 9:00AM - 10:00AM`
            })
            continue
          }
          
          // Group by class_section_day
          const key = `${className}_${section}_${dayInput}`
          if (!groups.has(key)) {
            groups.set(key, {
              class: className,
              section: section,
              day: dayInput,
              slots: []
            })
          }
          
          groups.get(key).slots.push({
            type: typeInput,
            name: name,
            staffName: staffName,
            timings: timings
          })
          
          successCount++
          console.log(`✓ Row ${rowNumber} added to group: ${key}`)
          
        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          errors.push({
            row: rowNumber,
            error: error.message || 'Processing error. Check data format.'
          })
        }
      }
      
      // Save groups to database
      let savedGroups = 0
      const groupErrors = []
      for (const group of groups.values()) {
        try {
          const filter = {
            class: group.class,
            section: group.section,
            day: group.day
          }
          await Timetable.findOneAndUpdate(filter, { slots: group.slots }, { upsert: true, new: true })
          savedGroups++
          console.log(`✓ Saved/Updated timetable for ${group.class}_${group.section}_${group.day}`)
        } catch (error) {
          console.error(`Error saving group ${group.class}_${group.section}_${group.day}:`, error)
          groupErrors.push({
            group: `${group.class}_${group.section}_${group.day}`,
            error: error.message || 'Database save error'
          })
        }
      }
      
      // Cleanup temp file
      cleanupTempFiles(req.file)
      
      console.log('=== IMPORT SUMMARY ===')
      console.log(`Total rows processed: ${data.length}`)
      console.log(`Successful slots: ${successCount}`)
      console.log(`Failed rows: ${errors.length}`)
      console.log(`Skipped (empty): ${skippedCount}`)
      console.log(`Saved/Updated groups: ${savedGroups}`)
      console.log(`Failed groups: ${groupErrors.length}`)
      
      // Prepare response
      const response = {
        success: true,
        message: `Bulk import completed. ${savedGroups} timetables saved/updated.`,
        summary: {
          totalRows: data.length,
          successfulSlots: successCount,
          failedRows: errors.length,
          skipped: skippedCount,
          savedGroups: savedGroups,
          failedGroups: groupErrors.length,
          errors: errors.slice(0, 100), // Limit to 100 errors
          groupErrors: groupErrors.slice(0, 100)
        }
      }
      
      // Add warning if there were failures
      if (errors.length > 0 || groupErrors.length > 0) {
        response.message += ` ${errors.length} rows failed, ${groupErrors.length} groups failed to save.`
      }
      
      res.status(200).json(response)
      
    } catch (error) {
      console.error('Bulk import overall error:', error)
      console.error('Error stack:', error.stack)
      
      // Cleanup temp file if exists
      cleanupTempFiles(req.file)
      
      res.status(500).json({
        success: false,
        message: 'Bulk import failed due to server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
]

// Get unique classes
exports.getUniqueClasses = async (req, res) => {
  try {
    const classes = await Timetable.distinct('class')
    res.json(classes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get sections for a class
exports.getSectionsForClass = async (req, res) => {
  const { class: className } = req.query
  if (!className) {
    return res.status(400).json({ error: 'Class is required' })
  }
  try {
    const sections = await Timetable.distinct('section', { class: className })
    res.json(sections.sort())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get timetable for class and section
exports.getTimetableForClassSection = async (req, res) => {
  const { class: className, section } = req.query
  if (!className || !section) {
    return res.status(400).json({ error: 'Class and section are required' })
  }
  try {
    const timetable = await Timetable.find({ class: className, section }).sort({ day: 1 })
    res.json(timetable)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}