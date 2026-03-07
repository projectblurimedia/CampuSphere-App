import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '7d'

// Helper function to send OTP email
const sendOTPEmail = async (email, otp, firstName) => {
  try {
    const msg = {
      to: email,
      from: 'projectblurimedia@gmail.com', // Verified sender in SendGrid
      subject: 'Password Reset OTP - Bluri High School',
      text: `Hello ${firstName},\n\nYour OTP for password reset is: ${otp}\n\nThis OTP will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.\n\nRegards,\nBluri High School Administration`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello <strong>${firstName}</strong>,</p>
          <p>We received a request to reset your password for your Bluri High School account.</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0; color: #555;">Your OTP Code:</h3>
            <p style="font-size: 32px; font-weight: bold; color: #0066cc; margin: 10px 0;">${otp}</p>
          </div>
          <p>This code will expire in <strong>15 minutes</strong>.</p>
          <p>If you didn't request this password reset, please contact the school administration immediately.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #777; font-size: 12px;">Bluri (E.M) High School, Gavaravaram</p>
        </div>
      `,
    }
    
    await sgMail.send(msg)
    console.log(`OTP email sent successfully to ${email}`)
    return true
  } catch (error) {
    console.error('SendGrid email error:', error)
    return false
  }
}

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
    const token = jwt.sign({ id: employee.id, email: employee.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    })

    // Remove password from response
    const { hashedPassword, resetOtp, resetOtpExpiry, ...employeeData } = employee

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
    const token = jwt.sign({ id: employeeId, email: employee.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    })

    const { hashedPassword: _, resetOtp, resetOtpExpiry, ...employeeData } = employee

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

// 4. FORGOT PASSWORD - Send OTP
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
        message: 'If an account exists with this email/phone, an OTP will be sent'
      })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Set expiry to 15 minutes from now
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000)

    // Clear any existing OTP and set new one
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        resetOtp: otp,
        resetOtpExpiry: expiryTime
      }
    })

    // Send OTP via email
    const emailSent = await sendOTPEmail(employee.email, otp, employee.firstName)

    if (!emailSent) {
      // If email fails, clear the OTP
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          resetOtp: null,
          resetOtpExpiry: null
        }
      })
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again or contact administration.'
      })
    }

    console.log(`OTP for ${employee.email}: ${otp}`) // For development - remove in production

    return res.status(200).json({
      success: true,
      data: {
        employeeId: employee.id,
        message: `OTP sent successfully to your registered email`
      }
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
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

    // Find employee with matching OTP that hasn't expired
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        resetOtp: otp,
        resetOtpExpiry: {
          gt: new Date() // OTP expiry is greater than current time
        }
      }
    })

    if (!employee) {
      // Check if OTP exists but expired
      const expiredEmployee = await prisma.employee.findFirst({
        where: {
          id: employeeId,
          resetOtp: otp,
          resetOtpExpiry: {
            lte: new Date() // OTP expired
          }
        }
      })

      if (expiredEmployee) {
        // Clear expired OTP
        await prisma.employee.update({
          where: { id: employeeId },
          data: {
            resetOtp: null,
            resetOtpExpiry: null
          }
        })
        
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.'
        })
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      })
    }

    // OTP verified - create reset token
    const resetToken = jwt.sign(
      { 
        id: employeeId,
        email: employee.email,
        purpose: 'password-reset'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

    // Clear OTP from database after successful verification
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        resetOtp: null,
        resetOtpExpiry: null
      }
    })

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
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Reset token has expired. Please request a new OTP.'
        })
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid reset token'
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

    // Send confirmation email
    try {
      const msg = {
        to: employee.email,
        from: 'projectblurimedia@gmail.com',
        subject: 'Password Reset Successful - Bluri High School',
        text: `Hello ${employee.firstName},\n\nYour password has been successfully reset.\n\nIf you didn't perform this action, please contact the school administration immediately.\n\nRegards,\nBluri High School Administration`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Successful</h2>
            <p>Hello <strong>${employee.firstName}</strong>,</p>
            <p>Your password has been successfully reset.</p>
            <p>If you didn't perform this action, please contact the school administration immediately.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #777; font-size: 12px;">Bluri (E.M) High School, Gavaravaram</p>
          </div>
        `,
      }
      await sgMail.send(msg)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the request if confirmation email fails
    }

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
        message: 'New password must be different from current password'
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