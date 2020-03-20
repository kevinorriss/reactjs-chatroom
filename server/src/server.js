const Socket = require('@kevinorriss/chatroom-socket')
const http = require('http')
const app = require('./app')

// create the port number for the server to listen on
const port = process.env.PORT || 5000

const server = http.createServer(app)

new Socket(server)

// start the server
server.listen(port, () => {
    console.log(`Server started on port ${port}`)
})