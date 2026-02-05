import express from 'express'
import prisma from './lib/prisma.js'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'
import helmet from 'helmet'
import session from 'express-session'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/authRoutes.js'
import studentRoutes from './routes/studentRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 8080

// Middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  credentials: true,
  origin: '*'
}))

// Session for OTP storage
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000 // 15 minutes
  }
}))

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many attempts, please try again later'
})

// Apply rate limiting to auth routes
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/forgot-password', authLimiter)


// Routes
app.use('/api/auth', authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/attendances', attendanceRoutes)
app.use('/api/employees', employeeRoutes)

app.use((error, req, res, next) => {
  const errorStatus = error.status || 500
  const errorMessage = error.message || 'Something went wrong!'
  console.error(error)  
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: error.stack
  })
})

const server = app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  try {
    await prisma.$connect()
    console.log('✅ Prisma connected to database')
  } catch (error) {
    console.error('❌ Prisma connection failed:', error)
  }
})

const shutdown = async () => {
  console.log('🛑 Shutting down gracefully...')
  
  server.close(async () => {
    console.log('✅ HTTP server closed')
    
    await prisma.$disconnect()
    console.log('✅ Database disconnected')
    
    process.exit(0)
  })

  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 10000)
}


// Handle shutdown signals
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
})