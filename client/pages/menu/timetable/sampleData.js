import * as XLSX from 'xlsx'
import * as Sharing from 'expo-sharing'
import { Directory, File, Paths } from 'expo-file-system'

export const downloadTimetableTemplate = async () => {
  try {
    // Sample timetable data for multiple classes and days
    const sampleData = [
      // Class 1-A Monday periods
      { sno: 1, class: '1', section: 'A', day: 'Monday', type: 'period', subject: 'Mathematics', timings: '9:00 AM - 10:00 AM', teacherName: 'Rajesh Kumar', breakType: '' },
      { sno: 2, class: '1', section: 'A', day: 'Monday', type: 'period', subject: 'English', timings: '10:00 AM - 11:00 AM', teacherName: 'Priya Sharma', breakType: '' },
      { sno: null, class: '1', section: 'A', day: 'Monday', type: 'break', subject: 'Short Break', timings: '11:00 AM - 11:15 AM', teacherName: '', breakType: 'SHORT_BREAK' },
      { sno: 3, class: '1', section: 'A', day: 'Monday', type: 'period', subject: 'Hindi', timings: '11:15 AM - 12:15 PM', teacherName: 'Amit Patel', breakType: '' },
      { sno: 4, class: '1', section: 'A', day: 'Monday', type: 'period', subject: 'Science', timings: '12:15 PM - 1:15 PM', teacherName: 'Meera Reddy', breakType: '' },
      { sno: null, class: '1', section: 'A', day: 'Monday', type: 'break', subject: 'Lunch Break', timings: '1:15 PM - 2:00 PM', teacherName: '', breakType: 'LUNCH' },
      { sno: 5, class: '1', section: 'A', day: 'Monday', type: 'period', subject: 'Social Studies', timings: '2:00 PM - 3:00 PM', teacherName: 'Vikram Singh', breakType: '' },
      { sno: 6, class: '1', section: 'A', day: 'Monday', type: 'period', subject: 'Computer', timings: '3:00 PM - 4:00 PM', teacherName: 'Kavita Joshi', breakType: '' },
      
      // Class 1-A Tuesday periods
      { sno: 1, class: '1', section: 'A', day: 'Tuesday', type: 'period', subject: 'Science', timings: '9:00 AM - 10:00 AM', teacherName: 'Meera Reddy', breakType: '' },
      { sno: 2, class: '1', section: 'A', day: 'Tuesday', type: 'period', subject: 'Mathematics', timings: '10:00 AM - 11:00 AM', teacherName: 'Rajesh Kumar', breakType: '' },
      { sno: null, class: '1', section: 'A', day: 'Tuesday', type: 'break', subject: 'Short Break', timings: '11:00 AM - 11:15 AM', teacherName: '', breakType: 'SHORT_BREAK' },
      { sno: 3, class: '1', section: 'A', day: 'Tuesday', type: 'period', subject: 'English', timings: '11:15 AM - 12:15 PM', teacherName: 'Priya Sharma', breakType: '' },
      { sno: 4, class: '1', section: 'A', day: 'Tuesday', type: 'period', subject: 'Hindi', timings: '12:15 PM - 1:15 PM', teacherName: 'Amit Patel', breakType: '' },
      { sno: null, class: '1', section: 'A', day: 'Tuesday', type: 'break', subject: 'Lunch Break', timings: '1:15 PM - 2:00 PM', teacherName: '', breakType: 'LUNCH' },
      { sno: 5, class: '1', section: 'A', day: 'Tuesday', type: 'period', subject: 'Art', timings: '2:00 PM - 3:00 PM', teacherName: 'Deepa Nair', breakType: '' },
      { sno: 6, class: '1', section: 'A', day: 'Tuesday', type: 'period', subject: 'Physical Education', timings: '3:00 PM - 4:00 PM', teacherName: 'Ravi Gupta', breakType: '' },
      
      // Class 2-B Monday periods
      { sno: 1, class: '2', section: 'B', day: 'Monday', type: 'period', subject: 'English', timings: '9:00 AM - 10:00 AM', teacherName: 'Sarah Johnson', breakType: '' },
      { sno: 2, class: '2', section: 'B', day: 'Monday', type: 'period', subject: 'Mathematics', timings: '10:00 AM - 11:00 AM', teacherName: 'John Smith', breakType: '' },
      { sno: null, class: '2', section: 'B', day: 'Monday', type: 'break', subject: 'Short Break', timings: '11:00 AM - 11:15 AM', teacherName: '', breakType: 'SHORT_BREAK' },
      { sno: 3, class: '2', section: 'B', day: 'Monday', type: 'period', subject: 'Science', timings: '11:15 AM - 12:15 PM', teacherName: 'Mike Wilson', breakType: '' },
      { sno: 4, class: '2', section: 'B', day: 'Monday', type: 'period', subject: 'Social Studies', timings: '12:15 PM - 1:15 PM', teacherName: 'Emily Brown', breakType: '' },
      { sno: null, class: '2', section: 'B', day: 'Monday', type: 'break', subject: 'Lunch Break', timings: '1:15 PM - 2:00 PM', teacherName: '', breakType: 'LUNCH' },
      { sno: 5, class: '2', section: 'B', day: 'Monday', type: 'period', subject: 'Computer', timings: '2:00 PM - 3:00 PM', teacherName: 'Lisa Davis', breakType: '' },
      { sno: 6, class: '2', section: 'B', day: 'Monday', type: 'period', subject: 'Music', timings: '3:00 PM - 4:00 PM', teacherName: 'Tom Harris', breakType: '' },
    ]

    // Create worksheet from sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData)

    // Auto-size columns
    const colWidths = [
      { wch: 6 },  // sno
      { wch: 8 },  // class
      { wch: 8 },  // section
      { wch: 10 }, // day
      { wch: 8 },  // type
      { wch: 20 }, // subject
      { wch: 22 }, // timings
      { wch: 20 }, // teacherName
      { wch: 15 }, // breakType
    ]
    worksheet['!cols'] = colWidths

    // Create instructions as a separate sheet
    const instructions = [
      ['TIMETABLE BULK IMPORT - TEMPLATE INSTRUCTIONS'],
      [''],
      ['IMPORTANT NOTES:'],
      ['1. Do not modify the column headers in the first row'],
      ['2. Replace the sample data with your actual timetable data'],
      ['3. Save file as .xlsx format before uploading'],
      ['4. Max file size: 10MB'],
      [''],
      ['COLUMN DETAILS:'],
      ['sno: Period number (leave blank for breaks, required for periods)'],
      ['class: Class name (e.g., 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, Pre-Nursery, Nursery, LKG, UKG)'],
      ['section: Section (A, B, C, D, E)'],
      ['day: Day of week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)'],
      ['type: "period" for classes, "break" for breaks/assembly'],
      ['subject: Subject name (for periods) or "Break", "Lunch", "Assembly" (for breaks)'],
      ['timings: Time slot (format: 9:00 AM - 10:00 AM)'],
      ['teacherName: Teacher name (required for periods, leave blank for breaks)'],
      ['breakType: Type of break (SHORT_BREAK, LUNCH, ASSEMBLY) - only for breaks'],
      [''],
      ['BREAK TYPES:'],
      ['- SHORT_BREAK: 10-15 minute short breaks'],
      ['- LUNCH: Lunch break (usually 45-60 minutes)'],
      ['- ASSEMBLY: Morning assembly or special gatherings'],
      [''],
      ['VALIDATION RULES:'],
      ['- For periods: sno, subject, and teacherName are required'],
      ['- For breaks: sno should be empty, breakType is required'],
      ['- Timings must be in correct format (e.g., 9:00 AM - 10:00 AM)'],
      ['- Class and section must exist in the system'],
      ['- Day must be one of Monday-Sunday'],
      [''],
      ['IMPORT BEHAVIOR:'],
      ['- Uploading a file will REPLACE all existing timetables for the classes/sections in the file'],
      ['- Periods will be automatically renumbered in sequence'],
      ['- Breaks will not have period numbers'],
      ['- Each class-section-day combination will be processed as a unit'],
      [''],
      ['EXAMPLE DATA BELOW - Replace with your actual data:']
    ]
    
    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions)
    instructionSheet['!cols'] = [{ wch: 100 }]

    // Create workbook and add sheets
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, instructionSheet, "Instructions")
    XLSX.utils.book_append_sheet(wb, worksheet, "Timetable Data")

    // Write workbook to base64
    const wbout = XLSX.write(wb, {
      type: 'base64',
      bookType: "xlsx"
    })

    // Create a directory for the file using the new Directory API
    const templateDir = new Directory(Paths.cache, 'timetable-templates')
    
    // Create the directory (if it doesn't exist)
    await templateDir.create()
    
    // Generate filename with current date
    const fileName = `timetable_import_template_${new Date().toISOString().split('T')[0]}.xlsx`
    
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
      dialogTitle: 'Download Timetable Import Template',
      UTI: 'com.microsoft.excel.xlsx'
    })

    return { success: true, message: 'Template downloaded successfully' }
  } catch (error) {
    console.error('Error generating template:', error)
    return { success: false, message: 'Failed to generate template: ' + error.message }
  }
}