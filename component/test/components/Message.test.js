import Message from '../../src/components/Message'

// disable console errors for cleaner test output
jest.spyOn(console, 'error').mockImplementation(() => {})

test('Should render received message correctly', () => {
    expect(shallow( <Message username='Test User' text='This is a received message' /> )).toMatchSnapshot()
})

test('Should render send message correctly', () => {
    expect(shallow( <Message username='Myself' text='This is a sent message' isMe={true} /> )).toMatchSnapshot()
})

test('Should render notification message correctly', () => {
    expect(shallow( <Message username='Myself' text='This is a notification' isNotification={true}/> )).toMatchSnapshot()
})

test('Should render error message correctly', () => {
    expect(shallow( <Message username='Myself' text='This is an error' isError={true}/> )).toMatchSnapshot()
})

test('Should render error when message is both notification and error', () => {
    expect(shallow( <Message username='Test User' text='This is a notification and an error' isError={true} isNotification={true}/> )).toMatchSnapshot()
})