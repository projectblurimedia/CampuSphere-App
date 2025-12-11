const jwt = require('jsonwebtoken')
const { promisify } = require('util')
const User = require('../models/User')

/**
 * Protect routes - verify JWT token
 */
exports.protect = async (req, res, next) => {
  try {
    let token
    
    // 1) Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }
    
    // 2) If no token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'You are not logged in. Please log in to get access.'
      })
    }
    
    // 3) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    
    // 4) Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      })
    }
    
    // 5) Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'User recently changed password. Please log in again.'
      })
    }
    
    // 6) Grant access to protected route
    req.user = currentUser
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.'
    })
  }
}

/**
 * Restrict access to certain roles
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.'
      })
    }
    next()
  }
}

/**
 * Generate JWT token
 */
exports.signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

/**
 * Verify token for socket connections
 */
exports.verifySocketToken = async (token) => {
  try {
    if (!token) {
      return null
    }
    
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    
    return user
  } catch (error) {
    return null
  }
}