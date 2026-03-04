import prisma from '../lib/prisma.js'
import cloudinaryUtils from '../config/cloudinary.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

// ==================== CONFIGURATION ====================

// Multer configuration for file uploads
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = 'temp/uploads/'
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    cb(null, tempDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

// Export multer middleware for routes
export const uploadEventImages = multer({ 
  storage: tempStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'))
    }
  },
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files
  }
}).array('images', 10)

// ==================== HELPER FUNCTIONS ====================

// Helper function to cleanup temporary files
const cleanupTempFiles = (files) => {
  if (!files) return
  
  if (Array.isArray(files)) {
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
    })
  } else if (files.path && fs.existsSync(files.path)) {
    fs.unlinkSync(files.path)
  }
}

// Helper function to parse imagesToRemove
const parseImagesToRemove = (imagesToRemove) => {
  try {
    if (!imagesToRemove) return []
    if (typeof imagesToRemove === 'string') {
      return JSON.parse(imagesToRemove)
    }
    if (Array.isArray(imagesToRemove)) {
      return imagesToRemove
    }
    return []
  } catch (error) {
    console.error('Error parsing imagesToRemove:', error)
    return []
  }
}

// Helper function for date formatting
const formatDateForResponse = (date) => {
  return date.toISOString().split('T')[0]
}

// Helper function to check if event is upcoming
const isUpcoming = (eventDate) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const eventDateObj = new Date(eventDate)
  eventDateObj.setHours(0, 0, 0, 0)
  return eventDateObj >= tomorrow
}

// Helper function to check if event is past
const isPast = (eventDate) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDateObj = new Date(eventDate)
  eventDateObj.setHours(0, 0, 0, 0)
  return eventDateObj < today
}

// Helper function to check if event is today
const isToday = (eventDate) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const eventDateObj = new Date(eventDate)
  eventDateObj.setHours(0, 0, 0, 0)
  return eventDateObj >= today && eventDateObj < tomorrow
}

// Helper function to add virtual fields to event
const addVirtualFields = (event) => {
  const eventObj = { ...event }
  
  // Add formatted date
  eventObj.formattedDate = formatDateForResponse(event.date)
  
  // Add status booleans
  eventObj.isUpcoming = isUpcoming(event.date)
  eventObj.isPast = isPast(event.date)
  eventObj.isToday = isToday(event.date)
  
  // Parse images if they're stored as JSON
  if (typeof eventObj.images === 'string') {
    try {
      eventObj.images = JSON.parse(eventObj.images)
    } catch (e) {
      eventObj.images = []
    }
  }
  
  return eventObj
}

// ==================== CRUD OPERATIONS ====================

/**
 * @desc    Get all events, sorted by date descending
 * @route   GET /api/events
 * @access  Public
 */
