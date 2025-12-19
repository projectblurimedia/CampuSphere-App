const mongoose = require('mongoose')

const busSchema = new mongoose.Schema({
  name: { type: String, required: true },
  busNumber: { type: String, required: true },
  driverName: { type: String, required: true },
  driverPhone: { type: String, required: true },
  routes: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
})

const schoolSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  establishedYear: { type: String, default: '' },
  affiliation: { type: String, default: '' },
  board: { type: String, default: '' },

  principal: { type: String, default: '' },
  principalEmail: { type: String, default: '' },
  principalPhone: { type: String, default: '' },
  vicePrincipal: { type: String, default: '' },
  vicePrincipalEmail: { type: String, default: '' },
  vicePrincipalPhone: { type: String, default: '' },

  address: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  website: { type: String, default: '' },

  schoolHours: { type: String, default: '' },
  officeHours: { type: String, default: '' },
  workingDays: { type: String, default: '' },
  assemblyTime: { type: String, default: '' },

  facilities: { type: String, default: '' },

  mission: { type: String, default: '' },
  vision: { type: String, default: '' },
  motto: { type: String, default: '' },
  campusArea: { type: String, default: '' },
  libraryBooks: { type: String, default: '' },
  computerSystems: { type: String, default: '' },

  images: [{
    type: String,
    default: []
  }],

  buses: [busSchema],

  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
})

schoolSchema.statics.findOrCreateDefault = async function() {
  let school = await this.findOne()
  if (!school) {
    school = new this()
    await school.save()
  }
  return school
}

module.exports = mongoose.model('School', schoolSchema)