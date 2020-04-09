const socketio = require('socket.io')
const { EventType, ErrorType } = require('@kevinorriss/chatroom-types')

class Socket {
    constructor(options = {}) {
        // bind the functions
        this.onJoin = this.onJoin.bind(this)
        this.onMessage = this.onMessage.bind(this)
        this.onDisconnect = this.onDisconnect.bind(this)

        // create the socket
        this.io = socketio(options)

        // initialise the users array
        this.users = []
        
        // setup the connection events
        this.io.on('connection', (socket) => {
            socket.on(EventType.JOIN, (options, callback) => {
                try {
                    this.onJoin(socket, options, callback)
                } catch (ex) {
                    callback({ 
                        error: { 
                            code: ErrorType.INTERNAL_SERVER_ERROR, 
                            message: ex.message
                        }
                    })
                }
            })
            socket.on(EventType.MESSAGE, (options, callback) => {
                try {
                    this.onMessage(options, callback)
                } catch (ex) {
                    callback({
                        error: {
                            code: ErrorType.INTERNAL_SERVER_ERROR,
                            message: ex.message
                        }
                    })
                }
            })
            socket.on('disconnect', () => { this.onDisconnect(socket) })
        })
    }

    onJoin(socket, { username }, callback) {
        // ensure the username was sent and is a string
        if (typeof username === 'undefined') {
            callback({
                error: {
                    code: ErrorType.PARAM_MISSING,
                    param: 'username',
                    message: 'username is undefined'
                }
            })
            return
        } else if (typeof username !== 'string') {
            callback({
                error: {
                    code: ErrorType.PARAM_INVALID_TYPE,
                    param: 'username',
                    message: `username of type ${typeof username}, expecting string`
                }
            })
            return
        }

        // trim the username and check its not empty
        const trimmedUsername = username.trim()
        if (trimmedUsername.length === 0) {
            callback({
                error: {
                    code: ErrorType.PARAM_MISSING,
                    param: 'username',
                    message: 'username is empty'
                }
            })
            return
        }

        // create the user
        const user = { id: socket.id, username: trimmedUsername }

        // check if the user is already in the chatroom
        const index = this.users.findIndex((u) => u.username === user.username)

        // add the user to the array
        this.users.push(user)

        // if the username is new, broadcast to other users
        if (index === -1) {
            socket.broadcast.emit(EventType.USER_JOINED, { 
                username: user.username, 
                createdAt: new Date().getTime()
            })
        }

        // fire the callback, sending the user and room data
        callback({
            room: {
                usernames: this.users.map((u) => u.username).filter((u, i, a) => a.indexOf(u) === i)
            },
            user
        })
    }

    onMessage({ userId, text }, callback) {
        // validate the user ID
        if (typeof userId === 'undefined') {
            callback({
                error: {
                    code: ErrorType.PARAM_MISSING,
                    param: 'userId',
                    message: 'userId is undefined'
                }
            })
            return
        } else if (typeof userId !== 'string') {
            callback({
                error: {
                    code: ErrorType.PARAM_INVALID_TYPE,
                    param: 'userId',
                    message: `userId of type ${typeof userId}, expecting string`
                }
            })
            return
        }

        // validate 
        if (typeof text === 'undefined') {
            callback({
                error: {
                    code: ErrorType.PARAM_MISSING,
                    param: 'text',
                    message: 'message is undefined'
                }
            })
            return
        } else if (typeof text !== 'string') {
            callback({
                error: {
                    code: ErrorType.PARAM_INVALID_TYPE,
                    param: 'text',
                    message: `text of type ${typeof text}, expecting string`
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