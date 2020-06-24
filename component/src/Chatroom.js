import React from 'react'
import PropTypes from 'prop-types'
import io from 'socket.io-client'
import Chat from './components/Chat'
import './styles.css'

class Chatroom extends React.Component {
    constructor(props) {
        super(props)

        // get a reference to the text input
        this.messageInput = React.createRef()

        // initialise the state
        this.state = {
            username: undefined,
            usernames: [],
            messages: [],
            title: props.title || 'Chat Room',
            text: '',
            inputDisabled: true,
            error: undefined,
            status: {
                icon: 'orange',
                text: 'connecting...'
            }
        }
    }

    componentDidMount() {
        // create the socket
        this.socket = io(this.props.uri, { path: this.props.path, transports: ['websocket'] })

        // setup socketio event listeners
        this.socket.on('connect', () => { this.onConnect() })
        this.socket.on('authenticated', () => { this.onAuthenticated() })
        this.socket.on('connect_error', () => { this.onConnectError() })
        this.socket.on('connect_timeout', () => { this.onConnectTimeout() })
        this.socket.on('error', (error) => { this.onError(error) })
        this.socket.on('reconnect', () => { this.onReconnect() })
        this.socket.on('reconnect_attempt', (attempt) => { this.onReconnectAttempt(attempt) })
        this.socket.on('reconnecting', (attempt) => { this.onReconnecting(attempt) })
        this.socket.on('reconnect_error', () => { this.onReconnectError() })
        this.socket.on('reconnect_failed', () => { this.onReconnectFailed() })
        this.socket.on('disconnect', () => { this.onDisconnect() })
        this.socket.on('unauthorized', () => { this.onUnauthorized() })

        // setup chatroom event listeners
        this.socket.on('ROOM_DATA', (data) => { this.onRoomData(data) })
        this.socket.on('USER_JOINED', (data) => { this.onUserJoined(data) })
        this.socket.on('USER_LEFT', (data) => { this.onUserLeft(data) })
        this.socket.on('MESSAGE', (message) => { this.onMessage(message) })
    }

    onConnect() {
        // update the status
        this.setStatus('orange', 'authenticating...', () => {
            // send authentication token to the server
            this.socket.emit('authenticate', { token: this.props.token })
        })
    }

    onAuthenticated() { this.setStatus('orange', 'waiting for room data...') }
    onConnectError() { this.setStatus('red', 'connection error') }
    onConnectTimeout() { this.setStatus('red', 'connection timeout') }
    onError() { this.setStatus('red', 'error') }
    onReconnect() { this.setStatus('green', 'reconnected') }
    onReconnectAttempt(attempt) { this.setStatus('orange', `reconnection attempt ${attempt}...`) }
    onReconnecting(attempt) { this.setStatus('orange', `reconnection attempt ${attempt}...`) }
    onReconnectError() { this.setStatus('red', 'reconnection error') }
    onReconnectFailed() { this.setStatus('red', 'reconnection error') }
    onDisconnect() { this.setStatus('red', 'disconnected') }

    onRoomData(data) {
        // set the usernames in the state
        this.setState((prevState) => ({
            ...prevState,
            username: data.username,
            usernames: data.room.usernames,
            messages: prevState.messages.concat({ notification: true, text: `Welcome ${data.username}` })
        }), this.setStatus('green', 'online'))
    }

    setStatus(icon, text, callback) {
        // update the status
        this.setState((prevState) => ({
            ...prevState,
            inputDisabled: icon !== 'green',
            status: { icon, text }
        }), callback)
    }

    onUnauthorized(error) {

        // if we have an error object with a message
        if (typeof error === 'object' && typeof error.message === 'string') {
            
            this.setState((prevState) => ({
                ...prevState,
                messages: prevState.messages.concat({ error: true, text: `Unauthorized: ${error.message}` })
            }))
        }

        this.setStatus('red', 'unauthorized')
    }

    onUserJoined({username}) {
        // add the username and create a notification message
        this.setState((prevState) => ({
            ...prevState,
            usernames: prevState.usernames.concat(username).filter((username, index, array) => array.indexOf(username) === index),
            messages: prevState.messages.concat({ notification: true, text: `${username} has joined` })
        }))
    }

    onUserLeft({ username }) {
        // remove the username and create a notification message
        this.setState((prevState) => ({
            ...prevState,
            usernames: prevState.usernames.filter((u, index, array) => u !== username && array.indexOf(u) === index),
            messages: prevState.messages.concat({notification: true, text: `${username} has left` })
        }))
    }

    onMessage(message) {
        // add the message to the array
        this.setState((prevState) => ({
            ...prevState,
            messages: prevState.messages.concat(message)
        }))
    }

    onTextChange(e) {
        // store the input value in the state
        const text = e.target.value
        this.setState((prevState) => ({
            ...prevState,
            text
        }))
    }

    sendMessage() {
        // disable the input
        this.setState((prevState) => ({
            ...prevState,
            inputDisabled: true
        }))

        // send the message and await the callback
        this.socket.emit('MESSAGE', { userId: this.state.userId, text: this.state.text }, (data = {}) => {
            if (data.error) {
                this.setStatus('red', 'message error')
                return
            }

            // clear the input and enable it
            this.setState((prevState) => ({
                ...prevState,
                text: '',
                inputDisabled: false
            }))

            // focus the message input
            this.messageInput.current.focus()
        })
    }

    render() {
        return (
            <div className="chatroom__container">
                <div className="chatroom__sidebar">
                    <p className="chatroom__title">{this.state.title}</p>
                    <p className="chatroom__subtitle">Members: {this.state.usernames.length}</p>
                    <div className="chatroom__members">
                        {this.state.usernames.map((username, index) => (
                            <div key={index} className="chatroom__member">{username}</div>
                        ))}
                    </div>
                </div>
                <div className="chatroom__main">
                    <div className="chatoom__status-container">
                        <div className={`chatoom__status-icon chatoom__status-icon--${this.state.status.icon}`} />
                        <span className="chatoom__status">{this.state.status.text}</span>
                    </div>
                    <Chat className="chatroom__chat" messages={this.state.messages} username={this.state.username}/>
                    <div className="chatroom__input">
                        <input onKeyPress={(e) => { if (e.key === "Enter") this.sendMessage() }}
                            type="text"
                            placeholder="Type a message"
                            disabled={this.state.inputDisabled}
                            onChange={(e) => { this.onTextChange(e) }}
                            value={this.state.text}
                            maxLength={500}
                            autoFocus={true}
                            ref={this.messageInput} />
                        <button onClick={() => { this.sendMessage() }} disabled={this.state.inputDisabled}>Send</button>
                    </div>
                </div>
            </div>
        )
    }
}

Chatroom.propTypes = {
    token: PropTypes.string.isRequired,
    uri: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    title: PropTypes.string
}

export default Chatroom