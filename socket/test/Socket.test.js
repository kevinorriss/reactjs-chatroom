const io = require('socket.io-client')
const http = require('http')
const jwt = require('jsonwebtoken')
const ChatSocket = require('../src/Socket')
const { EventType, ErrorType } = require('@kevinorriss/chatroom-types')

const SECRET = 'testsecret'
const PATH = '/socket.io/chatroom'

const USER_1 = 'user one'
const USER_2 = 'user two'

let clientSocket1
let clientSocket2
let clientSocket3
let httpServer
let httpServerAddr
let chatServer

// spy on the servers events
const onAuthenticated = jest.spyOn(ChatSocket.prototype, 'onAuthenticated')
const onMessage = jest.spyOn(ChatSocket.prototype, 'onMessage')

// disable console errors for cleaner test output
jest.spyOn(console, 'error').mockImplementation(() => { })

// returns a client connection
const connect = (auth) => {
    const socket = io(`http://[${httpServerAddr.address}]:${httpServerAddr.port}`, {
        path: PATH,
        'reconnection delay': 0,
        'reopen delay': 0,
        'force new connection': true,
        transports: ['websocket']
    })

    if (typeof auth !== 'undefined') {
        authenticate(socket, auth.username, auth.key)
    }

    return socket
}

const authenticate = (socket, username, key = SECRET) => {
    socket.on('connect', () => {
        socket.emit('authenticate', { token: jwt.sign({ username }, key) })
    })
}

/**
 * Run before each test
 */
beforeEach(() => {
    // setup servers
    httpServer = http.createServer().listen()
    httpServerAddr = httpServer.address()
    chatServer = new ChatSocket(PATH, SECRET)
    chatServer.io.attach(httpServer)
})

/**
 * Run after each test
 */
afterEach(() => {
    // disconnect the sockets
    if (clientSocket1 && clientSocket1.connected) {
        clientSocket1.disconnect()
    }
    if (clientSocket2 && clientSocket2.connected) {
        clientSocket2.disconnect()
    }

    // reset the counts of every mock
    jest.clearAllMocks()

    // shut down servers
    chatServer.io.close()
    httpServer.close()

    // clear the sockets
    clientSocket1 = undefined
    clientSocket2 = undefined
})

