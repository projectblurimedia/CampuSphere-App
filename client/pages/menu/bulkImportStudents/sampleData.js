import * as XLSX from 'xlsx'
import * as Sharing from 'expo-sharing'
import { Directory, File, Paths } from 'expo-file-system'

export const downloadStudentTemplate = async () => {
  try {
    const sampleData = [
      {
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: '2015-05-12',
        gender: 'MALE',
        class: '1',
        section: 'A',
        admissionNo: '2024001',
        rollNo: '1',
        address: '123 Main Street',
        village: 'Springfield',
        parentName: 'Rajesh Sharma',
        parentPhone: '9876543210',
        parentPhone2: '9876543211',
        parentEmail: 'rajesh.s@email.com',
        studentType: 'DAY_SCHOLAR',
        isUsingSchoolTransport: 'TRUE',
        schoolFeeDiscount: '0',
        transportFeeDiscount: '5',
        hostelFeeDiscount: '0',
        previousYearFee: '0'
      },
      {
        firstName: 'Diya',
        lastName: 'Patel',
        dob: '2014-08-23',
        gender: 'FEMALE',
        class: '2',
        section: 'B',
        admissionNo: '2024002',
        rollNo: '12',
        address: '456 Oak Avenue',
        village: 'Riverside',
        parentName: 'Priya Patel',
        parentPhone: '9876543212',
        parentPhone2: '',
        parentEmail: 'priya.p@email.com',
        studentType: 'DAY_SCHOLAR',
        isUsingSchoolTransport: 'FALSE',
        schoolFeeDiscount: '10',
        transportFeeDiscount: '0',
        hostelFeeDiscount: '0',
        previousYearFee: '0'
      },
      {
        firstName: 'Vihaan',
        lastName: 'Singh',
        dob: '2013-11-05',
        gender: 'MALE',
        class: '3',
        section: 'C',
        admissionNo: '2024003',
        rollNo: '23',
        address: '789 Pine Road',
        village: 'Hilltown',
        parentName: 'Amar Singh',
        parentPhone: '9876543213',
        parentPhone2: '9876543214',
        parentEmail: 'amar.s@email.com',
        studentType: 'DAY_SCHOLAR',
        isUsingSchoolTransport: 'TRUE',
        schoolFeeDiscount: '0',
        transportFeeDiscount: '0',
        hostelFeeDiscount: '0',
        previousYearFee: '5000'
      },
      {
        firstName: 'Anaya',
        lastName: 'Gupta',
        dob: '2012-02-18',
        gender: 'FEMALE',
        class: '4',
        section: 'A',
        admissionNo: '2024004',
        rollNo: '34',
        address: '321 Cedar Lane',
        village: 'Lakeview',
        parentName: 'Neha Gupta',
        parentPhone: '9876543215',
        parentPhone2: '',
        parentEmail: 'neha.g@email.com',
        studentType: 'HOSTELLER',
        isUsingSchoolTransport: 'FALSE',
        schoolFeeDiscount: '15',
        transportFeeDiscount: '0',
        hostelFeeDiscount: '10',
        previousYearFee: '10000'
      },
      {
        firstName: 'Advik',
        lastName: 'Kumar',
        dob: '2011-07-30',
        gender: 'MALE',
        class: '5',
        section: 'B',
        admissionNo: '2024005',
        rollNo: '45',
        address: '654 Maple Drive',
        village: 'Greenfield',
        parentName: 'Sunil Kumar',
        parentPhone: '9876543216',
        parentPhone2: '9876543217',
        parentEmail: 'sunil.k@email.com',
        studentType: 'DAY_SCHOLAR',
        isUsingSchoolTransport: 'TRUE',
        schoolFeeDiscount: '5',
        transportFeeDiscount: '5',
        hostelFeeDiscount: '0',
        previousYearFee: '2000'
      },
      {
        firstName: 'Ishita',
        lastName: 'Verma',
        dob: '2010-09-14',
        gender: 'FEMALE',
        class: '6',
        section: 'C',
        admissionNo: '2024006',
        rollNo: '56',
        address: '987 Birch Street',
        village: 'Fairview',
        parentName: 'Anita Verma',
        parentPhone: '9876543218',
        parentPhone2: '',
        parentEmail: 'anita.v@email.com',
        studentType: 'DAY_SCHOLAR',
        isUsingSchoolTransport: 'FALSE',
        schoolFeeDiscount: '0',
        transportFeeDiscount: '0',
        hostelFeeDiscount: '0',
        previousYearFee: '0'
      },
      {
        firstName: 'Reyansh',
        lastName: 'Reddy',
        dob: '2009-12-03',
        gender: 'MALE',
        class: '7',
        section: 'A',
        admissionNo: '2024007',
        rollNo: '67',
        address: '147 Elm Court',
        village: 'Brookside',
        parentName: 'Kiran Reddy',
        parentPhone: '9876543219',
        parentPhone2: '9876543220',
        parentEmail: 'kiran.r@email.com',
        studentType: 'HOSTELLER',
        isUsingSchoolTransport: 'FALSE',
        schoolFeeDiscount: '20',
        transportFeeDiscount: '0',
        hostelFeeDiscount: '15',
        previousYearFee: '15000'
      },
      {
        firstName: 'Aadhya',
        lastName: 'Joshi',
        dob: '2008-04-22',
        gender: 'FEMALE',
        class: '8',
        section: 'B',
        admissionNo: '2024008',
        rollNo: '78',
        address: '258 Spruce Way',
        village: 'Meadowbrook',
        parentName: 'Rajiv Joshi',
        parentPhone: '9876543221',
        parentPhone2: '',
        parentEmail: 'rajiv.j@email.com',
        studentType: 'DAY_SCHOLAR',
        isUsingSchoolTransport: 'TRUE',
        schoolFeeDiscount: '0',
        transportFeeDiscount: '0',
        hostelFeeDiscount: '0',
        previousYearFee: '0'
      },
      {
        firstName: 'Kabir',
        lastName: 'Malhotra',
        dob: '2007-06-17',
        gender: 'MALE',
        class: '9',
        section: 'C',
        admissionNo: '2024009',
        rollNo: '89',
        address: '369 Willow Lane',
        village: 'Rivertown',
        parentName: 'Deepak Malhotra',
        parentPhone: '9876543222',
        parentPhone2: '9876543223',
        parentEmail: 'deepak.m@email.com',
        studentType: 'DAY_SCHOLAR',
        isUsingSchoolTransport: 'TRUE',
        schoolFeeDiscount: '10',
        transportFeeDiscount: '10',
        hostelFeeDiscount: '0',
        previousYearFee: '0'
      },
      {
        firstName: 'Myra',
        lastName: 'Nair',
        dob: '2006-10-09',
        gender: 'FEMALE',
        class: '10',
        section: 'A',
        admissionNo: '2024010',
        rollNo: '100',
        address: '753 Ash Street',
        village: 'Woodland',
        parentName: 'Suresh Nair',
        parentPhone: '9876543224',
        parentPhone2: '',
        parentEmail: 'suresh.n@email.com',
        studentType: 'DAY_SCHOLAR',
        isUsingSchoolTransport: 'FALSE',
        schoolFeeDiscount: '0',
        transportFeeDiscount: '0',
        hostelFeeDiscount: '0',
        previousYearFee: '0'
      }
    ]

    // Create worksheet from sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData)

    // Auto-size columns
    const colWidths = [
      { wch: 12 }, // firstName
      { wch: 12 }, // lastName
      { wch: 12 }, // dob
      { wch: 8 },  // gender
      { wch: 6 },  // class
      { wch: 8 },  // section
      { wch: 12 }, // admissionNo
      { wch: 8 },  // rollNo
      { wch: 20 }, // address
      { wch: 12 }, // village
      { wch: 15 }, // parentName
      { wch: 13 }, // parentPhone
      { wch: 13 }, // parentPhone2
      { wch: 20 }, // parentEmail
      { wch: 12 }, // studentType
      { wch: 20 }, // isUsingSchoolTransport
      { wch: 12 }, // schoolFeeDiscount
      { wch: 15 }, // transportFeeDiscount
      { wch: 13 }, // hostelFeeDiscount
      { wch: 15 }, // previousYearFee
    ]
    worksheet['!cols'] = colWidths

    // Create instructions as a separate sheet
    const instructions = [
      ['INSTRUCTIONS: Fill in the data below. Required fields: firstName, lastName, dob, class, admissionNo, parentName, parentPhone'],
      ['Gender: MALE, FEMALE, NOT_SPECIFIED'],
      ['Class: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, Pre-Nursery, Nursery, LKG, UKG'],
      ['Section: A, B, C, D, E'],
      ['StudentType: DAY_SCHOLAR, HOSTELLER'],
      ['isUsingSchoolTransport: TRUE, FALSE'],
      ['Discounts: Enter percentage (0-100)'],
      ['PreviousYearFee: Enter amount if any pending fees from previous year'],
      [''],
      ['EXAMPLE DATA - Replace with your actual data:']
    ]
    
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions)
    instructionsSheet['!cols'] = [{ wch: 80 }]

    // Create workbook and add sheets
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, instructionsSheet, "Instructions")
    XLSX.utils.book_append_sheet(wb, worksheet, "Student Data")

    // Write workbook to base64
    const wbout = XLSX.write(wb, {
      type: 'base64',
      bookType: "xlsx"
    })

    // Create a directory for the file using the new Directory API
    const templateDir = new Directory(Paths.cache, 'student-templates')
    
    // Create the directory (if it doesn't exist)
    await templateDir.create()
    
    // Generate filename with current date
    const fileName = `student_import_template_${new Date().toISOString().split('T')[0]}.xlsx`
    
    // Create a File object in the directory
    const outputFile = new File(templateDir, fileName)
    
    // Write the file content
    await outputFile.write(wbout, {
      encoding: 'base64'
    })

    console.log('File created:', outputFile.exists) // true
    console.log('File URI:', outputFile.uri) // path to the downloaded file

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
      dialogTitle: 'Download Student Import Template',
      UTI: 'com.microsoft.excel.xlsx'
    })

    return { success: true, message: 'Template downloaded successfully' }
  } catch (error) {
    console.error('Error generating template:', error)
    return { success: false, message: 'Failed to generate template: ' + error.message }
  }
}