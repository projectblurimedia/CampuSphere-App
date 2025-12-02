const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, 'First Name is required'],
    trim: true,
    minlength: [3, 'First Name must be at least 3 characters long'],
  },
  lastname: {
    type: String,
    required: [true, 'Last Name is required'],
    trim: true,
    minlength: [3, 'Last Name must be at least 3 characters long'],
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  isAdmin: {
    type: Boolean,
    default: false, 
  },
})

module.exports = mongoose.model('User', userSchema)