const app = require('./app')

// create the port number for the server to listen on
const port = process.env.PORT || 5000

// start the server
app.listen(port, () => console.log(`Server started on port ${port}`))