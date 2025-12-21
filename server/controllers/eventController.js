const Event = require('../models/Event')
const cloudinaryUtils = require('../config/cloudinary')

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ date: -1 })
        res.status(200).json({ success: true, data: events })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.getUpcomingEvents = async (req, res) => {
    try {
        const now = new Date()
        const events = await Event.find({ date: { $gt: now } }).sort({ date: 1 })
        res.status(200).json({ success: true, data: events })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.getPastEvents = async (req, res) => {
    try {
        const now = new Date()
        const events = await Event.find({ date: { $lte: now } }).sort({ date: -1 })
        res.status(200).json({ success: true, data: events })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

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

exports.updateEvent = async (req, res) => {
    try {
        const { title, date, description, imagesToRemove } = req.body
        
        let event = await Event.findById(req.params.id)
        
        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            })
        }
        
        let newImages = [...event.images]
        
        // Parse imagesToRemove if it's a string
        let imagesToRemoveArray = []
        try {
            if (imagesToRemove) {
                if (typeof imagesToRemove === 'string') {
                    imagesToRemoveArray = JSON.parse(imagesToRemove)
                } else if (Array.isArray(imagesToRemove)) {
                    imagesToRemoveArray = imagesToRemove
                }
            }
        } catch (parseError) {
            console.error('Error parsing imagesToRemove:', parseError)
        }
        
        // Remove images that need to be deleted
        if (imagesToRemoveArray.length > 0) {
            const imagesToKeep = []
            const publicIdsToDelete = []
            
            for (const image of newImages) {
                const shouldRemove = imagesToRemoveArray.some(removeId => 
                    removeId === image._id?.toString() || removeId === image.publicId
                )
                
                if (shouldRemove) {
                    if (image.publicId) {
                        publicIdsToDelete.push(image.publicId)
                    }
                } else {
                    imagesToKeep.push(image)
                }
            }
            
            // Delete images from Cloudinary in parallel
            if (publicIdsToDelete.length > 0) {
                await cloudinaryUtils.deleteMultipleFromCloudinary(publicIdsToDelete)
            }
            
            newImages = imagesToKeep
        }
        
        // Add new images
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const uploadResult = await cloudinaryUtils.uploadToCloudinary(file.path)
                newImages.push({
                    url: uploadResult.url,
                    publicId: uploadResult.publicId
                })
            }
        }
        
        // Update event
        event = await Event.findByIdAndUpdate(
            req.params.id,
            {
                title: title || event.title,
                date: date ? new Date(date) : event.date,
                description: description || event.description,
                images: newImages
            },
            { new: true, runValidators: true }
        )
        
        res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: event
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

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

// Optional: Add search functionality
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

// Optional: Get events by date range
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