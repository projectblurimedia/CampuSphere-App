const mongoose = require('mongoose')
const Student = require('../models/Student')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const xlsx = require('xlsx')

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

// Helper function to map class names to numbers
const mapClassToNumber = (classInput) => {
  if (!classInput && classInput !== 0) return 1 // Default to class 1
  
  const classStr = classInput.toString().trim().toUpperCase()
  
  // Map common class names to numbers
  const classMap = {
    'PRE-NURSERY': 0,
    'PRE NURSERY': 0,
    'PN': 0,
    'PLAY GROUP': 0,
    'PG': 0,
    
    'NURSERY': 0.25,
    'NUR': 0.25,
    'NURSERY-I': 0.25,
    'NURSERY 1': 0.25,
    
    'LKG': 0.5,
    'LOWER KG': 0.5,
    'LOWER KINDERGARTEN': 0.5,
    'L.K.G': 0.5,
    'NURSERY-II': 0.5,
    'NURSERY 2': 0.5,
    
    'UKG': 0.75,
    'UPPER KG': 0.75,
    'UPPER KINDERGARTEN': 0.75,
    'U.K.G': 0.75,
    'KINDERGARTEN': 0.75,
    'KG': 0.75,
    'PREP': 0.75,
    'PREPARATORY': 0.75,
    'K.G': 0.75,
    
    // Primary and Secondary classes starting from 1
    '1': 1, 'FIRST': 1, 'ONE': 1,
    '2': 2, 'SECOND': 2, 'TWO': 2,
    '3': 3, 'THIRD': 3, 'THREE': 3,
    '4': 4, 'FOURTH': 4, 'FOUR': 4,
    '5': 5, 'FIFTH': 5, 'FIVE': 5,
    '6': 6, 'SIXTH': 6, 'SIX': 6,
    '7': 7, 'SEVENTH': 7, 'SEVEN': 7,
    '8': 8, 'EIGHTH': 8, 'EIGHT': 8,
    '9': 9, 'NINTH': 9, 'NINE': 9,
    '10': 10, 'TENTH': 10, 'TEN': 10,
    '11': 11, 'ELEVENTH': 11, 'ELEVEN': 11,
    '12': 12, 'TWELFTH': 12, 'TWELVE': 12,
    
    // Roman numerals
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
    'XI': 11, 'XII': 12
  }
  
  // Check if it's directly in the map
  if (classMap[classStr] !== undefined) {
    return classMap[classStr]
  }
  
  // Try to parse as number
  const classNum = parseFloat(classStr)
  if (!isNaN(classNum)) {
    return classNum
  }
  
  // Return null if can't be mapped
  return null
}

// Helper function to validate phone number
const validatePhoneNumber = (phone) => {
  if (!phone) return false
  const cleanPhone = phone.toString().replace(/\D/g, '')
  return /^[0-9]{10}$/.test(cleanPhone)
}

// Helper function to clean phone number
const cleanPhoneNumber = (phone) => {
  if (!phone) return ''
  return phone.toString().replace(/\D/g, '').substring(0, 10)
}

// Helper function to validate academic year
const validateAcademicYear = (year) => {
  if (!year) return true // Optional field
  return /^\d{4}-\d{4}$/.test(year)
}

// Helper function to parse date
const parseDate = (dateStr) => {
  if (!dateStr) return new Date('2015-01-01') // Default date
  
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    // Try different formats
    const formats = [
      'YYYY-MM-DD',
      'DD-MM-YYYY',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'YYYY/MM/DD'
    ]
    
    for (const format of formats) {
      let normalizedDate = dateStr
      
      if (format === 'DD-MM-YYYY' && dateStr.includes('-')) {
        const parts = dateStr.split('-')
        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
          normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
        }
      } else if (format === 'MM/DD/YYYY' && dateStr.includes('/')) {
        const parts = dateStr.split('/')
        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
          normalizedDate = `${parts[2]}-${parts[0]}-${parts[1]}`
        }
      } else if (format === 'DD/MM/YYYY' && dateStr.includes('/')) {
        const parts = dateStr.split('/')
        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
          normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
        }
      }
      
      const testDate = new Date(normalizedDate)
      if (!isNaN(testDate.getTime())) {
        return testDate
      }
    }
    
    return new Date('2015-01-01') // Return default if parsing fails
  }
  
  return date
}

