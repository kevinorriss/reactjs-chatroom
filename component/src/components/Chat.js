import React, { createRef } from 'react'
import Message from './Message'

class Chat extends React.Component {

    constructor(props) {
        super(props)
        this.chatRef = createRef()

        this.autoscroll = true

        this.handleScroll = this.handleScroll.bind(this)
    }

    componentDidUpdate(prevProps) {
        if (prevProps.messages !== this.props.messages && this.autoscroll) {
            this.chatRef.current.scrollTop = this.chatRef.current.scrollHeight - this.chatRef.current.clientHeight
        }
    }

    handleScroll() {
        this.autoscroll = Math.abs(this.chatRef.current.scrollHeight - this.chatRef.current.scrollTop - this.chatRef.current.clientHeight) <= 1
    }

    render() {
        const { messages, username, ...props } = this.props
        return (
            <div {...props} ref={this.chatRef} onScroll={this.handleScroll}>
                {messages.map((m, index) => 
                    <Message key={index}
                        isNotification={m.notification || false}
                        isError={m.error || false}
                        isMe={m.username===username}
                        username={m.username}
                        text={m.text} />
                )}
            </div>
        )
    }
}

export default Chat