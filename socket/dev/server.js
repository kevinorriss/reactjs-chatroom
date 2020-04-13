const express = require('express')
const Socket = require('../src/Socket')
const http = require('http')

// create the express server
const app = express()
app.use(express.json())

// start the server
const port = process.env.PORT || 5000
const server = http.createServer(app)
server.listen(port, () => { console.log(`Server started on port ${port}`) })

// attach the socket to the server
new Socket('/socketio/chatroom', 'thisismychatroomsecret').io.attach(server)