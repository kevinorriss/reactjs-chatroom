import Chatroom from '../src/Chatroom'
import jwt from 'jsonwebtoken'
import MockedSocket from 'socket.io-mock'

const SECRET = 'testsecret'
const PATH = '/socket.io/chatroom'
const TOKEN = jwt.sign({ username: 'Test User'}, SECRET, { noTimestamp: true })
const TITLE = 'Test Chat Room'
const CHATROOM_URL = 'http://localhost:7000'

let wrapper, socket

// mock autoscroll that simply returns the Chat component
jest.mock('autoscroll-react', () => { return (component) => { return component } })

jest.mock('socket.io-client', () => {
    return () => { return new MockedSocket() }
})

test('Should render initial state', () => {
    // mock the socket connection code so it doesn't connect
    jest.spyOn(Chatroom.prototype, 'componentDidMount').mockImplementationOnce(() => { })

    // should render initial chatroom state
    expect(shallow( <Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)).toMatchSnapshot()
})

test('Should apply custom title', () => {
    
    // mock the socket connection code so it doesn't connect
    jest.spyOn(Chatroom.prototype, 'componentDidMount').mockImplementationOnce(() => { })

    // create the chatroom, passing in a title
    wrapper = shallow( <Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} title={TITLE} /> )

    // force the wrapper to update
    wrapper.update()

    // expect the initial "online" snapshot to match
    expect(wrapper).toMatchSnapshot()
})

test('Should render correctly on connect', (done) => {
    // mount the chatroom
    wrapper = shallow( <Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} /> )
    socket = wrapper.instance().socket

    // wait for the socket to receive a connect event
    socket.on('connect', () => {
        // expect the initial "authenticating" snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit a connect message
    socket.socketClient.emit('connect')
})

test('Should render correctly on connection error', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} /> )
    socket = wrapper.instance().socket

    // wait for the socket to receive a connect_error event
    socket.on('connect_error', () => {
        // expect the "connection error" snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit a connect_error message
    socket.socketClient.emit('connect_error')
})

test('Should render correctly on authenticated', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a authenticated event
    socket.on('authenticated', () => {
        // expect the "waiting for room data..." snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit a authenticated message
    socket.socketClient.emit('authenticated')
})

test('Should render correctly on timeout', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a connect_timeout event
    socket.on('connect_timeout', () => {
        // expect the "waiting for room data..." snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit a connect_timeout message
    socket.socketClient.emit('connect_timeout')
})

test('Should render correctly on error', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a error event
    socket.on('error', () => {
        // expect the "waiting for room data..." snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit a error message
    socket.socketClient.emit('error')
})

test('Should render correctly on reconnect', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a reconnect event
    socket.on('reconnect', () => {
        // expect the "reconnected" snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit a reconnect message
    socket.socketClient.emit('reconnect')
})

test('Should render correctly on reconnect_attempt', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a reconnect_attempt event
    socket.on('reconnect_attempt', () => {
        // expect the "reconnected" snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit a reconnect message (3rd attempt)
    socket.socketClient.emit('reconnect_attempt', 3)
})

test('Should render correctly on reconnecting', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a reconnecting event
    socket.on('reconnecting', () => {
        // expect the "reconnection attempt X..." snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit a reconnecting message (3rd attempt)
    socket.socketClient.emit('reconnecting', 3)
})

test('Should render correctly on reconnect_error', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a reconnect_error event
    socket.on('reconnect_error', () => {
        // expect the "reconnection error" snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit a reconnect_error message
    socket.socketClient.emit('reconnect_error')
})

test('Should render correctly on reconnect_failed', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a reconnect_failed event
    socket.on('reconnect_failed', () => {
        // expect the "reconnection error" snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit a reconnect_failed message
    socket.socketClient.emit('reconnect_failed')
})

test('Should render correctly on disconnect', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a disconnect event
    socket.on('disconnect', () => {
        // expect the "disconnected" snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit a disconnect message
    socket.socketClient.emit('disconnect')
})

test('Should render correctly on unauthorized', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a unauthorized event
    socket.on('unauthorized', () => {
        // expect the "disconnected" snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit a unauthorized message
    socket.socketClient.emit('unauthorized')
})

test('Should render correctly on unauthorized with error', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a unauthorized event
    socket.on('unauthorized', () => {
        // expect the "disconnected" snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit a unauthorized message
    socket.socketClient.emit('unauthorized', { message: 'test error' })
})

test('Should render room data', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a room data event
    socket.on('ROOM_DATA', () => {
        // expect the snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit the room data
    socket.socketClient.emit('ROOM_DATA', { 
        username: 'Test User',
        room: {
            usernames: ['Test User 1', 'Test User 2', 'Test User 3']
        }
    })
})

test('Should render user joining', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a user joined event
    socket.on('USER_JOINED', () => {
        // expect the snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit the joined user
    socket.socketClient.emit('USER_JOINED', {
        username: 'Test User',
        createdAt: new Date(2021,8,30,22,15,30,100).getTime()
    })
})

test('Should render user leaving', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a user left event
    socket.on('USER_LEFT', () => {
        // expect the snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit the joined user
    socket.socketClient.emit('USER_LEFT', {
        username: 'Test User',
        createdAt: new Date(2021, 8, 30, 22, 15, 30, 100).getTime()
    })
})

test('Should render message', (done) => {
    // mount the chatroom
    wrapper = shallow(<Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} />)
    socket = wrapper.instance().socket

    // wait for the socket to receive a message event
    socket.on('MESSAGE', () => {
        // expect the snapshot to match
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })

    // emit the joined user
    socket.socketClient.emit('MESSAGE', { userId: 1, text: 'This is a test message' })
})

/*
TODO
test ('Should handle multiple clients of the same username', (done) => {
    // mount the chatroom and get its instance
    wrapper = shallow( <Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} /> )
    const instance = wrapper.instance()

    // wait to receive room data
    instance.socket.on('ROOM_DATA', () => {
        // call the user joined event
        instance.onUserJoined({ username: 'New User' })

        // force the wrapper to update
        wrapper.update()

        // expect the state usernames to contain both users
        expect(wrapper.state('usernames')).toEqual(['Test User', 'New User'])

        // call the user joined event
        instance.onUserJoined({ username: 'New User' })

        // force the wrapper to update
        wrapper.update()

        // expect the state usernames to contain both users
        expect(wrapper.state('usernames')).toEqual(['Test User', 'New User'])

        // expect the chatroom to match the snapshot
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })
})

TODO
test('Should send a message', (done) => {
    wrapper = mount( <Chatroom token={TOKEN} uri={CHATROOM_URL} path={PATH} /> )
    const instance = wrapper.instance()

    // wait to receive room data
    instance.socket.on('ROOM_DATA', () => {

        // type a message
        instance.onTextChange({target: { value: 'Hello, World!' }})

        // force the wrapper to update
        wrapper.update()

        // expect the chatroom to match the snapshot
        expect(wrapper).toMatchSnapshot()

        // send the message
        instance.sendMessage()

        // expect the input to be disabled
        expect(wrapper.state('inputDisabled')).toEqual(true)

        // wait for the message to be received
        instance.socket.on('MESSAGE', () => {

            // wait a little while
            setTimeout(() => {
                // force the wrapper to update
                wrapper.update()

                // expect the chatroom to match the snapshot
                expect(wrapper).toMatchSnapshot()

                // tell jest we're done
                done()
            }, 50)
        })
    })
})
*/