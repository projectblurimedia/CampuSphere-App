const axios = require('axios')

const axiosBaseUrl = 'http://192.168.31.232:8000/server'

const instance = axios.create({
    baseURL: axiosBaseUrl
})

const io = require('socket.io')(5000, {
    cors : {
        origin : 'http://192.168.31.232:8081'
    }
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

    // Disconnect
    socket.on('disconnect', () => {
        const userId = socket.handshake.auth.userId
        console.log('User Disconnected', userId)
        
        removeUser(socket.id)
        io.emit('getUsers', users) 
    })
})

