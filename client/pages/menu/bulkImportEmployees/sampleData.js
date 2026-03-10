import * as XLSX from 'xlsx'
import * as Sharing from 'expo-sharing'
import { Directory, File, Paths } from 'expo-file-system'

export const downloadEmployeeTemplate = async () => {
  try {
    // Sample employee data with 10 entries
    const sampleData = [
      {
        firstName: 'Rajesh',
        lastName: 'Kumar',
        gender: 'MALE',
        dob: '1985-05-15',
        email: 'rajesh.kumar@school.com',
        phone: '9876543210',
        address: '123 Teacher Colony',
        village: 'Springfield',
        designation: 'Teacher',
        joiningDate: '2023-06-01',
        qualification: 'M.Sc, B.Ed',
        aadharNumber: '123456789012',
        panNumber: 'ABCDE1234F'
      },
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        gender: 'FEMALE',
        dob: '1990-08-20',
        email: 'priya.sharma@school.com',
        phone: '9876543211',
        address: '456 Faculty Apartments',
        village: 'Riverside',
        designation: 'Teacher',
        joiningDate: '2023-07-15',
        qualification: 'MA, B.Ed',
        aadharNumber: '234567890123',
        panNumber: 'BCDEF2345G'
      },
      {
        firstName: 'Sunil',
        lastName: 'Verma',
        gender: 'MALE',
        dob: '1978-03-10',
        email: 'sunil.verma@school.com',
        phone: '9876543212',
        address: '789 Staff Quarters',
        village: 'Hilltown',
        designation: 'Principal',
        joiningDate: '2022-04-01',
        qualification: 'PhD in Education',
        aadharNumber: '345678901234',
        panNumber: 'CDEFG3456H'
      },
      {
        firstName: 'Anita',
        lastName: 'Desai',
        gender: 'FEMALE',
        dob: '1982-11-25',
        email: 'anita.desai@school.com',
        phone: '9876543213',
        address: '321 Staff Colony',
        village: 'Lakeview',
        designation: 'Vice_Principal',
        joiningDate: '2023-01-10',
        qualification: 'M.Ed',
        aadharNumber: '456789012345',
        panNumber: 'DEFGH4567I'
      },
      {
        firstName: 'Amit',
        lastName: 'Patel',
        gender: 'MALE',
        dob: '1988-09-18',
        email: 'amit.patel@school.com',
        phone: '9876543214',
        address: '654 Teacher Nagar',
        village: 'Greenfield',
        designation: 'Teacher',
        joiningDate: '2023-11-20',
        qualification: 'B.Sc, B.Ed',
        aadharNumber: '567890123456',
        panNumber: 'EFGHI5678J'
      },
      {
        firstName: 'Meera',
        lastName: 'Reddy',
        gender: 'FEMALE',
        dob: '1992-12-05',
        email: 'meera.reddy@school.com',
        phone: '9876543215',
        address: '987 Faculty Homes',
        village: 'Fairview',
        designation: 'Teacher',
        joiningDate: '2024-02-01',
        qualification: 'M.Com, B.Ed',
        aadharNumber: '678901234567',
        panNumber: 'FGHIJ6789K'
      },
      {
        firstName: 'Vikram',
        lastName: 'Singh',
        gender: 'MALE',
        dob: '1975-07-30',
        email: 'vikram.singh@school.com',
        phone: '9876543216',
        address: '147 Staff Enclave',
        village: 'Brookside',
        designation: 'Accountant',
        joiningDate: '2022-09-15',
        qualification: 'M.Com, MBA',
        aadharNumber: '789012345678',
        panNumber: 'GHIJK7890L'
      },
      {
        firstName: 'Kavita',
        lastName: 'Joshi',
        gender: 'FEMALE',
        dob: '1986-04-22',
        email: 'kavita.joshi@school.com',
        phone: '9876543217',
        address: '258 Teacher Layout',
        village: 'Meadowbrook',
        designation: 'Teacher',
        joiningDate: '2023-05-10',
        qualification: 'MA, B.Ed',
        aadharNumber: '890123456789',
        panNumber: 'HIJKL8901M'
      },
      {
        firstName: 'Ravi',
        lastName: 'Gupta',
        gender: 'MALE',
        dob: '1980-10-12',
        email: 'ravi.gupta@school.com',
        phone: '9876543218',
        address: '369 Staff Apartments',
        village: 'Rivertown',
        designation: 'Teacher',
        joiningDate: '2022-12-05',
        qualification: 'M.Sc, M.Ed',
        aadharNumber: '901234567890',
        panNumber: 'IJKLM9012N'
      },
      {
        firstName: 'Deepa',
        lastName: 'Nair',
        gender: 'FEMALE',
        dob: '1984-06-17',
        email: 'deepa.nair@school.com',
        phone: '9876543219',
        address: '753 Teacher Street',
        village: 'Woodland',
        designation: 'Chairperson',
        joiningDate: '2022-01-20',
        qualification: 'PhD, MBA',
        aadharNumber: '012345678901',
        panNumber: 'JKLMN0123O'
      }
    ]

    // Create worksheet from sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData)

    // Auto-size columns
    const colWidths = [
      { wch: 12 }, // firstName
      { wch: 12 }, // lastName
      { wch: 8 },  // gender
      { wch: 12 }, // dob
      { wch: 25 }, // email
      { wch: 12 }, // phone
      { wch: 25 }, // address
      { wch: 15 }, // village
      { wch: 15 }, // designation
      { wch: 12 }, // joiningDate
      { wch: 20 }, // qualification
      { wch: 15 }, // aadharNumber
      { wch: 12 }  // panNumber
    ]
    worksheet['!cols'] = colWidths

    // Create instructions as a separate sheet
    const instructions = [
      ['EMPLOYEE BULK IMPORT - TEMPLATE INSTRUCTIONS'],
      [''],
      ['IMPORTANT NOTES:'],
      ['1. Columns marked with * are REQUIRED'],
      ['2. Do not modify the column headers in the first row'],
      ['3. Replace the sample data (rows 2-11) with your actual data'],
      ['4. Save file as .xlsx format'],
      [''],
      ['FIELD DETAILS:'],
      ['firstName*: Employee first name (required)'],
      ['lastName*: Employee last name (required)'],
      ['gender*: Gender (MALE, FEMALE, or NOT_SPECIFIED)'],
      ['dob*: Date of birth (format: YYYY-MM-DD)'],
      ['email*: Email address (must be unique)'],
      ['phone*: Phone number (10 digits, must be unique)'],
      ['address*: Complete address'],
      ['village: Village/Town name'],
      ['designation*: Job designation (Chairperson, Principal, Vice_Principal, Accountant, Teacher, or Other)'],
      ['joiningDate: Date of joining (format: YYYY-MM-DD)'],
      ['qualification: Educational qualifications'],
      ['aadharNumber: 12-digit Aadhar number (must be unique if provided)'],
      ['panNumber: PAN card number (10 characters)'],
      [''],
      ['VALIDATION RULES:'],
      ['- Email and phone must be UNIQUE'],
      ['- Phone numbers must be 10 digits'],
      ['- Aadhar number must be 12 digits if provided'],
      ['- Dates must be in YYYY-MM-DD format'],
      ['- Designation must be from the predefined list'],
      ['- Maximum file size: 10MB'],
      ['- Save file before uploading'],
      [''],
      ['DESIGNATION VALUES:'],
      ['- Chairperson'],
      ['- Principal'],
      ['- Vice_Principal'],
      ['- Accountant'],
      ['- Teacher'],
      ['- Other'],
      [''],
      ['GENDER VALUES:'],
      ['- MALE'],
      ['- FEMALE'],
      ['- NOT_SPECIFIED'],
    ]
    
    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions)
    instructionSheet['!cols'] = [{ wch: 100 }]

    // Create workbook and add sheets
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, instructionSheet, "Instructions")
    XLSX.utils.book_append_sheet(wb, worksheet, "Employee Data")

    // Write workbook to base64
    const wbout = XLSX.write(wb, {
      type: 'base64',
      bookType: "xlsx"
    })

    // Create a directory for the file using the new Directory API
    const templateDir = new Directory(Paths.cache, 'employee-templates')
    
    // Create the directory (if it doesn't exist)
    await templateDir.create()
    
    // Generate filename with current date
    const fileName = `employee_import_template_${new Date().toISOString().split('T')[0]}.xlsx`
    
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
      dialogTitle: 'Download Employee Import Template',
      UTI: 'com.microsoft.excel.xlsx'
    })

    return { success: true, message: 'Template downloaded successfully' }
  } catch (error) {
    console.error('Error generating template:', error)
    return { success: false, message: 'Failed to generate template: ' + error.message }
  }
}