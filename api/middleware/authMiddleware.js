import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      })
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Attach user to request
    req.user = { id: decoded.id }
    
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      })
    }

    console.error('Auth middleware error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// Optional: Admin middleware
export const isAdmin = async (req, res, next) => {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const employee = await prisma.employee.findUnique({
      where: { id: req.user.id },
      select: { designation: true }
    })

    if (!employee || !['ADMIN', 'PRINCIPAL', 'MANAGER'].includes(employee.designation)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required'
      })
    }

    next()
  } catch (error) {
    console.error('Admin middleware error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}