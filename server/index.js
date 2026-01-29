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
const feeRoute = require('./routes/feeRoute')
const classFeeRoute = require('./routes/classFeeRoute')
const busFeeRoute = require('./routes/busFeeRoute')
const hostelFeeRoute = require('./routes/hostelFeeRoute')
const paymentRoute = require('./routes/paymentRoute')
const cashFlowRoute = require('./routes/cashFlowRoute')
const timetableRoute = require('./routes/timetableRoute')

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
  origin: '*'
}))
app.use(morgan('dev'))

// ============ KEEP-ALIVE ENDPOINTS (ADDED FOR RENDER) ============

// Health check endpoint for uptime monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  })
})

// Warm-up endpoint to prevent cold starts
app.get('/warmup', async (req, res) => {
  try {
    console.log('🔥 Warming up server...')
    
    // Check database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping()
    }
    
    res.status(200).json({
      success: true,
      message: 'Server warmed up successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Warm-up error:', error.message)
    res.status(200).json({
      success: false,
      message: 'Warm-up attempted',
      error: error.message
    })
  }
})

// Simple ping endpoint
app.get('/ping', (req, res) => {
  res.status(200).json({
    pong: new Date().toISOString(),
    message: 'Server is alive'
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'School Management System API',
    status: 'running',
    keepAliveEndpoints: [
      '/health - for uptime monitoring',
      '/warmup - to pre-load server',
      '/ping - simple alive check'
    ]
  })
})

// ============ YOUR EXISTING ROUTES ============

app.use('/server/auth', authRoute)
app.use('/server/school', schoolRoute)
app.use('/server/events', eventRoute)
app.use('/server/students', studentRoute)
app.use('/server/staff', staffRoute)
app.use('/server/attendance', attendanceRoute)
app.use('/server/marks', marksRoute)
app.use('/server/fees', feeRoute)
app.use('/server/class-fees', classFeeRoute)
app.use('/server/bus-fees', busFeeRoute)
app.use('/server/hostel-fees', hostelFeeRoute)
app.use('/server/payments', paymentRoute)
app.use('/server/cashFlow', cashFlowRoute)
app.use('/server/timetable', timetableRoute)

// ============ ERROR HANDLER (YOUR EXISTING CODE) ============

app.use((error, req, res, next) => {
  const errorStatus = error.status || 500
  const errorMessage = error.message || 'Something went wrong!..'
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: error.stack
  })
})

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on http://192.168.31.232:${process.env.PORT}`)
  databaseConnection()
})