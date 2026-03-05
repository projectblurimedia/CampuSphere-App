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

// Export multer middleware for routes (consistent with events)
export const uploadSchoolImages = multer({ 
  storage: tempStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'))
    }
  },
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files
  }
}).array('images', 10)

// ==================== HELPER FUNCTIONS ====================

// Helper function to cleanup temporary files (consistent with events)
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

// Helper function to parse images (consistent with events)
const parseImages = (imagesJson) => {
  try {
    if (!imagesJson) return []
    if (typeof imagesJson === 'string') {
      return JSON.parse(imagesJson)
    }
    return Array.isArray(imagesJson) ? imagesJson : []
  } catch (e) {
    console.error('Error parsing images:', e)
    return []
  }
}

// Helper function to parse routes (consistent with events pattern)
const parseRoutes = (routesJson) => {
  try {
    if (!routesJson) return []
    if (typeof routesJson === 'string') {
      return JSON.parse(routesJson)
    }
    return routesJson || []
  } catch (e) {
    console.error('Error parsing routes:', e)
    return []
  }
}

// Helper function to ensure school exists (singleton pattern)
const findOrCreateDefaultSchool = async () => {
  let school = await prisma.school.findFirst()
  
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: '',
        establishedYear: '',
        affiliation: '',
        board: '',
        principal: '',
        principalEmail: '',
        principalPhone: '',
        vicePrincipal: '',
        vicePrincipalEmail: '',
        vicePrincipalPhone: '',
        address: '',
        email: '',
        phone: '',
        website: '',
        schoolHours: '',
        officeHours: '',
        workingDays: '',
        assemblyTime: '',
        facilities: '',
        mission: '',
        vision: '',
        motto: '',
        campusArea: '',
        libraryBooks: '',
        computerSystems: '',
        images: '[]'
      }
    })
  }
  
  return school
}

// Helper function to add virtual fields to school (consistent with events pattern)
const addVirtualFields = (school) => {
  const schoolObj = { ...school }
  
  // Parse images
  schoolObj.images = parseImages(school.images)
  
  // Parse buses routes if included
  if (schoolObj.buses) {
    schoolObj.buses = schoolObj.buses.map(bus => ({
      ...bus,
      routes: parseRoutes(bus.routes)
    }))
  }
  
  return schoolObj
}

// ==================== SCHOOL PROFILE CRUD ====================

/**
 * @desc    Create initial school profile (deletes existing)
 * @route   POST /api/school
 * @access  Private
 */
