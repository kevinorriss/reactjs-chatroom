import React from 'react'
import autoscroll from 'autoscroll-react'
import Message from './Message'

class Chat extends React.Component {
    render() {
        const { messages, username, ...props } = this.props
        return (
            <div {...props}>
                {messages.map((m, index) => 
                    <Message key={index}
                        isNotification={m.notification}
                        isMe={m.username===username}
                        username={m.username}
                        text={m.text} />
                )}
            </div>
        )
    }
}

export default autoscroll(Chat)
