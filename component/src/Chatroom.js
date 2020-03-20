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
            usernames: [],
            messages: []
        }
    }

    componentDidMount() {
        // setup the event listeners
        this.socket.on('roomData', this.onRoomData)
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
        console.log(`${username} has joined`)
    }

    onUserLeft({ username }) {
        console.log(`${username} has left`)
    }

    onMessage(message) {
        console.log('onMessage')
        // this.setState((prevState) => ({
        //     ...prevState,
        //     messages: prevState.messages.concat(message)
        // }))
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
                                    <div key={index} className="chatroom__notification">{m.message}</div>
                                )
                            }
                            else {
                                return (
                                    <p key={index}>{m.message}</p>
                                )
                            }
                        })}
                    </div>
                    <div className="chatroom__input">
                        <input type="text" placeholder="Type a message" />
                        <button>Send</button>
                    </div>
                </div>
            </div>
        )
    }
}

export default Chatroom