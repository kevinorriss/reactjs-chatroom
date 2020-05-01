const socketio = require('socket.io')
var socketioJwt = require('socketio-jwt')
const { EventType, ErrorType } = require('@kevinorriss/chatroom-types')

class Socket {
    constructor(path = '/socket.io', secret) {
        // bind the functions
        this.onMessage = this.onMessage.bind(this)
        this.onDisconnect = this.onDisconnect.bind(this)
        this.onAuthenticated = this.onAuthenticated.bind(this)

        // create the socket
        this.io = socketio({ path })

        // initialise the users array
        this.users = []

        // add default events when a new socket connects
        this.io.sockets
            .on('connection', socketioJwt.authorize({ secret, timeout: 15000, callback: false }))
            .on('authenticated', this.onAuthenticated)
    }

    onAuthenticated(socket) {
        // get the username from the token
        const username = socket.decoded_token.username

        // if no username was provided, emit unauthorized event and close socket
        if (typeof username === 'undefined') {
            socket.emit('unauthorized', 'username required', () => { 
                socket.disconnect()
            })
            return
        }

        // add the user to the array
        this.users.push({ socketId: socket.id, username })

        // if the username is new, broadcast to other users
        if (this.users.some((u) => u.username === username)) {
            socket.broadcast.emit(EventType.USER_JOINED, {
                username,
                createdAt: new Date().getTime()
            })
        }

        // add the chatroom events once authenticated
        socket.on(EventType.MESSAGE, (message, callback) => {
            this.onMessage(message, callback, socket)
        })
        socket.on('disconnect', () => { this.onDisconnect(socket) })

        // send the room data to the new socket
        socket.emit(EventType.ROOM_DATA, {
            username,
            room: {
                usernames: this.users.map((u) => u.username)
                    .filter((u, i, a) => a.indexOf(u) === i)
            }
        })
    }

    onMessage(message, callback, socket) {
        try {
            // validate message
            if (typeof message === 'undefined') {
                callback({
                    error: {
                        code: ErrorType.PARAM_MISSING,
                        param: 'message',
                        message: 'message is undefined'
                    }
                })
                return
            } else if (typeof message !== 'string') {
                callback({
                    error: {
                        code: ErrorType.PARAM_INVALID_TYPE,
                        param: 'message',
                        message: `message of type ${typeof message}, expecting string`
                    }
                })
                return
            }

            // find the user by ID
            const user = this.users.find((u) => u.id === userId)

            // if the user wasnt found
            if (typeof user === 'undefined') {
                callback({
                    error: { 
                        code: ErrorType.USER_NOT_FOUND,
                        message: 'user not found'
                    }
                })
                return
            }

            // trim the message text
            const trimmedText = text.trim()

            // if the message is empty, don't broadcast it
            if (trimmedText.length === 0) {
                callback()
                return
            }

            // send the message to everyone
            this.io.emit(EventType.MESSAGE, { username: user.username, text: trimmedText })

            // fire callback function letting the sender know the message has been sent
            callback()
        } catch (ex) {
            callback({
                error: {
                    code: ErrorType.INTERNAL_SERVER_ERROR,
                    message: ex.message
                }
            })
        }
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
                socket.broadcast.emit(EventType.USER_LEFT, { username: user.username, createdAt: new Date().getTime() })
            }
        }
    }
}

module.exports = Socket