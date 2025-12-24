const mongoose = require('mongoose')

const staffSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Phone number must be 10 digits']
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    match: [/^[0-9]{6}$/, 'Pincode must be 6 digits']
  },
  
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required'],
    default: Date.now
  },
  qualification: {
    type: String,
    required: [true, 'Qualification is required'],
    trim: true
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: 0
  },
  
  // Documents
  aadharNumber: {
    type: String,
    required: [true, 'Aadhar number is required'],
    unique: true,
    trim: true,
    match: [/^[0-9]{12}$/, 'Aadhar number must be 12 digits']
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  
  // Profile
  profilePic: {
    url: String,
    publicId: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave', 'Resigned', 'Terminated'],
    default: 'Active'
  },

}, {
  timestamps: true
})

const Staff = mongoose.model('Staff', staffSchema)

module.exports = Staff