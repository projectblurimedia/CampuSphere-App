import axios from 'axios'

const API_URL = 'http://192.168.31.232:8000/server/events'

// Get all events
export const getAllEvents = async () => {
    try {
        const response = await axios.get(API_URL)
        return response.data
    } catch (error) {
        console.error('Get all events error:', error.message)
        throw error.response?.data || { message: 'Network error' }
    }
}

// Get today's events
export const getTodaysEvents = async () => {
    try {
        const response = await axios.get(`${API_URL}/today`)
        return response.data
    } catch (error) {
        console.error('Get today\'s events error:', error.message)
        throw error.response?.data || { message: 'Network error' }
    }
}

// Get upcoming events
export const getUpcomingEvents = async () => {
    try {
        const response = await axios.get(`${API_URL}/upcoming`)
        return response.data
    } catch (error) {
        console.error('Get upcoming events error:', error.message)
        throw error.response?.data || { message: 'Network error' }
    }
}

// Get past events
export const getPastEvents = async () => {
    try {
        const response = await axios.get(`${API_URL}/past`)
        return response.data
    } catch (error) {
        console.error('Get past events error:', error.message)
        throw error.response?.data || { message: 'Network error' }
    }
}

// Get single event
export const getEventById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`)
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
                const filename = image.uri.split('/').pop()
                // Get file extension
                const fileExtension = filename.split('.').pop()
                const type = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`
                
                formData.append('images', {
                    uri: image.uri,
                    type: type,
                    name: filename || `event-image-${Date.now()}-${index}.jpg`
                })
            }
        })
        
        const response = await axios.post(API_URL, formData, {
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
            url: API_URL
        })
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
        }
        
        // Add new images
        if (newImages.length > 0) {
            newImages.forEach((image, index) => {
                if (image.uri) {
                    // Extract filename from URI
                    let filename = image.uri.split('/').pop()
                    if (!filename) {
                        filename = `event-image-${Date.now()}-${index}.jpg`
                    }
                    
                    // Get file extension
                    const fileExtension = filename.split('.').pop().toLowerCase()
                    const mimeType = fileExtension === 'jpg' || fileExtension === 'jpeg' 
                        ? 'image/jpeg' 
                        : fileExtension === 'png' 
                            ? 'image/png' 
                            : fileExtension === 'gif'
                                ? 'image/gif'
                                : 'image/jpeg'
                    
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
        
        
        const response = await axios.put(`${API_URL}/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000, // 60 second timeout for large images
        })
        
        return response.data
    } catch (error) {
        console.error('=== Update event failed ===')
        console.error('Error:', error.message)
        console.error('Error code:', error.code)
        console.error('Error response:', error.response?.data)
        console.error('Error status:', error.response?.status)
        console.error('Request URL:', `${API_URL}/${id}`)
        
        if (error.code === 'ECONNABORTED') {
            throw { message: 'Request timeout. Please try again.' }
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
        const response = await axios.delete(`${API_URL}/${id}`)
        return response.data
    } catch (error) {
        console.error('Delete event error:', error.message)
        throw error.response?.data || { message: 'Network error' }
    }
}

export default {
    getAllEvents,
    getTodaysEvents,
    getUpcomingEvents,
    getPastEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
}