describe('authenticate', () => {
    test('Should call authenticated event with valid token', (done) => {
        // connect a client as the existing user
        clientSocket1 = connect({username: USER_1}).on('authenticated', () => {

            // mock the user joined event for existing user
            const userJoined = jest.fn()
            clientSocket1.on(EventType.USER_JOINED, userJoined)

            // connect the new client
            const roomData = jest.fn()
            clientSocket2 = connect({ username: USER_2 })
                .on(EventType.ROOM_DATA, roomData)
                .on('authenticated', () => {
            
                // server authenticated event should have been called twice
                expect(onAuthenticated).toHaveBeenCalledTimes(2)

                // get the decoded token of the second connection and the socket ID
                const { decoded_token, id: socketId } = onAuthenticated.mock.calls[1][0]

                // socket should contain decoded token
                expect(decoded_token).toEqual({
                    username: USER_2,
                    iat: expect.any(Number)
                })

                // expect the socket ID to be a string
                expect(typeof socketId).toEqual('string')

                // expect the servers user array to contain the socket data
                expect(chatServer.users).toEqual([
                    {
                        socketId: expect.any(String),
                        username: USER_1
                    }, {
                        socketId,
                        username: USER_2
                    }
                ])

                // wait a little for the events to fire
                setTimeout(() => {
                    // existing user should be informed of new user
                    expect(userJoined).toHaveBeenCalledTimes(1)

                    // existing user should be sent new username
                    expect(userJoined.mock.calls[0][0]).toEqual({
                        username: USER_2,
                        createdAt: expect.any(Number)
                    })

                    // new user should have got room data event
                    expect(roomData).toHaveBeenCalledTimes(1)

                    // room data should be what we expect
                    expect(roomData.mock.calls[0][0]).toEqual({
                        username: USER_2,
                        room: {
                            usernames: [USER_1, USER_2]
                        }
                    })

                    // tell jest we're done
                    done()
                }, 50)
            })
        })
    })

    test('Should reject missing token authentication', (done) => {
        // connect a client
        clientSocket1 = connect()
            // authenticate with no token
            .on('connect', () => {
                clientSocket1.emit('authenticate', { })
            // wait for the unauthorized event
            }).on('unauthorized', (error) => {
                // expect invalid token error code
                expect(error.data.code).toEqual('invalid_token')

                // tell jest we're done
                done()
            })
    })

    test('Should reject authentication token with incorrect secret', (done) => {
        // connect a client with an invalid key
        clientSocket1 = connect({ username: USER_1, key: `${SECRET}123`})
            .on('unauthorized', (error) => {
                // expect invalid token error code
                expect(error.data.code).toEqual('invalid_token')

                // tell jest we're done
                done()
            })
    })

    test('Should reject token with missing username', (done) => {
        // mock the authenticated and error events
        const onAuthenticated = jest.fn()
        const onUnauthorized = jest.fn()
        const onRoomData = jest.fn()

        // connect a client without providing a username
        clientSocket1 = connect({})
            .on('authenticated', onAuthenticated)
            .on('unauthorized', onUnauthorized)
            .on(EventType.ROOM_DATA, onRoomData)
        
        setTimeout(() => {
            // socket will be authenticated because secret is valid
            expect(onAuthenticated).toHaveBeenCalledTimes(1)

            // unauthorized called because of missing username
            expect(onUnauthorized).toHaveBeenCalledTimes(1)
            expect(onUnauthorized.mock.calls[0][0]).toEqual('username required')

            // room data should not be sent
            expect(onRoomData).toHaveBeenCalledTimes(0)

            // server users array should be empty
            expect(chatServer.users).toEqual([])
            
            // tell jest we're done
            done()
        }, 50)
    })

    test('Unauthenticated user should not receive messages', (done) => {
        // mock user one events
        const userOneUserJoined = jest.fn()
        const userOneMessaged = jest.fn()

        // connect an existing user and spy on events
        clientSocket1 = connect({ username: USER_1 })
            .on(EventType.MESSAGE, userOneMessaged)
            .on(EventType.USER_JOINED, userOneUserJoined)
        
        // once first user is connected
        clientSocket1.on('authenticated', () => {
            // connect a user with missing username
            clientSocket2 = connect({})
                
            // wait for the second user to be unauthorized
            clientSocket2.on('unauthorized', () => {

                // clientSocket1.emit(EventType.MESSAGE)

                // set a short delay
                setTimeout(() => {
                    expect(userOneUserJoined).toHaveBeenCalledTimes(0)

                    // tell jest we're done
                    done()
                }, 50)
            })
        })
    })
})