export const getAllEvents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query
    
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    const orderBy = {}
    orderBy[sortBy] = sortOrder
    
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        orderBy,
        take: limitNum,
        skip
      }),
      prisma.event.count()
    ])

    // Add virtual fields to each event
    const eventsWithVirtuals = events.map(event => addVirtualFields(event))

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      data: eventsWithVirtuals
    })
  } catch (error) {
    console.error('Get all events error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch events',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Get upcoming events (events starting from tomorrow onwards)
 * @route   GET /api/events/upcoming
 * @access  Public
 */
export const getUpcomingEvents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    const orderBy = {}
    orderBy[sortBy] = sortOrder

    const where = {
      date: {
        gte: tomorrow
      }
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        take: limitNum,
        skip
      }),
      prisma.event.count({ where })
    ])

    const eventsWithVirtuals = events.map(event => addVirtualFields(event))

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      data: eventsWithVirtuals
    })
  } catch (error) {
    console.error('Get upcoming events error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch upcoming events',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Get past events (events before today)
 * @route   GET /api/events/past
 * @access  Public
 */
export const getPastEvents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    const orderBy = {}
    orderBy[sortBy] = sortOrder

    const where = {
      date: {
        lt: today
      }
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        take: limitNum,
        skip
      }),
      prisma.event.count({ where })
    ])

    const eventsWithVirtuals = events.map(event => addVirtualFields(event))

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      data: eventsWithVirtuals
    })
  } catch (error) {
    console.error('Get past events error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch past events',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Get today's events
 * @route   GET /api/events/today
 * @access  Public
 */
export const getTodaysEvents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    const orderBy = {}
    orderBy[sortBy] = sortOrder

    const where = {
      date: {
        gte: today,
        lt: tomorrow
      }
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        take: limitNum,
        skip
      }),
      prisma.event.count({ where })
    ])

    const eventsWithVirtuals = events.map(event => addVirtualFields(event))

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      data: eventsWithVirtuals
    })
  } catch (error) {
    console.error('Get today\'s events error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch today\'s events',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Get a single event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params

    const event = await prisma.event.findUnique({
      where: { id }
    })

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      })
    }

    const eventWithVirtuals = addVirtualFields(event)

    res.status(200).json({
      success: true,
      data: eventWithVirtuals
    })
  } catch (error) {
    console.error('Get event by ID error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch event',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Create a new event with optional image uploads
 * @route   POST /api/events
 * @access  Private
 */
export const createEvent = [
  uploadEventImages,
  async (req, res) => {
    let uploadedImages = []
    
    try {
      const { title, date, description } = req.body

      // Validate required fields
      const requiredFields = ['title', 'date', 'description']
      const missingFields = requiredFields.filter(field => !req.body[field])
      
      if (missingFields.length > 0) {
        cleanupTempFiles(req.files)
        return res.status(400).json({ 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        })
      }

      // Validate title length
      if (title.length > 100) {
        cleanupTempFiles(req.files)
        return res.status(400).json({
          success: false,
          message: 'Title cannot exceed 100 characters'
        })
      }

      // Validate description length
      if (description.length > 2000) {
        cleanupTempFiles(req.files)
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 2000 characters'
        })
      }

      // Parse date
      const eventDate = new Date(date)
      if (isNaN(eventDate.getTime())) {
        cleanupTempFiles(req.files)
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        })
      }

      // Upload images if provided
      const images = []
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            const uploadResult = await cloudinaryUtils.uploadToCloudinary(file.path, {
              folder: 'school/events',
              transformation: {
                width: 1200,
                height: 800,
                crop: 'limit',
                quality: 'auto'
              }
            })

            images.push({
              url: uploadResult.url,
              publicId: uploadResult.publicId,
              uploadedAt: new Date().toISOString()
            })
            uploadedImages.push(uploadResult)
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError)
          }
        }
      }

      // Create event
      const event = await prisma.event.create({
        data: {
          title: title.trim(),
          date: eventDate,
          description: description.trim(),
          images: JSON.stringify(images)
        }
      })

      // Cleanup temp files
      cleanupTempFiles(req.files)

      const eventWithVirtuals = addVirtualFields(event)

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: eventWithVirtuals
      })
    } catch (error) {
      // Cleanup uploaded files from Cloudinary if error occurred
      if (uploadedImages.length > 0) {
        for (const image of uploadedImages) {
          try {
            if (image.publicId) {
              await cloudinaryUtils.deleteFromCloudinary(image.publicId)
            }
          } catch (deleteError) {
            console.error('Error cleaning up uploaded image:', deleteError)
          }
        }
      }
      
      cleanupTempFiles(req.files)
      
      console.error('Create event error:', error)
      
      // Handle Prisma unique constraint errors (if any)
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'Duplicate entry found'
        })
      }
      
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to create event',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
]

/**
 * @desc    Update an existing event
 * @route   PUT /api/events/:id
 * @access  Private
 */
