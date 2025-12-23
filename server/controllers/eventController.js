// controllers/eventController.js
const Event = require('../models/Event')
const cloudinaryUtils = require('../config/cloudinary')

// Get all events, sorted by date descending
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ date: -1 })
        res.status(200).json({ success: true, data: events })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Get upcoming events (events starting from tomorrow onwards), sorted by date ascending
exports.getUpcomingEvents = async (req, res) => {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const events = await Event.find({ date: { $gte: tomorrow } }).sort({ date: 1 })
        res.status(200).json({ success: true, data: events })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Get past events (events before today), sorted by date descending
exports.getPastEvents = async (req, res) => {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const events = await Event.find({ date: { $lt: today } }).sort({ date: -1 })
        res.status(200).json({ success: true, data: events })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Get today's events (events on the current day), sorted by date ascending
exports.getTodaysEvents = async (req, res) => {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const events = await Event.find({ date: { $gte: today, $lt: tomorrow } }).sort({ date: 1 })
        res.status(200).json({ success: true, data: events })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Get a single event by ID
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' })
        }
        res.status(200).json({ success: true, data: event })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Create a new event with optional image uploads
exports.createEvent = async (req, res) => {
    try {
        const { title, date, description } = req.body
        
        if (!title || !date || !description) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide title, date, and description' 
            })
        }
        
        let images = []
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const uploadResult = await cloudinaryUtils.uploadToCloudinary(file.path)
                images.push({
                    url: uploadResult.url,
                    publicId: uploadResult.publicId
                })
            }
        }
        
        const event = await Event.create({
            title,
            date: new Date(date),
            description,
            images
        })
        
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: event
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Update an existing event, handling image additions and removals efficiently
exports.updateEvent = async (req, res) => {
    try {
        console.log('=== UPDATE EVENT REQUEST ===')
        console.log('Request params:', req.params)
        console.log('Request body keys:', Object.keys(req.body))
        console.log('Title from body:', req.body.title)
        console.log('Date from body:', req.body.date)
        console.log('Description from body:', req.body.description)
        console.log('ImagesToRemove from body (raw):', req.body.imagesToRemove)
        
        // Check if files were uploaded
        if (req.files) {
            console.log(`Number of uploaded files: ${req.files.length}`)
            req.files.forEach((file, index) => {
                console.log(`File ${index + 1}:`, {
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    filename: file.filename
                })
            })
        } else {
            console.log('No files uploaded')
        }
        
        const { title, date, description, imagesToRemove } = req.body
        
        // Find the event
        let event = await Event.findById(req.params.id)
        
        if (!event) {
            console.log('Event not found for ID:', req.params.id)
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            })
        }
        
        console.log('Found event:', {
            id: event._id,
            title: event.title,
            currentImagesCount: event.images.length
        })
        
        // Start with existing images
        let newImages = [...event.images]
        console.log('Initial images array length:', newImages.length)
        
        // Parse imagesToRemove if it exists
        let imagesToRemoveArray = []
        try {
            if (imagesToRemove) {
                if (typeof imagesToRemove === 'string') {
                    console.log('Parsing imagesToRemove as JSON string')
                    imagesToRemoveArray = JSON.parse(imagesToRemove)
                } else if (Array.isArray(imagesToRemove)) {
                    console.log('imagesToRemove is already an array')
                    imagesToRemoveArray = imagesToRemove
                }
                console.log('Parsed imagesToRemoveArray:', imagesToRemoveArray)
                console.log('Length of imagesToRemoveArray:', imagesToRemoveArray.length)
            } else {
                console.log('No imagesToRemove provided')
            }
        } catch (parseError) {
            console.error('Error parsing imagesToRemove:', parseError)
            console.error('imagesToRemove value that caused error:', imagesToRemove)
        }
        
        // Remove images that need to be deleted
        if (imagesToRemoveArray.length > 0) {
            console.log('Processing images to remove...')
            const imagesToKeep = []
            const publicIdsToDelete = []
            
            for (const image of newImages) {
                console.log('Checking image:', {
                    _id: image._id,
                    publicId: image.publicId,
                    url: image.url ? image.url.substring(0, 50) + '...' : 'no url'
                })
                
                const shouldRemove = imagesToRemoveArray.some(removeId => {
                    const matchById = image._id && removeId === image._id.toString()
                    const matchByPublicId = image.publicId && removeId === image.publicId
                    return matchById || matchByPublicId
                })
                
                console.log(`Should remove image ${image._id}: ${shouldRemove}`)
                
                if (shouldRemove) {
                    if (image.publicId) {
                        console.log(`Adding to deletion queue: ${image.publicId}`)
                        publicIdsToDelete.push(image.publicId)
                    } else {
                        console.log('Image has no publicId, skipping Cloudinary deletion')
                    }
                } else {
                    console.log(`Keeping image: ${image._id}`)
                    imagesToKeep.push(image)
                }
            }
            
            // Delete images from Cloudinary in parallel
            if (publicIdsToDelete.length > 0) {
                console.log(`Deleting ${publicIdsToDelete.length} images from Cloudinary...`)
                try {
                    await cloudinaryUtils.deleteMultipleFromCloudinary(publicIdsToDelete)
                    console.log('Successfully deleted images from Cloudinary')
                } catch (cloudinaryError) {
                    console.error('Error deleting from Cloudinary:', cloudinaryError)
                }
            } else {
                console.log('No publicIds to delete from Cloudinary')
            }
            
            newImages = imagesToKeep
            console.log(`After removal: ${newImages.length} images remain`)
        } else {
            console.log('No images to remove, keeping all existing images')
        }
        
        // Add new images
        if (req.files && req.files.length > 0) {
            console.log(`Adding ${req.files.length} new images...`)
            for (const file of req.files) {
                try {
                    console.log(`Uploading file to Cloudinary: ${file.originalname}`)
                    const uploadResult = await cloudinaryUtils.uploadToCloudinary(file.path)
                    console.log('Upload successful:', {
                        url: uploadResult.url ? uploadResult.url.substring(0, 50) + '...' : 'no url',
                        publicId: uploadResult.publicId
                    })
                    newImages.push({
                        url: uploadResult.url,
                        publicId: uploadResult.publicId
                    })
                } catch (uploadError) {
                    console.error(`Error uploading file ${file.originalname}:`, uploadError)
                }
            }
            console.log(`After adding new images: ${newImages.length} total images`)
        } else {
            console.log('No new images to add')
        }
        
        // Prepare update data
        const updateData = {
            title: title || event.title,
            description: description || event.description,
            images: newImages
        }
        
        // Handle date - ensure it's a valid Date object
        if (date) {
            try {
                updateData.date = new Date(date)
                console.log('Updated date:', updateData.date)
            } catch (dateError) {
                console.error('Invalid date format:', date)
                updateData.date = event.date
            }
        } else {
            updateData.date = event.date
        }
        
        console.log('Final update data:', {
            title: updateData.title,
            date: updateData.date,
            descriptionLength: updateData.description.length,
            imagesCount: updateData.images.length
        })
        
        // Update event in database
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
        
        console.log('Event updated successfully:', {
            id: updatedEvent._id,
            title: updatedEvent.title,
            finalImagesCount: updatedEvent.images.length
        })
        
        res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: updatedEvent
        })
        
    } catch (error) {
        console.error('=== UPDATE EVENT ERROR ===')
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        
        // Check for specific error types
        if (error.name === 'ValidationError') {
            console.error('Validation errors:', error.errors)
        }
        if (error.name === 'CastError') {
            console.error('Cast error for ID:', req.params.id)
        }
        
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Internal server error',
            errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
    } finally {
        console.log('=== UPDATE REQUEST COMPLETED ===')
    }
}

