const io = require('socket.io-client')
const http = require('http')
const jwt = require('jsonwebtoken')
const ChatSocket = require('../src/Socket')
const { EventType, ErrorType } = require('@kevinorriss/chatroom-types')

const SECRET = 'testsecret'
const PATH = '/socket.io/chatroom'

let clientSocket
let existingClientSocket
let httpServer
let httpServerAddr
let chatServer

// spy on the servers events
const onMessage = jest.spyOn(ChatSocket.prototype, 'onMessage')

// disable console errors for cleaner test output
jest.spyOn(console, 'error').mockImplementation(() => { })

// returns a client connection
const connectClient = () => {
    return io(`http://[${httpServerAddr.address}]:${httpServerAddr.port}`, {
        path: PATH,
        'reconnection delay': 0,
        'reopen delay': 0,
        'force new connection': true,
        transports: ['websocket']
    })
}

/**
 * Before testing starts
 */
beforeAll((done) => {
    // setup servers
    httpServer = http.createServer().listen()
    httpServerAddr = httpServer.address()
    chatServer = new ChatSocket(PATH, SECRET)
    chatServer.io.attach(httpServer)
    
    done()
})

/**
 *  After testing finished
 */
afterAll((done) => {
    // shut down servers
    chatServer.io.close()
    httpServer.close()
    done()
})

/**
 * Run before each test
 */
beforeEach((done) => {
    // connect the client socket
    clientSocket = connectClient()
    clientSocket.emit()

    existingClientSocket = undefined

    // send authentication after connected
    clientSocket.on('connect', () => {
        clientSocket.emit('authenticate', { token: jwt.sign({ username: 'Test User' }, SECRET) })
    })
    // call done callback once authenticated
    clientSocket.on('authenticated', () => {
        done()
    })
})

/**
 * Run after each test
 */
afterEach((done) => {
    // Cleanup
    if (clientSocket.connected) {
        clientSocket.disconnect()
    }
    if (existingClientSocket && existingClientSocket.connected) {
        existingClientSocket.disconnect()
    }

    // reset the counts of every mock
    jest.clearAllMocks()

    done()
})

describe('authenticate', () => {
    test('test', () => {
    })
})

