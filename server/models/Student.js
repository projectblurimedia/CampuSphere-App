const mongoose = require('mongoose')
const { 
  attendanceInstanceMethods, 
  attendanceStaticMethods,
  mapClassToNumber,
  mapNumberToClassName 
} = require('../services/student.attendance.service')
const { 
  marksInstanceMethods, 
  marksStaticMethods,
  marksHelperFunctions 
} = require('../services/student.marks.service')
const { 
  feeInstanceMethods, 
  feeStaticMethods,
  feeHelperFunctions 
} = require('../services/student.fee.service')

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required'],
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Not Specified'],
    default: 'Not Specified'
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    enum: ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030', '2030-2031']
  },
  class: {
    type: Number,
    required: [true, 'Class is required'],
    min: 0,
    max: 12,
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    uppercase: true,
    enum: ['A', 'B', 'C', 'D', 'E'], 
  },
  admissionNo: {
    type: String,
    required: [true, 'Admission number is required'],
    unique: true,
    trim: true,
  },
  rollNo: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  studentType: {
    type: String,
    enum: ['Day Scholar', 'Hosteller'],
    default: 'Day Scholar',
    required: [true, 'Student type is required']
  },
  isUsingSchoolTransport: {
    type: Boolean,
    default: false,
  },
  // Fee discount fields
  schoolFeeDiscount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    validate: {
      validator: function(value) {
        return value >= 0 && value <= 100
      },
      message: 'School fee discount must be between 0 and 100 percent'
    }
  },
  transportFeeDiscount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    validate: {
      validator: function(value) {
        return value >= 0 && value <= 100
      },
      message: 'Transport fee discount must be between 0 and 100 percent'
    }
  },
  hostelFeeDiscount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    validate: {
      validator: function(value) {
        return value >= 0 && value <= 100
      },
      message: 'Hostel fee discount must be between 0 and 100 percent'
    }
  },
  village: {
    type: String,
    trim: true,
  },
  parentName: {
    type: String,
    required: [true, 'Parent/Guardian name is required'],
    trim: true,
  },
  parentPhone: {
    type: String,
    required: [true, 'Primary parent phone is required'],
    match: [/^\d{10}$/, 'Phone number must be 10 digits'],
  },
  parentPhone2: {
    type: String,
    match: [/^\d{10}$/, 'Alternate phone must be 10 digits'],
  },
  parentEmail: {
    type: String,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email'],
  },
  profilePic: {
    type: {
      url: {
        type: String,
        required: [true, 'Profile picture URL is required']
      },
      publicId: {
        type: String,
        required: [true, 'Profile picture public ID is required']
      }
    },
  },
  originalClassName: {
    type: String,
    trim: true,
  },
  // Attendance array organized by academic year with session support
  attendance: [
    {
      academicYear: {
        type: String,
        required: true,
        enum: ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030', '2030-2031']
      },
      records: [
        {
          date: {
            type: Date,
            required: true
          },
          morning: {
            type: Boolean,
            default: null
          },
          afternoon: {
            type: Boolean,
            default: null
          },
          markedBy: {
            type: String,
          },
          updatedAt: {
            type: Date,
            default: Date.now
          }
        }
      ]
    }
  ],
  // Marks array organized by academic year with subject support
  marks: [
    {
      academicYear: {
        type: String,
        required: true,
        enum: ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030', '2030-2031']      
      },
      records: [
        {
          examType: {
            type: String,
            required: true,
            enum: ['formative-1', 'formative-2', 'formative-3', 'summative-1', 'summative-2', 'custom']
          },
          customExamName: {
            type: String,
            trim: true
          },
          subject: {
            type: String,
            required: true,
            enum: ['mathematics', 'science', 'english', 'hindi', 'social-studies', 'computer-science', 'physics', 'chemistry', 'biology']
          },
          marks: {
            type: Number,
            required: true,
            min: 0,
            max: 100
          },
          totalMarks: {
            type: Number,
            required: true,
            min: 0,
            max: 500
          },
          percentage: {
            type: Number,
            min: 0,
            max: 100
          },
          grade: {
            type: String,
            enum: ['A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'F', 'N/A'],
            default: 'N/A'
          },
          result: {
            type: String,
            enum: ['Pass', 'Fail', 'N/A'],
            default: 'N/A'
          },
          passingPercentage: {
            type: Number,
            default: 35,
            min: 0,
            max: 100
          },
          uploadedBy: {
            type: String,
          },
          uploadedAt: {
            type: Date,
            default: Date.now
          },
          updatedAt: {
            type: Date,
            default: Date.now
          }
        }
      ]
    }
  ],
  // Simplified fee details organized by academic year
  feeDetails: [
    {
      academicYear: {
        type: String,
        required: true,
        enum: ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030', '2030-2031']
      },
      schoolFee: {
        type: Number,
        required: [true, 'School fee is required'],
        min: 0,
        default: 0
      },
      transportFee: {
        type: Number,
        min: 0,
        default: 0
      },
      hostelFee: {
        type: Number,
        min: 0,
        default: 0
      },
      totalFee: {
        type: Number,
        min: 0,
        default: 0
      },
      terms: {
        type: Number,
        min: 1,
        max: 4,
        default: 3
      },
      schoolFeePaid: {
        type: Number,
        min: 0,
        default: 0
      },
      transportFeePaid: {
        type: Number,
        min: 0,
        default: 0
      },
      hostelFeePaid: {
        type: Number,
        min: 0,
        default: 0
      },
      totalPaid: {
        type: Number,
        min: 0,
        default: 0
      },
      totalDue: {
        type: Number,
        min: 0,
        default: 0
      },
      // Discounts applied for this academic year
      schoolFeeDiscountApplied: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      transportFeeDiscountApplied: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      hostelFeeDiscountApplied: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  // Payment history tracking individual fee components
  paymentHistory: [
    {
      paymentId: {
        type: String,
        required: [true, 'Payment ID is required'],
        trim: true
      },
      academicYear: {
        type: String,
        required: true,
        enum: ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030', '2030-2031']
      },
      date: {
        type: Date,
        required: [true, 'Payment date is required'],
        default: Date.now
      },
      // Individual fee component payments
      schoolFeePaid: {
        type: Number,
        min: 0,
        default: 0
      },
      transportFeePaid: {
        type: Number,
        min: 0,
        default: 0
      },
      hostelFeePaid: {
        type: Number,
        min: 0,
        default: 0
      },
      totalAmount: {
        type: Number,
        required: [true, 'Total payment amount is required'],
        min: 0
      },
      receiptNo: {
        type: String,
        required: [true, 'Receipt number is required'],
        trim: true
      },
      paymentMode: {
        type: String,
        required: [true, 'Payment mode is required'],
        enum: ['Cash', 'Cheque', 'Bank Transfer', 'Online Payment', 'Card', 'Other']
      },
      description: {
        type: String,
        trim: true
      },
      chequeNo: {
        type: String,
        trim: true
      },
      bankName: {
        type: String,
        trim: true
      },
      transactionId: {
        type: String,
        trim: true
      },
      receivedBy: {
        type: String,
        required: [true, 'Received by is required'],
        trim: true
      },
      status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
        default: 'Completed'
      },
      notes: {
        type: String,
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  feeCalculationDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// ================= SCHEMA INDEXES =================

// Indexes for attendance queries
studentSchema.index({ class: 1, section: 1, academicYear: 1 })
studentSchema.index({ 'attendance.academicYear': 1 })
studentSchema.index({ 'attendance.records.date': 1 })
studentSchema.index({ 'marks.academicYear': 1 })
studentSchema.index({ 'marks.records.examType': 1, 'marks.records.subject': 1 })

// Indexes for fee and payment queries
studentSchema.index({ 'feeDetails.academicYear': 1 })
studentSchema.index({ 'paymentHistory.academicYear': 1 })
studentSchema.index({ 'paymentHistory.date': 1 })
studentSchema.index({ 'paymentHistory.receiptNo': 1 })

// Compound indexes
studentSchema.index({ 
  'attendance.records.date': 1,
  'attendance.academicYear': 1
}, { 
  unique: false,
  sparse: true 
})

studentSchema.index({
  'marks.records.examType': 1,
  'marks.records.subject': 1,
  'marks.academicYear': 1
}, {
  unique: false,
  sparse: true
})

// ================= SCHEMA MIDDLEWARE =================

studentSchema.pre('save', function() {
  this.updatedAt = Date.now()
  return Promise.resolve()
})

// ================= SCHEMA VIRTUALS =================

// Virtual for display class name
studentSchema.virtual('displayClass').get(function() {
  return mapNumberToClassName(this.class)
})

// ================= ADD INSTANCE METHODS =================

// Add attendance instance methods
Object.assign(studentSchema.methods, attendanceInstanceMethods)

// Add marks instance methods
Object.assign(studentSchema.methods, marksInstanceMethods)

// Add fee instance methods
Object.assign(studentSchema.methods, feeInstanceMethods)

// ================= CREATE MODEL =================

const Student = mongoose.model('Student', studentSchema)

// ================= ADD STATIC METHODS =================

// Add attendance static methods
Object.assign(Student, attendanceStaticMethods)

// Add marks static methods
Object.assign(Student, marksStaticMethods)

// Add fee static methods
Object.assign(Student, feeStaticMethods)

// ================= EXPORT HELPER FUNCTIONS =================

// Export helper functions
Student.mapClassToNumber = mapClassToNumber
Student.mapNumberToClassName = mapNumberToClassName
Student.calculateGrade = marksHelperFunctions.calculateGrade
Student.determineResult = marksHelperFunctions.determineResult
Student.generatePaymentId = feeHelperFunctions.generatePaymentId
Student.generateReceiptNo = feeHelperFunctions.generateReceiptNo

module.exports = Student