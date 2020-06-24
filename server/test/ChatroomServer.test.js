const io = require('socket.io-client')
const http = require('http')
const jwt = require('jsonwebtoken')
const ChatroomServer = require('../src/ChatroomServer')

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

// disable console errors for cleaner test output
jest.spyOn(console, 'error').mockImplementation(() => { })

// returns a client connection
const connect = (auth) => {
    const socket = io(`http://[${httpServerAddr.address}]:${httpServerAddr.port}`, { path: PATH, reconnection: false })

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
beforeAll(() => {
    // setup servers
    httpServer = http.createServer().listen()
    httpServerAddr = httpServer.address()
    chatServer = new ChatroomServer(httpServer, PATH, SECRET)
})

/**
 * Run after each test
 */
afterEach(() => {
    // clear the users array
    chatServer.users = []

    // disconnect all sockets on the server
    Object.values(chatServer.io.of("/").connected).forEach(function(s) { s.disconnect(true) })
})

describe('connect', () => {
    test('Should call authenticated event with valid token', async (done) => {

        // connect a client and wait for authenticated message
        const onAuthenticated = jest.fn()
        clientSocket1 = connect({ username: USER_1}).on('authenticated', onAuthenticated).on('ROOM_DATA', () => {
            expect(onAuthenticated).toHaveBeenCalledTimes(1)

            // tell jest we're done
            done()
        })
    })

    test('Should disconnect with incorrect secret', async (done) => {
        // connect a client with an invalid key
        const onUnauthorized = jest.fn()
        clientSocket1 = connect({ username: USER_1, key: `${SECRET}123`}).on('unauthorized', onUnauthorized)
            .on('disconnect', () => {
                // unauthorized event should have been received
                expect(onUnauthorized).toHaveBeenCalledTimes(1)

                // expect invalid token error code
                expect(onUnauthorized.mock.calls[0][0]).toMatchObject({ data: { code: 'invalid_token' } })

                // socket should be disconnected
                expect(clientSocket1.connected).toEqual(false)

                // tell jest we're done
                done()
            })
    })

    test('Should receive unauthorized event when missing username', async (done) => {
        
        // connect a client without providing a username
        clientSocket1 = connect({}).on('unauthorized', (data) => {
            
            // the socket should be disconnected
            expect(data).toEqual({message: 'missing username'})

            // tell jest we're done
            done()
        })
    })

    test('Should disconnect client with missing username', async (done) => {
        
        // connect a client without providing a username
        clientSocket1 = connect({}).on('disconnect', () => {
            
            // the socket should be disconnected
            expect(clientSocket1.connected).toEqual(false)

            // tell jest we're done
            done()
        })
    })
})

describe('authenticated', () => {
    test('Should broadcast user joined to existing users', async (done) => {
        
        // connect the client and await authentication
        const onUserJoined = jest.fn()
        clientSocket1 = connect({username: USER_1}).on('USER_JOINED', onUserJoined).on('ROOM_DATA', () => {
            // connect the second client
            clientSocket2 = connect({username: USER_2}).on('ROOM_DATA', () => {
                // socket should be authenticated
                expect(onUserJoined).toHaveBeenCalledTimes(1)

                // expect the user joined data
                expect(onUserJoined).toHaveBeenCalledWith({
                    username: USER_2,
                    createdAt: expect.any(Number)
                })

                // tell jest we're done
                done()
            })
        })
    })

    test('Should skip broadcasting user joined if user already in chatroom (in another tab)', async (done) => {
        
        const onUserJoined1 = jest.fn()
        const onUserJoined2 = jest.fn()

        // connect the clients
        clientSocket1 = connect({username: USER_1}).on('USER_JOINED', onUserJoined1).on('ROOM_DATA', () => {
            clientSocket2 = connect({username: USER_2}).on('USER_JOINED', onUserJoined2).on('ROOM_DATA', () => {
                clientSocket3 = connect({username: USER_1}).on('ROOM_DATA', () => {
                    // first user should have been notified of second user join
                    expect(onUserJoined1).toHaveBeenCalledTimes(1)
                    expect(onUserJoined1).toHaveBeenCalledWith({username: USER_2, createdAt: expect.any(Number)})

                    // second user should not be notified of first user creating a second connection
                    expect(onUserJoined2).toHaveBeenCalledTimes(0)

                    // tell jest we're done
                    done()
                })
            })
        })
    })

    test('Should add connected user to server array', async (done) => {
        // connect the client and await authentication
        const onAuthenticated = jest.fn()
        clientSocket1 = connect({username: USER_1}).on('authenticated', onAuthenticated)
            .on('ROOM_DATA', () => {
                // socket should be authenticated
                expect(onAuthenticated).toHaveBeenCalledTimes(1)

                // expect the server's user array to contain the new client
                expect(chatServer.users).toEqual([{
                    socketId: expect.any(String),
                    username: USER_1
                }])

                // the socket should still be connected
                expect(clientSocket1.connected).toEqual(true)

                // tell jest we're done
                done()
            })
    })

    test('Should receive room data after authenticating', async (done) => {
        // connect a client
        clientSocket1 = connect({username: USER_1}).on('ROOM_DATA', (data) => {
            
            // should receive room data event
            expect(data).toEqual({
                username: USER_1,
                room: { usernames: [USER_1] }
            })

            // tell jest we're done
            done()
        })
    })

    // room data should remove duplicate usernames
    test('Should remove duplicate usernames from room data', async (done) => {
        clientSocket1 = connect({username: USER_1}).on('ROOM_DATA', () => {
            clientSocket2 = connect({username: USER_1}).on('ROOM_DATA', () => {
                clientSocket3 = connect({username: USER_2}).on('ROOM_DATA', (data) => {
                    
                    // expect the servers user array to contain the 3 connections (with duplicate usernames)
                    expect(chatServer.users).toEqual([
                        {
                            socketId: expect.any(String),
                            username: USER_1
                        }, {
                            socketId: expect.any(String),
                            username: USER_1
                        }, {
                            socketId: expect.any(String),
                            username: USER_2
                        }
                    ])

                    // expect the final client to receive the room data with distinct usernames
                    expect(data).toEqual({
                        username: USER_2,
                        room: {
                            usernames: [USER_1, USER_2]
                        }
                    })

                    // tell jest we're done
                    done()
                })
            })
        })
    })
})

describe('message', () => {
    test('Should receive own message', async (done) => {
        // connect the user
        clientSocket1 = connect({username: USER_1}).on('ROOM_DATA', () => {
            // send a message and wait for the callback
            clientSocket1.emit('MESSAGE', { text: 'Test Message' }, () => {})
                .on('MESSAGE', (data) => {
                    expect(data).toEqual({ username: USER_1, text: 'Test Message' })

                    // tell jest we're done
                    done()
                })
        })
    })

    test('Should receive message from other user', async (done) => {
        // connect the users
        clientSocket1 = connect({username: USER_1}).on('ROOM_DATA', () => {
            clientSocket2 = connect({username: USER_2}).on('ROOM_DATA', () => {
                
                // setup the event listener on user one
                clientSocket1.on('MESSAGE', (data) => {
                    // expect user one to receive user two's message
                    expect(data).toEqual({ username: USER_2, text: 'Test Message' })

                    // tell jest we're done
                    done()
                })

                // send a message from user two
                clientSocket2.emit('MESSAGE', { text: 'Test Message' }, () => {} )
            })
        })
    })

    test('Should handle not finding the user from socket ID', async (done) => {
        // connect the user and wait for room data (we know)
        clientSocket1 = connect({username: USER_1}).on('ROOM_DATA', () => {

            // expect the server users array to contain the user
            expect(chatServer.users).toEqual([{
                socketId: expect.any(String),
                username: USER_1
            }])

            // set the server users to an empty array
            chatServer.users = []

            // mock the message received event
            const onMessage = jest.fn()
            clientSocket1.on('MESSAGE', onMessage)

            // send a message and await the callback
            clientSocket1.emit('MESSAGE', { text: 'Test Message' }, (data) => {

                // expect the callback to be fired with an error
                expect(data).toEqual({
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'user not found'
                    }
                })

                // wait a little while
                setTimeout(() => {

                    // no message should have been received
                    expect(onMessage).toHaveBeenCalledTimes(0)

                    // tell jest we're done
                    done()

                }, 50)
            })
        })
    })

    test('Should trim text', async (done) => {
        // connect user to the server
        clientSocket1 = connect({username: USER_1}).on('ROOM_DATA', () => {
            // mock the message event
            clientSocket1.on('MESSAGE', (data) => {
                
                // message should be trimmed
                expect(data).toEqual({
                    username: USER_1,
                    text: 'Padded Message'
                })

                // tell jest we're done
                done()
            })

            // send a space padded message and await callback
            clientSocket1.emit('MESSAGE', { text: '   Padded Message   ' }, () => { } )
        })
    })

    test('Should ignore empty text', async (done) => {
        // connect user to the server
        clientSocket1 = connect({username: USER_1}).on('ROOM_DATA', () => {
            // mock the message event
            const onMessage = jest.fn()
            clientSocket1.on('MESSAGE', onMessage)

            // send a space padded message and await callback
            clientSocket1.emit('MESSAGE', { text: '' }, (data) => {

                // callback should be called with empty text notice
                expect(data).toEqual({
                    notice: { message: 'empty text' }
                })
                
                // wait a little while
                setTimeout(() => {

                    // no message should be sent
                    expect(onMessage).toHaveBeenCalledTimes(0)

                    // tell jest we're done
                    done()

                }, 50)
            })
        })
    })

    test('Should handle internal server error', async (done) => {
        // connect user to the server
        clientSocket1 = connect({username: USER_1}).on('ROOM_DATA', () => {
            // mock the user array find method to throw an error
            chatServer.users.find = jest.fn()
            chatServer.users.find.mockImplementationOnce(() => {
                throw new Error('forced error')
            })

            // mock the message event
            const onMessage = jest.fn()
            clientSocket1.on('MESSAGE', onMessage)

            // send a message and await callback
            clientSocket1.emit('MESSAGE', { text: 'Test Message' }, (data) => {
                
                // callback should be fired with an error
                expect(data).toEqual({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'forced error'
                    }
                })

                // wait a little while
                setTimeout(() => {

                    // no message should have been sent
                    expect(onMessage).toHaveBeenCalledTimes(0)

                    // tell jest we're done
                    done()
                }, 50)
            })
        })
    })
})

