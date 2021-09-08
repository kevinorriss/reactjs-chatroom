import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom'
import jwt from 'jsonwebtoken'
import Chatroom from '@kevinorriss/chatroom-component'
import '@kevinorriss/chatroom-component/dist/styles.css'

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
    <Router>
        <div div id="header">
            <Link to="/">Home</Link>
            <Link to="/chat">Chat</Link>
        </div>
        <Switch>
            <Route exact path="/">
                <p>Home</p>
            </Route>
            <Route exact path="/chat">
                <Chatroom
                    token={token}
                    uri="http://localhost:5000"
                    path="/socketio/chatroom" />
            </Route>
        </Switch>
    </Router>,
    document.getElementById('root')
)
