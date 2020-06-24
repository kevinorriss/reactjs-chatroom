const socketio = require('socket.io')
var socketioJwt = require('socketio-jwt')

class ChatroomServer
{
    constructor(srv, path = '/socket.io', secret)
    {
        // bind the functions
        this.onMessage = this.onMessage.bind(this)
        this.onDisconnect = this.onDisconnect.bind(this)
        this.onAuthenticated = this.onAuthenticated.bind(this)

        // create the socket
        this.io = socketio(srv, { path })

        // initialise the users array
        this.users = []

        // add default events when a new socket connects
        this.io.sockets
            .on('connection', socketioJwt.authorize({ secret, timeout: 15000, callback: false }))
            .on('authenticated', (socket) => {
                // setup the disconnect event
                socket.on('disconnect', () => { this.onDisconnect(socket) })

                // if the token doesn't contain the username
                if (typeof socket.decoded_token.username === 'undefined') {    
                    // emit an unauthorized event then disconnect
                    socket.emit('unauthorized', {message: 'missing username'} )
                    socket.disconnect()
                
                // valid token, authenticated
                } else {
                    this.onAuthenticated(socket)
                }
            })
    }

    onAuthenticated(socket) {
        // get the username from the token
        const username = socket.decoded_token.username

        // if the username is new, broadcast to other users
        if (!this.users.some((u) => u.username === username)) {
            socket.broadcast.emit('USER_JOINED', {
                username,
                createdAt: new Date().getTime()
            })
        }

        // add the chatroom events once authenticated
        socket.on('MESSAGE', ({ text }, callback) => { this.onMessage(text, callback, socket) })

        // add the user to the array
        this.users.push({ socketId: socket.id, username })

        // send the room data to the new socket
        socket.emit('ROOM_DATA', {
            username,
            room: {
                usernames: this.users.map((u) => u.username)
                    .filter((u, i, a) => a.indexOf(u) === i)
            }
        })
    }

    onMessage(text, callback, socket) {
        try {
            // find the user by socket ID
            const user = this.users.find((u) => u.socketId === socket.id)

            // trim the message text
            const trimmedText = text.trim()

            // if the user wasnt found
            if (typeof user === 'undefined') {
                callback({
                    error: { 
                        code: 'USER_NOT_FOUND',
                        message: 'user not found'
                    }
                })
            } else if (trimmedText.length === 0) {
                callback({
                    notice: { message: 'empty text' }
                })
            } else {
                // send the message to everyone
                this.io.emit('MESSAGE', { username: user.username, text: trimmedText })

                // fire callback function letting the sender know the message has been sent
                callback()
            }
        } catch (ex) {
            callback({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: ex.message
                }
            })
        }
    }

    onDisconnect(socket) {
        // find the user by ID within the array
        const index = this.users.findIndex((u) => u.socketId === socket.id)
        
        // if we found the user
        if (index !== -1) {
            // remove the user from the array
            const user = this.users.splice(index, 1)[0]

            // if the username no longer exists in the array
            if (!this.users.find((u) => u.username === user.username)) {
                // broadcast that the user has left
                socket.broadcast.emit('USER_LEFT', { username: user.username, createdAt: new Date().getTime() })
            }
        }
    }
}

module.exports = ChatroomServer