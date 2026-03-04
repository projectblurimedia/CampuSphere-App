import axiosApi from "@/utils/axiosApi"

// Get all events with pagination
export const getAllEvents = async (page = 1, limit = 20) => {
    try {
        const response = await axiosApi.get('/events', {
            params: { page, limit }
        })
        return response.data
    } catch (error) {
        console.error('Get all events error:', error.message)
        throw error.response?.data || { message: 'Network error' }
    }
}

// Get today's events with pagination
export const getTodaysEvents = async (page = 1, limit = 20) => {
    try {
        const response = await axiosApi.get(`events/today`, {
            params: { page, limit }
        })
        return response.data
    } catch (error) {
        console.error('Get today\'s events error:', error.message)
        throw error.response?.data || { message: 'Network error' }
    }
}

// Get upcoming events with pagination
export const getUpcomingEvents = async (page = 1, limit = 20) => {
    try {
        const response = await axiosApi.get(`events/upcoming`, {
            params: { page, limit }
        })
        return response.data
    } catch (error) {
        console.error('Get upcoming events error:', error.message)
        throw error.response?.data || { message: 'Network error' }
    }
}

// Get past events with pagination
export const getPastEvents = async (page = 1, limit = 20) => {
    try {
        const response = await axiosApi.get(`events/past`, {
            params: { page, limit }
        })
        return response.data
    } catch (error) {
        console.error('Get past events error:', error.message)
        throw error.response?.data || { message: 'Network error' }
    }
}

// Search events
export const searchEvents = async (query, page = 1, limit = 20) => {
    try {
        const response = await axiosApi.get(`events/search`, {
            params: { query, page, limit }
        })
        return response.data
    } catch (error) {
        console.error('Search events error:', error.message)
        throw error.response?.data || { message: 'Network error' }
    }
}

// Get events by date range
export const getEventsByDateRange = async (startDate, endDate, page = 1, limit = 20) => {
    try {
        const response = await axiosApi.get(`events/date-range`, {
            params: { startDate, endDate, page, limit }
        })
        return response.data
    } catch (error) {
        console.error('Get events by date range error:', error.message)
        throw error.response?.data || { message: 'Network error' }
    }
}

// Get event statistics
export const getEventStatistics = async () => {
    try {
        const response = await axiosApi.get(`events/statistics`)
        return response.data
    } catch (error) {
        console.error('Get event statistics error:', error.message)
        throw error.response?.data || { message: 'Network error' }
    }
}

// Get single event
export const getEventById = async (id) => {
    try {
        const response = await axiosApi.get(`events/${id}`)
        return response.data
    } catch (error) {
        console.error('Get event by ID error:', error.message)
        throw error.response?.data || { message: 'Network error' }
    }
}

// Create event
export const createEvent = async (eventData, images = []) => {
    try {
        const formData = new FormData()
        
        // Add event data
        formData.append('title', eventData.title)
        formData.append('date', eventData.date.toISOString())
        formData.append('description', eventData.description)
        
        // Add images
        images.forEach((image, index) => {
            if (image.uri) {
                // Extract filename from URI
                const filename = image.uri.split('/').pop() || `event-image-${Date.now()}-${index}.jpg`
                // Get file extension
                const fileExtension = filename.split('.').pop().toLowerCase()
                let mimeType = 'image/jpeg'
                
                if (fileExtension === 'png') {
                    mimeType = 'image/png'
                } else if (fileExtension === 'gif') {
                    mimeType = 'image/gif'
                } else if (fileExtension === 'webp') {
                    mimeType = 'image/webp'
                }
                
                formData.append('images', {
                    uri: image.uri,
                    type: mimeType,
                    name: filename
                })
            }
        })
        
        console.log('Creating event with images:', images.length)
        
        const response = await axiosApi.post('/events', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 30000, // 30 second timeout
        })
        
        return response.data
    } catch (error) {
        console.error('Create event error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: '/events'
        })
        
        if (error.code === 'ECONNABORTED') {
            throw { message: 'Request timeout. Please try again.' }
        }
        
        throw error.response?.data || { 
            message: error.message || 'Network error',
            details: 'Check server connection and CORS configuration'
        }
    }
}