// Generate Excel template for bulk import
exports.downloadExcelTemplate = async (req, res) => {
  try {
    // Create workbook
    const workbook = xlsx.utils.book_new()
    
    // Define headers with descriptions
    const headers = [
      ['firstName*', 'lastName*', 'dob (YYYY-MM-DD)', 'academicYear (2024-2025)', 
       'class* (Nursery/LKG/UKG/1-12)', 'section (A/B/C)', 'admissionNo*', 'rollNo', 
       'address', 'village', 'parentName', 'parentPhone* (10 digits)', 
       'parentPhone2', 'parentEmail']
    ]
    
    // Add sample data for guidance
    const sampleData = [
      ['John', 'Doe', '2018-05-15', '2024-2025', 'Nursery', 'A', 'NUR001', '1', 
       '123 Main St', 'Downtown', 'Jane Doe', '9876543210', '9123456789', 'parent@example.com'],
      ['Jane', 'Smith', '2017-08-20', '2024-2025', 'LKG', 'B', 'LKG001', '2', 
       '456 Oak Ave', 'Uptown', 'John Smith', '9123456780', '', 'jsmith@example.com'],
      ['Bob', 'Brown', '2016-03-10', '2024-2025', 'UKG', 'A', 'UKG001', '3', 
       '789 Pine Rd', 'Cityville', 'Alice Brown', '9234567890', '', 'abrown@example.com'],
      ['Alice', 'Johnson', '2015-11-25', '2024-2025', '1', 'C', 'ADM001', '25', 
       '321 Elm St', 'Townsville', 'Mike Johnson', '9345678901', '', 'mjohnson@example.com']
    ]
    
    // Create worksheet
    const worksheet = xlsx.utils.aoa_to_sheet([...headers, ...sampleData])
    
    // Set column widths
    const colWidths = [
      { wch: 15 }, // firstName
      { wch: 15 }, // lastName
      { wch: 15 }, // dob
      { wch: 15 }, // academicYear
      { wch: 15 }, // class
      { wch: 10 }, // section
      { wch: 15 }, // admissionNo
      { wch: 10 }, // rollNo
      { wch: 25 }, // address
      { wch: 15 }, // village
      { wch: 20 }, // parentName
      { wch: 15 }, // parentPhone
      { wch: 15 }, // parentPhone2
      { wch: 25 }  // parentEmail
    ]
    worksheet['!cols'] = colWidths
    
    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Students Template')
    
    // Add instructions sheet
    const instructions = [
      ['STUDENT BULK IMPORT - TEMPLATE INSTRUCTIONS'],
      [''],
      ['IMPORTANT NOTES:'],
      ['1. Columns marked with * are REQUIRED'],
      ['2. Do not modify the column headers in the first row'],
      ['3. Delete the sample rows (2-5) before adding your data'],
      ['4. Save file as .xlsx format'],
      [''],
      ['FIELD DETAILS:'],
      ['firstName*: Student first name (required)'],
      ['lastName*: Student last name (required)'],
      ['dob: Date of birth (format: YYYY-MM-DD)'],
      ['academicYear: Academic year (format: 2024-2025)'],
      ['class*: Class name (Nursery, LKG, UKG, or 1-12)'],
      ['section: Section letter (A, B, C, etc.)'],
      ['admissionNo*: Unique admission number (required, no duplicates)'],
      ['rollNo: Roll number in class'],
      ['address: Complete address'],
      ['village: Village/town name'],
      ['parentName: Parent/guardian full name'],
      ['parentPhone*: Primary phone number (10 digits, required)'],
      ['parentPhone2: Secondary phone number (optional)'],
      ['parentEmail: Email address (optional)'],
      [''],
      ['VALID CLASS VALUES:'],
      ['Nursery, LKG, UKG, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12'],
      ['NUR, LOWER KG, UPPER KG, KINDERGARTEN'],
      ['I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII'],
      [''],
      ['TIPS:'],
      ['- admissionNo must be unique for each student'],
      ['- Maximum file size: 10MB'],
      ['- Date format must be YYYY-MM-DD'],
      ['- Phone numbers must be 10 digits'],
      ['- Save file before uploading']
    ]
    
    const instructionSheet = xlsx.utils.aoa_to_sheet(instructions)
    instructionSheet['!cols'] = [{ wch: 100 }]
    xlsx.utils.book_append_sheet(workbook, instructionSheet, 'Instructions')
    
    // Generate buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment filename=student_bulk_import_template.xlsx')
    
    // Send file
    res.send(excelBuffer)
    
  } catch (error) {
    console.error('Template generation error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate Excel template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Bulk import students from Excel
exports.bulkImportStudents = [
  upload.single('excelFile'),
  async (req, res) => {
    console.log('=== BULK IMPORT STARTED ===')
    
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
          message: 'Excel file is empty. Please add student data to the template.'
        })
      }
      
      // Log first few rows for debugging
      console.log('Sample data (first 3 rows):', JSON.stringify(data.slice(0, 3), null, 2))
      
      const errors = []
      let successCount = 0
      let skippedCount = 0
      
      // Process each row
      for (const [index, row] of data.entries()) {
        const rowNumber = index + 2 // +2 for header row and 1-based index
        
        try {
          console.log(`Processing row ${rowNumber}:`, row.admissionNo || 'No admissionNo')
          
          // Skip empty rows
          if (!row.firstName && !row.lastName && !row.admissionNo) {
            console.log(`Row ${rowNumber} skipped: Empty row`)
            skippedCount++
            continue
          }
          
          // Validate required fields
          const missingFields = []
          if (!row.firstName || row.firstName.toString().trim() === '') missingFields.push('firstName')
          if (!row.lastName || row.lastName.toString().trim() === '') missingFields.push('lastName')
          if (!row.admissionNo || row.admissionNo.toString().trim() === '') missingFields.push('admissionNo')
          if (!row.parentPhone || row.parentPhone.toString().trim() === '') missingFields.push('parentPhone')
          
          if (missingFields.length > 0) {
            errors.push({
              row: rowNumber,
              admissionNo: row.admissionNo || 'N/A',
              error: `Missing required fields: ${missingFields.join(', ')}`
            })
            continue
          }
          
          // Trim all string fields
          const firstName = row.firstName.toString().trim()
          const lastName = row.lastName.toString().trim()
          const admissionNo = row.admissionNo.toString().trim()
          
          // Check for duplicate admission number
          const existingStudent = await Student.findOne({ admissionNo: admissionNo })
          if (existingStudent) {
            errors.push({
              row: rowNumber,
              admissionNo: admissionNo,
              error: `Duplicate admission number: ${admissionNo}`
            })
            continue
          }
          
          // Map class name to number
          const classNum = mapClassToNumber(row.class)
          if (classNum === null) {
            errors.push({
              row: rowNumber,
              admissionNo: admissionNo,
              error: `Invalid class: "${row.class}". Valid: Nursery, LKG, UKG, 1-12, I-XII`
            })
            continue
          }
          
          // Validate phone number
          if (!validatePhoneNumber(row.parentPhone)) {
            errors.push({
              row: rowNumber,
              admissionNo: admissionNo,
              error: `Invalid parent phone: ${row.parentPhone}. Must be 10 digits.`
            })
            continue
          }
          
          // Validate academic year format if provided
          if (row.academicYear && !validateAcademicYear(row.academicYear)) {
            errors.push({
              row: rowNumber,
              admissionNo: admissionNo,
              error: `Invalid academic year: ${row.academicYear}. Format: YYYY-YYYY`
            })
            continue
          }
          
          // Parse date
          const dob = parseDate(row.dob)
          
          // Prepare student data
          const studentData = {
            firstName: firstName,
            lastName: lastName,
            dob: dob,
            academicYear: row.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            class: classNum,
            section: row.section ? row.section.toString().trim().toUpperCase().substring(0, 1) : 'A',
            admissionNo: admissionNo,
            rollNo: row.rollNo ? row.rollNo.toString().trim() : null,
            address: row.address ? row.address.toString().trim() : null,
            village: row.village ? row.village.toString().trim() : null,
            parentName: row.parentName ? row.parentName.toString().trim() : null,
            parentPhone: cleanPhoneNumber(row.parentPhone),
            parentPhone2: row.parentPhone2 ? cleanPhoneNumber(row.parentPhone2) : null,
            parentEmail: row.parentEmail ? row.parentEmail.toString().trim().toLowerCase() : null,
            originalClassName: row.class ? row.class.toString().trim() : '',
            importBatch: Date.now(),
            importSource: 'bulk_excel',
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          // Save student
          const student = new Student(studentData)
          await student.save()
          successCount++
          console.log(`✓ Row ${rowNumber} saved: ${admissionNo} - ${firstName} ${lastName}`)
          
        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          errors.push({
            row: rowNumber,
            admissionNo: row.admissionNo || 'N/A',
            error: error.code === 11000 ? 'Duplicate admission number' : 
                  error.message || 'Database error. Check data format.'
          })
        }
      }
      
      // Cleanup temp file
      cleanupTempFiles(req.file)
      
      console.log('=== IMPORT SUMMARY ===')
      console.log(`Total rows processed: ${data.length}`)
      console.log(`Successfully imported: ${successCount}`)
      console.log(`Failed: ${errors.length}`)
      console.log(`Skipped (empty): ${skippedCount}`)
      
      // Prepare response
      const response = {
        success: true,
        message: `Bulk import completed. ${successCount} students imported successfully.`,
        summary: {
          total: data.length,
          success: successCount,
          failed: errors.length,
          skipped: skippedCount,
          errors: errors.slice(0, 100) // Limit to 100 errors
        }
      }
      
      // Add warning if there were failures
      if (errors.length > 0) {
        response.message += ` ${errors.length} records failed.`
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

// Test endpoint for debugging
exports.testImport = [
  upload.single('excelFile'),
  async (req, res) => {
    try {
      console.log('Test import endpoint called')
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file received'
        })
      }
      
      const fileInfo = {
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path,
        mimetype: req.file.mimetype,
        exists: fs.existsSync(req.file.path)
      }
      
      // Try to read the Excel file
      try {
        const workbook = xlsx.readFile(req.file.path)
        const sheetNames = workbook.SheetNames
        const firstSheet = workbook.Sheets[sheetNames[0]]
        const data = xlsx.utils.sheet_to_json(firstSheet, { 
          raw: false,
          defval: '',
          blankrows: false 
        })
        
        fileInfo.sheetCount = sheetNames.length
        fileInfo.rowCount = data.length
        
        // Show column names from first row
        if (data.length > 0) {
          fileInfo.columns = Object.keys(data[0])
          fileInfo.sampleData = data.slice(0, 3)
        }
        
        // Test class mapping
        if (data.length > 0 && data[0].class) {
          fileInfo.classMappingTest = {
            original: data[0].class,
            mapped: mapClassToNumber(data[0].class)
          }
        }
        
      } catch (excelError) {
        fileInfo.excelError = excelError.message
      }
      
      // Cleanup
      cleanupTempFiles(req.file)
      
      res.status(200).json({
        success: true,
        message: 'Test successful',
        fileInfo: fileInfo
      })
      
    } catch (error) {
      console.error('Test error:', error)
      cleanupTempFiles(req.file)
      
      res.status(500).json({
        success: false,
        message: 'Test failed',
        error: error.message
      })
    }
  }
]