/*describe('join', () => {
    test('Should add new user to emtpy room', (done) => {
        // create a mock function and add to the client join listener
        const userJoined = jest.fn()
        clientSocket.once(EventType.USER_JOINED, userJoined)

        // emit a join message to the server
        clientSocket.emit(EventType.JOIN, { username: 'Client Username' }, (params) => {
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
        existingClientSocket = connectClient()

        // setup spies on the existing user
        const existingUserJoined = jest.fn()
        existingClientSocket.on(EventType.USER_JOINED, existingUserJoined)

        existingClientSocket.emit(EventType.JOIN, { username: 'Existing Username' }, () => {
            
            // connect the new user
            clientSocket.emit(EventType.JOIN, { username: 'New Username' }, (params) => {
                
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
        clientSocket.emit(EventType.JOIN, {}, (params) => {

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
        clientSocket.emit(EventType.JOIN, { username: 123 }, (params) => {

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
        clientSocket.emit(EventType.JOIN, { username: '' }, (params) => {

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
        clientSocket.emit(EventType.JOIN, { username: '    Test User    ' }, (params) => {

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
        existingClientSocket = connectClient()

        // spy on the existing user join event
        const existingUserJoined = jest.fn()
        existingClientSocket.once(EventType.USER_JOINED, existingUserJoined)

        // connect the existing user
        existingClientSocket.emit(EventType.JOIN, { username: 'Existing User' }, () => {

            // connect the same username again
            clientSocket.emit(EventType.JOIN, { username: 'Existing User' }, (params) => {

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
        clientSocket.emit(EventType.JOIN, { username: 'Client Username' }, (params) => {
            
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
        existingClientSocket = connectClient()

        // connect the existing user
        existingClientSocket.emit(EventType.JOIN, { username: 'Existing User' }, () => {

            // connect the new user
            clientSocket.emit(EventType.JOIN, { username: 'New User' }, (params) => {

                // create the mock functions
                const onClientMessage = jest.fn()
                const onExistingClientMessage = jest.fn()
                const messageCallback = jest.fn()

                // mock both clients message events
                clientSocket.once(EventType.MESSAGE, onClientMessage)
                existingClientSocket.once(EventType.MESSAGE, onExistingClientMessage)
                
                // send a message
                clientSocket.emit(EventType.MESSAGE, { userId: params.user.id, text: 'Test Message' }, messageCallback)

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
        clientSocket.emit(EventType.JOIN, { username: 'Test User' }, () => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket.on(EventType.MESSAGE, onClientMessage)

            // send a message without user ID
            clientSocket.emit(EventType.MESSAGE, { text: 'Test Message' }, (params) => {
                
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
        clientSocket.emit(EventType.JOIN, { username: 'Test User' }, () => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket.on(EventType.MESSAGE, onClientMessage)

            // send a message with invalid user ID
            clientSocket.emit(EventType.MESSAGE, { userId: 123, text: 'Test Message' }, (params) => {

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
        clientSocket.emit(EventType.JOIN, { username: 'Test User' }, (params1) => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket.on(EventType.MESSAGE, onClientMessage)

            // send a message without text
            clientSocket.emit(EventType.MESSAGE, { userId: params1.user.id }, (params2) => {

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
        clientSocket.emit(EventType.JOIN, { username: 'Test User' }, (params1) => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket.on(EventType.MESSAGE, onClientMessage)

            // send a message with invalid text
            clientSocket.emit(EventType.MESSAGE, { userId: params1.user.id, text: 123 }, (params2) => {

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
        clientSocket.emit(EventType.JOIN, { username: 'Test User' }, () => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket.on(EventType.MESSAGE, onClientMessage)

            // send a message without text
            clientSocket.emit(EventType.MESSAGE, { userId: 'fakeuserid', text: 'Test Message' }, (params) => {

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
        clientSocket.emit(EventType.JOIN, { username: 'Test User' }, (params1) => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket.on(EventType.MESSAGE, onClientMessage)

            // send a message without text
            clientSocket.emit(EventType.MESSAGE, { userId: params1.user.id, text: '   Test Message   ' }, (params2) => {

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
        clientSocket.emit(EventType.JOIN, { username: 'Test User' }, (params1) => {

            // add mock functions to socket
            const onClientMessage = jest.fn()
            clientSocket.on(EventType.MESSAGE, onClientMessage)

            // send a message without text
            clientSocket.emit(EventType.MESSAGE, { userId: params1.user.id, text: '' }, (params2) => {

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
        clientSocket.emit(EventType.JOIN, { username: 'Test User' }, (params1) => {

            // send a message without text
            clientSocket.emit(EventType.MESSAGE, { userId: params1.user.id, text: 'Test Message' }, (params2) => {

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
        existingClientSocket = connectClient()

        // add mock functions to the existing user socket
        const userLeft = jest.fn()
        existingClientSocket.on(EventType.USER_LEFT, userLeft)

        // connect existing user to the server
        existingClientSocket.emit(EventType.JOIN, { username: 'Existing User' }, (params1) => {
        
            // connect user to the server
            clientSocket.emit(EventType.JOIN, { username: 'Test User' }, (params2) => {
                expect(chatServer.users).toEqual([{
                    id: params1.user.id,
                    username: 'Existing User'
                }, {
                    id: params2.user.id,
                    username: 'Test User'
                }])

                // disconnect the socket
                clientSocket.disconnect()

                setTimeout(() => {
                    // client socket should be disconnected
                    expect(clientSocket.connected).toEqual(false)

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
        existingClientSocket = connectClient()

        // add mock functions to the existing user socket
        const userLeft = jest.fn()
        existingClientSocket.on(EventType.USER_LEFT, userLeft)

        // connect existing user to the server
        existingClientSocket.emit(EventType.JOIN, { username: 'Duplicate User' }, (params1) => {

            // connect user to the server
            clientSocket.emit(EventType.JOIN, { username: 'Duplicate User' }, (params2) => {

                // expect users to be in server array
                expect(chatServer.users).toEqual([{
                    id: params1.user.id,
                    username: 'Duplicate User'
                }, {
                    id: params2.user.id,
                    username: 'Duplicate User'
                }])

                // disconnect the socket
                clientSocket.disconnect()

                setTimeout(() => {
                    // client socket should be disconnected
                    expect(clientSocket.connected).toEqual(false)

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