// models/Timetable.js
const mongoose = require('mongoose')

const slotSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['period', 'break'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  staffName: {
    type: String
  },
  timings: {
    type: String,
    required: true
  }
})

const timetableSchema = new mongoose.Schema({
  class: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  slots: [slotSchema]
}, {
  timestamps: true
})

timetableSchema.index({ class: 1, section: 1, day: 1 }, { unique: true })

module.exports = mongoose.model('Timetable', timetableSchema)