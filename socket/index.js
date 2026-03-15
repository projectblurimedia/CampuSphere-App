const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server, {
    cors : {
        origin : '*'
    }
})

app.get('/socket/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        users: users.length 
    })
})

let users = []

const addUser = (userId, socketId) => {
    if (!userId || users.some(user => user.userId === userId)) {
        return
    }
    users.push({ userId, socketId })
}

const getUser = (socketId) => {
    return users.find((user) => user.socketId === socketId)
}

const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId)
}

const getReceiver = (receiverId) => {
    return users.find((user) => user.userId === receiverId)
}

const getUsersByUserId = (userId) => {
    return users.filter((user) => user.userId === userId)
}

const removeReceiver = (receiverId) => {
    users = users.filter((user) => user.userId !== receiverId)
}

io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId
    addUser(userId, socket.id)
    console.log('User Connected', userId)

    socket.on('addUser', (userId) => {
        io.emit('getUsers', users)
    })

    // Sending Message 
    socket.on('sendMessage', (details) => {
        const receiver = getReceiver(details.receiverId)
        if(receiver){
            io.to(receiver.socketId).emit('getMessage', details)
        }
    })

    // Sending Message to Both
    socket.on('sendMessageToBoth', (details) => {
        const sender = getReceiver(details.senderId)
        const receiver = getReceiver(details.receiverIds[0].userId)
        if(sender){
            io.to(sender.socketId).emit('getMessage', details)
        }
        if(receiver){
            io.to(receiver.socketId).emit('getMessage', details)
        }
    })

    // Handle force logout request
    socket.on('forceLogout', (data) => {
        const { userId, reason } = data
        console.log(`Force logout requested for user ${userId}, reason: ${reason}`)
        
        // Find all sockets for this user
        const userSockets = getUsersByUserId(userId)
        
        // Emit logout event to all user's connected devices
        userSockets.forEach(user => {
            io.to(user.socketId).emit('forceLogout', {
                reason: reason || 'Your account has been updated. Please login again.',
                timestamp: new Date().toISOString()
            })
        })
    })

    // Disconnect
    socket.on('disconnect', () => {
        const userId = socket.handshake.auth.userId
        console.log('User Disconnected', userId)
        
        removeUser(socket.id)
        io.emit('getUsers', users) 
    })
})