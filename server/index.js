const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const path = require('path')
const authRoute = require('./routes/authRoute')
const schoolRoute = require('./routes/schoolRoute')
const eventRoute = require('./routes/eventRoute')
const studentRoute = require('./routes/studentRoute')
const staffRoute = require('./routes/staffRoute')
const attendanceRoute = require('./routes/attendanceRoute')
const marksRoute = require('./routes/marksRoute')

const app = express()
dotenv.config({ quiet: true })

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const databaseConnection = () => {
  mongoose.connect(process.env.MONGOURI).then(() => {
    console.log('Database Connected')
  }).catch((error) => {
    console.log('Database not connected!..', error)
  })
}

app.use(helmet())
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(express.json({ limit: '50mb' }))
app.use(cors({
  credentials: true,
  origin : '*'
}))
app.use(morgan('dev'))


app.use('/server/auth', authRoute)
app.use('/server/school', schoolRoute)
app.use('/server/events', eventRoute)
app.use('/server/students', studentRoute)
app.use('/server/staff', staffRoute)
app.use('/server/attendance', attendanceRoute)
app.use('/server/marks', marksRoute)

app.use((error, req, res, next) => {
  const errorStatus = error.status || 500
  const errorMessage = error.message || 'Something went wrong!..'
  return res.status(errorStatus).json({
    success : false,
    status : errorStatus,
    message : errorMessage,
    stack : error.stack
  })

})

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on http://192.168.31.232:${process.env.PORT}`)
  databaseConnection()
})