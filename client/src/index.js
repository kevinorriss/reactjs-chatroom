import React from 'react'
import ReactDOM from 'react-dom'
import jwt from 'jsonwebtoken'
import Chatroom from '@kevinorriss/chatroom-component'

/**
 * Returns a key/value array of URL params
 */
function getUrlVars() {
    var vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

var username = getUrlVars()["username"] || 'Developer'
var token = jwt.sign({ username }, 'thisismychatroomsecret')

ReactDOM.render(
    <Chatroom
        token={token}
        uri="http://localhost:5000"
        path="/socketio/chatroom"/>,
    document.getElementById('root')
)