/*describe('join', () => {
    test('Should add new user to emtpy room', (done) => {
        // create a mock function and add to the client join listener
        const userJoined = jest.fn()
        clientSocket1.once(EventType.USER_JOINED, userJoined)

        // emit a join message to the server
        clientSocket1.emit(EventType.JOIN, { username: 'Client Username' }, (params) => {
            // server should have added new user to array
            expect(chatServer.users).toEqual([{
                id: expect.any(String),
                username: 'Client Username'
            }])

            // callback should be called, returning room and user data
            expect(params).toEqual({
                room: {
                    usernames: ['Client Username']
                },
                user: {
                    id: expect.any(String),
                    username: 'Client Username'
                }
            })

            // user shouldn't have received join event for themselves
            expect(userJoined).toHaveBeenCalledTimes(0)

            // tell jest we're done
            done()
        })
    })

    test('Should add new user to non-emtpy room', (done) => {
        // connect the existing user
        clientSocket2 = connect()

        // setup spies on the existing user
        const existingUserJoined = jest.fn()
        clientSocket2.on(EventType.USER_JOINED, existingUserJoined)

        clientSocket2.emit(EventType.JOIN, { username: 'Existing Username' }, () => {
            
            // connect the new user
            clientSocket1.emit(EventType.JOIN, { username: 'New Username' }, (params) => {
                
                // new user should be sent existing usernames
                expect(params).toEqual({
                    room: {
                        usernames: ['Existing Username', 'New Username']
                    },
                    user: {
                        id: expect.any(String),
                        username: 'New Username'
                    }
                })

                // existing users should be notified of the new user
                expect(existingUserJoined).toHaveBeenCalledTimes(1)
                expect(existingUserJoined).toHaveBeenCalledWith({
                    username: 'New Username',
                    createdAt: expect.any(Number)
                })

                // tell jest we're done
                done()
            })
        })
    })

    test('Should handle missing username', (done) => {
        // emit a join message to the server
        clientSocket1.emit(EventType.JOIN, {}, (params) => {

            // should return error message
            expect(params).toEqual({
                error: {
                    code: ErrorCode.PARAM_MISSING,
                    message: 'username is undefined',
                    param: 'username'
                }
            })

            // tell jest we're done
            done()
        })
    })

    test('Should handle incorrent username datatype', (done) => {
        // emit a join message to the server
        clientSocket1.emit(EventType.JOIN, { username: 123 }, (params) => {

            // should return error message
            expect(params).toEqual({
                error: {
                    code: ErrorCode.PARAM_INVALID_TYPE,
                    message: 'username of type number, expecting string',
                    param: 'username'
                }
            })

            // tell jest we're done
            done()
        })
    })

    test('Should handle blank username', (done) => {
        // emit a join message to the server
        clientSocket1.emit(EventType.JOIN, { username: '' }, (params) => {

            // should return error message
            expect(params).toEqual({
                error: {
                    code: ErrorCode.PARAM_MISSING,
                    message: 'username is empty',
                    param: 'username'
                }
            })
            
            // tell jest we're done
            done()
        })
    })

    test('Should trim username', (done) => {
        // emit a join message to the server
        clientSocket1.emit(EventType.JOIN, { username: '    Test User    ' }, (params) => {

            // callback should be called with the username trimmed
            expect(params).toEqual({
                room: { usernames: ['Test User'] },
                user: {
                    id: expect.any(String),
                    username: 'Test User'
                }
            })

            // tell jest we're done
            done()
        })
    })

    test('Should handle duplicate usernames', (done) => {
        // connect the existing user
        clientSocket2 = connect()

        // spy on the existing user join event
        const existingUserJoined = jest.fn()
        clientSocket2.once(EventType.USER_JOINED, existingUserJoined)

        // connect the existing user
        clientSocket2.emit(EventType.JOIN, { username: 'Existing User' }, () => {

            // connect the same username again
            clientSocket1.emit(EventType.JOIN, { username: 'Existing User' }, (params) => {

                // server should store both usernames with different IDs
                expect(chatServer.users).toEqual([
                    {
                        id: expect.any(String),
                        username: 'Existing User'
                    }, {
                        id: expect.any(String),
                        username: 'Existing User'
                    }
                ])

                // should return distinct usernames
                expect(params).toEqual({
                    room: { usernames: ['Existing User'] },
                    user: {
                        id: expect.any(String),
                        username: 'Existing User'
                    }
                })

                // existing user shouldn't be notified of the duplicate join
                expect(existingUserJoined).toHaveBeenCalledTimes(0)

                // tell jest we're done
                done()
            })
        })
    })

    test('Should handle internal server error', (done) => {
        // mock the server onJoin, throwing an exception
        onJoin.mockImplementationOnce(() => { throw new Error('forced exception') })

        // connect the user
        clientSocket1.emit(EventType.JOIN, { username: 'Client Username' }, (params) => {
            
            // expect the callback to provide error message
            expect(params).toEqual({
                error: {
                    code: ErrorCode.INTERNAL_SERVER_ERROR,
                    message: 'forced exception'
                }
            })

            // tell jest we're done
            done()
        })
    })
})

describe('message', () => {
    test('Should receive a message', (done) => {
        // connect the existing user
        clientSocket2 = connect()

        // connect the existing user
        clientSocket2.emit(EventType.JOIN, { username: 'Existing User' }, () => {

            // connect the new user
            clientSocket1.emit(EventType.JOIN, { username: 'New User' }, (params) => {

                // create the mock functions
                const onClientMessage = jest.fn()
                const onExistingClientMessage = jest.fn()
                const messageCallback = jest.fn()

                // mock both clients message events
                clientSocket1.once(EventType.MESSAGE, onClientMessage)
                clientSocket2.once(EventType.MESSAGE, onExistingClientMessage)
                
                // send a message
                clientSocket1.emit(EventType.MESSAGE, { userId: params.user.id, text: 'Test Message' }, messageCallback)

                setTimeout(() => {
                    // callback function should be called
                    expect(messageCallback).toHaveBeenCalledTimes(1)
                    expect(messageCallback).toHaveBeenCalledWith()
                    
                    // sender should receive message event
                    expect(onClientMessage).toHaveBeenCalledTimes(1)
                    expect(onClientMessage).toHaveBeenCalledWith({
                        username: 'New User',
                        text: 'Test Message'
                    })

                    // existing user should receive message event
                    expect(onExistingClientMessage).toHaveBeenCalledTimes(1)
                    expect(onExistingClientMessage).toHaveBeenCalledWith({
                        username: 'New User',
                        text: 'Test Message'
                    })

                    // tell jest we're done
                    done()
                }, 50)
            })
        })
    })

    test('Should handle missing user ID', (done) => {
        // connect user to the server
        clientSocket1.emit(EventType.JOIN, { username: 'Test User' }, () => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket1.on(EventType.MESSAGE, onClientMessage)

            // send a message without user ID
            clientSocket1.emit(EventType.MESSAGE, { text: 'Test Message' }, (params) => {
                
                // expect error callback
                expect(params).toEqual({
                    error:{
                        code: ErrorCode.PARAM_MISSING,
                        message: 'userId is undefined',
                        param: 'userId'
                    }
                })

                setTimeout(() => {
                    // client should not have received message event
                    expect(onClientMessage).toHaveBeenCalledTimes(0)

                    // tell jest we're done
                    done()
                }, 50)
            })
        })
    })

    test('Should handle invalid user ID', (done) => {
        // connect user to the server
        clientSocket1.emit(EventType.JOIN, { username: 'Test User' }, () => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket1.on(EventType.MESSAGE, onClientMessage)

            // send a message with invalid user ID
            clientSocket1.emit(EventType.MESSAGE, { userId: 123, text: 'Test Message' }, (params) => {

                // expect error callback
                expect(params).toEqual({
                    error:{
                        code: ErrorCode.PARAM_INVALID_TYPE,
                        message: 'userId of type number, expecting string',
                        param: 'userId'
                    }
                })

                setTimeout(() => {
                    // client should not have received message event
                    expect(onClientMessage).toHaveBeenCalledTimes(0)

                    // tell jest we're done
                    done()
                }, 50)
            })
        })
    })

    test('Should handle missing text', (done) => {
        // connect user to the server
        clientSocket1.emit(EventType.JOIN, { username: 'Test User' }, (params1) => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket1.on(EventType.MESSAGE, onClientMessage)

            // send a message without text
            clientSocket1.emit(EventType.MESSAGE, { userId: params1.user.id }, (params2) => {

                // expect error callback
                expect(params2).toEqual({
                    error:{
                        code: ErrorCode.PARAM_MISSING,
                        message: 'message is undefined',
                        param: 'text'
                    }
                })

                setTimeout(() => {
                    // client should not have received message event
                    expect(onClientMessage).toHaveBeenCalledTimes(0)

                    // tell jest we're done
                    done()
                }, 50)
            })
        })
    })

    test('Should handle invalid text', (done) => {
        // connect user to the server
        clientSocket1.emit(EventType.JOIN, { username: 'Test User' }, (params1) => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket1.on(EventType.MESSAGE, onClientMessage)

            // send a message with invalid text
            clientSocket1.emit(EventType.MESSAGE, { userId: params1.user.id, text: 123 }, (params2) => {

                // expect error callback
                expect(params2).toEqual({
                    error:{
                        code: ErrorCode.PARAM_INVALID_TYPE,
                        message: 'text of type number, expecting string',
                        param: 'text'
                    }
                })

                setTimeout(() => {
                    // client should not have received message event
                    expect(onClientMessage).toHaveBeenCalledTimes(0)

                    // tell jest we're done
                    done()
                }, 50)
            })
        })
    })

    test('Should handle not finding username by ID', (done) => {
        // connect user to the server
        clientSocket1.emit(EventType.JOIN, { username: 'Test User' }, () => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket1.on(EventType.MESSAGE, onClientMessage)

            // send a message without text
            clientSocket1.emit(EventType.MESSAGE, { userId: 'fakeuserid', text: 'Test Message' }, (params) => {

                // expect error callback
                expect(params).toEqual({
                    error:{
                        code: ErrorCode.USER_NOT_FOUND,
                        message: 'user not found'
                    }
                })

                setTimeout(() => {
                    // client should not have received message event
                    expect(onClientMessage).toHaveBeenCalledTimes(0)

                    // tell jest we're done
                    done()
                }, 50)
            })
        })
    })

    test('Should trim text', (done) => {
        // connect user to the server
        clientSocket1.emit(EventType.JOIN, { username: 'Test User' }, (params1) => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket1.on(EventType.MESSAGE, onClientMessage)

            // send a message without text
            clientSocket1.emit(EventType.MESSAGE, { userId: params1.user.id, text: '   Test Message   ' }, (params2) => {

                // expect callback with no params
                expect(params2).toBeUndefined()

                setTimeout(() => {
                    // client should receive their message with the text trimmed
                    expect(onClientMessage).toHaveBeenCalledTimes(1)
                    expect(onClientMessage).toHaveBeenCalledWith({ username: 'Test User', text: 'Test Message' })

                    // tell jest we're done
                    done()
                }, 50)
            })
        })
    })

    test('Should ignore empty text', (done) => {
        // connect user to the server
        clientSocket1.emit(EventType.JOIN, { username: 'Test User' }, (params1) => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket1.on(EventType.MESSAGE, onClientMessage)

            // send a message without text
            clientSocket1.emit(EventType.MESSAGE, { userId: params1.user.id, text: '' }, (params2) => {

                // expect callback with no params
                expect(params2).toBeUndefined()

                setTimeout(() => {
                    // client should not receive the message
                    expect(onClientMessage).toHaveBeenCalledTimes(0)

                    // tell jest we're done
                    done()
                }, 50)
            })
        })
    })

    test('Should handle internal server error', (done) => {
        // mock the servers message function, forcing an error
        onMessage.mockImplementationOnce(() => { throw new Error('forced exception') })

        // connect user to the server
        clientSocket1.emit(EventType.JOIN, { username: 'Test User' }, (params1) => {

            // send a message without text
            clientSocket1.emit(EventType.MESSAGE, { userId: params1.user.id, text: 'Test Message' }, (params2) => {

                // callback should provide error message
                expect(params2).toEqual({
                    error:{
                        code: ErrorCode.INTERNAL_SERVER_ERROR,
                        message: 'forced exception'
                    }
                })

                // tell jest we're done
                done()
            })
        })
    })
})

describe('disconnect', () => {
    test('Should handle unique username', (done) => {
        // connect the existing user
        clientSocket2 = connect()

        // add mock functions to the existing user socket
        const userLeft = jest.fn()
        clientSocket2.on(EventType.USER_LEFT, userLeft)

        // connect existing user to the server
        clientSocket2.emit(EventType.JOIN, { username: 'Existing User' }, (params1) => {
        
            // connect user to the server
            clientSocket1.emit(EventType.JOIN, { username: 'Test User' }, (params2) => {
                expect(chatServer.users).toEqual([{
                    id: params1.user.id,
                    username: 'Existing User'
                }, {
                    id: params2.user.id,
                    username: 'Test User'
                }])

                // disconnect the socket
                clientSocket1.disconnect()

                setTimeout(() => {
                    // client socket should be disconnected
                    expect(clientSocket1.connected).toEqual(false)

                    // user should have been removed from the server array
                    expect(chatServer.users).toEqual([{ id: params1.user.id, username: 'Existing User' }])

                    // existing user should have been notified of the user leaving
                    expect(userLeft).toHaveBeenCalledTimes(1)
                    expect(userLeft).toHaveBeenCalledWith({ username: 'Test User', createdAt: expect.any(Number) })

                    // tell jest we're done
                    done()
                }, 50)
            })
        })
    })

    test('Should handle duplicate username', (done) => {
        // connect the existing user
        clientSocket2 = connect()

        // add mock functions to the existing user socket
        const userLeft = jest.fn()
        clientSocket2.on(EventType.USER_LEFT, userLeft)

        // connect existing user to the server
        clientSocket2.emit(EventType.JOIN, { username: 'Duplicate User' }, (params1) => {

            // connect user to the server
            clientSocket1.emit(EventType.JOIN, { username: 'Duplicate User' }, (params2) => {

                // expect users to be in server array
                expect(chatServer.users).toEqual([{
                    id: params1.user.id,
                    username: 'Duplicate User'
                }, {
                    id: params2.user.id,
                    username: 'Duplicate User'
                }])

                // disconnect the socket
                clientSocket1.disconnect()

                setTimeout(() => {
                    // client socket should be disconnected
                    expect(clientSocket1.connected).toEqual(false)

                    // user should have been removed from the server array
                    expect(chatServer.users).toEqual([{ id: params1.user.id, username: 'Duplicate User' }])

                    // existing user should not be notified
                    expect(userLeft).toHaveBeenCalledTimes(0)

                    // tell jest we're done
                    done()
                }, 50)
            })
        })
    })
})*/