// mock autoscroll that simply returns the Chat component
jest.mock('autoscroll-react', () => { return (component) => { return component } })

import Chat from '../../src/components/Chat'

// disable console errors for cleaner test output
jest.spyOn(console, 'error').mockImplementation(() => {})

const username = 'Myself'

const welcome_notification = {
    text: 'Welcome, Myself!',
    notification: true
}

const my_message = {
    text: 'Hello, World!',
    username
}

const received_message = {
    text: 'Hi there!',
    username: 'Other User'
}

const error_message = {
    text: 'There has been an error!',
    error: true
}

const error_and_notification_message = {
    text: 'This is an error and notification...',
    error: true,
    notification: true
}

test('Should render empty chat', () => {
    expect(shallow( <Chat className="chatroom__chat" messages={ [] } username={ username }/> )).toMatchSnapshot()
})

test('Should render notification', () => {
    expect(shallow( <Chat className="chatroom__chat" messages={ [ welcome_notification ] } username={ username }/> )).toMatchSnapshot()
})

test('Should render sent message correctly', () => {
    expect(shallow( <Chat className="chatroom__chat" messages={ [ my_message ] } username={ username }/> )).toMatchSnapshot()
})

test('Should render received message correctly', () => {
    expect(shallow( <Chat className="chatroom__chat" messages={ [ received_message ] } username={ username }/> )).toMatchSnapshot()
})

test('Should render error message correctly', () => {
    expect(shallow( <Chat className="chatroom__chat" messages={ [ error_message ] } username={ username }/> )).toMatchSnapshot()
})

test('Should render error when message is both notification and error', () => {
    expect(shallow( <Chat className="chatroom__chat" messages={ [ error_and_notification_message ] } username={ username }/> )).toMatchSnapshot()
})

test('Should render multiple messages in order', () => {
    expect(shallow( <Chat className="chatroom__chat" messages={ [ welcome_notification, my_message, received_message, error_message ] } username={ username }/> )).toMatchSnapshot()
})