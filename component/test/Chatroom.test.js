// mock autoscroll that simply returns the Chat component
jest.mock('autoscroll-react', () => { return (component) => { return component } })

import Chatroom from '../src/Chatroom'
import ChatroomServer from '@kevinorriss/chatroom-server'
import http  from 'http'
import jwt from 'jsonwebtoken'

const SECRET = 'testsecret'
const PATH = '/socket.io/chatroom'
const TOKEN = jwt.sign({ username: 'Test User'}, SECRET, { noTimestamp: true })
const TITLE = 'Test Chat Room'

let httpServer
let chatServer
let chatroomUri
let wrapper

// setup a socket before the tests start
beforeAll(() => {
    httpServer = http.createServer().listen(7000)
    const httpServerAddr = httpServer.address()
    chatroomUri = `http://[${httpServerAddr.address}]:${httpServerAddr.port}`
    chatServer = new ChatroomServer(httpServer, PATH, SECRET)
})

// clean up the server after each test
afterEach(() => {
    // clear the users array
    chatServer.users = []

    // disconnect all sockets on the server
    Object.values(chatServer.io.of("/").connected).forEach(function(s) { s.disconnect(true) })
})

// close the server once the tests are complete
afterAll(() => {
    httpServer.close()
})

test('Should render initial state', () => {
    // mock the socket connection code so it doesn't connect
    jest.spyOn(Chatroom.prototype, 'componentDidMount').mockImplementationOnce(() => { })

    // should render initial chatroom state
    expect(shallow( <Chatroom token={TOKEN} uri={chatroomUri} path={PATH} />)).toMatchSnapshot()
})

test('Should apply custom title', () => {
    
    // mock the socket connection code so it doesn't connect
    jest.spyOn(Chatroom.prototype, 'componentDidMount').mockImplementationOnce(() => { })

    // create the chatroom, passing in a title
    wrapper = shallow( <Chatroom token={TOKEN} uri={chatroomUri} path={PATH} title={TITLE} /> )

    // force the wrapper to update
    wrapper.update()

    // expect the initial "online" snapshot to match
    expect(wrapper).toMatchSnapshot()
})

test('Should connect on mount', (done) => {
    // mount a chatroom component
    wrapper = shallow( <Chatroom token={TOKEN} uri={chatroomUri} path={PATH} /> )

    // listen to the wrapper socket connect event
    wrapper.instance().socket.on('connect', () => {

        // wait a little while
        setTimeout(() => {
            
            // check the status values as "online"
            expect(wrapper.state('status')).toEqual({ icon: 'green', text: 'online' })

            // force the wrapper to update
            wrapper.update()

            // expect the initial "online" snapshot to match
            expect(wrapper).toMatchSnapshot()

            // tell jest we're done
            done()
        }, 50)
    })
})

test('Should get connection error on incorrect URI', (done) => {

    // mock the connect error event
    jest.spyOn(Chatroom.prototype, 'onConnectError').mockImplementationOnce(() => {
        // tell jest we're done
        done()
    })

    // mount the chatroom with an incorrect URI
    wrapper = shallow( <Chatroom token={TOKEN} uri={'incorrect'} path={PATH} /> )
})

test('Should get connection error on incorrect path', (done) => {

    // mock the connect error event
    jest.spyOn(Chatroom.prototype, 'onConnectError').mockImplementationOnce(() => {
        // tell jest we're done
        done()
    })

    // mount the chatroom with an incorrect URI
    wrapper = shallow( <Chatroom token={TOKEN} uri={chatroomUri} path={'incorrect'} /> )
})

test('Should reject incorrect token', (done) => {
    // mount the chatroom with an invald token
    const invalid_token = jwt.sign({ username: 'Test User'}, 'incorrect secret', { noTimestamp: true })
    wrapper = shallow( <Chatroom token={invalid_token} uri={chatroomUri} path={PATH} /> )

    // wait for the socket to receive an unauthorised event
    wrapper.instance().socket.on('unauthorized', () => {

        // force the wrapper to update
        wrapper.update()

        // check the status values as "online"
        expect(wrapper.state('status')).toEqual({ icon: 'red', text: 'unauthorized' })

        // expect the wrapper to match the snapshot
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })
})

test('Should handle new user joining', (done) => {
    // mount the chatroom and get its instance
    wrapper = shallow( <Chatroom token={TOKEN} uri={chatroomUri} path={PATH} /> )
    const instance = wrapper.instance()

    // wait to receive room data
    instance.socket.on('ROOM_DATA', () => {
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

test ('Should handle multiple clients of the same username', (done) => {
    // mount the chatroom and get its instance
    wrapper = shallow( <Chatroom token={TOKEN} uri={chatroomUri} path={PATH} /> )
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

test('Should handle user leaving', (done) => {
    // mount the chatroom and get its instance
    wrapper = shallow( <Chatroom token={TOKEN} uri={chatroomUri} path={PATH} /> )
    const instance = wrapper.instance()

    // wait to receive room data
    instance.socket.on('ROOM_DATA', () => {
        // call the user joined event
        instance.onUserJoined({ username: 'New User' })

        // expect the state usernames to contain both users
        expect(wrapper.state('usernames')).toEqual(['Test User', 'New User'])

        // call the user left event
        instance.onUserLeft({ username: 'New User' })

        // force the wrapper to update
        wrapper.update()

        // expect the state usernames to contain both users
        expect(wrapper.state('usernames')).toEqual(['Test User'])

        // expect the chatroom to match the snapshot
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })
})

test('Should render received message', (done) => {
    wrapper = shallow( <Chatroom token={TOKEN} uri={chatroomUri} path={PATH} /> )
    const instance = wrapper.instance()

    // wait to receive room data
    instance.socket.on('ROOM_DATA', () => {

        // call the message event
        instance.onMessage({
            username: 'New User',
            text: 'Hello Tester!'
        })

        // force the wrapper to update
        wrapper.update()

        // expect the chatroom to match the snapshot
        expect(wrapper).toMatchSnapshot()

        // tell jest we're done
        done()
    })
})

test('Should send a message', (done) => {
    wrapper = mount( <Chatroom token={TOKEN} uri={chatroomUri} path={PATH} /> )
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