// Update event
export const updateEvent = async (id, eventData, newImages = [], imagesToRemove = []) => {
    try {
        const formData = new FormData()
        
        // Add event data
        formData.append('title', eventData.title)
        formData.append('date', eventData.date.toISOString())
        formData.append('description', eventData.description)
        
        // Add images to remove if any
        if (imagesToRemove.length > 0) {
            formData.append('imagesToRemove', JSON.stringify(imagesToRemove))
            console.log('Images to remove:', imagesToRemove)
        }
        
        // Add new images
        if (newImages.length > 0) {
            console.log('Adding new images:', newImages.length)
            newImages.forEach((image, index) => {
                if (image.uri) {
                    // Extract filename from URI
                    let filename = image.uri.split('/').pop()
                    if (!filename) {
                        filename = `event-image-${Date.now()}-${index}.jpg`
                    }
                    
                    // Get file extension
                    const fileExtension = filename.split('.').pop().toLowerCase()
                    let mimeType = 'image/jpeg'
                    
                    if (fileExtension === 'png') {
                        mimeType = 'image/png'
                    } else if (fileExtension === 'gif') {
                        mimeType = 'image/gif'
                    } else if (fileExtension === 'webp') {
                        mimeType = 'image/webp'
                    }
                    
                    // Create file object
                    const fileObject = {
                        uri: image.uri,
                        type: mimeType,
                        name: filename
                    }
                    
                    formData.append('images', fileObject)
                }
            })
        }
        
        // Log form data contents for debugging
        console.log('Update request - ID:', id)
        console.log('Update request - Title:', eventData.title)
        console.log('Update request - New images:', newImages.length)
        console.log('Update request - Images to remove:', imagesToRemove.length)
        
        const response = await axiosApi.put(`events/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000, // 60 second timeout for large images
        })
        
        console.log('Update response:', response.data)
        return response.data
    } catch (error) {
        console.error('=== Update event failed ===')
        console.error('Error:', error.message)
        console.error('Error code:', error.code)
        console.error('Error response:', error.response?.data)
        console.error('Error status:', error.response?.status)
        console.error('Request URL:', `events/${id}`)
        
        if (error.code === 'ECONNABORTED') {
            throw { message: 'Request timeout. Please try again.' }
        }
        
        // Handle validation errors
        if (error.response?.status === 400) {
            throw error.response.data || { 
                message: 'Validation error. Please check your input.',
                details: error.response.data?.errorDetails
            }
        }
        
        // Handle not found errors
        if (error.response?.status === 404) {
            throw { message: 'Event not found' }
        }
        
        throw error.response?.data || { 
            message: error.message || 'Network error',
            code: error.code,
            details: 'Please check server connection and ensure server is running'
        }
    }
}

// Delete event
export const deleteEvent = async (id) => {
    try {
        const response = await axiosApi.delete(`events/${id}`)
        return response.data
    } catch (error) {
        console.error('Delete event error:', error.message)
        
        if (error.response?.status === 404) {
            throw { message: 'Event not found' }
        }
        
        throw error.response?.data || { message: 'Network error' }
    }
}

// Add images to existing event
export const addEventImages = async (id, images = []) => {
    try {
        const formData = new FormData()
        
        // Add images
        images.forEach((image, index) => {
            if (image.uri) {
                const filename = image.uri.split('/').pop() || `event-image-${Date.now()}-${index}.jpg`
                const fileExtension = filename.split('.').pop().toLowerCase()
                let mimeType = 'image/jpeg'
                
                if (fileExtension === 'png') {
                    mimeType = 'image/png'
                } else if (fileExtension === 'gif') {
                    mimeType = 'image/gif'
                } else if (fileExtension === 'webp') {
                    mimeType = 'image/webp'
                }
                
                formData.append('images', {
                    uri: image.uri,
                    type: mimeType,
                    name: filename
                })
            }
        })
        
        const response = await axiosApi.post(`events/${id}/images`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 30000,
        })
        
        return response.data
    } catch (error) {
        console.error('Add event images error:', error.message)
        
        if (error.code === 'ECONNABORTED') {
            throw { message: 'Request timeout. Please try again.' }
        }
        
        if (error.response?.status === 404) {
            throw { message: 'Event not found' }
        }
        
        throw error.response?.data || { message: 'Network error' }
    }
}

// Remove image from event
export const removeEventImage = async (eventId, imageId) => {
    try {
        const response = await axiosApi.delete(`events/${eventId}/images/${imageId}`)
        return response.data
    } catch (error) {
        console.error('Remove event image error:', error.message)
        
        if (error.response?.status === 404) {
            throw { message: 'Event or image not found' }
        }
        
        throw error.response?.data || { message: 'Network error' }
    }
}

// Export all functions as a single object
export default {
    getAllEvents,
    getTodaysEvents,
    getUpcomingEvents,
    getPastEvents,
    searchEvents,
    getEventsByDateRange,
    getEventStatistics,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    addEventImages,
    removeEventImage
}