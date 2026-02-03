import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config({ debug: false })

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Upload result with url and publicId
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
    try {        
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found or inaccessible: ${filePath}`)
        }
        
        const uploadOptions = {
            folder: 'school/students/profile-pictures',
            resource_type: 'image',
            transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' },
                { width: 500, height: 500, crop: 'fill', gravity: 'face' }
            ],
            ...options
        }
        
        const result = await cloudinary.uploader.upload(filePath, uploadOptions)
                
        // Clean up local file after upload
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }
        
        return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes
        }
    } catch (error) {
        console.error('Cloudinary upload error:', error)
        
        // Ensure local file is cleaned up even on error
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }
        
        throw error 
    }
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        return result
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error)
        throw error
    }
}

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of public IDs to delete
 * @returns {Promise<Array>} - Array of deletion results
 */
export const deleteMultipleFromCloudinary = async (publicIds) => {
    try {
        const results = []
        for (const publicId of publicIds) {
            if (publicId) {
                const result = await deleteFromCloudinary(publicId)
                results.push({ publicId, result })
            }
        }
        return results
    } catch (error) {
        console.error('Error deleting multiple images from Cloudinary:', error)
        throw error
    }
}

/**
 * Check if a Cloudinary resource exists
 * @param {string} publicId - Public ID to check
 * @returns {Promise<boolean>} - Whether the resource exists
 */
export const checkCloudinaryResource = async (publicId) => {
    try {
        const result = await cloudinary.api.resource(publicId)
        return result && result.public_id === publicId
    } catch (error) {
        // Resource not found or other error
        return false
    }
}

/**
 * Get Cloudinary URL with transformations
 * @param {string} publicId - Public ID of the image
 * @param {Object} transformations - Cloudinary transformations
 * @returns {string} - Transformed URL
 */
export const getCloudinaryUrl = (publicId, transformations = {}) => {
    const defaultTransformations = {
        quality: 'auto:good',
        fetch_format: 'auto',
        width: 500,
        height: 500,
        crop: 'fill',
        gravity: 'face'
    }
    
    const mergedTransformations = { ...defaultTransformations, ...transformations }
    
    return cloudinary.url(publicId, {
        transformation: [mergedTransformations],
        secure: true
    })
}

export default {
    uploadToCloudinary,
    deleteFromCloudinary,
    deleteMultipleFromCloudinary,
    checkCloudinaryResource,
    getCloudinaryUrl,
    cloudinary
}