const socketio = require('socket.io')

class Socket {
    constructor(server) {
        this.onJoin = this.onJoin.bind(this)
        this.onDisconnect = this.onDisconnect.bind(this)

        // create the socket
        this.io = socketio(server)

        // initialise the users array
        this.users = []
        
        // setup the socket events when connected
        this.io.on('connection', (socket) => {
            socket.on('join', (options, callback) => { this.onJoin(socket, options, callback) })
            socket.on('disconnect', () => { this.onDisconnect(socket) })
        })
    }

    // user has joined 
    onJoin(socket, { username }) {
        // check if the user is already in the chatroom
        const index = this.users.findIndex((u) => u.username === username)

        // add the user to the array
        this.users.push({id: socket.id, username })

        // if the username is new, broadcast to other users
        if (index === -1) {
            // broadcast a notification 
            socket.broadcast.emit('userJoined', { username, createdAt: new Date().getTime() })
        }

        // send the new user the room data
        socket.emit('roomData', {
            usernames: this.users.map((u) => u.username)
        })
    }

    onDisconnect(socket) {
        // find the user by ID within the array
        const index = this.users.findIndex((u) => u.id === socket.id)
        
        // if we found the user
        if (index !== -1) {
            // remove the user from the array
            const user = this.users.splice(index, 1)[0]

            // if the username no longer exists in the array
            if (!this.users.find((u) => u.username === user.username)) {
                // broadcast that the user has left
                socket.broadcast.emit('userLeft', { username: user.username, createdAt: new Date().getTime() })
            }
        }
    }

    createNotification(message) {
        return {
            notification: true,
            message,
            createdAt: new Date().getTime()
        }
    }
}

module.exports = Socket