export const createSchool = async (req, res) => {
  try {
    // Delete all existing school records (ensures singleton)
    await prisma.school.deleteMany({})

    // Prepare school data
    const schoolData = {
      ...req.body,
      images: '[]', // Start with empty images array
      updatedAt: new Date()
    }

    const school = await prisma.school.create({
      data: schoolData,
      include: {
        buses: true
      }
    })

    // Add virtual fields
    const schoolWithVirtuals = addVirtualFields(school)

    res.status(201).json({
      success: true,
      data: schoolWithVirtuals,
      message: 'School created successfully'
    })
  } catch (error) {
    console.error('Create school error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create school',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Get full school profile
 * @route   GET /api/school
 * @access  Public
 */
export const getSchoolProfile = async (req, res) => {
  try {
    const school = await findOrCreateDefaultSchool()

    // Get buses
    const buses = await prisma.bus.findMany({
      where: { schoolId: school.id },
      orderBy: { createdAt: 'desc' }
    })

    // Add buses to school object
    const schoolWithBuses = {
      ...school,
      buses
    }

    // Add virtual fields
    const schoolWithVirtuals = addVirtualFields(schoolWithBuses)

    res.status(200).json({
      success: true,
      data: schoolWithVirtuals
    })
  } catch (error) {
    console.error('Get school profile error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch school profile',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Update school profile
 * @route   PUT /api/school
 * @access  Private
 */
export const updateSchoolProfile = async (req, res) => {
  try {
    const updates = req.body
    const { buses, images, ...schoolUpdates } = updates

    // Get existing school
    let school = await prisma.school.findFirst()
    
    if (!school) {
      school = await findOrCreateDefaultSchool()
    }

    // Handle images if provided (expects array of image objects)
    let imagesJson = school.images
    if (images !== undefined) {
      // Validate that images is an array
      if (!Array.isArray(images)) {
        return res.status(400).json({
          success: false,
          message: 'Images must be an array'
        })
      }
      imagesJson = JSON.stringify(images)
    }

    // Update school
    const updatedSchool = await prisma.school.update({
      where: { id: school.id },
      data: {
        ...schoolUpdates,
        images: imagesJson,
        updatedAt: new Date()
      }
    })

    // Get updated buses
    const buses_list = await prisma.bus.findMany({
      where: { schoolId: school.id },
      orderBy: { createdAt: 'desc' }
    })

    // Combine data
    const schoolWithBuses = {
      ...updatedSchool,
      buses: buses_list
    }

    // Add virtual fields
    const schoolWithVirtuals = addVirtualFields(schoolWithBuses)

    res.status(200).json({
      success: true,
      data: schoolWithVirtuals,
      message: 'School profile updated successfully'
    })
  } catch (error) {
    console.error('Update school profile error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update school profile',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// ==================== SCHOOL IMAGES (CONSISTENT WITH EVENTS PATTERN) ====================

/**
 * @desc    Upload multiple school images (exactly like events pattern)
 * @route   POST /api/school/images
 * @access  Private
 */
export const addSchoolImages = [
  uploadSchoolImages,
  async (req, res) => {
    let uploadedImages = []
    
    try {
      // Check if files exist
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please upload at least one image'
        })
      }

      // Get existing school
      let school = await prisma.school.findFirst()
      
      if (!school) {
        school = await findOrCreateDefaultSchool()
      }

      // Parse current images (exactly like events pattern)
      let currentImages = []
      try {
        currentImages = typeof school.images === 'string' 
          ? JSON.parse(school.images) 
          : school.images || []
      } catch (e) {
        currentImages = []
      }

      // Check image limit (max 10 images)
      const MAX_IMAGES = 10
      if (currentImages.length + req.files.length > MAX_IMAGES) {
        cleanupTempFiles(req.files)
        return res.status(400).json({
          success: false,
          message: `Cannot add ${req.files.length} images. Maximum ${MAX_IMAGES} images allowed. Current: ${currentImages.length}`
        })
      }

      // Upload new images (exactly like events pattern)
      const newImages = []
      for (const file of req.files) {
        try {
          const uploadResult = await cloudinaryUtils.uploadToCloudinary(file.path, {
            folder: 'school/profile',
            transformation: {
              width: 1200,
              height: 800,
              crop: 'limit',
              quality: 'auto'
            }
          })

          // Create image object with metadata (exactly like events pattern)
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

      // Combine images (exactly like events pattern)
      const finalImages = [...currentImages, ...newImages]

      // Update school
      const updatedSchool = await prisma.school.update({
        where: { id: school.id },
        data: {
          images: JSON.stringify(finalImages),
          updatedAt: new Date()
        }
      })

      // Cleanup temp files
      cleanupTempFiles(req.files)

      // Parse images for response
      const parsedImages = parseImages(updatedSchool.images)

      res.status(201).json({
        success: true,
        message: 'Images uploaded successfully',
        count: newImages.length,
        data: parsedImages
      })
    } catch (error) {
      // Cleanup uploaded images from Cloudinary if error occurred
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
      
      console.error('Add school images error:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload images',
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
]

/**
 * @desc    Delete school image by publicId (exactly like events pattern)
 * @route   DELETE /api/school/images/:imageId
 * @access  Private
 */
export const deleteSchoolImage = async (req, res) => {
  try {
    const { imageId } = req.params

    // Get school
    const school = await prisma.school.findFirst()
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      })
    }

    // Parse current images (exactly like events pattern)
    let images = []
    try {
      images = typeof school.images === 'string' 
        ? JSON.parse(school.images) 
        : school.images || []
    } catch (e) {
      images = []
    }

    // Find image to remove by publicId (exactly like events pattern)
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

    // Delete from Cloudinary (exactly like events pattern)
    if (imageToRemove.publicId) {
      try {
        await cloudinaryUtils.deleteFromCloudinary(imageToRemove.publicId)
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError)
      }
    }

    // Remove from array (exactly like events pattern)
    images.splice(imageIndex, 1)

    // Update school
    const updatedSchool = await prisma.school.update({
      where: { id: school.id },
      data: {
        images: JSON.stringify(images),
        updatedAt: new Date()
      }
    })

    // Parse images for response
    const parsedImages = parseImages(updatedSchool.images)

    res.status(200).json({
      success: true,
      message: 'Image removed successfully',
      data: parsedImages
    })
  } catch (error) {
    console.error('Delete school image error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete image',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Delete school image by index (fallback method)
 * @route   DELETE /api/school/images/index/:index
 * @access  Private
 */
export const deleteSchoolImageByIndex = async (req, res) => {
  try {
    const { index } = req.params
    const imageIndex = parseInt(index)

    // Get school
    const school = await prisma.school.findFirst()
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      })
    }

    // Parse current images
    let images = []
    try {
      images = typeof school.images === 'string' 
        ? JSON.parse(school.images) 
        : school.images || []
    } catch (e) {
      images = []
    }

    // Validate index
    if (imageIndex < 0 || imageIndex >= images.length) {
      return res.status(404).json({
        success: false,
        message: 'Image not found at this index'
      })
    }

    const imageToRemove = images[imageIndex]

    // Delete from Cloudinary if publicId exists
    if (imageToRemove && imageToRemove.publicId) {
      try {
        await cloudinaryUtils.deleteFromCloudinary(imageToRemove.publicId)
        console.log(`Deleted from Cloudinary: ${imageToRemove.publicId}`)
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError)
        // Continue with database update even if Cloudinary deletion fails
      }
    }

    // Remove from array
    images.splice(imageIndex, 1)

    // Update school
    const updatedSchool = await prisma.school.update({
      where: { id: school.id },
      data: {
        images: JSON.stringify(images),
        updatedAt: new Date()
      }
    })

    // Parse images for response
    const parsedImages = parseImages(updatedSchool.images)

    res.status(200).json({
      success: true,
      data: parsedImages,
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Delete school image by index error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete image',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// ==================== BUS MANAGEMENT ====================

/**
 * @desc    Get all buses
 * @route   GET /api/school/buses
 * @access  Public
 */
export const getBuses = async (req, res) => {
  try {
    const school = await findOrCreateDefaultSchool()
    
    // Get buses
    const buses = await prisma.bus.findMany({
      where: { schoolId: school.id },
      orderBy: { createdAt: 'desc' }
    })

    // Parse routes for each bus
    const busesWithParsed = buses.map(bus => ({
      ...bus,
      routes: parseRoutes(bus.routes)
    }))

    res.status(200).json({
      success: true,
      data: busesWithParsed
    })
  } catch (error) {
    console.error('Get buses error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch buses',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Add new bus
 * @route   POST /api/school/buses
 * @access  Private
 */
export const addBus = async (req, res) => {
  try {
    const { name, busNumber, driverName, driverPhone, routes } = req.body
    
    // Validate required fields
    const requiredFields = ['name', 'busNumber', 'driverName', 'driverPhone']
    const missingFields = requiredFields.filter(field => !req.body[field])
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      })
    }

    // Validate bus number uniqueness
    const existingBus = await prisma.bus.findUnique({
      where: { busNumber }
    })

    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: 'Bus number already exists'
      })
    }

    // Process routes (ensure array)
    let routesArray = []
    if (routes) {
      if (Array.isArray(routes)) {
        routesArray = routes
      } else if (typeof routes === 'string') {
        try {
          routesArray = JSON.parse(routes)
        } catch {
          routesArray = [routes]
        }
      }
    }

    if (routesArray.length === 0) {
      routesArray = ['Not specified']
    }

    // Get school
    const school = await findOrCreateDefaultSchool()

    // Create bus
    const newBus = await prisma.bus.create({
      data: {
        schoolId: school.id,
        name: name.trim(),
        busNumber: busNumber.trim(),
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        routes: JSON.stringify(routesArray)
      }
    })

    // Parse routes for response
    const busWithParsed = {
      ...newBus,
      routes: parseRoutes(newBus.routes)
    }

    res.status(201).json({
      success: true,
      data: busWithParsed,
      message: 'Bus added successfully'
    })
  } catch (error) {
    console.error('Add bus error:', error)
    
    // Handle duplicate bus number
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Bus number already exists'
      })
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add bus',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Update specific bus by ID
 * @route   PUT /api/school/buses/:busId
 * @access  Private
 */
export const updateBus = async (req, res) => {
  try {
    const { busId } = req.params
    const { name, busNumber, driverName, driverPhone, routes } = req.body

    // Validate required fields
    const requiredFields = ['name', 'busNumber', 'driverName', 'driverPhone']
    const missingFields = requiredFields.filter(field => !req.body[field])
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      })
    }

    // Check if bus exists
    const existingBus = await prisma.bus.findUnique({
      where: { id: busId }
    })

    if (!existingBus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      })
    }

    // Check if bus number is being changed and if it's already taken
    if (busNumber !== existingBus.busNumber) {
      const busWithSameNumber = await prisma.bus.findUnique({
        where: { busNumber }
      })

      if (busWithSameNumber) {
        return res.status(400).json({
          success: false,
          message: 'Bus number already exists'
        })
      }
    }

    // Process routes
    let routesArray = []
    if (routes) {
      if (Array.isArray(routes)) {
        routesArray = routes
      } else if (typeof routes === 'string') {
        try {
          routesArray = JSON.parse(routes)
        } catch {
          routesArray = [routes]
        }
      }
    }

    if (routesArray.length === 0) {
      routesArray = ['Not specified']
    }

    // Update bus
    const updatedBus = await prisma.bus.update({
      where: { id: busId },
      data: {
        name: name.trim(),
        busNumber: busNumber.trim(),
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        routes: JSON.stringify(routesArray),
        updatedAt: new Date()
      }
    })

    // Parse routes for response
    const busWithParsed = {
      ...updatedBus,
      routes: parseRoutes(updatedBus.routes)
    }

    res.status(200).json({
      success: true,
      data: busWithParsed,
      message: 'Bus updated successfully'
    })
  } catch (error) {
    console.error('Update bus error:', error)
    
    // Handle duplicate bus number
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Bus number already exists'
      })
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update bus',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

/**
 * @desc    Delete specific bus by ID
 * @route   DELETE /api/school/buses/:busId
 * @access  Private
 */
export const deleteBus = async (req, res) => {
  try {
    const { busId } = req.params

    // Check if bus exists
    const existingBus = await prisma.bus.findUnique({
      where: { id: busId }
    })

    if (!existingBus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      })
    }

    // Delete bus
    await prisma.bus.delete({
      where: { id: busId }
    })

    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully'
    })
  } catch (error) {
    console.error('Delete bus error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete bus',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}