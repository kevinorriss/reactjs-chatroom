const express = require('express')

// create the express server
const app = express()
app.use(express.json())

module.exports = app