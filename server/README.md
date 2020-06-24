# Chatroom Server

A socketio server for the ReactJS chatroom

## Prerequisites

* [@kevinorriss/chatroom-types 1.0.1] - Enum values used by the chatroom client and server

## Installing

```
npm install @kevinorriss/chatroom-types
npm install @kevinorriss/chatroom-server
```

## Usage

Import the component

```
const app = express()
const httpServer = http.createServer(app)
httpServer.listen(5000)

new ChatroomServer(server, '/socketio/chatroom', 'thisismychatroomsecret')
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