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

// create a mock user store
const users = [
    {
        id: 1,
        username: 'Developer'
    }, {
        id: 2,
        username: 'Kevin'
    }
]

// create a promise that verifies the token
const verifyToken = (token) => {
    return new Promise(function (resolve, reject) {
        try {
            const user = users.find((u) => u.id === token.userId)
            resolve(user.username)
        } catch (err) {
            reject('Internal server error')
        }
    })
}

// attach the socket to the server
new Socket('/socketio/chatroom', 'thisismychatroomsecret', verifyToken).io.attach(server)