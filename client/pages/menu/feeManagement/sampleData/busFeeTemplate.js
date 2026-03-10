import * as XLSX from 'xlsx'
import * as Sharing from 'expo-sharing'
import { Directory, File, Paths } from 'expo-file-system'

export const downloadBusFeeTemplate = async () => {
  try {
    // Sample bus fee data
    const sampleData = [
      {
        villageName: 'Springfield',
        distance: 5.2,
        feeAmount: 5000,
        description: 'Bus fee for Springfield area - within 5 km radius'
      },
      {
        villageName: 'Riverside',
        distance: 8.5,
        feeAmount: 6500,
        description: 'Riverside route - moderate distance'
      },
      {
        villageName: 'Hilltown',
        distance: 12.0,
        feeAmount: 8000,
        description: 'Hilltown route - longer distance'
      },
      {
        villageName: 'Lakeview',
        distance: 3.8,
        feeAmount: 4500,
        description: 'Lakeview - close to school'
      },
      {
        villageName: 'Greenfield',
        distance: 6.5,
        feeAmount: 5500,
        description: 'Greenfield area - standard route'
      },
      {
        villageName: 'Fairview',
        distance: 9.2,
        feeAmount: 7000,
        description: 'Fairview - slightly longer route'
      },
      {
        villageName: 'Brookside',
        distance: 4.5,
        feeAmount: 4800,
        description: 'Brookside - short distance'
      },
      {
        villageName: 'Meadowbrook',
        distance: 7.8,
        feeAmount: 6000,
        description: 'Meadowbrook - medium distance'
      },
      {
        villageName: 'Rivertown',
        distance: 10.5,
        feeAmount: 7500,
        description: 'Rivertown - longer route'
      },
      {
        villageName: 'Woodland',
        distance: 3.2,
        feeAmount: 4200,
        description: 'Woodland - very close to school'
      }
    ]

    // Create worksheet from sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData)

    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // villageName
      { wch: 12 }, // distance
      { wch: 12 }, // feeAmount
      { wch: 40 }, // description
    ]
    worksheet['!cols'] = colWidths

    // Create instructions sheet
    const instructions = [
      ['BUS FEE BULK IMPORT - TEMPLATE INSTRUCTIONS'],
      [''],
      ['IMPORTANT NOTES:'],
      ['1. Do not modify the column headers in the first row'],
      ['2. Replace the sample data with your actual bus fee data'],
      ['3. Save file as .xlsx format before uploading'],
      ['4. Max file size: 10MB'],
      [''],
      ['COLUMN DETAILS:'],
      ['villageName: Name of village/area (required)'],
      ['distance: Distance from school in kilometers (required, numeric)'],
      ['feeAmount: Annual bus fee amount (required, numeric)'],
      ['description: Additional notes (optional)'],
      [''],
      ['VALIDATION RULES:'],
      ['- villageName is required and must be unique'],
      ['- distance must be a positive number'],
      ['- feeAmount must be a positive number'],
      ['- All fields must be properly formatted'],
      [''],
      ['EXAMPLE DATA BELOW - Replace with your actual data:']
    ]
    
    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions)
    instructionSheet['!cols'] = [{ wch: 100 }]

    // Create workbook and add sheets
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, instructionSheet, "Instructions")
    XLSX.utils.book_append_sheet(wb, worksheet, "Bus Fee Data")

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
    const fileName = `bus_fee_template_${new Date().toISOString().split('T')[0]}.xlsx`
    
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
      dialogTitle: 'Download Bus Fee Template',
      UTI: 'com.microsoft.excel.xlsx'
    })

    return { success: true, message: 'Bus fee template downloaded successfully' }
  } catch (error) {
    console.error('Error generating bus fee template:', error)
    return { success: false, message: 'Failed to generate template: ' + error.message }
  }
}