import express from 'express'
import {
  checkUserExists,
  loginWithPassword,
  createPassword,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  logout
} from '../controllers/authController.js'
import { authenticate } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.post('/check-user', checkUserExists)
router.post('/login', loginWithPassword)
router.post('/create-password', createPassword)
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOTP)
router.post('/reset-password', resetPassword)
router.post('/logout', logout)

// Protected routes
router.post('/change-password', authenticate, changePassword)

export default router