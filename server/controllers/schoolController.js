const School = require('../models/School')

// Create a new school (overrides singleton if one exists use with caution)
const createSchool = async (req, res) => {
  try {
    // Optional: Delete existing if singleton enforcement needed
    await School.deleteMany({})

    const schoolData = {
      ...req.body, // Allow overriding defaults
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
    res.status(500).json({
      success: false,
      message: 'Failed to create school',
      error: error.message
    })
  }
}

// Get full school profile (all details)
const getSchoolProfile = async (req, res) => {
  try {
    const school = await School.findOrCreateDefault()
    res.status(200).json({
      success: true,
      data: school
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch school profile',
      error: error.message
    })
  }
}

// Update full school profile (all fields except buses, which have separate ops)
const updateSchoolProfile = async (req, res) => {
  try {
    const updates = req.body
    // Exclude buses from top-level update to avoid overwriting array
    const { buses, ...schoolUpdates } = updates

    const school = await School.findOneAndUpdate(
      {}, // Empty filter for singleton
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
    res.status(500).json({
      success: false,
      message: 'Failed to update school profile',
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
    if (!busData.busNumber || !busData.driverName || !busData.driverPhone) {
      return res.status(400).json({
        success: false,
        message: 'Bus number, driver name, and phone are required'
      })
    }

    // Ensure routes is array
    const routes = Array.isArray(busData.routes) ? busData.routes : (busData.routes || '').split('\n').map(r => r.trim()).filter(r => r)

    const newBus = {
      id: Date.now().toString(), // Client-like id
      ...busData,
      routes: routes.length > 0 ? routes : ['Not specified']
    }

    const school = await School.findOneAndUpdate(
      {}, // Singleton
      { $push: { buses: newBus }, $set: { updatedAt: new Date() } },
      { new: true }
    ).exec()

    res.status(201).json({
      success: true,
      data: newBus,
      message: 'Bus added successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add bus',
      error: error.message
    })
  }
}

// Update specific bus by id
const updateBus = async (req, res) => {
  try {
    const { busId } = req.params
    const busData = req.body

    if (!busData.busNumber || !busData.driverName || !busData.driverPhone) {
      return res.status(400).json({
        success: false,
        message: 'Bus number, driver name, and phone are required'
      })
    }

    // Ensure routes is array
    const routes = Array.isArray(busData.routes) ? busData.routes : (busData.routes || '').split('\n').map(r => r.trim()).filter(r => r)

    const updateData = {
      ...busData,
      routes: routes.length > 0 ? routes : ['Not specified'],
      updatedAt: new Date() // Not directly on bus, but on school
    }

    // Remove id from update to avoid conflicts
    const { id, ...cleanUpdate } = updateData

    const school = await School.findOneAndUpdate(
      { 'buses.id': busId },
      { 
        $set: { 
          'buses.$[bus].busNumber': cleanUpdate.busNumber,
          'buses.$[bus].driverName': cleanUpdate.driverName,
          'buses.$[bus].driverPhone': cleanUpdate.driverPhone,
          'buses.$[bus].routes': cleanUpdate.routes,
          'buses.$[bus].capacity': cleanUpdate.capacity,
          'buses.$[bus].morningPickup': cleanUpdate.morningPickup,
          'buses.$[bus].eveningDrop': cleanUpdate.eveningDrop,
          updatedAt: new Date()
        } 
      },
      { 
        arrayFilters: [{ 'bus.id': busId }], 
        new: true 
      }
    ).exec()

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      })
    }

    const updatedBus = school.buses.find(b => b.id === busId)
    res.status(200).json({
      success: true,
      data: updatedBus,
      message: 'Bus updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update bus',
      error: error.message
    })
  }
}

// Delete specific bus by id
const deleteBus = async (req, res) => {
  try {
    const { busId } = req.params

    const school = await School.findOneAndUpdate(
      {},
      { 
        $pull: { buses: { id: busId } }, 
        $set: { updatedAt: new Date() } 
      },
      { new: true }
    ).exec()

    if (school.buses.length === 0 && !school.buses.some(b => b.id === busId)) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully'
    })
  } catch (error) {
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
  getBuses,
  addBus,
  updateBus,
  deleteBus
}