const express = require('express')
const ChatroomServer = require('../src/ChatroomServer')
const http = require('http')

// create the express server
const app = express()
app.use(express.json())

// start the server
const port = process.env.PORT || 5000
const httpServer = http.createServer(app)
httpServer.listen(port, () => { console.log(`Server started on port ${port}`) })

// create the chatroom server
new ChatroomServer(httpServer, '/socketio/chatroom', 'thisismychatroomsecret')