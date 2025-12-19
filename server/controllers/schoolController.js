const School = require('../models/School')

const createSchool = async (req, res) => {
  try {
    await School.deleteMany({})

    const schoolData = {
      ...req.body,
      updatedAt: new Date()
    }

    const school = new School(schoolData)
    await school.save()

    res.status(201).json({
      success: true,
      data: school,
      message: 'School created successfully'
    })
  } catch (error) {
    console.error('Create school error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create school',
      error: error.message
    })
  }
}

// Get full school profile
const getSchoolProfile = async (req, res) => {
  try {
    const school = await School.findOrCreateDefault()
    res.status(200).json({
      success: true,
      data: school
    })
  } catch (error) {
    console.error('Get school profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch school profile',
      error: error.message
    })
  }
}

// Update school profile
const updateSchoolProfile = async (req, res) => {
  try {
    const updates = req.body
    const { buses, images, ...schoolUpdates } = updates

    const school = await School.findOneAndUpdate(
      {},
      { $set: { ...schoolUpdates, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).exec()

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found'
      })
    }

    res.status(200).json({
      success: true,
      data: school,
      message: 'School profile updated successfully'
    })
  } catch (error) {
    console.error('Update school profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update school profile',
      error: error.message
    })
  }
}

// Add school image
const addSchoolImage = async (req, res) => {
  try {
    const { imageUrl } = req.body

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      })
    }

    const school = await School.findOne()
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      })
    }

    school.images.push(imageUrl)
    school.updatedAt = new Date()
    await school.save()

    res.status(201).json({
      success: true,
      data: school.images,
      message: 'Image added successfully'
    })
  } catch (error) {
    console.error('Add school image error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add school image',
      error: error.message
    })
  }
}

// Delete school image
const deleteSchoolImage = async (req, res) => {
  try {
    const { index } = req.params
    const imageIndex = parseInt(index)

    const school = await School.findOne()
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      })
    }

    if (imageIndex < 0 || imageIndex >= school.images.length) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      })
    }

    school.images.splice(imageIndex, 1)
    school.updatedAt = new Date()
    await school.save()

    res.status(200).json({
      success: true,
      data: school.images,
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Delete school image error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete school image',
      error: error.message
    })
  }
}

// Get all buses
const getBuses = async (req, res) => {
  try {
    const school = await School.findOrCreateDefault()
    res.status(200).json({
      success: true,
      data: school.buses
    })
  } catch (error) {
    console.error('Get buses error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buses',
      error: error.message
    })
  }
}

// Add new bus
const addBus = async (req, res) => {
  try {
    const busData = req.body
    
    // Validate required fields
    if (!busData.name || !busData.busNumber || !busData.driverName || !busData.driverPhone) {
      return res.status(400).json({
        success: false,
        message: 'Bus name, bus number, driver name, and phone are required'
      })
    }

    const routes = Array.isArray(busData.routes) ? busData.routes : 
                  (busData.route ? [busData.route] : [])

    const newBus = {
      name: busData.name,
      busNumber: busData.busNumber,
      driverName: busData.driverName,
      driverPhone: busData.driverPhone,
      routes: routes.length > 0 ? routes : ['Not specified'],
      createdAt: new Date()
    }

    const school = await School.findOrCreateDefault()
    school.buses.push(newBus)
    school.updatedAt = new Date()
    await school.save()

    res.status(201).json({
      success: true,
      data: newBus,
      message: 'Bus added successfully'
    })
  } catch (error) {
    console.error('Add bus error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add bus',
      error: error.message
    })
  }
}

// Update specific bus by _id
const updateBus = async (req, res) => {
  try {
    const { busId } = req.params
    const busData = req.body

    if (!busData.name || !busData.busNumber || !busData.driverName || !busData.driverPhone) {
      return res.status(400).json({
        success: false,
        message: 'Bus name, bus number, driver name, and phone are required'
      })
    }

    const routes = Array.isArray(busData.routes) ? busData.routes : 
                  (busData.route ? [busData.route] : [])

    const school = await School.findOne()
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      })
    }

    // Find and update the bus by _id
    const busIndex = school.buses.findIndex(bus => bus._id.toString() === busId)
    if (busIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      })
    }

    // Update bus fields
    school.buses[busIndex].name = busData.name
    school.buses[busIndex].busNumber = busData.busNumber
    school.buses[busIndex].driverName = busData.driverName
    school.buses[busIndex].driverPhone = busData.driverPhone
    school.buses[busIndex].routes = routes.length > 0 ? routes : ['Not specified']
    
    school.updatedAt = new Date()
    await school.save()

    res.status(200).json({
      success: true,
      data: school.buses[busIndex],
      message: 'Bus updated successfully'
    })
  } catch (error) {
    console.error('Update bus error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update bus',
      error: error.message
    })
  }
}

// Delete specific bus by _id
const deleteBus = async (req, res) => {
  try {
    const { busId } = req.params

    const school = await School.findOne()
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      })
    }

    // Check if bus exists
    const busExists = school.buses.some(bus => bus._id.toString() === busId)
    if (!busExists) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      })
    }

    // Remove the bus
    school.buses = school.buses.filter(bus => bus._id.toString() !== busId)
    school.updatedAt = new Date()
    await school.save()

    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully'
    })
  } catch (error) {
    console.error('Delete bus error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete bus',
      error: error.message
    })
  }
}

module.exports = {
  createSchool,
  getSchoolProfile,
  updateSchoolProfile,
  addSchoolImage,
  deleteSchoolImage,
  getBuses,
  addBus,
  updateBus,
  deleteBus
}