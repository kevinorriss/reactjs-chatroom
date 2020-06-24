import React from 'react'
import PropTypes from 'prop-types'

class Message extends React.Component {
    render() {
        const { username, text, isNotification, isError, isMe } = this.props
        if (isError) {
            return (
                <p className="chatroom__notification chatroom__notification--error">{text}</p>
            )
        } else if (isNotification) {
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

Message.propTypes = {
    username: PropTypes.string,
    text: PropTypes.string.isRequired,
    isNotification: PropTypes.bool,
    isError: PropTypes.bool,
    isMe: PropTypes.bool
}

export default Message