export const updateEvent = [
  uploadEventImages,
  async (req, res) => {
    let uploadedImages = []
    
    try {
      console.log('=== UPDATE EVENT REQUEST ===')
      const { id } = req.params
      const { title, date, description, imagesToRemove } = req.body

      // Find the event
      const existingEvent = await prisma.event.findUnique({
        where: { id }
      })

      if (!existingEvent) {
        cleanupTempFiles(req.files)
        return res.status(404).json({ 
          success: false, 
          message: 'Event not found' 
        })
      }

      console.log('Found event:', {
        id: existingEvent.id,
        title: existingEvent.title
      })

      // Parse current images
      let currentImages = []
      try {
        currentImages = typeof existingEvent.images === 'string' 
          ? JSON.parse(existingEvent.images) 
          : existingEvent.images || []
      } catch (e) {
        currentImages = []
      }

      console.log('Current images count:', currentImages.length)

      // Parse images to remove
      const imagesToRemoveArray = parseImagesToRemove(imagesToRemove)
      console.log('Images to remove:', imagesToRemoveArray)

      // Handle image removal
      let imagesToKeep = [...currentImages]
      const publicIdsToDelete = []

      if (imagesToRemoveArray.length > 0) {
        imagesToKeep = currentImages.filter(image => {
          const shouldRemove = imagesToRemoveArray.some(removeId => 
            image.publicId === removeId || image._id === removeId
          )
          
          if (shouldRemove && image.publicId) {
            publicIdsToDelete.push(image.publicId)
          }
          
          return !shouldRemove
        })

        console.log(`After removal: ${imagesToKeep.length} images remain`)
      }

      // Upload new images
      const newImages = []
      if (req.files && req.files.length > 0) {
        console.log(`Uploading ${req.files.length} new images...`)
        
        for (const file of req.files) {
          try {
            const uploadResult = await cloudinaryUtils.uploadToCloudinary(file.path, {
              folder: 'school/events',
              transformation: {
                width: 1200,
                height: 800,
                crop: 'limit',
                quality: 'auto'
              }
            })

            const imageData = {
              url: uploadResult.url,
              publicId: uploadResult.publicId,
              uploadedAt: new Date().toISOString()
            }
            
            newImages.push(imageData)
            uploadedImages.push(uploadResult)
            
            console.log('Uploaded:', uploadResult.publicId)
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError)
          }
        }
      }

      // Combine existing and new images
      const finalImages = [...imagesToKeep, ...newImages]

      // Delete removed images from Cloudinary
      if (publicIdsToDelete.length > 0) {
        console.log(`Deleting ${publicIdsToDelete.length} images from Cloudinary...`)
        try {
          await cloudinaryUtils.deleteMultipleFromCloudinary(publicIdsToDelete)
          console.log('Successfully deleted images from Cloudinary')
        } catch (cloudinaryError) {
          console.error('Error deleting from Cloudinary:', cloudinaryError)
        }
      }

      // Prepare update data
      const updateData = {}

      if (title !== undefined) {
        if (title.length > 100) {
          cleanupTempFiles(req.files)
          return res.status(400).json({
            success: false,
            message: 'Title cannot exceed 100 characters'
          })
        }
        updateData.title = title.trim()
      }

      if (description !== undefined) {
        if (description.length > 2000) {
          cleanupTempFiles(req.files)
          return res.status(400).json({
            success: false,
            message: 'Description cannot exceed 2000 characters'
          })
        }
        updateData.description = description.trim()
      }

      if (date !== undefined) {
        const eventDate = new Date(date)
        if (isNaN(eventDate.getTime())) {
          cleanupTempFiles(req.files)
          return res.status(400).json({
            success: false,
            message: 'Invalid date format'
          })
        }
        updateData.date = eventDate
      }

      // Always update images if changed
      if (imagesToRemoveArray.length > 0 || newImages.length > 0) {
        updateData.images = JSON.stringify(finalImages)
      }

      // Update event
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: updateData
      })

      // Cleanup temp files
      cleanupTempFiles(req.files)

      console.log('Event updated successfully')

      const eventWithVirtuals = addVirtualFields(updatedEvent)

      res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        data: eventWithVirtuals
      })
    } catch (error) {
      // Cleanup uploaded files from Cloudinary if error occurred
      if (uploadedImages.length > 0) {
        for (const image of uploadedImages) {
          try {
            if (image.publicId) {
              await cloudinaryUtils.deleteFromCloudinary(image.publicId)
            }
          } catch (deleteError) {
            console.error('Error cleaning up uploaded image:', deleteError)
          }
        }
      }
      
      cleanupTempFiles(req.files)
      
      console.error('Update event error:', error)
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'Duplicate entry found'
        })
      }
      
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to update event',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
]

