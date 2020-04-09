import React from 'react'

class Message extends React.Component {
    render() {
        const { username, text, isNotification, isMe } = this.props
        if (isNotification) {
            return (
                <p className="chatroom__notification">{text}</p>
            )
        } else {
            return (
                <div className={"chatroom__message" + (isMe ? " chatroom__message--me" : "")}>
                    <h5>{username}</h5>
                    <p>{text}</p>
                </div>
            )
        }
    }
}

export default Message