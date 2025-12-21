import axios from 'axios'

const API_URL = 'http://192.168.31.232:8000/server/events'

// Get all events
export const getAllEvents = async () => {
    try {
        const response = await axios.get(API_URL)
        return response.data
    } catch (error) {
        throw error.response?.data || { message: 'Network error' }
    }
}

// Get upcoming events
export const getUpcomingEvents = async () => {
    try {
        const response = await axios.get(`${API_URL}/upcoming`)
        return response.data
    } catch (error) {
        throw error.response?.data || { message: 'Network error' }
    }
}

// Get past events
export const getPastEvents = async () => {
    try {
        const response = await axios.get(`${API_URL}/past`)
        return response.data
    } catch (error) {
        throw error.response?.data || { message: 'Network error' }
    }
}

// Get single event
export const getEventById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`)
        return response.data
    } catch (error) {
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
            // Check if image is a file object or URI
            if (image.uri) {
                const filename = image.uri.split('/').pop()
                const match = /\.(\w+)$/.exec(filename)
                const type = match ? `image/${match[1]}` : 'image/jpeg'
                
                formData.append('images', {
                    uri: image.uri,
                    type: type,
                    name: `event-${Date.now()}-${index}.jpg`
                })
            }
        })
        
        const response = await axios.post(API_URL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        
        return response.data
    } catch (error) {
        throw error.response?.data || { message: 'Network error' }
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
        
        // Add images to remove as JSON string
        if (imagesToRemove.length > 0) {
            formData.append('imagesToRemove', JSON.stringify(imagesToRemove))
        }
        
        // Add new images
        newImages.forEach((image, index) => {
            // Check if image is a file object or URI
            if (image.uri) {
                const filename = image.uri.split('/').pop()
                const match = /\.(\w+)$/.exec(filename)
                const type = match ? `image/${match[1]}` : 'image/jpeg'
                
                formData.append('images', {
                    uri: image.uri,
                    type: type,
                    name: `event-${Date.now()}-${index}.jpg`
                })
            }
        })
        
        const response = await axios.put(`${API_URL}/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        
        return response.data
    } catch (error) {
        throw error.response?.data || { message: 'Network error' }
    }
}

// Delete event
export const deleteEvent = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`)
        return response.data
    } catch (error) {
        throw error.response?.data || { message: 'Network error' }
    }
}

export default {
    getAllEvents,
    getUpcomingEvents,
    getPastEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
}