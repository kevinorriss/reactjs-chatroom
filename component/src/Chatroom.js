import React from 'react'
import io from 'socket.io-client'
import { EventType, ErrorType } from '@kevinorriss/chatroom-types'
import Chat from './Chat'
import './styles.css'

class Chatroom extends React.Component {
    constructor(props) {
        super(props)

        // bind the functions
        this.setStatus = this.setStatus.bind(this)
        this.onConnect = this.onConnect.bind(this)
        this.onJoinAcknowledgement = this.onJoinAcknowledgement.bind(this)
        this.onUserJoined = this.onUserJoined.bind(this)
        this.onMessage = this.onMessage.bind(this)
        this.onUserLeft = this.onUserLeft.bind(this)
        this.onTextChange = this.onTextChange.bind(this)
        this.sendMessage = this.sendMessage.bind(this)

        // get a reference to the text input
        this.messageInput = React.createRef()

        // initialise the state
        this.state = {
            usernames: [],
            messages: [],
            text: '',
            inputDisabled: true,
            userId: undefined,
            error: undefined,
            status: {
                icon: 'orange',
                text: 'connecting...'
            }
        }
    }

    componentDidMount() {

        // create the socket
        // TODO pass this in via params
        // TODO error handle the connect
        // TODO handle disconnect
        this.socket = io('http://localhost:5000', { path: '/socketio/chatroom' })

        // setup the event listeners
        this.socket.on('connect', this.onConnect)
        this.socket.on('connect_error', () => { this.setStatus('red', 'connection error') })
        this.socket.on('connect_timeout', () => { this.setStatus('red', 'connection timeout') })
        this.socket.on('error', () => { this.setStatus('red', 'error') })
        this.socket.on('disconnect', () => { this.setStatus('red', 'disconnected') })
        this.socket.on('reconnect', () => { this.setStatus('green', 'reconnected') })
        this.socket.on('reconnect_attempt', (attempt) => { this.setStatus('orange', `reconnection attempt ${attempt}...`) })
        this.socket.on('reconnecting', (attempt) => { this.setStatus('orange', `reconnection attempt ${attempt}...`) })
        this.socket.on('reconnect_error', () => { this.setStatus('red', 'reconnection error') })
        this.socket.on('reconnect_failed', () => { this.setStatus('red', 'reconnection error') })

        this.socket.on(EventType.USER_JOINED, this.onUserJoined)
        this.socket.on(EventType.USER_LEFT, this.onUserLeft)
        this.socket.on(EventType.MESSAGE, this.onMessage)
        this.socket.on('disconnect', () => {
            this.setState((prevState) => ({
                ...prevState,
                userId: undefined
            }))
        })
    }

    onConnect() {
        // update the status
        this.setStatus('orange', 'joining...', () => {
            // emit a join event, sending the users username
            this.socket.emit(
                EventType.JOIN,
                { username: this.props.username },
                this.onJoinAcknowledgement
            )
        })
    }

    setStatus(icon, text, callback) {
        // update the status
        this.setState((prevState) => ({
            ...prevState,
            inputDisabled: icon !== 'green',
            status: { icon, text }
        }), callback)
    }

    onJoinAcknowledgement(data) {
        // check for an error in joining
        if (data.error) {
            this.setStatus('red', 'join error')
            return
        }

        // set the usernames in the state
        this.setState((prevState) => ({
            ...prevState,
            usernames: data.room.usernames,
            messages: prevState.messages.concat({ notification: true, text: `Welcome ${data.user.username}` }),
            userId: data.user.id,
            inputDisabled: false,
            status: {
                icon: 'green',
                text: 'online'
            }
        }))
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
        this.socket.emit(EventType.MESSAGE, { userId: this.state.userId, text: this.state.text }, (data = {}) => {
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
                    <p className="chatroom__title">ORRISS.IO CHAT ROOM</p>
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
                    <Chat className="chatroom__chat" messages={this.state.messages} username={this.props.username}/>
                    <div className="chatroom__input">
                        <input onKeyPress={(e) => { if (e.key === "Enter") this.sendMessage() }}
                            type="text"
                            placeholder="Type a message"
                            disabled={this.state.inputDisabled}
                            onChange={this.onTextChange}
                            value={this.state.text}
                            maxLength={500}
                            autoFocus={true}
                            ref={this.messageInput} />
                        <button onClick={this.sendMessage} disabled={this.state.inputDisabled}>Send</button>
                    </div>
                </div>
            </div>
        )
    }
}

export default Chatroom