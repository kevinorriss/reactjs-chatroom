# Chatroom

A ReactJS chatroom using SocketIO

## Prerequisites

* [@kevinorriss/chatroom-component 1.0.1] - A SocketIO ReactJS chatroom component
* [@kevinorriss/chatroom-server 1.0.3] - A SocketIO server to accompany the chatroom component

## Installing

```
npm install @kevinorriss/chatroom-component
npm install @kevinorriss/chatroom-server
```

## Usage

### Server
```
import ChatroomServer from '@kevinorriss/chatroom-server'

const app = express()
const httpServer = http.createServer(app)
httpServer.listen(5000)

new ChatroomServer(httpServer, '/socketio/chatroom', 'thisismychatroomsecret')
```
### Component
```
import Chatroom from '@kevinorriss/chatroom-component'

...

var token = jwt.sign({ username: 'username' }, 'thisismychatroomsecret')

...

<Chatroom token={token} uri="http://localhost:5000" path="/socketio/chatroom"/>

```

## Author

* **Kevin Orriss** - [orriss.io](http://orriss.io)

## License

This project is licensed under the ISC License