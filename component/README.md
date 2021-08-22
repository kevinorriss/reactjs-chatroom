# Chatroom Component

A ReactJS chatroom component using SocketIO

## Prerequisites

* [@kevinorriss/chatroom-server 1.0.4] - A SocketIO server to accompany the chatroom component

## Installing

```
npm install @kevinorriss/chatroom-component
```

## Usage

Import the component

```
import Chatroom from '@kevinorriss/chatroom-component'

...

var token = jwt.sign({ username: 'username' }, 'thisismychatroomsecret')

...

<Chatroom token={token} uri="http://localhost:5000" path="/socketio/chatroom"/>

```

## Tests
```
npm run test
```

This project uses Jest and Enzyme for its unit tests, simply run the above code to run the test suites.

## Author

* **Kevin Orriss** - [orriss.io](http://orriss.io)

## License

This project is licensed under the ISC License