describe('disconnect', () => {
    test('Should remove the user from the array', async (done) => {

        // connect user to the server and await room data
        clientSocket1 = connect({username: USER_1}).on('ROOM_DATA', () => {
            // user should be in the array
            expect(chatServer.users).toEqual([{
                socketId: expect.any(String),
                username: USER_1
            }])

            // disconnect the socket
            clientSocket1.close()

            // wait a little while
            setTimeout(() => {

                // array should be empty
                expect(chatServer.users).toEqual([])

                // tell jest we're done
                done()

            }, 50)
        })
    })

    test('Should notify room of user leaving', async (done) => {

        // connect the users
        clientSocket1 = connect({username: USER_1}).on('ROOM_DATA', () => {
            clientSocket2 = connect({username: USER_2}).on('ROOM_DATA', () => {

                // listen for users leaving
                clientSocket1.on('USER_LEFT', (data) => {

                    // data should match the disconnected user
                    expect(data).toEqual({
                        username: USER_2,
                        createdAt: expect.any(Number)
                    })

                    done()
                })

                // disconnect the socket
                clientSocket2.close()
            })
        })
    })

    test('Should not notify room when closing a duplicate connection', async (done) => {

        // connect the users
        clientSocket1 = connect({username: USER_1}).on('ROOM_DATA', () => {
            clientSocket2 = connect({username: USER_2}).on('ROOM_DATA', () => {
                clientSocket3 = connect({username: USER_2}).on('ROOM_DATA', () => {
                    
                    // listen for users leaving
                    const onUserLeft = jest.fn()
                    clientSocket1.on('USER_LEFT', onUserLeft)

                    // close one of the duplicate username connections
                    clientSocket3.close()

                    // wait a little while
                    setTimeout(() => {

                        // no event should have been sent
                        expect(onUserLeft).toHaveBeenCalledTimes(0)

                        // server users array should still contain one of the duplicate usernames
                        expect(chatServer.users).toEqual([
                            {
                                socketId: expect.any(String),
                                username: USER_1
                            }, {
                                socketId: expect.any(String),
                                username: USER_2
                            }])

                        // tell jest we're done
                        done()
                    }, 50)
                })
            })
        })
    })
})