/**
 * @desc    Delete an event and all associated images
 * @route   DELETE /api/events/:id
 * @access  Private
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params

    const event = await prisma.event.findUnique({
      where: { id }
    })

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      })
    }

    // Parse images to get public IDs
    let images = []
    try {
      images = typeof event.images === 'string' 
        ? JSON.parse(event.images) 
        : event.images || []
    } catch (e) {
      images = []
    }

    // Collect all public IDs for deletion
    const publicIds = images
      .filter(image => image.publicId)
      .map(image => image.publicId)

    // Delete all images from Cloudinary
    if (publicIds.length > 0) {
      try {
        await cloudinaryUtils.deleteMultipleFromCloudinary(publicIds)
        console.log(`Deleted ${publicIds.length} images from Cloudinary`)
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError)
      }
    }

    // Delete event from database
    await prisma.event.delete({
      where: { id }
    })

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    })
  } catch (error) {
    console.error('Delete event error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete event',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Upload additional images to an existing event
 * @route   POST /api/events/:id/images
 * @access  Private
 */
export const addEventImages = [
  uploadEventImages,
  async (req, res) => {
    let uploadedImages = []
    
    try {
      const { id } = req.params

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please upload at least one image' 
        })
      }

      const event = await prisma.event.findUnique({
        where: { id }
      })

      if (!event) {
        cleanupTempFiles(req.files)
        return res.status(404).json({ 
          success: false, 
          message: 'Event not found' 
        })
      }

      // Parse current images
      let currentImages = []
      try {
        currentImages = typeof event.images === 'string' 
          ? JSON.parse(event.images) 
          : event.images || []
      } catch (e) {
        currentImages = []
      }

      // Upload new images
      const newImages = []
      for (const file of req.files) {
        try {
          const uploadResult = await cloudinaryUtils.uploadToCloudinary(file.path, {
            folder: 'school/events',
            transformation: {
              width: 1200,
              height: 800,
              crop: 'limit',
              quality: 'auto'
            }
          })

          const imageData = {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            uploadedAt: new Date().toISOString()
          }
          
          newImages.push(imageData)
          uploadedImages.push(uploadResult)
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
        }
      }

      // Combine images
      const finalImages = [...currentImages, ...newImages]

      // Update event
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: {
          images: JSON.stringify(finalImages)
        }
      })

      // Cleanup temp files
      cleanupTempFiles(req.files)

      const eventWithVirtuals = addVirtualFields(updatedEvent)

      res.status(200).json({
        success: true,
        message: 'Images uploaded successfully',
        count: newImages.length,
        data: eventWithVirtuals
      })
    } catch (error) {
      // Cleanup uploaded files from Cloudinary if error occurred
      if (uploadedImages.length > 0) {
        for (const image of uploadedImages) {
          try {
            if (image.publicId) {
              await cloudinaryUtils.deleteFromCloudinary(image.publicId)
            }
          } catch (deleteError) {
            console.error('Error cleaning up uploaded image:', deleteError)
          }
        }
      }
      
      cleanupTempFiles(req.files)
      
      console.error('Add images error:', error)
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to upload images',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
]

/**
 * @desc    Remove a specific image from an event
 * @route   DELETE /api/events/:id/images/:imageId
 * @access  Private
 */
