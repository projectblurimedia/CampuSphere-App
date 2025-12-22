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

exports.getTodayEvents = async (req, res) => {
    try {
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        
        const events = await Event.find({
            date: {
                $gte: todayStart,
                $lt: tomorrowStart
            }
        }).sort({ date: 1 })
        
        res.status(200).json({ success: true, data: events })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.getUpcomingEvents = async (req, res) => {
    try {
        const now = new Date()
        const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        
        const events = await Event.find({ date: { $gte: tomorrowStart } }).sort({ date: 1 })
        res.status(200).json({ success: true, data: events })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.getPastEvents = async (req, res) => {
    try {
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        
        const events = await Event.find({ date: { $lt: todayStart } }).sort({ date: -1 })
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
        console.log('=== UPDATE EVENT REQUEST ===')
        console.log('Request params:', req.params)
        console.log('Request body keys:', Object.keys(req.body))
        console.log('Title from body:', req.body.title)
        console.log('Date from body:', req.body.date)
        console.log('Description from body:', req.body.description)
        console.log('ImagesToRemove from body (raw):', req.body.imagesToRemove)
        
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
        
        let newImages = [...event.images]
        console.log('Initial images array length:', newImages.length)
        
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
        
        const updateData = {
            title: title || event.title,
            description: description || event.description,
            images: newImages
        }
        
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

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
        
        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            })
        }
        
        const publicIds = event.images
            .filter(image => image.publicId)
            .map(image => image.publicId)
        
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