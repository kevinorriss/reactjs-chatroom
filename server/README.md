# Chatroom Server

A socketio server for the ReactJS chatroom

## Installing

```
npm install @kevinorriss/chatroom-server
```

## Usage

```
import ChatroomServer from '@kevinorriss/chatroom-server'

const app = express()
const httpServer = http.createServer(app)
httpServer.listen(5000)

new ChatroomServer(httpServer, '/socketio/chatroom', 'thisismychatroomsecret')
```

## Tests
```
npm run test
```

This project uses Jest for its unit tests, simply run the above code to run the test suites.

## Author

* **Kevin Orriss** - [orriss.io](http://orriss.io)

## License

This project is licensed under the ISC License