// Delete an event and all associated images from Cloudinary
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
        
        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            })
        }
        
        // Collect all public IDs for deletion
        const publicIds = event.images
            .filter(image => image.publicId)
            .map(image => image.publicId)
        
        // Delete all images from Cloudinary
        if (publicIds.length > 0) {
            await cloudinaryUtils.deleteMultipleFromCloudinary(publicIds)
        }
        
        await event.deleteOne()
        
        res.status(200).json({
            success: true,
            message: 'Event deleted successfully'
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Upload additional images to an existing event
exports.uploadEventImages = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
        
        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            })
        }
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please upload at least one image' 
            })
        }
        
        const uploadedImages = []
        
        for (const file of req.files) {
            const uploadResult = await cloudinaryUtils.uploadToCloudinary(file.path)
            uploadedImages.push({
                url: uploadResult.url,
                publicId: uploadResult.publicId
            })
        }
        
        event.images = [...event.images, ...uploadedImages]
        await event.save()
        
        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            count: uploadedImages.length,
            images: uploadedImages
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Remove a specific image from an event
exports.removeEventImage = async (req, res) => {
    try {
        const { id, imageId } = req.params
        
        const event = await Event.findById(id)
        
        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            })
        }
        
        const imageIndex = event.images.findIndex(img => 
            img._id.toString() === imageId || img.publicId === imageId
        )
        
        if (imageIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Image not found' 
            })
        }
        
        const imageToRemove = event.images[imageIndex]
        
        if (imageToRemove.publicId) {
            await cloudinaryUtils.deleteFromCloudinary(imageToRemove.publicId)
        }
        
        event.images.splice(imageIndex, 1)
        await event.save()
        
        res.status(200).json({
            success: true,
            message: 'Image removed successfully'
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Optional: Search events by title or description
exports.searchEvents = async (req, res) => {
    try {
        const { query } = req.query
        
        if (!query) {
            return res.status(400).json({ 
                success: false, 
                message: 'Search query is required' 
            })
        }
        
        const events = await Event.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        }).sort({ date: -1 })
        
        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Optional: Get events within a specific date range
exports.getEventsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query
        
        if (!startDate || !endDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Start date and end date are required' 
            })
        }
        
        const events = await Event.find({
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).sort({ date: 1 })
        
        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}