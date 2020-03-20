import React from 'react'
import ReactDOM from 'react-dom'
import Chatroom from '@kevinorriss/chatroom'

function getUrlVars() {
    var vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

var username = getUrlVars()["username"]
if (!username) {
    username = "Developer"
}

ReactDOM.render(<Chatroom username={username} />, document.getElementById('root'))