export const removeEventImage = async (req, res) => {
  try {
    const { id, imageId } = req.params
    console.log(req.params)

    const event = await prisma.event.findUnique({
      where: { id }
    })

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      })
    }

    // Parse images
    let images = []
    try {
      images = typeof event.images === 'string' 
        ? JSON.parse(event.images) 
        : event.images || []
    } catch (e) {
      images = []
    }

    // Find image to remove
    const imageIndex = images.findIndex(img => 
      img.publicId === imageId || img._id === imageId
    )

    if (imageIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      })
    }

    const imageToRemove = images[imageIndex]

    // Remove from Cloudinary
    if (imageToRemove.publicId) {
      try {
        await cloudinaryUtils.deleteFromCloudinary(imageToRemove.publicId)
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError)
      }
    }

    // Remove from array
    images.splice(imageIndex, 1)

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        images: JSON.stringify(images)
      }
    })

    const eventWithVirtuals = addVirtualFields(updatedEvent)

    res.status(200).json({
      success: true,
      message: 'Image removed successfully',
      data: eventWithVirtuals
    })
  } catch (error) {
    console.error('Remove image error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to remove image',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Search events by title or description
 * @route   GET /api/events/search
 * @access  Public
 */
export const searchEvents = async (req, res) => {
  try {
    const { 
      query,
      page = 1, 
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query

    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      })
    }

    const searchTerm = query.trim()
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    const orderBy = {}
    orderBy[sortBy] = sortOrder

    const where = {
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        take: limitNum,
        skip
      }),
      prisma.event.count({ where })
    ])

    const eventsWithVirtuals = events.map(event => addVirtualFields(event))

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      data: eventsWithVirtuals
    })
  } catch (error) {
    console.error('Search events error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to search events',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Get events within a specific date range
 * @route   GET /api/events/date-range
 * @access  Public
 */
export const getEventsByDateRange = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate,
      page = 1, 
      limit = 20,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      })
    }

    // Set end date to end of day
    end.setHours(23, 59, 59, 999)

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum
    
    const orderBy = {}
    orderBy[sortBy] = sortOrder

    const where = {
      date: {
        gte: start,
        lte: end
      }
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        take: limitNum,
        skip
      }),
      prisma.event.count({ where })
    ])

    const eventsWithVirtuals = events.map(event => addVirtualFields(event))

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      pagination: {
        current: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      data: eventsWithVirtuals
    })
  } catch (error) {
    console.error('Get events by date range error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch events',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Get event statistics
 * @route   GET /api/events/statistics
 * @access  Private
 */
export const getEventStatistics = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfYear = new Date(today.getFullYear(), 0, 1)

    const [total, upcoming, past, todayCount, thisMonth, thisYear, recentEvents] = await Promise.all([
      // Total events
      prisma.event.count(),
      
      // Upcoming events
      prisma.event.count({
        where: {
          date: { gte: tomorrow }
        }
      }),
      
      // Past events
      prisma.event.count({
        where: {
          date: { lt: today }
        }
      }),
      
      // Today's events
      prisma.event.count({
        where: {
          date: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      
      // This month's events
      prisma.event.count({
        where: {
          date: { gte: startOfMonth }
        }
      }),
      
      // This year's events
      prisma.event.count({
        where: {
          date: { gte: startOfYear }
        }
      }),
      
      // Recent events (last 5)
      prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          date: true,
          createdAt: true
        }
      })
    ])

    const recentWithVirtuals = recentEvents.map(event => ({
      ...event,
      formattedDate: formatDateForResponse(event.date)
    }))

    const statistics = {
      total,
      upcoming,
      past,
      today: todayCount,
      thisMonth,
      thisYear,
      recent: recentWithVirtuals
    }

    res.status(200).json({
      success: true,
      data: statistics
    })
  } catch (error) {
    console.error('Event statistics error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get event statistics',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}