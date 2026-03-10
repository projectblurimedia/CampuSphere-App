import * as XLSX from 'xlsx'
import * as Sharing from 'expo-sharing'
import { Directory, File, Paths } from 'expo-file-system'

export const downloadHostelFeeTemplate = async () => {
  try {
    // Sample hostel fee data
    const sampleData = [
      {
        className: 'CLASS_6',
        totalAnnualFee: 25000,
        description: 'Hostel fee for Class 6 - 3 sharing room'
      },
      {
        className: 'CLASS_7',
        totalAnnualFee: 26000,
        description: 'Hostel fee for Class 7 - 3 sharing room'
      },
      {
        className: 'CLASS_8',
        totalAnnualFee: 27000,
        description: 'Hostel fee for Class 8 - 2/3 sharing room'
      },
      {
        className: 'CLASS_9',
        totalAnnualFee: 30000,
        description: 'Hostel fee for Class 9 - 2 sharing room'
      },
      {
        className: 'CLASS_10',
        totalAnnualFee: 32000,
        description: 'Hostel fee for Class 10 - 2 sharing room with study facilities'
      },
      {
        className: 'CLASS_11',
        totalAnnualFee: 35000,
        description: 'Hostel fee for Class 11 - single/2 sharing room'
      },
      {
        className: 'CLASS_12',
        totalAnnualFee: 38000,
        description: 'Hostel fee for Class 12 - single room with premium facilities'
      },
      {
        className: 'CLASS_5',
        totalAnnualFee: 20000,
        description: 'Hostel fee for Class 5 - junior hostel with caretaker'
      },
      {
        className: 'CLASS_4',
        totalAnnualFee: 18000,
        description: 'Hostel fee for Class 4 - junior hostel'
      },
      {
        className: 'CLASS_3',
        totalAnnualFee: 16000,
        description: 'Hostel fee for Class 3 - junior hostel'
      }
    ]

    // Create worksheet from sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData)

    // Auto-size columns
    const colWidths = [
      { wch: 15 }, // className
      { wch: 15 }, // totalAnnualFee
      { wch: 50 }, // description
    ]
    worksheet['!cols'] = colWidths

    // Create instructions sheet
    const instructions = [
      ['HOSTEL FEE BULK IMPORT - TEMPLATE INSTRUCTIONS'],
      [''],
      ['IMPORTANT NOTES:'],
      ['1. Do not modify the column headers in the first row'],
      ['2. Replace the sample data with your actual hostel fee data'],
      ['3. Save file as .xlsx format before uploading'],
      ['4. Max file size: 10MB'],
      [''],
      ['COLUMN DETAILS:'],
      ['className: Class name (PRE_NURSERY, NURSERY, LKG, UKG, CLASS_1 to CLASS_12)'],
      ['totalAnnualFee: Annual hostel fee amount (required, numeric)'],
      ['description: Additional notes (optional)'],
      [''],
      ['CLASS NAME VALUES:'],
      ['- PRE_NURSERY (Pre-Nursery)'],
      ['- NURSERY (Nursery)'],
      ['- LKG (LKG)'],
      ['- UKG (UKG)'],
      ['- CLASS_1 to CLASS_12 (Class 1 to Class 12)'],
      [''],
      ['VALIDATION RULES:'],
      ['- className is required and must be a valid class name'],
      ['- totalAnnualFee is required and must be greater than 0'],
      ['- className must be unique for active fee structures'],
      ['- All numeric fields must be positive numbers'],
      [''],
      ['EXAMPLE DATA BELOW - Replace with your actual data:']
    ]
    
    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions)
    instructionSheet['!cols'] = [{ wch: 100 }]

    // Create workbook and add sheets
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, instructionSheet, "Instructions")
    XLSX.utils.book_append_sheet(wb, worksheet, "Hostel Fee Data")

    // Write workbook to base64
    const wbout = XLSX.write(wb, {
      type: 'base64',
      bookType: "xlsx"
    })

    // Create a directory for the file
    const templateDir = new Directory(Paths.cache, 'fee-templates')
    
    // Try to create directory, ignore if it already exists
    try {
      await templateDir.create()
      console.log('Directory created successfully')
    } catch (dirError) {
      // Directory already exists - that's fine, we can continue
      console.log('Directory already exists, continuing...')
    }
    
    // Generate filename with current date
    const fileName = `hostel_fee_template_${new Date().toISOString().split('T')[0]}.xlsx`
    
    // Create a File object in the directory
    const outputFile = new File(templateDir, fileName)
    
    // Write the file content
    await outputFile.write(wbout, {
      encoding: 'base64'
    })

    console.log('File created:', outputFile.exists)
    console.log('File URI:', outputFile.uri)

    // Check if sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync()
    
    if (!isSharingAvailable) {
      return { 
        success: false, 
        message: 'Sharing is not available on this device' 
      }
    }

    // Share the file
    await Sharing.shareAsync(outputFile.uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Download Hostel Fee Template',
      UTI: 'com.microsoft.excel.xlsx'
    })

    return { success: true, message: 'Hostel fee template downloaded successfully' }
  } catch (error) {
    console.error('Error generating hostel fee template:', error)
    return { success: false, message: 'Failed to generate template: ' + error.message }
  }
}