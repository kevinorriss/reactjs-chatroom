# Chatroom

A React and Express chatroom using SocketIO

![Screenshot](screenshot.jpg)

## Installing

### Client
```
npm install @kevinorriss/chatroom-component@2.0.0 react@17.0.2 react-dom@17.0.2
```

### Server
```
npm install @kevinorriss/chatroom-server@2.0.0 express@4.17.1
```

## Usage

### Client
```javascript
// import the component and CSS styles
import Chatroom from '@kevinorriss/chatroom-component'
import '@kevinorriss/chatroom-component/dist/styles.css'

...

// This token should be generated on the server and passed to the user
var token = jwt.sign({ username: 'username' }, 'thisismychatroomsecret')
```

```html
<Chatroom token={token} uri="http://localhost:5000" path="/socketio/chatroom"/>
```

### Server
```javascript
// import the server
import ChatroomServer from '@kevinorriss/chatroom-server'

// setup the express server as normla
const app = express()
const httpServer = http.createServer(app)
httpServer.listen(5000)

// create the chatroom server, passing in your express server
new ChatroomServer(httpServer, '/socketio/chatroom', 'thisismychatroomsecret')
```

## Development
Within the root folder, in a terminal, run:
```
npm start
```
This will concurrently run the server, component and example React app in watch mode.

**Configurable Username**

The react app accepts a URL param to control the username, this allows you to open the chat in multiple tabs and fake being different users. Simply use the following URL:

```
http://localhost:3000/chat?username=Kevin
```

## Tests

### Server
```
cd server
npm test
```

### Component
```
cd component
npm test
```

## Author

* **Kevin Orriss** - [orriss.io](http://orriss.io)