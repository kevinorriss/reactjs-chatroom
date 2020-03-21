import React from 'react'
import io from 'socket.io-client';
import './styles.css'

class Chatroom extends React.Component {
    constructor(props) {
        super(props)

        // bind this to the functions
        this.onRoomData = this.onRoomData.bind(this)
        this.onMessage = this.onMessage.bind(this)
        this.onUserJoined = this.onUserJoined.bind(this)
        this.onUserLeft = this.onUserLeft.bind(this)

        // create the socket
        this.socket = io()

        // initialise the state
        this.state = {
            usernames: ['Kevin'],
            messages: [
                {notification:true, text:'this is a notification'},
                { username: 'Kevin', text: 'This is Kevins message' },
                { username: 'Developer', text: 'This is the developer message' },
                { username: 'Kevin', text: 'This is Kevins message' },
                { notification: true, text: 'this is a notification' },
            ]
        }
    }

    componentDidMount() {
        // setup the event listeners
        this.socket.on('roomData', this.onRoomData)
        this.socket.on('userJoined', this.onUserJoined)
        this.socket.on('userLeft', this.onUserLeft)
        this.socket.on('message', this.onMessage)

        // emit a join event, sending the users username
        this.socket.emit('join', { username: this.props.username })
    }

    onRoomData({ usernames }) {
        console.log('onRoomData')
        // set the usernames in the state
        this.setState((prevState) => ({
            ...prevState,
            usernames
        }))
    }

    onUserJoined({username}) {
        console.log(`${username} joined`)
        this.setState((prevState) => ({
            ...prevState,
            usernames: prevState.usernames.concat(username).filter((username, index, array) => array.indexOf(username) === index),
            messages: prevState.messages.concat({ notification: true, text: `${username} has joined` })
        }))
    }

    onUserLeft({ username }) {
        this.setState((prevState) => ({
            ...prevState,
            usernames: prevState.usernames.filter((u, index, array) => u !== username && array.indexOf(u) === index),
            messages: prevState.messages.concat({notification: true, text: `${username} has left` })
        }))
    }

    onMessage(message) {
        console.log('onMessage')
        // this.setState((prevState) => ({
        //     ...prevState,
        //     messages: prevState.messages.concat(message)
        // }))
    }

    sendMessage() {
        console.log('TODO: send message')
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
                    <div className="chatroom__chat">
                        {this.state.messages.map((m, index) => {
                            if (m.notification) {
                                return (
                                    <p key={index} className="chatroom__notification">{m.text}</p>
                                )
                            }
                            else {
                                let className = "chatroom__message"
                                if (m.username === this.props.username) {
                                    className = className.concat(" chatroom__message--me")
                                }

                                return (
                                    <div key={index} className={className}>
                                        <h5>{m.username}</h5>
                                        <p>{m.text}</p>
                                    </div>
                                )
                            }
                        })}
                    </div>
                    <div className="chatroom__input">
                        <input onKeyPress={(e) => { if (e.key === "Enter") this.sendMessage() }}
                            type="text"
                            placeholder="Type a message"
                            autoFocus={true} />
                        <button onClick={this.sendMessage}>Send</button>
                    </div>
                </div>
            </div>
        )
    }
}

export default Chatroom