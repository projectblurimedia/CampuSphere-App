import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '7d'

export const checkUserExists = async (req, res) => {
  try {
    const { emailOrPhone } = req.body
    console.log(emailOrPhone)

    if (!emailOrPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or phone number'
      })
    }

    // Check if input is email or phone
    const isEmail = emailOrPhone.includes('@')
    
    const employee = await prisma.employee.findFirst({
      where: {
        OR: isEmail 
          ? [{ email: emailOrPhone }]
          : [{ phone: emailOrPhone }],
        isActive: true
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        hashedPassword: true,
        designation: true
      }
    })

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee found with this email or phone number'
      })
    }

    // Determine next step
    const requiresPasswordSetup = !employee.hashedPassword

    return res.status(200).json({
      success: true,
      data: {
        employeeId: employee.id,
        email: employee.email,
        phone: employee.phone,
        firstName: employee.firstName,
        lastName: employee.lastName,
        designation: employee.designation,
        requiresPasswordSetup,
        nextStep: requiresPasswordSetup ? 'create-password' : 'enter-password'
      }
    })

  } catch (error) {
    console.error('Check user error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// 2. LOGIN WITH PASSWORD
export const loginWithPassword = async (req, res) => {
  try {
    const { employeeId, password } = req.body

    if (!employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and password are required'
      })
    }

    const employee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
        isActive: true
      }
    })

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or inactive'
      })
    }

    // If no password set
    if (!employee.hashedPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password not set. Please use create password flow.',
        requiresPasswordSetup: true
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, employee.hashedPassword)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      })
    }

    // Generate token
    const token = jwt.sign({ id: employee.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    })

    // Remove password from response
    const { hashedPassword, ...employeeData } = employee

    return res.status(200).json({
      success: true,
      data: {
        token,
        employee: employeeData,
        message: 'Login successful'
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// 3. CREATE PASSWORD (First-time login)
export const createPassword = async (req, res) => {
  try {
    const { employeeId, password, confirmPassword } = req.body

    if (!employeeId || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      })
    }

    // Check if employee exists and has no password
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        isActive: true,
        hashedPassword: null
      }
    })

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or password already set'
      })
    }

    // Hash and save password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    await prisma.employee.update({
      where: { id: employeeId },
      data: { 
        hashedPassword,
        updatedAt: new Date()
      }
    })

    // Auto-login after password creation
    const token = jwt.sign({ id: employeeId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    })

    const { hashedPassword: _, ...employeeData } = employee

    return res.status(200).json({
      success: true,
      data: {
        token,
        employee: employeeData,
        message: 'Password created successfully'
      }
    })

  } catch (error) {
    console.error('Create password error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// 4. FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body

    if (!emailOrPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or phone number'
      })
    }

    const isEmail = emailOrPhone.includes('@')
    
    const employee = await prisma.employee.findFirst({
      where: {
        OR: isEmail 
          ? [{ email: emailOrPhone }]
          : [{ phone: emailOrPhone }],
        isActive: true
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true
      }
    })

    if (!employee) {
      // For security, don't reveal if user exists
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a reset OTP will be sent'
      })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store OTP in session (use Redis in production)
    req.session.resetOTP = {
      employeeId: employee.id,
      otp,
      expires: Date.now() + 15 * 60 * 1000 // 15 minutes
    }

    // Send OTP (implement your SMS/email service)
    console.log(`OTP for ${employee.email || employee.phone}: ${otp}`)
    // await sendOTP(employee.email || employee.phone, otp)

    return res.status(200).json({
      success: true,
      data: {
        employeeId: employee.id,
        message: `OTP sent to your ${isEmail ? 'email' : 'phone'}`
      }
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// 5. VERIFY OTP
export const verifyOTP = async (req, res) => {
  try {
    const { employeeId, otp } = req.body

    if (!employeeId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and OTP are required'
      })
    }

    const otpData = req.session.resetOTP

    if (!otpData || otpData.employeeId !== employeeId) {
      return res.status(400).json({
        success: false,
        message: 'OTP session expired or invalid'
      })
    }

    if (Date.now() > otpData.expires) {
      delete req.session.resetOTP
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      })
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      })
    }

    // OTP verified - create reset token
    const resetToken = jwt.sign(
      { 
        id: employeeId,
        purpose: 'password-reset'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

    // Clear OTP data from session
    delete req.session.resetOTP

    return res.status(200).json({
      success: true,
      data: {
        resetToken,
        message: 'OTP verified successfully'
      }
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// 6. RESET PASSWORD WITH TOKEN
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      })
    }

    // Verify reset token
    let decoded
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET)
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired reset token'
      })
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token purpose'
      })
    }

    const employeeId = decoded.id

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, isActive: true }
    })

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      })
    }

    // Hash and update password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await prisma.employee.update({
      where: { id: employeeId },
      data: { 
        hashedPassword,
        updatedAt: new Date()
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// 7. CHANGE PASSWORD (Logged-in user)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body
    const employeeId = req.user?.id

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      })
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      })
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different'
      })
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee || !employee.hashedPassword) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      })
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, employee.hashedPassword)
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }

    // Update password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await prisma.employee.update({
      where: { id: employeeId },
      data: { 
        hashedPassword,
        updatedAt: new Date()
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// 8. LOGOUT
export const logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  })
}