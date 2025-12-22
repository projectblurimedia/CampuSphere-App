const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    date: {
        type: Date,
        required: [true, 'Event date is required']
    },
    description: {
        type: String,
        required: [true, 'Event description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        publicId: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
})

eventSchema.virtual('formattedDate').get(function() {
    return this.date.toISOString().split('T')[0]
})

eventSchema.virtual('isUpcoming').get(function() {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const eventDate = new Date(this.date)
    return eventDate > todayStart
})

eventSchema.virtual('isPast').get(function() {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const eventDate = new Date(this.date)
    return eventDate <= todayStart
})

eventSchema.index({ date: 1 })
eventSchema.index({ createdAt: -1 })

const Event = mongoose.model('Event', eventSchema)

module.exports = Event