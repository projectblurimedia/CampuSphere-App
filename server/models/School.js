const mongoose = require('mongoose')

const busSchema = new mongoose.Schema({
  sno: { type: String, required: true, unique: true },
  busNumber: { type: String, required: true },
  driverName: { type: String, required: true },
  driverPhone: { type: String, required: true },
  routes: [{ type: String }]
}, { _id: false })

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Bluri High School' },
  establishedYear: { type: String, default: '2002' },
  affiliation: { type: String, default: 'SSE' },
  board: { type: String, default: 'Secondary School Examination' },

  principal: { type: String, default: 'Dr. Manikanta Yerraguntla' },
  principalEmail: { type: String, default: 'principal@blurihighschool.edu.in' },
  principalPhone: { type: String, default: '+91 7093054784' },
  vicePrincipal: { type: String, default: 'Ms. Haritha Kotha' },
  vicePrincipalEmail: { type: String, default: 'vp@blurihighschool.edu.in' },
  vicePrincipalPhone: { type: String, default: '+91 9391522508' },

  address: { type: String, default: 'Kannapuram, Andhra Pradesh, India - 534311' },
  email: { type: String, default: 'info@blurihighschool.edu.in' },
  phone: { type: String, default: '+91 9491754784' },
  website: { type: String, default: 'www.blurihighschool.edu.in' },

  schoolHours: { type: String, default: '9:00 AM - 4:30 PM' },
  officeHours: { type: String, default: '8:00 AM - 5:00 PM' },
  workingDays: { type: String, default: 'Monday to Saturday' },
  assemblyTime: { type: String, default: '9:00 AM' },

  facilities: { type: String, default: 'Smart Classrooms, Science Labs, Computer Lab, Library, Sports Ground, Auditorium, Cafeteria, Medical Room, Transportation, WiFi Campus' },

  mission: { type: String, default: 'To provide quality education that empowers students to become responsible citizens and lifelong learners.' },
  vision: { type: String, default: 'To be a premier educational institution nurturing global citizens with strong values and academic excellence.' },
  motto: { type: String, default: 'Learn, Lead, Excel' },
  campusArea: { type: String, default: '10 Acres' },
  libraryBooks: { type: String, default: '25,000+' },
  computerSystems: { type: String, default: '150+' },

  images: [{
    type: String,
    default: [
      'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2Nob29sJTIwYnVpbGRpbmd8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c2Nob29sJTIwY2FtcHVzfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHNjaG9vbCUyMGNsYXNzcm9vbXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2Nob29sJTIwbGlicmFyeXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80',
    ]
  }],

  buses: [busSchema],

  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
})

schoolSchema.statics.findOrCreateDefault = async function() {
  let school = await this.findOne()
  if (!school) {
    school = new this({
      // Defaults are already set in schema
    })
    await school.save()
  }
  return school
}

module.exports = mongoose.model('School', schoolSchema)