import * as XLSX from 'xlsx'
import * as Sharing from 'expo-sharing'
import { Directory, File, Paths } from 'expo-file-system'

export const downloadClassFeeTemplate = async () => {
  try {
    // Sample class fee data
    const sampleData = [
      {
        className: 'PRE_NURSERY',
        tuitionFee: 5000,
        examFee: 1000,
        activityFee: 2000,
        booksFee: 3000,
        sportsFee: 1500,
        labFee: 0,
        computerFee: 0,
        otherCharges: 500,
        description: 'Pre-Nursery fee structure including tuition, books, and activities'
      },
      {
        className: 'NURSERY',
        tuitionFee: 6000,
        examFee: 1000,
        activityFee: 2000,
        booksFee: 3200,
        sportsFee: 1500,
        labFee: 0,
        computerFee: 0,
        otherCharges: 500,
        description: 'Nursery fee structure with comprehensive activities'
      },
      {
        className: 'LKG',
        tuitionFee: 6500,
        examFee: 1200,
        activityFee: 2200,
        booksFee: 3500,
        sportsFee: 1800,
        labFee: 0,
        computerFee: 1000,
        otherCharges: 600,
        description: 'LKG fee structure with computer basics included'
      },
      {
        className: 'UKG',
        tuitionFee: 7000,
        examFee: 1200,
        activityFee: 2500,
        booksFee: 3800,
        sportsFee: 1800,
        labFee: 0,
        computerFee: 1200,
        otherCharges: 600,
        description: 'UKG fee structure with advanced learning materials'
      },
      {
        className: 'CLASS_1',
        tuitionFee: 8000,
        examFee: 1500,
        activityFee: 3000,
        booksFee: 4000,
        sportsFee: 2000,
        labFee: 1000,
        computerFee: 1500,
        otherCharges: 800,
        description: 'Class 1 fee structure with lab and computer fees'
      },
      {
        className: 'CLASS_2',
        tuitionFee: 8500,
        examFee: 1500,
        activityFee: 3000,
        booksFee: 4200,
        sportsFee: 2000,
        labFee: 1200,
        computerFee: 1500,
        otherCharges: 800,
        description: 'Class 2 fee structure with enhanced lab facilities'
      },
      {
        className: 'CLASS_3',
        tuitionFee: 9000,
        examFee: 1800,
        activityFee: 3500,
        booksFee: 4500,
        sportsFee: 2500,
        labFee: 1500,
        computerFee: 1800,
        otherCharges: 1000,
        description: 'Class 3 fee structure with science lab access'
      },
      {
        className: 'CLASS_4',
        tuitionFee: 9500,
        examFee: 1800,
        activityFee: 3500,
        booksFee: 4800,
        sportsFee: 2500,
        labFee: 1500,
        computerFee: 1800,
        otherCharges: 1000,
        description: 'Class 4 fee structure with advanced curriculum'
      },
      {
        className: 'CLASS_5',
        tuitionFee: 10000,
        examFee: 2000,
        activityFee: 4000,
        booksFee: 5000,
        sportsFee: 3000,
        labFee: 2000,
        computerFee: 2000,
        otherCharges: 1200,
        description: 'Class 5 fee structure with all facilities'
      },
      {
        className: 'CLASS_6',
        tuitionFee: 11000,
        examFee: 2000,
        activityFee: 4000,
        booksFee: 5500,
        sportsFee: 3000,
        labFee: 2500,
        computerFee: 2500,
        otherCharges: 1500,
        description: 'Class 6 fee structure with subject-specific labs'
      }
    ]

    // Create worksheet from sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData)

    // Auto-size columns
    const colWidths = [
      { wch: 15 }, // className
      { wch: 12 }, // tuitionFee
      { wch: 12 }, // examFee
      { wch: 12 }, // activityFee
      { wch: 12 }, // booksFee
      { wch: 12 }, // sportsFee
      { wch: 12 }, // labFee
      { wch: 12 }, // computerFee
      { wch: 12 }, // otherCharges
      { wch: 40 }, // description
    ]
    worksheet['!cols'] = colWidths

    // Create instructions sheet
    const instructions = [
      ['CLASS FEE BULK IMPORT - TEMPLATE INSTRUCTIONS'],
      [''],
      ['IMPORTANT NOTES:'],
      ['1. Do not modify the column headers in the first row'],
      ['2. Replace the sample data with your actual class fee data'],
      ['3. Save file as .xlsx format before uploading'],
      ['4. Max file size: 10MB'],
      [''],
      ['COLUMN DETAILS:'],
      ['className: Class name (PRE_NURSERY, NURSERY, LKG, UKG, CLASS_1 to CLASS_12)'],
      ['tuitionFee: Tuition fee amount (numeric, optional)'],
      ['examFee: Exam fee amount (numeric, optional)'],
      ['activityFee: Activity fee amount (numeric, optional)'],
      ['booksFee: Books fee amount (numeric, optional)'],
      ['sportsFee: Sports fee amount (numeric, optional)'],
      ['labFee: Lab fee amount (numeric, optional)'],
      ['computerFee: Computer fee amount (numeric, optional)'],
      ['otherCharges: Other charges (numeric, optional)'],
      ['description: Additional notes (optional)'],
      [''],
      ['CLASS NAME VALUES:'],
      ['- PRE_NURSERY (Pre-Nursery)'],
      ['- NURSERY (Nursery)'],
      ['- LKG (LKG)'],
      ['- UKG (UKG)'],
      ['- CLASS_1 (Class 1)'],
      ['- CLASS_2 (Class 2)'],
      ['- CLASS_3 (Class 3)'],
      ['- CLASS_4 (Class 4)'],
      ['- CLASS_5 (Class 5)'],
      ['- CLASS_6 (Class 6)'],
      ['- CLASS_7 (Class 7)'],
      ['- CLASS_8 (Class 8)'],
      ['- CLASS_9 (Class 9)'],
      ['- CLASS_10 (Class 10)'],
      ['- CLASS_11 (Class 11)'],
      ['- CLASS_12 (Class 12)'],
      [''],
      ['VALIDATION RULES:'],
      ['- className is required and must be a valid class name'],
      ['- All fee fields must be positive numbers if provided'],
      ['- At least one fee field must have a value greater than 0'],
      ['- Total annual fee is calculated automatically from components'],
      [''],
      ['EXAMPLE DATA BELOW - Replace with your actual data:']
    ]
    
    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions)
    instructionSheet['!cols'] = [{ wch: 100 }]

    // Create workbook and add sheets
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, instructionSheet, "Instructions")
    XLSX.utils.book_append_sheet(wb, worksheet, "Class Fee Data")

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
    const fileName = `class_fee_template_${new Date().toISOString().split('T')[0]}.xlsx`
    
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
      dialogTitle: 'Download Class Fee Template',
      UTI: 'com.microsoft.excel.xlsx'
    })

    return { success: true, message: 'Class fee template downloaded successfully' }
  } catch (error) {
    console.error('Error generating class fee template:', error)
    return { success: false, message: 'Failed to generate template: ' + error.message }
  }
}